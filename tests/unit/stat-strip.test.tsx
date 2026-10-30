import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatStrip } from "../../src/components/content/stat-strip";

describe("StatStrip", () => {
  it("does not render unconfirmed statistics", () => {
    const { container } = render(
      <StatStrip
        stats={[
          { label: "Years in operation", value: "20+", confirmed: false },
        ]}
      />,
    );

    expect(container.childElementCount).toBe(0);
    expect(screen.queryByText("20+")).toBeNull();
  });

  it("renders confirmed statistics", () => {
    render(
      <StatStrip
        stats={[{ label: "Confirmed stat", value: "42", confirmed: true }]}
      />,
    );

    expect(screen.getByText("42").textContent).toBe("42");
  });
});
