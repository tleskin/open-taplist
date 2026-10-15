// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BeerGlass, { GLASS_LABELS } from "./BeerGlass";
import { srmToHex } from "@/lib/srm";
import type { GlassType } from "@/db/schema";

const glasses = Object.keys(GLASS_LABELS) as GlassType[];

describe("BeerGlass", () => {
  it.each(glasses)("renders an accessible %s glass", (glass) => {
    const { container } = render(<BeerGlass glass={glass} srm={8} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute(
      "aria-label",
      `${GLASS_LABELS[glass]} glass`
    );
  });

  it("fills the beer with the color derived from SRM", () => {
    const { container } = render(<BeerGlass glass="pint" srm={8} />);
    expect(
      container.querySelector(`rect[fill="${srmToHex(8)}"]`)
    ).toBeInTheDocument();
  });

  it("falls back to amber when SRM is missing", () => {
    const { container } = render(<BeerGlass glass="tulip" srm={null} />);
    expect(
      container.querySelector(`rect[fill="${srmToHex(null)}"]`)
    ).toBeInTheDocument();
  });

  it("tops every glass with a foam head", () => {
    const { container } = render(<BeerGlass glass="weizen" srm={4} />);
    expect(
      container.querySelector('ellipse[fill="#FBF3DC"]')
    ).toBeInTheDocument();
  });
});
