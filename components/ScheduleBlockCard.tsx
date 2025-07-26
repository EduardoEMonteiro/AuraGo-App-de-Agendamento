import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Icons, Spacing, Typography } from '../constants/DesignSystem';

interface ScheduleBlockCardProps {
  reason: string;
  startTime: string;
  endTime: string;
}

export const ScheduleBlockCard: React.FC<ScheduleBlockCardProps> = ({
  reason,
  startTime,
  endTime,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.hatchPattern} />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name="lock" size={Icons.size} color={Colors.textSecondary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.reason}>{reason}</Text>
          <Text style={styles.timeRange}>{startTime} - {endTime}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.blockBackground,
    borderRadius: Spacing.cardRadius,
    marginVertical: Spacing.base / 2,
    marginHorizontal: Spacing.screenPadding,
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
    padding: Spacing.base * 2,
  },
  iconContainer: {
    marginRight: Spacing.base,
  },
  textContainer: {
    flex: 1,
  },
  reason: {
    ...Typography.BodySemibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.base / 2,
  },
  timeRange: {
    ...Typography.Caption,
    color: Colors.textSecondary,
  },
}); 