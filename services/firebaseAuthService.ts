import {
    browserLocalPersistence,
    getAuth,
    inMemoryPersistence,
    onAuthStateChanged,
    setPersistence,
    signInWithEmailAndPassword,
    signOut,
    User
} from 'firebase/auth';
import { cacheManager } from './cacheManager';
import { app } from './firebase';
import { performanceAnalytics } from './performanceAnalytics';

class FirebaseAuthService {
  private auth = getAuth(app);
  private currentUser: User | null = null;
  private authStateListeners: Array<(user: User | null) => void> = [];

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    const timerId = performanceAnalytics.startTimer('auth_initialization');
    
    try {
      // Configurar persistência baseada na plataforma
      if (typeof window !== 'undefined') {
        // Web - usar persistência local
        await setPersistence(this.auth, browserLocalPersistence);
      } else {
        // React Native - usar persistência em memória (será gerenciada pelo app)
        await setPersistence(this.auth, inMemoryPersistence);
      }

      // Configurar listener de estado de autenticação
      onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user;
        
        // Notificar listeners
        this.authStateListeners.forEach(listener => listener(user));
        
        // Salvar estado no cache
        if (user) {
          cacheManager.set('auth_user', {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            lastLogin: Date.now()
          }, 24 * 60 * 60 * 1000); // 24 horas
        } else {
          cacheManager.remove('auth_user');
        }

        console.log(`🔐 Auth state changed: ${user ? 'logged in' : 'logged out'}`);
      });

      performanceAnalytics.endTimer(timerId, { success: true });
    } catch (error) {
      performanceAnalytics.endTimer(timerId, { error: (error as Error).message });
      console.error('❌ Erro ao inicializar auth:', error);
    }
  }

  async login(email: string, password: string): Promise<User> {
    const timerId = performanceAnalytics.startTimer('auth_login');
    
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      
      // Salvar dados de login no cache
      await cacheManager.set('auth_credentials', {
        email,
        lastLogin: Date.now()
      }, 24 * 60 * 60 * 1000); // 24 horas

      performanceAnalytics.endTimer(timerId, { success: true });
      return user;
    } catch (error) {
      performanceAnalytics.endTimer(timerId, { error: (error as Error).message });
      throw error;
    }
  }

  async logout(): Promise<void> {
    const timerId = performanceAnalytics.startTimer('auth_logout');
    
    try {
      await signOut(this.auth);
      
      // Limpar cache de autenticação
      await cacheManager.remove('auth_user');
      await cacheManager.remove('auth_credentials');
      
      performanceAnalytics.endTimer(timerId, { success: true });
    } catch (error) {
      performanceAnalytics.endTimer(timerId, { error: (error as Error).message });
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Método para verificar se o usuário está logado (com cache)
  async checkAuthStatus(): Promise<boolean> {
    const timerId = performanceAnalytics.startTimer('auth_status_check');
    
    try {
      // Verificar cache primeiro
      const cachedUser = await cacheManager.get('auth_user');
      if (cachedUser) {
        performanceAnalytics.endTimer(timerId, { cacheHit: true });
        return true;
      }

      // Verificar estado atual
      const isAuth = this.isAuthenticated();
      performanceAnalytics.endTimer(timerId, { cacheHit: false });
      return isAuth;
    } catch (error) {
      performanceAnalytics.endTimer(timerId, { error: (error as Error).message });
      return false;
    }
  }

  // Método para renovar token automaticamente
  async refreshToken(): Promise<void> {
    const timerId = performanceAnalytics.startTimer('auth_token_refresh');
    
    try {
      if (this.currentUser) {
        await this.currentUser.getIdToken(true);
        console.log('🔄 Token renovado com sucesso');
      }
      
      performanceAnalytics.endTimer(timerId, { success: true });
    } catch (error) {
      performanceAnalytics.endTimer(timerId, { error: (error as Error).message });
      console.warn('⚠️ Erro ao renovar token:', error);
    }
  }

  // Método para adicionar listener de mudança de estado
  onAuthStateChanged(listener: (user: User | null) => void): () => void {
    this.authStateListeners.push(listener);
    
    // Retornar função para remover listener
    return () => {
      const index = this.authStateListeners.indexOf(listener);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Método para obter dados do usuário do cache
  async getCachedUserData(): Promise<any | null> {
    try {
      return await cacheManager.get('auth_user');
    } catch {
      return null;
    }
  }

  // Método para limpar dados de autenticação
  async clearAuthData(): Promise<void> {
    try {
      await cacheManager.remove('auth_user');
      await cacheManager.remove('auth_credentials');
      console.log('🧹 Dados de autenticação limpos');
    } catch (error) {
      console.warn('⚠️ Erro ao limpar dados de auth:', error);
    }
  }

  // Método para verificar se a sessão expirou
  async isSessionExpired(): Promise<boolean> {
    try {
      const cachedUser = await cacheManager.get('auth_user');
      if (!cachedUser) return true;

      const lastLogin = cachedUser.lastLogin;
      const now = Date.now();
      const sessionDuration = 24 * 60 * 60 * 1000; // 24 horas

      return (now - lastLogin) > sessionDuration;
    } catch {
      return true;
    }
  }

  // Método para obter estatísticas de autenticação
  async getAuthStats(): Promise<{
    isAuthenticated: boolean;
    hasCachedUser: boolean;
    sessionExpired: boolean;
    lastLogin?: number;
  }> {
    const isAuth = this.isAuthenticated();
    const cachedUser = await this.getCachedUserData();
    const sessionExpired = await this.isSessionExpired();

    return {
      isAuthenticated: isAuth,
      hasCachedUser: cachedUser !== null,
      sessionExpired,
      lastLogin: cachedUser?.lastLogin
    };
  }
}

export const firebaseAuthService = new FirebaseAuthService();

// Configurar renovação automática de token
setInterval(() => {
  firebaseAuthService.refreshToken();
}, 30 * 60 * 1000); // A cada 30 minutos 