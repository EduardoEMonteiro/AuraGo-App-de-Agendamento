import { useRoute } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { addDoc, collection, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Text, TextInput, View } from 'react-native';
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

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>;
  if (error) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'red' }}>{error}</Text></View>;
  if (success) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'green' }}>Cadastro realizado com sucesso!</Text></View>;

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 24 }}>Aceitar Convite</Text>
      <Text style={{ marginBottom: 8 }}>E-mail:</Text>
      <TextInput value={invite.inviteeEmail} editable={false} style={{ backgroundColor: '#eee', borderRadius: 8, padding: 12, marginBottom: 16, width: '100%' }} />
      <Text style={{ marginBottom: 8 }}>Nome:</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Seu nome" style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 16, width: '100%' }} />
      <Text style={{ marginBottom: 8 }}>Senha:</Text>
      <TextInput value={password} onChangeText={setPassword} placeholder="Senha" secureTextEntry style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 16, width: '100%' }} />
      <Text style={{ marginBottom: 8 }}>Confirme a senha:</Text>
      <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirme a senha" secureTextEntry style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 16, width: '100%' }} />
      {error ? <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text> : null}
      <Button title="Cadastrar" onPress={handleRegister} />
    </View>
  );
} 