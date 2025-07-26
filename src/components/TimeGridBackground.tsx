import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/DesignSystem';

interface Props {
  startHour?: number;
  endHour?: number;
  hourHeight?: number;
  leftPadding?: number;
  topOffset?: number; // NOVO
}

const TimeGridBackground: React.FC<Props> = ({ startHour = 8, endHour = 20, hourHeight = 80, leftPadding = 68, topOffset = 0 }) => {
  const lines = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const isHourMark = minute === 0;
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const top = (((hour - startHour) * 60 + minute) / 60 * hourHeight) + topOffset; // ajuste
      lines.push(
        <View key={time} style={[styles.lineContainer, { top }] }>
          {isHourMark && <Text style={[styles.timeText, { left: 16 }]}>{time}</Text>}
          <View style={[styles.line, isHourMark ? styles.hourLine : styles.quarterLine, { marginLeft: leftPadding }]} />
        </View>
      );
    }
  }
  return <View style={StyleSheet.absoluteFill}>{lines}</View>;
};

const styles = StyleSheet.create({
  lineContainer: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center' },
  timeText: { position: 'absolute', fontSize: 12, color: '#A0A0A0' },
  line: { flex: 1, height: 1 },
  hourLine: { backgroundColor: Colors.borderStrong },
  quarterLine: { backgroundColor: Colors.border },
});

export default TimeGridBackground; 