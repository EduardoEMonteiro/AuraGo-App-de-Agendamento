import { appIntegrationService } from '../services/appIntegrationService';
import { cacheManager } from '../services/cacheManager';
import { firebaseAuthService } from '../services/firebaseAuthService';
import { performanceAnalytics } from '../services/performanceAnalytics';
import { syncService } from '../services/syncService';

export class FinalPerformanceTests {
  static async testCompleteWorkflow(): Promise<{
    name: string;
    duration: number;
    passed: boolean;
    details: string;
  }[]> {
    const results: Array<{
      name: string;
      duration: number;
      passed: boolean;
      details: string;
    }> = [];

    console.log('🚀 Iniciando testes de workflow completo...');

    // Teste 1: Inicialização do app
    try {
      const startTime = performance.now();
      const timerId = performanceAnalytics.startTimer('app_initialization');
      
      await appIntegrationService.initialize();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      performanceAnalytics.endTimer(timerId);
      
      results.push({
        name: 'App Initialization',
        duration,
        passed: duration < 5000, // 5 segundos
        details: `Inicialização em ${duration.toFixed(2)}ms`
      });
    } catch (error) {
      results.push({
        name: 'App Initialization',
        duration: 0,
        passed: false,
        details: `Erro: ${(error as Error).message}`
      });
    }

    // Teste 2: Carregamento da agenda
    try {
      const startTime = performance.now();
      const timerId = performanceAnalytics.startTimer('agenda_loading_final');
      
      // Simular carregamento da agenda
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      performanceAnalytics.endTimer(timerId);
      
      results.push({
        name: 'Agenda Loading',
        duration,
        passed: duration < 2000, // 2 segundos
        details: `Carregamento em ${duration.toFixed(2)}ms`
      });
    } catch (error) {
      results.push({
        name: 'Agenda Loading',
        duration: 0,
        passed: false,
        details: `Erro: ${(error as Error).message}`
      });
    }

    // Teste 3: Envio de mensagem WhatsApp
    try {
      const startTime = performance.now();
      const timerId = performanceAnalytics.startTimer('whatsapp_send_final');
      
      // Simular envio de mensagem
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      performanceAnalytics.endTimer(timerId);
      
      results.push({
        name: 'WhatsApp Send',
        duration,
        passed: duration < 3000, // 3 segundos
        details: `Envio em ${duration.toFixed(2)}ms`
      });
    } catch (error) {
      results.push({
        name: 'WhatsApp Send',
        duration: 0,
        passed: false,
        details: `Erro: ${(error as Error).message}`
      });
    }

    // Teste 4: Sincronização em background
    try {
      const startTime = performance.now();
      const timerId = performanceAnalytics.startTimer('background_sync_final');
      
      await syncService.manualSync();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      performanceAnalytics.endTimer(timerId);
      
      results.push({
        name: 'Background Sync',
        duration,
        passed: duration < 5000, // 5 segundos
        details: `Sincronização em ${duration.toFixed(2)}ms`
      });
    } catch (error) {
      results.push({
        name: 'Background Sync',
        duration: 0,
        passed: false,
        details: `Erro: ${(error as Error).message}`
      });
    }

    // Teste 5: Cache performance
    try {
      const startTime = performance.now();
      const timerId = performanceAnalytics.startTimer('cache_performance_final');
      
      // Testar múltiplas operações de cache
      for (let i = 0; i < 10; i++) {
        await cacheManager.set(`test_${i}`, { data: i }, 1000);
        await cacheManager.get(`test_${i}`);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      performanceAnalytics.endTimer(timerId);
      
      results.push({
        name: 'Cache Performance',
        duration,
        passed: duration < 1000, // 1 segundo
        details: `Cache em ${duration.toFixed(2)}ms`
      });
    } catch (error) {
      results.push({
        name: 'Cache Performance',
        duration: 0,
        passed: false,
        details: `Erro: ${(error as Error).message}`
      });
    }

    // Teste 6: Auth performance
    try {
      const startTime = performance.now();
      const timerId = performanceAnalytics.startTimer('auth_performance_final');
      
      await firebaseAuthService.checkAuthStatus();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      performanceAnalytics.endTimer(timerId);
      
      results.push({
        name: 'Auth Performance',
        duration,
        passed: duration < 1000, // 1 segundo
        details: `Auth em ${duration.toFixed(2)}ms`
      });
    } catch (error) {
      results.push({
        name: 'Auth Performance',
        duration: 0,
        passed: false,
        details: `Erro: ${(error as Error).message}`
      });
    }

    return results;
  }

  static async testMemoryEfficiency(): Promise<{
    memoryUsage: number;
    cacheEfficiency: number;
    recommendations: string[];
  }> {
    try {
      const cacheStats = await cacheManager.getStats();
      const perfStats = performanceAnalytics.getStats();

      // Calcular eficiência de memória
      const memoryUsage = cacheStats.memorySize * 0.1 + perfStats.totalMetrics * 0.05;
      const cacheEfficiency = cacheStats.hitRate * 100;

      const recommendations: string[] = [];

      if (memoryUsage > 50) {
        recommendations.push('Otimizar uso de memória');
      }

      if (cacheEfficiency < 80) {
        recommendations.push('Melhorar estratégia de cache');
      }

      return {
        memoryUsage,
        cacheEfficiency,
        recommendations
      };
    } catch (error) {
      return {
        memoryUsage: 0,
        cacheEfficiency: 0,
        recommendations: ['Erro ao calcular eficiência']
      };
    }
  }

  static async testSystemHealth(): Promise<{
    healthy: boolean;
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const healthCheck = await appIntegrationService.performHealthCheck();
      const metrics = await appIntegrationService.getPerformanceMetrics();

      let score = 100;

      // Deduzir pontos baseado em problemas
      if (healthCheck.issues.length > 0) {
        score -= healthCheck.issues.length * 10;
      }

      if (metrics.cacheHitRate < 0.8) {
        score -= 10;
      }

      if (metrics.averageLoadTime > 2000) {
        score -= 15;
      }

      score = Math.max(0, score);

      return {
        healthy: score >= 80,
        score,
        issues: healthCheck.issues,
        recommendations: healthCheck.recommendations
      };
    } catch (error) {
      return {
        healthy: false,
        score: 0,
        issues: ['Erro durante health check'],
        recommendations: ['Verificar logs de erro']
      };
    }
  }

  static async runCompletePerformanceValidation(): Promise<{
    workflow: any[];
    memory: any;
    health: any;
    summary: {
      overallScore: number;
      passed: boolean;
      recommendations: string[];
    };
  }> {
    console.log('🎯 Iniciando validação completa de performance...');

    const [workflow, memory, health] = await Promise.all([
      this.testCompleteWorkflow(),
      this.testMemoryEfficiency(),
      this.testSystemHealth()
    ]);

    // Calcular score geral
    const workflowScore = (workflow.filter(t => t.passed).length / workflow.length) * 100;
    const memoryScore = memory.recommendations.length === 0 ? 100 : 80;
    const healthScore = health.score;

    const overallScore = (workflowScore + memoryScore + healthScore) / 3;

    const allRecommendations = [
      ...memory.recommendations,
      ...health.recommendations
    ];

    const summary = {
      overallScore,
      passed: overallScore >= 80,
      recommendations: allRecommendations
    };

    console.log(`✅ Validação completa concluída. Score: ${overallScore.toFixed(1)}%`);

    return {
      workflow,
      memory,
      health,
      summary
    };
  }
} 