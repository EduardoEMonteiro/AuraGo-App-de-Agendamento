import { Feather } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet';
import React, { forwardRef, useMemo } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSalaoInfo } from '../../../hooks/useSalaoInfo';
import { Colors } from '../../constants/DesignSystem';

interface AppointmentDetailsSheetProps {
  appointment: any;
  onDismiss: () => void;
  onCheckout: (checkoutData: any) => void;
  onCheckoutRequest: (appointment: any) => void;
  onNoShow: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onSendConfirmation?: () => void;
}

export const AppointmentDetailsSheet = forwardRef<BottomSheetModal, AppointmentDetailsSheetProps>((props, ref) => {
  const { appointment, onDismiss, onCheckout, onCheckoutRequest, onNoShow, onEdit, onCancel, onSendConfirmation } = props;
  const { salaoInfo } = useSalaoInfo();
  // Definição dos métodos de pagamento disponíveis
  const allPaymentMethods = [
    { id: 'dinheiro', label: 'Dinheiro', icon: 'dollar-sign' },
    { id: 'pix', label: 'PIX', icon: 'smartphone' },
    { id: 'cartao', label: 'Cartão', icon: 'credit-card' },
    { id: 'transferencia', label: 'Transferência', icon: 'bank' },
  ];
  // Filtrar apenas os métodos ativos do salão
  let formasAtivas = allPaymentMethods.filter(m => (salaoInfo?.formasPagamento || []).includes(m.id));
  if (formasAtivas.length === 0) {
    formasAtivas = [allPaymentMethods[0]]; // Fallback: Dinheiro
  }

  const snapPoints = useMemo(() => ['65%'], []);

  if (!appointment) return null;

  // Processar data do agendamento
  let appointmentDate;
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

  const startTime = appointmentDate.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const duration = Number(appointment.servicoDuracao) || 60;
  const endTime = new Date(appointmentDate.getTime() + duration * 60000)
    .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const handleCancel = () => {
    Alert.alert(
      'Cancelar Agendamento',
      `Deseja realmente cancelar o agendamento de ${appointment.clienteNome}?`,
      [
        { text: 'Não', style: 'cancel' },
        { 
          text: 'Sim', 
          style: 'destructive',
          onPress: () => {
            onCancel();
            if (ref && typeof ref === 'object' && ref.current) {
              ref.current.close();
            }
          }
        }
      ]
    );
  };

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={(props) => (
        <BottomSheetBackdrop 
          {...props} 
          appearsOnIndex={0} 
          disappearsOnIndex={-1}
          opacity={0.4}
        />
      )}
      onDismiss={onDismiss}
      enablePanDownToClose={true}
      backgroundStyle={styles.modalBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.statusIndicator}>
              <View style={[
                styles.statusDot, 
                { 
                  backgroundColor: appointment.status === 'no-show' ? '#EF4444' : 
                                  appointment.status === 'cancelado' ? '#6B7280' : '#10B981' 
                }
              ]} />
              <Text style={[
                styles.statusText,
                { 
                  color: appointment.status === 'no-show' ? '#EF4444' : 
                         appointment.status === 'cancelado' ? '#6B7280' : '#10B981' 
                }
              ]}>
                {appointment.status === 'no-show' ? 'No-Show' : 
                 appointment.status === 'cancelado' ? 'Cancelado' : 'Agendado'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => {
              if (ref && typeof ref === 'object' && ref.current) {
                ref.current.close();
              }
            }} style={styles.closeButton}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Cliente */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoHeader}>
                <View style={styles.iconContainer}>
                  <Feather name="user" size={16} color={Colors.primary} />
                </View>
                <Text style={styles.infoLabel}>Cliente:</Text>
              </View>
              <Text style={styles.infoValue}>{appointment.clienteNome}</Text>
            </View>
          </View>

          {/* Serviço */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoHeader}>
                <View style={styles.iconContainer}>
                  <Feather name="scissors" size={16} color={Colors.primary} />
                </View>
                <Text style={styles.infoLabel}>Serviço:</Text>
              </View>
              <Text style={styles.infoValue}>{appointment.servicoNome}</Text>
            </View>
          </View>

          {/* Horário */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoHeader}>
                <View style={styles.iconContainer}>
                  <Feather name="clock" size={16} color={Colors.primary} />
                </View>
                <Text style={styles.infoLabel}>Horário:</Text>
              </View>
              <View style={styles.timeContainer}>
                <Text style={styles.timeValue}>{startTime} - {endTime}</Text>
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{duration}min</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Observações */}
          {appointment.observacoes && (
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoHeader}>
                  <View style={styles.iconContainer}>
                    <Feather name="file-text" size={16} color={Colors.primary} />
                  </View>
                  <Text style={styles.infoLabel}>Observações:</Text>
                </View>
                <Text style={styles.notesText}>{appointment.observacoes}</Text>
              </View>
            </View>
          )}

          {/* Resumo Financeiro do Atendimento */}
          {(appointment.status === 'paid' || appointment.status === 'completed') && (
            <View style={[styles.infoCard, { backgroundColor: '#F6FFED', borderRadius: 12, padding: 12, marginBottom: 24 }]}> 
              <Text style={{ fontWeight: 'bold', color: '#388e3c', marginBottom: 6 }}>Resumo do Atendimento</Text>
              <Text style={{ color: '#222', fontSize: 16 }}>Valor cobrado: <Text style={{ fontWeight: 'bold' }}>R$ {Number(appointment.finalPrice ?? appointment.servicoValor).toFixed(2)}</Text></Text>
              <Text style={{ color: '#555', marginTop: 8 }}>Serviço: <Text style={{ fontWeight: 'bold' }}>{appointment.servicoNome}</Text></Text>
              {Array.isArray(appointment.produtosVendidos) && appointment.produtosVendidos.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ color: '#555', fontWeight: 'bold' }}>Produtos vendidos:</Text>
                  {appointment.produtosVendidos.map((p: any, idx: number) => (
                    <Text key={idx} style={{ color: '#222', marginLeft: 8 }}>
                      - {p.nome} <Text style={{ color: '#222' }}>R$ {Number(p.valorEditado ?? p.precoVenda).toFixed(2)}</Text>
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Envio de Confirmação - Só se for agendado */}
          {appointment.status === 'agendado' && typeof onSendConfirmation === 'function' && (
            <TouchableOpacity onPress={onSendConfirmation} style={styles.primaryButton}>
              <Feather name="send" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Envio de Confirmação</Text>
            </TouchableOpacity>
          )}
          {/* Primary Action - Só mostrar se não for no-show ou cancelado */}
          {appointment.status === 'agendado' && (
            <TouchableOpacity onPress={() => onCheckoutRequest(appointment)} style={styles.primaryButton}>
              <Feather name="check-circle" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Check-Out</Text>
            </TouchableOpacity>
          )}

          {/* Secondary Actions */}
          <View style={styles.secondaryActions}>
            {/* Editar - Só se for agendado */}
            {appointment.status === 'agendado' && typeof onEdit === 'function' && (
              <TouchableOpacity onPress={onEdit} style={styles.secondaryButton}>
                <Feather name="edit-2" size={18} color={Colors.primary} />
                <Text style={styles.secondaryButtonText}>Editar</Text>
              </TouchableOpacity>
            )}

            {/* No-Show - Só se for agendado */}
            {appointment.status === 'agendado' && (
              <TouchableOpacity onPress={onNoShow} style={styles.secondaryButton}>
                <Feather name="user-x" size={18} color="#F59E0B" />
                <Text style={[styles.secondaryButtonText, { color: '#F59E0B' }]}>No-Show</Text>
              </TouchableOpacity>
            )}

            {/* Cancelar - Só se for agendado */}
            {appointment.status === 'agendado' && (
              <TouchableOpacity onPress={handleCancel} style={styles.secondaryButton}>
                <Feather name="trash-2" size={18} color="#EF4444" />
                <Text style={[styles.secondaryButtonText, { color: '#EF4444' }]}>Cancelar</Text>
              </TouchableOpacity>
            )}

            {/* Se for no-show, mostrar botão para reativar */}
            {appointment.status === 'no-show' && (
              <TouchableOpacity onPress={onEdit} style={styles.secondaryButton}>
                <Feather name="refresh-cw" size={18} color={Colors.primary} />
                <Text style={styles.secondaryButtonText}>Reagendar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  modalBackground: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: '#E5E7EB',
    width: 40,
    height: 4,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  infoCard: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    marginLeft: 16,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginRight: 12,
  },
  durationBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  notesText: {
    fontSize: 16,
    color: '#6B7280',
    flex: 1,
    marginLeft: 16,
    fontStyle: 'italic',
    lineHeight: 22,
    textAlign: 'right',
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 6,
  },
}); 