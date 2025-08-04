import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../contexts/useAuthStore';
import { db } from '../services/firebase';

interface IndicadoresFinanceiros {
  ticketMedio: number;
  totalAtendimentos: number;
  variacaoReceita: number;
  receitasPorFormaPagamento: Record<string, number>;
  agendamentosPendentes: number;
  naoCompareceram: number;
  metaMensal: {
    valor: number;
    atual: number;
    faltam: number;
    percentual: number;
  } | null;
  alertaSaudeFinanceira: boolean;
}

interface PeriodoFiltro {
  start: Date;
  end: Date;
}

interface Agendamento {
  id: string;
  data: any;
  status: string;
  finalPrice?: number;
  servicoValor?: number;
  formaPagamento?: string;
}

interface Despesa {
  id: string;
  data: any;
  valor: number;
}

export function useFinanceiroIndicadores(periodo: PeriodoFiltro) {
  const { user } = useAuthStore();
  const [indicadores, setIndicadores] = useState<IndicadoresFinanceiros>({
    ticketMedio: 0,
    totalAtendimentos: 0,
    variacaoReceita: 0,
    receitasPorFormaPagamento: {},
    agendamentosPendentes: 0,
    naoCompareceram: 0,
    metaMensal: null,
    alertaSaudeFinanceira: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.idSalao) return;

    const unsubscribeAgendamentos = onSnapshot(
      query(
        collection(db, 'saloes', user.idSalao, 'agendamentos'),
        orderBy('data')
      ),
      (snapshot) => {
        const agendamentos = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Agendamento[];

        // Filtrar por período
        const agendamentosPeriodo = agendamentos.filter(ag => {
          const data = ag.data?.toDate?.() || new Date(ag.data);
          return data >= periodo.start && data <= periodo.end;
        });

        // Calcular indicadores
        const atendimentosPagos = agendamentosPeriodo.filter(
          ag => ag.status === 'paid' || ag.status === 'completed'
        );

        // Remover duplicatas baseado no ID antes de calcular
        const atendimentosUnicos = atendimentosPagos.filter((item, index, self) => 
          index === self.findIndex(t => t.id === item.id)
        );
        
        const receitaTotal = atendimentosUnicos.reduce((acc, ag) => {
          const valor = Number(ag.finalPrice || ag.servicoValor) || 0;
          return acc + valor;
        }, 0);

        const ticketMedio = atendimentosPagos.length > 0 
          ? receitaTotal / atendimentosPagos.length 
          : 0;

        // Calcular variação percentual (comparação com período anterior)
        const periodoAnterior = {
          start: new Date(periodo.start.getTime() - (periodo.end.getTime() - periodo.start.getTime())),
          end: new Date(periodo.start.getTime() - 1),
        };

        const agendamentosPeriodoAnterior = agendamentos.filter(ag => {
          const data = ag.data?.toDate?.() || new Date(ag.data);
          return data >= periodoAnterior.start && data <= periodoAnterior.end;
        });

        const receitaPeriodoAnterior = agendamentosPeriodoAnterior
          .filter(ag => ag.status === 'paid' || ag.status === 'completed')
          .reduce((acc, ag) => acc + (Number(ag.finalPrice || ag.servicoValor) || 0), 0);

        const variacaoReceita = receitaPeriodoAnterior > 0 
          ? ((receitaTotal - receitaPeriodoAnterior) / receitaPeriodoAnterior) * 100
          : 0;

        // Agrupar por forma de pagamento
        const receitasPorFormaPagamento = atendimentosPagos.reduce((acc, ag) => {
          const forma = ag.formaPagamento || 'Não informado';
          acc[forma] = (acc[forma] || 0) + (Number(ag.finalPrice || ag.servicoValor) || 0);
          return acc;
        }, {} as Record<string, number>);

        // Calcular pendências
        const agendamentosPendentes = agendamentosPeriodo
          .filter(ag => ag.status !== 'paid' && ag.status !== 'completed')
          .reduce((acc, ag) => acc + (Number(ag.finalPrice || ag.servicoValor) || 0), 0);

        const naoCompareceram = agendamentosPeriodo.filter(
          ag => ag.status === 'no_show'
        ).length;

                setIndicadores(prev => ({
          ...prev,
          ticketMedio,
          totalAtendimentos: atendimentosPagos.length,
          variacaoReceita,
          receitasPorFormaPagamento,
          agendamentosPendentes,
          naoCompareceram,
        }));
      }
    );

    // Buscar meta mensal
    const unsubscribeMeta = onSnapshot(
      doc(db, 'saloes', user.idSalao, 'metas', 'faturamento'),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const metaData = docSnapshot.data();
          const metaMensal = metaData?.valor || 0;
          
          // Calcular progresso da meta (usar dados do período atual)
          const receitaAtual = indicadores.ticketMedio * indicadores.totalAtendimentos;
          const faltam = Math.max(0, metaMensal - receitaAtual);
          const percentual = metaMensal > 0 ? (receitaAtual / metaMensal) * 100 : 0;

          setIndicadores(prev => ({
            ...prev,
            metaMensal: {
              valor: metaMensal,
              atual: receitaAtual,
              faltam,
              percentual,
            }
          }));
        } else {
          setIndicadores(prev => ({
            ...prev,
            metaMensal: null
          }));
        }
      }
    );

    // Verificar alerta de saúde financeira
    const unsubscribeDespesas = onSnapshot(
      query(
        collection(db, 'saloes', user.idSalao, 'despesas'),
        orderBy('data')
      ),
      (snapshot) => {
        const despesas = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Despesa[];

        const despesasPeriodo = despesas.filter(d => {
          const data = d.data?.toDate?.() || new Date(d.data);
          return data >= periodo.start && data <= periodo.end;
        });

        const totalDespesas = despesasPeriodo.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
        const receitaTotal = indicadores.ticketMedio * indicadores.totalAtendimentos;
        
        const alertaSaudeFinanceira = receitaTotal > 0 && (totalDespesas / receitaTotal) > 0.7;

        setIndicadores(prev => ({
          ...prev,
          alertaSaudeFinanceira,
        }));
      }
    );

    setLoading(false);

    return () => {
      unsubscribeAgendamentos();
      unsubscribeMeta();
      unsubscribeDespesas();
    };
  }, [user?.idSalao, periodo.start, periodo.end]);

  return { indicadores, loading };
} 