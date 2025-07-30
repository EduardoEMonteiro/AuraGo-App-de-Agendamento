import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

type ScreenTitleProps = {
  title: string;
  subtitle?: string;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  onCalendarPress?: () => void;
};

export const ScreenTitle = ({ 
  title, 
  subtitle, 
  onLeftPress, 
  onRightPress, 
  onCalendarPress 
}: ScreenTitleProps) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.titleRow}>
        {onLeftPress && (
          <TouchableOpacity onPress={onLeftPress} style={styles.navButton}>
            <Ionicons name="chevron-back" size={hp('3%')} color="#1976d2" />
          </TouchableOpacity>
        )}
        
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        
        {onRightPress && (
          <TouchableOpacity onPress={onRightPress} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={hp('3%')} color="#1976d2" />
          </TouchableOpacity>
        )}
        
        {onCalendarPress && (
          <TouchableOpacity onPress={onCalendarPress} style={styles.calendarButton}>
            <Ionicons name="calendar" size={hp('3%')} color="#1976d2" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: hp('3%'),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: hp('3.5%'),
    fontWeight: 'bold',
    color: '#000000',
  },
  subtitle: {
    fontSize: hp('2%'),
    marginTop: hp('0.5%'),
    color: '#666666',
  },
  navButton: {
    padding: hp('1%'),
  },
  calendarButton: {
    padding: hp('1%'),
  },
}); 