import type { BriefContext } from './schema';

const encoder = new TextEncoder();

export async function hashContext(context: BriefContext): Promise<string> {
  const canonical = [
    context.identity ?? '',
    context.audience ?? '',
    context.level ?? '',
  ].join('|');

  const data = encoder.encode(canonical);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
