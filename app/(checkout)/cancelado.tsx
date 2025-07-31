import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColor } from '../../hooks/useThemeColor';

export default function CheckoutCancelScreen() {
  const router = useRouter();
  const backgroundColor = useThemeColor({ light: '#FFEBEE', dark: '#B71C1C' }, 'background');
  const textColor = useThemeColor({ light: '#B71C1C', dark: '#FFCDD2' }, 'text');
  const accentColor = useThemeColor({ light: '#D32F2F', dark: '#EF5350' }, 'text');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={styles.container}>
        <Feather name="x-circle" size={hp('10%')} color={accentColor} />
        <Text style={[styles.title, { color: textColor }]}>Pagamento Cancelado</Text>
        <Text style={[styles.subtitle, { color: textColor }]}>
          O pagamento foi cancelado. Você pode tentar novamente a qualquer momento.
        </Text>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: accentColor }]}
          onPress={() => router.replace('/selecao-plano')}
        >
          <Text style={[styles.buttonText, { color: backgroundColor }]}>
            Tentar Novamente
          </Text>
        </TouchableOpacity>
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
    marginBottom: hp('5%'),
  },
  button: {
    paddingHorizontal: wp('8%'),
    paddingVertical: hp('2%'),
    borderRadius: 12,
    marginTop: hp('3%'),
  },
  buttonText: {
    fontSize: hp('2%'),
    fontWeight: 'bold',
  },
}); 