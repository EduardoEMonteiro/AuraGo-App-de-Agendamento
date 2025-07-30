import React from 'react';
import { SafeAreaView, StyleSheet, View, ViewProps } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

interface ScreenContainerProps extends ViewProps {
  children: React.ReactNode;
}

export const ScreenContainer = ({ children, style, ...props }: ScreenContainerProps) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, style]} {...props}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2%'),
  },
}); 