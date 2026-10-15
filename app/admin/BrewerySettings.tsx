"use client";

import { useRef, useState, useTransition } from "react";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

async function putSettings(patch: Record<string, unknown>) {
  const res = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string" ? data.error : "Couldn't save."
    );
  }
  return res.json();
}

export default function BrewerySettings({
  initialName,
  initialLogo,
}: {
  initialName: string;
  initialLogo: string | null;
}) {
  const [name, setName] = useState(initialName);
  const [logo, setLogo] = useState<string | null>(initialLogo);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function saveName() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Brewery name can't be empty.");
      return;
    }
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        const data = await putSettings({ breweryName: trimmed });
        setName(data.breweryName);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) handleLogoFile(file);
  }

  function handleLogoFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Pick an image file (PNG or JPG).");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Image must be under 2MB.");
      return;
    }
    setError(null);
    setSaved(false);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      startTransition(async () => {
        try {
          await putSettings({ breweryLogo: dataUrl });
          setLogo(dataUrl);
          setSaved(true);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Something went wrong."
          );
        }
      });
    };
    reader.onerror = () => setError("Couldn't read that file.");
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await putSettings({ breweryLogo: null });
        setLogo(null);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
      <h2 className="text-xl font-bold">Brewery branding</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Name and logo shown on the tap list TV display.
      </p>

      <label
        htmlFor="brewery-name"
        className="mt-5 block text-sm font-semibold text-zinc-300"
      >
        Brewery name
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="brewery-name"
          type="text"
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveName();
          }}
          className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={saveName}
          className="shrink-0 rounded-xl bg-amber-500 px-5 py-3 font-bold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
        >
          Save
        </button>
      </div>

      <p className="mt-6 text-sm font-semibold text-zinc-300">Logo</p>
      {logo ? (
        <div className="mt-2 flex items-center gap-4">
          <img
            src={logo}
            alt="Brewery logo preview"
            className="h-20 w-auto max-w-[12rem] rounded-lg bg-white/5 object-contain"
          />
          <button
            type="button"
            disabled={isPending}
            onClick={removeLogo}
            className="rounded-xl border border-red-500/50 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      ) : (
        <p className="mt-2 text-sm text-zinc-500">
          No logo yet — the display shows the brewery name as text.
        </p>
      )}
      <div
        className={`mt-3 rounded-xl border border-dashed p-4 transition ${
          dragging
            ? "border-amber-500 bg-amber-500/10"
            : "border-zinc-700"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleLogoFile(file);
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
        <button
          type="button"
          disabled={isPending}
          onClick={() => fileRef.current?.click()}
          className="rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-3 font-semibold text-zinc-200 transition hover:border-zinc-500 disabled:opacity-50"
        >
          Upload logo…
        </button>
        <p className="mt-2 text-xs text-zinc-500">
          PNG or JPG, under 2MB — or drag and drop an image here. Square
          logos look best on the TV.
        </p>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="mt-4 text-sm text-emerald-300">
          Saved — the tap list display will pick it up within 30 seconds.
        </p>
      )}
    </section>
  );
}
