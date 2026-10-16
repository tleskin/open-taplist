"use client";

import { useEffect, useState } from "react";

/**
 * Branded splash screen: black background, the OpenTaplist lockup, and a
 * beer glass that pours itself full. Shown for a beat on initial load —
 * even when data arrives instantly — so the app opens with a moment of
 * theater instead of a half-rendered page.
 */
export default function SplashScreen() {
  const [pouring, setPouring] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    // Kick the pour on the next frame so the CSS transition runs.
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setPouring(true)),
    );
    return () => cancelAnimationFrame(raf);
  }, []);

  const settled = pouring || reducedMotion;
  const bubbles = [
    { cx: 44, cy: 150, r: 3, delay: "0.9s" },
    { cx: 62, cy: 160, r: 2.4, delay: "1.25s" },
    { cx: 76, cy: 145, r: 3.4, delay: "1.05s" },
    { cx: 54, cy: 130, r: 2, delay: "1.5s" },
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center bg-black px-8">
      <style>{`@keyframes splash-bubble-rise {
  0% { transform: translateY(0); opacity: 0; }
  25% { opacity: 0.7; }
  100% { transform: translateY(-95px); opacity: 0; }
}`}</style>
      <img
        src="/logo-lockup-dark.png"
        alt="OpenTaplist"
        className={`w-60 transition-opacity duration-700 sm:w-80 ${
          settled ? "opacity-100" : "opacity-0"
        }`}
      />
      <svg
        viewBox="0 0 120 200"
        role="img"
        aria-label="Beer pouring"
        className="mt-12 h-52 w-auto sm:h-64"
      >
        <defs>
          <linearGradient id="splashBeer" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f8c14b" />
            <stop offset="100%" stopColor="#dd8417" />
          </linearGradient>
          <clipPath id="splashGlassClip">
            <path d="M22 12 L98 12 L86 168 Q85 180 73 180 L47 180 Q35 180 34 168 Z" />
          </clipPath>
        </defs>

        {/* The pour: beer + foam rise together from below the glass. */}
        <g clipPath="url(#splashGlassClip)">
          <g
            style={{
              transform: settled ? "translateY(0)" : "translateY(170px)",
              transition: reducedMotion
                ? "none"
                : "transform 2s cubic-bezier(0.3, 0.6, 0.4, 1)",
            }}
          >
            <rect x="22" y="14" width="76" height="166" fill="url(#splashBeer)" />
            {bubbles.map((b, i) => (
              <circle
                key={i}
                cx={b.cx}
                cy={b.cy}
                r={b.r}
                fill="#ffffff"
                opacity={0}
                style={
                  reducedMotion
                    ? undefined
                    : {
                        animation: "splash-bubble-rise 1.7s ease-in infinite",
                        animationDelay: b.delay,
                      }
                }
              />
            ))}
            <ellipse cx="60" cy="18" rx="38" ry="10" fill="#fdf6ea" />
            <circle cx="38" cy="12" r="7" fill="#fdf6ea" />
            <circle cx="60" cy="9" r="8.5" fill="#fdf6ea" />
            <circle cx="82" cy="13" r="6" fill="#fdf6ea" />
          </g>
        </g>

        {/* Glass outline + heavy base. */}
        <path
          d="M22 12 L98 12 L86 168 Q85 180 73 180 L47 180 Q35 180 34 168 Z"
          fill="rgba(255,255,255,0.04)"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <rect x="30" y="184" width="60" height="9" rx="4.5" fill="rgba(255,255,255,0.18)" />
      </svg>
    </div>
  );
}
