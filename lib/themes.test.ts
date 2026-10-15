import { describe, expect, it } from "vitest";
import {
  customThemeRef,
  isCardStyle,
  isCustomThemeRef,
  isThemeId,
  isValidCustomTheme,
  resolveTheme,
  THEMES,
  themeStyles,
  type CustomThemeParams,
  type ThemeId,
} from "./themes";

const validCustom: CustomThemeParams = {
  id: "abc123",
  name: "My Theme",
  background: "#101018",
  text: "#f5f5f5",
  accent: "#f59e0b",
  card: "#1c1c26",
  cardStyle: "glass",
};

describe("isThemeId", () => {
  it("accepts every built-in theme id", () => {
    for (const id of ["midnight", "liquid-glass", "liquid-glass-light", "daylight"]) {
      expect(isThemeId(id)).toBe(true);
    }
  });

  it("rejects custom refs and junk", () => {
    expect(isThemeId("custom:abc")).toBe(false);
    expect(isThemeId("midnight ")).toBe(false);
    expect(isThemeId("")).toBe(false);
    expect(isThemeId(null)).toBe(false);
    expect(isThemeId(undefined)).toBe(false);
    expect(isThemeId(42)).toBe(false);
  });
});

describe("custom theme refs", () => {
  it("builds and detects custom: refs", () => {
    expect(customThemeRef("abc123")).toBe("custom:abc123");
    expect(isCustomThemeRef("custom:abc123")).toBe(true);
    expect(isCustomThemeRef("midnight")).toBe(false);
    expect(isCustomThemeRef(null)).toBe(false);
  });
});

describe("isCardStyle", () => {
  it("accepts the three card styles", () => {
    expect(isCardStyle("solid")).toBe(true);
    expect(isCardStyle("glass")).toBe(true);
    expect(isCardStyle("outline")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isCardStyle("frosty")).toBe(false);
    expect(isCardStyle("")).toBe(false);
    expect(isCardStyle(null)).toBe(false);
  });
});

describe("isValidCustomTheme", () => {
  it("accepts a well-formed custom theme", () => {
    expect(isValidCustomTheme(validCustom)).toBe(true);
  });

  it("accepts 3-digit hex colors", () => {
    expect(
      isValidCustomTheme({ ...validCustom, background: "#abc" })
    ).toBe(true);
  });

  it("rejects malformed colors", () => {
    for (const background of ["red", "#12345", "#gggggg", "123456", ""]) {
      expect(isValidCustomTheme({ ...validCustom, background })).toBe(false);
    }
  });

  it("rejects bad names, ids, and card styles", () => {
    expect(isValidCustomTheme({ ...validCustom, name: "  " })).toBe(false);
    expect(isValidCustomTheme({ ...validCustom, name: "x".repeat(41) })).toBe(
      false
    );
    expect(isValidCustomTheme({ ...validCustom, id: "" })).toBe(false);
    expect(isValidCustomTheme({ ...validCustom, cardStyle: "frosty" })).toBe(
      false
    );
  });

  it("rejects missing fields and non-objects", () => {
    expect(
      isValidCustomTheme({ ...validCustom, accent: undefined })
    ).toBe(false);
    expect(isValidCustomTheme(null)).toBe(false);
    expect(isValidCustomTheme("custom:abc")).toBe(false);
    expect(isValidCustomTheme([])).toBe(false);
  });
});

describe("resolveTheme", () => {
  it("resolves each built-in theme to its style bundle", () => {
    for (const id of Object.keys(THEMES) as ThemeId[]) {
      const resolved = resolveTheme(id, []);
      expect(resolved.styles).toBe(themeStyles[id]);
      expect(resolved.vars).toBeNull();
      expect(resolved.label).toBe(THEMES[id].name);
    }
  });

  it("resolves a saved custom theme to CSS variables", () => {
    const resolved = resolveTheme("custom:abc123", [validCustom]);
    expect(resolved.label).toBe("My Theme");
    expect(resolved.vars).toEqual({
      "--ctp-bg": validCustom.background,
      "--ctp-text": validCustom.text,
      "--ctp-accent": validCustom.accent,
      "--ctp-card": validCustom.card,
    });
    expect(resolved.styles.page).toContain("ctp-page");
  });

  it("falls back to Midnight for unknown or unresolvable themes", () => {
    expect(resolveTheme("nope", []).styles).toBe(themeStyles.midnight);
    expect(resolveTheme("custom:missing", [validCustom]).styles).toBe(
      themeStyles.midnight
    );
    // A stored custom theme that no longer validates also falls back.
    expect(
      resolveTheme("custom:abc123", [{ ...validCustom, background: "red" }])
        .styles
    ).toBe(themeStyles.midnight);
  });
});

describe("theme registry consistency", () => {
  it("every registered theme has a complete style bundle", () => {
    const bundleKeys = Object.keys(themeStyles.midnight).sort();
    expect(bundleKeys.length).toBeGreaterThan(0);
    for (const id of Object.keys(THEMES) as ThemeId[]) {
      expect(THEMES[id].id).toBe(id);
      expect(themeStyles[id]).toBeDefined();
      expect(Object.keys(themeStyles[id]).sort()).toEqual(bundleKeys);
    }
  });
});
