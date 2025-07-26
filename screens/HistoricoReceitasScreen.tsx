import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuthStore } from '../contexts/useAuthStore';
import { db } from '../services/firebase';

// --- CONSTANTS & HELPERS (Moved outside for better organization) ---

const PERIOD_OPTIONS = [
  { label: 'Hoje', value: 'today' },
  { label: 'Este mês', value: 'currentMonth' },
  { label: 'Mês passado', value: 'lastMonth' },
  { label: 'Este ano', value: 'currentYear' },
  { label: 'Período específico', value: 'custom' },
];

const DateUtils = {
  startOfDay: (date: Date) => { const d = new Date(date); d.setHours(0, 0, 0, 0); return d; },
  endOfDay: (date: Date) => { const d = new Date(date); d.setHours(23, 59, 59, 999); return d; },
  startOfMonth: (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1),
  endOfMonth: (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999),
  startOfYear: (date: Date) => new Date(date.getFullYear(), 0, 1),
  endOfYear: (date: Date) => new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999),
  formatDate: (date: Date | null) => date ? date.toLocaleDateString('pt-BR') : '',
};

// --- MAIN COMPONENT ---

export default function HistoricoReceitasScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuthStore();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const [activeTab, setActiveTab] = useState<'checkout' | 'venda'>('checkout');
  const [period, setPeriod] = useState('today');
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [receitasCheckout, setReceitasCheckout] = useState<any[]>([]);
  const [receitasVenda, setReceitasVenda] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- DATA FETCHING LOGIC (Unchanged) ---
  useEffect(() => {
    if (!user?.idSalao) return;
    setLoading(true);
    let start: Date, end: Date;
    const now = new Date();

    switch (period) {
      case 'today':
        start = DateUtils.startOfDay(now);
        end = DateUtils.endOfDay(now);
        break;
      case 'currentMonth':
        start = DateUtils.startOfMonth(now);
        end = DateUtils.endOfMonth(now);
        break;
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        start = DateUtils.startOfMonth(lastMonth);
        end = DateUtils.endOfMonth(lastMonth);
        break;
      case 'currentYear':
        start = DateUtils.startOfYear(now);
        end = DateUtils.endOfYear(now);
        break;
      case 'custom':
        if (customStart && customEnd) {
          start = DateUtils.startOfDay(customStart);
          end = DateUtils.endOfDay(customEnd);
        } else {
          setLoading(false);
          return;
        }
        break;
      default:
        setLoading(false);
        return;
    }

    const fetchCheckoutRevenue = getDocs(
      query(collection(db, 'saloes', user.idSalao, 'agendamentos'), orderBy('data'))
    ).then(snapshot => {
      const revenues = snapshot.docs
        .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
        .filter(ag => (ag.status === 'paid' || ag.status === 'completed') && ag.data)
        .filter(ag => {
          const agDate = ag.data?.toDate ? ag.data.toDate() : new Date(ag.data);
          return agDate >= start && agDate <= end;
        });
      setReceitasCheckout(revenues);
    });

    const fetchSalesRevenue = getDocs(
      query(collection(db, 'saloes', user.idSalao, 'receitas'), orderBy('data'))
    ).then(snapshot => {
      const revenues = snapshot.docs
        .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
        .filter(r => {
          const rDate = r.data?.toDate ? r.data.toDate() : new Date(r.data);
          return rDate >= start && rDate <= end;
        });
      setReceitasVenda(revenues);
    });

    Promise.all([fetchCheckoutRevenue, fetchSalesRevenue]).finally(() => setLoading(false));
  }, [user?.idSalao, period, customStart, customEnd]);

  // --- UI RENDER FUNCTIONS ---

  const Header = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color={COLORS.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Histórico de Receitas</Text>
    </View>
  );

  const PeriodFilter = () => {
    // Enhanced UX: Shows the selected custom date range
    const getPeriodLabel = (option: typeof PERIOD_OPTIONS[0]) => {
        if (option.value === 'custom' && customStart && customEnd) {
            return `${DateUtils.formatDate(customStart)} - ${DateUtils.formatDate(customEnd)}`;
        }
        return option.label;
    }
    
    return (
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollView}>
          {PERIOD_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, period === opt.value && styles.chipActive]}
              onPress={() => {
                setPeriod(opt.value);
                if (opt.value === 'custom') {
                    setCustomStart(null); // Reset dates
                    setCustomEnd(null);
                    setShowStartPicker(true);
                }
              }}
            >
              <Text style={[styles.chipText, period === opt.value && styles.chipTextActive]}>
                {getPeriodLabel(opt)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };
  
  const Tabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'checkout' && styles.tabActive]}
        onPress={() => setActiveTab('checkout')}
      >
        <Text style={[styles.tabText, activeTab === 'checkout' && styles.tabTextActive]}>
          Check-outs
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'venda' && styles.tabActive]}
        onPress={() => setActiveTab('venda')}
      >
        <Text style={[styles.tabText, activeTab === 'venda' && styles.tabTextActive]}>
          Venda Rápida
        </Text>
      </TouchableOpacity>
    </View>
  );

  const RevenueItem = ({ item }: { item: any }) => {
    const value = (item.finalPrice ?? item.servicoValor ?? item.valor ?? 0);
    const date = item.data?.toDate ? item.data.toDate() : new Date(item.data);
    const details = [
        item.servicoNome && `Serviço: ${item.servicoNome}`,
        item.produtosVendidos?.length > 0 && `Produtos: ${item.produtosVendidos.map((p: any) => p.nome).join(', ')}`,
        item.categoria && `Categoria: ${item.categoria}`
    ].filter(Boolean).join(' • ');

    return (
      <View style={styles.card}>
        <Feather name={activeTab === 'checkout' ? 'calendar' : 'tag'} size={24} color={COLORS.lightText} style={styles.cardIcon} />
        <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.clienteNome || item.nome || 'Receita'}</Text>
            {details && <Text style={styles.cardDescription} numberOfLines={1}>{details}</Text>}
        </View>
        <View style={styles.cardValueContainer}>
            <Text style={styles.cardValue}>R$ {value.toFixed(2).replace('.', ',')}</Text>
            <Text style={styles.cardDate}>{DateUtils.formatDate(date)}</Text>
        </View>
      </View>
    );
  };

  const LoadingIndicator = () => (
    <View style={styles.centeredContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Carregando receitas...</Text>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.centeredContainer}>
        <Feather name="inbox" size={48} color={COLORS.lightText} />
        <Text style={styles.emptyText}>Nenhuma receita encontrada para o período.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header />
      <PeriodFilter />
      <Tabs />

      {loading ? (
        <LoadingIndicator />
      ) : (
        <FlatList
          data={activeTab === 'checkout' ? receitasCheckout : receitasVenda}
          renderItem={({ item }) => <RevenueItem item={item} />}
          keyExtractor={item => item.id}
          ListEmptyComponent={EmptyState}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* --- DATE PICKERS (Modal Logic) --- */}
      {showStartPicker && (
        <DateTimePicker
          value={customStart || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, d) => {
            setShowStartPicker(false);
            if (d) {
              setCustomStart(d);
              setTimeout(() => setShowEndPicker(true), 200); // Small delay for smoother transition
            }
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={customEnd || customStart || new Date()}
          mode="date"
          minimumDate={customStart!} // Ensures end date is not before start date
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, d) => {
            setShowEndPicker(false);
            if (d) setCustomEnd(d);
          }}
        />
      )}
    </View>
  );
}

// --- STYLESHEET (Centralized and organized) ---

const COLORS = {
  primary: '#1976d2', // Blue
  success: '#2e7d32', // Green for values
  background: '#F4F6F8',
  white: '#FFFFFF',
  text: '#212121',
  lightText: '#757575',
  borderColor: '#E0E0E0',
  chipBackground: '#EEEEEE',
};

const styles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 48,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    bottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  // Period Filter
  filterContainer: {
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  filterScrollView: {
    paddingHorizontal: 16,
  },
  chip: {
    backgroundColor: COLORS.chipBackground,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.text,
    fontWeight: '500',
    fontSize: 14,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.lightText,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  // Revenue Item Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    // Shadow for Android
    elevation: 3,
  },
  cardIcon: {
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.lightText,
    marginTop: 2,
  },
  cardValueContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  cardDate: {
    fontSize: 12,
    color: COLORS.lightText,
    marginTop: 2,
  },
  // Placeholders
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.lightText,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.lightText,
    textAlign: 'center',
  },
});