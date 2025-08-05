import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';

export async function populateOptimizedTestData() {
  console.log('🌱 Populando dados de teste com nova estrutura...');
  
  try {
    // 1. Criar salão de teste
    const salaoRef = doc(db, 'saloes', 'test_salao_001');
    await setDoc(salaoRef, {
      nome: 'Salão de Teste',
      telefone: '(11) 99999-9999',
      responsavel: 'Teste Usuário',
      plano: 'essencial',
      statusAssinatura: 'active',
      endereco: {
        cep: '01234-567',
        logradouro: 'Rua de Teste',
        numero: '123',
        bairro: 'Centro',
        cidade: 'São Paulo',
        estado: 'SP'
      },
      criadoEm: new Date(),
      criadoPor: 'test@example.com'
    });

    // 2. Criar usuário de teste
    const userRef = doc(db, 'usuarios', 'test_user_001');
    await setDoc(userRef, {
      email: 'test@example.com',
      role: 'gerente',
      idSalao: 'test_salao_001',
      plano: 'essencial',
      statusAssinatura: 'active',
      criadoEm: new Date()
    });

    // 3. Criar clientes com estrutura otimizada
    const clientes = [
      {
        nome: 'Maria Silva',
        telefone: '11999999999',
        email: 'maria@test.com',
        observacoes: 'Cliente teste',
        criadoEm: new Date(),
        criadoPor: 'test@example.com'
      },
      {
        nome: 'João Santos',
        telefone: '11888888888',
        email: 'joao@test.com',
        observacoes: 'Cliente teste',
        criadoEm: new Date(),
        criadoPor: 'test@example.com'
      }
    ];

    for (const cliente of clientes) {
      await addDoc(collection(db, 'saloes', 'test_salao_001', 'clientes'), cliente);
    }

    // 4. Criar serviços com estrutura otimizada
    const servicos = [
      {
        nome: 'Corte Feminino',
        valor: 80.00,
        duracao: 60,
        cor: '#1976d2',
        ativo: true,
        criadoEm: new Date(),
        criadoPor: 'test@example.com'
      },
      {
        nome: 'Corte Masculino',
        valor: 50.00,
        duracao: 45,
        cor: '#388e3c',
        ativo: true,
        criadoEm: new Date(),
        criadoPor: 'test@example.com'
      }
    ];

    for (const servico of servicos) {
      await addDoc(collection(db, 'saloes', 'test_salao_001', 'servicos'), servico);
    }

    // 5. Criar agendamentos com NOVA ESTRUTURA OTIMIZADA
    const hoje = new Date();
    const agendamentos = [
      {
        clienteId: 'cliente_001',
        clienteNome: 'Maria Silva',
        servicoId: 'servico_001',
        servicoNome: 'Corte Feminino',
        servicoDuracao: 60,
        data: hoje.toISOString(),
        dataTimestamp: hoje,
        dataDia: hoje.toISOString().split('T')[0],
        horaInicio: hoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: 'agendado',
        criadoEm: new Date(),
        criadoPor: 'test@example.com'
      },
      {
        clienteId: 'cliente_002',
        clienteNome: 'João Santos',
        servicoId: 'servico_002',
        servicoNome: 'Corte Masculino',
        servicoDuracao: 45,
        data: new Date(hoje.getTime() + 2 * 60 * 60 * 1000).toISOString(), // +2 horas
        dataTimestamp: new Date(hoje.getTime() + 2 * 60 * 60 * 1000),
        dataDia: new Date(hoje.getTime() + 2 * 60 * 60 * 1000).toISOString().split('T')[0],
        horaInicio: new Date(hoje.getTime() + 2 * 60 * 60 * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: 'agendado',
        criadoEm: new Date(),
        criadoPor: 'test@example.com'
      }
    ];

    for (const agendamento of agendamentos) {
      await addDoc(collection(db, 'saloes', 'test_salao_001', 'agendamentos'), agendamento);
    }

    // 6. Criar configurações de mensagens
    const mensagensRef = doc(db, 'saloes', 'test_salao_001', 'configuracoes', 'mensagensWhatsapp');
    await setDoc(mensagensRef, {
      confirmacao: 'Olá [NOME]! 😊 Seu agendamento para [SERVIÇO] está confirmado para o dia [DATA] às [HORA]. Qualquer dúvida, estamos à disposição. 💇‍♀️✨ Endereço: [ENDEREÇO]',
      lembrete: 'Oi [NOME], tudo bem? Só passando pra lembrar do seu agendamento amanhã! 📍 [SERVIÇO] 📅 Data: [DATA] ⏰ Horário: [HORA] Qualquer mudança é só nos avisar com antecedência 💖 Endereço: [ENDEREÇO]'
    });

    console.log('✅ Dados de teste populados com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao popular dados:', error);
    throw error;
  }
} 