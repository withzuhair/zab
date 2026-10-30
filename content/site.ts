export const site = {
  name: "ZAB Shipping LLC",
  tagline: "Freight forwarding and logistics from Dubai to the world.",
  address:
    "Office #22, 4th Floor, Baniyas Metro Station, Shake Maryam Building, Opp. Day to Day, Dubai, United Arab Emirates",
  phone: "+971 569 445 296",
  email: "admin@zabshipping.com",
  whatsappUrl: "https://wa.me/971569445296",
  primaryNavigation: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Gallery", href: "/gallery" },
    { label: "Contact", href: "/contact" },
  ],
  services: [
    {
      label: "Ocean Freight & Cross Trade",
      href: "/services/ocean-freight",
    },
    { label: "Air Freight", href: "/services/air-freight" },
    {
      label: "Warehousing & Distribution",
      href: "/services/warehousing",
    },
    {
      label: "Freight Forwarding",
      href: "/services/freight-forwarding",
    },
    {
      label: "Specialised Services",
      href: "/services/specialised",
    },
  ],
  footerNavigation: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Gallery", href: "/gallery" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy", href: "/privacy" },
  ],
  newsletterPrompt: "Get logistics news and updates",
} as const;
