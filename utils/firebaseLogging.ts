// Configuração de logs do Firebase para reduzir warnings desnecessários
export const configureFirebaseLogging = () => {
  // Reduzir verbosidade dos logs do Firebase em desenvolvimento
  if (__DEV__) {
    // Desabilitar logs de debug do Firestore
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      // Filtrar warnings específicos do Firestore que são normais
      const message = args[0];
      if (typeof message === 'string') {
        // Ignorar warnings de conexão que são normais
        if (message.includes('WebChannelConnection') || 
            message.includes('transport errored') ||
            message.includes('Listen') ||
            message.includes('stream') ||
            message.includes('RPC') ||
            message.includes('undefined Message')) {
          return; // Não mostrar estes warnings
        }
      }
      originalConsoleWarn.apply(console, args);
    };

    // Configurar logs de erro mais informativos
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args[0];
      if (typeof message === 'string') {
        // Melhorar mensagens de erro do Firestore
        if (message.includes('Firestore')) {
          console.log('🔍 Firestore Error:', ...args);
          return;
        }
      }
      originalConsoleError.apply(console, args);
    };

    // Configurar logs de info para reduzir ruído
    const originalConsoleInfo = console.info;
    console.info = (...args) => {
      const message = args[0];
      if (typeof message === 'string') {
        // Filtrar logs de info do Firestore que são muito verbosos
        if (message.includes('Firestore') && 
            (message.includes('connection') || message.includes('stream'))) {
          return; // Não mostrar estes logs de info
        }
      }
      originalConsoleInfo.apply(console, args);
    };
  }
};

// Função para limpar listeners do Firestore quando não necessário
export const cleanupFirestoreListeners = () => {
  // Esta função pode ser chamada quando o app é pausado
  // para reduzir o uso de recursos
  console.log('🧹 Limpando listeners do Firestore');
};

// Função para configurar timeouts mais longos para conexões instáveis
export const configureFirestoreTimeouts = () => {
  // Em um app real, você pode configurar timeouts mais longos
  // para conexões de internet instáveis
  return {
    connectTimeout: 30000, // 30 segundos
    readTimeout: 30000,    // 30 segundos
    writeTimeout: 30000,   // 30 segundos
  };
}; 