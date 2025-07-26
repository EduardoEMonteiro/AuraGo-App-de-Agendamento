import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Icons, Spacing, Typography } from '../constants/DesignSystem';

interface ScheduleBlockModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (startTime: Date, endTime: Date, reason: string) => void;
}

export const ScheduleBlockModal: React.FC<ScheduleBlockModalProps> = ({
  isVisible,
  onClose,
  onSave,
}) => {
  const [reason, setReason] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const isFormValid = endTime > startTime;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartTime(selectedDate);
      // Se o horário de fim for menor que o início, ajustar automaticamente
      if (endTime <= selectedDate) {
        const newEndTime = new Date(selectedDate);
        newEndTime.setHours(selectedDate.getHours() + 1);
        setEndTime(newEndTime);
      }
    }
  };

  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndTime(selectedDate);
    }
  };

  const handleSave = () => {
    if (isFormValid) {
      onSave(startTime, endTime, reason);
      onClose();
      setReason('');
      setStartTime(new Date());
      setEndTime(new Date());
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="x" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bloquear Horário</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Motivo */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Motivo (opcional)</Text>
            <TextInput
              style={styles.textInput}
              value={reason}
              onChangeText={setReason}
              placeholder="Ex: Almoço, Reunião, Folga..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Horário de Início */}
          <View style={styles.timeSection}>
            <Text style={styles.inputLabel}>INÍCIO</Text>
            <TouchableOpacity 
              style={styles.timeButton} 
              onPress={() => setShowStartPicker(true)}
            >
              <Icon name="clock" size={Icons.size} color={Colors.primary} />
              <View style={styles.timeInfo}>
                <Text style={styles.timeText}>{formatTime(startTime)}</Text>
                <Text style={styles.dateText}>{formatDate(startTime)}</Text>
              </View>
              <Icon name="chevron-right" size={Icons.size} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Horário de Fim */}
          <View style={styles.timeSection}>
            <Text style={styles.inputLabel}>FIM</Text>
            <TouchableOpacity 
              style={styles.timeButton} 
              onPress={() => setShowEndPicker(true)}
            >
              <Icon name="clock" size={Icons.size} color={Colors.primary} />
              <View style={styles.timeInfo}>
                <Text style={styles.timeText}>{formatTime(endTime)}</Text>
                <Text style={styles.dateText}>{formatDate(endTime)}</Text>
              </View>
              <Icon name="chevron-right" size={Icons.size} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Validação */}
          {!isFormValid && (
            <View style={styles.validationMessage}>
              <Icon name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.validationText}>
                O horário de fim deve ser posterior ao horário de início
              </Text>
            </View>
          )}
        </View>

        {/* Botão de Salvar */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveButton, { opacity: isFormValid ? 1 : 0.5 }]} 
            onPress={handleSave}
            disabled={!isFormValid}
          >
            <Icon name="save" size={Icons.size} color={Colors.background} />
            <Text style={styles.saveButtonText}>Salvar Bloqueio</Text>
          </TouchableOpacity>
        </View>

        {/* Date/Time Pickers */}
        {showStartPicker && (
          <DateTimePicker
            value={startTime}
            mode="datetime"
            display="default"
            onChange={handleStartTimeChange}
            minimumDate={new Date()}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={endTime}
            mode="datetime"
            display="default"
            onChange={handleEndTimeChange}
            minimumDate={startTime}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: Spacing.base,
  },
  headerTitle: {
    ...Typography.H2,
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Spacing.screenPadding,
  },
  inputSection: {
    marginBottom: Spacing.base * 3,
  },
  inputLabel: {
    ...Typography.Body,
    color: Colors.textSecondary,
    marginBottom: Spacing.base,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.buttonRadius,
    padding: Spacing.base * 2,
    ...Typography.Body,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  timeSection: {
    marginBottom: Spacing.base * 3,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base * 2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.buttonRadius,
    backgroundColor: Colors.cardBackground,
  },
  timeInfo: {
    flex: 1,
    marginLeft: Spacing.base,
  },
  timeText: {
    ...Typography.BodySemibold,
    color: Colors.textPrimary,
  },
  dateText: {
    ...Typography.Caption,
    color: Colors.textSecondary,
  },
  validationMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base * 2,
    backgroundColor: Colors.error + '10',
    borderRadius: Spacing.buttonRadius,
    marginBottom: Spacing.base * 2,
  },
  validationText: {
    ...Typography.Caption,
    color: Colors.error,
    marginLeft: Spacing.base,
    flex: 1,
  },
  footer: {
    padding: Spacing.screenPadding,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: Spacing.base * 2,
    borderRadius: Spacing.buttonRadius,
  },
  saveButtonText: {
    ...Typography.Button,
    color: Colors.background,
    marginLeft: Spacing.base,
  },
}); 