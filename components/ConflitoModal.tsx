import React from 'react';
import { Button, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Agendamento } from '../services/offlineAgendamentos';

type Props = {
  visivel: boolean;
  agendamentoLocal: Agendamento;
  agendamentoRemoto: Agendamento;
  onEscolherLocal: () => void;
  onEscolherRemoto: () => void;
  onFechar: () => void;
};

export default function ConflitoModal({ visivel, agendamentoLocal, agendamentoRemoto, onEscolherLocal, onEscolherRemoto, onFechar }: Props) {
  return (
    <Modal visible={visivel} transparent animationType="slide">
      <TouchableOpacity 
        style={styles.modalBg} 
        activeOpacity={1} 
        onPress={onFechar}
      >
        <TouchableOpacity 
          style={styles.modalBox} 
          activeOpacity={1} 
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.titulo}>Conflito de Agendamento</Text>
          <Text style={styles.subtitulo}>Escolha qual versão deseja manter:</Text>
          <ScrollView horizontal style={{ marginVertical: 12 }}>
            <View style={styles.coluna}>
              <Text style={styles.colTitle}>Minha versão</Text>
              {renderCampos(agendamentoLocal)}
            </View>
            <View style={styles.coluna}>
              <Text style={styles.colTitle}>Versão do servidor</Text>
              {renderCampos(agendamentoRemoto)}
            </View>
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Button title="Manter minha versão" onPress={onEscolherLocal} />
            <Button title="Manter versão do servidor" onPress={onEscolherRemoto} />
          </View>
          <Button title="Fechar" color="#888" onPress={onFechar} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function renderCampos(ag: Agendamento) {
  return (
    <View>
      <Text>Cliente: {ag.cliente}</Text>
      <Text>Serviço: {ag.servico}</Text>
      <Text>Profissional: {ag.profissionalId}</Text>
      <Text>Início: {ag.inicio}</Text>
      <Text>Duração: {ag.duracao} min</Text>
      <Text>Valor: R$ {ag.valor}</Text>
      <Text>Status: {ag.status}</Text>
      <Text>Forma Pgto: {ag.formaPagamento}</Text>
      <Text>Obs: {ag.obs}</Text>
      <Text>Atualizado em: {new Date(ag.updatedAt).toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  modalBg: { flex: 1, backgroundColor: '#0008', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 24, minWidth: 320, alignItems: 'center' },
  titulo: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  subtitulo: { fontSize: 15, color: '#555', marginBottom: 8 },
  coluna: { marginHorizontal: 16 },
  colTitle: { fontWeight: 'bold', marginBottom: 6, textAlign: 'center' },
}); 