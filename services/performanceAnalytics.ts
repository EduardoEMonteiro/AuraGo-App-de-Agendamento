interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  totalMetrics: number;
  averageDuration: number;
  slowestOperation: string;
  fastestOperation: string;
  cacheHitRate: number;
}

class PerformanceAnalytics {
  private metrics: PerformanceMetric[] = [];
  private isEnabled = __DEV__;
  private cacheHits = 0;
  private cacheMisses = 0;

  startTimer(name: string, metadata?: Record<string, any>): string {
    if (!this.isEnabled) return '';

    const timerId = `${name}_${Date.now()}`;
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      endTime: 0,
      duration: 0,
      metadata
    };

    this.metrics.push(metric);
    console.log(`⏱️ Iniciando timer: ${name}`, metadata);
    return timerId;
  }

  endTimer(timerId: string, additionalMetadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const metric = this.metrics.find(m => m.name === timerId.split('_')[0]);
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      
      if (additionalMetadata) {
        metric.metadata = { ...metric.metadata, ...additionalMetadata };
      }

      console.log(`⏱️ ${metric.name}: ${metric.duration.toFixed(2)}ms`, metric.metadata);
      
      // Alertar se operação for muito lenta
      if (metric.duration > 3000) {
        console.warn(`⚠️ Operação lenta detectada: ${metric.name} (${metric.duration.toFixed(2)}ms)`);
      }
    }
  }

  recordCacheHit(): void {
    this.cacheHits++;
  }

  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  getCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    return total > 0 ? this.cacheHits / total : 0;
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getStats(): PerformanceStats {
    if (this.metrics.length === 0) {
      return {
        totalMetrics: 0,
        averageDuration: 0,
        slowestOperation: '',
        fastestOperation: '',
        cacheHitRate: this.getCacheHitRate()
      };
    }

    const durations = this.metrics.map(m => m.duration);
    const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    
    const slowest = this.metrics.reduce((prev, current) => 
      prev.duration > current.duration ? prev : current
    );
    
    const fastest = this.metrics.reduce((prev, current) => 
      prev.duration < current.duration ? prev : current
    );

    return {
      totalMetrics: this.metrics.length,
      averageDuration,
      slowestOperation: `${slowest.name} (${slowest.duration.toFixed(2)}ms)`,
      fastestOperation: `${fastest.name} (${fastest.duration.toFixed(2)}ms)`,
      cacheHitRate: this.getCacheHitRate()
    };
  }

  clearMetrics(): void {
    this.metrics = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    console.log('📊 Métricas de performance limpas');
  }

  logStats(): void {
    const stats = this.getStats();
    console.log('📊 Performance Stats:', {
      totalMetrics: stats.totalMetrics,
      averageDuration: `${stats.averageDuration.toFixed(2)}ms`,
      slowestOperation: stats.slowestOperation,
      fastestOperation: stats.fastestOperation,
      cacheHitRate: `${(stats.cacheHitRate * 100).toFixed(1)}%`
    });
  }

  // Métodos específicos para operações críticas
  async measureAgendaLoading(): Promise<number> {
    const timerId = this.startTimer('agenda_loading');
    
    // Simular operação
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.endTimer(timerId);
    const metric = this.metrics.find(m => m.name === 'agenda_loading');
    return metric ? metric.duration : 0;
  }

  async measureWhatsAppSending(): Promise<number> {
    const timerId = this.startTimer('whatsapp_sending');
    
    // Simular operação
    await new Promise(resolve => setTimeout(resolve, 50));
    
    this.endTimer(timerId);
    const metric = this.metrics.find(m => m.name === 'whatsapp_sending');
    return metric ? metric.duration : 0;
  }

  async measureCacheOperation(operation: () => Promise<any>): Promise<{ duration: number; result: any }> {
    const timerId = this.startTimer('cache_operation');
    
    try {
      const result = await operation();
      this.recordCacheHit();
      this.endTimer(timerId, { cacheHit: true });
      
      const metric = this.metrics.find(m => m.name === 'cache_operation');
      return {
        duration: metric ? metric.duration : 0,
        result
      };
    } catch (error) {
      this.recordCacheMiss();
      this.endTimer(timerId, { cacheHit: false, error: error.message });
      
      const metric = this.metrics.find(m => m.name === 'cache_operation');
      return {
        duration: metric ? metric.duration : 0,
        result: null
      };
    }
  }
}

export const performanceAnalytics = new PerformanceAnalytics();

// Log de estatísticas a cada 5 minutos em desenvolvimento
if (__DEV__) {
  setInterval(() => {
    performanceAnalytics.logStats();
  }, 5 * 60 * 1000);
} 