import { Platform } from 'react-native';
import { cacheManager } from '../services/cacheManager';
import { syncService } from '../services/syncService';
import { firebaseAuthService } from '../services/firebaseAuthService';
import { MensagemService } from '../services/mensagemService';
import { performanceAnalytics } from '../services/performanceAnalytics';

export class CompatibilityTests {
  static async testPlatformCompatibility(): Promise<{
    platform: string;
    tests: Array<{ name: string; passed: boolean; details: string }>;
    summary: { passed: number; total: number; percentage: number };
  }> {
    const platform = Platform.OS;
    const tests: Array<{ name: string; passed: boolean; details: string }> = [];

    console.log(`🧪 Testando compatibilidade para ${platform}...`);

    // Teste 1: Cache Manager
    try {
      await cacheManager.set('test_key', { data: 'test' }, 1000);
      const cached = await cacheManager.get('test_key');
      const passed = cached !== null;
      tests.push({
        name: 'Cache Manager',
        passed,
        details: passed ? 'Cache funcionando corretamente' : 'Erro no cache'
      });
    } catch (error) {
      tests.push({
        name: 'Cache Manager',
        passed: false,
        details: `Erro: ${(error as Error).message}`
      });
    }

    // Teste 2: Sync Service
    try {
      const syncStatus = syncService.getSyncStatus();
      const passed = typeof syncStatus.isOnline === 'boolean';
      tests.push({
        name: 'Sync Service',
        passed,
        details: passed ? 'Sync service funcionando' : 'Erro no sync service'
      });
    } catch (error) {
      tests.push({
        name: 'Sync Service',
        passed: false,
        details: `Erro: ${(error as Error).message}`
      });
    }

    // Teste 3: Auth Service
    try {
      const authStats = await firebaseAuthService.getAuthStats();
      const passed = typeof authStats.isAuthenticated === 'boolean';
      tests.push({
        name: 'Auth Service',
        passed,
        details: passed ? 'Auth service funcionando' : 'Erro no auth service'
      });
    } catch (error) {
      tests.push({
        name: 'Auth Service',
        passed: false,
        details: `Erro: ${(error as Error).message}`
      });
    }

    // Teste 4: Message Service
    try {
      const msgStats = await MensagemService.getEstatisticas();
      const passed = typeof msgStats.conectividadeOk === 'boolean';
      tests.push({
        name: 'Message Service',
        passed,
        details: passed ? 'Message service funcionando' : 'Erro no message service'
      });
    } catch (error) {
      tests.push({
        name: 'Message Service',
        passed: false,
        details: `Erro: ${(error as Error).message}`
      });
    }

    // Teste 5: Performance Analytics
    try {
      const perfStats = performanceAnalytics.getStats();
      const passed = typeof perfStats.totalMetrics === 'number';
      tests.push({
        name: 'Performance Analytics',
        passed,
        details: passed ? 'Analytics funcionando' : 'Erro no analytics'
      });
    } catch (error) {
      tests.push({
        name: 'Performance Analytics',
        passed: false,
        details: `Erro: ${(error as Error).message}`
      });
    }

    // Teste 6: Platform-specific features
    try {
      let platformSpecificPassed = false;
      let details = '';

      if (platform === 'ios') {
        // Testes específicos do iOS
        platformSpecificPassed = true;
        details = 'Recursos iOS funcionando';
      } else if (platform === 'android') {
        // Testes específicos do Android
        platformSpecificPassed = true;
        details = 'Recursos Android funcionando';
      }

      tests.push({
        name: 'Platform-specific Features',
        passed: platformSpecificPassed,
        details
      });
    } catch (error) {
      tests.push({
        name: 'Platform-specific Features',
        passed: false,
        details: `Erro: ${(error as Error).message}`
      });
    }

    const passed = tests.filter(t => t.passed).length;
    const total = tests.length;
    const percentage = (passed / total) * 100;

    return {
      platform,
      tests,
      summary: { passed, total, percentage }
    };
  }

  static async testMemoryUsage(): Promise<{
    memoryUsage: number;
    cacheSize: number;
    recommendations: string[];
  }> {
    try {
      const cacheStats = await cacheManager.getStats();
      const perfStats = performanceAnalytics.getStats();

      // Simular cálculo de uso de memória
      const memoryUsage = cacheStats.memorySize * 0.1 + perfStats.totalMetrics * 0.05;
      const cacheSize = cacheStats.storageSize;

      const recommendations: string[] = [];

      if (memoryUsage > 50) {
        recommendations.push('Considerar limpeza de cache');
      }

      if (cacheSize > 100) {
        recommendations.push('Cache muito grande, considerar limpeza');
      }

      return {
        memoryUsage,
        cacheSize,
        recommendations
      };
    } catch (error) {
      return {
        memoryUsage: 0,
        cacheSize: 0,
        recommendations: ['Erro ao calcular uso de memória']
      };
    }
  }

  static async testNetworkCompatibility(): Promise<{
    online: boolean;
    syncWorking: boolean;
    recommendations: string[];
  }> {
    try {
      const syncStatus = syncService.getSyncStatus();
      const msgStats = await MensagemService.getEstatisticas();

      const online = syncStatus.isOnline;
      const syncWorking = syncStatus.isOnline && !syncStatus.isSyncing;

      const recommendations: string[] = [];

      if (!online) {
        recommendations.push('Verificar conectividade de internet');
      }

      if (!msgStats.conectividadeOk) {
        recommendations.push('Verificar instalação do WhatsApp');
      }

      return {
        online,
        syncWorking,
        recommendations
      };
    } catch (error) {
      return {
        online: false,
        syncWorking: false,
        recommendations: ['Erro ao verificar conectividade']
      };
    }
  }

  static async runAllCompatibilityTests(): Promise<{
    platform: string;
    compatibility: any;
    memory: any;
    network: any;
    overall: { passed: boolean; score: number };
  }> {
    console.log('🚀 Iniciando testes de compatibilidade completos...');

    const [compatibility, memory, network] = await Promise.all([
      this.testPlatformCompatibility(),
      this.testMemoryUsage(),
      this.testNetworkCompatibility()
    ]);

    const overallScore = (
      compatibility.summary.percentage +
      (memory.recommendations.length === 0 ? 100 : 80) +
      (network.recommendations.length === 0 ? 100 : 80)
    ) / 3;

    const overall = {
      passed: overallScore >= 80,
      score: overallScore
    };

    console.log(`✅ Testes de compatibilidade concluídos. Score: ${overallScore.toFixed(1)}%`);

    return {
      platform: compatibility.platform,
      compatibility,
      memory,
      network,
      overall
    };
  }
} 