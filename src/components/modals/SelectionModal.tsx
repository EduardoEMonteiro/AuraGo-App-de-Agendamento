import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Modal, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/DesignSystem';

interface Item {
  id: string;
  name: string;
}

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (item: Item) => void;
  items: Item[];
  title: string;
}

export const SelectionModal: React.FC<Props> = ({ isVisible, onClose, onSelect, items, title }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectItem = (item: Item) => {
    onSelect(item);
    onClose();
  };

  return (
    <Modal visible={isVisible} onRequestClose={onClose} animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Buscar ${title.toLowerCase()}...`}
            placeholderTextColor={Colors.textSecondary}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.itemContainer} onPress={() => handleSelectItem(item)}>
              <Text style={styles.itemName}>{item.name}</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.screenPadding, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { ...Typography.H2, color: Colors.textPrimary },
  closeButton: { padding: Spacing.base },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', borderRadius: Spacing.buttonRadius, margin: Spacing.screenPadding, paddingHorizontal: Spacing.base * 1.5 },
  searchIcon: { marginRight: Spacing.base },
  searchInput: { flex: 1, ...Typography.Body, height: 48 },
  itemContainer: { paddingVertical: Spacing.base * 2, paddingHorizontal: Spacing.screenPadding },
  itemName: { ...Typography.Body, color: Colors.textPrimary },
  separator: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.screenPadding },
}); 