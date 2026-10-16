"use client";

import type { CSSProperties } from "react";
import BeerGlass from "@/components/BeerGlass";
import CarboyIcon from "@/components/CarboyIcon";
import { srmToHex } from "@/lib/srm";
import { resolveTheme, type CustomThemeParams } from "@/lib/themes";

/**
 * A faithful miniature of the tap list TV display, rendered with the real
 * theme styles — so you can see a theme in /admin without opening the
 * display itself.
 *
 * The mock is scaled to 75% inside a fixed-height viewport, so the frame is
 * smaller than the real display and never changes size while browsing
 * themes (no layout shift under the hovered buttons).
 */
export default function ThemePreviewPane({
  themeRef,
  customThemes,
  breweryName,
  breweryLogo,
}: {
  themeRef: string;
  customThemes: CustomThemeParams[];
  breweryName: string;
  breweryLogo: string | null;
}) {
  const { styles: t, vars, label } = resolveTheme(themeRef, customThemes);
  const pageCls = t.page.replace("min-h-screen", "").trim();

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-700">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Preview
        </p>
        <p className="text-xs font-semibold text-amber-400">{label}</p>
      </div>

      <div className="relative h-[430px] overflow-hidden bg-zinc-950">
        <div className="h-[574px] w-[133.34%] origin-top-left scale-75">
          <div className={pageCls} style={vars as CSSProperties | undefined}>
            {themeRef === "liquid-glass" && (
              <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-amber-500/25 blur-[120px]" />
                <div className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-indigo-500/20 blur-[130px]" />
                <div className="absolute bottom-0 -left-24 h-96 w-96 rounded-full bg-rose-500/15 blur-[120px]" />
              </div>
            )}
            {themeRef === "liquid-glass-light" && (
              <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-amber-300/50 blur-[120px]" />
                <div className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-sky-300/50 blur-[130px]" />
                <div className="absolute bottom-0 -left-24 h-96 w-96 rounded-full bg-rose-300/40 blur-[120px]" />
              </div>
            )}

            <div className={`relative ${t.header}`}>
              <div className="mx-auto max-w-3xl text-center">
                {breweryLogo && (
                  <img
                    src={breweryLogo}
                    alt={`${breweryName} logo`}
                    className="mx-auto mb-4 h-28 w-auto max-w-full object-contain sm:h-32"
                  />
                )}
                <p className={t.kicker}>Now pouring</p>
                {!breweryLogo && (
                  <h1 className={t.title}>{breweryName}</h1>
                )}
              </div>
            </div>

            <div className="relative mx-auto max-w-6xl space-y-6 px-6 py-6 sm:px-10">
              <section>
                <div className="mb-3 flex items-center gap-3">
                  <div className={t.sectionIconWrap}>
                    <BeerGlass glass="pint" srm={8} className="h-7 w-auto" />
                  </div>
                  <h2 className={t.sectionTitle}>On Tap</h2>
                </div>
                <div className={t.card}>
                  {t.cardShine && <div aria-hidden className={t.cardShine} />}
                  <div className={t.tapBadge}>1</div>
                  <BeerGlass
                    glass="pint"
                    srm={8}
                    className="h-16 w-auto shrink-0"
                  />
                  <div className="relative min-w-0">
                    <h3 className={`text-xl font-bold leading-tight ${t.nameText}`}>
                      Garage Door IPA
                    </h3>
                    <p className={t.styleText}>West Coast IPA</p>
                    <p className={t.statText}>
                      <span className={t.statValue}>6.8% ABV</span>
                      <span className="ml-3">
                        <span className={t.statValue}>72</span> IBU
                      </span>
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center gap-3">
                  <div className={t.sectionIconWrap}>
                    <CarboyIcon className="h-7 w-auto" />
                  </div>
                  <h2 className={t.sectionTitle}>Fermenting</h2>
                </div>
                <div className={t.card}>
                  {t.cardShine && <div aria-hidden className={t.cardShine} />}
                  <CarboyIcon
                    srm={15}
                    className="h-16 w-auto shrink-0 opacity-90"
                  />
                  <div className="relative min-w-0">
                    <h3 className={`flex items-center gap-2 text-xl font-bold leading-tight ${t.nameText}`}>
                      Midnight Stout
                      <span
                        title="~15 SRM"
                        className="inline-block h-4 w-4 shrink-0 rounded-full border border-white/30"
                        style={{ backgroundColor: srmToHex(15) }}
                      />
                    </h3>
                    <p className={t.styleText}>American Stout</p>
                    <p className={t.statText}>
                      <span className={t.statValue}>5.9% ABV</span>
                      <span className="ml-3">
                        <span className={t.statValue}>38</span> IBU
                      </span>
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <div className={`relative ${t.footer}`}>
              OpenTapList · refreshes automatically
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
