/*
 * Cloudflare Web Analytics integration helpers.
 * Loads the beacon script when a token is provided and exposes a simple
 * trackEvent API that mirrors Cloudflare's `_cfq` queue format.
 */

declare global {
  interface Window {
    _cfq?: unknown[][];
  }
}

export interface AnalyticsInitOptions {
  token?: string;
  spa?: boolean;
}

let initialized = false;

export function initAnalytics({ token, spa = true }: AnalyticsInitOptions): void {
  if (!token || initialized) return;

  const existing = document.querySelector<HTMLScriptElement>('script[data-cf-beacon]');
  if (existing) {
    initialized = true;
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.defer = true;
  script.setAttribute(
    'data-cf-beacon',
    JSON.stringify({ token, spa })
  );
  document.head.appendChild(script);
  initialized = true;
}

export type AnalyticsEventName =
  | 'app_opened'
  | 'params_changed'
  | 'brief_built'
  | 'copy_clicked'
  | 'download_clicked'
  | 'print_clicked';

export function trackEvent(name: AnalyticsEventName, props?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  if (!window._cfq) {
    window._cfq = [];
  }
  window._cfq.push(['track', name, props ?? {}]);
}
