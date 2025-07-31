import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColor } from '../../hooks/useThemeColor';

export default function CheckoutSuccessScreen() {
  const router = useRouter();
  const backgroundColor = useThemeColor({ light: '#E8F5E9', dark: '#1B5E20' }, 'background');
  const textColor = useThemeColor({ light: '#1B5E20', dark: '#E8F5E9' }, 'text');
  const accentColor = useThemeColor({ light: '#2E7D32', dark: '#4CAF50' }, 'text');

  useEffect(() => {
    // Após 3 segundos, redireciona para a tela de espera do webhook.
    const timer = setTimeout(() => {
      router.replace('/aguardando-confirmacao');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={styles.container}>
        <Feather name="check-circle" size={hp('10%')} color={accentColor} />
        <Text style={[styles.title, { color: textColor }]}>Pagamento Realizado!</Text>
        <Text style={[styles.subtitle, { color: textColor }]}>
          Seu pagamento foi processado com sucesso. Estamos preparando tudo para você...
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