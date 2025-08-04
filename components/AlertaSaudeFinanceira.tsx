import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface AlertaSaudeFinanceiraProps {
  alertaSaudeFinanceira: boolean;
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

export function AlertaSaudeFinanceira({ alertaSaudeFinanceira }: AlertaSaudeFinanceiraProps) {
  if (!alertaSaudeFinanceira) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Feather name="alert-triangle" size={20} color={Colors.warning} />
        <Text style={styles.title}>
          ⚠️ Atenção: suas despesas consumiram mais de 70% da receita neste período.
        </Text>
      </View>
      
      <TouchableOpacity style={styles.tooltipContainer}>
        <Text style={styles.tooltipText}>
          Despesas altas podem indicar que seu lucro está baixo. Revise seus custos.
        </Text>
        <Feather name="help-circle" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Spacing.borderRadius,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.base * 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.base,
  },
  title: {
    ...Typography.BodySemibold,
    color: Colors.warning,
    marginLeft: Spacing.base,
    flex: 1,
    lineHeight: 22,
  },
  tooltipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tooltipText: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: Spacing.base,
    fontStyle: 'italic',
  },
}); 