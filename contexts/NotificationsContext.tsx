import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type NotificationType = 'agendamento' | 'atraso' | 'no-show' | 'estoque' | 'push';

export type Notification = {
  id: string;
  tipo: NotificationType;
  titulo: string;
  mensagem: string;
  data: number;
  lida: boolean;
};

const NOTIFICATIONS_KEY = 'notificacoes_inapp';

const NotificationsContext = createContext<{
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id' | 'data' | 'lida'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  getNotifications: () => Notification[];
} | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    (async () => {
      const data = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      if (data) setNotifications(JSON.parse(data));
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }, [notifications]);

  function addNotification(n: Omit<Notification, 'id' | 'data' | 'lida'>) {
    const nova: Notification = {
      ...n,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      data: Date.now(),
      lida: false,
    };
    setNotifications(prev => [nova, ...prev]);
  }

  function removeNotification(id: string) {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  function markAsRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  }

  function getNotifications() {
    return notifications;
  }

  return (
    <NotificationsContext.Provider value={{ notifications, addNotification, removeNotification, markAsRead, getNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications deve ser usado dentro de NotificationsProvider');
  return ctx;
} 