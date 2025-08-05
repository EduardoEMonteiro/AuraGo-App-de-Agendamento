import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { cacheManager } from './cacheManager';
import { performanceAnalytics } from './performanceAnalytics';

class SyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline = true;
  private isSyncing = false;
  private lastSyncTime: Date | null = null;

  startSync() {
    console.log('🔄 Iniciando sincronização em background...');
    
    // Sincronizar a cada 30 segundos quando online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncData();
      }
    }, 30000); // 30 segundos
  }

  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('🛑 Sincronização em background parada');
    }
  }

  setOnlineStatus(online: boolean) {
    this.isOnline = online;
    console.log(`🌐 Status online: ${online}`);
    
    if (online && !this.syncInterval) {
      this.startSync();
    }
  }

  private async syncData() {
    if (this.isSyncing) return;

    this.isSyncing = true;
    const timerId = performanceAnalytics.startTimer('background_sync');

    try {
      console.log('🔄 Iniciando sincronização em background...');
      
      // Sincronizar dados críticos
      await Promise.all([
        this.syncAgendamentos(),
        this.syncBloqueios(),
        this.syncDadosEstaticos()
      ]);

      this.lastSyncTime = new Date();
      console.log('✅ Sincronização em background concluída');
      
      performanceAnalytics.endTimer(timerId, { success: true });
    } catch (error) {
      console.warn('⚠️ Erro na sincronização em background:', error);
      performanceAnalytics.endTimer(timerId, { error: (error as Error).message });
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncAgendamentos() {
    try {
      // Buscar agendamentos dos próximos 7 dias
      const hoje = new Date();
      const proximos7Dias = Array.from({ length: 7 }, (_, i) => {
        const data = new Date(hoje);
        data.setDate(hoje.getDate() + i);
        return data.toISOString().split('T')[0];
      });

      for (const data of proximos7Dias) {
        const q = query(
          collection(db, 'saloes', 'test_salao_001', 'agendamentos'),
          where('dataDia', '==', data),
          where('status', 'in', ['agendado', 'paid'])
        );

        const snapshot = await getDocs(q);
        const agendamentos = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Salvar no cache
        await cacheManager.set(`agendamentos_test_salao_001_${data}`, agendamentos, 10 * 60 * 1000);
      }

      console.log('📅 Agendamentos sincronizados (próximos 7 dias)');
    } catch (error) {
      console.error('❌ Erro ao sincronizar agendamentos:', error);
    }
  }

  private async syncBloqueios() {
    try {
      // Buscar bloqueios dos próximos 30 dias
      const hoje = new Date();
      const proximos30Dias = Array.from({ length: 30 }, (_, i) => {
        const data = new Date(hoje);
        data.setDate(hoje.getDate() + i);
        return data.toISOString().split('T')[0];
      });

      for (const data of proximos30Dias) {
        const q = query(
          collection(db, 'saloes', 'test_salao_001', 'bloqueios'),
          where('data', '==', data)
        );

        const snapshot = await getDocs(q);
        const bloqueios = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        await cacheManager.set(`bloqueios_test_salao_001_${data}`, bloqueios, 30 * 60 * 1000);
      }

      console.log('🔒 Bloqueios sincronizados (próximos 30 dias)');
    } catch (error) {
      console.error('❌ Erro ao sincronizar bloqueios:', error);
    }
  }

  private async syncDadosEstaticos() {
    try {
      const [clientesSnap, servicosSnap] = await Promise.all([
        getDocs(collection(db, 'saloes', 'test_salao_001', 'clientes')),
        getDocs(query(
          collection(db, 'saloes', 'test_salao_001', 'servicos'),
          where('ativo', '==', true)
        ))
      ]);

      const clientes = clientesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const servicos = servicosSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      await cacheManager.set('dados_estaticos_test_salao_001', {
        clientes,
        servicos
      }, 60 * 60 * 1000); // 1 hora

      console.log('📊 Dados estáticos sincronizados');
    } catch (error) {
      console.error('❌ Erro ao sincronizar dados estáticos:', error);
    }
  }

  // Método para sincronização manual
  async manualSync() {
    console.log('🔄 Iniciando sincronização manual...');
    await this.syncData();
  }

  // Método para obter status da sincronização
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      syncInterval: this.syncInterval !== null
    };
  }

  // Método para limpar cache e forçar nova sincronização
  async forceSync() {
    console.log('🔄 Forçando sincronização completa...');
    
    // Limpar cache
    await cacheManager.clearAll();
    
    // Sincronizar novamente
    await this.syncData();
    
    console.log('✅ Sincronização forçada concluída');
  }
}

export const syncService = new SyncService();

// Inicializar sincronização automaticamente
syncService.startSync();

// Monitorar status de conectividade
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncService.setOnlineStatus(true);
  });

  window.addEventListener('offline', () => {
    syncService.setOnlineStatus(false);
  });
} 