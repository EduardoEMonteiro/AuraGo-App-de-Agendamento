import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

interface PrivacidadeCardProps {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  backgroundColor?: string;
  iconColor?: string;
  badge?: string;
  badgeText?: string;
}

export const PrivacidadeCard = React.memo(({
  icon,
  title,
  description,
  onPress,
  backgroundColor = '#f9f9f9',
  iconColor = '#1976d2',
  badge,
  badgeText
}: PrivacidadeCardProps) => {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor }]}
      onPress={onPress}
      accessibilityLabel={title}
      accessibilityHint={description}
    >
      <View style={[styles.iconWrapper, { backgroundColor: backgroundColor === '#fff3cd' ? '#fff3cd' : '#e3eaff' }]}>
        <Feather name={icon as any} size={hp('3%')} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{description}</Text>
      </View>
      {badge && (
        <View style={[styles.badge, { backgroundColor: badge === 'warning' ? '#ff9800' : '#4caf50' }]}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      )}
      <Feather name="chevron-right" size={hp('2.75%')} color="#888" />
    </TouchableOpacity>
  );
});

PrivacidadeCard.displayName = 'PrivacidadeCard';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: wp('2.5%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    elevation: 1,
  },
  iconWrapper: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: '#e3eaff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('4%'),
  },
  cardTitle: {
    fontSize: hp('2%'),
    fontWeight: 'bold',
    color: '#222',
  },
  cardDesc: {
    fontSize: hp('1.625%'),
    color: '#666',
    marginTop: hp('0.25%'),
  },
  badge: {
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('2%'),
    marginRight: wp('2%'),
  },
  badgeText: {
    color: '#fff',
    fontSize: hp('1.5%'),
    fontWeight: 'bold',
  },
}); 