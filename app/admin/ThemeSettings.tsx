"use client";

import { useState } from "react";
import type { CustomThemeParams } from "@/lib/themes";
import ThemePicker from "./ThemePicker";
import ThemeMaker from "./ThemeMaker";

/**
 * Owns the theme state shared by the picker and the maker, so adding or
 * deleting a custom theme updates both immediately — no refresh needed.
 */
export default function ThemeSettings({
  initialThemes,
  initialThemeRef,
  breweryName,
}: {
  initialThemes: CustomThemeParams[];
  initialThemeRef: string;
  breweryName: string;
}) {
  const [customThemes, setCustomThemes] =
    useState<CustomThemeParams[]>(initialThemes);
  const [activeRef, setActiveRef] = useState(initialThemeRef);

  return (
    <>
      <ThemePicker
        themeRef={activeRef}
        onThemeChange={setActiveRef}
        customThemes={customThemes}
        breweryName={breweryName}
      />
      <ThemeMaker
        themes={customThemes}
        onThemesChange={setCustomThemes}
        activeThemeRef={activeRef}
        onActiveThemeChange={setActiveRef}
      />
    </>
  );
}
