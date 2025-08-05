import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useEffect, useState, useCallback } from 'react';
import { db } from '../services/firebase';
import { useAuthStore } from '../contexts/useAuthStore';
import { cacheManager } from '../services/cacheManager';
import { performanceAnalytics } from '../services/performanceAnalytics';

interface Bloqueio {
  id: string;
  data: string;
  startTime: string;
  endTime: string;
  reason: string;
  salaoId: string;
  criadoEm: any;
  criadoPor: string;
}

export function useBloqueios(data: Date) {
  const { user } = useAuthStore();
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dataStr = data.toISOString().split('T')[0];
  const cacheKey = `bloqueios_${user?.idSalao}_${dataStr}`;

  const loadBloqueios = useCallback(async () => {
    if (!user?.idSalao) {
      setLoading(false);
      setBloqueios([]);
      return;
    }

    const timerId = performanceAnalytics.startTimer('bloqueios_loading', { data: dataStr });

    try {
      setLoading(true);
      setError(null);

      // Tentar carregar do cache primeiro
      const cached = await cacheManager.get<Bloqueio[]>(cacheKey);
      if (cached) {
        performanceAnalytics.recordCacheHit();
        setBloqueios(cached);
        setLoading(false);
        performanceAnalytics.endTimer(timerId, { cacheHit: true });
        return;
      }

      performanceAnalytics.recordCacheMiss();

      // Query otimizada com filtros no servidor
      const q = query(
        collection(db, 'saloes', user.idSalao, 'bloqueios'),
        where('data', '==', dataStr),
        orderBy('startTime', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const bloqueiosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Bloqueio[];

        setBloqueios(bloqueiosData);
        setLoading(false);

        // Salvar no cache
        cacheManager.set(cacheKey, bloqueiosData, 30 * 60 * 1000); // 30 minutos

        performanceAnalytics.endTimer(timerId, { 
          cacheHit: false, 
          count: bloqueiosData.length 
        });

        console.log(`🔒 Bloqueios carregados: ${bloqueiosData.length} para ${dataStr}`);
      }, (error) => {
        console.error('❌ Erro ao carregar bloqueios:', error);
        setError('Erro ao carregar bloqueios');
        setLoading(false);
        performanceAnalytics.endTimer(timerId, { error: error.message });
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Erro no hook useBloqueios:', error);
      setError('Erro ao carregar bloqueios');
      setLoading(false);
      performanceAnalytics.endTimer(timerId, { error: (error as Error).message });
    }
  }, [user?.idSalao, dataStr, cacheKey]);

  useEffect(() => {
    const unsubscribe = loadBloqueios();
    return () => {
      if (unsubscribe) {
        unsubscribe.then(unsub => unsub?.());
      }
    };
  }, [loadBloqueios]);

  const refreshBloqueios = useCallback(async () => {
    // Invalidar cache e recarregar
    await cacheManager.remove(cacheKey);
    await loadBloqueios();
  }, [cacheKey, loadBloqueios]);

  return {
    bloqueios,
    loading,
    error,
    refreshBloqueios
  };
} 