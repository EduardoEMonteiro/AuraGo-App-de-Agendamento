// Configuração do Firebase para Expo
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyA_OCKJ5q4xEeqJ822bzkYpXAWH9gUEb-E',
  authDomain: 'bloom-agendamento.firebaseapp.com',
  projectId: 'bloom-agendamento',
  storageBucket: 'bloom-agendamento.firebasestorage.app',
  messagingSenderId: '108734211856',
  appId: '1:108734211856:android:195e046653fc66f459a795',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

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
