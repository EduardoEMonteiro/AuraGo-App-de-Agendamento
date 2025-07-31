import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { create } from 'zustand';
import { auth, db } from '../services/firebase';

interface AuthState {
  user: any;
  setUser: (user: any) => void;
  updateUser: (updates: Partial<any>) => void;
  logout: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  selectedPlan: string | null;
  setSelectedPlan: (plan: string | null) => void;
  refreshUser: () => Promise<void>; // Nova função
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
  logout: async () => {
    try {
      console.log('Iniciando logout...');
      await signOut(auth);
      console.log('Logout do Firebase concluído');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
    console.log('Limpando estado do usuário');
    set({ user: null, isLoading: false });
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
            setUser({
              id: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              emailVerified: user.emailVerified,
              role: userData.role || 'gerente',
              idSalao: userData.idSalao || null,
              ...userData, // Inclui todos os outros dados do Firestore
            });
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