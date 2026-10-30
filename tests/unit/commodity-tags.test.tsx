import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CommodityTags } from "../../src/components/content/commodity-tags";

describe("CommodityTags", () => {
  afterEach(cleanup);

  it("filters the commodity list by the entered text", () => {
    render(
      <CommodityTags items={["Chemicals", "Electronics", "General Cargo"]} />,
    );

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Filter commodities" }),
      {
        target: { value: "electron" },
      },
    );

    expect(screen.getByText("Electronics").textContent).toBe("Electronics");
    expect(screen.queryByText("Chemicals")).toBeNull();
    expect(screen.queryByText("General Cargo")).toBeNull();
  });

  it("reports an empty search result", () => {
    render(<CommodityTags items={["Chemicals"]} />);

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Filter commodities" }),
      {
        target: { value: "electronics" },
      },
    );

    expect(screen.getByRole("status").textContent).toBe(
      "No matching commodities.",
    );
  });
});
