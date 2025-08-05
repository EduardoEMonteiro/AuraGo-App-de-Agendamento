import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useAgendamentos } from '../hooks/useAgendamentos';
import { useBloqueios } from '../hooks/useBloqueios';
import { AppointmentCard } from './AppointmentCard';
import { performanceAnalytics } from '../services/performanceAnalytics';

interface OptimizedAgendaProps {
  selectedDate: Date;
  onAppointmentPress?: (appointment: any) => void;
}

export const OptimizedAgenda = React.memo<OptimizedAgendaProps>(({ 
  selectedDate, 
  onAppointmentPress 
}) => {
  const { agendamentos, loading, error, refreshAgendamentos } = useAgendamentos(selectedDate);
  const { bloqueios, loading: bloqueiosLoading } = useBloqueios(selectedDate);

  // Memoizar dados processados
  const processedData = useMemo(() => {
    const timerId = performanceAnalytics.startTimer('agenda_data_processing');
    
    // Combinar agendamentos e bloqueios
    const combinedData = [
      ...agendamentos.map(ag => ({ ...ag, type: 'appointment' })),
      ...bloqueios.map(bl => ({ ...bl, type: 'block' }))
    ];

    // Ordenar por hora
    combinedData.sort((a, b) => {
      if (a.type === 'block' && b.type === 'appointment') return -1;
      if (a.type === 'appointment' && b.type === 'block') return 1;
      return a.horaInicio?.localeCompare(b.horaInicio) || 0;
    });

    performanceAnalytics.endTimer(timerId, { 
      appointmentsCount: agendamentos.length,
      blocksCount: bloqueios.length 
    });

    return combinedData;
  }, [agendamentos, bloqueios]);

  // Memoizar keyExtractor
  const keyExtractor = useCallback((item: any) => {
    return `${item.type}_${item.id}`;
  }, []);

  // Memoizar renderItem
  const renderItem = useCallback(({ item }: { item: any }) => {
    if (item.type === 'block') {
      return (
        <View style={styles.blockContainer}>
          <Text style={styles.blockText}>
            🔒 {item.reason} ({item.startTime} - {item.endTime})
          </Text>
        </View>
      );
    }

    return (
      <AppointmentCard
        appointment={item}
        onPress={() => onAppointmentPress?.(item)}
      />
    );
  }, [onAppointmentPress]);

  // Memoizar refresh control
  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={loading}
      onRefresh={refreshAgendamentos}
      colors={['#1976d2']}
      tintColor="#1976d2"
    />
  ), [loading, refreshAgendamentos]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <Text style={styles.retryText} onPress={refreshAgendamentos}>
          Tentar novamente
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={processedData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? 'Carregando...' : 'Nenhum agendamento para este dia'}
            </Text>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>
              {selectedDate.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            <Text style={styles.subHeaderText}>
              {agendamentos.length} agendamento(s) • {bloqueios.length} bloqueio(s)
            </Text>
          </View>
        }
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  headerContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
  },
  subHeaderText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  blockContainer: {
    backgroundColor: '#fff3cd',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  blockText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryText: {
    fontSize: 14,
    color: '#1976d2',
    textDecorationLine: 'underline',
  },
}); 