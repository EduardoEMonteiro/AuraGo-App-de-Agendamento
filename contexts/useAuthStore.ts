import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { create } from 'zustand';
import { auth, db } from '../services/firebase';
import { isTrialExpired } from '../utils/trialUtils';

interface AuthState {
  user: any;
  setUser: (user: any) => void;
  updateUser: (updates: Partial<any>) => void;
  updateUserPlano: (salaoInfo: any) => void;
  logout: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  selectedPlan: string | null;
  setSelectedPlan: (plan: string | null) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  selectedPlan: null,
  setUser: (user) => set({ user, isLoading: false }),
  updateUser: (updates) => set((state) => {
    console.log('useAuthStore - updateUser chamado com:', updates);
    const updatedUser = state.user ? { ...state.user, ...updates } : null;
    console.log('useAuthStore - usuário atualizado:', updatedUser);
    return { user: updatedUser };
  }),
  updateUserPlano: (salaoInfo) => {
    if (salaoInfo && salaoInfo.plano && salaoInfo.statusAssinatura) {
      console.log('useAuthStore - Atualizando plano do usuário:', salaoInfo.plano, 'status:', salaoInfo.statusAssinatura);
      set((state) => ({
        user: state.user ? {
          ...state.user,
          plano: salaoInfo.plano,
          statusAssinatura: salaoInfo.statusAssinatura
        } : null
      }));
    }
  },
  logout: async () => {
    try {
      console.log('Iniciando logout...');
      
      // Resetar status da tela de boas-vindas
      if (get().user?.uid) {
        try {
          await AsyncStorage.removeItem(`welcome_shown_${get().user?.uid}`);
          console.log('Status da tela de boas-vindas resetado');
        } catch (error) {
          console.log('Erro ao resetar status da tela de boas-vindas:', error);
        }
      }
      
      await signOut(auth);
      console.log('Logout do Firebase concluído');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
    console.log('Limpando estado do usuário');
    set({ user: null, isLoading: false, selectedPlan: null });
  },
  setIsLoading: (loading) => set({ isLoading: loading }),
  setSelectedPlan: (plan) => set({ selectedPlan: plan }),
  refreshUser: async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Força a atualização do token para pegar o status mais recente do emailVerified
        await currentUser.reload();
        console.log('refreshUser - emailVerified atualizado:', currentUser.emailVerified);
        
        // Atualiza o estado com os dados mais recentes
        const currentState = get();
        if (currentState.user) {
          set({
            user: {
              ...currentState.user,
              emailVerified: currentUser.emailVerified,
            }
          });
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  },
}));

// Hook para gerenciar o estado de autenticação do Firebase
export function useAuthListener() {
  const { setUser, setIsLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('AuthStateChanged - Usuário:', user ? user.uid : 'null');
      if (user) {
        try {
          // Busca os dados completos do usuário no Firestore
          const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Verifica se o trial expirou e ajusta o plano adequadamente
            let plano: string | null = 'trial'; // Sempre começa como trial
            if (userData.freeTrialExpiresAt) {
              const trialExpired = isTrialExpired(userData.freeTrialExpiresAt);
              if (trialExpired) {
                console.log('Trial expirado detectado, ajustando plano para null');
                plano = null; // ou 'expired' se preferir
              }
            }
            
            // Cria o objeto do usuário SEM incluir userData.plano para evitar sobrescrita
            const userObject = {
              id: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              emailVerified: user.emailVerified,
              role: userData.role || 'gerente',
              idSalao: userData.idSalao || null,
              // CAMPOS DO TRIAL GRATUITO - sobrescrevem os dados do Firestore
              plano: plano, // Este valor ajustado sobrescreve o do Firestore
              freeTrialStartAt: userData.freeTrialStartAt || null,
              freeTrialExpiresAt: userData.freeTrialExpiresAt || null,
              statusAssinatura: userData.statusAssinatura || 'trial',
            };
            
            // Adiciona todos os outros dados do Firestore, EXCETO plano
            const { plano: _, ...userDataWithoutPlano } = userData;
            
            // Força o valor do plano correto
            const finalUserObject = {
              ...userDataWithoutPlano,
              ...userObject, // Isso sobrescreve userData com os valores corretos
              plano: plano, // Força o valor correto
            };
            
            console.log('useAuthStore - Definindo usuário com plano:', plano);
            setUser(finalUserObject);
          } else {
            // Usuário existe no Auth mas não no Firestore (caso raro)
            setUser({
              id: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              emailVerified: user.emailVerified,
              role: 'gerente',
              idSalao: null,
              // CAMPOS DO TRIAL GRATUITO
              plano: 'trial',
              freeTrialStartAt: null,
              freeTrialExpiresAt: null,
              statusAssinatura: 'trial',
            });
          }
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
          // Fallback com dados básicos
          setUser({
            id: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            role: 'gerente',
            idSalao: null,
            // CAMPOS DO TRIAL GRATUITO com valores padrão
            plano: 'trial',
            freeTrialStartAt: null,
            freeTrialExpiresAt: null,
            statusAssinatura: 'trial',
          });
        }
      } else {
        // Usuário não está logado
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setIsLoading]);

  // Adicionar listener para mudanças no usuário (incluindo emailVerified)
  useEffect(() => {
    const unsubscribe = auth.onIdTokenChanged(async (user) => {
      if (user) {
        console.log('IdTokenChanged - emailVerified:', user.emailVerified);
        // Atualizar apenas o emailVerified se o usuário já existe no estado
        const currentState = useAuthStore.getState();
        if (currentState.user && currentState.user.id === user.uid) {
          setUser({
            ...currentState.user,
            emailVerified: user.emailVerified,
          });
        }
      }
    });

    return () => unsubscribe();
  }, [setUser]);
} 