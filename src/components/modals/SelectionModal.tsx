import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Modal, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/DesignSystem';
import { CadastroModal } from './CadastroModal';

interface Item {
  id: string;
  name: string;
}

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (item: Item) => void;
  items: Item[];
  title: string;
  onAddNew?: (newItem: any) => void; // Função para adicionar novo item
  type?: 'cliente' | 'servico'; // Tipo para determinar campos do formulário
}

export const SelectionModal: React.FC<Props> = ({ 
  isVisible, 
  onClose, 
  onSelect, 
  items, 
  title, 
  onAddNew,
  type = 'cliente'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemData, setNewItemData] = useState({
    nome: '',
    telefone: '',
    email: '',
    observacoes: '',
    valor: '',
    duracao: '60',
    cor: '#1976d2'
  });

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectItem = (item: Item) => {
    onSelect(item);
    onClose();
  };

  const handleAddNew = () => {
    if (type === 'cliente') {
      if (!newItemData.nome.trim() || !newItemData.telefone.trim()) return;
      
      const newCliente = {
        id: `temp_${Date.now()}`,
        name: newItemData.nome,
        telefone: newItemData.telefone,
        email: newItemData.email,
        observacoes: newItemData.observacoes
      };
      
      onAddNew?.(newCliente);
      setShowAddModal(false);
      setNewItemData({ nome: '', telefone: '', email: '', observacoes: '', valor: '', duracao: '60', cor: '#1976d2' });
    } else if (type === 'servico') {
      if (!newItemData.nome.trim() || !newItemData.valor) return;
      
      const newServico = {
        id: `temp_${Date.now()}`,
        name: newItemData.nome,
        valor: parseFloat(newItemData.valor),
        duracao: parseInt(newItemData.duracao),
        cor: newItemData.cor
      };
      
      onAddNew?.(newServico);
      setShowAddModal(false);
      setNewItemData({ nome: '', telefone: '', email: '', observacoes: '', valor: '', duracao: '60', cor: '#1976d2' });
    }
  };

  const isFormValid = () => {
    if (type === 'cliente') {
      return newItemData.nome.trim().length > 0 && newItemData.telefone.trim().length > 0;
    } else if (type === 'servico') {
      return newItemData.nome.trim().length > 0 && newItemData.valor.trim().length > 0;
    }
    return false;
  };

  return (
    <>
      <Modal visible={isVisible} onRequestClose={onClose} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Feather name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Buscar ${title.toLowerCase()}...`}
              placeholderTextColor={Colors.textSecondary}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>

          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.itemContainer} onPress={() => handleSelectItem(item)}>
                <Text style={styles.itemName}>{item.name}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhum {title.toLowerCase()} encontrado</Text>
                <TouchableOpacity 
                  style={styles.addButton} 
                  onPress={() => setShowAddModal(true)}
                >
                  <Feather name="plus" size={20} color={Colors.primary} />
                  <Text style={styles.addButtonText}>Adicionar {title.slice(0, -1)}</Text>
                </TouchableOpacity>
              </View>
            }
          />

          {/* Botão FAB para adicionar */}
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setShowAddModal(true)}
          >
            <Feather name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      {/* Modal de Cadastro */}
      <CadastroModal
        isVisible={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Novo ${title.slice(0, -1)}`}
        onSave={handleAddNew}
        isSaveDisabled={!isFormValid()}
      >
        {type === 'cliente' ? (
          <>
            <Text style={styles.fieldLabel}>Nome*</Text>
            <TextInput
              placeholder="Nome do cliente"
              value={newItemData.nome}
              onChangeText={(text) => setNewItemData({...newItemData, nome: text})}
              style={styles.input}
            />
            
            <Text style={styles.fieldLabel}>Telefone*</Text>
            <TextInput
              placeholder="Telefone (obrigatório)"
              value={newItemData.telefone}
              onChangeText={(text) => setNewItemData({...newItemData, telefone: text})}
              style={styles.input}
              keyboardType="phone-pad"
            />
            
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              placeholder="Email (opcional)"
              value={newItemData.email}
              onChangeText={(text) => setNewItemData({...newItemData, email: text})}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Text style={styles.fieldLabel}>Observações</Text>
            <TextInput
              placeholder="Observações (opcional)"
              value={newItemData.observacoes}
              onChangeText={(text) => setNewItemData({...newItemData, observacoes: text})}
              style={styles.input}
              multiline
              numberOfLines={3}
            />
          </>
        ) : (
          <>
            <Text style={styles.fieldLabel}>Nome do Serviço*</Text>
            <TextInput
              placeholder="Nome do serviço"
              value={newItemData.nome}
              onChangeText={(text) => setNewItemData({...newItemData, nome: text})}
              style={styles.input}
            />
            
            <Text style={styles.fieldLabel}>Valor (R$)*</Text>
            <TextInput
              placeholder="0,00"
              value={newItemData.valor}
              onChangeText={(text) => setNewItemData({...newItemData, valor: text})}
              style={styles.input}
              keyboardType="numeric"
            />
            
            <Text style={styles.fieldLabel}>Duração (minutos)</Text>
            <TextInput
              placeholder="60"
              value={newItemData.duracao}
              onChangeText={(text) => setNewItemData({...newItemData, duracao: text})}
              style={styles.input}
              keyboardType="numeric"
            />
          </>
        )}
      </CadastroModal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.screenPadding, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { ...Typography.H2, color: Colors.textPrimary },
  closeButton: { padding: Spacing.base },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', borderRadius: Spacing.buttonRadius, margin: Spacing.screenPadding, paddingHorizontal: Spacing.base * 1.5 },
  searchIcon: { marginRight: Spacing.base },
  searchInput: { flex: 1, ...Typography.Body, height: 48 },
  itemContainer: { paddingVertical: Spacing.base * 2, paddingHorizontal: Spacing.screenPadding },
  itemName: { ...Typography.Body, color: Colors.textPrimary },
  separator: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.screenPadding },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: Spacing.base * 4 
  },
  emptyText: { 
    ...Typography.Body, 
    color: Colors.textSecondary, 
    marginBottom: Spacing.base * 2 
  },
  addButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Colors.primary + '20', 
    paddingHorizontal: Spacing.base * 2, 
    paddingVertical: Spacing.base, 
    borderRadius: Spacing.buttonRadius 
  },
  addButtonText: { 
    ...Typography.BodySemibold, 
    color: Colors.primary, 
    marginLeft: Spacing.base 
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fieldLabel: { 
    fontWeight: '600', 
    color: '#333', 
    marginBottom: 4, 
    marginTop: 12 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16,
    marginBottom: 8
  },
}); 