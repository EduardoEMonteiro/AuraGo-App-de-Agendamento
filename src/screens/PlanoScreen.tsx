import React from 'react';
import { Button, Platform, Text, View } from 'react-native';
import { initializeStripe } from '../../services/stripe';
import { StripeCheckoutWeb } from '../components/StripeCheckoutWeb';
import { StripeProviderUniversal } from '../components/StripeProviderUniversal';

const planos = [
  { id: 'essencial', nome: 'Essencial', priceId: 'price_1RmlBgAx802U9VDAtycmj1KL', preco: 49.9 },
  { id: 'pro', nome: 'Pro', priceId: 'price_ID_DO_PLANO_PRO_AQUI', preco: 99.9 },
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
    <StripeProviderUniversal>
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Escolha seu plano</Text>
        {planos.map(plano => (
          <Button
            key={plano.id}
            title={`${plano.nome} - R$ ${plano.preco}`}
            onPress={() => setPlanoEscolhido(plano)}
            color={planoEscolhido.id === plano.id ? '#635bff' : '#ccc'}
          />
        ))}
        <View style={{ marginTop: 32 }}>
          {Platform.OS === 'web' ? (
            <StripeCheckoutWeb plano={planoEscolhido.priceId} idSalao={user?.idSalao} />
          ) : (
            <Button title="Assinar" onPress={handleAssinar} color="#635bff" />
          )}
        </View>
      </View>
    </StripeProviderUniversal>
  );
} 