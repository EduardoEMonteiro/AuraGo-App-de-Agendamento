import { doc, getDoc, increment, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Eventos de analytics para tracking de conversão
 */
export type TrialAnalyticsEvent = 
  | 'trial_started'
  | 'trial_7_days_reminder'
  | 'trial_3_days_reminder'
  | 'trial_1_day_reminder'
  | 'trial_expired'
  | 'upgrade_screen_viewed'
  | 'upgrade_button_clicked'
  | 'stripe_checkout_started'
  | 'stripe_checkout_completed'
  | 'stripe_checkout_failed'
  | 'subscription_activated'
  | 'trial_recovery_notification_sent'
  | 'trial_recovery_clicked';

/**
 * Interface para dados de analytics
 */
interface AnalyticsData {
  event: TrialAnalyticsEvent;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Registra um evento de trial no Firestore
 */
export async function trackTrialEvent(userId: string, eventType: string, eventData: any = {}) {
  try {
    const analyticsRef = doc(db, 'analytics', 'trial_conversion');
    
    // Verifica se o documento existe antes de tentar atualizar
    const analyticsDoc = await getDoc(analyticsRef);
    if (!analyticsDoc.exists()) {
      console.log('Criando documento de analytics inicial');
      // Usa setDoc em vez de updateDoc para criar o documento
      const { setDoc } = await import('firebase/firestore');
      await setDoc(analyticsRef, {
        events: 0,
        lastUpdated: new Date(),
        createdAt: new Date(),
      });
    }

    // Atualiza o contador de eventos
    await updateDoc(analyticsRef, {
      events: increment(1),
      lastUpdated: new Date(),
    });

    // Registra o evento individual (opcional, para debug) - REMOVIDO PARA EVITAR ERROS
    // try {
    //   const eventRef = doc(db, 'analytics', 'trial_conversion', 'events', `${userId}_${Date.now()}`);
    //   await updateDoc(eventRef, {
    //     userId,
    //     eventType,
    //     eventData,
    //     timestamp: new Date(),
    //   });
    // } catch (eventError) {
    //   console.log('Evento individual não registrado (opcional):', eventError);
    // }

    console.log('Analytics registrado com sucesso:', eventType);
  } catch (error) {
    console.error('Erro ao registrar analytics:', error);
  }
}

/**
 * Registra que o trial foi iniciado
 */
export async function trackTrialStarted(userId: string, trialStartDate: Date) {
  try {
    await trackTrialEvent(userId, 'trial_started', {
      trialStartDate: trialStartDate.toISOString(),
    });
  } catch (error) {
    console.log('Analytics não registrado (não crítico):', error);
  }
}

/**
 * Registra que o usuário visualizou a tela de upgrade
 */
export async function trackUpgradeScreenViewed(userId: string, daysRemaining: number) {
  try {
    await trackTrialEvent(userId, 'upgrade_screen_viewed', {
      daysRemaining,
    });
  } catch (error) {
    console.log('Analytics não registrado (não crítico):', error);
  }
}

/**
 * Registra que o usuário clicou no botão de upgrade
 */
export async function trackUpgradeButtonClicked(userId: string, daysRemaining: number) {
  try {
    await trackTrialEvent(userId, 'upgrade_button_clicked', {
      daysRemaining,
    });
  } catch (error) {
    console.log('Analytics não registrado (não crítico):', error);
  }
}

/**
 * Registra que o checkout do Stripe foi iniciado
 */
export async function trackStripeCheckoutStarted(userId: string, planType: string) {
  try {
    await trackTrialEvent(userId, 'stripe_checkout_started', {
      planType,
    });
  } catch (error) {
    console.log('Analytics não registrado (não crítico):', error);
  }
}

/**
 * Registra que o checkout do Stripe foi concluído com sucesso
 */
export async function trackStripeCheckoutCompleted(userId: string, planType: string, sessionId: string) {
  try {
    await trackTrialEvent(userId, 'stripe_checkout_completed', {
      planType,
      sessionId,
    });
  } catch (error) {
    console.log('Analytics não registrado (não crítico):', error);
  }
}

/**
 * Registra que o checkout do Stripe falhou
 */
export async function trackStripeCheckoutFailed(userId: string, planType: string, errorMessage: string) {
  try {
    await trackTrialEvent(userId, 'stripe_checkout_failed', {
      planType,
      errorMessage,
    });
  } catch (error) {
    console.log('Analytics não registrado (não crítico):', error);
  }
}

/**
 * Registra ativação da assinatura
 */
export async function trackSubscriptionActivated(userId: string, plano: string, customerId: string) {
  await trackTrialEvent('subscription_activated', userId, {
    plano,
    customerId,
    source: 'trial_upgrade',
  });
}

/**
 * Registra envio de notificação de recuperação
 */
export async function trackTrialRecoveryNotificationSent(userId: string, daysSinceExpiration: number) {
  await trackTrialEvent('trial_recovery_notification_sent', userId, {
    daysSinceExpiration,
  });
}

/**
 * Registra clique em notificação de recuperação
 */
export async function trackTrialRecoveryClicked(userId: string) {
  await trackTrialEvent('trial_recovery_clicked', userId);
}

/**
 * Calcula métricas de conversão
 */
export async function calculateConversionMetrics() {
  try {
    const db = getFirestore();
    const analyticsRef = doc(db, 'analytics', 'trial_conversion');
    
    // Em produção, implementar consultas agregadas
    // Por enquanto, retorna estrutura básica
    return {
      totalTrials: 0,
      totalUpgrades: 0,
      conversionRate: 0,
      averageDaysToUpgrade: 0,
      upgradeByDay: {
        '7_days_left': 0,
        '3_days_left': 0,
        '1_day_left': 0,
        'expired': 0,
      },
    };
  } catch (error) {
    console.error('Erro ao calcular métricas:', error);
    return null;
  }
}

/**
 * Registra métricas de uso do trial
 */
export async function trackTrialUsage(userId: string, trialExpirationDate: Date | string) {
  const expiration = typeof trialExpirationDate === 'string' 
    ? new Date(trialExpirationDate) 
    : trialExpirationDate;
  
  const daysRemaining = getDaysRemaining(expiration);
  const isExpired = isTrialExpired(expiration);
  
  await trackTrialEvent('trial_usage_tracked', userId, {
    daysRemaining,
    isExpired,
    trialExpirationDate: expiration.toISOString(),
  });
} 

/**
 * Cria dashboard básico no Firestore para visualização no console
 */
export async function createAnalyticsDashboard() {
  try {
    const db = getFirestore();
    const dashboardRef = doc(db, 'analytics', 'trial_dashboard');
    
    const dashboardData = {
      createdAt: new Date(),
      lastUpdated: new Date(),
      metrics: {
        totalTrials: 0,
        totalUpgrades: 0,
        conversionRate: 0,
        averageDaysToUpgrade: 0,
        upgradeByDay: {
          '7_days_left': 0,
          '3_days_left': 0,
          '1_day_left': 0,
          'expired': 0,
        },
        notifications: {
          sent: 0,
          clicked: 0,
          recoverySent: 0,
          recoveryClicked: 0,
        },
        revenue: {
          totalRevenue: 0,
          averageRevenuePerUser: 0,
          monthlyRecurringRevenue: 0,
        }
      },
      recentEvents: [],
      topPerformingDays: [],
    };
    
    await updateDoc(dashboardRef, dashboardData);
    console.log('Dashboard de analytics criado no Firestore');
    
  } catch (error) {
    console.error('Erro ao criar dashboard:', error);
  }
}

/**
 * Atualiza métricas do dashboard em tempo real
 */
export async function updateDashboardMetrics() {
  try {
    const db = getFirestore();
    const analyticsRef = doc(db, 'analytics', 'trial_conversion');
    const dashboardRef = doc(db, 'analytics', 'trial_dashboard');
    
    // Busca dados agregados
    const analyticsDoc = await getDoc(analyticsRef);
    const analyticsData = analyticsDoc.data() || {};
    
    // Calcula métricas
    const totalTrials = analyticsData.event_trial_started || 0;
    const totalUpgrades = analyticsData.event_subscription_activated || 0;
    const conversionRate = totalTrials > 0 ? (totalUpgrades / totalTrials * 100).toFixed(2) : 0;
    
    const upgradeByDay = {
      '7_days_left': analyticsData.event_trial_7_days_reminder || 0,
      '3_days_left': analyticsData.event_trial_3_days_reminder || 0,
      '1_day_left': analyticsData.event_trial_1_day_reminder || 0,
      'expired': analyticsData.event_trial_expired || 0,
    };
    
    const notifications = {
      sent: (analyticsData.event_trial_7_days_reminder || 0) + 
             (analyticsData.event_trial_3_days_reminder || 0) + 
             (analyticsData.event_trial_1_day_reminder || 0),
      clicked: analyticsData.event_upgrade_button_clicked || 0,
      recoverySent: analyticsData.event_trial_recovery_notification_sent || 0,
      recoveryClicked: analyticsData.event_trial_recovery_clicked || 0,
    };
    
    // Atualiza dashboard
    await updateDoc(dashboardRef, {
      'metrics.totalTrials': totalTrials,
      'metrics.totalUpgrades': totalUpgrades,
      'metrics.conversionRate': conversionRate,
      'metrics.upgradeByDay': upgradeByDay,
      'metrics.notifications': notifications,
      lastUpdated: new Date(),
    });
    
    console.log('Dashboard atualizado com sucesso');
    
  } catch (error) {
    console.error('Erro ao atualizar dashboard:', error);
  }
} 

/**
 * Calcula e mostra métricas no console (para debug)
 */
export async function showAnalyticsInConsole() {
  try {
    const db = getFirestore();
    const analyticsRef = doc(db, 'analytics', 'trial_conversion');
    const analyticsDoc = await getDoc(analyticsRef);
    const data = analyticsDoc.data() || {};
    
    const totalTrials = data.event_trial_started || 0;
    const totalUpgrades = data.event_subscription_activated || 0;
    const conversionRate = totalTrials > 0 ? (totalUpgrades / totalTrials * 100).toFixed(2) : 0;
    
    console.log('📊 ANALYTICS DO TRIAL');
    console.log('=====================');
    console.log(`Total de trials: ${totalTrials}`);
    console.log(`Total de upgrades: ${totalUpgrades}`);
    console.log(`Taxa de conversão: ${conversionRate}%`);
    console.log('');
    console.log('📈 EVENTOS DETALHADOS:');
    console.log(`- Trials iniciados: ${data.event_trial_started || 0}`);
    console.log(`- Telas de upgrade vistas: ${data.event_upgrade_screen_viewed || 0}`);
    console.log(`- Botões de upgrade clicados: ${data.event_upgrade_button_clicked || 0}`);
    console.log(`- Checkouts iniciados: ${data.event_stripe_checkout_started || 0}`);
    console.log(`- Checkouts completados: ${data.event_stripe_checkout_completed || 0}`);
    console.log(`- Assinaturas ativadas: ${data.event_subscription_activated || 0}`);
    console.log(`- Notificações de recuperação: ${data.event_trial_recovery_notification_sent || 0}`);
    console.log(`- Cliques em recuperação: ${data.event_trial_recovery_clicked || 0}`);
    console.log('');
    console.log('💰 CONVERSÃO POR FASE:');
    console.log(`- 7 dias restantes: ${data.event_trial_7_days_reminder || 0}`);
    console.log(`- 3 dias restantes: ${data.event_trial_3_days_reminder || 0}`);
    console.log(`- 1 dia restante: ${data.event_trial_1_day_reminder || 0}`);
    console.log(`- Trial expirado: ${data.event_trial_expired || 0}`);
    
  } catch (error) {
    console.error('Erro ao mostrar analytics:', error);
  }
} 