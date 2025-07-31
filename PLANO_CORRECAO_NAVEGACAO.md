# PLANO DE CORREÇÃO DE NAVEGAÇÃO - APP AURA

## PROBLEMAS IDENTIFICADOS E CORRIGIDOS

### 1. **Navegação Imperativa em Múltiplos Locais**
**Problema**: Várias telas faziam navegação imperativa (`router.push`, `router.replace`) causando conflitos com o roteamento centralizado.

**Solução**: Removida navegação imperativa das telas e centralizada toda a lógica no `RootLayout`.

### 2. **Fluxo de Cadastro Incompleto**
**Problema**: Após cadastrar o salão, não havia redirecionamento automático para seleção de planos.

**Solução**: Implementado fluxo automático no `RootLayout` que detecta quando o usuário tem `idSalao` mas não tem plano ativo.

### 3. **Verificação de E-mail Melhorada**
**Problema**: Usuários antigos eram obrigados a verificar e-mail, causando problemas de acesso.

**Solução**: 
- ✅ **Novos usuários**: Exige verificação de e-mail antes do acesso
- ✅ **Usuários antigos**: Permite acesso mas mostra banner discreto
- ✅ **Reenvio de e-mail**: Implementado botão para reenviar e-mail de verificação
- ✅ **Banner informativo**: Componente discreto para usuários antigos

### 4. **Estados de Loading Mal Gerenciados**
**Problema**: Múltiplos estados de loading causavam "flashes" de tela.

**Solução**: Centralizado gerenciamento de loading no `RootLayout` com tela de loading única.

### 5. **Falta de Sincronização Entre Estados**
**Problema**: `useAuthStore` e `useSalaoInfo` não estavam sincronizados adequadamente.

**Solução**: 
- Melhorado `updateUser` no `useAuthStore` com logs detalhados
- Corrigido `useSalaoInfo` para detectar mudanças no `user.idSalao`
- Adicionada limpeza de estado quando usuário não tem salão

## FLUXO CORRIGIDO IMPLEMENTADO

### **Jornada 1: Novo Usuário**
1. ✅ Usuário preenche formulário de cadastro
2. ✅ App cria conta e envia e-mail de verificação
3. ✅ App exibe Alert sobre necessidade de validar e-mail
4. ✅ Botão "Reenviar E-mail" disponível no alerta
5. ✅ Ao clicar "OK", usuário é deslogado e volta para tela de Login

### **Jornada 2: Usuário Antigo**
1. ✅ Usuário faz login com e-mail não verificado
2. ✅ App detecta que é usuário antigo (tem salão)
3. ✅ Permite acesso ao app normalmente
4. ✅ Mostra banner discreto sugerindo verificação de e-mail
5. ✅ Banner tem botão para reenviar e-mail de verificação

### **Jornada 3: Onboarding e Pagamento**
1. ✅ Usuário (com e-mail verificado) faz login
2. ✅ App detecta que não tem salão → redireciona para Cadastro de Salão
3. ✅ Após salvar salão → redireciona automaticamente para Seleção de Planos
4. ✅ Usuário escolhe plano → abre checkout do Stripe
5. ✅ Após pagamento → redireciona para tela de "Sucesso"
6. ✅ Tela de "Sucesso" → redireciona para "Aguardando Confirmação"
7. ✅ Tela "Aguardando" escuta banco até webhook confirmar pagamento
8. ✅ Ao detectar confirmação → redireciona para Agenda (tela principal)

## ARQUIVOS MODIFICADOS

### 1. `app/_layout.tsx`
- ✅ Adicionada verificação diferenciada de e-mail (novos vs antigos)
- ✅ Implementado banner de verificação de e-mail
- ✅ Melhorada lógica de roteamento centralizada
- ✅ Adicionados logs detalhados para debug

### 2. `screens/LoginScreen.tsx`
- ✅ Implementada verificação diferenciada de e-mail
- ✅ Adicionado botão "Reenviar E-mail" nos alertas
- ✅ Tratamento diferenciado para usuários novos e antigos
- ✅ Deslogamento automático apenas para novos usuários

### 3. `components/EmailVerificationBanner.tsx` (NOVO)
- ✅ Componente discreto para usuários antigos
- ✅ Botão para reenviar e-mail de verificação
- ✅ Design não intrusivo
- ✅ Pode ser fechado pelo usuário

### 4. `screens/CadastroSalaoScreen.tsx`
- ✅ Removida navegação imperativa
- ✅ Mantida atualização do estado do usuário
- ✅ RootLayout cuida do redirecionamento automático

### 5. `app/selecao-plano.tsx`
- ✅ Mantida navegação para checkout (parte do fluxo de pagamento)
- ✅ Melhorados logs de debug

### 6. `app/aguardando-confirmacao.tsx`
- ✅ Removida navegação imperativa
- ✅ RootLayout cuida do redirecionamento quando assinatura é confirmada

### 7. `contexts/useAuthStore.ts`
- ✅ Melhorado `updateUser` com logs detalhados
- ✅ Adicionado parâmetro `get` para futuras expansões

### 8. `hooks/useSalaoInfo.ts`
- ✅ Melhorada sincronização com estado de autenticação
- ✅ Adicionada limpeza de estado quando usuário não tem salão
- ✅ Melhorados logs de debug

## BENEFÍCIOS DAS CORREÇÕES

1. **Navegação Consistente**: Toda navegação agora é controlada centralmente
2. **Fluxo Automático**: Usuário não precisa navegar manualmente entre telas
3. **Verificação de E-mail Inteligente**: 
   - Novos usuários: Exige verificação
   - Usuários antigos: Permite acesso com aviso discreto
4. **Reenvio de E-mail**: Botão disponível para reenviar e-mail de verificação
5. **Estados Sincronizados**: `useAuthStore` e `useSalaoInfo` funcionam em harmonia
6. **Debug Melhorado**: Logs detalhados facilitam identificação de problemas
7. **Experiência do Usuário**: Fluxo mais suave e intuitivo
8. **Compatibilidade**: Usuários antigos não são prejudicados

## TESTES RECOMENDADOS

1. **Teste de Usuário Novo**: Criar novo usuário e verificar fluxo completo
2. **Teste de Usuário Antigo**: Fazer login com usuário existente sem e-mail verificado
3. **Teste de Reenvio de E-mail**: Verificar se o botão funciona corretamente
4. **Teste de Banner**: Verificar se o banner aparece e pode ser fechado
5. **Teste de Onboarding**: Verificar redirecionamentos automáticos
6. **Teste de Pagamento**: Simular fluxo completo de pagamento
7. **Teste de Webhook**: Verificar confirmação automática de assinatura

## PRÓXIMOS PASSOS

1. Testar todos os fluxos em ambiente de desenvolvimento
2. Verificar se não há regressões em outras funcionalidades
3. Implementar testes automatizados para os fluxos críticos
4. Monitorar logs em produção para identificar possíveis problemas
5. Considerar implementar métricas para acompanhar taxa de verificação de e-mail 