export type ServiceSection = {
  title: string;
  body: string;
  items: readonly string[];
};

export type ServiceSlug =
  | "ocean-freight"
  | "air-freight"
  | "warehousing"
  | "freight-forwarding"
  | "specialised";

export type ServiceContent = {
  slug: ServiceSlug;
  title: string;
  headline: string;
  summary: string;
  paragraphs: readonly string[];
  highlights: readonly string[];
  sections: readonly ServiceSection[];
  commodities: readonly string[];
  closing?: string;
};

export const services: readonly ServiceContent[] = [
  {
    slug: "ocean-freight",
    title: "Ocean Freight & Cross Trade",
    headline: "Ocean freight with full visibility.",
    summary:
      "FCL, LCL and special containers with live tracking and pre-arrival customs coordination.",
    paragraphs: [
      "ZAB Shipping works with a network of established overseas partners, each a leader in its market, to deliver integrated logistics and supply chain solutions between businesses worldwide.",
      "Customers get real-time electronic monitoring of cargo movements, inbound or outbound, so they can make informed decisions and optimise operations.",
      "Before the vessel reaches port, the team coordinates customs, excise, port clearances and other formalities. When the vessel arrives, the customs clearance division moves the cargo to its destination quickly to minimise delay.",
      "Cross trade means shipments arranged between two other countries without the cargo passing through the seller's country.",
    ],
    highlights: [
      "FCL, LCL and special containers",
      "Live cargo tracking",
      "Pre-arrival customs coordination",
      "Cross-trade between key markets",
    ],
    sections: [
      {
        title: "Cross-trade routes",
        body: "Cross-trade expertise connecting businesses across key global markets.",
        items: ["USA", "China", "Africa", "Far East", "India", "Europe"],
      },
    ],
    commodities: [],
  },
  {
    slug: "air-freight",
    title: "Air Freight",
    headline: "Fast lanes from the UAE and GCC to the world.",
    summary:
      "Air consolidation, carrier partnerships and Sea+Air solutions from the UAE to the world.",
    paragraphs: [
      "ZAB Shipping provides air freight services across a broad network of regions, with route options to help balance speed, schedule and cost.",
    ],
    highlights: [
      "Multiple airline options",
      "Flexible schedules",
      "Tracking from booking to delivery",
    ],
    sections: [
      {
        title: "Coverage",
        body: "Air-freight coverage includes the following regions.",
        items: [
          "UAE",
          "GCC",
          "North America",
          "Latin and South America",
          "Far and Middle East",
          "Indian Subcontinent",
          "Europe",
          "Australia",
          "New Zealand",
          "South Africa",
        ],
      },
      {
        title: "Air consolidation",
        body: "Competitive rates, efficient transit times, multiple airline options and flexible schedules, with tracking from booking to final delivery.",
        items: [],
      },
      {
        title: "Carrier partnerships",
        body: "Relationships with leading carriers support consistent transit times, ample space, better pricing and priority allocation. Cycle times are monitored with partners, and real-time tracking is shared with customers.",
        items: [],
      },
      {
        title: "Export documents",
        body: "Full-service handling of documentation, customs conformance and air transport from door to door.",
        items: [],
      },
      {
        title: "Sea + Air",
        body: "A combination of ocean affordability and air speed using premium carriers, managed end to end within ZAB's network.",
        items: [],
      },
    ],
    commodities: [],
  },
  {
    slug: "warehousing",
    title: "Warehousing & Distribution",
    headline: "Storage that keeps stock safe and moving.",
    summary:
      "Closed, open, covered and temperature-controlled storage with Just-In-Time support.",
    paragraphs: [
      "Closed, open and covered storage, including temperature-controlled space for sensitive goods, with customs-bonded options and Just-In-Time support to reduce carrying costs.",
    ],
    highlights: [
      "Secure and clean storage",
      "Advanced security",
      "Customs bonding facilities",
      "Inventory visibility",
      "Connected to the global network",
    ],
    sections: [
      {
        title: "Storage solutions",
        body: "Options to support different inventory and handling needs.",
        items: [
          "Leased, open and covered warehouses",
          "Temperature-controlled storage for sensitive goods",
          "Just-In-Time inventory support",
        ],
      },
      {
        title: "Distribution",
        body: "Our goal is to simplify logistics operations and provide end-to-end warehousing and distribution that meets your requirements.",
        items: [],
      },
    ],
    commodities: [],
  },
  {
    slug: "freight-forwarding",
    title: "Freight Forwarding",
    headline: "One forwarder, any mode, any lane.",
    summary:
      "Sea, air and land forwarding with cross-trade expertise across the USA, China, Africa, India and Europe.",
    paragraphs: [
      "Sea, air or land: we plan, document and move cargo end to end.",
      "Cross-trade expertise connects the USA, China, Africa, the Far East, India and Europe. Services include freight documentation and embassy legalisation, Bill of Lading compliance, and customs clearance for hazardous and dangerous-goods movements.",
    ],
    highlights: [
      "FCL, LCL and special-container freight",
      "RORO and projects",
      "Local and cross-trade air freight",
      "Import and export customs clearance",
      "Door-to-door shipments",
    ],
    sections: [],
    commodities: [
      "Chemicals",
      "Household Articles",
      "Electronics",
      "Liquor",
      "Machinery",
      "Engineering Goods",
      "Auto Parts",
      "Food Products",
      "Plastics",
      "General Cargo",
      "Vehicle Spare Parts",
      "DG Goods",
      "Heavy Duty Trucks",
    ],
  },
  {
    slug: "specialised",
    title: "Specialised Services",
    headline: "For cargo that needs more than a standard box.",
    summary:
      "Consolidation, RORO, IATA and IMDG dangerous goods, and customs clearance.",
    paragraphs: [],
    closing: "Contact us to learn more about specialised services.",
    highlights: [
      "Consolidation",
      "RORO",
      "Dangerous goods",
      "Customs clearance",
    ],
    sections: [
      {
        title: "Consolidation",
        body: "Combine smaller shipments into one larger consignment for lower freight cost, by air, sea or land.",
        items: [
          "Cost-effective shipping",
          "Efficient handling of smaller shipments",
          "End-to-end tracking",
        ],
      },
      {
        title: "RORO (roll-on/roll-off)",
        body: "For oversized or wheeled cargo such as vehicles, machinery and heavy equipment.",
        items: [
          "Safe, secure transport",
          "Simplified loading and unloading",
          "Oversized cargo expertise",
        ],
      },
      {
        title: "Dangerous goods",
        body: "Handled to international rules including IATA (air) and IMDG (sea), with correct packaging, documentation and labelling.",
        items: [
          "Compliance with safety standards",
          "Expert handling",
          "Secure transport",
        ],
      },
      {
        title: "Customs clearance",
        body: "End-to-end handling of documentation, duties and compliance so shipments cross borders smoothly.",
        items: [],
      },
    ],
    commodities: [],
  },
];
