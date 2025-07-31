import { useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '../contexts/useAuthStore';
import { useSalaoInfo } from '../hooks/useSalaoInfo';
import { useThemeColor } from '../hooks/useThemeColor';
import { db } from '../services/firebase';

export default function AguardandoConfirmacaoScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { loadSalaoInfo } = useSalaoInfo();
  const [statusMessage, setStatusMessage] = useState('Recebemos seu pagamento...');
  
  // Cores do tema
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'text');
  
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!user?.idSalao) {
      Alert.alert("Erro", "Não foi possível identificar seu salão. Por favor, contate o suporte.");
      router.replace('/(tabs)/configuracoes');
      return;
    }

    setStatusMessage('Aguardando a confirmação final do seu plano. Isso pode levar alguns segundos...');

    const salaoRef = doc(db, 'saloes', user.idSalao);

    const unsubscribe = onSnapshot(salaoRef, async (docSnap) => {
      const salaoData = docSnap.data();

      if (salaoData?.statusAssinatura === 'ativa' && !hasRedirected.current) {
        hasRedirected.current = true;
        setStatusMessage('Tudo pronto! Redirecionando...');
        await loadSalaoInfo();

        // REMOVIDO: Navegação imperativa. O RootLayout cuidará do roteamento.
        console.log('Assinatura confirmada. RootLayout redirecionará automaticamente para a agenda.');
        
        setTimeout(() => {
          unsubscribe();
        }, 1500);
      }
    });

    const timeout = setTimeout(() => {
      if (!hasRedirected.current) {
        unsubscribe();
        Alert.alert(
          "Verificação Lenta",
          "A confirmação da sua assinatura está demorando. Já recebemos seu pagamento e o acesso será liberado em breve. Por favor, reinicie o aplicativo em alguns minutos."
        );
        // REMOVIDO: Navegação imperativa. O RootLayout cuidará do roteamento.
        console.log('Timeout atingido. RootLayout cuidará do roteamento.');
      }
    }, 60000); // 60 segundos

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [user?.idSalao, router, loadSalaoInfo]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color={accentColor} />
        <Text style={[styles.title, { color: textColor }]}>Quase lá!</Text>
        <Text style={[styles.subtitle, { color: textColor }]}>
          {statusMessage}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('5%'),
  },
  title: {
    fontSize: hp('3.5%'),
    fontWeight: 'bold',
    marginTop: hp('3%'),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: hp('2%'),
    marginTop: hp('1.5%'),
    textAlign: 'center',
  },
}); 