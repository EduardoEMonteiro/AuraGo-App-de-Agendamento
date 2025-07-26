import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Shadows, Spacing, Typography } from '../constants/DesignSystem';

interface Props {
  reason: string;
  startTime: string;
  endTime: string;
}

const ScheduleBlockCard: React.FC<Props> = ({ reason, startTime, endTime }) => {
  return (
    <View style={styles.container}>
      <Feather name="lock" size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
      <View style={styles.content}>
        <Text style={styles.reason}>{reason}</Text>
        <Text style={styles.time}>{startTime} - {endTime}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blockBackground,
    borderRadius: Spacing.buttonRadius,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: Spacing.base / 2,
    ...Shadows.card,
    padding: Spacing.base * 1.5,
  },
  content: {
    flex: 1,
  },
  reason: {
    ...Typography.BodySemibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  time: {
    ...Typography.Caption,
    color: Colors.textSecondary,
  },
});

export default ScheduleBlockCard; 