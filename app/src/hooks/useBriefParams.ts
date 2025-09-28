import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { BriefContext } from '../lib/schema';

export interface BriefParams extends BriefContext {
  playlist?: string;
  motivationSecondary?: string;
}

const PARAM_KEYS: (keyof BriefParams)[] = [
  'identity',
  'audience',
  'venue',
  'level',
  'motivation',
  'motivationSecondary',
  'playlist',
];

const normalizeValue = (value: string | null | undefined) =>
  value === null || value === undefined || value.trim() === ''
    ? undefined
    : value.trim();

export function useBriefParams(
  defaults: BriefParams
): [BriefParams, (next: Partial<BriefParams>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const current = useMemo<BriefParams>(() => {
    const result: BriefParams = { ...defaults };
    PARAM_KEYS.forEach(key => {
      const raw = searchParams.get(key);
      const normalized = normalizeValue(raw);
      if (normalized) {
        result[key] = normalized as BriefParams[typeof key];
      }
    });
    return result;
  }, [searchParams, defaults]);

  const setParams = useCallback(
    (next: Partial<BriefParams>) => {
      const merged: BriefParams = { ...current, ...next };
      const newParams = new URLSearchParams();
      PARAM_KEYS.forEach(key => {
        const value = merged[key];
        if (value === undefined || value === null || value === '') {
          return;
        }
        if (defaults[key] && value === defaults[key]) {
          return;
        }
        newParams.set(key, String(value));
      });
      setSearchParams(newParams, { replace: true });
    },
    [current, defaults, setSearchParams]
  );

  return [current, setParams];
}
