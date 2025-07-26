import { usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '../contexts/useAuthStore';
import { useSalaoInfo } from '../hooks/useSalaoInfo';
import SelecaoPlanoScreen from '../screens/SelecaoPlanoScreen';

export function PlanoVerification({ children }: { children: React.ReactNode }) {
  const { user, isNavigatingToCheckout } = useAuthStore();
  const { salaoInfo, loading } = useSalaoInfo();
  const [isChecking, setIsChecking] = useState(true);
  const pathname = usePathname();

  console.log('PlanoVerification - Pathname atual:', pathname);
  console.log('PlanoVerification - isNavigatingToCheckout:', isNavigatingToCheckout);

  useEffect(() => {
    console.log('PlanoVerification - Debug:', {
      userId: user?.id,
      idSalao: user?.idSalao,
      salaoInfo: salaoInfo?.plano,
      loading,
      isChecking,
      pathname
    });

    if (!loading) {
      // Se o usuário não tem salão, deve escolher plano primeiro
      if (!user?.idSalao) {
        console.log('PlanoVerification - Usuário sem salão, redirecionando para seleção de plano');
        setIsChecking(false);
        return;
      }
      
      // Se tem salão mas não tem plano, redirecionar para seleção
      if (!salaoInfo?.plano) {
        console.log('PlanoVerification - Salão sem plano, redirecionando para seleção');
        setIsChecking(false);
        return;
      }
      
      console.log('PlanoVerification - Salão com plano ativo, permitindo acesso');
      setIsChecking(false);
    }
  }, [salaoInfo, loading, user?.idSalao, pathname]);

  // Permitir acesso direto à tela de checkout
  if (pathname === '/stripe-checkout' || pathname.includes('stripe-checkout')) {
    console.log('PlanoVerification - Permitindo acesso à tela de checkout');
    return <>{children}</>;
  }

  // Se estamos tentando navegar para checkout, permitir temporariamente
  if (isNavigatingToCheckout) {
    console.log('PlanoVerification - Permitindo navegação para checkout (estado global)');
    return <>{children}</>;
  }

  if (isChecking || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Verificando plano...</Text>
      </View>
    );
  }

  // Se não tem salão ou não tem plano, mostrar tela de seleção
  if (!user?.idSalao || !salaoInfo?.plano) {
    // Se tem salão mas não tem plano, mostrar seleção de plano
    if (user?.idSalao && !salaoInfo?.plano) {
      console.log('PlanoVerification - Salão sem plano, redirecionando para seleção');
      return <SelecaoPlanoScreen />;
    }
    // Se não tem salão, mostrar seleção de plano
    return <SelecaoPlanoScreen />;
  }

  console.log('PlanoVerification - Renderizando children (app principal)');
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
}); 