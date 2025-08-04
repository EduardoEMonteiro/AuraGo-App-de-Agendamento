# Correção dos Warnings do App

## Problemas Identificados

### 1. CustomHeader - Navigation Context Not Found
**Problema**: O componente `CustomHeader` estava tentando usar hooks de navegação mesmo quando não havia contexto de navegação disponível, causando spam de logs.

**Solução**: Implementada lógica defensiva que:
- Tenta usar hooks de navegação de forma segura
- Não loga warnings quando não há contexto disponível
- Só renderiza o botão de voltar quando há router disponível

### 2. Firebase - enableMultiTabIndexedDbPersistence Deprecated
**Problema**: O Firebase estava usando `enableMultiTabIndexedDbPersistence` que está deprecated, causando warnings.

**Solução**: 
- Removida importação de `enableMultiTabIndexedDbPersistence`
- Substituída por `enableIndexedDbPersistence` padrão
- Mantida funcionalidade de persistência offline

## Correções Implementadas

### 1. components/CustomHeader.tsx

#### Antes:
```typescript
try {
  router = useRouter();
  navigation = useNavigation();
  canGoBack = navigation.canGoBack();
} catch (e) {
  console.log('CustomHeader: Navigation context not found. Hiding back button.');
}
```

#### Depois:
```typescript
try {
  router = useRouter();
} catch (e) {
  // Router não disponível
}

try {
  navigation = useNavigation();
  canGoBack = navigation.canGoBack();
} catch (e) {
  // Navigation não disponível - não logamos para evitar spam
}
```

### 2. services/firebase.ts

#### Antes:
```typescript
import {
    disableNetwork,
    enableIndexedDbPersistence,
    enableMultiTabIndexedDbPersistence, // DEPRECATED
    enableNetwork,
    getFirestore
} from 'firebase/firestore';

// Web - usar persistência multi-tab
await enableMultiTabIndexedDbPersistence(db);
```

#### Depois:
```typescript
import {
    disableNetwork,
    enableIndexedDbPersistence,
    enableNetwork,
    getFirestore
} from 'firebase/firestore';

// Web - usar persistência padrão (multi-tab deprecated)
await enableIndexedDbPersistence(db);
```

## Resultado Esperado

- ✅ Eliminação dos warnings do CustomHeader
- ✅ Eliminação do warning do Firebase sobre enableMultiTabIndexedDbPersistence
- ✅ Logs mais limpos e organizados
- ✅ Funcionalidade mantida intacta

## Testes

Para verificar se os warnings foram corrigidos:

1. **Executar o app**: `npx expo start --clear`
2. **Verificar logs**: Não deve haver mais warnings sobre "Navigation context not found"
3. **Verificar Firebase**: Não deve haver mais warnings sobre enableMultiTabIndexedDbPersistence

## Arquivos Modificados

- `components/CustomHeader.tsx`
- `services/firebase.ts` 