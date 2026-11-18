import { useCallback, useEffect, useState } from 'react';
import { friendlyError } from '@/services/firebase/auth';

export interface Loaded<T> {
  data: T | null;
  error: string;
  loading: boolean;
  reload: () => Promise<void>;
}

/** Memuat data async sederhana dengan status loading/galat dan reload manual. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]): Loaded<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);
  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await run());
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, [run]);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { data, error, loading, reload };
}
