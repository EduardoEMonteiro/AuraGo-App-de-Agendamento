import { useRoute } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { addDoc, collection, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';
import { auth, db } from '../services/firebase';

export default function RegisterInviteScreen() {
  const route = useRoute();
  const token = route.params?.token || '';
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<any>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchInvite() {
      setLoading(true);
      setError('');
      setInvite(null);
      try {
        const q = query(collection(db, 'invitations'), where('token', '==', token));
        const snap = await getDocs(q);
        if (snap.empty) {
          setError('Convite não encontrado ou inválido.');
        } else {
          const docData = snap.docs[0].data();
          if (docData.status !== 'pending') {
            setError('Convite já utilizado ou expirado.');
          } else {
            setInvite({ ...docData, id: snap.docs[0].id });
          }
        }
      } catch (e) {
        setError('Erro ao buscar convite.');
      } finally {
        setLoading(false);
      }
    }
    if (token) fetchInvite();
  }, [token]);

  async function handleRegister() {
    setError('');
    if (!name || !password || !confirmPassword) {
      setError('Preencha todos os campos.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      // Cria usuário no Auth
      const res = await createUserWithEmailAndPassword(auth, invite.inviteeEmail, password);
      // Cria documento do usuário
      await setDoc(doc(db, 'usuarios', res.user.uid), {
        email: invite.inviteeEmail,
        nome: name,
        role: invite.role,
        idSalao: invite.salonId,
      });
      // Cria membership
      await addDoc(collection(db, 'memberships'), {
        userId: res.user.uid,
        salonId: invite.salonId,
        role: invite.role,
        createdAt: new Date(),
      });
      // Marca convite como aceito
      await updateDoc(doc(db, 'invitations', invite.id), { status: 'accepted' });
      setSuccess(true);
      Alert.alert('Sucesso', 'Cadastro realizado! Faça login para acessar o salão.');
    } catch (e: any) {
      setError(e.message || 'Erro ao cadastrar.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader title="Aceitar Convite" showBackButton={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007aff" />
          <Text style={styles.loadingText}>Carregando convite...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader title="Aceitar Convite" showBackButton={false} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader title="Aceitar Convite" showBackButton={false} />
        <View style={styles.successContainer}>
          <Text style={styles.successText}>Cadastro realizado com sucesso!</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Aceitar Convite" showBackButton={false} />
      <View style={styles.content}>
        <Text style={styles.title}>Aceitar Convite</Text>
        
        <View style={styles.formContainer}>
          <Text style={styles.label}>E-mail:</Text>
          <TextInput 
            value={invite.inviteeEmail} 
            editable={false} 
            style={styles.disabledInput} 
          />
          
          <Text style={styles.label}>Nome:</Text>
          <TextInput 
            value={name} 
            onChangeText={setName} 
            placeholder="Seu nome" 
            style={styles.input} 
          />
          
          <Text style={styles.label}>Senha:</Text>
          <TextInput 
            value={password} 
            onChangeText={setPassword} 
            placeholder="Senha" 
            secureTextEntry 
            style={styles.input} 
          />
          
          <Text style={styles.label}>Confirme a senha:</Text>
          <TextInput 
            value={confirmPassword} 
            onChangeText={setConfirmPassword} 
            placeholder="Confirme a senha" 
            secureTextEntry 
            style={styles.input} 
          />
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <Button 
            title="Aceitar Convite" 
            onPress={handleRegister}
            disabled={loading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successText: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 