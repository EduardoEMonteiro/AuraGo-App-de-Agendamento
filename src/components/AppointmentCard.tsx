import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Shadows, Spacing, Typography } from '../constants/DesignSystem';

interface Props {
  clientName: string;
  serviceName: string;
  time: string;
  value: string;
  serviceColor: string;
  onPress: () => void;
}

const AppointmentCard: React.FC<Props> = ({ clientName, serviceName, time, value, serviceColor, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.colorIndicator, { backgroundColor: serviceColor }]} />
      <View style={styles.content}>
        <Text style={styles.clientName}>{clientName}</Text>
        <Text style={styles.serviceName}>{serviceName}</Text>
        <View style={styles.row}>
          <Text style={styles.time}>{time}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: Spacing.buttonRadius,
    marginVertical: Spacing.base / 2,
    ...Shadows.card,
    overflow: 'hidden',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 4,
    height: '100%',
    borderTopLeftRadius: Spacing.buttonRadius,
    borderBottomLeftRadius: Spacing.buttonRadius,
  },
  content: {
    flex: 1,
    padding: Spacing.base * 1.5,
  },
  clientName: {
    ...Typography.BodySemibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  serviceName: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

export default AppointmentCard; 