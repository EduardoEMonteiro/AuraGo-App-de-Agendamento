import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuthStore } from '../contexts/useAuthStore';
import { db } from '../services/firebase';
import { canEditAnyAgendamento, canEditOwnAgendamento, canViewFinanceiro } from '../utils/permissions';

export default function HomeScreen() {
  const { user, logout } = useAuthStore();
  const role = user?.role;
  const [item, setItem] = useState('');
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'itens'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  async function addItem() {
    if (!item.trim()) return;
    await addDoc(collection(db, 'itens'), {
      text: item,
      createdAt: new Date(),
      user: user?.email || 'anônimo',
    });
    setItem('');
  }

  const styles = StyleSheet.create({
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  });

  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-black p-4">
      <Text style={styles.title} className="text-black dark:text-white">
        Bem-vindo{user ? `, ${user.email}` : ''}!
      </Text>
      <Button title="Sair" onPress={logout} />
      {/* Exemplo de controle de acesso por role */}
      {canViewFinanceiro(role) && (
        <Button title="Totais Financeiros" onPress={() => alert('Acesso ao financeiro!')} />
      )}
      {canEditAnyAgendamento(role) && (
        <Button title="Agendar para qualquer profissional" onPress={() => alert('Agendar para qualquer profissional!')} />
      )}
      {canEditOwnAgendamento(role) && (
        <Button title="Agendar para mim" onPress={() => alert('Agendar para mim!')} />
      )}
      <View className="w-full flex-row items-center mt-6 mb-2">
        <TextInput
          value={item}
          onChangeText={setItem}
          placeholder="Novo item"
          className="flex-1 border p-2 mr-2 bg-white text-black"
        />
        <Button title="Adicionar" onPress={addItem} />
      </View>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Text className="text-black dark:text-white border-b py-2">{item.text} ({item.user})</Text>
        )}
        style={{ width: '100%' }}
      />
    </View>
  );
} 