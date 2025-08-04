import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PendenciasFinanceirasCardProps {
  agendamentosPendentes: number;
  naoCompareceram: number;
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

export function PendenciasFinanceirasCard({ 
  agendamentosPendentes, 
  naoCompareceram 
}: PendenciasFinanceirasCardProps) {
  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const temPendencias = agendamentosPendentes > 0 || naoCompareceram > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Feather name="alert-triangle" size={20} color={Colors.warning} />
        <Text style={styles.title}>Pendências Financeiras</Text>
      </View>
      
      {!temPendencias ? (
        <View style={styles.noPendenciasContainer}>
          <Feather name="check-circle" size={24} color={Colors.success} />
          <Text style={styles.noPendenciasText}>
            Nenhuma pendência financeira encontrada.
          </Text>
        </View>
      ) : (
        <View style={styles.pendenciasList}>
          <TouchableOpacity style={styles.pendenciaItem}>
            <View style={styles.pendenciaHeader}>
              <Feather name="clock" size={20} color={Colors.warning} />
              <Text style={styles.pendenciaLabel}>Agendamentos Pendentes</Text>
              <Feather name="help-circle" size={16} color={Colors.textSecondary} />
            </View>
            <Text style={styles.pendenciaValue}>{formatCurrency(agendamentosPendentes)}</Text>
            <Text style={styles.pendenciaTooltip}>
              Valor total de agendamentos realizados que ainda não foram confirmados como pagos.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pendenciaItem}>
            <View style={styles.pendenciaHeader}>
              <Feather name="x-circle" size={20} color={Colors.error} />
              <Text style={styles.pendenciaLabel}>Não Compareceram</Text>
              <Feather name="help-circle" size={16} color={Colors.textSecondary} />
            </View>
            <Text style={styles.pendenciaValue}>{naoCompareceram}</Text>
            <Text style={styles.pendenciaTooltip}>
              Número de clientes que não compareceram ao agendamento.
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base * 2,
  },
  title: {
    ...Typography.H2,
    color: Colors.textPrimary,
    marginLeft: Spacing.base,
  },
  noPendenciasContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.base * 3,
  },
  noPendenciasText: {
    ...Typography.Body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.base,
  },
  pendenciasList: {
    gap: Spacing.base * 2,
  },
  pendenciaItem: {
    paddingVertical: Spacing.base,
  },
  pendenciaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  pendenciaLabel: {
    ...Typography.Body,
    color: Colors.textPrimary,
    marginLeft: Spacing.base,
    flex: 1,
  },
  pendenciaValue: {
    ...Typography.H2,
    color: Colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: Spacing.base,
  },
  pendenciaTooltip: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
}); 