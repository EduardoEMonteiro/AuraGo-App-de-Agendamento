import { Tabs } from 'expo-router';
import { Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      <Tabs
        screenOptions={({ route }: { route: any }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }: { color: string; size: number }) => {
            if (route.name === 'agenda') {
              return (
                <Image
                  source={require('../../assets/images/ic_agenda.png')}
                  style={{ width: 32, height: 32 }}
                  resizeMode="contain"
                />
              );
            }
            if (route.name === 'cadastros') {
              return (
                <Image
                  source={require('../../assets/images/ic_servicos.png')}
                  style={{ width: 32, height: 32 }}
                  resizeMode="contain"
                />
              );
            }
            if (route.name === 'financeiro') {
              return (
                <Image
                  source={require('../../assets/images/ic_receitas.png')}
                  style={{ width: 32, height: 32 }}
                  resizeMode="contain"
                />
              );
            }
            if (route.name === 'configuracoes') {
              return (
                <Image
                  source={require('../../assets/images/ic_configuracoes.png')}
                  style={{ width: 32, height: 32 }}
                  resizeMode="contain"
                />
              );
            }
            return null;
          },
        })}
      >
        <Tabs.Screen name="agenda" options={{ title: 'Agenda' }} />
        <Tabs.Screen name="cadastros" options={{ title: 'Cadastros' }} />
        <Tabs.Screen name="financeiro" options={{ title: 'Financeiro' }} />
        <Tabs.Screen name="configuracoes" options={{ title: 'Configurações' }} />
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="clientes" options={{ href: null }} />
        <Tabs.Screen name="servicos" options={{ href: null }} />
        <Tabs.Screen name="produtos" options={{ href: null }} />
      </Tabs>
    </SafeAreaView>
  );
}
