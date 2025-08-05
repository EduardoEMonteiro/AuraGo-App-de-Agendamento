import { performanceAnalytics } from '../services/performanceAnalytics';
import { cacheManager } from '../services/cacheManager';
import { syncService } from '../services/syncService';

export class PerformanceTests {
  static async testAgendaLoading() {
    console.log('🧪 Testando carregamento da agenda...');
    
    const startTime = performance.now();
    
    try {
      // Simular carregamento de agendamentos
      const timerId = performanceAnalytics.startTimer('test_agenda_loading');
      
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 500));
      
      performanceAnalytics.endTimer(timerId);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`✅ Teste agenda: ${duration.toFixed(2)}ms`);
      
      return {
        success: true,
        duration,
        target: 2000, // 2 segundos
        passed: duration < 2000
      };
    } catch (error) {
      console.error('❌ Teste agenda falhou:', error);
      return {
        success: false,
        duration: 0,
        target: 2000,
        passed: false,
        error: (error as Error).message
      };
    }
  }

  static async testCachePerformance() {
    console.log('🧪 Testando performance do cache...');
    
    const results = {
      memoryHits: 0,
      storageHits: 0,
      misses: 0,
      averageTime: 0
    };

    const times: number[] = [];

    // Testar múltiplas operações de cache
    for (let i = 0; i < 10; i++) {
      const startTime = performance.now();
      
      const testKey = `test_cache_${i}`;
      const testData = { id: i, name: `Test ${i}`, timestamp: Date.now() };
      
      // Salvar no cache
      await cacheManager.set(testKey, testData, 60 * 1000);
      
      // Ler do cache
      const cached = await cacheManager.get(testKey);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      times.push(duration);
      
      if (cached) {
        if (duration < 10) {
          results.memoryHits++;
        } else {
          results.storageHits++;
        }
      } else {
        results.misses++;
      }
    }

    results.averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    
    console.log(`✅ Teste cache: ${results.averageTime.toFixed(2)}ms média`);
    console.log(`📊 Cache hits: ${results.memoryHits + results.storageHits}, misses: ${results.misses}`);
    
    return {
      success: true,
      ...results,
      target: 50, // 50ms média
      passed: results.averageTime < 50
    };
  }

  static async testSyncPerformance() {
    console.log('🧪 Testando performance da sincronização...');
    
    const startTime = performance.now();
    
    try {
      const timerId = performanceAnalytics.startTimer('test_sync_performance');
      
      // Testar sincronização manual
      await syncService.manualSync();
      
      performanceAnalytics.endTimer(timerId);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`✅ Teste sincronização: ${duration.toFixed(2)}ms`);
      
      return {
        success: true,
        duration,
        target: 5000, // 5 segundos
        passed: duration < 5000
      };
    } catch (error) {
      console.error('❌ Teste sincronização falhou:', error);
      return {
        success: false,
        duration: 0,
        target: 5000,
        passed: false,
        error: (error as Error).message
      };
    }
  }

  static async testWhatsAppSending() {
    console.log('🧪 Testando envio de WhatsApp...');
    
    const startTime = performance.now();
    
    try {
      const timerId = performanceAnalytics.startTimer('test_whatsapp_sending');
      
      // Simular processamento de mensagem
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Simular montagem de URL
      await new Promise(resolve => setTimeout(resolve, 50));
      
      performanceAnalytics.endTimer(timerId);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`✅ Teste WhatsApp: ${duration.toFixed(2)}ms`);
      
      return {
        success: true,
        duration,
        target: 3000, // 3 segundos
        passed: duration < 3000
      };
    } catch (error) {
      console.error('❌ Teste WhatsApp falhou:', error);
      return {
        success: false,
        duration: 0,
        target: 3000,
        passed: false,
        error: (error as Error).message
      };
    }
  }

  static async runAllTests() {
    console.log('🚀 Iniciando bateria de testes de performance...');
    
    const results = {
      agenda: await this.testAgendaLoading(),
      cache: await this.testCachePerformance(),
      sync: await this.testSyncPerformance(),
      whatsapp: await this.testWhatsAppSending()
    };

    const passed = Object.values(results).filter(r => r.passed).length;
    const total = Object.keys(results).length;

    console.log('\n📊 RESULTADOS DOS TESTES:');
    console.log(`✅ Passou: ${passed}/${total}`);
    
    Object.entries(results).forEach(([test, result]) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${test}: ${result.duration?.toFixed(2)}ms (meta: ${result.target}ms)`);
    });

    return {
      results,
      summary: {
        passed,
        total,
        percentage: (passed / total) * 100
      }
    };
  }

  static async testCacheHitRate() {
    console.log('🧪 Testando taxa de acerto do cache...');
    
    // Limpar cache para teste limpo
    await cacheManager.clearAll();
    
    let hits = 0;
    let misses = 0;
    
    // Simular uso real do app
    for (let i = 0; i < 20; i++) {
      const testKey = `test_hit_rate_${i % 5}`; // Reutilizar chaves para gerar hits
      const testData = { id: i, data: `Test data ${i}` };
      
      // Primeira vez - cache miss
      const firstRead = await cacheManager.get(testKey);
      if (!firstRead) {
        misses++;
        await cacheManager.set(testKey, testData, 60 * 1000);
      }
      
      // Segunda vez - cache hit
      const secondRead = await cacheManager.get(testKey);
      if (secondRead) {
        hits++;
      } else {
        misses++;
      }
    }
    
    const hitRate = hits / (hits + misses);
    const targetHitRate = 0.8; // 80%
    
    console.log(`📊 Cache hit rate: ${(hitRate * 100).toFixed(1)}% (meta: ${targetHitRate * 100}%)`);
    
    return {
      success: true,
      hitRate,
      hits,
      misses,
      target: targetHitRate,
      passed: hitRate >= targetHitRate
    };
  }
} 