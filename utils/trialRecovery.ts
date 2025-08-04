import { collection, doc, getDoc, getDocs, getFirestore, query, updateDoc, where } from 'firebase/firestore';
import { trackTrialRecoveryClicked, trackTrialRecoveryNotificationSent } from './trialAnalytics';
import { sendTrialRecoveryNotification } from './trialNotifications';
import { isTrialExpired } from './trialUtils';

/**
 * Interface para dados de recuperação
 */
interface RecoveryData {
  userId: string;
  trialExpirationDate: Date;
  daysSinceExpiration: number;
  lastRecoveryNotification?: Date;
  recoveryAttempts: number;
  maxRecoveryAttempts: number;
}

/**
 * Verifica se um usuário é elegível para recuperação
 */
export function isEligibleForRecovery(
  trialExpirationDate: Date | string,
  lastRecoveryNotification?: Date,
  recoveryAttempts: number = 0
): boolean {
  const expiration = typeof trialExpirationDate === 'string' 
    ? new Date(trialExpirationDate) 
    : trialExpirationDate;
  
  const now = new Date();
  const daysSinceExpiration = Math.floor((now.getTime() - expiration.getTime()) / (1000 * 60 * 60 * 24));
  
  // Só é elegível se:
  // 1. Trial expirou
  // 2. Não excedeu tentativas de recuperação (máximo 3)
  // 3. Última notificação foi há mais de 7 dias (ou nunca foi enviada)
  // 4. Expirou há menos de 90 dias
  
  const maxAttempts = 3;
  const daysBetweenNotifications = 7;
  const maxDaysSinceExpiration = 90;
  
  if (!isTrialExpired(expiration)) return false;
  if (recoveryAttempts >= maxAttempts) return false;
  if (daysSinceExpiration > maxDaysSinceExpiration) return false;
  
  if (lastRecoveryNotification) {
    const daysSinceLastNotification = Math.floor(
      (now.getTime() - lastRecoveryNotification.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastNotification < daysBetweenNotifications) return false;
  }
  
  return true;
}

/**
 * Envia notificação de recuperação para usuário elegível
 */
export async function sendRecoveryNotification(userId: string): Promise<boolean> {
  try {
    const db = getFirestore();
    const userRef = doc(db, 'usuarios', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log(`Usuário ${userId} não encontrado`);
      return false;
    }
    
    const userData = userDoc.data();
    const trialExpirationDate = userData.freeTrialExpiresAt?.toDate() || new Date(userData.freeTrialExpiresAt);
    const lastRecoveryNotification = userData.lastRecoveryNotification?.toDate();
    const recoveryAttempts = userData.recoveryAttempts || 0;
    
    // Verifica se é elegível
    if (!isEligibleForRecovery(trialExpirationDate, lastRecoveryNotification, recoveryAttempts)) {
      console.log(`Usuário ${userId} não é elegível para recuperação`);
      return false;
    }
    
    // Verifica se tem push token
    if (!userData.pushToken) {
      console.log(`Usuário ${userId} não tem push token`);
      return false;
    }
    
    // Envia notificação
    await sendTrialRecoveryNotification(userId, userData.pushToken);
    
    // Atualiza dados de recuperação
    const now = new Date();
    const daysSinceExpiration = Math.floor(
      (now.getTime() - trialExpirationDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    await updateDoc(userRef, {
      lastRecoveryNotification: now,
      recoveryAttempts: recoveryAttempts + 1,
      lastRecoveryAttempt: now,
    });
    
    // Registra analytics
    await trackTrialRecoveryNotificationSent(userId, daysSinceExpiration);
    
    console.log(`Notificação de recuperação enviada para usuário ${userId}`);
    return true;
    
  } catch (error) {
    console.error(`Erro ao enviar notificação de recuperação para ${userId}:`, error);
    return false;
  }
}

/**
 * Processa clique em notificação de recuperação
 */
export async function handleRecoveryNotificationClick(userId: string): Promise<void> {
  try {
    // Registra o clique
    await trackTrialRecoveryClicked(userId);
    
    // Pode implementar lógica adicional aqui
    // Por exemplo, abrir diretamente a tela de upgrade
    console.log(`Usuário ${userId} clicou na notificação de recuperação`);
    
  } catch (error) {
    console.error(`Erro ao processar clique na notificação de recuperação:`, error);
  }
}

/**
 * Busca usuários elegíveis para recuperação
 */
export async function findEligibleUsersForRecovery(): Promise<string[]> {
  try {
    const db = getFirestore();
    const usersRef = collection(db, 'usuarios');
    
    // Busca usuários com trial expirado
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
    
    const q = query(
      usersRef,
      where('freeTrialExpiresAt', '>=', ninetyDaysAgo),
      where('freeTrialExpiresAt', '<=', now),
      where('statusAssinatura', '==', 'trial')
    );
    
    const querySnapshot = await getDocs(q);
    const eligibleUsers: string[] = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      const trialExpirationDate = userData.freeTrialExpiresAt?.toDate() || new Date(userData.freeTrialExpiresAt);
      const lastRecoveryNotification = userData.lastRecoveryNotification?.toDate();
      const recoveryAttempts = userData.recoveryAttempts || 0;
      
      if (isEligibleForRecovery(trialExpirationDate, lastRecoveryNotification, recoveryAttempts)) {
        eligibleUsers.push(doc.id);
      }
    });
    
    console.log(`Encontrados ${eligibleUsers.length} usuários elegíveis para recuperação`);
    return eligibleUsers;
    
  } catch (error) {
    console.error('Erro ao buscar usuários elegíveis para recuperação:', error);
    return [];
  }
}

/**
 * Executa campanha de recuperação em lote
 */
export async function runRecoveryCampaign(): Promise<{
  totalEligible: number;
  notificationsSent: number;
  errors: number;
}> {
  try {
    const eligibleUsers = await findEligibleUsersForRecovery();
    let notificationsSent = 0;
    let errors = 0;
    
    console.log(`Iniciando campanha de recuperação para ${eligibleUsers.length} usuários`);
    
    for (const userId of eligibleUsers) {
      try {
        const sent = await sendRecoveryNotification(userId);
        if (sent) {
          notificationsSent++;
        } else {
          errors++;
        }
        
        // Aguarda 1 segundo entre notificações para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Erro ao enviar notificação para ${userId}:`, error);
        errors++;
      }
    }
    
    const result = {
      totalEligible: eligibleUsers.length,
      notificationsSent,
      errors,
    };
    
    console.log('Campanha de recuperação concluída:', result);
    return result;
    
  } catch (error) {
    console.error('Erro ao executar campanha de recuperação:', error);
    return {
      totalEligible: 0,
      notificationsSent: 0,
      errors: 1,
    };
  }
}

/**
 * Reseta dados de recuperação para um usuário (quando ele assina)
 */
export async function resetRecoveryData(userId: string): Promise<void> {
  try {
    const db = getFirestore();
    const userRef = doc(db, 'usuarios', userId);
    
    await updateDoc(userRef, {
      recoveryAttempts: 0,
      lastRecoveryNotification: null,
      lastRecoveryAttempt: null,
    });
    
    console.log(`Dados de recuperação resetados para usuário ${userId}`);
  } catch (error) {
    console.error(`Erro ao resetar dados de recuperação para ${userId}:`, error);
  }
} 