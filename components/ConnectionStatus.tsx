import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useFirestoreConnection } from '../hooks/useFirestoreConnection';

export const ConnectionStatus = React.memo(() => {
  const { isConnected, isReconnecting, lastError, forceReconnect } = useFirestoreConnection();

  if (isConnected && !lastError) {
    return null; // Não mostrar nada se estiver conectado
  }

  return (
    <View style={[
      styles.container,
      isReconnecting ? styles.reconnecting : styles.error
    ]}>
      <Feather 
        name={isReconnecting ? "wifi" : "wifi-off"} 
        size={hp('2%')} 
        color={isReconnecting ? "#ff9800" : "#f44336"} 
      />
      <Text style={styles.text}>
        {isReconnecting 
          ? 'Reconectando...' 
          : lastError || 'Problema de conexão'
        }
      </Text>
      {!isReconnecting && (
        <TouchableOpacity onPress={forceReconnect} style={styles.retryButton}>
          <Feather name="refresh-cw" size={hp('1.5%')} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
});

ConnectionStatus.displayName = 'ConnectionStatus';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    marginHorizontal: wp('4%'),
    marginVertical: hp('1%'),
    borderRadius: wp('2%'),
  },
  reconnecting: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  error: {
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  text: {
    flex: 1,
    fontSize: hp('1.5%'),
    color: '#333',
    marginLeft: wp('2%'),
  },
  retryButton: {
    padding: wp('1%'),
  },
}); 