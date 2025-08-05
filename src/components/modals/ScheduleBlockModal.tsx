import { Feather } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/DesignSystem';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onSave?: (blockData: any) => void;
}

export const ScheduleBlockModal: React.FC<Props> = ({ isVisible, onClose, onSave }) => {
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  // Controle dos pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const isFormValid = reason && startTime && endTime && startTime < endTime;

  // Fluxo: primeiro data, depois hora inicial, depois hora final
  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate);
      // Atualiza também startTime e endTime para o mesmo dia
      const newStart = new Date(startTime);
      newStart.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setStartTime(newStart);
      const newEnd = new Date(endTime);
      newEnd.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setEndTime(newEnd);
      setShowDatePicker(false);
    } else {
      setShowDatePicker(false);
    }
  };

  const onStartTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (event.type === 'set' && selectedTime) {
      const newStart = new Date(startTime);
      newStart.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setStartTime(newStart);
    }
    setShowStartTimePicker(false);
  };

  const onEndTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (event.type === 'set' && selectedTime) {
      const newEnd = new Date(endTime);
      newEnd.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setEndTime(newEnd);
    }
    setShowEndTimePicker(false);
  };

  // Limpar campos ao fechar
  const handleClose = () => {
    setReason('');
    setDate(new Date());
    setStartTime(new Date());
    setEndTime(new Date());
    onClose();
  };

  const handleSave = async () => {
    if (!isFormValid) return;
    const blockData = {
      reason,
      date: date.toISOString().split('T')[0],
      startTime: startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      endTime: endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    if (onSave) await onSave(blockData);
    handleClose();
  };

  return (
    <Modal visible={isVisible} onRequestClose={handleClose} animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}><Feather name="x" size={24} color={Colors.textPrimary} /></TouchableOpacity>
          <Text style={styles.title}>Bloquear Horário</Text>
          <TouchableOpacity onPress={handleSave} disabled={!isFormValid} style={styles.saveButton}>
            <Text style={[styles.saveButtonText, { opacity: isFormValid ? 1 : 0.5 }]}>Salvar</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Motivo do bloqueio"
            placeholderTextColor={Colors.textSecondary}
            value={reason}
            onChangeText={setReason}
          />
          <TouchableOpacity style={styles.selector} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.selectorTextSelected}>
              {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
            <Feather name="calendar" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
            />
          )}
          <TouchableOpacity style={styles.selector} onPress={() => setShowStartTimePicker(true)}>
            <Text style={styles.selectorTextSelected}>
              {startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (Início)
            </Text>
            <Feather name="clock" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          {showStartTimePicker && (
            <DateTimePicker
              testID="startTimePicker"
              value={startTime}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onStartTimeChange}
            />
          )}
          <TouchableOpacity style={styles.selector} onPress={() => setShowEndTimePicker(true)}>
            <Text style={styles.selectorTextSelected}>
              {endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (Fim)
            </Text>
            <Feather name="clock" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          {showEndTimePicker && (
            <DateTimePicker
              testID="endTimePicker"
              value={endTime}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onEndTimeChange}
            />
          )}
        </ScrollView>
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
  input: { ...Typography.Body, backgroundColor: Colors.cardBackground, padding: Spacing.base * 2, borderRadius: Spacing.buttonRadius, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.base * 2 },
  selector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.cardBackground, padding: Spacing.base * 2, borderRadius: Spacing.buttonRadius, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.base * 2 },
  selectorTextSelected: { ...Typography.Body, color: Colors.textPrimary },
}); 