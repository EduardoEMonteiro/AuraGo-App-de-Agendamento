import { Feather } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/DesignSystem';
import { SelectionModal } from './SelectionModal';

interface Client { id: string; name: string; }
interface Service { id: string; name: string; duration: number; valor: number; }

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onSave: (appointmentData: any) => void;
  clients: Client[];
  services: Service[];
  appointment: any;
  onAddNewClient?: (newClient: any) => void;
  onAddNewService?: (newService: any) => void;
}

export const EditAppointmentModal: React.FC<Props> = ({ 
  isVisible, 
  onClose, 
  onSave, 
  clients, 
  services, 
  appointment,
  onAddNewClient,
  onAddNewService
}) => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isClientModalVisible, setClientModalVisible] = useState(false);
  const [isServiceModalVisible, setServiceModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Inicializar dados quando o modal abrir
  useEffect(() => {
    if (isVisible && appointment) {
      try {
        setIsLoading(true);
        
        // Encontrar cliente atual
        const currentClient = clients.find(c => c.id === appointment.clienteId);
        setSelectedClient(currentClient || null);

        // Encontrar serviço atual
        const currentService = services.find(s => s.id === appointment.servicoId);
        setSelectedService(currentService || null);

        // Processar data do agendamento de forma mais robusta
        let appointmentDate = new Date();
        
        if (appointment.data) {
          try {
            if (appointment.data.includes('Z')) {
              // Data em UTC, converter para local
              appointmentDate = new Date(appointment.data);
            } else {
              // Data já em horário local - criar data local
              const [datePart, timePart] = appointment.data.split('T');
              const [year, month, day] = datePart.split('-').map(Number);
              const [hour, minute, second] = (timePart || '00:00:00').split(':').map(Number);
              appointmentDate = new Date(year, month - 1, day, hour, minute, second);
            }
          } catch (error) {
            console.error('Erro ao processar data do agendamento:', error);
            // Usar data atual como fallback
            appointmentDate = new Date();
          }
        }
        
        setDate(appointmentDate);

        // Definir observações
        setNotes(appointment.observacoes || '');
        
      } catch (error) {
        console.error('Erro ao inicializar dados do agendamento:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isVisible, appointment, clients, services]);

  const isFormValid = selectedClient && selectedService && !isLoading;

  const handleSave = () => {
    if (!isFormValid) return;
    
    try {
      // Converter para horário local (sem timezone)
      const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      const dateString = localDate.toISOString().slice(0, 19); // Remove o Z
      
      const appointmentData = {
        id: appointment.id,
        clientId: selectedClient.id,
        serviceId: selectedService.id,
        date: dateString,
        notes,
        servicoValor: selectedService.valor,
      };
      
      onSave(appointmentData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      // Aqui você pode mostrar um alerta para o usuário
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      const newDate = new Date(date);
      newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setDate(newDate);
      setShowDatePicker(false);
      setTimeout(() => setShowTimePicker(true), 200);
    } else {
      setShowDatePicker(false);
    }
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (event.type === 'set' && selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setDate(newDate);
    }
    setShowTimePicker(false);
  };

  const handleAddNewClient = (newClient: any) => {
    onAddNewClient?.(newClient);
    setSelectedClient(newClient);
  };

  const handleAddNewService = (newService: any) => {
    onAddNewService?.(newService);
    setSelectedService(newService);
  };

  return (
    <Modal visible={isVisible} onRequestClose={onClose} animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Editar Agendamento</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            disabled={!isFormValid} 
            style={styles.saveButton}
          >
            <Text style={[styles.saveButtonText, { opacity: isFormValid ? 1 : 0.5 }]}>
              Salvar
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Carregando dados...</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity style={styles.selector} onPress={() => setClientModalVisible(true)}>
                <Text style={[styles.selectorText, selectedClient && styles.selectorTextSelected]}>
                  {selectedClient ? selectedClient.name : 'Selecionar Cliente'}
                </Text>
                <Feather name="chevron-down" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.selector} onPress={() => setServiceModalVisible(true)}>
                <Text style={[styles.selectorText, selectedService && styles.selectorTextSelected]}>
                  {selectedService ? selectedService.name : 'Selecionar Serviço'}
                </Text>
                <Feather name="chevron-down" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.selector} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.selectorTextSelected}>
                  {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Feather name="calendar" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={date}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}
              {showTimePicker && (
                <DateTimePicker
                  testID="timeTimePicker"
                  value={date}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={onTimeChange}
                />
              )}

              <TextInput
                style={styles.notesInput}
                placeholder="Adicionar uma observação..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                value={notes}
                onChangeText={setNotes}
              />
            </>
          )}
        </ScrollView>

        {/* Modais de Seleção com funcionalidade de adicionar */}
        <SelectionModal
          isVisible={isClientModalVisible}
          onClose={() => setClientModalVisible(false)}
          onSelect={(item) => setSelectedClient(item as Client)}
          items={clients}
          title="Clientes"
          onAddNew={handleAddNewClient}
          type="cliente"
        />
        <SelectionModal
          isVisible={isServiceModalVisible}
          onClose={() => setServiceModalVisible(false)}
          onSelect={(item) => setSelectedService(item as Service)}
          items={services}
          title="Serviços"
          onAddNew={handleAddNewService}
          type="servico"
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.screenPadding, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { ...Typography.H2, color: Colors.textPrimary },
  closeButton: { padding: Spacing.base },
  saveButton: { padding: Spacing.base },
  saveButtonText: { ...Typography.BodySemibold, color: Colors.primary, fontSize: 18 },
  form: { padding: Spacing.screenPadding },
  selector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.cardBackground, padding: Spacing.base * 2, borderRadius: Spacing.buttonRadius, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.base * 2 },
  selectorText: { ...Typography.Body, color: Colors.textSecondary },
  selectorTextSelected: { ...Typography.Body, color: Colors.textPrimary },
  notesInput: { ...Typography.Body, backgroundColor: Colors.cardBackground, padding: Spacing.base * 2, borderRadius: Spacing.buttonRadius, borderWidth: 1, borderColor: Colors.border, minHeight: 120, textAlignVertical: 'top' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...Typography.Body, color: Colors.textSecondary },
}); 