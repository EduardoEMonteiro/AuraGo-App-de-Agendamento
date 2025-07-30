import { FontAwesome5 } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: '#666666',
      }}
    >
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="calendar-alt" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cadastros"
        options={{
          title: 'Cadastros',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="users" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="financeiro"
        options={{
          title: 'Financeiro',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="dollar-sign" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="configuracoes"
        options={{
          title: 'Configurações',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
