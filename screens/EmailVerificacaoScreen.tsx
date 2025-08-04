import { sendEmailVerification } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../contexts/useAuthStore';
import { auth } from '../services/firebase';

export default function EmailVerificacaoScreen() {
  const { user, refreshUser } = useAuthStore();
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleResendEmail = async () => {
    if (!auth.currentUser) return;
    
    setSending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      Alert.alert(
        "E-mail Reenviado",
        "Enviamos um novo link de verificação para seu e-mail. Verifique sua caixa de entrada."
      );
    } catch (error) {
      Alert.alert("Erro", "Não foi possível reenviar o e-mail. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!auth.currentUser) return;
    
    setChecking(true);
    try {
      await refreshUser();
      
      // Verifica se o e-mail foi verificado após a atualização
      const updatedUser = useAuthStore.getState().user;
      if (updatedUser?.emailVerified) {
        Alert.alert(
          "E-mail Verificado!",
          "Seu e-mail foi confirmado com sucesso. Você será redirecionado para o login.",
          [
            {
              text: "OK",
              onPress: () => {
                router.replace('/login');
              }
            }
          ]
        );
      } else {
        Alert.alert(
          "E-mail Ainda Não Verificado",
          "Seu e-mail ainda não foi verificado. Verifique sua caixa de entrada e clique no link de confirmação."
        );
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível verificar o status do e-mail. Tente novamente.");
    } finally {
      setChecking(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#efefef' }}>
      <ScrollView
        contentContainerStyle={{ 
          flexGrow: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          paddingHorizontal: 24 
        }}
      >
        <View style={{ alignItems: 'center', width: '100%', marginBottom: 48 }}>
          <Image 
            source={require('../assets/images/logo_aura.png')} 
            style={{ width: 200, height: 200, resizeMode: 'contain' }} 
          />
        </View>

        <View style={{ 
          backgroundColor: '#fff', 
          borderRadius: 16, 
          padding: 24, 
          width: '100%',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5
        }}>
          <Text style={{ 
            fontSize: 24, 
            fontWeight: 'bold', 
            color: '#1A1A1A', 
            textAlign: 'center',
            marginBottom: 16
          }}>
            Verifique seu E-mail
          </Text>

          <Text style={{ 
            fontSize: 16, 
            color: '#666', 
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 24
          }}>
            Enviamos um link de confirmação para{' '}
            <Text style={{ fontWeight: '600', color: '#007AFF' }}>
              {user?.email}
            </Text>
            {'\n\n'}
            Clique no link enviado para ativar sua conta e depois retorne aqui para fazer login.
          </Text>

          <View style={{ gap: 12, marginBottom: 24 }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#007AFF',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
              }}
              onPress={handleResendEmail}
              disabled={sending}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                {sending ? 'Enviando...' : 'Reenviar E-mail'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: '#28A745',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
              }}
              onPress={handleCheckVerification}
              disabled={checking}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                {checking ? 'Verificando...' : 'Já Confirmei'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: 'transparent',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#007AFF',
              }}
              onPress={handleBackToLogin}
            >
              <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: '600' }}>
                Voltar ao Login
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={{ 
            fontSize: 14, 
            color: '#999', 
            textAlign: 'center',
            lineHeight: 20
          }}>
            Não recebeu o e-mail? Verifique sua pasta de spam ou lixeira.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 