import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useNotifications } from '../contexts/NotificationsContext';

interface NotificationBadgeProps {
  onPress?: () => void;
}

export const NotificationBadge = memo<NotificationBadgeProps>(({ onPress }) => {
  const { notifications } = useNotifications();
  const naoLidas = notifications.filter(n => !n.lida);
  
  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress} 
      activeOpacity={0.7}
    >
      <Ionicons 
        name="notifications" 
        size={hp('3.5%')} // ~28px em tela padrão
        color={naoLidas.length > 0 ? '#1976d2' : '#888'} 
      />
      {naoLidas.length > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>{naoLidas.length}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

NotificationBadge.displayName = 'NotificationBadge';

const styles = StyleSheet.create({
  container: { 
    position: 'relative', 
    padding: wp('1%') // ~4px em tela padrão
  },
  badge: {
    position: 'absolute',
    top: wp('0.5%'), // ~2px em tela padrão
    right: wp('0.5%'), // ~2px em tela padrão
    backgroundColor: '#d32f2f',
    borderRadius: wp('2.5%'), // ~10px em tela padrão
    minWidth: wp('4.5%'), // ~18px em tela padrão
    height: hp('2.25%'), // ~18px em tela padrão
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('1%'), // ~4px em tela padrão
    zIndex: 10,
  },
  badgeTxt: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: hp('1.5%') // ~12px em tela padrão
  },
}); 