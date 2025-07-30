import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

type CustomHeaderProps = {
  title: string;
  showBackButton?: boolean;
};

export const CustomHeader = ({ title, showBackButton = true }: CustomHeaderProps) => {
  // --- LÓGICA DE NAVEGAÇÃO DEFENSIVA ---
  let router: any;
  let navigation: any;
  let canGoBack = false;

  try {
    router = useRouter();
    navigation = useNavigation();
    canGoBack = navigation.canGoBack();
  } catch (e) {
    // Hooks falham em contextos sem um navegador pai (como testes ou erros de setup).
    // Tratamos isso de forma segura, assumindo que não há para onde voltar.
    console.log('CustomHeader: Navigation context not found. Hiding back button.');
  }
  // --- FIM DA LÓGICA DEFENSIVA ---

  const handleBackPress = useCallback(() => {
    try {
      // A lógica de verificação permanece aqui como uma salvaguarda
      if (router && canGoBack) {
        router.back();
      } else if (router) {
        // Fallback: se não conseguir verificar canGoBack, tenta voltar mesmo assim
        router.back();
      }
    } catch (error) {
      console.log('CustomHeader: Error during back navigation:', error);
    }
  }, [router, canGoBack]);

  return (
    <View style={styles.header}>
      {showBackButton ? (
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Feather name="arrow-left" size={hp('3%')} color="#666666" />
        </TouchableOpacity>
      ) : (
        // Se não houver botão, não renderizamos nada no lugar
        null
      )}
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    minHeight: hp('7%'),
  },
  backButton: {
    paddingRight: wp('4%'), // Espaçamento entre o botão e o título
    paddingVertical: hp('1%'),
  },
  headerTitle: {
    flex: 1, // Faz o título ocupar o espaço restante
    fontSize: hp('3%'), // Tamanho de fonte consistente
    fontWeight: 'bold',
    textAlign: 'left', // Alinhamento à esquerda como padrão
    color: '#000000',
  },
}); 