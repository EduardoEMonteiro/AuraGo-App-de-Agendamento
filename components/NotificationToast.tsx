import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNotifications } from '../contexts/NotificationsContext';

export default function NotificationToast() {
  const { notifications, markAsRead, removeNotification } = useNotifications();
  const naoLidas = notifications.filter(n => !n.lida);
  if (naoLidas.length === 0) return null;
  const n = naoLidas[0];
  return (
    <Animated.View style={styles.toast}>
      <View style={{ flex: 1 }}>
        <Text style={styles.titulo}>{n.titulo}</Text>
        <Text style={styles.msg}>{n.mensagem}</Text>
      </View>
      <TouchableOpacity style={styles.btn} onPress={() => markAsRead(n.id)}>
        <Text style={styles.btnTxt}>Confirmar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnFechar} onPress={() => removeNotification(n.id)}>
        <Text style={styles.btnFecharTxt}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    backgroundColor: '#1976d2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    zIndex: 100,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  titulo: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
  msg: { color: '#fff', fontSize: 14 },
  btn: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginLeft: 12 },
  btnTxt: { color: '#1976d2', fontWeight: 'bold' },
  btnFechar: { marginLeft: 8, padding: 4 },
  btnFecharTxt: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
}); 