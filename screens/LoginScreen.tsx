import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import type { Auth } from 'firebase/auth';
import { createUserWithEmailAndPassword, GoogleAuthProvider, sendEmailVerification, sendPasswordResetEmail, signInWithCredential, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../contexts/useAuthStore';
import { auth, db } from '../services/firebase';
import { salvarConsentimento } from '../services/privacidade';
import { registerForPushNotificationsAsync, savePushTokenToFirestore } from '../services/pushNotifications';
import { trackTrialStarted } from '../utils/trialAnalytics';
import { scheduleAllTrialNotifications } from '../utils/trialNotifications';
import { calculateTrialExpiration } from '../utils/trialUtils';

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
  const [aceitouTermos, setAceitouTermos] = useState(false);

  // Debug Zustand
  // @ts-ignore
  console.log('user Zustand:', require('../contexts/useAuthStore').useAuthStore.getState().user);

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
                
                {/* Checkbox de aceitação dos termos */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 8 }}>
                  <TouchableOpacity
                    onPress={() => setAceitouTermos(!aceitouTermos)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: aceitouTermos ? '#007aff' : '#ccc',
                      backgroundColor: aceitouTermos ? '#007aff' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    {aceitouTermos && (
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
                    )}
                  </TouchableOpacity>
                  <Text style={{ flex: 1, fontSize: 14, color: '#666', lineHeight: 20 }}>
                    Eu li e aceito os{' '}
                    <Text 
                      style={{ color: '#007aff', textDecorationLine: 'underline' }}
                      onPress={() => router.push('/termos-uso')}
                    >
                      Termos de Uso
                    </Text>
                    {' '}e a{' '}
                    <Text 
                      style={{ color: '#007aff', textDecorationLine: 'underline' }}
                      onPress={() => router.push('/politica-privacidade')}
                    >
                      Política de Privacidade
                    </Text>
                    {' '}do Aura.
                  </Text>
                </View>
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
                  onPress={handleGoogleSignIn}
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
                disabled={loading || !aceitouTermos}
                style={{
                  backgroundColor: aceitouTermos ? '#007aff' : '#ccc',
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
              <TouchableOpacity onPress={() => {
                setMode('login');
                setAceitouTermos(false);
              }}>
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
          // NOVO USUÁRIO - Redirecionar para tela de verificação
          setUser({ ...res.user, ...userData, id: res.user.uid });
          router.replace('/email-verificacao' as any);
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
        Alert.alert('Erro', 'E-mail ou senha inválidos. Verifique seus dados e tente novamente.');
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
    if (!aceitouTermos) {
      setRegisterError('Você deve aceitar os Termos de Uso e Política de Privacidade.');
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

      // 3. Cria o documento do usuário no Firestore com dados do trial
      const trialStartDate = new Date();
      const trialExpirationDate = calculateTrialExpiration();
      
      const userData = {
        id: user.uid,
        email: email,
        nome: firstName,
        sobrenome: lastName,
        role: 'gerente',
        idSalao: null,
        emailVerificado: false,
        freeTrialStartAt: trialStartDate,
        freeTrialExpiresAt: trialExpirationDate,
        plano: 'trial',
        statusAssinatura: 'trial',
        aceitouTermos: true,
        dataAceiteTermos: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'usuarios', user.uid), userData);
      console.log('Dados do usuário criados no Firestore com trial');

      // 4. Salvar consentimento dos termos
      await salvarConsentimento(user.uid, 'termos_uso', true, '1.0');
      await salvarConsentimento(user.uid, 'politica_privacidade', true, '1.0');
      console.log('Consentimentos salvos no Firestore');

      // 5. Registra analytics do trial (não crítico)
      try {
        await trackTrialStarted(user.uid, trialStartDate);
      } catch (analyticsError) {
        console.log('Analytics não registrado (não crítico):', analyticsError);
      }

      // 6. Agenda notificações do trial (se tiver push token) - não crítico
      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) {
          await savePushTokenToFirestore(user.uid, pushToken);
          await scheduleAllTrialNotifications(user.uid, pushToken, trialStartDate);
          console.log('Notificações do trial agendadas');
        }
      } catch (notificationError) {
        console.log('Notificações não agendadas (não crítico):', notificationError);
      }

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

  async function handleGoogleSignIn() {
    console.log('handleGoogleSignIn chamado');
    setLoading(true);
    
    try {
      // Verificar se os serviços do Google Play estão disponíveis (Android)
      if (Platform.OS === 'android') {
        const hasPlayServices = await GoogleSignin.hasPlayServices();
        if (!hasPlayServices) {
          Alert.alert('Erro', 'Serviços do Google Play não estão disponíveis.');
          return;
        }
      }

      // Iniciar o processo de login com Google
      const userInfo = await GoogleSignin.signIn();
      console.log('Google Sign-In bem-sucedido:', userInfo.user?.email);

      // Obter o ID token do Google
      const idToken = await GoogleSignin.getTokens();
      console.log('ID Token obtido do Google');

      // Criar credencial do Firebase
      const googleCredential = GoogleAuthProvider.credential(idToken.accessToken);
      console.log('Credencial do Firebase criada');

      // Fazer login no Firebase
      const userCredential = await signInWithCredential(auth as Auth, googleCredential);
      console.log('Login no Firebase bem-sucedido:', userCredential.user.uid);

      // Verificar se o usuário já existe no Firestore
      const userDoc = await getDoc(doc(db, 'usuarios', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        // Usuário novo - criar documento no Firestore
        const trialStartDate = new Date();
        const trialExpirationDate = calculateTrialExpiration();
        
        const userData = {
          id: userCredential.user.uid,
          email: userCredential.user.email,
          nome: userInfo.user?.givenName || '',
          sobrenome: userInfo.user?.familyName || '',
          role: 'gerente',
          idSalao: null,
          emailVerificado: true, // Google já verifica o email
          freeTrialStartAt: trialStartDate,
          freeTrialExpiresAt: trialExpirationDate,
          plano: 'trial',
          statusAssinatura: 'trial',
          aceitouTermos: true,
          dataAceiteTermos: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await setDoc(doc(db, 'usuarios', userCredential.user.uid), userData);
        console.log('Novo usuário criado no Firestore');

        // Salvar consentimento dos termos
        await salvarConsentimento(userCredential.user.uid, 'termos_uso', true, '1.0');
        await salvarConsentimento(userCredential.user.uid, 'politica_privacidade', true, '1.0');

        // Registrar analytics do trial (não crítico)
        try {
          await trackTrialStarted(userCredential.user.uid, trialStartDate);
        } catch (analyticsError) {
          console.log('Analytics não registrado (não crítico):', analyticsError);
        }

        // Agendar notificações do trial (se tiver push token) - não crítico
        try {
          const pushToken = await registerForPushNotificationsAsync();
          if (pushToken) {
            await savePushTokenToFirestore(userCredential.user.uid, pushToken);
            await scheduleAllTrialNotifications(userCredential.user.uid, pushToken, trialStartDate);
            console.log('Notificações do trial agendadas');
          }
        } catch (notificationError) {
          console.log('Notificações não agendadas (não crítico):', notificationError);
        }
      } else {
        // Usuário existente - apenas atualizar dados se necessário
        console.log('Usuário existente encontrado no Firestore');
      }

      // O onAuthStateChanged no useAuthStore irá lidar com o redirecionamento automaticamente
      console.log('Login com Google concluído com sucesso');

    } catch (error: any) {
      console.error('Erro no login com Google:', error);
      
      let errorMessage = 'Não foi possível fazer login com o Google.';
      
      if (error.code === 'SIGN_IN_CANCELLED') {
        errorMessage = 'Login cancelado pelo usuário.';
      } else if (error.code === 'IN_PROGRESS') {
        errorMessage = 'Login já está em andamento.';
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        errorMessage = 'Serviços do Google Play não estão disponíveis.';
      }
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  }

} 