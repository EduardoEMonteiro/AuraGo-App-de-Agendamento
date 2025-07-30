import { doc, updateDoc } from 'firebase/firestore';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomHeader } from '../components/CustomHeader';
import { useAuthStore } from '../contexts/useAuthStore';
import { useSalaoInfo } from '../hooks/useSalaoInfo';
import { db } from '../services/firebase';

// Interface para o endereço
interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento?: string;
}

export const SalaoScreen = memo(() => {
  const { user } = useAuthStore();
  const { salaoInfo, loading: loadingSalao, loadSalaoInfo } = useSalaoInfo();

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState<Endereco>({
    cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (salaoInfo) {
      setNome(salaoInfo.nome || '');
      setTelefone(salaoInfo.telefone || '');
      if (salaoInfo.endereco) {
        setEndereco(salaoInfo.endereco);
      }
    }
  }, [salaoInfo]);

  const handleEnderecoChange = (field: keyof Endereco, value: string) => {
    setEndereco(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = useCallback(async () => {
    if (!user?.idSalao) {
      Alert.alert('Erro', 'ID do salão não encontrado.');
      return;
    }
    if (!nome.trim()) {
      Alert.alert('Atenção', 'O nome do salão é obrigatório.');
      return;
    }

    setIsSaving(true);
    try {
      const salaoRef = doc(db, 'saloes', user.idSalao);
      await updateDoc(salaoRef, {
        nome,
        telefone,
        endereco,
      });

      // Força a recarga dos dados do salão no estado global
      await loadSalaoInfo(); 

      Alert.alert('Sucesso', 'Informações do salão atualizadas!');
    } catch (error) {
      console.error("Erro ao atualizar informações do salão:", error);
      Alert.alert('Erro', 'Não foi possível atualizar as informações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  }, [user, nome, telefone, endereco, loadSalaoInfo]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <CustomHeader title="Gerenciar Salão" showBackButton={true} />
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {loadingSalao ? (
          <ActivityIndicator size="large" color="#1976d2" />
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>Nome do Salão</Text>
              <TextInput
                style={styles.input}
                value={nome}
                onChangeText={setNome}
                placeholder="Ex: Belle Salon"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Telefone de Contato</Text>
              <TextInput
                style={styles.input}
                value={telefone}
                onChangeText={setTelefone}
                placeholder="(00) 00000-0000"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <Text style={styles.sectionTitle}>Endereço</Text>

            {/* Campos de Endereço */}
            <View style={styles.section}>
              <Text style={styles.label}>CEP</Text>
              <TextInput
                style={styles.input}
                value={endereco.cep}
                onChangeText={(text) => handleEnderecoChange('cep', text)}
                placeholder="00000-000"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Logradouro (Rua, Av.)</Text>
              <TextInput
                style={styles.input}
                value={endereco.logradouro}
                onChangeText={(text) => handleEnderecoChange('logradouro', text)}
                placeholder="Ex: Av. Principal"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Número</Text>
              <TextInput
                style={styles.input}
                value={endereco.numero}
                onChangeText={(text) => handleEnderecoChange('numero', text)}
                placeholder="Ex: 123"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Bairro</Text>
              <TextInput
                style={styles.input}
                value={endereco.bairro}
                onChangeText={(text) => handleEnderecoChange('bairro', text)}
                placeholder="Ex: Centro"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Cidade</Text>
              <TextInput
                style={styles.input}
                value={endereco.cidade}
                onChangeText={(text) => handleEnderecoChange('cidade', text)}
                placeholder="Ex: São Paulo"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Estado</Text>
              <TextInput
                style={styles.input}
                value={endereco.estado}
                onChangeText={(text) => handleEnderecoChange('estado', text)}
                placeholder="Ex: SP"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Complemento (Opcional)</Text>
              <TextInput
                style={styles.input}
                value={endereco.complemento || ''}
                onChangeText={(text) => handleEnderecoChange('complemento', text)}
                placeholder="Ex: Sala 101"
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Salvar Alterações</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
});

export default SalaoScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: wp('5%'),
  },
  section: {
    marginBottom: hp('2.5%'),
  },
  sectionTitle: {
    fontSize: hp('2.5%'),
    fontWeight: 'bold',
    marginBottom: hp('2%'),
    borderTopWidth: 1,
    paddingTop: hp('2%'),
    color: '#333',
  },
  label: {
    fontSize: hp('1.8%'),
    marginBottom: hp('1%'),
    color: '#666',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: hp('1.5%'),
    fontSize: hp('2%'),
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#1976d2',
    padding: hp('2%'),
    borderRadius: 8,
    alignItems: 'center',
    marginTop: hp('2%'),
  },
  saveButtonText: {
    color: '#fff',
    fontSize: hp('2%'),
    fontWeight: 'bold',
  },
}); 