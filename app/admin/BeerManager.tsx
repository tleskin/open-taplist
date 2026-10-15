"use client";

import { useRef, useState, useTransition } from "react";
import {
  BEER_STATUSES,
  GLASS_TYPES,
  type Beer,
  type BeerStatus,
  type GlassType,
} from "@/db/schema";
import { GLASS_LABELS } from "@/components/BeerGlass";
import { srmToHex } from "@/lib/srm";
import {
  createBeer,
  deleteBeer,
  toggleBeerActive,
  updateBeer,
  type BeerInput,
} from "./actions";

const STATUS_LABELS: Record<BeerStatus, string> = {
  on_tap: "On tap",
  fermenting: "Fermenting",
  coming_soon: "Coming soon",
};

type FormState = {
  name: string;
  style: string;
  abv: string;
  ibu: string;
  description: string;
  tapNumber: string;
  status: BeerStatus;
  srm: string;
  glass: GlassType;
  labelImage: string | null;
};

const emptyForm: FormState = {
  name: "",
  style: "",
  abv: "",
  ibu: "",
  description: "",
  tapNumber: "",
  status: "on_tap",
  srm: "",
  glass: "pint",
  labelImage: null,
};

function toForm(beer: Beer): FormState {
  return {
    name: beer.name,
    style: beer.style,
    abv: String(beer.abv),
    ibu: beer.ibu === null ? "" : String(beer.ibu),
    description: beer.description ?? "",
    tapNumber: beer.tapNumber > 0 ? String(beer.tapNumber) : "",
    status: beer.status,
    srm: beer.srm === null ? "" : String(beer.srm),
    glass: beer.glass,
    labelImage: beer.labelImage ?? null,
  };
}

function toInput(form: FormState): BeerInput {
  return {
    name: form.name,
    style: form.style,
    abv: Number(form.abv),
    ibu: form.ibu.trim() === "" ? null : Number(form.ibu),
    description: form.description.trim() === "" ? null : form.description,
    tapNumber: form.tapNumber.trim() === "" ? 0 : Number(form.tapNumber),
    status: form.status,
    srm: form.srm.trim() === "" ? null : Number(form.srm),
    glass: form.glass,
    labelImage: form.labelImage,
  };
}

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-zinc-300";

const LABEL_MAX_BYTES = 10 * 1024 * 1024;
const LABEL_MAX_DIM = 512;

/**
 * Downscale an uploaded label to a max 512px JPEG data URL — plenty for the
 * 96px display slot, and keeps server-action payloads small.
 */
function fileToLabelDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(
        1,
        LABEL_MAX_DIM / Math.max(img.width, img.height)
      );
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Couldn't process that image."));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that file."));
    };
    img.src = url;
  });
}

export default function BeerManager({ initialBeers }: { initialBeers: Beer[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [labelDragging, setLabelDragging] = useState(false);
  const labelFileRef = useRef<HTMLInputElement>(null);

  function startAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  }

  function startEdit(beer: Beer) {
    setEditingId(beer.id);
    setForm(toForm(beer));
    setFormError(null);
    setFormOpen(true);
  }

  function cancel() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(false);
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const input = toInput(form);
    startTransition(async () => {
      try {
        if (editingId === null) {
          await createBeer(input);
        } else {
          await updateBeer(editingId, input);
        }
        cancel();
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  async function onLabelFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) await handleLabelFile(file);
  }

  async function handleLabelFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setFormError("Pick an image file (PNG or JPG).");
      return;
    }
    if (file.size > LABEL_MAX_BYTES) {
      setFormError("Image must be under 10MB.");
      return;
    }
    try {
      const dataUrl = await fileToLabelDataUrl(file);
      setFormError(null);
      set("labelImage", dataUrl);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Couldn't read that file."
      );
    }
  }

  async function onDelete(id: number, name: string) {
    if (!window.confirm(`Remove "${name}" from the tap list?`)) return;
    startTransition(async () => {
      await deleteBeer(id);
    });
  }

  async function onToggle(id: number, next: boolean) {
    startTransition(async () => {
      await toggleBeerActive(id, next);
    });
  }

  const showForm = formOpen;
  const srmPreview = srmToHex(form.srm.trim() === "" ? null : Number(form.srm));

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {editingId === null ? "Add a beer" : "Edit beer"}
          </h2>
          {!showForm && (
            <button
              type="button"
              onClick={startAdd}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-zinc-950 hover:bg-amber-400"
            >
              + New beer
            </button>
          )}
        </div>

        {showForm ? (
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="name">Name</label>
              <input
                id="name"
                className={inputClass}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Garage Door IPA"
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="style">Style</label>
              <input
                id="style"
                className={inputClass}
                value={form.style}
                onChange={(e) => set("style", e.target.value)}
                placeholder="West Coast IPA"
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="status">Status</label>
              <select
                id="status"
                className={inputClass}
                value={form.status}
                onChange={(e) => set("status", e.target.value as BeerStatus)}
              >
                {BEER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            {form.status === "on_tap" && (
              <div>
                <label className={labelClass} htmlFor="tapNumber">Tap number</label>
                <input
                  id="tapNumber"
                  type="number"
                  step="1"
                  min="1"
                  className={inputClass}
                  value={form.tapNumber}
                  onChange={(e) => set("tapNumber", e.target.value)}
                  placeholder="1"
                  required
                />
              </div>
            )}
            <div>
              <label className={labelClass} htmlFor="abv">ABV %</label>
              <input
                id="abv"
                type="number"
                step="0.1"
                min="0"
                max="100"
                className={inputClass}
                value={form.abv}
                onChange={(e) => set("abv", e.target.value)}
                placeholder="6.8"
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="ibu">IBU (optional)</label>
              <input
                id="ibu"
                type="number"
                step="1"
                min="0"
                className={inputClass}
                value={form.ibu}
                onChange={(e) => set("ibu", e.target.value)}
                placeholder="72"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="srm">
                SRM color (1–40, optional)
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="srm"
                  type="number"
                  step="1"
                  min="1"
                  max="40"
                  className={inputClass}
                  value={form.srm}
                  onChange={(e) => set("srm", e.target.value)}
                  placeholder="6"
                />
                <span
                  title="Live SRM color preview"
                  className="h-9 w-9 shrink-0 rounded-lg border border-white/20"
                  style={{ backgroundColor: srmPreview }}
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="glass">Glass</label>
              <select
                id="glass"
                className={inputClass}
                value={form.glass}
                onChange={(e) => set("glass", e.target.value as GlassType)}
              >
                {GLASS_TYPES.map((g) => (
                  <option key={g} value={g}>
                    {GLASS_LABELS[g]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className={labelClass}>Label image (optional)</span>
              <div
                className={`mt-1 flex items-center gap-3 rounded-xl border border-dashed p-3 transition ${
                  labelDragging
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-transparent"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setLabelDragging(true);
                }}
                onDragLeave={() => setLabelDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setLabelDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) void handleLabelFile(file);
                }}
              >
                {form.labelImage ? (
                  <img
                    src={form.labelImage}
                    alt="Beer label preview"
                    className="h-20 w-20 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-zinc-700 text-xs text-zinc-500">
                    No label
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => labelFileRef.current?.click()}
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm font-semibold text-zinc-300 hover:border-zinc-500"
                  >
                    {form.labelImage ? "Replace" : "Upload"}
                  </button>
                  {form.labelImage && (
                    <button
                      type="button"
                      onClick={() => set("labelImage", null)}
                      className="rounded-lg border border-red-500/50 px-3 py-1.5 text-sm font-semibold text-red-300 hover:bg-red-500/10"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  ref={labelFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onLabelFileChange}
                />
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Shown instead of the glass on the tap list. Drag and drop
                or use Upload — resized to max 512px.
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="description">
                Description (optional)
              </label>
              <textarea
                id="description"
                rows={3}
                className={inputClass}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Tasting notes for the TV display…"
              />
            </div>

            {formError && (
              <p className="sm:col-span-2 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                {formError}
              </p>
            )}

            <div className="flex gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
              >
                {isPending
                  ? "Saving…"
                  : editingId === null
                    ? "Add beer"
                    : "Save changes"}
              </button>
              <button
                type="button"
                onClick={cancel}
                className="rounded-lg border border-zinc-700 px-5 py-2 text-sm font-semibold text-zinc-300 hover:border-zinc-500"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-zinc-500">
            Click “New beer” to put something on tap, or Edit on any row to
            change it.
          </p>
        )}
      </section>

      <section className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/70">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs uppercase tracking-widest text-zinc-500">
              <th className="px-4 py-3">Tap</th>
              <th className="px-4 py-3">Beer</th>
              <th className="px-4 py-3">Style</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">SRM</th>
              <th className="px-4 py-3">ABV</th>
              <th className="px-4 py-3">IBU</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialBeers.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-zinc-500">
                  No beers yet — add your first one below.
                </td>
              </tr>
            )}
            {initialBeers.map((beer) => (
              <tr
                key={beer.id}
                className={`border-b border-zinc-800/60 last:border-0 ${
                  beer.isActive ? "" : "opacity-50"
                }`}
              >
                <td className="px-4 py-3 font-bold text-amber-400">
                  {beer.status === "on_tap" ? beer.tapNumber : "—"}
                </td>
                <td className="px-4 py-3 font-semibold">
                  <span className="flex items-center gap-2">
                    {beer.labelImage && (
                      <img
                        src={beer.labelImage}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-lg object-cover"
                      />
                    )}
                    {beer.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400">{beer.style}</td>
                <td className="px-4 py-3">
                  <span
                    className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                      beer.status === "on_tap"
                        ? "bg-amber-500/15 text-amber-300"
                        : beer.status === "fermenting"
                          ? "bg-sky-500/15 text-sky-300"
                          : "bg-violet-500/15 text-violet-300"
                    }`}
                  >
                    {STATUS_LABELS[beer.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2 text-zinc-400">
                    <span
                      className="inline-block h-4 w-4 rounded-full border border-white/20"
                      style={{ backgroundColor: srmToHex(beer.srm) }}
                      title={beer.srm === null ? "SRM not set" : `${beer.srm} SRM`}
                    />
                    {beer.srm ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {beer.abv.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {beer.ibu ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => onToggle(beer.id, !beer.isActive)}
                    title={beer.isActive ? "Hide this beer" : "Show this beer"}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      beer.isActive
                        ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/30"
                        : "bg-zinc-700/40 text-zinc-400 hover:bg-zinc-700/70 hover:text-zinc-200"
                    }`}
                  >
                    {beer.isActive ? "Visible" : "Hidden"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => startEdit(beer)}
                    className="mr-2 rounded-lg border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-200 hover:border-amber-500"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => onDelete(beer.id, beer.name)}
                    className="rounded-lg border border-zinc-700 px-3 py-1 text-xs font-semibold text-red-300 hover:border-red-500"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
