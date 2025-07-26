# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Estrutura Inicial do Projeto

- `screens/`: Telas principais da aplicação
- `components/`: Componentes reutilizáveis
- `contexts/`: Estado global (Zustand/Jotai)
- `services/`: Serviços externos (Firebase, Google Sign-In)

## Configuração Firebase
Edite `services/firebase.ts` e adicione suas credenciais do Firebase.

## Google Sign-In
Edite `services/googleSignIn.ts` e adicione seu `webClientId` do Firebase.

## Tailwind/NativeWind
- O Tailwind já está configurado em `tailwind.config.js` e `postcss.config.js`.
- Use classes utilitárias direto no `className` dos componentes.

## Estado Global
- Exemplo com Zustand: `contexts/useAuthStore.ts`
- Exemplo com Jotai: `contexts/useJotaiAuth.ts`

## Formulários
- Exemplo de Formik + Yup + máscara: `screens/FormExampleScreen.tsx`

## Navegação
- Instale as dependências do React Navigation e configure as rotas em `app/`.

## Máscara de Telefone
- Exemplo de uso em `screens/FormExampleScreen.tsx` com `react-native-masked-text`.

# Aura - App de Gestão para Salões

## Fluxo de Pagamento com Stripe

### Fluxo Atual (Simulação)
1. Usuário seleciona plano
2. Mock do Stripe cria sessão
3. Tela de checkout simula pagamento
4. Frontend atualiza plano no Firebase (APENAS PARA TESTE)
5. App permite acesso

### Fluxo Real em Produção
1. Usuário seleciona plano
2. Cloud Function cria sessão real do Stripe
3. Usuário completa pagamento no Stripe
4. Stripe envia webhook para nosso servidor
5. Servidor verifica assinatura do webhook
6. Servidor atualiza plano no Firebase
7. App detecta mudança e permite acesso

### Implementação do Webhook (Futuro)
```javascript
// Cloud Function para webhook do Stripe
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = 'whsec_...'; // Secret do webhook
  
  try {
    const event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Atualizar plano no Firebase
      const salaoRef = doc(db, 'saloes', session.metadata.salaoId);
      await updateDoc(salaoRef, {
        plano: session.metadata.plano,
        dataAtivacao: new Date(),
        status: 'ativo',
        sessionId: session.id
      });
    }
    
    res.json({received: true});
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```

### Segurança
- ✅ Webhook verifica assinatura do Stripe
- ✅ Apenas servidor atualiza plano
- ✅ Frontend não pode manipular pagamentos
- ✅ Logs de auditoria completos
