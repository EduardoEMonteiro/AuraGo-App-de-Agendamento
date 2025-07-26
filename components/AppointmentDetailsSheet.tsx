import { Feather } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Icons, Spacing, Typography } from '../constants/DesignSystem';

interface AppointmentDetailsSheetProps {
  isVisible: boolean;
  onClose: () => void;
  appointment: {
    clientName: string;
    serviceName: string;
    value: string;
    time: string;
    telefone?: string;
    profissionalNome?: string;
    [key: string]: any;
  };
  onCheckout: () => void;
  onMarkNoShow: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onSendConfirmation?: () => void;
}

export const AppointmentDetailsSheet: React.FC<AppointmentDetailsSheetProps> = ({
  isVisible,
  onClose,
  appointment,
  onCheckout,
  onMarkNoShow,
  onEdit,
  onCancel,
  onSendConfirmation,
}) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['40%', '60%'], []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  React.useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isVisible]);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      enablePanDownToClose={true}
    >
      <BottomSheetView style={styles.container}>
        {/* Seção de Informações */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Informações</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cliente:</Text>
            <Text style={styles.infoValue}>{appointment.clientName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Serviço:</Text>
            <Text style={styles.infoValue}>{appointment.serviceName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Valor:</Text>
            <Text style={styles.infoValue}>{appointment.value}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Horário:</Text>
            <Text style={styles.infoValue}>{appointment.time}</Text>
          </View>
        </View>

        {/* Ações */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={[styles.actionButton, styles.checkoutButton]} onPress={onCheckout}>
            <Feather name="check" size={Icons.size} color={Colors.background} />
            <Text style={[styles.actionButtonText, styles.checkoutButtonText]}>Fazer Checkout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={onMarkNoShow}>
            <Feather name="x-circle" size={Icons.size} color={Colors.warning} />
            <Text style={[styles.actionButtonText, { color: Colors.warning }]}>Marcar como No-Show</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={onEdit}>
            <Feather name="edit-3" size={Icons.size} color={Colors.primary} />
            <Text style={[styles.actionButtonText, { color: Colors.primary }]}>Editar Agendamento</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={onCancel}>
            <Feather name="trash-2" size={Icons.size} color={Colors.error} />
            <Text style={[styles.actionButtonText, { color: Colors.error }]}>Cancelar Agendamento</Text>
          </TouchableOpacity>
          {onSendConfirmation && (
            <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={onSendConfirmation}>
              <Feather name="send" size={Icons.size} color={Colors.primary} />
              <Text style={[styles.actionButtonText, { color: Colors.primary }]}>Envio de Confirmação</Text>
            </TouchableOpacity>
          )}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.screenPadding,
  },
  infoSection: {
    marginBottom: Spacing.base * 2,
  },
  sectionTitle: {
    ...Typography.H2,
    color: Colors.textPrimary,
    marginBottom: Spacing.base * 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    ...Typography.Body,
    color: Colors.textSecondary,
  },
  infoValue: {
    ...Typography.BodySemibold,
    color: Colors.textPrimary,
  },
  actionsSection: {
    marginTop: Spacing.base * 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base * 2,
    borderRadius: Spacing.buttonRadius,
    marginBottom: Spacing.base,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
  },
  checkoutButton: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkoutButtonText: {
    color: Colors.background,
  },
  secondaryButton: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
  },
  actionButtonText: {
    ...Typography.Button,
    marginLeft: Spacing.base,
  },
}); 