import pb from '@/lib/pocketbase/client'

/**
 * Configuração de Planos e Preços (Fase de Avaliação / MODO TESTE)
 *
 * MODO_TESTE = true: Cobrança real desativada nesta fase.
 * Nenhum gateway ou checkout é disparado; contadores e empresários avaliam
 * a plataforma livremente. Os valores são informativos.
 * A migração é instantânea no modo teste.
 */
export const MODO_TESTE_COBRANCA = true

export interface PlanoConfig {
  id: 'empresario' | 'analista'
  perfil: 'empresario' | 'contador'
  nome: string
  subtitulo: string
  precoMensalTexto: string
  valorNumerico: number
  recorrencia: string
  destaque: boolean
  tag: string
  descricao: string
  recursos: {
    texto: string
    liberado: boolean
    destaque?: boolean
  }[]
  restricoes: string[]
  ctaTexto: string
  ctaAcao: 'cadastro_empresario' | 'cadastro_analista' | 'migrar'
}

export const PLANOS_CONFIG: Record<'empresario' | 'analista', PlanoConfig> = {
  empresario: {
    id: 'empresario',
    perfil: 'empresario',
    nome: 'Plano Empresário',
    subtitulo: 'Acesso independente para o tomador de decisão',
    precoMensalTexto: 'R$ 127',
    valorNumerico: 127,
    recorrencia: '/mês',
    destaque: false,
    tag: 'Empresas & Negócios',
    descricao:
      'Ideal para o empresário acompanhar seus diagnósticos tributários, simulações da empresa e histórico com máxima transparência fiscal sob a Reforma IBS/CBS.',
    recursos: [
      { texto: 'Acesso completo ao Diagnóstico Tributário da sua empresa', liberado: true },
      { texto: 'Simulações e projeções na Calculadora IBS/CBS (LC 214/2025)', liberado: true },
      {
        texto: 'Acompanhamento do enquadramento tributário (360°, Transição, Regimes)',
        liberado: true,
      },
      { texto: 'Histórico de pareceres e análises contábeis compartilhadas', liberado: true },
      { texto: 'Exportação e relatórios da sua própria empresa', liberado: true },
      { texto: 'Carteira multi-empresas consolidada', liberado: false },
      { texto: 'Gestão de múltiplos clientes atendidos', liberado: false },
      { texto: 'Envio de convites para clientes', liberado: false },
    ],
    restricoes: [
      'Sem acesso à Carteira multi-empresas',
      'Sem módulo de Clientes atendidos',
      'Sem emissão de convites a terceiros',
    ],
    ctaTexto: 'Começar como Empresário',
    ctaAcao: 'cadastro_empresario',
  },
  analista: {
    id: 'analista',
    perfil: 'contador',
    nome: 'Plano Analista',
    subtitulo: 'Ambiente de trabalho completo para consultores e analistas contábeis',
    precoMensalTexto: 'R$ 347',
    valorNumerico: 347,
    recorrencia: '/mês',
    destaque: true,
    tag: 'Recomendado para Analistas',
    descricao:
      'Plataforma integral com Carteira consolidada, gestão de até centenas de clientes, envio de convites com acesso restrito e ferramentas analíticas completas.',
    recursos: [
      {
        texto: 'Carteira de Clientes Consolidada com KPIs e gráficos',
        liberado: true,
        destaque: true,
      },
      {
        texto: 'Módulo de Gestão de Clientes (~100 empresas) com fichas completas',
        liberado: true,
        destaque: true,
      },
      {
        texto: 'Envio ilimitado de convites por e-mail para empresários da carteira',
        liberado: true,
        destaque: true,
      },
      {
        texto: 'Seletor de Cliente Ativo integrado na Calculadora e Diagnósticos',
        liberado: true,
        destaque: true,
      },
      { texto: 'Assistente de Análise com arquivamento de pareceres por cliente', liberado: true },
      {
        texto: 'Simulações ilimitadas da Calculadora IBS/CBS com múltiplos cenários',
        liberado: true,
      },
      { texto: 'Diagnósticos 360°, Transição Fiscal, Comparador e Enquadramento', liberado: true },
      { texto: 'Geração de relatórios e dossiês técnicos em PDF com assinatura', liberado: true },
    ],
    restricoes: [],
    ctaTexto: 'Começar como Analista',
    ctaAcao: 'cadastro_analista',
  },
}

export interface ConviteCliente {
  id: string
  analista_id: string
  cliente_id?: string
  cliente_nome?: string
  email: string
  mensagem?: string
  token: string
  status: 'pendente' | 'aceito' | 'expirado' | 'cancelado'
  convidado_user_id?: string
  enviado_em?: string
  aceito_em?: string
  created: string
  updated: string
}

export interface EnviarConviteInput {
  email: string
  cliente_id?: string
  cliente_nome?: string
  status?: 'pendente' | 'aceito' | 'expirado'
  nivel_convite?: 'admin' | 'analista' | 'empresario'
  analista_id?: string
  analista_nome?: string
  mensagem?: string
  whatsapp?: string
}
/**
 * Envia um convite de cliente via backend hook (utiliza o SMTP ativo do PocketBase)
 */
export async function enviarConviteCliente(input: EnviarConviteInput): Promise<{
  success: boolean
  id?: string
  token?: string
  link?: string
  error?: string
}> {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const res = await pb.send('/backend/v1/convites/enviar', {
      method: 'POST',
      body: {
        email: input.email.trim().toLowerCase(),
        cliente_id: input.cliente_id || '',
        cliente_nome: input.cliente_nome || '',
        mensagem: input.mensagem || '',
        base_url: origin,
      },
    })
    return res
  } catch (err: any) {
    console.error('Erro ao enviar convite:', err)
    return {
      success: false,
      error:
        err?.data?.message ||
        err?.message ||
        'Não foi possível enviar o convite. Verifique se o e-mail é válido e tente novamente.',
    }
  }
}

/**
 * Reenvia um convite de cliente existente
 */
export async function reenviarConviteCliente(conviteId: string): Promise<{
  success: boolean
  token?: string
  link?: string
  error?: string
}> {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const res = await pb.send('/backend/v1/convites/reenviar', {
      method: 'POST',
      body: {
        convite_id: conviteId,
        base_url: origin,
      },
    })
    return res
  } catch (err: any) {
    console.error('Erro ao reenviar convite:', err)
    return {
      success: false,
      error: err?.data?.message || err?.message || 'Falha ao reenviar convite.',
    }
  }
}

/**
 * Lista os convites emitidos pelo analista autenticado
 */
export async function listarConvitesAnalista(clienteId?: string): Promise<ConviteCliente[]> {
  try {
    const currentUserId = pb.authStore.record?.id
    if (!currentUserId) return []

    let filter = `analista_id = "${currentUserId}"`
    if (clienteId) {
      filter += ` && cliente_id = "${clienteId}"`
    }

    const records = await pb.collection('convites_clientes').getFullList<ConviteCliente>({
      filter,
      sort: '-created',
      requestKey: null,
    })
    return records
  } catch (err) {
    console.warn('Erro ao listar convites:', err)
    return []
  }
}

/**
 * Valida um token de convite na tela de cadastro
 */
export async function validarTokenConvite(token: string): Promise<{
  id: string
  email: string
  cliente_id?: string
  cliente_nome?: string
  status: string
  analista_id: string
  analista_nome: string
  nivel_convite?: 'admin' | 'analista' | 'empresario'
} | null> {
  try {
    const res = await pb.send(`/backend/v1/convites/validar/${encodeURIComponent(token)}`, {
      method: 'GET',
    })
    return res
  } catch (err) {
    console.warn('Token de convite inválido ou expirado:', err)
    return null
  }
}

/**
 * Aceita o convite após o cadastro do usuário
 */
export async function aceitarConviteCliente(token: string): Promise<boolean> {
  try {
    const res = await pb.send('/backend/v1/convites/aceitar', {
      method: 'POST',
      body: { token },
    })
    return !!res?.success
  } catch (err) {
    console.error('Erro ao aceitar convite:', err)
    return false
  }
}

/**
 * Migra o perfil do usuário logado de Empresário para Analista no MODO TESTE (sem cobrança)
 */
export async function migrarParaAnalistaModoTeste(): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  try {
    const res = await pb.send('/backend/v1/perfis/migrar-analista', {
      method: 'POST',
    })
    return {
      success: true,
      message: res?.message || 'Perfil migrado com sucesso para Analista.',
    }
  } catch (err: any) {
    console.error('Erro ao migrar perfil:', err)
    return {
      success: false,
      error: err?.data?.message || err?.message || 'Erro ao processar migração de perfil.',
    }
  }
}
