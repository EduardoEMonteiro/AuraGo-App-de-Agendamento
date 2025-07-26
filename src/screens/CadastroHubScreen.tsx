import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Supondo que você tenha um arquivo de Design System
const Colors = {
  background: '#F7F7F7',
  cardBackground: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6E6E73',
  primary: '#007AFF',
  border: '#E5E5EA',
};

const Typography = {
  H1: { fontSize: 28, fontWeight: 'bold' as 'bold' },
  H2: { fontSize: 20, fontWeight: '600' as '600' },
  Body: { fontSize: 16, fontWeight: '400' as '400' },
};

const Spacing = {
  screenPadding: 16,
  base: 8,
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

export default function CadastroHubScreen() {

  const menuOptions = [
    {
      title: 'Cliente',
      description: 'Adicione novos clientes e gerencie seus dados.',
      icon: 'user-plus',
      action: () => router.push('/(tabs)/clientes'),
    },
    {
      title: 'Serviço',
      description: 'Cadastre os serviços que seu salão oferece.',
      icon: 'award',
      action: () => router.push('/(tabs)/servicos'),
    },
    {
      title: 'Produto',
      description: 'Gerencie seu estoque de produtos para venda.',
      icon: 'package',
      action: () => router.push('/(tabs)/produtos'),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Cadastros</Text>
        <Text style={styles.subtitle}>O que você deseja cadastrar ou gerenciar hoje?</Text>

        <View style={styles.menuContainer}>
          {menuOptions.map((option) => (
            <TouchableOpacity
              key={option.title}
              style={styles.card}
              onPress={option.action}
            >
              <View style={styles.iconContainer}>
                <Feather name={option.icon as any} size={28} color={Colors.primary} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>{option.title}</Text>
                <Text style={styles.cardDescription}>{option.description}</Text>
              </View>
              <Feather name="chevron-right" size={24} color={Colors.border} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    padding: Spacing.screenPadding,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
  subtitle: {
    ...Typography.Body,
    color: Colors.textSecondary,
    marginBottom: Spacing.base * 4,
  },
  menuContainer: {
    width: '100%',
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: Spacing.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base * 2,
    ...Shadows.card,
  },
  iconContainer: {
    backgroundColor: '#E5F1FF', // Um azul bem claro
    borderRadius: 8,
    padding: 12,
    marginRight: Spacing.screenPadding,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.H2,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cardDescription: {
    ...Typography.Body,
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
}); 