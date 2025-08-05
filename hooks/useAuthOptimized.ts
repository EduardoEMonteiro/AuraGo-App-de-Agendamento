import { useCallback, useEffect, useState } from 'react';
import { firebaseAuthService } from '../services/firebaseAuthService';
import { performanceAnalytics } from '../services/performanceAnalytics';

interface AuthState {
  user: any | null;
  loading: boolean;
  error: string | null;
}

export function useAuthOptimized() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  const checkAuthStatus = useCallback(async () => {
    const timerId = performanceAnalytics.startTimer('auth_status_check');
    
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      // Verificar status de autenticação
      const isAuthenticated = await firebaseAuthService.checkAuthStatus();
      
      if (isAuthenticated) {
        const currentUser = firebaseAuthService.getCurrentUser();
        setAuthState({
          user: currentUser,
          loading: false,
          error: null
        });
      } else {
        setAuthState({
          user: null,
          loading: false,
          error: null
        });
      }

      performanceAnalytics.endTimer(timerId, { success: true });
    } catch (error) {
      setAuthState({
        user: null,
        loading: false,
        error: (error as Error).message
      });
      performanceAnalytics.endTimer(timerId, { error: (error as Error).message });
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const timerId = performanceAnalytics.startTimer('auth_login');
    
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const user = await firebaseAuthService.login(email, password);
      
      setAuthState({
        user,
        loading: false,
        error: null
      });

      performanceAnalytics.endTimer(timerId, { success: true });
      return user;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: (error as Error).message
      }));
      performanceAnalytics.endTimer(timerId, { error: (error as Error).message });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    const timerId = performanceAnalytics.startTimer('auth_logout');
    
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      await firebaseAuthService.logout();
      
      setAuthState({
        user: null,
        loading: false,
        error: null
      });

      performanceAnalytics.endTimer(timerId, { success: true });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: (error as Error).message
      }));
      performanceAnalytics.endTimer(timerId, { error: (error as Error).message });
      throw error;
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    await checkAuthStatus();
  }, [checkAuthStatus]);

  // Configurar listener de mudança de estado
  useEffect(() => {
    const unsubscribe = firebaseAuthService.onAuthStateChanged((user) => {
      setAuthState({
        user,
        loading: false,
        error: null
      });
    });

    // Verificar status inicial
    checkAuthStatus();

    return unsubscribe;
  }, [checkAuthStatus]);

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    login,
    logout,
    refreshAuth,
    isAuthenticated: !!authState.user
  };
} 