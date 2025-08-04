import React from 'react';
import { Button, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomHeader } from '../../components/CustomHeader';
import { initializeStripe } from '../../services/stripe';
import { StripeCheckoutWeb } from '../components/StripeCheckoutWeb';
import { StripeProviderUniversal } from '../components/StripeProviderUniversal';

const planos = [
  { id: 'essencial', nome: 'Essencial', priceId: 'price_1RmlBgAx802U9VDAtycmj1KL', preco: 19.9 },
];

export default function PlanoScreen({ user }) {
  React.useEffect(() => {
    if (Platform.OS !== 'web') initializeStripe();
  }, []);

  const [planoEscolhido, setPlanoEscolhido] = React.useState(planos[0]);

  function handleAssinar() {
    if (Platform.OS === 'web') {
      // O botão StripeCheckoutWeb será exibido
    } else {
      // Fluxo nativo: chamar initializeStripe e PaymentSheet normalmente
      // ...
      alert('Fluxo nativo: implementar checkout nativo aqui');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Escolha seu Plano" showBackButton={false} />
      <StripeProviderUniversal>
        <View style={styles.content}>
          <Text style={styles.title}>Escolha seu plano</Text>
          {planos.map(plano => (
            <Button
              key={plano.id}
              title={`${plano.nome} - R$ ${plano.preco}`}
              onPress={() => setPlanoEscolhido(plano)}
              color={planoEscolhido.id === plano.id ? '#635bff' : '#ccc'}
            />
          ))}
          <View style={styles.buttonContainer}>
            {Platform.OS === 'web' ? (
              <StripeCheckoutWeb plano={planoEscolhido.priceId} idSalao={user?.idSalao} />
            ) : (
              <Button title="Assinar" onPress={handleAssinar} color="#635bff" />
            )}
          </View>
        </View>
      </StripeProviderUniversal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 32,
  },
}); 