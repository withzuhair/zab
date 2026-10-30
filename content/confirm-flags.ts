export const confirmationFlags = {
  statistics: {
    shipments: {
      label: "Delivered goods",
      value: "11K+",
      claim: "The old site also displayed conflicting template numbers.",
      confirmed: false,
    },
    countries: {
      label: "Countries",
      value: "125+",
      claim: "The old site used a template default.",
      confirmed: false,
    },
    team: {
      label: "Experts",
      value: "120+",
      claim: "The old ocean-freight page claimed over 120 experts.",
      confirmed: false,
    },
    years: {
      label: "Years in operation",
      value: "",
      claim: "No value was provided.",
      confirmed: false,
    },
  },
  hubs: {
    locations: [
      "Australia",
      "Houston",
      "UAE",
      "India",
      "Port Blair",
      "Singapore",
      "Malaysia",
    ],
    confirmed: false,
  },
  warehouseLocations: {
    locations: "Major Indian ports, airports, ICDs and SEZs.",
    confirmed: false,
  },
  certifications: {
    qms: {
      claim: "Continuous QMS improvement; no standard named.",
      confirmed: false,
    },
  },
  membership: {
    claim: "Possible JCtrans network membership; not verified.",
    name: "",
    confirmed: false,
  },
  responseTime: {
    claim: "No response-time promise supplied.",
    confirmed: false,
  },
  officeHours: {
    claim: "No office hours supplied.",
    confirmed: false,
  },
} as const;
