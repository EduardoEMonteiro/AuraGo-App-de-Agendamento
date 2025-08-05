import { useState, useEffect, useCallback } from 'react';
import { cacheManager } from '../services/cacheManager';
import { performanceAnalytics } from '../services/performanceAnalytics';

export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    const timerId = performanceAnalytics.startTimer('cached_data_loading', { key });

    try {
      setLoading(true);
      setError(null);

      // Tentar carregar do cache
      const cached = await cacheManager.get<T>(key);
      if (cached) {
        performanceAnalytics.recordCacheHit();
        setData(cached);
        setLoading(false);
        performanceAnalytics.endTimer(timerId, { cacheHit: true });
        return;
      }

      performanceAnalytics.recordCacheMiss();

      // Buscar dados frescos
      const freshData = await fetcher();
      
      // Salvar no cache
      await cacheManager.set(key, freshData, ttl);
      
      setData(freshData);
      performanceAnalytics.endTimer(timerId, { cacheHit: false });
    } catch (err) {
      const error = err as Error;
      setError(error);
      performanceAnalytics.endTimer(timerId, { error: error.message });
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  const refresh = useCallback(async () => {
    const timerId = performanceAnalytics.startTimer('cached_data_refresh', { key });

    try {
      setLoading(true);
      const freshData = await fetcher();
      await cacheManager.set(key, freshData, ttl);
      setData(freshData);
      setError(null);
      performanceAnalytics.endTimer(timerId, { success: true });
    } catch (err) {
      const error = err as Error;
      setError(error);
      performanceAnalytics.endTimer(timerId, { error: error.message });
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  const invalidate = useCallback(async () => {
    await cacheManager.remove(key);
    setData(null);
  }, [key]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { 
    data, 
    loading, 
    error, 
    refresh, 
    invalidate 
  };
} 