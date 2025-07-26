// Arquivo: services/stripe.ts (VERSÃO FINAL E CORRETA)

// ===================================================================
// 1. CONFIGURAÇÕES PRINCIPAIS
// ===================================================================

// Sua chave PUBLICÁVEL de teste.
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RmiXJAx802U9VDAEN2E8Q6lzuVU0zfb7AKLGLE7xSf4kMsWPcrsJlatjgXOHCmoBNZeA6IvRia3Dk9FUhooG6p800Mlt2m49E';

// IDs dos seus planos no Stripe (price_...).
export const STRIPE_PRICE_IDS = {
  essencial: 'price_1RmlBgAx802U9VDAtycmj1KL', // ID do seu plano Essencial
  pro: 'price_ID_DO_PLANO_PRO_AQUI',           // Coloque o ID do plano Pro quando tiver
};

// ===================================================================
// 2. FUNÇÕES DO SERVIÇO STRIPE
// ===================================================================

/**
 * Inicializa a biblioteca do Stripe quando seu app abre.
 */
export async function initializeStripe() {
  try {
    const { initStripe } = require('@stripe/stripe-react-native');
    await initStripe({
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      merchantIdentifier: 'merchant.com.aura.app', // Opcional, para Apple Pay
    });
    console.log('Stripe inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar Stripe:', error);
  }
}

/**
 * Função PRINCIPAL: Chama seu backend no Firebase para criar a sessão de checkout.
 * @param {'essencial' | 'pro'} plano - O plano que o usuário selecionou.
 * @param {string} idSalao - O ID do salão do usuário logado (ex: user.idSalao).
 */
export async function createRealCheckoutSession(plano: 'essencial' | 'pro', idSalao: string) {
  const priceId = STRIPE_PRICE_IDS[plano];
  if (!priceId || priceId.includes('SEU_ID')) {
    throw new Error(`Plano '${plano}' inválido ou ID de preço não configurado.`);
  }
  if (!idSalao) {
    throw new Error('ID do Salão é obrigatório para o checkout.');
  }

  try {
    // A URL da sua Cloud Function que está no ar.
    const functionUrl = 'https://createstripecheckout-h36yffqwbq-uc.a.run.app';

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: priceId,
        // << MUDANÇA IMPORTANTE: Enviando idSalao >>
        idSalao: idSalao,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro do servidor ao criar a sessão.');
    }

    // Retorna os dados para a sua tela de checkout usar.
    return data; // Deve conter { sessionId: '...', url: '...' }

  } catch (error) {
    console.error('Erro ao chamar a função createRealCheckoutSession:', error);
    throw error;
  }
}
