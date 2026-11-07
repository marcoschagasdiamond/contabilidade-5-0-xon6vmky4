import pb from '@/lib/pocketbase/client'
import type { ClienteGlobalItem } from '@/types/master'

export interface ItemDiffHistorico {
  campo: string
  rotulo?: string
  valorAnterior?: any
  valorNovo?: any
  valorAnteriorFormatado?: string
  valorNovoFormatado?: string
}

export interface EventoHistoricoCliente {
  id: string
  tipo: 'edicao_dados' | 'criacao_cliente' | 'simulacao' | 'relatorio' | 'crm' | 'outro'
  titulo: string
  descricao?: string
  autorNome: string
  autorEmail?: string
  autorNivel?: string
  dataHora: string
  origem: string
  alteracoes?: ItemDiffHistorico[]
}

const ROTULOS_CAMPOS_CLIENTE: Record<string, string> = {
  nome: 'Razão Social / Nome',
  nome_empresa: 'Razão Social / Nome da Empresa',
  nomeEmpresa: 'Razão Social / Nome da Empresa',
  nome_contato: 'Nome do Responsável / Contato',
  nomeContato: 'Nome do Responsável / Contato',
  cnpj_cpf: 'CNPJ / CPF',
  cnpj: 'CNPJ',
  uf: 'UF',
  uf_origem: 'UF de Origem',
  ufOrigem: 'UF de Origem',
  cidade: 'Cidade',
  segmento: 'Segmento Econômico',
  regime_atual: 'Regime Tributário Atual',
  regimeAtual: 'Regime Tributário Atual',
  email: 'E-mail',
  telefone: 'Telefone / WhatsApp',
  faturamento_mensal: 'Faturamento Mensal',
  faturamentoMensal: 'Faturamento Mensal',
  folha_pagamento_mensal: 'Folha de Pagamento Mensal',
  folhaPagamentoMensal: 'Folha de Pagamento Mensal',
  funcionarios: 'Número de Funcionários',
  emissao_nf: 'Perfil de Emissão de NF',
  emissaoNf: 'Perfil de Emissão de NF',
  tipo_atividade: 'Tipo de Atividade',
  tipoAtividade: 'Tipo de Atividade',
  arquivado: 'Status de Arquivamento',
  estagio_funil: 'Estágio do Funil (CRM)',
}

export function formatarValorGenerico(val: any): string {
  if (val === null || val === undefined || val === '') return 'Não informado'
  if (typeof val === 'boolean') return val ? 'Sim' : 'Não'
  if (typeof val === 'number') {
    if (val >= 1000) {
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }
    return val.toLocaleString('pt-BR')
  }
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val)
    } catch {
      return String(val)
    }
  }
  return String(val)
}

export function calcularDiffGenerico(
  anterior: Record<string, any>,
  novo: Record<string, any>,
  chavesParaIgnorar = [
    'updated',
    'created',
    'id',
    'collectionId',
    'collectionName',
    'user_id',
    'expand',
  ],
): ItemDiffHistorico[] {
  const diffs: ItemDiffHistorico[] = []
  const todasChaves = new Set([...Object.keys(anterior || {}), ...Object.keys(novo || {})])

  for (const chave of todasChaves) {
    if (chavesParaIgnorar.includes(chave)) continue

    const valAnt = anterior ? anterior[chave] : undefined
    const valNov = novo ? novo[chave] : undefined

    // Comparação simples normalizada
    const strAnt = valAnt === undefined || valAnt === null ? '' : JSON.stringify(valAnt)
    const strNov = valNov === undefined || valNov === null ? '' : JSON.stringify(valNov)

    if (strAnt !== strNov) {
      diffs.push({
        campo: chave,
        rotulo: ROTULOS_CAMPOS_CLIENTE[chave] || chave,
        valorAnterior: valAnt,
        valorNovo: valNov,
        valorAnteriorFormatado: formatarValorGenerico(valAnt),
        valorNovoFormatado: formatarValorGenerico(valNov),
      })
    }
  }

  return diffs
}

/**
 * Grava evento de auditoria no histórico da empresa/cliente (reaproveitando historico_dados_empresa)
 */
export async function registrarEventoAuditoriaCliente(params: {
  clienteId?: string
  empresaId?: string
  nomeEmpresa?: string
  cnpj?: string
  origemAjuste?: string
  descricao?: string
  alteracoes?: ItemDiffHistorico[]
  snapshotAnterior?: Record<string, any>
  snapshotNovo?: Record<string, any>
  userId?: string
}): Promise<void> {
  const authUser = pb.authStore.record
  const effectiveUserId = params.userId || authUser?.id || null

  const autorNome =
    (authUser as any)?.name ||
    authUser?.email?.split('@')[0] ||
    (effectiveUserId ? 'Usuário do Sistema' : 'Sessão Local')
  const autorEmail = authUser?.email || ''
  const autorNivel = ((authUser as any)?.nivel_acesso ||
    (authUser as any)?.role ||
    (authUser as any)?.perfil ||
    'empresario') as string

  const payload: Record<string, any> = {
    empresa_id: params.empresaId || '',
    cliente_id: params.clienteId || '',
    user_id: effectiveUserId,
    autor_nome: autorNome,
    autor_email: autorEmail,
    autor_nivel: autorNivel,
    origem_ajuste: params.origemAjuste || 'edicao_cliente',
    descricao:
      params.descricao ||
      `Edição de dados realizada por ${autorNome} (${params.alteracoes?.length || 0} campo(s) alterado(s))`,
    nome_empresa: params.nomeEmpresa || '',
    cnpj: params.cnpj || '',
    alteracoes_json: params.alteracoes || [],
    snapshot_anterior_json: params.snapshotAnterior || {},
    snapshot_novo_json: params.snapshotNovo || {},
  }

  if (effectiveUserId) {
    try {
      await pb.collection('historico_dados_empresa').create(payload)
    } catch (err) {
      console.warn('Não foi possível gravar no historico_dados_empresa:', err)
    }
  }
}

/**
 * Consulta unificada de histórico por cliente, agrupando:
 * 1. historico_dados_empresa (edições e snapshots cadastrais)
 * 2. historico_simulacoes (simulações de Calculadora e Recuperador)
 * 3. historico_relatorios_diagnostico (relatórios fiscais gerados)
 */
export async function listarHistoricoCompletoPorCliente(
  cliente:
    | ClienteGlobalItem
    | { id: string; cnpj_cpf?: string; cnpj?: string; nome?: string; empresa?: string },
): Promise<EventoHistoricoCliente[]> {
  const clienteId = cliente.id
  const cnpj = (cliente as any).cnpj_cpf || (cliente as any).cnpj || ''
  const cnpjLimpo = cnpj.replace(/\D/g, '')

  const eventos: EventoHistoricoCliente[] = []

  // 1. Busca em historico_dados_empresa
  try {
    const filtros: string[] = []
    if (clienteId) {
      filtros.push(`cliente_id = "${clienteId}"`)
      filtros.push(`empresa_id = "${clienteId}"`)
    }
    if (cnpj) {
      filtros.push(`cnpj = "${cnpj}"`)
    }
    if (cnpjLimpo && cnpjLimpo.length >= 11 && cnpjLimpo !== cnpj) {
      filtros.push(`cnpj ~ "${cnpjLimpo}"`)
    }

    const filterStr = filtros.length > 0 ? filtros.join(' || ') : undefined
    const recsDados = await pb.collection('historico_dados_empresa').getFullList<any>({
      filter: filterStr,
      sort: '-created',
      requestKey: null,
    })

    for (const r of recsDados) {
      const alts = Array.isArray(r.alteracoes_json) ? r.alteracoes_json : []
      const isCriacao =
        (r.descricao || '').toLowerCase().includes('criação') ||
        (r.origem_ajuste || '').includes('criacao')
      eventos.push({
        id: `demp_${r.id}`,
        tipo: isCriacao ? 'criacao_cliente' : 'edicao_dados',
        titulo: isCriacao ? 'Cadastro do Cliente Criado' : 'Alteração nos Dados da Empresa',
        descricao: r.descricao || 'Alteração cadastral registrada',
        autorNome: r.autor_nome || 'Usuário',
        autorEmail: r.autor_email,
        autorNivel: r.autor_nivel,
        dataHora: r.created,
        origem: r.origem_ajuste
          ? `Módulo Dados (${r.origem_ajuste.replace('botao_corrigir_dados_', '').replace('_', ' ')})`
          : 'Dados Cadastrais',
        alteracoes: alts,
      })
    }
  } catch (err) {
    console.warn('Erro ao buscar historico_dados_empresa:', err)
  }

  // 2. Busca em historico_simulacoes
  try {
    const filtrosSim: string[] = []
    if (clienteId) {
      filtrosSim.push(`cliente_id = "${clienteId}"`)
    }
    if (cnpj) {
      filtrosSim.push(`cnpj = "${cnpj}"`)
    }
    if (cnpjLimpo && cnpjLimpo.length >= 11 && cnpjLimpo !== cnpj) {
      filtrosSim.push(`cnpj ~ "${cnpjLimpo}"`)
    }

    const filterSimStr = filtrosSim.length > 0 ? filtrosSim.join(' || ') : undefined
    const recsSim = await pb.collection('historico_simulacoes').getFullList<any>({
      filter: filterSimStr,
      sort: '-created',
      requestKey: null,
    })

    for (const s of recsSim) {
      const tipoSimRotulo =
        s.tipo_simulacao === 'recuperador' ? 'Recuperador de Créditos' : 'Calculadora IBS/CBS'
      const eventoRotulo =
        s.tipo_evento === 'criacao'
          ? 'Simulação Criada'
          : s.tipo_evento === 'edicao_parametros'
            ? 'Simulação Editada'
            : s.tipo_evento === 'renomeacao'
              ? 'Simulação Renomeada'
              : s.tipo_evento === 'exclusao'
                ? 'Simulação Excluída'
                : 'Simulação'

      eventos.push({
        id: `sim_${s.id}`,
        tipo: 'simulacao',
        titulo: `${eventoRotulo} • ${s.simulacao_nome || tipoSimRotulo}`,
        descricao: s.descricao || `Evento registrado na ferramenta ${tipoSimRotulo}`,
        autorNome: s.autor_nome || 'Usuário',
        autorEmail: s.autor_email,
        autorNivel: s.autor_nivel,
        dataHora: s.created,
        origem: tipoSimRotulo,
        alteracoes: Array.isArray(s.alteracoes_json) ? s.alteracoes_json : undefined,
      })
    }
  } catch (err) {
    console.warn('Erro ao buscar historico_simulacoes:', err)
  }

  // 3. Busca em historico_relatorios_diagnostico
  try {
    const filtrosRel: string[] = []
    if (clienteId) {
      filtrosRel.push(`cliente_id = "${clienteId}"`)
    }

    const filterRelStr = filtrosRel.length > 0 ? filtrosRel.join(' || ') : undefined
    const recsRel = await pb.collection('historico_relatorios_diagnostico').getFullList<any>({
      filter: filterRelStr,
      sort: '-created',
      requestKey: null,
    })

    for (const rel of recsRel) {
      eventos.push({
        id: `rel_${rel.id}`,
        tipo: 'relatorio',
        titulo: `Relatório Consolidado Gerado • ${rel.versao_rotulo || 'Versão'}`,
        descricao: rel.motivo_evento || 'Snapshot do Relatório Diagnóstico Consolidado arquivado',
        autorNome: rel.gerado_por || 'Especialista',
        dataHora: rel.created,
        origem: 'Diagnóstico 360°',
      })
    }
  } catch (err) {
    console.warn('Erro ao buscar historico_relatorios_diagnostico:', err)
  }

  // Ordena timeline cronológica: mais recente primeiro
  eventos.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())

  return eventos
}
