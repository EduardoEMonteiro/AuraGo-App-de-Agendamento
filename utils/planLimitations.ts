// Utilitários para verificar limitações baseadas no plano do salão

export interface PlanoLimitations {
  maxProfissionais: number;
  maxClientes: number;
  maxServicos: number;
  maxProdutos: number;
  relatoriosAvancados: boolean;
  integracaoWhatsapp: boolean;
  backupAutomatico: boolean;
  agendamentoAvancado: boolean;
}

export const PLANO_LIMITATIONS: Record<string, PlanoLimitations> = {
  essencial: {
    maxProfissionais: 3,
    maxClientes: -1, // Ilimitado
    maxServicos: -1, // Ilimitado
    maxProdutos: -1, // Ilimitado
    relatoriosAvancados: false,
    integracaoWhatsapp: false,
    backupAutomatico: false,
    agendamentoAvancado: false,
  },
  pro: {
    maxProfissionais: -1, // Ilimitado
    maxClientes: -1, // Ilimitado
    maxServicos: -1, // Ilimitado
    maxProdutos: -1, // Ilimitado
    relatoriosAvancados: true,
    integracaoWhatsapp: true,
    backupAutomatico: true,
    agendamentoAvancado: true,
  },
};

/**
 * Verifica se o salão pode adicionar mais profissionais
 */
export function canAddProfissional(planoSalao: string, quantidadeAtual: number): boolean {
  const limitations = PLANO_LIMITATIONS[planoSalao] || PLANO_LIMITATIONS.essencial;
  return limitations.maxProfissionais === -1 || quantidadeAtual < limitations.maxProfissionais;
}

/**
 * Verifica se o salão pode adicionar mais clientes
 */
export function canAddCliente(planoSalao: string, quantidadeAtual: number): boolean {
  const limitations = PLANO_LIMITATIONS[planoSalao] || PLANO_LIMITATIONS.essencial;
  return limitations.maxClientes === -1 || quantidadeAtual < limitations.maxClientes;
}

/**
 * Verifica se o salão pode adicionar mais serviços
 */
export function canAddServico(planoSalao: string, quantidadeAtual: number): boolean {
  const limitations = PLANO_LIMITATIONS[planoSalao] || PLANO_LIMITATIONS.essencial;
  return limitations.maxServicos === -1 || quantidadeAtual < limitations.maxServicos;
}

/**
 * Verifica se o salão pode adicionar mais produtos
 */
export function canAddProduto(planoSalao: string, quantidadeAtual: number): boolean {
  const limitations = PLANO_LIMITATIONS[planoSalao] || PLANO_LIMITATIONS.essencial;
  return limitations.maxProdutos === -1 || quantidadeAtual < limitations.maxProdutos;
}

/**
 * Verifica se o salão tem acesso a relatórios avançados
 */
export function hasRelatoriosAvancados(planoSalao: string): boolean {
  const limitations = PLANO_LIMITATIONS[planoSalao] || PLANO_LIMITATIONS.essencial;
  return limitations.relatoriosAvancados;
}

/**
 * Verifica se o salão tem integração com WhatsApp
 */
export function hasIntegracaoWhatsapp(planoSalao: string): boolean {
  const limitations = PLANO_LIMITATIONS[planoSalao] || PLANO_LIMITATIONS.essencial;
  return limitations.integracaoWhatsapp;
}

/**
 * Verifica se o salão tem backup automático
 */
export function hasBackupAutomatico(planoSalao: string): boolean {
  const limitations = PLANO_LIMITATIONS[planoSalao] || PLANO_LIMITATIONS.essencial;
  return limitations.backupAutomatico;
}

/**
 * Verifica se o salão tem agendamento avançado
 */
export function hasAgendamentoAvancado(planoSalao: string): boolean {
  const limitations = PLANO_LIMITATIONS[planoSalao] || PLANO_LIMITATIONS.essencial;
  return limitations.agendamentoAvancado;
}

/**
 * Retorna a mensagem de limite atingido
 */
export function getLimitMessage(planoSalao: string, tipo: 'profissionais' | 'clientes' | 'servicos' | 'produtos'): string {
  const limitations = PLANO_LIMITATIONS[planoSalao] || PLANO_LIMITATIONS.essencial;
  
  switch (tipo) {
    case 'profissionais':
      return `Limite de ${limitations.maxProfissionais} profissionais atingido. Faça upgrade para o Plano Pro para profissionais ilimitados.`;
    case 'clientes':
      return `Sem limite de clientes.`;
    case 'servicos':
      return `Sem limite de serviços.`;
    case 'produtos':
      return `Sem limite de produtos.`;
    default:
      return 'Limite atingido. Faça upgrade para o Plano Pro.';
  }
}

/**
 * Retorna informações do plano atual
 */
export function getPlanoInfo(planoSalao: string): { nome: string; descricao: string; preco?: string } {
  switch (planoSalao) {
    case 'essencial':
      return {
        nome: 'Plano Essencial',
        descricao: 'Ideal para salões pequenos',
        preco: 'R$ 19,90/mês'
      };
    case 'pro':
      return {
        nome: 'Plano Pro',
        descricao: 'Para salões em crescimento',
        preco: 'R$ 59,90/mês'
      };
    default:
      return {
        nome: 'Plano Essencial',
        descricao: 'Ideal para salões pequenos',
        preco: 'R$ 19,90/mês'
      };
  }
} 