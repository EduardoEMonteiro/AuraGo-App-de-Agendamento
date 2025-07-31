import { sendEmailVerification } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../contexts/useAuthStore';
import { auth } from '../services/firebase';

interface EmailVerificationBannerProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function EmailVerificationBanner({ visible, onDismiss }: EmailVerificationBannerProps) {
  const { user, refreshUser } = useAuthStore();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  if (!visible || !user || user.emailVerified) {
    return null;
  }

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
          "Seu e-mail foi confirmado com sucesso. O banner será removido."
        );
        onDismiss();
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.banner}>
        <View style={styles.content}>
          <Text style={styles.title}>Verifique seu e-mail</Text>
          <Text style={styles.message}>
            Para sua segurança, recomendamos verificar seu endereço de e-mail.
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleResendEmail}
            disabled={sending}
          >
            <Text style={styles.buttonText}>
              {sending ? 'Enviando...' : 'Reenviar'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleCheckVerification}
            disabled={checking}
          >
            <Text style={styles.buttonText}>
              {checking ? 'Verificando...' : 'Verificar'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.dismissButton]}
            onPress={onDismiss}
          >
            <Text style={styles.dismissText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  banner: {
    backgroundColor: '#FFF3CD',
    borderBottomWidth: 1,
    borderBottomColor: '#FFEAA7',
    padding: 16,
  },
  content: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#28A745',
  },
  dismissButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  dismissText: {
    color: '#856404',
    fontSize: 12,
    fontWeight: '600',
  },
}); 