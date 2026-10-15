"use client";

import { useState, useTransition } from "react";
import {
  CARD_STYLES,
  customThemeRef,
  type CardStyle,
  type CustomThemeParams,
} from "@/lib/themes";

const DEFAULT_DRAFT: Omit<CustomThemeParams, "id"> = {
  name: "",
  background: "#101014",
  text: "#f4f4f5",
  accent: "#f59e0b",
  card: "#1b1b22",
  cardStyle: "solid",
};

function newId(): string {
  return (
    "t" +
    Date.now().toString(36) +
    Math.floor(Math.random() * 1e4).toString(36)
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950 p-1"
      />
      <span className="w-28 shrink-0 text-sm text-zinc-400">{label}</span>
      <input
        type="text"
        value={value}
        maxLength={7}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-sm text-zinc-200 focus:border-amber-500 focus:outline-none"
      />
    </label>
  );
}

function ThemePreview({ draft }: { draft: Omit<CustomThemeParams, "id"> }) {
  const vars = {
    "--ctp-bg": draft.background,
    "--ctp-text": draft.text,
    "--ctp-accent": draft.accent,
    "--ctp-card": draft.card,
  } as React.CSSProperties;
  const cardCls =
    draft.cardStyle === "glass"
      ? "ctp-card ctp-card-glass"
      : draft.cardStyle === "outline"
        ? "ctp-card ctp-card-outline"
        : "ctp-card";
  return (
    <div
      style={vars}
      className="overflow-hidden rounded-xl border border-zinc-700"
    >
      <div className="ctp-header px-4 py-4 text-center">
        <p className="ctp-kicker text-[10px] font-semibold uppercase tracking-[0.3em]">
          Now pouring
        </p>
        <p className="ctp-title mt-1 text-xl font-extrabold tracking-tight">
          {draft.name.trim() || "Your brewery"}
        </p>
      </div>
      <div className="ctp-page px-4 py-4">
        <div className={`${cardCls} flex items-center gap-3 rounded-2xl p-4`}>
          <div
            className="ctp-tap-badge"
            style={{ height: "2.5rem", width: "2.5rem", fontSize: "1rem" }}
          >
            1
          </div>
          <div className="min-w-0">
            <p
              className="truncate text-base font-bold"
              style={{ color: "var(--ctp-text)" }}
            >
              Garage Door IPA
            </p>
            <p className="ctp-style-text text-[11px] font-medium uppercase tracking-widest">
              West Coast IPA
            </p>
            <p className="ctp-stat-text text-xs">
              <span className="ctp-stat-value">6.8%</span> ABV ·{" "}
              <span className="ctp-stat-value">72</span> IBU
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ThemeMaker({
  initialThemes,
  activeThemeRef,
}: {
  initialThemes: CustomThemeParams[];
  activeThemeRef: string;
}) {
  const [themes, setThemes] = useState<CustomThemeParams[]>(initialThemes);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] =
    useState<Omit<CustomThemeParams, "id">>(DEFAULT_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function startNew() {
    setEditingId("new");
    setDraft(DEFAULT_DRAFT);
    setError(null);
    setSaved(false);
  }

  function startEdit(theme: CustomThemeParams) {
    setEditingId(theme.id);
    setDraft({
      name: theme.name,
      background: theme.background,
      text: theme.text,
      accent: theme.accent,
      card: theme.card,
      cardStyle: theme.cardStyle,
    });
    setError(null);
    setSaved(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  function persist(next: CustomThemeParams[], extra?: Record<string, unknown>) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        const body: Record<string, unknown> = { customThemes: next };
        if (extra) Object.assign(body, extra);
        const res = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            typeof data.error === "string" ? data.error : "Couldn't save."
          );
        }
        setThemes(next);
        setEditingId(null);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function saveDraft() {
    const name = draft.name.trim();
    if (!name) {
      setError("Give the theme a name.");
      return;
    }
    const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
    for (const [label, v] of [
      ["Background", draft.background],
      ["Text", draft.text],
      ["Accent", draft.accent],
      ["Card", draft.card],
    ] as const) {
      if (!hex.test(v)) {
        setError(`${label} must be a hex color like #f59e0b.`);
        return;
      }
    }
    if (editingId === "new") {
      persist([...themes, { ...draft, name, id: newId() }]);
    } else if (editingId) {
      persist(
        themes.map((t) => (t.id === editingId ? { ...draft, name, id: t.id } : t))
      );
    }
  }

  function deleteTheme(id: string) {
    if (!window.confirm("Delete this theme?")) return;
    const next = themes.filter((t) => t.id !== id);
    // If the deleted theme was active, fall back to Midnight.
    const extra =
      activeThemeRef === customThemeRef(id) ? { theme: "midnight" } : undefined;
    persist(next, extra);
  }

  const set = (patch: Partial<Omit<CustomThemeParams, "id">>) =>
    setDraft((d) => ({ ...d, ...patch }));

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
      <h2 className="text-xl font-bold">Custom themes</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Build your own TV display themes. They show up in the theme picker
        above.
      </p>

      {editingId === null && (
        <>
          {themes.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              No custom themes yet — make your first one.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {themes.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3"
                >
                  <span className="flex -space-x-1">
                    {[t.background, t.text, t.accent, t.card].map((c) => (
                      <span
                        key={c}
                        className="h-6 w-6 rounded-full border border-black/40"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold">
                    {t.name}
                    {activeThemeRef === customThemeRef(t.id) && (
                      <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
                        Active
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => startEdit(t)}
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm font-semibold text-zinc-300 hover:border-zinc-500 disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => deleteTheme(t.id)}
                    className="rounded-lg border border-red-500/50 px-3 py-1.5 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            disabled={isPending}
            onClick={startNew}
            className="mt-4 rounded-xl bg-amber-500 px-5 py-3 font-bold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
          >
            New theme
          </button>
        </>
      )}

      {editingId !== null && (
        <div className="mt-4">
          <label
            htmlFor="theme-name"
            className="block text-sm font-semibold text-zinc-300"
          >
            Theme name
          </label>
          <input
            id="theme-name"
            type="text"
            value={draft.name}
            maxLength={40}
            placeholder="e.g. Garage Neon"
            onChange={(e) => set({ name: e.target.value })}
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
          />

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ColorRow
              label="Background"
              value={draft.background}
              onChange={(v) => set({ background: v })}
            />
            <ColorRow
              label="Text"
              value={draft.text}
              onChange={(v) => set({ text: v })}
            />
            <ColorRow
              label="Accent"
              value={draft.accent}
              onChange={(v) => set({ accent: v })}
            />
            <ColorRow
              label="Card"
              value={draft.card}
              onChange={(v) => set({ card: v })}
            />
          </div>

          <label
            htmlFor="theme-card-style"
            className="mt-5 block text-sm font-semibold text-zinc-300"
          >
            Card style
          </label>
          <select
            id="theme-card-style"
            value={draft.cardStyle}
            onChange={(e) =>
              set({ cardStyle: e.target.value as CardStyle })
            }
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 focus:border-amber-500 focus:outline-none"
          >
            {CARD_STYLES.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
                {s === "solid" ? " — filled cards" : ""}
                {s === "glass" ? " — frosted translucent cards" : ""}
                {s === "outline" ? " — dashed outline cards" : ""}
              </option>
            ))}
          </select>

          <p className="mt-5 text-sm font-semibold text-zinc-300">Preview</p>
          <div className="mt-2">
            <ThemePreview draft={draft} />
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={saveDraft}
              className="rounded-xl bg-amber-500 px-5 py-3 font-bold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
            >
              Save theme
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={cancelEdit}
              className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold text-zinc-300 hover:border-zinc-500 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}
      {saved && !error && editingId === null && (
        <p className="mt-4 text-sm text-emerald-300">
          Saved — pick it in the theme picker above to use it.
        </p>
      )}
    </section>
  );
}
