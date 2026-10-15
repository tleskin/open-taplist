// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CarboyIcon from "./CarboyIcon";
import { srmToHex } from "@/lib/srm";

describe("CarboyIcon", () => {
  it("colors the fermenting wort from the beer's SRM", () => {
    const { container } = render(<CarboyIcon srm={15} />);
    const wort = container.querySelector(`rect[fill="${srmToHex(15)}"]`);
    expect(wort).toBeInTheDocument();
    // Nearly opaque so the carboy shows the true beer color.
    expect(wort).toHaveAttribute("opacity", "0.9");
  });

  it("defaults to SRM 8 when none is given", () => {
    const { container } = render(<CarboyIcon />);
    expect(
      container.querySelector(`rect[fill="${srmToHex(8)}"]`)
    ).toBeInTheDocument();
  });

  it("renders a krausen cap and CO2 bubbles", () => {
    const { container } = render(<CarboyIcon srm={10} />);
    expect(
      container.querySelector('ellipse[fill="#FBF3DC"]')
    ).toBeInTheDocument();
    expect(
      container.querySelectorAll('circle[fill="#FBF3DC"]').length
    ).toBeGreaterThan(0);
  });
});
