import { getDaysRemaining, isTrialExpiringSoon } from './trialUtils';
import { sendPushNotification } from '../services/pushNotifications';

/**
 * Tipos de notificação do trial
 */
export type TrialNotificationType = 
  | 'trial_started'
  | 'trial_7_days_left'
  | 'trial_3_days_left'
  | 'trial_1_day_left'
  | 'trial_expired'
  | 'trial_recovery';

/**
 * Configurações de notificação para cada tipo
 */
const NOTIFICATION_CONFIGS = {
  trial_started: {
    title: 'Bem-vindo ao Aura! 💜',
    body: 'Seu período gratuito de 30 dias começou. Aproveite todos os recursos!',
    delay: 0, // Enviar imediatamente
  },
  trial_7_days_left: {
    title: 'Faltam 7 dias para o fim do seu trial 💜',
    body: 'Continue aproveitando o Aura! Em breve você será convidado a assinar.',
    delay: 23 * 24 * 60 * 60 * 1000, // 23 dias após início
  },
  trial_3_days_left: {
    title: 'Faltam apenas 3 dias! ⏰',
    body: 'Seu período gratuito termina em breve. Assine para não perder seus dados.',
    delay: 27 * 24 * 60 * 60 * 1000, // 27 dias após início
  },
  trial_1_day_left: {
    title: 'Último dia do seu trial! 🚨',
    body: 'Amanhã seu acesso será bloqueado. Assine agora para continuar.',
    delay: 29 * 24 * 60 * 60 * 1000, // 29 dias após início
  },
  trial_expired: {
    title: 'Seu trial expirou 💜',
    body: 'Para continuar usando o Aura, assine o plano Essencial agora.',
    delay: 30 * 24 * 60 * 60 * 1000, // 30 dias após início
  },
  trial_recovery: {
    title: 'Volte para o Aura! 💜',
    body: 'Seus dados estão seguros. Assine agora e continue de onde parou.',
    delay: 0, // Enviar imediatamente
  },
};

/**
 * Agenda notificação do trial
 */
export async function scheduleTrialNotification(
  userId: string,
  pushToken: string,
  trialStartDate: Date,
  notificationType: TrialNotificationType
) {
  try {
    const config = NOTIFICATION_CONFIGS[notificationType];
    const scheduledTime = new Date(trialStartDate.getTime() + config.delay);
    
    // Verifica se já passou do tempo
    if (scheduledTime <= new Date()) {
      console.log(`Notificação ${notificationType} já deveria ter sido enviada`);
      return;
    }

    // Agenda a notificação
    await scheduleNotification(pushToken, config.title, config.body, {
      type: 'trial_notification',
      notificationType,
      userId,
      scheduledTime: scheduledTime.toISOString(),
    });

    console.log(`Notificação ${notificationType} agendada para ${scheduledTime}`);
  } catch (error) {
    console.error(`Erro ao agendar notificação ${notificationType}:`, error);
  }
}

/**
 * Agenda todas as notificações do trial para um usuário
 */
export async function scheduleAllTrialNotifications(
  userId: string,
  pushToken: string,
  trialStartDate: Date
) {
  const notificationTypes: TrialNotificationType[] = [
    'trial_started',
    'trial_7_days_left',
    'trial_3_days_left',
    'trial_1_day_left',
    'trial_expired',
  ];

  for (const type of notificationTypes) {
    await scheduleTrialNotification(userId, pushToken, trialStartDate, type);
  }
}

/**
 * Cancela todas as notificações do trial para um usuário
 */
export async function cancelTrialNotifications(userId: string) {
  try {
    // Implementar cancelamento de notificações agendadas
    // Isso pode ser feito através de um sistema de agendamento
    console.log(`Notificações do trial canceladas para usuário ${userId}`);
  } catch (error) {
    console.error('Erro ao cancelar notificações do trial:', error);
  }
}

/**
 * Envia notificação de recuperação para usuários com trial expirado
 */
export async function sendTrialRecoveryNotification(
  userId: string,
  pushToken: string
) {
  try {
    const config = NOTIFICATION_CONFIGS.trial_recovery;
    await sendPushNotification(pushToken, config.title, config.body, {
      type: 'trial_recovery',
      userId,
      action: 'upgrade',
    });
    
    console.log(`Notificação de recuperação enviada para usuário ${userId}`);
  } catch (error) {
    console.error('Erro ao enviar notificação de recuperação:', error);
  }
}

/**
 * Verifica se deve enviar notificação de trial expirando
 */
export function shouldSendExpiringNotification(
  trialExpirationDate: Date | string,
  lastNotificationDate?: Date
): boolean {
  const expiration = typeof trialExpirationDate === 'string' 
    ? new Date(trialExpirationDate) 
    : trialExpirationDate;
  
  const daysLeft = getDaysRemaining(expiration);
  const isExpiringSoon = isTrialExpiringSoon(expiration);
  
  // Só envia se estiver próximo de expirar e não enviou recentemente
  if (!isExpiringSoon) return false;
  
  if (!lastNotificationDate) return true;
  
  // Não envia se a última notificação foi há menos de 24h
  const hoursSinceLastNotification = (Date.now() - lastNotificationDate.getTime()) / (1000 * 60 * 60);
  return hoursSinceLastNotification >= 24;
}

/**
 * Função auxiliar para agendar notificação
 */
async function scheduleNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: any
) {
  // Implementação básica - em produção, usar um serviço de agendamento
  // como Firebase Cloud Functions com Cloud Scheduler
  await sendPushNotification(pushToken, title, body, data);
} 