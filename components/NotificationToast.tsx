import { memo, useCallback } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useNotifications } from '../contexts/NotificationsContext';

export const NotificationToast = memo(() => {
  const { notifications, markAsRead, removeNotification } = useNotifications();
  const naoLidas = notifications.filter(n => !n.lida);
  
  if (naoLidas.length === 0) return null;
  
  const n = naoLidas[0];
  
  const handleMarkAsRead = useCallback(() => {
    markAsRead(n.id);
  }, [markAsRead, n.id]);
  
  const handleRemoveNotification = useCallback(() => {
    removeNotification(n.id);
  }, [removeNotification, n.id]);

  return (
    <Animated.View style={styles.toast}>
      <View style={{ flex: 1 }}>
        <Text style={styles.titulo}>{n.titulo}</Text>
        <Text style={styles.msg}>{n.mensagem}</Text>
      </View>
      <TouchableOpacity style={styles.btn} onPress={handleMarkAsRead}>
        <Text style={styles.btnTxt}>Confirmar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnFechar} onPress={handleRemoveNotification}>
        <Text style={styles.btnFecharTxt}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

NotificationToast.displayName = 'NotificationToast';

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: hp('5%'), // ~40px em tela padrão
    left: wp('4%'), // ~16px em tela padrão
    right: wp('4%'), // ~16px em tela padrão
    backgroundColor: '#1976d2',
    borderRadius: wp('3%'), // ~12px em tela padrão
    padding: wp('4%'), // ~16px em tela padrão
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    zIndex: 100,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  titulo: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: hp('2%'), // ~16px em tela padrão
    marginBottom: hp('0.25%') // ~2px em tela padrão
  },
  msg: { 
    color: '#fff', 
    fontSize: hp('1.75%') // ~14px em tela padrão
  },
  btn: { 
    backgroundColor: '#fff', 
    borderRadius: wp('2%'), // ~8px em tela padrão
    paddingHorizontal: wp('3%'), // ~12px em tela padrão
    paddingVertical: hp('0.75%'), // ~6px em tela padrão
    marginLeft: wp('3%') // ~12px em tela padrão
  },
  btnTxt: { 
    color: '#1976d2', 
    fontWeight: 'bold' 
  },
  btnFechar: { 
    marginLeft: wp('2%'), // ~8px em tela padrão
    padding: wp('1%') // ~4px em tela padrão
  },
  btnFecharTxt: { 
    color: '#fff', 
    fontSize: hp('2.75%'), // ~22px em tela padrão
    fontWeight: 'bold' 
  },
}); 