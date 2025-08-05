import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useDadosEstaticos } from '../hooks/useDadosEstaticos';
import { MensagemService } from '../services/mensagemService';
import { performanceAnalytics } from '../services/performanceAnalytics';

interface AppointmentCardProps {
  appointment: any;
  onPress?: () => void;
}

export const AppointmentCard = React.memo<AppointmentCardProps>(({ 
  appointment, 
  onPress 
}) => {
  const { clientes, servicos } = useDadosEstaticos();

  // Memoizar dados do cliente e serviço
  const appointmentData = useMemo(() => {
    const timerId = performanceAnalytics.startTimer('appointment_card_data');
    
    const cliente = clientes.find(c => c.id === appointment.clienteId);
    const servico = servicos.find(s => s.id === appointment.servicoId);
    
    performanceAnalytics.endTimer(timerId);
    
    return {
      cliente: cliente || { nome: appointment.clienteNome || 'Cliente não encontrado' },
      servico: servico || { nome: appointment.servicoNome || 'Serviço não encontrado' },
      telefone: cliente?.telefone || ''
    };
  }, [appointment, clientes, servicos]);

  // Memoizar handlers
  const handleWhatsAppPress = useCallback(async () => {
    const timerId = performanceAnalytics.startTimer('whatsapp_send');
    
    try {
      await MensagemService.enviarMensagemConfirmacao(
        appointmentData.cliente.nome,
        appointmentData.servico.nome,
        appointment.data,
        appointment.horaInicio,
        appointmentData.telefone
      );
      
      performanceAnalytics.endTimer(timerId, { success: true });
      Alert.alert('✅ Sucesso', 'Mensagem enviada com sucesso!');
    } catch (error) {
      performanceAnalytics.endTimer(timerId, { error: (error as Error).message });
      Alert.alert('❌ Erro', 'Erro ao enviar mensagem. Tente novamente.');
    }
  }, [appointment, appointmentData]);

  const handleLembretePress = useCallback(async () => {
    const timerId = performanceAnalytics.startTimer('whatsapp_reminder');
    
    try {
      await MensagemService.enviarMensagemLembrete(
        appointmentData.cliente.nome,
        appointmentData.servico.nome,
        appointment.data,
        appointment.horaInicio,
        appointmentData.telefone
      );
      
      performanceAnalytics.endTimer(timerId, { success: true });
      Alert.alert('✅ Sucesso', 'Lembrete enviado com sucesso!');
    } catch (error) {
      performanceAnalytics.endTimer(timerId, { error: (error as Error).message });
      Alert.alert('❌ Erro', 'Erro ao enviar lembrete. Tente novamente.');
    }
  }, [appointment, appointmentData]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'agendado': return '#1976d2';
      case 'paid': return '#388e3c';
      case 'cancelado': return '#d32f2f';
      case 'no-show': return '#f57c00';
      default: return '#666';
    }
  }, []);

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'agendado': return 'Agendado';
      case 'paid': return 'Pago';
      case 'cancelado': return 'Cancelado';
      case 'no-show': return 'Não compareceu';
      default: return status;
    }
  }, []);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{appointment.horaInicio}</Text>
          <Text style={styles.durationText}>{appointment.servicoDuracao}min</Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
          <Text style={styles.statusText}>{getStatusText(appointment.status)}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.clientName}>{appointmentData.cliente.nome}</Text>
        <Text style={styles.serviceName}>{appointmentData.servico.nome}</Text>
        
        {appointment.valor && (
          <Text style={styles.priceText}>
            R$ {appointment.valor.toFixed(2)}
          </Text>
        )}
        
        {appointment.observacoes && (
          <Text style={styles.notesText} numberOfLines={2}>
            📝 {appointment.observacoes}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.whatsappButton]} 
          onPress={handleWhatsAppPress}
        >
          <Text style={styles.actionButtonText}>💬 Confirmar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.reminderButton]} 
          onPress={handleLembretePress}
        >
          <Text style={styles.actionButtonText}>⏰ Lembrete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    alignItems: 'flex-start',
  },
  timeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  durationText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    marginBottom: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#388e3c',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  whatsappButton: {
    backgroundColor: '#25d366',
  },
  reminderButton: {
    backgroundColor: '#ff9800',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
}); 