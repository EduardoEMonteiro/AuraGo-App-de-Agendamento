// Configuração do Firebase para Expo
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { disableNetwork, enableNetwork, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyA_OCKJ5q4xEeqJ822bzkYpXAWH9gUEb-E',
  authDomain: 'bloom-agendamento.firebaseapp.com',
  projectId: 'bloom-agendamento',
  storageBucket: 'bloom-agendamento.firebasestorage.app',
  messagingSenderId: '108734211856',
  appId: '1:108734211856:android:195e046653fc66f459a795',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Configuração robusta do Firestore
export const db = getFirestore(app);

// Função para reconectar ao Firestore em caso de erro
export const reconnectFirestore = async () => {
  try {
    console.log('Tentando reconectar ao Firestore...');
    await disableNetwork(db);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Aguarda 1 segundo
    await enableNetwork(db);
    console.log('✅ Firestore reconectado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao reconectar Firestore:', error);
    return false;
  }
};

// Função para verificar se o Firestore está conectado
export const isFirestoreConnected = () => {
  try {
    return db && db.app && db.app.name !== undefined;
  } catch (error) {
    console.log('Erro ao verificar conexão Firestore:', error);
    return false;
  }
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
      console.log(`⏳ Aguardando ${attempt * 2} segundos antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, attempt * 2000));
    }
  }
  
  console.error('❌ Falha na reconexão após todas as tentativas');
  return false;
};

let auth: Auth;
if (
  typeof navigator !== 'undefined' &&
  navigator.product === 'ReactNative'
) {
  // Só executa no React Native
  const { getReactNativePersistence } = require('firebase/auth');
  const ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} else {
  // Web
  auth = getAuth(app);
}

export { auth };
