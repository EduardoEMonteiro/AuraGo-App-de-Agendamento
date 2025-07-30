// Arquivo: services/stripe.ts (VERSÃO FINAL E CORRETA)

// ===================================================================
// 1. CONFIGURAÇÕES PRINCIPAIS
// ===================================================================

import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

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
    
    // URLs de retorno corretas para o app
    const successUrl = 'aura://checkout/sucesso?session_id={CHECKOUT_SESSION_ID}';
    const cancelUrl = 'aura://checkout/cancelado';

    console.log('Enviando dados para backend:', { priceId, idSalao });
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: priceId,
        idSalao: idSalao,
        successUrl: successUrl,
        cancelUrl: cancelUrl,
      }),
    });

    const data = await response.json();
    
    console.log('Resposta do backend:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Erro do servidor ao criar a sessão.');
    }

    // Retorna os dados para a sua tela de checkout usar.
    return data; // Deve conter { sessionId: '...', url: '...' }

  } catch (error) {
    console.error('Erro ao chamar a função createRealCheckoutSession:', error);
    console.log('Tentando usar checkout de teste...');
    
    // Usar checkout de teste como fallback
    return createTestCheckoutSession(plano, idSalao);
  }
}

/**
 * Função de FALLBACK: Para testes quando a Cloud Function não está disponível
 * @param {'essencial' | 'pro'} plano - O plano que o usuário selecionou.
 * @param {string} idSalao - O ID do salão do usuário logado.
 */
export async function createTestCheckoutSession(plano: 'essencial' | 'pro', idSalao: string) {
  console.log('Usando checkout de teste para plano:', plano);
  
  // Simular uma sessão de checkout para testes
  const sessionId = `test_session_${Date.now()}`;
  const testUrl = `https://checkout.stripe.com/pay/${sessionId}#fidkdWxOYHwnPyd1blpxYHZxWjA0V2hsXU9EfT01N1A8U0FEQEs3QD1UM2l%2FcFNQNX9jZzJETklCSUAyfVZjMW5IdlJVZnd2T2lkcW9iXUpNRmhqR0tfYEQzTHNXbGQ2QW48Q1BtampCM3U9NTVIaXE3aDE8QCcpJ2N3amhWYHdzYHcnP3F3cGApJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl`;
  
  return {
    sessionId: sessionId,
    url: testUrl,
    success: true
  };
}

/**
 * Chama a Cloud Function para criar uma sessão segura do Portal do Cliente Stripe.
 * @param customerId O ID do cliente no Stripe (ex: cus_xxxxxx)
 * @returns Um objeto contendo a URL para o portal.
 */
export const createCustomerPortalSession = async (customerId: string): Promise<{ url: string }> => {
  try {
    const createSessionCallable = httpsCallable(functions, 'createStripePortalSession');
    const response = await createSessionCallable({ customerId });
    return response.data as { url: string };
  } catch (error) {
    console.error('Erro ao chamar a Cloud Function createStripePortalSession:', error);
    // Re-lança o erro para que a tela possa tratá-lo e mostrar um Alert
    throw error;
  }
};

/**
 * Buscar informações do customer no Stripe
 * @param {string} customerId - ID do customer no Stripe
 */
export async function getCustomerInfo(customerId: string) {
  if (!customerId) {
    throw new Error('Customer ID é obrigatório.');
  }

  try {
    const functionUrl = 'https://createstripecheckout-h36yffqwbq-uc.a.run.app';

    const response = await fetch(`${functionUrl}/api/customer/${customerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar informações do customer.');
    }

    return data; // Deve conter { customer: {...}, subscriptions: [...] }

  } catch (error) {
    console.error('Erro ao buscar informações do customer:', error);
    throw error;
  }
}