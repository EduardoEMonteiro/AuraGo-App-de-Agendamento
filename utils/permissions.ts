export function canViewFinanceiro(role: string) {
  return role === 'gerente';
}

export function canEditAnyAgendamento(role: string) {
  return role === 'gerente' || role === 'recepcionista';
}

export function canEditOwnAgendamento(role: string) {
  return role === 'gerente' || role === 'colaborador';
}

export function canViewAgendaGeral(role: string) {
  return role === 'gerente' || role === 'recepcionista';
} 