import { getConsent } from "./consent.js";

export function track(event, data = {}) {
  const { analytics } = getConsent();
  if (!analytics) return;
  // swap this with your analytics SDK; we keep it privacy-safe
  console.log("[analytics]", event, data);
}
