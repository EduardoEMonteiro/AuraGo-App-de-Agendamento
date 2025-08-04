import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface IndicadoresFinanceirosCardProps {
  ticketMedio: number;
  totalAtendimentos: number;
  variacaoReceita: number;
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

export function IndicadoresFinanceirosCard({ 
  ticketMedio, 
  totalAtendimentos, 
  variacaoReceita 
}: IndicadoresFinanceirosCardProps) {
  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1).replace('.', ',')}%`;
  };

  const isPositive = variacaoReceita >= 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Indicadores Financeiros</Text>
      
      <View style={styles.indicatorsGrid}>
        <TouchableOpacity style={styles.indicatorCard}>
          <View style={styles.indicatorHeader}>
            <Text style={styles.indicatorLabel}>Ticket Médio</Text>
            <Feather name="help-circle" size={16} color={Colors.textSecondary} />
          </View>
          <Text style={styles.indicatorValue}>{formatCurrency(ticketMedio)}</Text>
          <Text style={styles.indicatorTooltip}>
            Média de receita por atendimento finalizado neste período.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.indicatorCard}>
          <View style={styles.indicatorHeader}>
            <Text style={styles.indicatorLabel}>Atendimentos Realizados</Text>
            <Feather name="help-circle" size={16} color={Colors.textSecondary} />
          </View>
          <Text style={styles.indicatorValue}>{totalAtendimentos}</Text>
          <Text style={styles.indicatorTooltip}>
            Número de atendimentos concluídos no período selecionado.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.indicatorCard}>
          <View style={styles.indicatorHeader}>
            <Text style={styles.indicatorLabel}>Variação Receita</Text>
            <Feather 
              name={isPositive ? "arrow-up" : "arrow-down"} 
              size={16} 
              color={isPositive ? Colors.success : Colors.error} 
            />
          </View>
          <Text style={[styles.indicatorValue, { color: isPositive ? Colors.success : Colors.error }]}>
            {formatPercentage(variacaoReceita)}
          </Text>
          <Text style={styles.indicatorTooltip}>
            Comparação percentual da receita com o período anterior. Indica crescimento ou redução.
          </Text>
        </TouchableOpacity>
      </View>
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
  indicatorsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  indicatorCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.base,
  },
  indicatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  indicatorLabel: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    marginRight: Spacing.base / 2,
  },
  indicatorValue: {
    ...Typography.H2,
    color: Colors.textPrimary,
    fontWeight: 'bold',
  },
  indicatorTooltip: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.base,
    fontSize: 12,
  },
}); 