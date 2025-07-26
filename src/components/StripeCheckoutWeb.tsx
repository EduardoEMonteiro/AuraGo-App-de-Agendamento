import { useStripe } from '@stripe/react-stripe-js';
import React, { useState } from 'react';

export function StripeCheckoutWeb({ plano, idSalao }) {
  const stripe = useStripe();
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      // Chama seu backend para criar a sessão de checkout
      const response = await fetch('https://createstripecheckout-h36yffqwbq-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plano, idSalao }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erro ao criar sessão Stripe');
      // Redireciona para o Stripe Checkout
      await stripe.redirectToCheckout({ sessionId: data.sessionId });
    } catch (e) {
      alert('Erro ao iniciar pagamento: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleCheckout} disabled={loading} style={{ padding: 16, fontSize: 18, background: '#635bff', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
      {loading ? 'Redirecionando...' : 'Assinar'}
    </button>
  );
} 