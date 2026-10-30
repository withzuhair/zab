export const homeContent = {
  scenes: [
    {
      id: "arrival",
      label: "From Dubai, worldwide",
      title: "Freight, handled.",
      description:
        "ZAB Shipping moves cargo by sea, air and road from Dubai to the world, with one team accountable from pickup to delivery.",
      art: "reach-stacker",
      theme: "light",
      link: { label: "Meet ZAB Shipping", href: "/about" },
    },
    {
      id: "one-roof",
      label: "One accountable partner",
      title: "Everything freight needs, under one roof.",
      description:
        "Ocean, air, warehousing, customs and specialised cargo, so you deal with one partner instead of five.",
      art: "truck",
      theme: "dark",
      link: { label: "Explore all services", href: "/services" },
    },
    {
      id: "ocean",
      label: "Ocean freight",
      title: "Ocean freight and cross trade",
      description:
        "FCL, LCL and special containers on major global trade lanes, with live visibility from booking to arrival.",
      art: "ship",
      theme: "ocean",
      link: { label: "Explore ocean freight", href: "/services/ocean-freight" },
    },
    {
      id: "air",
      label: "Air freight",
      title: "Air freight across the UAE, GCC and beyond",
      description:
        "Consolidation, direct routings and Sea+Air options when you need to balance speed against cost.",
      art: "plane",
      theme: "dusk",
      link: { label: "Explore air freight", href: "/services/air-freight" },
    },
    {
      id: "warehousing",
      label: "Warehousing",
      title: "Storage that keeps stock safe and moving",
      description:
        "Closed, open, covered and temperature-controlled space with Just-In-Time support.",
      art: "warehouse",
      theme: "light",
      link: {
        label: "Explore warehousing",
        href: "/services/warehousing",
      },
    },
    {
      id: "customs",
      label: "Customs",
      title: "Cleared without the delays",
      description:
        "Import and export documentation, duties and compliance handled by specialists.",
      art: "documents",
      theme: "dark",
      link: {
        label: "Explore specialised services",
        href: "/services/specialised",
      },
    },
    {
      id: "specialised",
      label: "Specialised cargo",
      title: "Cargo that needs extra care",
      description:
        "Consolidation, RORO, dangerous goods under IATA and IMDG rules, and customs clearance.",
      art: "specialised",
      theme: "light",
      link: {
        label: "View specialised services",
        href: "/services/specialised",
      },
    },
    {
      id: "proof",
      label: "Global network",
      title: "Built on a global network",
      description:
        "A partner network connects local coordination with international reach for your shipment.",
      art: "network",
      theme: "ocean",
      link: { label: "How we work", href: "/about" },
    },
    {
      id: "cta",
      label: "Start a conversation",
      title: "Tell us what you're shipping.",
      description:
        "Get a quote or call +971 569 445 296 to discuss your cargo.",
      art: "none",
      theme: "blue",
      link: { label: "Get a Quote", href: "/contact" },
      secondaryLink: {
        label: "WhatsApp",
        href: "https://wa.me/971569445296",
      },
    },
  ],
  whyChoose: [
    {
      title: "Compliant by default.",
      description:
        "Documentation, customs and dangerous-goods rules are checked before cargo moves, not after it is held.",
    },
    {
      title: "Quality that is managed.",
      description: "Documented processes reviewed regularly.",
    },
    {
      title: "On the clock.",
      description:
        "Clear milestones and proactive updates so you are never chasing for status.",
    },
    {
      title: "No surprises.",
      description:
        "Itemised quotes and straight answers on cost, route and transit time.",
    },
    {
      title: "Partners paid on time.",
      description:
        "Reliable payments keep carriers, truckers and agents prioritising your cargo.",
    },
  ],
  membershipReason: {
    title: "Part of a trusted network.",
    prefix: "Network membership: ",
  },
  whyChooseTitle: "Why choose ZAB",
  servicesTitle: "One team for every mode",
  servicesDescription:
    "Explore freight forwarding and logistics support from Dubai to the world.",
} as const;
