const KEY = "dryvest_consent_v1";

export function getConsent() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw
      ? JSON.parse(raw)
      : { accepted: false, analytics: false, emailOptIn: false, email: "" };
  } catch {
    return { accepted: false, analytics: false, emailOptIn: false, email: "" };
  }
}

export function setConsent(next) {
  localStorage.setItem(KEY, JSON.stringify(next));
}
