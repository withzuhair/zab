import { confirmationFlags } from "@content/confirm-flags";

export const aboutContent = {
  title: "Logistics built around accountability.",
  paragraphs: [
    "ZAB Shipping LLC is a Dubai-based freight forwarder moving cargo by ocean, air and road. We combine a global agent network with a hands-on local team, so every shipment has a named person behind it from booking to final delivery.",
    "We plan routes early, sort documentation before cargo moves, and keep you informed at every milestone. When something changes, you hear it from us first, with a solution attached.",
    "We understand the complexities of global logistics and the importance of precision in every shipment. By leveraging our network, partnerships and industry knowledge, we make sure goods are transported safely and efficiently, whatever the destination.",
  ],
  mission:
    "To give businesses reliable, cost-effective logistics with the highest standards of safety, compliance and service.",
  values: ["Accountability", "Transparency", "Safety first", "Speed with care"],
  hubs: confirmationFlags.hubs,
  stats: [
    {
      ...confirmationFlags.statistics.shipments,
    },
    {
      ...confirmationFlags.statistics.countries,
    },
  ],
} as const;
