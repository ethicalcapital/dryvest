import { useEffect, useState } from 'react';
import type { Dataset } from '../lib/schema';
import { loadDataset, DatasetError } from '../lib/dataClient';

interface UseDatasetResult {
  dataset?: Dataset;
  error?: DatasetError | Error;
  loading: boolean;
}

export function useDataset(
  version: string,
  options?: { basePath?: string; enabled?: boolean }
): UseDatasetResult {
  const [dataset, setDataset] = useState<Dataset>();
  const [error, setError] = useState<DatasetError | Error>();
  const [loading, setLoading] = useState<boolean>(true);
  const basePath = options?.basePath;
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) {
      setDataset(undefined);
      setError(undefined);
      setLoading(false);
      return undefined;
    }

    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError(undefined);
      try {
        const result = await loadDataset(
          version,
          basePath ? { basePath } : undefined
        );
        if (!isMounted) return;
        setDataset(result);
      } catch (err) {
        if (!isMounted) return;
        setError(err as DatasetError | Error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [version, basePath, enabled]);

  return { dataset, error, loading };
}
