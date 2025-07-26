import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNotifications } from '../contexts/NotificationsContext';

export default function NotificationBadge({ onPress }: { onPress?: () => void }) {
  const { notifications } = useNotifications();
  const naoLidas = notifications.filter(n => !n.lida);
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name="notifications" size={28} color={naoLidas.length > 0 ? '#1976d2' : '#888'} />
      {naoLidas.length > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>{naoLidas.length}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', padding: 4 },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#d32f2f',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    zIndex: 10,
  },
  badgeTxt: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
}); 