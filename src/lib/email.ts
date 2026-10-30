import { Resend } from "resend";
import type { QuoteInput } from "@/lib/validation";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const labels: Record<
  | "fullName"
  | "company"
  | "email"
  | "phone"
  | "serviceType"
  | "origin"
  | "destination"
  | "cargoType"
  | "weightVolume"
  | "message"
  | "consent",
  string
> = {
  fullName: "Full name",
  company: "Company",
  email: "Email",
  phone: "Phone or WhatsApp",
  serviceType: "Service type",
  origin: "Origin",
  destination: "Destination",
  cargoType: "Cargo type",
  weightVolume: "Approximate weight or volume",
  message: "Message",
  consent: "Consent to be contacted",
};

type EnquiryEmail = QuoteInput & {
  id: string;
  siteUrl: string;
};

export async function sendEnquiryEmails(enquiry: EnquiryEmail) {
  const from = process.env.EMAIL_FROM;
  const notifyTo = process.env.ENQUIRY_NOTIFY_TO;
  const apiKey = process.env.RESEND_API_KEY;

  if (!from || !notifyTo) {
    throw new Error("EMAIL_FROM and ENQUIRY_NOTIFY_TO must be configured.");
  }

  const entries = (Object.keys(labels) as (keyof typeof labels)[]).map(
    (key) =>
      [
        labels[key],
        key === "consent"
          ? enquiry.consent
            ? "Yes"
            : "No"
          : String(enquiry[key] || "Not provided"),
      ] as const,
  );
  const text = entries.map(([label, value]) => `${label}: ${value}`).join("\n");
  const html = `<dl>${entries
    .map(
      ([label, value]) =>
        `<dt><strong>${escapeHtml(label)}</strong></dt><dd>${escapeHtml(value)}</dd>`,
    )
    .join("")}</dl>`;
  const serviceLabels: Record<QuoteInput["serviceType"], string> = {
    OCEAN: "Ocean Freight",
    AIR: "Air Freight",
    WAREHOUSING: "Warehousing",
    CUSTOMS: "Customs Clearance",
    RORO_PROJECT: "RORO or Project Cargo",
    DANGEROUS_GOODS: "Dangerous Goods",
    NOT_SURE: "Not sure",
  };
  const serviceValue = serviceLabels[enquiry.serviceType];
  const subject =
    `New enquiry: ${serviceValue} from ${enquiry.fullName}`.replace(
      /[\r\n]/g,
      " ",
    );
  const adminUrl = new URL(
    `/admin/enquiries/${enquiry.id}`,
    enquiry.siteUrl,
  ).toString();

  if (!apiKey) {
    if (process.env.NODE_ENV !== "development") {
      throw new Error("RESEND_API_KEY must be configured outside development.");
    }

    console.info("Development email notification", {
      from,
      to: notifyTo,
      subject,
      text: `${text}\n\nAdmin: ${adminUrl}`,
      html: `${html}<p><a href="${escapeHtml(adminUrl)}">View enquiry</a></p>`,
    });
    console.info("Development customer confirmation", {
      to: enquiry.email,
      subject: "Thanks for contacting ZAB Shipping",
      text: `Thanks, we have your request for ${serviceValue}. We'll reply by email as soon as we can. For urgent cargo, call +971 569 445 296.`,
    });
    return;
  }

  const resend = new Resend(apiKey);
  const [teamResult, customerResult] = await Promise.all([
    resend.emails.send({
      from,
      to: notifyTo,
      subject,
      text: `${text}\n\nAdmin: ${adminUrl}`,
      html: `${html}<p><a href="${escapeHtml(adminUrl)}">View enquiry</a></p>`,
    }),
    resend.emails.send({
      from,
      to: enquiry.email,
      subject: "Thanks for contacting ZAB Shipping",
      text: `Thanks, we have your request about ${serviceValue}. We'll reply by email as soon as we can. For urgent cargo, call +971 569 445 296.`,
      html: `<p>Thanks, we have your request about ${escapeHtml(
        serviceValue,
      )}. We'll reply by email as soon as we can.</p><p>For urgent cargo, call +971 569 445 296.</p>`,
    }),
  ]);

  if (teamResult.error || customerResult.error) {
    console.error("Resend could not deliver one or more enquiry emails.", {
      teamError: teamResult.error?.message,
      customerError: customerResult.error?.message,
    });
    throw new Error("One or more enquiry emails could not be sent.");
  }
}
