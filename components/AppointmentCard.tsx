import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Shadows, Spacing, Typography } from '../constants/DesignSystem';

interface AppointmentCardProps {
  clientName: string;
  serviceName: string;
  time: string;
  value: string;
  serviceColor: string;
  onPress: () => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  clientName,
  serviceName,
  time,
  value,
  serviceColor,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
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
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Spacing.cardRadius,
    marginVertical: Spacing.base / 2,
    marginHorizontal: Spacing.screenPadding,
    ...Shadows.card,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  colorIndicator: {
    width: 4,
    height: '100%',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    padding: Spacing.base * 2,
  },
  leftContent: {
    flex: 1,
  },
  rightContent: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  clientName: {
    ...Typography.BodySemibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.base / 2,
  },
  serviceName: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.base / 2,
  },
  time: {
    ...Typography.Caption,
    color: Colors.textSecondary,
  },
  value: {
    ...Typography.BodySemibold,
    color: Colors.textPrimary,
  },
}); 