import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface TimeGridBackgroundProps {
  startHour?: number; // ex: 8
  endHour?: number;   // ex: 20
  heightPer15Min?: number; // altura de cada bloco de 15min
  leftPadding?: number; // espaço para o texto da hora
}

const defaultProps = {
  startHour: 8,
  endHour: 20,
  heightPer15Min: 24,
  leftPadding: 60,
};

const TimeGridBackground: React.FC<TimeGridBackgroundProps> = (props) => {
  const { startHour, endHour, heightPer15Min, leftPadding } = { ...defaultProps, ...props };
  const lines = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let quarter = 0; quarter < 4; quarter++) {
      const isFullHour = quarter === 0;
      const timeLabel = isFullHour ? `${hour.toString().padStart(2, '0')}:00` : '';
      lines.push(
        <View
          key={`${hour}:${quarter}`}
          style={[
            styles.line,
            isFullHour ? styles.fullHourLine : styles.quarterLine,
            { top: ((hour - startHour) * 4 + quarter) * heightPer15Min },
          ]}
        >
          {isFullHour && (
            <Text style={[styles.hourText, { left: 0, width: leftPadding }]}>{timeLabel}</Text>
          )}
        </View>
      );
    }
  }
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 0 }} pointerEvents="none">
      {lines}
    </View>
  );
};

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullHourLine: {
    borderTopWidth: 1,
    borderTopColor: '#D1D1D6',
    backgroundColor: 'transparent',
  },
  quarterLine: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    borderStyle: 'dotted',
    backgroundColor: 'transparent',
  },
  hourText: {
    position: 'absolute',
    color: '#D1D1D6',
    fontSize: 12,
    fontWeight: '600',
    top: -8,
    textAlign: 'left',
  },
});

export default TimeGridBackground; 