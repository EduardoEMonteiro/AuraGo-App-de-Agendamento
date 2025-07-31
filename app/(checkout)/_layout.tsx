import { Stack } from 'expo-router';
import React from 'react';

// Este layout simples garante que as telas de sucesso e cancelamento
// sejam renderizadas em seu próprio Stack, sem interferência do RootLayout principal.
export default function CheckoutLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
} 