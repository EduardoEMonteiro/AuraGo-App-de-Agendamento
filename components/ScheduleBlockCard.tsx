import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Feather } from '@expo/vector-icons';
import { Colors, Icons } from '../constants/DesignSystem';

interface ScheduleBlockCardProps {
  reason: string;
  startTime: string;
  endTime: string;
}

export const ScheduleBlockCard = memo<ScheduleBlockCardProps>(({
  reason,
  startTime,
  endTime,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.hatchPattern} />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Feather name="lock" size={Icons.size} color={Colors.textSecondary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.reason}>{reason}</Text>
          <Text style={styles.timeRange}>{startTime} - {endTime}</Text>
        </View>
      </View>
    </View>
  );
});

ScheduleBlockCard.displayName = 'ScheduleBlockCard';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.blockBackground,
    borderRadius: wp('3%'), // ~12px em tela padrão
    marginVertical: hp('0.5%'), // ~4px em tela padrão
    marginHorizontal: wp('4%'), // ~16px em tela padrão
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  hatchPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    opacity: 0.1,
    // Simulando hachuras com gradiente linear
    transform: [{ rotate: '45deg' }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp('4%'), // ~16px em tela padrão
  },
  iconContainer: {
    marginRight: wp('2%'), // ~8px em tela padrão
  },
  textContainer: {
    flex: 1,
  },
  reason: {
    fontSize: hp('2%'), // ~16px em tela padrão
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: hp('0.5%'), // ~4px em tela padrão
  },
  timeRange: {
    fontSize: hp('1.75%'), // ~14px em tela padrão
    fontWeight: '400',
    color: Colors.textSecondary,
  },
}); 