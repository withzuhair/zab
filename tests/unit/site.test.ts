import { describe, expect, it } from "vitest";
import { site } from "../../content/site";

describe("site content", () => {
  it("defines the company and the five specified service routes", () => {
    expect(site.name).toBe("ZAB Shipping LLC");
    expect(site.tagline).toBe(
      "Freight forwarding and logistics from Dubai to the world.",
    );
    expect(site.address).toContain("Baniyas Metro Station");
    expect(site.phone).toBe("+971 569 445 296");
    expect(site.email).toBe("admin@zabshipping.com");
    expect(site.services).toHaveLength(5);
    expect(site.services.map((service) => service.href)).toEqual([
      "/services/ocean-freight",
      "/services/air-freight",
      "/services/warehousing",
      "/services/freight-forwarding",
      "/services/specialised",
    ]);
  });
});
