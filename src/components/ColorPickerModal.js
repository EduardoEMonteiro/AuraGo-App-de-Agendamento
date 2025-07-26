import React from 'react';
import { Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const ColorPickerModal = ({ isVisible, onClose, colors, selectedColor, onSelect }) => {
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Escolha uma Cor</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Fechar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.grid}>
          {colors.map((cor) => (
            <TouchableOpacity
              key={cor}
              onPress={() => {
                onSelect(cor);
                onClose();
              }}
              style={[styles.colorOption, { backgroundColor: cor }]}
            >
              {selectedColor === cor && (
                <View style={styles.checkWrapper}>
                  <Text style={styles.check}>✔</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
    title: { fontSize: 20, fontWeight: 'bold' },
    closeButton: { fontSize: 16, color: '#1976d2' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: 16 },
    colorOption: { width: 50, height: 50, borderRadius: 25, margin: 10, justifyContent: 'center', alignItems: 'center' },
    checkWrapper: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.7)', justifyContent: 'center', alignItems: 'center' },
    check: { color: '#000', fontWeight: 'bold', fontSize: 14 }
}); 