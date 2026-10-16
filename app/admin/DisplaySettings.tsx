"use client";

import { useState, useTransition } from "react";

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

export default function DisplaySettings({
  initialRotate,
  initialRotateSeconds,
  initialCheersEnabled,
  initialShowDescriptions,
}: {
  initialRotate: boolean;
  initialRotateSeconds: number;
  initialCheersEnabled: boolean;
  initialShowDescriptions: boolean;
}) {
  const [rotate, setRotate] = useState(initialRotate);
  const [seconds, setSeconds] = useState(String(initialRotateSeconds));
  const [cheersEnabled, setCheersEnabled] = useState(initialCheersEnabled);
  const [showDescriptions, setShowDescriptions] = useState(
    initialShowDescriptions
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function save() {
    const n = Number(seconds);
    if (!Number.isInteger(n) || n < 5 || n > 120) {
      setError("Rotation interval must be a whole number of seconds, 5–120.");
      return;
    }
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await putSettings({
          displayRotate: rotate,
          displayRotateSeconds: n,
          cheersEnabled,
          showDescriptions,
        });
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
      <h2 className="text-xl font-bold">TV display</h2>
      <p className="mt-1 text-sm text-zinc-500">
        How the tap list behaves on the big screen. The TV picks up changes
        within 30 seconds.
      </p>

      <label className="mt-5 flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={rotate}
          onChange={(e) => {
            setRotate(e.target.checked);
            setSaved(false);
          }}
          className="h-5 w-5 shrink-0 cursor-pointer accent-amber-500"
        />
        <span className="text-sm font-semibold text-zinc-200">
          Auto-rotate pages
          <span className="block text-xs font-normal text-zinc-500">
            Fade between pages when there&apos;s more than one screenful.
          </span>
        </span>
      </label>

      <label
        htmlFor="rotate-seconds"
        className="mt-5 block text-sm font-semibold text-zinc-300"
      >
        Seconds per page
      </label>
      <input
        id="rotate-seconds"
        type="number"
        min={5}
        max={120}
        step={1}
        value={seconds}
        onChange={(e) => {
          setSeconds(e.target.value);
          setSaved(false);
        }}
        className="mt-2 w-28 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 focus:border-amber-500 focus:outline-none"
      />

      <label className="mt-5 flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={cheersEnabled}
          onChange={(e) => {
            setCheersEnabled(e.target.checked);
            setSaved(false);
          }}
          className="h-5 w-5 shrink-0 cursor-pointer accent-amber-500"
        />
        <span className="text-sm font-semibold text-zinc-200">
          Cheers 🍻
          <span className="block text-xs font-normal text-zinc-500">
            Let visitors tap to cheers a pour; the count shows on its card.
          </span>
        </span>
      </label>

      <label className="mt-5 flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={showDescriptions}
          onChange={(e) => {
            setShowDescriptions(e.target.checked);
            setSaved(false);
          }}
          className="h-5 w-5 shrink-0 cursor-pointer accent-amber-500"
        />
        <span className="text-sm font-semibold text-zinc-200">
          Pour descriptions
          <span className="block text-xs font-normal text-zinc-500">
            Show the tasting notes under each pour. Turn off for a denser
            board.
          </span>
        </span>
      </label>

      <button
        type="button"
        disabled={isPending}
        onClick={save}
        className="mt-6 rounded-xl bg-amber-500 px-5 py-3 font-bold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save display settings"}
      </button>

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
