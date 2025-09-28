import type { BriefContext } from './schema';
import { hashContext } from './contextHash';

/*
 * Cloudflare Web Analytics integration helpers + Durable Object event telemetry.
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

type AnalyticsEventName =
  | 'app_opened'
  | 'params_changed'
  | 'brief_built'
  | 'mode_selected'
  | 'scenario_selected'
  | 'context_finalized'
  | 'time_in_mode'
  | 'key_point_toggled'
  | 'custom_keypoint_saved'
  | 'compare_context_viewed'
  | 'fact_check_context_viewed'
  | 'copy_clicked'
  | 'download_clicked'
  | 'pdf_generated'
  | 'anki_export'
  | 'fact_check_bundle_downloaded'
  | 'mailing_opt_in'
  | 'analytics_consent_changed'
  | 'feedback_link_clicked'
  | 'contact_submitted';

type Category = 'engagement' | 'content' | 'usage' | 'feedback' | 'other';

const CATEGORY_MAP: Record<string, Category> = {
  app_opened: 'engagement',
  params_changed: 'engagement',
  brief_built: 'engagement',
  mode_selected: 'engagement',
  scenario_selected: 'engagement',
  context_finalized: 'engagement',
  time_in_mode: 'engagement',
  key_point_toggled: 'content',
  custom_keypoint_saved: 'content',
  compare_context_viewed: 'content',
  fact_check_context_viewed: 'content',
  download_clicked: 'usage',
  copy_clicked: 'usage',
  pdf_generated: 'usage',
  anki_export: 'usage',
  fact_check_bundle_downloaded: 'usage',
  mailing_opt_in: 'feedback',
  analytics_consent_changed: 'feedback',
  feedback_link_clicked: 'feedback',
  contact_submitted: 'feedback',
};

interface DurableAnalyticsEvent {
  name: string;
  category: Category;
  timestamp: string;
  contextHash?: string;
  metadata?: Record<string, unknown>;
}

const EVENT_ENDPOINT = '/api/events';

let initialized = false;
let consentGranted = false;
let currentContext: BriefContext | undefined;
let currentDatasetVersion: string | undefined;

export function setAnalyticsConsent(consent: boolean) {
  consentGranted = consent;
}

export function setAnalyticsContext(context?: BriefContext, datasetVersion?: string) {
  currentContext = context;
  currentDatasetVersion = datasetVersion ?? currentDatasetVersion;
}

export function initAnalytics({
  token,
  spa = true,
}: AnalyticsInitOptions): void {
  if (!token || initialized || !consentGranted) return;

  const existing = document.querySelector<HTMLScriptElement>(
    'script[data-cf-beacon]'
  );
  if (existing) {
    initialized = true;
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.defer = true;
  script.setAttribute('data-cf-beacon', JSON.stringify({ token, spa }));
  document.head.appendChild(script);
  initialized = true;
}

export function trackEvent(
  name: AnalyticsEventName,
  props?: Record<string, unknown>
): void {
  if (!consentGranted) return;
  if (typeof window === 'undefined') return;
  if (!window._cfq) {
    window._cfq = [];
  }
  window._cfq.push(['track', name, props ?? {}]);
  void forwardToDurableObject(name, props);
}

const forwardToDurableObject = async (
  name: AnalyticsEventName,
  props?: Record<string, unknown>
) => {
  try {
    const eventPayload: DurableAnalyticsEvent = {
      name,
      category: CATEGORY_MAP[name] ?? 'other',
      timestamp: new Date().toISOString(),
      metadata: sanitizeMetadata(props),
    };

    if (currentContext) {
      eventPayload.contextHash = await hashContext(currentContext);
      if (currentDatasetVersion && !eventPayload.metadata?.datasetVersion) {
        eventPayload.metadata = {
          ...eventPayload.metadata,
          datasetVersion: currentDatasetVersion,
        };
      }
    }

    const body = JSON.stringify(eventPayload);

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(EVENT_ENDPOINT, blob);
    } else if (typeof fetch !== 'undefined') {
      await fetch(EVENT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      });
    }
  } catch (error) {
    console.warn('analytics event failed', error);
  }
};

const sanitizeMetadata = (
  props?: Record<string, unknown>
): Record<string, unknown> | undefined => {
  if (!props) return undefined;
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      cleaned[key] = value;
    } else if (Array.isArray(value)) {
      const filtered = value.filter(item =>
        ['string', 'number', 'boolean'].includes(typeof item)
      );
      if (filtered.length) {
        cleaned[key] = filtered.map(item =>
          typeof item === 'number' ? Number(item.toFixed?.(4) ?? item) : item
        );
      }
    }
  }
  return Object.keys(cleaned).length ? cleaned : undefined;
};
