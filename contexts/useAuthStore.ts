import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { create } from 'zustand';
import { auth, db } from '../services/firebase';

interface AuthState {
  user: any;
  setUser: (user: any) => void;
  logout: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isNavigatingToCheckout: boolean;
  setNavigatingToCheckout: (navigating: boolean) => void;
  selectedPlan: string | null;
  setSelectedPlan: (plan: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isNavigatingToCheckout: false,
  selectedPlan: null,
  setUser: (user) => set({ user, isLoading: false }),
  logout: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
    set({ user: null, isLoading: false });
  },
  setIsLoading: (loading) => set({ isLoading: loading }),
  setNavigatingToCheckout: (navigating) => set({ isNavigatingToCheckout: navigating }),
  setSelectedPlan: (plan) => set({ selectedPlan: plan }),
}));

// Hook para gerenciar o estado de autenticação do Firebase
export function useAuthListener() {
  const { setUser, setIsLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
} 