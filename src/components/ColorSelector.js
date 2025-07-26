import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const ColorSelector = ({ label, selectedColor, onPress }) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity onPress={onPress} style={styles.selector}>
      <View style={[styles.colorPreview, { backgroundColor: selectedColor }]} />
      <Text style={styles.colorHex}>{selectedColor}</Text>
      <Text style={styles.changeText}>Trocar</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { marginBottom: 8, color: '#333', fontWeight: '600' },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  colorHex: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  changeText: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: 'bold',
  }
}); 