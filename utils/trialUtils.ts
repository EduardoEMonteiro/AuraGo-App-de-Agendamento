// Utilitários para gerenciar o período gratuito de 30 dias

/**
 * Calcula a data de expiração do trial (30 dias a partir da data atual)
 */
export function calculateTrialExpiration(): Date {
  const now = new Date();
  const expiration = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 dias
  return expiration;
}

/**
 * Verifica se o trial expirou
 */
export function isTrialExpired(expirationDate: Date | string | any | null | undefined): boolean {
  // Se não há data de expiração, considera como expirado
  if (!expirationDate) {
    return true;
  }
  
  let expiration: Date;
  
  // Trata diferentes tipos de data do Firestore
  if (typeof expirationDate === 'string') {
    expiration = new Date(expirationDate);
  } else if (expirationDate && typeof expirationDate === 'object' && 'toDate' in expirationDate) {
    // Timestamp do Firestore
    expiration = expirationDate.toDate();
  } else if (expirationDate instanceof Date) {
    expiration = expirationDate;
  } else {
    // Se não consegue converter, considera como expirado
    return true;
  }
  
  // Verifica se a data é válida
  if (isNaN(expiration.getTime())) {
    return true;
  }
  
  const now = new Date();
  return now > expiration;
}

/**
 * Verifica se o trial está próximo de expirar (7 dias antes)
 */
export function isTrialExpiringSoon(expirationDate: Date | string | any | null | undefined): boolean {
  // Se não há data de expiração, não está próximo de expirar
  if (!expirationDate) {
    return false;
  }
  
  let expiration: Date;
  
  // Trata diferentes tipos de data do Firestore
  if (typeof expirationDate === 'string') {
    expiration = new Date(expirationDate);
  } else if (expirationDate && typeof expirationDate === 'object' && 'toDate' in expirationDate) {
    // Timestamp do Firestore
    expiration = expirationDate.toDate();
  } else if (expirationDate instanceof Date) {
    expiration = expirationDate;
  } else {
    // Se não consegue converter, não está próximo de expirar
    return false;
  }
  
  // Verifica se a data é válida
  if (isNaN(expiration.getTime())) {
    return false;
  }
  
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
  return now < expiration && expiration <= sevenDaysFromNow;
}

/**
 * Calcula quantos dias restam no trial
 */
export function getDaysRemaining(expirationDate: Date | string | any | null | undefined): number {
  // Se não há data de expiração, retorna 0 dias
  if (!expirationDate) {
    return 0;
  }
  
  let expiration: Date;
  
  // Trata diferentes tipos de data do Firestore
  if (typeof expirationDate === 'string') {
    expiration = new Date(expirationDate);
  } else if (expirationDate && typeof expirationDate === 'object' && 'toDate' in expirationDate) {
    // Timestamp do Firestore
    expiration = expirationDate.toDate();
  } else if (expirationDate instanceof Date) {
    expiration = expirationDate;
  } else {
    // Se não consegue converter, retorna 0 dias
    return 0;
  }
  
  // Verifica se a data é válida
  if (isNaN(expiration.getTime())) {
    return 0;
  }
  
  const now = new Date();
  const diffTime = expiration.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Formata a data de expiração para exibição
 */
export function formatExpirationDate(expirationDate: Date | string | any | null | undefined): string {
  // Se não há data de expiração, retorna string vazia
  if (!expirationDate) {
    return '';
  }
  
  let expiration: Date;
  
  // Trata diferentes tipos de data do Firestore
  if (typeof expirationDate === 'string') {
    expiration = new Date(expirationDate);
  } else if (expirationDate && typeof expirationDate === 'object' && 'toDate' in expirationDate) {
    // Timestamp do Firestore
    expiration = expirationDate.toDate();
  } else if (expirationDate instanceof Date) {
    expiration = expirationDate;
  } else {
    // Se não consegue converter, retorna string vazia
    return '';
  }
  
  // Verifica se a data é válida
  if (isNaN(expiration.getTime())) {
    return '';
  }
  
  return expiration.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
} 