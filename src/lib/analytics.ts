declare global {
  interface Window {
    plausible?: (eventName: string) => void;
  }
}

export function trackQuoteSubmitted() {
  if (
    process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN &&
    typeof window !== "undefined"
  ) {
    window.plausible?.("quote_submitted");
  }
}
