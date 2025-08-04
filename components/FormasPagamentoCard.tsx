import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FormasPagamentoCardProps {
  receitasPorFormaPagamento: Record<string, number>;
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

const FORMAS_PAGAMENTO_ICONES: Record<string, any> = {
  'Pix': 'credit-card',
  'Dinheiro': 'dollar-sign',
  'Cartão': 'credit-card',
  'Cartão de Crédito': 'credit-card',
  'Cartão de Débito': 'credit-card',
  'Transferência': 'arrow-right',
  'Boleto': 'file-text',
  'Não informado': 'help-circle',
};

export function FormasPagamentoCard({ receitasPorFormaPagamento }: FormasPagamentoCardProps) {
  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const formasPagamento = Object.entries(receitasPorFormaPagamento);
  const temDados = formasPagamento.length > 0;

  if (!temDados) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Recebimentos por Forma de Pagamento</Text>
        <View style={styles.noDataContainer}>
          <Feather name="info" size={24} color={Colors.textSecondary} />
          <Text style={styles.noDataText}>
            Nenhum dado disponível para formas de pagamento neste período.
          </Text>
        </View>
        <Text style={styles.tooltip}>
          Distribuição da receita por diferentes formas de pagamento utilizadas pelos clientes.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recebimentos por Forma de Pagamento</Text>
      
      <View style={styles.formasList}>
        {formasPagamento.map(([forma, valor]) => (
          <TouchableOpacity key={forma} style={styles.formaItem}>
            <View style={styles.formaHeader}>
              <Feather 
                name={FORMAS_PAGAMENTO_ICONES[forma as keyof typeof FORMAS_PAGAMENTO_ICONES] || 'help-circle'} 
                size={20} 
                color={Colors.primary} 
              />
              <Text style={styles.formaLabel}>{forma}</Text>
            </View>
            <Text style={styles.formaValue}>{formatCurrency(valor)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.tooltip}>
        Distribuição da receita por diferentes formas de pagamento utilizadas pelos clientes.
      </Text>
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
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.base * 3,
  },
  noDataText: {
    ...Typography.Body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.base,
  },
  formasList: {
    marginBottom: Spacing.base * 2,
  },
  formaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  formaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  formaLabel: {
    ...Typography.Body,
    color: Colors.textPrimary,
    marginLeft: Spacing.base,
  },
  formaValue: {
    ...Typography.BodySemibold,
    color: Colors.textPrimary,
  },
  tooltip: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 