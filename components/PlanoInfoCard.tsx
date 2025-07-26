import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSalaoInfo } from '../hooks/useSalaoInfo';

interface PlanoInfoCardProps {
  showUpgradeButton?: boolean;
}

export function PlanoInfoCard({ showUpgradeButton = true }: PlanoInfoCardProps) {
  const { salaoInfo, getCurrentPlanoInfo } = useSalaoInfo();
  
  if (!salaoInfo?.plano) {
    return null;
  }

  const planoInfo = getCurrentPlanoInfo();
  const isEssencial = salaoInfo.plano === 'essencial';

  const handleUpgrade = () => {
    Alert.alert(
      'Upgrade para Plano Pro',
      'Entre em contato conosco para fazer o upgrade do seu plano e desbloquear todos os recursos avançados!',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Contatar', onPress: () => {
          // Aqui você pode implementar a lógica para contato
          Alert.alert('Contato', 'WhatsApp: (11) 99999-9999\nEmail: contato@aura.com');
        }}
      ]
    );
  };

  return (
    <View style={[styles.container, isEssencial ? styles.essencial : styles.pro]}>
      <View style={styles.header}>
        <Text style={styles.planoNome}>{planoInfo?.nome}</Text>
        {planoInfo?.preco && (
          <Text style={styles.preco}>{planoInfo.preco}</Text>
        )}
      </View>
      
      <Text style={styles.descricao}>{planoInfo?.descricao}</Text>
      
      {isEssencial && showUpgradeButton && (
        <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
          <Text style={styles.upgradeButtonText}>Fazer Upgrade</Text>
        </TouchableOpacity>
      )}
      
      {!isEssencial && (
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>✓ Plano Ativo</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  essencial: {
    backgroundColor: '#f0f8ff',
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
  },
  pro: {
    backgroundColor: '#e8f5e8',
    borderLeftWidth: 4,
    borderLeftColor: '#388e3c',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planoNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  preco: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  descricao: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  proBadge: {
    backgroundColor: '#388e3c',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  proBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 