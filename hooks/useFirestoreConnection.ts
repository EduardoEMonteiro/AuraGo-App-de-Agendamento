import { useCallback, useEffect, useState } from 'react';
import { autoReconnectFirestore, isFirestoreConnected } from '../services/firebase';

export const useFirestoreConnection = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    const connected = isFirestoreConnected();
    setIsConnected(connected);
    
    if (!connected && !isReconnecting) {
      setIsReconnecting(true);
      setLastError('Conexão perdida. Tentando reconectar...');
      
      try {
        const success = await autoReconnectFirestore(2);
        if (success) {
          setIsConnected(true);
          setLastError(null);
        } else {
          setLastError('Falha na reconexão. Verifique sua conexão de internet.');
        }
      } catch (error: any) {
        setLastError(`Erro de conexão: ${error.message}`);
      } finally {
        setIsReconnecting(false);
      }
    }
  }, [isReconnecting]);

  useEffect(() => {
    // Verificar conexão inicial
    checkConnection();

    // Configurar verificação periódica
    const interval = setInterval(checkConnection, 30000); // A cada 30 segundos

    return () => {
      clearInterval(interval);
    };
  }, [checkConnection]);

  const forceReconnect = useCallback(async () => {
    setIsReconnecting(true);
    setLastError('Reconectando...');
    
    try {
      const success = await autoReconnectFirestore(3);
      if (success) {
        setIsConnected(true);
        setLastError(null);
      } else {
        setLastError('Falha na reconexão forçada.');
      }
    } catch (error: any) {
      setLastError(`Erro na reconexão: ${error.message}`);
    } finally {
      setIsReconnecting(false);
    }
  }, []);

  return {
    isConnected,
    isReconnecting,
    lastError,
    checkConnection,
    forceReconnect,
  };
}; 