📱 AuraGo App - Sistema Completo de Gestão para Salões

🚀 Status: Em desenvolvimento • React Native • Firebase • Stripe
📱 Plataformas: Android & iOS (Cross-platform)
🏗️ Arquitetura: Full-Stack com Expo + Firebase + Cloud Functions

Sistema profissional de gestão para salões de beleza, incluindo agendamentos, clientes, pagamentos e analytics em tempo real.


🎯 Visão Geral

O AuraGo App é uma solução completa de gestão para salões de beleza e barbearias, desenvolvida com tecnologias modernas para oferecer uma experiência premium tanto para donos de estabelecimentos quanto para seus clientes.

Problema Resolvido

· Gestão manual e desorganizada de agendamentos
· Falta de sistema integrado cliente-serviço
· Dificuldade em analisar métricas de negócio
· Processo de pagamento fragmentado

Nossa Solução

· ✅ Sistema unificado de agendamentos
· ✅ Gestão completa de clientes e serviços
· ✅ Pagamentos integrados com Stripe
· ✅ Analytics em tempo real
· ✅ Experiência mobile-first

🏗️ Arquitetura Técnica

```
📱 FRONTEND (Mobile)
├── Framework: React Native (Expo)
├── Linguagem: TypeScript
├── UI: NativeWind (Tailwind para React Native)
├── Navegação: React Navigation
├── Estado: Zustand + Jotai
└── Formulários: Formik + Yup

🔥 BACKEND & INFRA
├── Banco de Dados: Firebase Firestore (NoSQL)
├── Autenticação: Firebase Auth + Google Sign-In
├── Storage: Firebase Storage (imagens)
├── Pagamentos: Stripe API + Cloud Functions
├── Hosting: Firebase Hosting (web admin)
└── Analytics: Firebase Analytics + Crashlytics

☁️ SERVERLESS
├── Cloud Functions: Webhooks Stripe, notificações
├── Triggers: Firestore triggers para automatização
└── Schedule: Tarefas agendadas (backups, relatórios)
```

🎨 Funcionalidades Principais

1. 📅 Sistema de Agendamentos Inteligente

· Cliente:
  · Busca por salões próximos
  · Agendamento em 3 cliques (serviço, profissional, horário)
  · Lembretes automáticos (push/email/SMS)
  · Histórico completo
· Salão:
  · Agenda visual intuitiva (calendário/semana/dia)
  · Bloqueio de horários
  · Gestão de múltiplos profissionais
  · Overbooking prevention

2. 👥 CRM Integrado

· Ficha completa do cliente:
  · Histórico de serviços
  · Preferências (profissional, horário)
  · Anotações pessoais
  · Fotos "antes/depois"
· Segmentação:
  · Tags personalizadas
  · Clientes recorrentes vs. novos
  · Aniversariantes do mês

3. 💰 Sistema de Pagamentos com Stripe

```typescript
// Fluxo completo de pagamento
1. Seleção de plano → 2. Checkout Stripe → 3. Webhook → 4. Ativação
```

Planos disponíveis:

· Básico: Gestão de agenda + clientes (R$ 49/mês)
· Pro: Básico + pagamentos integrados (R$ 99/mês)
· Premium: Pro + analytics avançado (R$ 199/mês)

4. 📊 Dashboard de Analytics

· Métricas em tempo real:
  · Taxa de ocupação
  · Ticket médio
  · Clientes recorrentes
  · Horários mais populares
· Relatórios:
  · Faturamento diário/semanal/mensal
  · Performance por profissional
  · Comparativo período vs período

5. 🔔 Sistema de Notificações

· Tipos:
  · Confirmação de agendamento
  · Lembrete 24h antes
  · Promoções personalizadas
  · Aniversário do cliente
· Canais: Push, SMS, WhatsApp, Email

6. 🛠️ Gestão do Salão

· Catálogo de serviços: Preços, duração, profissionais
· Equipe: Horários, comissões, especialidades
· Estoque: Produtos utilizados nos serviços
· Financeiro: Contas a pagar/receber, comissões

⚙️ Configuração e Execução

Pré-requisitos

```bash
# Node.js 18+
node --version

# Expo CLI
npm install -g expo-cli

# Firebase CLI (opcional)
npm install -g firebase-tools

# EAS CLI (para builds)
npm install -g eas-cli
```

Passo a Passo para Desenvolvimento

```bash
# 1. Clone o repositório
git clone https://github.com/EduardoEMonteiro/AuraGo-App-de-Agendamento.git
cd AuraGo-App-de-Agendamento

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas chaves:
# - Firebase config
# - Stripe keys
# - Google Sign-In

# 4. Inicie o projeto
npx expo start

# 5. Escolha como executar:
# - Expo Go (QR code)
# - Android Emulator
# - iOS Simulator
# - Dispositivo físico
```

Configuração do Firebase

1. Crie projeto em console.firebase.google.com
2. Adicione app Android/iOS
3. Baixe google-services.json (Android) e GoogleService-Info.plist (iOS)
4. Coloque na raiz do projeto
5. Ative os serviços:
   · Authentication (Email/Google)
   · Firestore Database
   · Storage
   · Cloud Functions

Configuração do Stripe (Produção)

```javascript
// Cloud Functions para webhook
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = 'whsec_...'; // Secret do webhook
  
  try {
    const event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    
    switch (event.type) {
      case 'checkout.session.completed':
        await handleSuccessfulPayment(event);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event);
        break;
      // ... outros eventos
    }
    
    res.json({received: true});
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```

📁 Estrutura do Projeto

```
AuraGo-App-de-Agendamento/
├── app/                          # Rotas e navegação (Expo Router)
│   ├── (auth)/                   # Rotas de autenticação
│   ├── (app)/                    # Rotas principais do app
│   └── _layout.tsx               # Layout raiz
│
├── screens/                      # Telas principais
│   ├── Auth/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   └── ForgotPasswordScreen.tsx
│   ├── Main/
│   │   ├── DashboardScreen.tsx
│   │   ├── ScheduleScreen.tsx
│   │   ├── ClientsScreen.tsx
│   │   └── PaymentsScreen.tsx
│   └── Settings/
│
├── components/                   # Componentes reutilizáveis
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   ├── schedule/
│   │   ├── CalendarView.tsx
│   │   └── TimeSlotPicker.tsx
│   └── payments/
│       └── PlanCard.tsx
│
├── contexts/                     # Estado global
│   ├── AuthContext.tsx
│   ├── ScheduleContext.tsx
│   └── PaymentContext.tsx
│
├── services/                     # Integrações externas
│   ├── firebase/
│   │   ├── firestore.ts
│   │   ├── auth.ts
│   │   └── storage.ts
│   ├── stripe/
│   │   ├── payment.ts
│   │   └── subscriptions.ts
│   └── notifications/
│       ├── push.ts
│       └── email.ts
│
├── utils/                        # Utilitários
│   ├── validators.ts
│   ├── formatters.ts
│   └── constants.ts
│
├── types/                        # Tipos TypeScript
│   ├── user.ts
│   ├── schedule.ts
│   └── payment.ts
│
├── assets/                       # Recursos estáticos
│   ├── images/
│   ├── icons/
│   └── fonts/
│
└── config/                       # Configurações
    ├── firebaseConfig.ts
    ├── stripeConfig.ts
    └── appConfig.ts
```

💳 Sistema de Pagamentos - Implementação Completa

Arquitetura de Pagamentos

```
FRONTEND (React Native)
    ↓
STRIPE CHECKOUT / ELEMENTS
    ↓
STRIPE API (createPaymentIntent)
    ↓
WEBHOOK → CLOUD FUNCTIONS
    ↓
FIREBASE FIRESTORE (update status)
    ↓
FRONTEND (update UI)
```

Código do Webhook (Produção)

```typescript
// functions/src/stripe-webhook.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16',
});

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      functions.config().stripe.webhook_secret
    );

    const data = event.data.object;
    const eventType = event.type;

    switch (eventType) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(data);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(data);
        break;
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(data);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(data);
        break;
    }

    res.json({ received: true });
  } catch (err: any) {
    functions.logger.error('Webhook error:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

async function handleCheckoutSessionCompleted(session: any) {
  const salaoId = session.metadata.salaoId;
  const userId = session.metadata.userId;
  const plano = session.metadata.plano;
  
  const db = admin.firestore();
  
  // Atualizar status do salão
  await db.collection('saloes').doc(salaoId).update({
    plano,
    planoStatus: 'ativo',
    dataAtivacao: admin.firestore.FieldValue.serverTimestamp(),
    stripeCustomerId: session.customer,
    stripeSubscriptionId: session.subscription,
  });
  
  // Registrar transação
  await db.collection('transactions').add({
    salaoId,
    userId,
    amount: session.amount_total / 100,
    currency: session.currency,
    status: 'completed',
    stripeSessionId: session.id,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  // Enviar notificação
  await sendNotification(userId, 'Pagamento confirmado! Seu plano foi ativado.');
}
```

Fluxo Seguro de Pagamentos

```typescript
// Frontend - Criando sessão de checkout
const createCheckoutSession = async (planId: string) => {
  try {
    // 1. Criar sessão no backend (Cloud Function)
    const response = await fetch('https://create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId,
        salaoId: currentSalao.id,
        userId: currentUser.uid,
        successUrl: `${WEB_URL}/success`,
        cancelUrl: `${WEB_URL}/cancel`,
      }),
    });
    
    const { sessionId } = await response.json();
    
    // 2. Redirecionar para Stripe Checkout
    const { error } = await stripe.redirectToCheckout({ sessionId });
    
    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Checkout error:', error);
  }
};
```

🔐 Segurança Implementada

Camadas de Segurança

1. Firebase Security Rules:

```json
{
  "rules": {
    "saloes": {
      "$salaoId": {
        ".read": "auth != null && resource.data.ownerId == auth.uid",
        ".write": "auth != null && resource.data.ownerId == auth.uid"
      }
    },
    "payments": {
      ".read": false,
      ".write": false
    }
  }
}
```

1. Validção de Webhook Stripe:
   · Assinatura HMAC SHA256
   · Timestamp prevention replay attacks
   · Event type validation
2. Proteção de Dados:
   · Dados sensíveis no SecureStore
   · Chaves API em variáveis de ambiente
   · CORS configurado no Firebase

📈 Roadmap de Desenvolvimento

Versão 1.0 (Atual)

· Sistema básico de agendamentos
· Autenticação com Firebase
· Perfis de usuário (cliente/profissional/dono)
· Interface com NativeWind

Versão 1.5 (Em desenvolvimento)

· Integração completa com Stripe
· Cloud Functions para webhooks
· Dashboard de analytics
· Notificações push

Versão 2.0 (Planejado)

· Sistema de comissões para profissionais
· Integração com WhatsApp Business API
· Relatórios PDF automáticos
· API pública para integrações

🐛 Solução de Problemas Comuns

Problema: Firebase não inicializa

```typescript
// Solução: Verificar configuração
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  // ... outros campos
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
```

Problema: Stripe Webhook não chega

```bash
# Testar webhook localmente
stripe listen --forward-to localhost:5001/aurago-app/us-central1/stripeWebhook
stripe trigger checkout.session.completed
```

Problema: Build do Expo falha

```bash
# Limpar cache
expo start -c

# Verificar dependências
expo doctor

# Build específico
eas build --platform android --profile preview
```

👨💻 Desenvolvedor

Eduardo Monteiro

---

⭐ Se este projeto te inspirar, considere dar uma estrela no repositório! ⭐

---

Dúvidas? Abra uma issue no GitHub ou entre em contato! 🚀