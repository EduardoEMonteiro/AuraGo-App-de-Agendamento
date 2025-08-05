import { Linking } from 'react-native';
import { cacheManager } from './cacheManager';
import { performanceAnalytics } from './performanceAnalytics';

interface MensagemTemplate {
  confirmacao: string;
  lembrete: string;
}

class MensagemService {
  private static instance: MensagemService;
  private templatesCache: MensagemTemplate | null = null;

  static getInstance(): MensagemService {
    if (!MensagemService.instance) {
      MensagemService.instance = new MensagemService();
    }
    return MensagemService.instance;
  }

  private async getTemplates(): Promise<MensagemTemplate> {
    const cacheKey = 'mensagem_templates_test_salao_001';
    
    // Verificar cache primeiro
    const cached = await cacheManager.get<MensagemTemplate>(cacheKey);
    if (cached) {
      return cached;
    }

    // Templates padrão (seriam buscados do Firestore)
    const templates: MensagemTemplate = {
      confirmacao: 'Olá [NOME]! 😊 Seu agendamento para [SERVIÇO] está confirmado para o dia [DATA] às [HORA]. Qualquer dúvida, estamos à disposição. 💇‍♀️✨ Endereço: [ENDEREÇO]',
      lembrete: 'Oi [NOME], tudo bem? Só passando pra lembrar do seu agendamento amanhã! 📍 [SERVIÇO] 📅 Data: [DATA] ⏰ Horário: [HORA] Qualquer mudança é só nos avisar com antecedência 💖 Endereço: [ENDEREÇO]'
    };

    // Salvar no cache
    await cacheManager.set(cacheKey, templates, 60 * 60 * 1000); // 1 hora
    return templates;
  }

  private formatarData(data: string): string {
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  private formatarHora(hora: string): string {
    return hora;
  }

  private substituirPlaceholders(
    template: string,
    nome: string,
    servico: string,
    data: string,
    hora: string,
    endereco: string = 'Rua de Teste, 123 - Centro, São Paulo'
  ): string {
    return template
      .replace(/\[NOME\]/g, nome)
      .replace(/\[SERVIÇO\]/g, servico)
      .replace(/\[DATA\]/g, this.formatarData(data))
      .replace(/\[HORA\]/g, this.formatarHora(hora))
      .replace(/\[ENDEREÇO\]/g, endereco);
  }

  private async enviarWhatsApp(numero: string, mensagem: string): Promise<void> {
    const timerId = performanceAnalytics.startTimer('whatsapp_linking');
    
    try {
      // Formatar número (remover caracteres especiais)
      const numeroFormatado = numero.replace(/\D/g, '');
      
      // Adicionar código do país se necessário
      const numeroCompleto = numeroFormatado.startsWith('55') 
        ? numeroFormatado 
        : `55${numeroFormatado}`;

      // Criar URL do WhatsApp
      const mensagemEncoded = encodeURIComponent(mensagem);
      const url = `whatsapp://send?phone=${numeroCompleto}&text=${mensagemEncoded}`;

      // Verificar se o WhatsApp está instalado
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        throw new Error('WhatsApp não está instalado');
      }

      // Abrir WhatsApp
      await Linking.openURL(url);
      
      performanceAnalytics.endTimer(timerId, { success: true });
    } catch (error) {
      performanceAnalytics.endTimer(timerId, { error: (error as Error).message });
      throw error;
    }
  }

  async enviarMensagemConfirmacao(
    nome: string,
    servico: string,
    data: string,
    hora: string,
    telefone: string
  ): Promise<void> {
    const timerId = performanceAnalytics.startTimer('mensagem_confirmacao');
    
    try {
      if (!telefone) {
        throw new Error('Número de telefone não disponível');
      }

      // Buscar templates
      const templates = await this.getTemplates();
      
      // Substituir placeholders
      const mensagem = this.substituirPlaceholders(
        templates.confirmacao,
        nome,
        servico,
        data,
        hora
      );

      // Enviar via WhatsApp
      await this.enviarWhatsApp(telefone, mensagem);
      
      performanceAnalytics.endTimer(timerId, { success: true });
    } catch (error) {
      performanceAnalytics.endTimer(timerId, { error: (error as Error).message });
      throw error;
    }
  }

  async enviarMensagemLembrete(
    nome: string,
    servico: string,
    data: string,
    hora: string,
    telefone: string
  ): Promise<void> {
    const timerId = performanceAnalytics.startTimer('mensagem_lembrete');
    
    try {
      if (!telefone) {
        throw new Error('Número de telefone não disponível');
      }

      // Buscar templates
      const templates = await this.getTemplates();
      
      // Substituir placeholders
      const mensagem = this.substituirPlaceholders(
        templates.lembrete,
        nome,
        servico,
        data,
        hora
      );

      // Enviar via WhatsApp
      await this.enviarWhatsApp(telefone, mensagem);
      
      performanceAnalytics.endTimer(timerId, { success: true });
    } catch (error) {
      performanceAnalytics.endTimer(timerId, { error: (error as Error).message });
      throw error;
    }
  }

  async enviarMensagemPersonalizada(
    nome: string,
    servico: string,
    data: string,
    hora: string,
    telefone: string,
    template: string
  ): Promise<void> {
    const timerId = performanceAnalytics.startTimer('mensagem_personalizada');
    
    try {
      if (!telefone) {
        throw new Error('Número de telefone não disponível');
      }

      // Substituir placeholders
      const mensagem = this.substituirPlaceholders(
        template,
        nome,
        servico,
        data,
        hora
      );

      // Enviar via WhatsApp
      await this.enviarWhatsApp(telefone, mensagem);
      
      performanceAnalytics.endTimer(timerId, { success: true });
    } catch (error) {
      performanceAnalytics.endTimer(timerId, { error: (error as Error).message });
      throw error;
    }
  }

  // Método para testar conectividade
  async testarConectividade(): Promise<boolean> {
    try {
      const url = 'whatsapp://send?phone=5511999999999&text=test';
      return await Linking.canOpenURL(url);
    } catch {
      return false;
    }
  }

  // Método para obter estatísticas
  async getEstatisticas(): Promise<{
    templatesCarregados: boolean;
    conectividadeOk: boolean;
    cacheHitRate: number;
  }> {
    const conectividadeOk = await this.testarConectividade();
    const templatesCarregados = this.templatesCache !== null;
    
    // Simular cache hit rate
    const cacheHitRate = 0.85; // 85%

    return {
      templatesCarregados,
      conectividadeOk,
      cacheHitRate
    };
  }
}

export const MensagemService = MensagemService.getInstance(); 