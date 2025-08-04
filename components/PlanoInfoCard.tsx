import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useSalaoInfo } from '../hooks/useSalaoInfo';

interface PlanoInfoCardProps {
  showUpgradeButton?: boolean;
}

export const PlanoInfoCard = memo<PlanoInfoCardProps>(({ 
  showUpgradeButton = false 
}) => {
  const { salaoInfo, getCurrentPlanoInfo } = useSalaoInfo();
  
  if (!salaoInfo?.plano) {
    return null;
  }

  const planoInfo = getCurrentPlanoInfo();

  return (
    <View style={[styles.container, styles.essencial]}>
      <View style={styles.header}>
        <Text style={styles.planoNome}>{planoInfo?.nome}</Text>
        {planoInfo?.preco && (
          <Text style={styles.preco}>{planoInfo.preco}</Text>
        )}
      </View>
      
      <Text style={styles.descricao}>{planoInfo?.descricao}</Text>
      
      <View style={styles.essencialBadge}>
        <Text style={styles.essencialBadgeText}>✓ Plano Ativo</Text>
      </View>
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
  essencialBadge: {
    backgroundColor: '#1976d2',
    paddingVertical: hp('0.75%'), // ~6px em tela padrão
    paddingHorizontal: wp('3%'), // ~12px em tela padrão
    borderRadius: wp('4%'), // ~16px em tela padrão
    alignSelf: 'flex-start',
  },
  essencialBadgeText: {
    color: '#fff',
    fontSize: hp('1.5%'), // ~12px em tela padrão
    fontWeight: 'bold',
  },
}); 