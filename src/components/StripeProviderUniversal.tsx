import React, { PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import { STRIPE_PUBLISHABLE_KEY } from '../../services/stripe';

export function StripeProviderUniversal({ children }: PropsWithChildren<{}>) {
  if (Platform.OS === 'web') {
    const { Elements } = require('@stripe/react-stripe-js');
    const { loadStripe } = require('@stripe/stripe-js');
    const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
    return <Elements stripe={stripePromise}>{children}</Elements>;
  } else {
    const { StripeProvider } = require('@stripe/stripe-react-native');
    return <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>{children}</StripeProvider>;
  }
} 