import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomHeader } from '../../components/CustomHeader';

export default function CadastrosScreen() {
  const router = useRouter();

  const handleNavigation = (route: string) => {
    router.push(route as any);
  };

  const menuOptions = [
    { title: 'Clientes', icon: 'users', route: '/clientes' },
    { title: 'Serviços', icon: 'cut', route: '/servicos' },
    { title: 'Produtos', icon: 'box-open', route: '/produtos' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Cadastros" showBackButton={false} />
      
      <View style={styles.content}>
        <Text style={styles.subtitle}>Selecione uma opção para gerenciar</Text>
        
        <View style={styles.menuContainer}>
          {menuOptions.map((option) => (
            <TouchableOpacity
              key={option.route}
              style={styles.optionButton}
              onPress={() => handleNavigation(option.route)}
            >
              <FontAwesome5 name={option.icon} size={hp('3%')} color="#1976d2" />
              <Text style={styles.optionText}>{option.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2%'),
  },
  subtitle: {
    fontSize: hp('2%'),
    marginBottom: hp('5%'),
    color: '#666666',
  },
  menuContainer: {
    width: '100%',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp('5%'),
    borderRadius: 15,
    marginBottom: hp('2%'),
    backgroundColor: '#e3f2fd',
  },
  optionText: {
    fontSize: hp('2.2%'),
    fontWeight: 'bold',
    marginLeft: wp('4%'),
    color: '#1976d2',
  },
}); 