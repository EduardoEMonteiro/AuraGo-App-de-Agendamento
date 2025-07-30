import { memo, useCallback } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useSalaoInfo } from '../hooks/useSalaoInfo';

interface PlanoInfoCardProps {
  showUpgradeButton?: boolean;
}

export const PlanoInfoCard = memo<PlanoInfoCardProps>(({ 
  showUpgradeButton = true 
}) => {
  const { salaoInfo, getCurrentPlanoInfo } = useSalaoInfo();
  
  if (!salaoInfo?.plano) {
    return null;
  }

  const planoInfo = getCurrentPlanoInfo();
  const isEssencial = salaoInfo.plano === 'essencial';

  const handleUpgrade = useCallback(() => {
    Alert.alert(
      'Upgrade para Plano Pro',
      'Entre em contato conosco para fazer o upgrade do seu plano e desbloquear todos os recursos avançados!',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Contatar', 
          onPress: useCallback(() => {
            Alert.alert('Contato', 'WhatsApp: (11) 99999-9999\nEmail: contato@aura.com');
          }, [])
        }
      ]
    );
  }, []);

  return (
    <View style={[styles.container, isEssencial ? styles.essencial : styles.pro]}>
      <View style={styles.header}>
        <Text style={styles.planoNome}>{planoInfo?.nome}</Text>
        {planoInfo?.preco && (
          <Text style={styles.preco}>{planoInfo.preco}</Text>
        )}
      </View>
      
      <Text style={styles.descricao}>{planoInfo?.descricao}</Text>
      
      {isEssencial && showUpgradeButton && (
        <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
          <Text style={styles.upgradeButtonText}>Fazer Upgrade</Text>
        </TouchableOpacity>
      )}
      
      {!isEssencial && (
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>✓ Plano Ativo</Text>
        </View>
      )}
    </View>
  );
});

PlanoInfoCard.displayName = 'PlanoInfoCard';

const styles = StyleSheet.create({
  container: {
    padding: wp('4%'), // ~16px em tela padrão
    borderRadius: wp('3%'), // ~12px em tela padrão
    marginHorizontal: wp('4%'), // ~16px em tela padrão
    marginVertical: hp('1%'), // ~8px em tela padrão
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  essencial: {
    backgroundColor: '#f0f8ff',
    borderLeftWidth: wp('1%'), // ~4px em tela padrão
    borderLeftColor: '#1976d2',
  },
  pro: {
    backgroundColor: '#e8f5e8',
    borderLeftWidth: wp('1%'), // ~4px em tela padrão
    borderLeftColor: '#388e3c',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1%'), // ~8px em tela padrão
  },
  planoNome: {
    fontSize: hp('2.25%'), // ~18px em tela padrão
    fontWeight: 'bold',
    color: '#333',
  },
  preco: {
    fontSize: hp('2%'), // ~16px em tela padrão
    fontWeight: 'bold',
    color: '#1976d2',
  },
  descricao: {
    fontSize: hp('1.75%'), // ~14px em tela padrão
    color: '#666',
    marginBottom: hp('1.5%'), // ~12px em tela padrão
  },
  upgradeButton: {
    backgroundColor: '#1976d2',
    paddingVertical: hp('1.25%'), // ~10px em tela padrão
    paddingHorizontal: wp('5%'), // ~20px em tela padrão
    borderRadius: wp('2%'), // ~8px em tela padrão
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: hp('1.75%'), // ~14px em tela padrão
    fontWeight: 'bold',
  },
  proBadge: {
    backgroundColor: '#388e3c',
    paddingVertical: hp('0.75%'), // ~6px em tela padrão
    paddingHorizontal: wp('3%'), // ~12px em tela padrão
    borderRadius: wp('4%'), // ~16px em tela padrão
    alignSelf: 'flex-start',
  },
  proBadgeText: {
    color: '#fff',
    fontSize: hp('1.5%'), // ~12px em tela padrão
    fontWeight: 'bold',
  },
}); 