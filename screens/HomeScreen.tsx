import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { memo, useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../contexts/useAuthStore';
import { autoReconnectFirestore, db } from '../services/firebase';
import { canEditAnyAgendamento, canEditOwnAgendamento, canViewFinanceiro } from '../utils/permissions';

export const HomeScreen = memo(() => {
  const { user, logout } = useAuthStore();
  const role = user?.role;
  const [item, setItem] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadItems = async () => {
      try {
        setIsLoading(true);
        setIsOffline(false);
        
        const q = query(collection(db, 'itens'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, 
          (snapshot) => {
            setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsOffline(false);
            setIsLoading(false);
          },
          (error) => {
            console.error('Erro ao carregar itens:', error);
            setIsOffline(true);
            setIsLoading(false);
            
            // Tentar reconectar automaticamente
            if (error.code === 'unavailable' || error.code === 'failed-precondition') {
              console.log('🔄 Tentando reconectar ao Firestore...');
              autoReconnectFirestore();
            }
          }
        );
        
        return unsubscribe;
      } catch (error) {
        console.error('Erro ao configurar listener:', error);
        setIsOffline(true);
        setIsLoading(false);
      }
    };

    loadItems();
  }, []);

  const addItem = useCallback(async () => {
    if (!item.trim()) return;
    
    try {
      setIsOffline(false);
      await addDoc(collection(db, 'itens'), {
        text: item,
        createdAt: new Date(),
        user: user?.email || 'anônimo',
      });
      setItem('');
    } catch (error: any) {
      console.error('Erro ao adicionar item:', error);
      setIsOffline(true);
      
      if (error.code === 'unavailable' || error.code === 'failed-precondition') {
        Alert.alert(
          'Erro de Conexão', 
          'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
          [
            { text: 'OK' },
            { 
              text: 'Tentar Novamente', 
              onPress: () => autoReconnectFirestore() 
            }
          ]
        );
      } else {
        Alert.alert('Erro', 'Não foi possível adicionar o item.');
      }
    }
  }, [item, user?.email]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const handleFinanceiroPress = useCallback(() => {
    Alert.alert('Acesso ao Financeiro', 'Funcionalidade de financeiro!');
  }, []);

  const handleAgendarQualquerPress = useCallback(() => {
    Alert.alert('Agendamento', 'Agendar para qualquer profissional!');
  }, []);

  const handleAgendarProprioPress = useCallback(() => {
    Alert.alert('Agendamento', 'Agendar para mim!');
  }, []);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>
        {item.text} ({item.user})
      </Text>
    </View>
  ), []);

  const keyExtractor = useCallback((item: any) => item.id, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Bem-vindo{user ? `, ${user.email}` : ''}!
        </Text>
        
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>
              ⚠️ Modo offline - Algumas funcionalidades podem estar indisponíveis
            </Text>
          </View>
        )}
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>

        {/* Exemplo de controle de acesso por role */}
        {canViewFinanceiro(role) && (
          <TouchableOpacity style={styles.actionButton} onPress={handleFinanceiroPress}>
            <Text style={styles.actionButtonText}>Totais Financeiros</Text>
          </TouchableOpacity>
        )}
        
        {canEditAnyAgendamento(role) && (
          <TouchableOpacity style={styles.actionButton} onPress={handleAgendarQualquerPress}>
            <Text style={styles.actionButtonText}>Agendar para qualquer profissional</Text>
          </TouchableOpacity>
        )}
        
        {canEditOwnAgendamento(role) && (
          <TouchableOpacity style={styles.actionButton} onPress={handleAgendarProprioPress}>
            <Text style={styles.actionButtonText}>Agendar para mim</Text>
          </TouchableOpacity>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            value={item}
            onChangeText={setItem}
            placeholder="Novo item"
            style={[styles.textInput, isOffline && styles.textInputOffline]}
            placeholderTextColor="#999"
            editable={!isOffline}
          />
          <TouchableOpacity 
            style={[styles.addButton, isOffline && styles.addButtonOffline]} 
            onPress={addItem}
            disabled={isOffline}
          >
            <Text style={styles.addButtonText}>Adicionar</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando itens...</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {isOffline ? 'Modo offline - Dados não disponíveis' : 'Nenhum item encontrado'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
});

HomeScreen.displayName = 'HomeScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: wp('4%'),
    alignItems: 'center',
  },
  title: {
    fontSize: hp('2.75%'),
    fontWeight: 'bold',
    marginBottom: hp('1%'),
    color: '#333',
    textAlign: 'center',
  },
  offlineBanner: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: wp('2%'),
    padding: wp('3%'),
    marginBottom: hp('2%'),
    width: '100%',
  },
  offlineText: {
    color: '#856404',
    fontSize: hp('1.5%'),
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('1.25%'),
    borderRadius: wp('2%'),
    marginBottom: hp('2%'),
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: hp('1.75%'),
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('2%'),
    marginBottom: hp('1%'),
    minWidth: wp('60%'),
  },
  actionButtonText: {
    color: '#fff',
    fontSize: hp('1.75%'),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('3%'),
    marginBottom: hp('2%'),
    width: '100%',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.25%'),
    marginRight: wp('2%'),
    fontSize: hp('1.75%'),
    backgroundColor: '#fff',
    color: '#333',
  },
  textInputOffline: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  addButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.25%'),
    borderRadius: wp('2%'),
  },
  addButtonOffline: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: '#fff',
    fontSize: hp('1.75%'),
    fontWeight: 'bold',
  },
  list: {
    width: '100%',
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  itemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: hp('1.25%'),
    width: '100%',
  },
  itemText: {
    fontSize: hp('1.75%'),
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: hp('1.75%'),
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp('10%'),
  },
  emptyText: {
    fontSize: hp('1.75%'),
    color: '#999',
    textAlign: 'center',
  },
}); 