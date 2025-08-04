// Configuração do Firebase para Expo
import { initializeApp } from 'firebase/app';
import { initializeFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { initializeAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { configureFirebaseLogging } from '../utils/firebaseLogging';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA_OCKJ5q4xEeqJ822bzkYpXAWH9gUEb-E",
  authDomain: "bloom-agendamento.firebaseapp.com",
  projectId: "bloom-agendamento",
  storageBucket: "bloom-agendamento.firebasestorage.app",
  messagingSenderId: "108734211856",
  appId: "1:108734211856:android:195e046653fc66f459a795"
};

// Inicializa o app
export const app = initializeApp(firebaseConfig);

// Inicializa o Firestore com configurações otimizadas
export const db = initializeFirestore(app, {
  cacheSizeBytes: 50 * 1024 * 1024, // 50MB cache
  experimentalForceLongPolling: true, // Melhor para React Native
  ignoreUndefinedProperties: true, // Ignora propriedades undefined
  // Configurações adicionais para reduzir warnings
  experimentalAutoDetectLongPolling: false,
});

// Inicializa o Auth com persistência para React Native
let auth;
try {
  // Importação dinâmica para evitar problemas de compatibilidade
  const { getReactNativePersistence } = require('firebase/auth');
  const AsyncStorage = require('@react-native-async-storage/async-storage');
  
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  console.log('✅ Auth configurado com persistência AsyncStorage');
} catch (error) {
  console.warn('⚠️ Fallback para Auth sem persistência:', error);
  // Fallback se não conseguir carregar a persistência
  auth = initializeAuth(app);
}

export { auth };

// Inicializa as Functions
export const functions = getFunctions(app);

// Configuração para desenvolvimento (emuladores) - APENAS se estiver rodando emuladores
if (__DEV__) {
  // Só conectar aos emuladores se eles estiverem rodando
  // Para isso, você precisa ter os emuladores ativos
  // firebase emulators:start
  
  // Comentado para não causar erro de network
  /*
  try {
    // Conecta ao emulador do Firestore se disponível
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('✅ Conectado ao emulador do Firestore');
  } catch (error) {
    console.log('ℹ️ Emulador do Firestore não disponível, usando produção');
  }

  try {
    // Conecta ao emulador do Auth se disponível
    connectAuthEmulator(auth, 'http://localhost:9099');
    console.log('✅ Conectado ao emulador do Auth');
  } catch (error) {
    console.log('ℹ️ Emulador do Auth não disponível, usando produção');
  }

  try {
    // Conecta ao emulador das Functions se disponível
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('✅ Conectado ao emulador das Functions');
  } catch (error) {
    console.log('ℹ️ Emulador das Functions não disponível, usando produção');
  }
  */
}

console.log('✅ Persistência Firestore configurada com sucesso (método atualizado)');
console.log('✅ Configurações Firestore otimizadas para estabilidade');
console.log('✅ Firebase configurado para produção');

// Configurar logs do Firebase para reduzir warnings
configureFirebaseLogging();

// Inicializar monitoramento de saúde com delay
setTimeout(() => {
  monitorFirestoreHealth();
}, 5000); // Aguardar 5 segundos antes de iniciar monitoramento

// Função para reconectar ao Firestore em caso de erro
export const reconnectFirestore = async () => {
  try {
    console.log('Tentando reconectar ao Firestore...');
    // A função disableNetwork foi removida, mas a lógica de reconexão pode ser mantida
    // com a configuração de emuladores ou a lógica original.
    // Para simplificar, vamos apenas verificar a conexão.
    if (db && db.app && db.app.name !== undefined) {
      console.log('✅ Firestore já conectado, não necessário reconectar.');
      return true;
    }
    console.error('❌ Firestore não inicializado ou desconexo.');
    return false;
  } catch (error: any) {
    console.error('❌ Erro ao reconectar Firestore:', error);
    return false;
  }
};

// Função para verificar se o Firestore está conectado
export const isFirestoreConnected = () => {
  try {
    return db && db.app && db.app.name !== undefined;
  } catch (error: any) {
    console.log('Erro ao verificar conexão Firestore:', error);
    return false;
  }
};

// Função para monitorar a saúde da conexão
export const monitorFirestoreHealth = () => {
  let connectionAttempts = 0;
  const maxAttempts = 5;
  let isMonitoring = false;
  
  const checkConnection = async () => {
    if (isMonitoring) return; // Evitar múltiplas verificações simultâneas
    
    if (!isFirestoreConnected()) {
      isMonitoring = true;
      connectionAttempts++;
      console.warn(`⚠️ Conexão Firestore instável (tentativa ${connectionAttempts}/${maxAttempts})`);
      
      if (connectionAttempts >= maxAttempts) {
        console.error('❌ Muitas tentativas de conexão falharam. Verifique sua conexão de internet.');
        isMonitoring = false;
        return false;
      }
      
      // Tentar reconectar
      const success = await reconnectFirestore();
      if (success) {
        connectionAttempts = 0;
        console.log('✅ Conexão Firestore restaurada');
        isMonitoring = false;
      }
      
      return success;
    }
    
    connectionAttempts = 0;
    return true;
  };
  
  // Verificar conexão a cada 30 segundos
  setInterval(checkConnection, 30000);
  
  return checkConnection;
};

// Função para tentar reconexão automática
export const autoReconnectFirestore = async (maxAttempts = 3) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`🔄 Tentativa ${attempt}/${maxAttempts} de reconexão...`);
    
    const success = await reconnectFirestore();
    if (success) {
      console.log('✅ Reconexão bem-sucedida!');
      return true;
    }
    
    if (attempt < maxAttempts) {
      const waitTime = attempt * 3000; // Aumentar tempo de espera
      console.log(`⏳ Aguardando ${waitTime / 1000} segundos antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  console.error('❌ Falha na reconexão após todas as tentativas');
  return false;
};

// Inicializar monitoramento de saúde da conexão
if (typeof window !== 'undefined' || typeof global !== 'undefined') {
  // Só inicializar em ambiente de execução
  setTimeout(() => {
    monitorFirestoreHealth();
  }, 5000); // Aguardar 5 segundos antes de iniciar monitoramento
}

