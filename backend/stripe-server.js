// Exemplo de servidor backend para integração com Stripe
// Este arquivo serve como referência para implementar no seu backend

const express = require('express');
const stripe = require('stripe')('sk_test_...'); // Sua chave secreta do Stripe
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// IDs dos produtos no Stripe
const STRIPE_PRODUCTS = {
  essencial: {
    priceId: 'price_essencial_monthly', // ID do produto no Stripe
    name: 'Plano Essencial',
    price: 1990, // R$ 19,90 em centavos
  }
};

// Criar sessão de checkout
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { priceId, idSalao } = req.body;
    
    console.log('Criando sessão de checkout:', { priceId, idSalao });

    // Criar sessão de checkout para o plano selecionado
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: 'aura://checkout/sucesso?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'aura://checkout/cancelado',
      metadata: {
        idSalao: idSalao,
        priceId: priceId,
      },
    });

    console.log('Sessão criada:', {
      sessionId: session.id,
      successUrl: session.success_url,
      cancelUrl: session.cancel_url
    });

    res.json({
      success: true,
      url: session.url,
      sessionId: session.id
    });

  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar sessão de checkout'
    });
  }
});

// Verificar status do pagamento
app.get('/api/payment-status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;



    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    res.json({
      payment_status: session.payment_status,
      customer_email: session.customer_email,
      plano: session.metadata?.plano
    });

  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar status do pagamento'
    });
  }
});

// Ativar plano essencial (gratuito)
app.post('/api/activate-essencial-plan', async (req, res) => {
  try {
    const { customerEmail, plano } = req.body;

    // Aqui você pode registrar o plano essencial no seu banco de dados
    // Por exemplo, criar um registro de assinatura gratuita

    res.json({
      success: true,
      plano: plano,
      customerEmail: customerEmail,
      status: 'active'
    });

  } catch (error) {
    console.error('Erro ao ativar plano essencial:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao ativar plano essencial'
    });
  }
});

// Webhook para eventos do Stripe
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = 'whsec_...'; // Seu webhook secret

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Erro no webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Lidar com eventos
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Pagamento concluído:', session.id);
      
      // Aqui você pode:
      // 1. Ativar o plano do usuário
      // 2. Enviar e-mail de confirmação
      // 3. Atualizar o banco de dados
      
      break;
      
    case 'customer.subscription.created':
      const subscription = event.data.object;
      console.log('Assinatura criada:', subscription.id);
      break;
      
    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object;
      console.log('Assinatura atualizada:', updatedSubscription.id);
      break;
      
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      console.log('Assinatura cancelada:', deletedSubscription.id);
      break;
      
    default:
      console.log(`Evento não tratado: ${event.type}`);
  }

  res.json({ received: true });
});

// Criar sessão do Customer Portal
app.post('/api/create-portal-session', async (req, res) => {
  try {
    const { customerId, returnUrl } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID é obrigatório'
      });
    }

    // Criar sessão do Customer Portal
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || 'aura://account',
    });

    res.json({
      success: true,
      url: session.url
    });

  } catch (error) {
    console.error('Erro ao criar sessão do portal:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar sessão do portal'
    });
  }
});

// Buscar informações do customer
app.get('/api/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await stripe.customers.retrieve(customerId);
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all'
    });

    res.json({
      success: true,
      customer: customer,
      subscriptions: subscriptions.data
    });

  } catch (error) {
    console.error('Erro ao buscar customer:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar informações do customer'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app; 