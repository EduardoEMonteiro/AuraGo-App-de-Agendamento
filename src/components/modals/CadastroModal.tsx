import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/DesignSystem';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  onSave: () => void;
  isSaveDisabled?: boolean;
  children: React.ReactNode;
}

export const CadastroModal: React.FC<Props> = ({
  isVisible,
  onClose,
  title,
  onSave,
  isSaveDisabled = false,
  children,
}) => {
  return (
    <Modal visible={isVisible} onRequestClose={onClose} animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.button}>
            <Feather name="x" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onSave} disabled={isSaveDisabled} style={styles.button}>
            <Text style={[styles.saveButtonText, { opacity: isSaveDisabled ? 0.5 : 1 }]}>Salvar</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.formContainer}>
          {children}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.base * 1.5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { ...Typography.H2, color: Colors.textPrimary },
  button: { padding: Spacing.base },
  saveButtonText: { ...Typography.BodySemibold, color: Colors.primary, fontSize: 18 },
  formContainer: { padding: Spacing.screenPadding },
}); 