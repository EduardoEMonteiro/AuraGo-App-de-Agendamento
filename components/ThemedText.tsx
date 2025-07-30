import { memo } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export const ThemedText = memo<ThemedTextProps>(({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}) => {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
});

ThemedText.displayName = 'ThemedText';

const styles = StyleSheet.create({
  default: {
    fontSize: hp('2%'), // ~16px em tela padrão
    lineHeight: hp('3%'), // ~24px em tela padrão
  },
  defaultSemiBold: {
    fontSize: hp('2%'), // ~16px em tela padrão
    lineHeight: hp('3%'), // ~24px em tela padrão
    fontWeight: '600',
  },
  title: {
    fontSize: hp('4%'), // ~32px em tela padrão
    fontWeight: 'bold',
    lineHeight: hp('4%'), // ~32px em tela padrão
  },
  subtitle: {
    fontSize: hp('2.5%'), // ~20px em tela padrão
    fontWeight: 'bold',
  },
  link: {
    lineHeight: hp('3.75%'), // ~30px em tela padrão
    fontSize: hp('2%'), // ~16px em tela padrão
    color: '#0a7ea4',
  },
});
