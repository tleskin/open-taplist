"use client";

import { useState, type ReactNode } from "react";

const TABS = [
  { id: "beers", label: "Beers" },
  { id: "settings", label: "Site settings" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * Splits the admin dashboard into tabs so beer management stays separate
 * from site settings (branding, themes).
 */
export default function AdminTabs({
  beers,
  settings,
}: {
  beers: ReactNode;
  settings: ReactNode;
}) {
  const [tab, setTab] = useState<TabId>("beers");

  return (
    <div>
      <div
        role="tablist"
        aria-label="Admin sections"
        className="inline-flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-zinc-700 text-zinc-50 shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="mt-6">
        {tab === "beers" ? beers : <div className="space-y-8">{settings}</div>}
      </div>
    </div>
  );
}
