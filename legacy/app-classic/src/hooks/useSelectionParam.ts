import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

interface SelectionOptions {
  defaults?: string[];
  allowed?: string[];
}

const parseParam = (value: string | null | undefined): string[] => {
  if (!value) return [];
  return value
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
};

const serialise = (values: string[]): string => values.join(',');

export function useSelectionParam(
  key: string,
  { defaults = [], allowed }: SelectionOptions = {}
): [
  string[],
  (id: string, include?: boolean) => void,
  (next: string[]) => void,
] {
  const [searchParams, setSearchParams] = useSearchParams();

  const orderMap = useMemo(() => {
    if (!allowed) return undefined;
    return new Map(allowed.map((id, index) => [id, index]));
  }, [allowed]);

  const selected = useMemo(() => {
    const raw = parseParam(searchParams.get(key));
    const base = raw.length ? raw : defaults;
    const unique = Array.from(new Set(base));
    const filtered = allowed
      ? unique.filter(id => allowed.includes(id))
      : unique;
    if (!orderMap) {
      return filtered.slice().sort();
    }
    return filtered
      .slice()
      .sort((a, b) => (orderMap.get(a) ?? 0) - (orderMap.get(b) ?? 0));
  }, [searchParams, key, defaults, allowed, orderMap]);

  const apply = useCallback(
    (nextValues: string[]) => {
      const cleaned = allowed
        ? nextValues.filter(id => allowed.includes(id))
        : nextValues;
      const unique = Array.from(new Set(cleaned));
      const ordered = orderMap
        ? unique.sort((a, b) => (orderMap.get(a) ?? 0) - (orderMap.get(b) ?? 0))
        : unique.sort();
      const params = new URLSearchParams(searchParams);
      if (ordered.length) {
        params.set(key, serialise(ordered));
      } else {
        params.delete(key);
      }
      setSearchParams(params, { replace: true });
    },
    [allowed, key, orderMap, searchParams, setSearchParams]
  );

  const toggle = useCallback(
    (id: string, include?: boolean) => {
      const current = new Set(selected);
      const shouldInclude = include ?? !current.has(id);
      if (shouldInclude) {
        current.add(id);
      } else {
        current.delete(id);
      }
      apply(Array.from(current));
    },
    [apply, selected]
  );

  return [selected, toggle, apply];
}
