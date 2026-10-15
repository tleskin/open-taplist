"use client";

import { useState, useTransition } from "react";
import {
  THEMES,
  customThemeRef,
  type CustomThemeParams,
  type ThemeId,
} from "@/lib/themes";
import ThemePreviewPane from "./ThemePreviewPane";

const THEME_IDS = Object.keys(THEMES) as ThemeId[];

type PickableTheme = {
  ref: string;
  name: string;
  description: string;
  custom?: CustomThemeParams;
};

export default function ThemePicker({
  initialThemeRef,
  customThemes,
  breweryName,
}: {
  initialThemeRef: string;
  customThemes: CustomThemeParams[];
  breweryName: string;
}) {
  const [themeRef, setThemeRef] = useState(initialThemeRef);
  const [previewRef, setPreviewRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const pickable: PickableTheme[] = [
    ...THEME_IDS.map((id) => ({
      ref: id,
      name: THEMES[id].name,
      description: THEMES[id].description,
    })),
    ...customThemes.map((c) => ({
      ref: customThemeRef(c.id),
      name: c.name,
      description: "Custom theme",
      custom: c,
    })),
  ];

  function pick(next: string) {
    if (next === themeRef) return;
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        const res = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: next }),
        });
        if (!res.ok) throw new Error("Couldn't save the theme.");
        setThemeRef(next);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
      <h2 className="text-xl font-bold">Display theme</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Pick the look of the tap list TV display. Hover a theme to preview it
        here — click to make it live.
      </p>

      <div className="mt-4">
        <ThemePreviewPane
          themeRef={previewRef ?? themeRef}
          customThemes={customThemes}
          breweryName={breweryName}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {pickable.map((item) => {
          const active = themeRef === item.ref;
          return (
            <button
              key={item.ref}
              type="button"
              disabled={isPending}
              onClick={() => pick(item.ref)}
              onMouseEnter={() => setPreviewRef(item.ref)}
              onMouseLeave={() => setPreviewRef(null)}
              onFocus={() => setPreviewRef(item.ref)}
              onBlur={() => setPreviewRef(null)}
              className={`rounded-2xl border p-5 text-left transition ${
                active
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
              } disabled:opacity-50`}
            >
              <span className="flex items-center justify-between">
                <span className="text-lg font-bold">{item.name}</span>
                {active && (
                  <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">
                    Active
                  </span>
                )}
              </span>
              <span className="mt-2 block text-sm text-zinc-400">
                {item.description}
              </span>
              {item.custom ? (
                <span className="mt-3 flex items-center gap-2">
                  {[item.custom.background, item.custom.text, item.custom.accent, item.custom.card].map(
                    (c) => (
                      <span
                        key={c}
                        className="h-8 w-8 rounded-lg border border-white/20"
                        style={{ backgroundColor: c }}
                      />
                    )
                  )}
                  <span className="ml-1 text-xs text-zinc-500 capitalize">
                    {item.custom.cardStyle} cards
                  </span>
                </span>
              ) : (
                item.ref === "liquid-glass" && (
                  <span className="mt-3 block h-16 overflow-hidden rounded-xl border border-white/20 bg-[#0a0a14]">
                    <span className="relative block h-full w-full">
                      <span className="absolute -top-4 left-4 h-12 w-12 rounded-full bg-amber-400/40 blur-md" />
                      <span className="absolute top-2 right-6 h-10 w-10 rounded-full bg-indigo-400/40 blur-md" />
                      <span className="absolute inset-x-4 top-4 h-8 rounded-lg border border-white/25 bg-white/15 backdrop-blur-sm" />
                    </span>
                  </span>
                )
              )}
              {!item.custom && item.ref === "midnight" && (
                <span className="mt-3 block h-16 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950">
                  <span className="mx-4 mt-4 block h-8 rounded-lg border border-zinc-700 bg-zinc-800" />
                </span>
              )}
              {!item.custom && item.ref === "daylight" && (
                <span className="mt-3 block h-16 overflow-hidden rounded-xl border border-amber-900/20 bg-[#faf6ee]">
                  <span className="mx-4 mt-4 block h-8 rounded-lg border border-amber-900/15 bg-white shadow-sm" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="mt-4 text-sm text-emerald-300">
          Theme saved — the tap list display will pick it up within 30 seconds.
        </p>
      )}
    </section>
  );
}
