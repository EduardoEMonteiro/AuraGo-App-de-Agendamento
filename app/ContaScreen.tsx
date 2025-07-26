import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../contexts/useAuthStore';
import { auth, db } from '../services/firebase';

export const screenOptions = {
  headerShown: false,
};

export default function ContaScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);
  const params = useLocalSearchParams();
  const globalUser = useAuthStore((state) => state.user);
  const user = params.user ? (typeof params.user === 'string' ? JSON.parse(params.user) : params.user) : globalUser;
  const [nome, setNome] = useState(user?.nome || '');
  const [telefone, setTelefone] = useState(user?.telefone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [salvando, setSalvando] = useState(false);

  function handleBack() {
    if (router.canGoBack && router.canGoBack()) {
      router.back();
    } else {
      router.replace('/configuracoes');
    }
  }

  async function handleSalvar() {
    if (!user?.id) return;
    setSalvando(true);
    try {
      await updateDoc(doc(db, 'usuarios', user.id), {
        nome,
        telefone,
        email,
      });
      Alert.alert('Sucesso', 'Dados atualizados!');
      router.back();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleRedefinirSenha() {
    if (!email) return;
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('E-mail enviado', 'Enviamos um e-mail para redefinição de senha. Siga as instruções no seu e-mail.');
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível enviar o e-mail de redefinição.');
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Feather name="arrow-left" size={24} color="#1976d2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.container}>
        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          value={nome}
          onChangeText={setNome}
          placeholder="Seu nome"
          autoCapitalize="words"
        />
        <Text style={styles.label}>Telefone</Text>
        <TextInput
          style={styles.input}
          value={telefone}
          onChangeText={setTelefone}
          placeholder="(99) 99999-9999"
          keyboardType="phone-pad"
        />
        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSalvar} disabled={salvando}>
          <Text style={styles.saveButtonText}>{salvando ? 'Salvando...' : 'Salvar Alterações'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.resetButton} onPress={handleRedefinirSenha}>
          <Feather name="lock" size={18} color="#1976d2" style={{ marginRight: 8 }} />
          <Text style={styles.resetButtonText}>Redefinir senha</Text>
        </TouchableOpacity>
        <Text style={styles.legend}>Ao redefinir a senha, você receberá um e-mail com instruções para criar uma nova senha.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  headerTitle: {
    fontSize: 18, // igual ao HorarioFuncionamentoScreen
    fontWeight: 'bold',
    color: '#222',
  },
  container: {
    flex: 1,
    padding: 24,
  },
  label: {
    fontSize: 15, // igual ao diaLabel do HorarioFuncionamentoScreen
    fontWeight: 'bold',
    color: '#222',
    marginTop: 18,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 14,
    fontSize: 15, // igual ao input do HorarioFuncionamentoScreen
    marginBottom: 4,
  },
  saveButton: {
    backgroundColor: '#1976d2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 28,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15, // igual ao salvarText do HorarioFuncionamentoScreen
    fontWeight: 'bold',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  resetButtonText: {
    color: '#1976d2',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  legend: {
    color: '#666',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
}); 