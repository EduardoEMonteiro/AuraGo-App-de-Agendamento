import { Feather } from '@expo/vector-icons';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../contexts/useAuthStore';
import { db } from '../services/firebase';

interface MetaFaturamentoCardProps {
  metaMensal: {
    valor: number;
    atual: number;
    faltam: number;
    percentual: number;
  } | null;
}

const Colors = {
  background: '#F7F7F7',
  cardBackground: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6E6E73',
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  primary: '#007AFF',
};

const Typography = {
  H2: { fontSize: 20, fontWeight: '600' as '600' },
  Body: { fontSize: 16, fontWeight: '400' as '400' },
  BodySemibold: { fontSize: 16, fontWeight: '600' as '600' },
  Caption: { fontSize: 14, fontWeight: '400' as '400' },
};

const Spacing = {
  base: 8,
  cardPadding: 16,
  borderRadius: 12,
};

const Shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
};

export function MetaFaturamentoCard({ metaMensal }: MetaFaturamentoCardProps) {
  const { user } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [novaMeta, setNovaMeta] = useState('');

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const handleDefinirMeta = async () => {
    if (!user?.idSalao) {
      Alert.alert('Erro', 'Salão não identificado.');
      return;
    }

    const valor = parseFloat(novaMeta.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      Alert.alert('Erro', 'Digite um valor válido para a meta.');
      return;
    }

    try {
      await setDoc(doc(db, 'saloes', user.idSalao, 'metas', 'faturamento'), {
        nome: 'faturamento',
        valor: valor,
        tipo: 'mensal',
        createdAt: new Date(),
      });
      
      setModalVisible(false);
      setNovaMeta('');
      Alert.alert('Sucesso', 'Meta definida com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      Alert.alert('Erro', 'Erro ao salvar meta. Tente novamente.');
    }
  };

  if (!metaMensal) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Meta de Faturamento Mensal</Text>
        <View style={styles.noMetaContainer}>
          <Text style={styles.noMetaText}>
            Defina sua meta para começar a acompanhar.
          </Text>
          <TouchableOpacity 
            style={styles.definirMetaButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.definirMetaButtonText}>Definir Meta</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meta de Faturamento Mensal</Text>
      
      <View style={styles.metaInfo}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Meta:</Text>
          <Text style={styles.metaValue}>{formatCurrency(metaMensal.valor)}</Text>
        </View>
        
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Conquistado:</Text>
          <Text style={styles.metaValue}>{formatCurrency(metaMensal.atual)}</Text>
        </View>
        
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Faltam:</Text>
          <Text style={[styles.metaValue, { color: Colors.warning }]}>
            {formatCurrency(metaMensal.faltam)} ({metaMensal.percentual.toFixed(0)}%)
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View 
            style={[
              styles.progressBar, 
              { 
                width: `${Math.min(metaMensal.percentual, 100)}%`,
                backgroundColor: metaMensal.percentual >= 100 ? Colors.success : Colors.primary
              }
            ]} 
          />
        </View>
        <Text style={styles.progressTooltip}>
          Progresso da sua meta mensal de faturamento.
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.editButton}
        onPress={() => setModalVisible(true)}
      >
        <Feather name="edit-3" size={16} color={Colors.primary} />
        <Text style={styles.editButtonText}>Editar Meta</Text>
      </TouchableOpacity>

      {/* Modal para definir/editar meta */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {metaMensal ? 'Editar Meta' : 'Definir Meta'}
            </Text>
            
            <Text style={styles.modalLabel}>Valor da meta mensal (R$)</Text>
            <TextInput
              style={styles.modalInput}
              value={novaMeta}
              onChangeText={setNovaMeta}
              placeholder="Ex: 5000"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonCancel}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalButtonConfirm}
                onPress={handleDefinirMeta}
              >
                <Text style={[styles.modalButtonText, { color: Colors.textPrimary }]}>
                  Salvar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Spacing.borderRadius,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.base * 2,
    ...Shadows.card,
  },
  title: {
    ...Typography.H2,
    color: Colors.textPrimary,
    marginBottom: Spacing.base * 2,
  },
  noMetaContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.base * 3,
  },
  noMetaText: {
    ...Typography.Body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.base * 2,
  },
  definirMetaButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.base * 2,
    paddingVertical: Spacing.base,
    borderRadius: Spacing.borderRadius,
  },
  definirMetaButtonText: {
    ...Typography.BodySemibold,
    color: Colors.textPrimary,
  },
  metaInfo: {
    marginBottom: Spacing.base * 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  metaLabel: {
    ...Typography.Body,
    color: Colors.textSecondary,
  },
  metaValue: {
    ...Typography.BodySemibold,
    color: Colors.textPrimary,
  },
  progressContainer: {
    marginBottom: Spacing.base * 2,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: 4,
    marginBottom: Spacing.base,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressTooltip: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
  },
  editButtonText: {
    ...Typography.Caption,
    color: Colors.primary,
    marginLeft: Spacing.base / 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.base * 4,
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Spacing.borderRadius,
    padding: Spacing.cardPadding,
    width: '100%',
  },
  modalTitle: {
    ...Typography.H2,
    color: Colors.textPrimary,
    marginBottom: Spacing.base * 2,
    textAlign: 'center',
  },
  modalLabel: {
    ...Typography.Body,
    color: Colors.textSecondary,
    marginBottom: Spacing.base,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: Spacing.borderRadius,
    padding: Spacing.base * 1.5,
    color: Colors.textPrimary,
    fontSize: 16,
    marginBottom: Spacing.base * 2,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: Spacing.base,
    marginRight: Spacing.base,
  },
  modalButtonConfirm: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.base,
    borderRadius: Spacing.borderRadius,
    marginLeft: Spacing.base,
  },
  modalButtonText: {
    ...Typography.BodySemibold,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
}); 