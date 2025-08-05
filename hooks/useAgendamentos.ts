import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useEffect, useState, useCallback } from 'react';
import { db } from '../services/firebase';
import { useAuthStore } from '../contexts/useAuthStore';
import { cacheManager } from '../services/cacheManager';
import { performanceAnalytics } from '../services/performanceAnalytics';

interface Agendamento {
  id: string;
  clienteId: string;
  clienteNome: string;
  servicoId: string;
  servicoNome: string;
  servicoDuracao: number;
  data: string;
  dataTimestamp: any;
  dataDia: string;
  horaInicio: string;
  status: 'agendado' | 'cancelado' | 'no-show' | 'paid';
  valor?: number;
  observacoes?: string;
  criadoEm: any;
  criadoPor: string;
}

export function useAgendamentos(data: Date) {
  const { user } = useAuthStore();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dataStr = data.toISOString().split('T')[0];
  const cacheKey = `agendamentos_${user?.idSalao}_${dataStr}`;

  const loadAgendamentos = useCallback(async () => {
    if (!user?.idSalao) {
      setLoading(false);
      setAgendamentos([]);
      return;
    }

    const timerId = performanceAnalytics.startTimer('agenda_loading', { data: dataStr });

    try {
      setLoading(true);
      setError(null);

      // Tentar carregar do cache primeiro
      const cached = await cacheManager.get<Agendamento[]>(cacheKey);
      if (cached) {
        performanceAnalytics.recordCacheHit();
        setAgendamentos(cached);
        setLoading(false);
        performanceAnalytics.endTimer(timerId, { cacheHit: true });
        return;
      }

      performanceAnalytics.recordCacheMiss();

      // Query otimizada com filtros no servidor
      const q = query(
        collection(db, 'saloes', user.idSalao, 'agendamentos'),
        where('dataDia', '==', dataStr),
        where('status', 'in', ['agendado', 'paid']),
        orderBy('horaInicio', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const agendamentosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Agendamento[];

        setAgendamentos(agendamentosData);
        setLoading(false);

        // Salvar no cache
        cacheManager.set(cacheKey, agendamentosData, 10 * 60 * 1000); // 10 minutos

        performanceAnalytics.endTimer(timerId, { 
          cacheHit: false, 
          count: agendamentosData.length 
        });

        console.log(`📅 Agendamentos carregados: ${agendamentosData.length} para ${dataStr}`);
      }, (error) => {
        console.error('❌ Erro ao carregar agendamentos:', error);
        setError('Erro ao carregar agendamentos');
        setLoading(false);
        performanceAnalytics.endTimer(timerId, { error: error.message });
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Erro no hook useAgendamentos:', error);
      setError('Erro ao carregar agendamentos');
      setLoading(false);
      performanceAnalytics.endTimer(timerId, { error: (error as Error).message });
    }
  }, [user?.idSalao, dataStr, cacheKey]);

  useEffect(() => {
    const unsubscribe = loadAgendamentos();
    return () => {
      if (unsubscribe) {
        unsubscribe.then(unsub => unsub?.());
      }
    };
  }, [loadAgendamentos]);

  const refreshAgendamentos = useCallback(async () => {
    // Invalidar cache e recarregar
    await cacheManager.remove(cacheKey);
    await loadAgendamentos();
  }, [cacheKey, loadAgendamentos]);

  return {
    agendamentos,
    loading,
    error,
    refreshAgendamentos
  };
} 