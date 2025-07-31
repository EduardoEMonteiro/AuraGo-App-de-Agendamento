import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import type { Auth } from 'firebase/auth';
import { createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../contexts/useAuthStore';
import { auth, db } from '../services/firebase';

const CLIENT_ID = '108734211856-97el2rk337iq6ii8bkrgmp7m9l0btm1o.apps.googleusercontent.com';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export default function LoginScreen() {
  const { setUser } = useAuthStore();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');

  // Debug Zustand
  // @ts-ignore
  console.log('user Zustand:', require('../contexts/useAuthStore').useAuthStore.getState().user);

  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      redirectUri,
      scopes: ['profile', 'email'],
      responseType: 'token',
      usePKCE: false, // Força implicit flow, sem PKCE
    },
    discovery
  );

  // TESTE: Botão de clique
  // return (
  //   <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  //     <Button title="Teste clique" onPress={() => { console.log('Botão de teste clicado'); alert('Funcionou!'); }} />
  //   </View>
  // );

  // TESTE: Renderização simples
  // return <Text>TESTE DE RENDERIZAÇÃO DIRETA</Text>;

  // O return deve ser a última linha do componente, após todos os hooks e variáveis
  console.log('LoginScreen renderizou, mode:', mode, 'email:', email, 'user:', typeof setUser);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#efefef' }}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#efefef' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, backgroundColor: '#efefef' }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: 'center', width: '100%', marginBottom: 48, marginTop: 8 }}>
            <Image source={require('../assets/images/logo_aura.png')} style={{ width: 200, height: 200, resizeMode: 'contain' }} />
          </View>
          <View style={{ width: '100%', gap: 12, marginBottom: 24 }}>
            {mode !== 'reset' && (
              <TextInput
                value={email}
                onChangeText={t => { setEmail(t); console.log('email alterado:', t); }}
                placeholder="E-mail"
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#6B7280"
                style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 0, padding: 16, fontSize: 16, marginBottom: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, color: '#000' }}
              />
            )}
            {mode === 'login' && (
              <TextInput
                value={password}
                onChangeText={t => { setPassword(t); console.log('senha alterada:', t); }}
                placeholder="Senha"
                secureTextEntry
                placeholderTextColor="#6B7280"
                style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 0, padding: 16, fontSize: 16, marginBottom: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, color: '#000' }}
              />
            )}
            {mode === 'register' && (
              <>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Nome"
                  placeholderTextColor="#6B7280"
                  style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 0, padding: 16, fontSize: 16, marginBottom: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, color: '#000' }}
                />
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Sobrenome"
                  placeholderTextColor="#6B7280"
                  style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 0, padding: 16, fontSize: 16, marginBottom: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, color: '#000' }}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Senha"
                  secureTextEntry
                  placeholderTextColor="#6B7280"
                  style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 0, padding: 16, fontSize: 16, marginBottom: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, color: '#000' }}
                />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirmar senha"
                  secureTextEntry
                  placeholderTextColor="#6B7280"
                  style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 0, padding: 16, fontSize: 16, marginBottom: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, color: '#000' }}
                />
              </>
            )}
            {mode === 'reset' && (
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="E-mail para recuperação"
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#6B7280"
                style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 0, padding: 16, fontSize: 16, marginBottom: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, color: '#000' }}
              />
            )}
          </View>

          {loading && (
            <View style={{ marginBottom: 16 }}>
              <ActivityIndicator size="large" color="#007aff" />
            </View>
          )}

          {registerError && (
            <Text style={{ color: '#ef4444', marginBottom: 16, textAlign: 'center' }}>
              {registerError}
            </Text>
          )}

          <View style={{ width: '100%', gap: 12 }}>
            {mode === 'login' && (
              <>
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={loading}
                  style={{
                    backgroundColor: '#007aff',
                    borderRadius: 12,
                    padding: 16,
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => promptAsync()}
                  disabled={loading}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    padding: 16,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#007aff',
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: '#007aff', fontSize: 16, fontWeight: '600' }}>
                    Entrar com Google
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {mode === 'register' && (
              <TouchableOpacity
                onPress={handleRegister}
                disabled={loading}
                style={{
                  backgroundColor: '#007aff',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                  {loading ? 'Cadastrando...' : 'Cadastrar'}
                </Text>
              </TouchableOpacity>
            )}

            {mode === 'reset' && (
              <TouchableOpacity
                onPress={handleReset}
                disabled={loading}
                style={{
                  backgroundColor: '#007aff',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                  {loading ? 'Enviando...' : 'Enviar e-mail de recuperação'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ marginTop: 24, alignItems: 'center' }}>
            {mode === 'login' && (
              <>
                <TouchableOpacity onPress={() => setMode('register')} style={{ marginBottom: 8 }}>
                  <Text style={{ color: '#007aff', fontSize: 14 }}>
                    Não tem uma conta? Cadastre-se
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMode('reset')}>
                  <Text style={{ color: '#007aff', fontSize: 14 }}>
                    Esqueceu sua senha?
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {mode === 'register' && (
              <TouchableOpacity onPress={() => setMode('login')}>
                <Text style={{ color: '#007aff', fontSize: 14 }}>
                  Já tem uma conta? Faça login
                </Text>
              </TouchableOpacity>
            )}

            {mode === 'reset' && (
              <TouchableOpacity onPress={() => setMode('login')}>
                <Text style={{ color: '#007aff', fontSize: 14 }}>
                  Voltar ao login
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );


  async function handleLogin() {
    console.log('handleLogin chamado');
    if (!email || !password) {
      console.log('Campos obrigatórios não preenchidos');
      Alert.alert('Erro', 'Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth as Auth, email, password);
      console.log('Login Firebase Auth:', res.user.uid);
      
      // VERIFICAÇÃO DE E-MAIL - FLUXO CORRIGIDO
      if (!res.user.emailVerified) {
        // Buscar dados do usuário para verificar se é novo ou antigo
        const userDoc = await getDoc(doc(db, 'usuarios', res.user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        
        if (!userData.idSalao) {
          // NOVO USUÁRIO - Exige verificação
          Alert.alert(
            "E-mail Não Verificado",
            "Por favor, verifique seu e-mail antes de fazer login. Enviamos um link de confirmação para sua caixa de entrada.",
            [
              {
                text: "Reenviar E-mail",
                onPress: async () => {
                  try {
                    await sendEmailVerification(res.user);
                    Alert.alert(
                      "E-mail Reenviado",
                      "Enviamos um novo link de verificação para seu e-mail. Verifique sua caixa de entrada."
                    );
                  } catch (error) {
                    Alert.alert("Erro", "Não foi possível reenviar o e-mail. Tente novamente.");
                  }
                },
              },
              {
                text: "OK",
                onPress: async () => {
                  try {
                    await signOut(auth);
                    console.log('Usuário deslogado por e-mail não verificado.');
                  } catch (signOutError) {
                    console.error("Erro ao deslogar:", signOutError);
                  }
                },
              },
            ]
          );
        } else {
          // USUÁRIO ANTIGO - Permite acesso mas avisa
          Alert.alert(
            "E-mail Não Verificado",
            "Seu e-mail ainda não foi verificado. Para sua segurança, recomendamos verificar seu e-mail.",
            [
              {
                text: "Reenviar E-mail",
                onPress: async () => {
                  try {
                    await sendEmailVerification(res.user);
                    Alert.alert(
                      "E-mail Reenviado",
                      "Enviamos um novo link de verificação para seu e-mail."
                    );
                  } catch (error) {
                    Alert.alert("Erro", "Não foi possível reenviar o e-mail. Tente novamente.");
                  }
                },
              },
              {
                text: "Continuar",
                onPress: () => {
                  // Permite acesso ao app mesmo sem e-mail verificado
                  setUser({ ...res.user, ...userData, id: res.user.uid });
                },
              },
            ]
          );
        }
        setLoading(false);
        return;
      }
      
      const userDoc = await getDoc(doc(db, 'usuarios', res.user.uid));
      if (!userDoc.exists()) {
        Alert.alert('Erro', 'Usuário não encontrado no Firestore.');
        setLoading(false);
        return;
      }
      setUser({ ...res.user, ...userDoc.data(), id: res.user.uid });
      
      // REMOVIDO: Navegação imperativa. O RootLayout cuidará do roteamento.
    } catch (e: any) {
      console.error('Erro no login:', e);
      Alert.alert('Erro', e.message || JSON.stringify(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    console.log('handleRegister chamado');
    setRegisterError('');
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setRegisterError('Preencha todos os campos.');
      return;
    }
    if (password !== confirmPassword) {
      setRegisterError('As senhas não coincidem.');
      return;
    }
    
    setLoading(true);
    try {
      // 1. Cria o usuário
      const userCredential = await createUserWithEmailAndPassword(auth as Auth, email, password);
      const user = userCredential.user;
      console.log('Usuário criado no Auth:', user.uid);

      // 2. Envia o e-mail de verificação
      await sendEmailVerification(user);
      console.log('E-mail de verificação enviado');

      // 3. Salva os dados no Firestore
      await setDoc(doc(db, 'usuarios', user.uid), {
        id: user.uid,
        email: user.email,
        nome: firstName,
        sobrenome: lastName,
        role: 'gerente',
        idSalao: null,
      });
      console.log('Documento do usuário salvo no Firestore');
      
      // 4. MOSTRA O ALERTA PRIMEIRO - Passo CRÍTICO
      Alert.alert(
        "Cadastro Realizado com Sucesso!",
        "Enviamos um link de confirmação para o seu e-mail. Por favor, verifique sua caixa de entrada para ativar sua conta e depois retorne para fazer o login.",
        [
          {
            text: "OK",
            onPress: async () => {
              // 5. DENTRO DO 'OK' DO ALERTA, deslogue o usuário
              try {
                await signOut(auth);
                console.log('Usuário deslogado para aguardar verificação.');
                
                // Limpa os campos e volta para o modo de login
                setMode('login');
                setFirstName('');
                setLastName('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                
              } catch (signOutError) {
                console.error("Erro ao deslogar após cadastro:", signOutError);
              }
            },
          },
        ]
      );

    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      setRegisterError(error.message || JSON.stringify(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    console.log('handleReset chamado');
    if (!email) {
      console.log('Campo e-mail não preenchido');
      Alert.alert('Erro', 'Preencha o e-mail.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth as Auth, email);
      Alert.alert('Sucesso', 'E-mail de recuperação enviado!');
      setMode('login');
    } catch (e: any) {
      console.error('Erro no reset:', e);
      Alert.alert('Erro', e.message || JSON.stringify(e));
    } finally {
      setLoading(false);
    }
  }

} 