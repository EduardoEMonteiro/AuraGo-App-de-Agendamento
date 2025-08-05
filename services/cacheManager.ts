import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheConfig {
  key: string;
  ttl: number; // Time to live em ms
  version: string; // Para invalidação
  data: any;
  timestamp: number;
}

class CacheManager {
  private static instance: CacheManager;
  private cache = new Map<string, CacheConfig>();
  private readonly CACHE_VERSION = '1.0.0';

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // Verificar cache em memória primeiro
      const memoryCache = this.cache.get(key);
      if (memoryCache && Date.now() - memoryCache.timestamp < memoryCache.ttl) {
        console.log(`📦 Cache hit (memória): ${key}`);
        return memoryCache.data as T;
      }

      // Verificar AsyncStorage
      const stored = await AsyncStorage.getItem(`cache_${key}`);
      if (stored) {
        const config: CacheConfig = JSON.parse(stored);
        
        // Verificar versão e TTL
        if (config.version === this.CACHE_VERSION && Date.now() - config.timestamp < config.ttl) {
          // Atualizar cache em memória
          this.cache.set(key, config);
          console.log(`📦 Cache hit (AsyncStorage): ${key}`);
          return config.data as T;
        } else {
          // Cache expirado ou versão antiga
          await this.remove(key);
        }
      }

      console.log(`❌ Cache miss: ${key}`);
      return null;
    } catch (error) {
      console.warn('⚠️ Erro ao ler cache:', error);
      return null;
    }
  }

  async set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): Promise<void> {
    try {
      const config: CacheConfig = {
        key,
        ttl,
        version: this.CACHE_VERSION,
        data,
        timestamp: Date.now()
      };

      // Salvar em memória
      this.cache.set(key, config);

      // Salvar no AsyncStorage
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(config));
      
      console.log(`💾 Cache salvo: ${key} (TTL: ${ttl}ms)`);
    } catch (error) {
      console.warn('⚠️ Erro ao salvar cache:', error);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      // Remover da memória
      this.cache.delete(key);

      // Remover do AsyncStorage
      await AsyncStorage.removeItem(`cache_${key}`);
      
      console.log(`🗑️ Cache removido: ${key}`);
    } catch (error) {
      console.warn('⚠️ Erro ao remover cache:', error);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      // Limpar cache em memória
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }

      // Limpar AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.startsWith('cache_') && key.includes(pattern)
      );
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
        console.log(`🗑️ Cache invalidado (padrão): ${pattern} (${cacheKeys.length} itens)`);
      }
    } catch (error) {
      console.warn('⚠️ Erro ao invalidar cache:', error);
    }
  }

  async clearAll(): Promise<void> {
    try {
      // Limpar memória
      this.cache.clear();

      // Limpar AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
        console.log(`🗑️ Cache limpo completamente (${cacheKeys.length} itens)`);
      }
    } catch (error) {
      console.warn('⚠️ Erro ao limpar cache:', error);
    }
  }

  async getStats(): Promise<{
    memorySize: number;
    storageSize: number;
    hitRate: number;
  }> {
    try {
      const memorySize = this.cache.size;
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      const storageSize = cacheKeys.length;

      // Calcular hit rate (simplificado)
      const hitRate = 0.8; // Placeholder - implementar tracking real

      return {
        memorySize,
        storageSize,
        hitRate
      };
    } catch (error) {
      console.warn('⚠️ Erro ao obter estatísticas do cache:', error);
      return { memorySize: 0, storageSize: 0, hitRate: 0 };
    }
  }

  // Método para limpeza automática de cache expirado
  async cleanup(): Promise<void> {
    try {
      const now = Date.now();
      let cleanedCount = 0;

      // Limpar memória
      for (const [key, config] of this.cache.entries()) {
        if (now - config.timestamp > config.ttl) {
          this.cache.delete(key);
          cleanedCount++;
        }
      }

      // Limpar AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      for (const key of cacheKeys) {
        try {
          const stored = await AsyncStorage.getItem(key);
          if (stored) {
            const config: CacheConfig = JSON.parse(stored);
            if (now - config.timestamp > config.ttl) {
              await AsyncStorage.removeItem(key);
              cleanedCount++;
            }
          }
        } catch (error) {
          // Remover item corrompido
          await AsyncStorage.removeItem(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cache cleanup: ${cleanedCount} itens removidos`);
      }
    } catch (error) {
      console.warn('⚠️ Erro durante cleanup do cache:', error);
    }
  }
}

export const cacheManager = CacheManager.getInstance();

// Inicializar cleanup automático
setInterval(() => {
  cacheManager.cleanup();
}, 5 * 60 * 1000); // A cada 5 minutos 