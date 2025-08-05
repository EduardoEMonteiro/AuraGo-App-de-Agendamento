import { cacheManager } from './cacheManager';
import { syncService } from './syncService';
import { firebaseAuthService } from './firebaseAuthService';
import { MensagemService } from './mensagemService';
import { performanceAnalytics } from './performanceAnalytics';

class AppIntegrationService {
  private static instance: AppIntegrationService;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  static getInstance(): AppIntegrationService {
    if (!AppIntegrationService.instance) {
      AppIntegrationService.instance = new AppIntegrationService();
    }
    return AppIntegrationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    const timerId = performanceAnalytics.startTimer('app_integration_initialization');
    
    try {
      console.log('🚀 Iniciando integração completa do app...');

      // 1. Inicializar cache manager
      console.log('📦 Inicializando Cache Manager...');
      await cacheManager.clearAll(); // Limpar cache antigo
      
      // 2. Inicializar sincronização
      console.log('🔄 Inicializando Sync Service...');
      syncService.startSync();
      
      // 3. Verificar autenticação
      console.log('🔐 Verificando autenticação...');
      const authStats = await firebaseAuthService.getAuthStats();
      console.log('Auth Stats:', authStats);
      
      // 4. Testar conectividade de mensagens
      console.log('💬 Testando conectividade de mensagens...');
      const msgStats = await MensagemService.getEstatisticas();
      console.log('Message Stats:', msgStats);
      
      // 5. Executar sincronização inicial
      console.log('🔄 Executando sincronização inicial...');
      await syncService.manualSync();
      
      this.isInitialized = true;
      console.log('✅ Integração completa finalizada com sucesso!');
      
      performanceAnalytics.endTimer(timerId, { success: true });
    } catch (error) {
      console.error('❌ Erro durante inicialização:', error);
      performanceAnalytics.endTimer(timerId, { error: (error as Error).message });
      throw error;
    }
  }

  async getSystemStatus(): Promise<{
    cache: any;
    sync: any;
    auth: any;
    messages: any;
    performance: any;
  }> {
    const timerId = performanceAnalytics.startTimer('system_status_check');
    
    try {
      const [cacheStats, syncStatus, authStats, msgStats, perfStats] = await Promise.all([
        cacheManager.getStats(),
        syncService.getSyncStatus(),
        firebaseAuthService.getAuthStats(),
        MensagemService.getEstatisticas(),
        performanceAnalytics.getStats()
      ]);

      const status = {
        cache: cacheStats,
        sync: syncStatus,
        auth: authStats,
        messages: msgStats,
        performance: perfStats
      };

      performanceAnalytics.endTimer(timerId, { success: true });
      return status;
    } catch (error) {
      performanceAnalytics.endTimer(timerId, { error: (error as Error).message });
      throw error;
    }
  }

  async performHealthCheck(): Promise<{
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Verificar cache
      const cacheStats = await cacheManager.getStats();
      if (cacheStats.hitRate < 0.7) {
        issues.push('Cache hit rate baixo');
        recommendations.push('Considerar aumentar TTL do cache');
      }

      // Verificar sincronização
      const syncStatus = syncService.getSyncStatus();
      if (!syncStatus.isOnline) {
        issues.push('App offline');
        recommendations.push('Verificar conectividade');
      }

      // Verificar autenticação
      const authStats = await firebaseAuthService.getAuthStats();
      if (authStats.sessionExpired) {
        issues.push('Sessão expirada');
        recommendations.push('Renovar login');
      }

      // Verificar mensagens
      const msgStats = await MensagemService.getEstatisticas();
      if (!msgStats.conectividadeOk) {
        issues.push('WhatsApp não disponível');
        recommendations.push('Verificar instalação do WhatsApp');
      }

      const healthy = issues.length === 0;

      return {
        healthy,
        issues,
        recommendations
      };
    } catch (error) {
      return {
        healthy: false,
        issues: ['Erro durante health check'],
        recommendations: ['Verificar logs de erro']
      };
    }
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Iniciando limpeza do sistema...');
    
    try {
      // Parar sincronização
      syncService.stopSync();
      
      // Limpar cache
      await cacheManager.clearAll();
      
      // Limpar dados de auth
      await firebaseAuthService.clearAuthData();
      
      console.log('✅ Limpeza concluída');
    } catch (error) {
      console.error('❌ Erro durante limpeza:', error);
    }
  }

  async forceRefresh(): Promise<void> {
    console.log('🔄 Forçando refresh completo...');
    
    try {
      // Limpar cache
      await cacheManager.clearAll();
      
      // Forçar sincronização
      await syncService.forceSync();
      
      // Renovar token
      await firebaseAuthService.refreshToken();
      
      console.log('✅ Refresh completo concluído');
    } catch (error) {
      console.error('❌ Erro durante refresh:', error);
    }
  }

  // Método para obter métricas de performance
  async getPerformanceMetrics(): Promise<{
    cacheHitRate: number;
    averageLoadTime: number;
    syncFrequency: number;
    authSuccessRate: number;
  }> {
    const cacheStats = await cacheManager.getStats();
    const perfStats = performanceAnalytics.getStats();
    const syncStatus = syncService.getSyncStatus();
    const authStats = await firebaseAuthService.getAuthStats();

    return {
      cacheHitRate: cacheStats.hitRate,
      averageLoadTime: perfStats.averageDuration,
      syncFrequency: syncStatus.isOnline ? 30 : 0, // segundos
      authSuccessRate: authStats.isAuthenticated ? 1 : 0
    };
  }
}

export const appIntegrationService = AppIntegrationService.getInstance(); 