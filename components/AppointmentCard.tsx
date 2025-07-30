import { memo, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Colors, Shadows } from '../constants/DesignSystem';

interface AppointmentCardProps {
  clientName: string;
  serviceName: string;
  time: string;
  value: string;
  serviceColor: string;
  onPress: () => void;
}

export const AppointmentCard = memo<AppointmentCardProps>(({
  clientName,
  serviceName,
  time,
  value,
  serviceColor,
  onPress,
}) => {
  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress} 
      activeOpacity={0.7}
    >
      <View style={[styles.colorIndicator, { backgroundColor: serviceColor }]} />
      <View style={styles.content}>
        <View style={styles.leftContent}>
          <Text style={styles.clientName}>{clientName}</Text>
          <Text style={styles.serviceName}>{serviceName}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>
        <View style={styles.rightContent}>
          <Text style={styles.value}>{value}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

AppointmentCard.displayName = 'AppointmentCard';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBackground,
    borderRadius: wp('3%'), // ~12px em tela padrão
    marginVertical: hp('0.5%'), // ~4px em tela padrão
    marginHorizontal: wp('4%'), // ~16px em tela padrão
    ...Shadows.card,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  colorIndicator: {
    width: wp('1%'), // ~4px em tela padrão
    height: '100%',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    padding: wp('4%'), // ~16px em tela padrão
  },
  leftContent: {
    flex: 1,
  },
  rightContent: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  clientName: {
    fontSize: hp('2%'), // ~16px em tela padrão
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: hp('0.5%'), // ~4px em tela padrão
  },
  serviceName: {
    fontSize: hp('1.75%'), // ~14px em tela padrão
    fontWeight: '400',
    color: Colors.textSecondary,
    marginBottom: hp('0.5%'), // ~4px em tela padrão
  },
  time: {
    fontSize: hp('1.75%'), // ~14px em tela padrão
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  value: {
    fontSize: hp('2%'), // ~16px em tela padrão
    fontWeight: '600',
    color: Colors.textPrimary,
  },
}); 