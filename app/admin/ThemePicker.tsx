"use client";

import { useState, useTransition } from "react";
import { THEMES, type ThemeId } from "@/lib/themes";

const THEME_IDS = Object.keys(THEMES) as ThemeId[];

export default function ThemePicker({ initialTheme }: { initialTheme: ThemeId }) {
  const [theme, setTheme] = useState<ThemeId>(initialTheme);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function pick(next: ThemeId) {
    if (next === theme) return;
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
        setTheme(next);
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
        Pick the look of the tap list TV display.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {THEME_IDS.map((id) => {
          const info = THEMES[id];
          const active = theme === id;
          return (
            <button
              key={id}
              type="button"
              disabled={isPending}
              onClick={() => pick(id)}
              className={`rounded-2xl border p-5 text-left transition ${
                active
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
              } disabled:opacity-50`}
            >
              <span className="flex items-center justify-between">
                <span className="text-lg font-bold">{info.name}</span>
                {active && (
                  <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">
                    Active
                  </span>
                )}
              </span>
              <span className="mt-2 block text-sm text-zinc-400">
                {info.description}
              </span>
              {id === "liquid-glass" && (
                <span className="mt-3 block h-16 overflow-hidden rounded-xl border border-white/20 bg-[#0a0a14]">
                  <span className="relative block h-full w-full">
                    <span className="absolute -top-4 left-4 h-12 w-12 rounded-full bg-amber-400/40 blur-md" />
                    <span className="absolute top-2 right-6 h-10 w-10 rounded-full bg-indigo-400/40 blur-md" />
                    <span className="absolute inset-x-4 top-4 h-8 rounded-lg border border-white/25 bg-white/15 backdrop-blur-sm" />
                  </span>
                </span>
              )}
              {id === "midnight" && (
                <span className="mt-3 block h-16 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950">
                  <span className="mx-4 mt-4 block h-8 rounded-lg border border-zinc-700 bg-zinc-800" />
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
