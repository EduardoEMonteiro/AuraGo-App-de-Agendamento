import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../contexts/useAuthStore';
import { db } from '../services/firebase';

const DIAS_SEMANA = [
  { key: 'segunda', label: 'Segunda' },
  { key: 'terca', label: 'Terça' },
  { key: 'quarta', label: 'Quarta' },
  { key: 'quinta', label: 'Quinta' },
  { key: 'sexta', label: 'Sexta' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
];

export const screenOptions = {
  headerShown: false,
};

export default function HorarioFuncionamentoScreen({ route }: any) {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);
  const router = useRouter();
  const routeUser = route?.params?.user;
  const globalUser = useAuthStore((state) => state.user);
  const user = routeUser || globalUser;
  const insets = useSafeAreaInsets();
  const [dias, setDias] = useState(() =>
    DIAS_SEMANA.map((d, i) => ({
      dia: d.key,
      label: d.label,
      ativo: i < 6,
      inicio: '08:00',
      fim: '18:00',
    }))
  );
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [showPicker, setShowPicker] = useState<null | { index: number; campo: 'inicio' | 'fim' }>(null);

  useEffect(() => {
    async function fetchHorario() {
      if (!user?.idSalao) return setLoading(false);
      const ref = doc(db, 'configuracoes', `horario_funcionamento_${user.idSalao}`);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.dias)) {
          setDias(
            data.dias.map((d: any, i: number) => ({
              dia: d.dia,
              label: DIAS_SEMANA[i]?.label || d.dia,
              ativo: d.ativo,
              inicio: d.inicio,
              fim: d.fim,
            }))
          );
        }
      }
      setLoading(false);
    }
    fetchHorario();
  }, [user?.idSalao]);

  function handleToggleDia(idx: number) {
    setDias((ds) =>
      ds.map((d, i) => (i === idx ? { ...d, ativo: !d.ativo } : d))
    );
  }

  function handleTimeSelect(event: any, selectedDate?: Date) {
    if (Platform.OS === 'android') setShowPicker(null);
    if (!selectedDate || !showPicker) return;

    const horas = selectedDate.getHours().toString().padStart(2, '0');
    const minutos = selectedDate.getMinutes().toString().padStart(2, '0');
    const horaStr = `${horas}:${minutos}`;

    setDias((prev) =>
      prev.map((d, i) =>
        i === showPicker.index ? { ...d, [showPicker.campo]: horaStr } : d
      )
    );

    if (Platform.OS === 'ios') return; // iOS mantém o picker visível
    setShowPicker(null);
  }

  async function handleSalvar() {
    if (!user?.idSalao) {
      Alert.alert('Erro', 'Salão não identificado!');
      return;
    }
    setSalvando(true);
    try {
      const ref = doc(db, 'configuracoes', `horario_funcionamento_${user.idSalao}`);
      await setDoc(ref, { dias });
      // Atualiza também no documento do salão
      const salaoRef = doc(db, 'saloes', user.idSalao);
      await setDoc(salaoRef, { horarioFuncionamento: dias }, { merge: true });
      router.back();
      setTimeout(() => {
        Alert.alert('Sucesso', 'Horário de funcionamento salvo!');
      }, 100);
    } catch (e) {
      Alert.alert('Erro ao salvar', e?.message || String(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]} pointerEvents="box-none">
        <TouchableOpacity
          onPress={() => (router.canGoBack ? router.canGoBack() && router.back() : navigation.goBack())}
          style={[styles.backButton, { width: 48, height: 48, borderRadius: 24 }]}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <Feather name="arrow-left" size={24} color="#1976d2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Horário de Funcionamento</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1976d2" />
        </View>
      ) : (
        <>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
            {dias.map((d, idx) => (
              <View key={d.dia} style={styles.cardRow}>
                <View style={styles.rowLeft}>
                  <TouchableOpacity onPress={() => handleToggleDia(idx)}>
                    <View
                      style={[
                        styles.check,
                        {
                          borderColor: d.ativo ? '#1976d2' : '#ccc',
                          backgroundColor: d.ativo ? '#1976d2' : '#fff',
                        },
                      ]}
                    >
                      {d.ativo && <Feather name="check" size={14} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.diaLabel}>{d.label}</Text>
                </View>
                <View style={styles.timeInputs}>
                  <TouchableOpacity
                    onPress={() => d.ativo && setShowPicker({ index: idx, campo: 'inicio' })}
                    disabled={!d.ativo}
                  >
                    <Text style={[styles.input, !d.ativo && styles.inputDisabled]}>{d.inicio}</Text>
                  </TouchableOpacity>
                  <Text style={styles.ate}>às</Text>
                  <TouchableOpacity
                    onPress={() => d.ativo && setShowPicker({ index: idx, campo: 'fim' })}
                    disabled={!d.ativo}
                  >
                    <Text style={[styles.input, !d.ativo && styles.inputDisabled]}>{d.fim}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
            <TouchableOpacity
              style={[styles.salvar, salvando && styles.salvarDisabled]}
              onPress={handleSalvar}
              disabled={salvando}
            >
              <Text style={styles.salvarText}>{salvando ? 'Salvando...' : 'Salvar'}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Time Picker */}
      {showPicker && (
        <DateTimePicker
          mode="time"
          value={new Date()}
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeSelect}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    zIndex: 100,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    zIndex: 101,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: -32,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  cardRow: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diaLabel: {
    fontSize: 15,
    color: '#222',
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    width: 60,
    fontSize: 14,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: 'center',
    color: '#222',
  },
  inputDisabled: {
    opacity: 0.5,
  },
  ate: {
    fontSize: 13,
    marginHorizontal: 6,
    color: '#444',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  salvar: {
    backgroundColor: '#1976d2',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  salvarDisabled: {
    opacity: 0.5,
  },
  salvarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
