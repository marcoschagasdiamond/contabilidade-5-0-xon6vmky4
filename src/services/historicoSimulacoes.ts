import pb from '@/lib/pocketbase/client'
import type {
  HistoricoSimulacaoRegistro,
  ItemAlteracaoCampo,
  SnapshotSimulacaoResumo,
  TipoEventoHistorico,
  TipoSimulacaoHistorico,
} from '@/types/historicoSimulacoes'
import type {
  ParametrosSimulacaoCalculadora,
  ResultadosSimulacaoCalculadora,
  SimulacaoCalculadora,
} from '@/types/simulacaoCalculadora'
import type {
  ParametrosRecuperador,
  ResultadosRecuperador,
  SimulacaoRecuperador,
} from '@/types/recuperadorCreditos'
import type { CrmClienteRecord } from '@/types/crm'

const LOCAL_STORAGE_HISTORICO_KEY = 'contabilidade50_historico_simulacoes_v1'

// ==========================================
// HELPERS DE FORMATAÇÃO E DIFF
// ==========================================

function formatarValorGenerico(val: any): string {
  if (val === undefined || val === null || val === '') return 'Não informado'
  if (typeof val === 'number') {
    if (isNaN(val)) return '0'
    return val.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
  }
  if (typeof val === 'boolean') {
    return val ? 'Sim' : 'Não'
  }
  return String(val)
}

function formatarMoeda(val?: number): string {
  if (typeof val !== 'number' || isNaN(val)) return 'R$ 0,00'
  return val.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  })
}

/**
 * Compara parâmetros e resultados de duas versões da Calculadora IBS/CBS
 * e gera a lista detalhada de campos alterados (de -> para) com rótulos amigáveis.
 */
export function calcularDiffCalculadora(
  antigo: {
    nome?: string
    parametros?: Partial<ParametrosSimulacaoCalculadora>
    resultados?: Partial<ResultadosSimulacaoCalculadora>
  },
  novo: {
    nome?: string
    parametros?: Partial<ParametrosSimulacaoCalculadora>
    resultados?: Partial<ResultadosSimulacaoCalculadora>
  },
): ItemAlteracaoCampo[] {
  const diffs: ItemAlteracaoCampo[] = []

  // 1. Nome da simulação
  if (antigo.nome && novo.nome && antigo.nome !== novo.nome) {
    diffs.push({
      campo: 'nome',
      rotulo: 'Nome da Simulação',
      valorAnterior: antigo.nome,
      valorNovo: novo.nome,
      valorAnteriorFormatado: antigo.nome,
      valorNovoFormatado: novo.nome,
    })
  }

  const pAnt = antigo.parametros || {}
  const pNov = novo.parametros || {}

  // 2. Faturamento Mensal
  if (
    pAnt.faturamentoMensal !== undefined &&
    pNov.faturamentoMensal !== undefined &&
    pAnt.faturamentoMensal !== pNov.faturamentoMensal
  ) {
    diffs.push({
      campo: 'faturamentoMensal',
      rotulo: 'Faturamento Mensal',
      valorAnterior: pAnt.faturamentoMensal,
      valorNovo: pNov.faturamentoMensal,
      valorAnteriorFormatado: formatarMoeda(pAnt.faturamentoMensal),
      valorNovoFormatado: formatarMoeda(pNov.faturamentoMensal),
    })
  }

  // 3. Ramo / Tipo de Atividade
  if (pAnt.tipoAtividade && pNov.tipoAtividade && pAnt.tipoAtividade !== pNov.tipoAtividade) {
    diffs.push({
      campo: 'tipoAtividade',
      rotulo: 'Ramo / Tipo de Atividade',
      valorAnterior: pAnt.tipoAtividade,
      valorNovo: pNov.tipoAtividade,
      valorAnteriorFormatado: pAnt.tipoAtividade.toUpperCase(),
      valorNovoFormatado: pNov.tipoAtividade.toUpperCase(),
    })
  }

  // 4. Folha de Pagamento Mensal
  if (
    pAnt.folhaPagamentoMensal !== undefined &&
    pNov.folhaPagamentoMensal !== undefined &&
    pAnt.folhaPagamentoMensal !== pNov.folhaPagamentoMensal
  ) {
    diffs.push({
      campo: 'folhaPagamentoMensal',
      rotulo: 'Folha de Pagamento Mensal',
      valorAnterior: pAnt.folhaPagamentoMensal,
      valorNovo: pNov.folhaPagamentoMensal,
      valorAnteriorFormatado: formatarMoeda(pAnt.folhaPagamentoMensal),
      valorNovoFormatado: formatarMoeda(pNov.folhaPagamentoMensal),
    })
  }

  // 5. Compras / Despesas com Crédito Mensais
  if (
    pAnt.despesasComCreditosMensais !== undefined &&
    pNov.despesasComCreditosMensais !== undefined &&
    pAnt.despesasComCreditosMensais !== pNov.despesasComCreditosMensais
  ) {
    diffs.push({
      campo: 'despesasComCreditosMensais',
      rotulo: 'Compras e Insumos Geradores de Crédito',
      valorAnterior: pAnt.despesasComCreditosMensais,
      valorNovo: pNov.despesasComCreditosMensais,
      valorAnteriorFormatado: formatarMoeda(pAnt.despesasComCreditosMensais),
      valorNovoFormatado: formatarMoeda(pNov.despesasComCreditosMensais),
    })
  }

  // 6. Margem de Lucro Estimada
  if (
    pAnt.margemLucroEstimada !== undefined &&
    pNov.margemLucroEstimada !== undefined &&
    pAnt.margemLucroEstimada !== pNov.margemLucroEstimada
  ) {
    diffs.push({
      campo: 'margemLucroEstimada',
      rotulo: 'Margem de Lucro Estimada',
      valorAnterior: pAnt.margemLucroEstimada,
      valorNovo: pNov.margemLucroEstimada,
      valorAnteriorFormatado: `${pAnt.margemLucroEstimada}%`,
      valorNovoFormatado: `${pNov.margemLucroEstimada}%`,
    })
  }

  // 7. Alíquota Padrão IVA Dual / CBS / IBS
  const totalIvaAnt = pAnt.config?.totalIvaDual
  const totalIvaNov = pNov.config?.totalIvaDual
  if (totalIvaAnt !== undefined && totalIvaNov !== undefined && totalIvaAnt !== totalIvaNov) {
    diffs.push({
      campo: 'totalIvaDual',
      rotulo: 'Alíquota Padrão IVA Dual (IBS/CBS)',
      valorAnterior: totalIvaAnt,
      valorNovo: totalIvaNov,
      valorAnteriorFormatado: `${totalIvaAnt}%`,
      valorNovoFormatado: `${totalIvaNov}%`,
    })
  }

  // 8. Fase / Ano de Transição
  const anoAnt = pAnt.anoTransicao || pAnt.config?.anoTransicao
  const anoNov = pNov.anoTransicao || pNov.config?.anoTransicao
  if (anoAnt !== undefined && anoNov !== undefined && anoAnt !== anoNov) {
    diffs.push({
      campo: 'anoTransicao',
      rotulo: 'Ano / Fase da Transição',
      valorAnterior: anoAnt,
      valorNovo: anoNov,
      valorAnteriorFormatado: anoAnt === 'atual' ? 'Sistema Atual' : String(anoAnt),
      valorNovoFormatado: anoNov === 'atual' ? 'Sistema Atual' : String(anoNov),
    })
  }

  // 9. Regime Recomendado (Resultado)
  const regAnt = antigo.resultados?.resultadoDashboard?.regimeRecomendado
  const regNov = novo.resultados?.resultadoDashboard?.regimeRecomendado
  if (regAnt && regNov && regAnt !== regNov) {
    diffs.push({
      campo: 'regimeRecomendado',
      rotulo: 'Regime Tributário Recomendado',
      valorAnterior: regAnt,
      valorNovo: regNov,
      valorAnteriorFormatado: regAnt,
      valorNovoFormatado: regNov,
    })
  }

  // 10. Economia Anual Projetada
  const ecoAnt = antigo.resultados?.resultadoDashboard?.economiaAnualProjetada
  const ecoNov = novo.resultados?.resultadoDashboard?.economiaAnualProjetada
  if (ecoAnt !== undefined && ecoNov !== undefined && Math.abs(ecoAnt - ecoNov) > 1) {
    diffs.push({
      campo: 'economiaAnualProjetada',
      rotulo: 'Economia Anual Projetada',
      valorAnterior: ecoAnt,
      valorNovo: ecoNov,
      valorAnteriorFormatado: formatarMoeda(ecoAnt),
      valorNovoFormatado: formatarMoeda(ecoNov),
    })
  }

  // 11. Alíquota Efetiva Nova
  const aliqAnt = antigo.resultados?.resultadoDashboard?.aliquotaEfetivaNova
  const aliqNov = novo.resultados?.resultadoDashboard?.aliquotaEfetivaNova
  if (aliqAnt !== undefined && aliqNov !== undefined && Math.abs(aliqAnt - aliqNov) > 0.01) {
    diffs.push({
      campo: 'aliquotaEfetivaNova',
      rotulo: 'Alíquota Efetiva Nova (IBS/CBS)',
      valorAnterior: aliqAnt,
      valorNovo: aliqNov,
      valorAnteriorFormatado: `${aliqAnt.toFixed(2)}%`,
      valorNovoFormatado: `${aliqNov.toFixed(2)}%`,
    })
  }

  return diffs
}

/**
 * Compara parâmetros e resultados de duas versões do Recuperador de Créditos
 */
export function calcularDiffRecuperador(
  antigo: {
    nome?: string
    parametros?: Partial<ParametrosRecuperador>
    resultados?: Partial<ResultadosRecuperador>
  },
  novo: {
    nome?: string
    parametros?: Partial<ParametrosRecuperador>
    resultados?: Partial<ResultadosRecuperador>
  },
): ItemAlteracaoCampo[] {
  const diffs: ItemAlteracaoCampo[] = []

  if (antigo.nome && novo.nome && antigo.nome !== novo.nome) {
    diffs.push({
      campo: 'nome',
      rotulo: 'Nome da Análise',
      valorAnterior: antigo.nome,
      valorNovo: novo.nome,
      valorAnteriorFormatado: antigo.nome,
      valorNovoFormatado: novo.nome,
    })
  }

  const pAnt = (antigo.parametros?.configuracoes || {}) as Record<string, any>
  const pNov = (novo.parametros?.configuracoes || {}) as Record<string, any>

  if (pAnt.regimeAtual && pNov.regimeAtual && pAnt.regimeAtual !== pNov.regimeAtual) {
    diffs.push({
      campo: 'regimeAtual',
      rotulo: 'Regime Tributário Atual',
      valorAnterior: pAnt.regimeAtual,
      valorNovo: pNov.regimeAtual,
      valorAnteriorFormatado: String(pAnt.regimeAtual),
      valorNovoFormatado: String(pNov.regimeAtual),
    })
  }

  const fatAnt = pAnt.faturamentoMensal || pAnt.faturamentoMensalMedio
  const fatNov = pNov.faturamentoMensal || pNov.faturamentoMensalMedio
  if (fatAnt !== undefined && fatNov !== undefined && fatAnt !== fatNov) {
    diffs.push({
      campo: 'faturamentoMensal',
      rotulo: 'Faturamento Médio Mensal',
      valorAnterior: fatAnt,
      valorNovo: fatNov,
      valorAnteriorFormatado: formatarMoeda(fatAnt),
      valorNovoFormatado: formatarMoeda(fatNov),
    })
  }

  const totAnt = antigo.resultados?.totalIntegralCorrigido
  const totNov = novo.resultados?.totalIntegralCorrigido
  if (totAnt !== undefined && totNov !== undefined && Math.abs(totAnt - totNov) > 1) {
    diffs.push({
      campo: 'totalIntegralCorrigido',
      rotulo: 'Total de Créditos (Integral)',
      valorAnterior: totAnt,
      valorNovo: totNov,
      valorAnteriorFormatado: formatarMoeda(totAnt),
      valorNovoFormatado: formatarMoeda(totNov),
    })
  }

  const consAnt = antigo.resultados?.totalConservadorCorrigido
  const consNov = novo.resultados?.totalConservadorCorrigido
  if (consAnt !== undefined && consNov !== undefined && Math.abs(consAnt - consNov) > 1) {
    diffs.push({
      campo: 'totalConservadorCorrigido',
      rotulo: 'Total de Créditos (Conservador)',
      valorAnterior: consAnt,
      valorNovo: consNov,
      valorAnteriorFormatado: formatarMoeda(consAnt),
      valorNovoFormatado: formatarMoeda(consNov),
    })
  }

  return diffs
}

// ==========================================
// OPERAÇÕES LOCAL STORAGE (FALLBACK)
// ==========================================

export function carregarHistoricoLocal(): HistoricoSimulacaoRegistro[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_HISTORICO_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Erro ao ler histórico de simulações do localStorage:', err)
    return []
  }
}

export function salvarHistoricoLocal(itens: HistoricoSimulacaoRegistro[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_HISTORICO_KEY, JSON.stringify(itens.slice(0, 150)))
  } catch (err) {
    console.error('Erro ao salvar histórico de simulações no localStorage:', err)
  }
}

// ==========================================
// REGISTRO DE EVENTOS NO HISTÓRICO
// ==========================================

export async function registrarEventoHistoricoSimulacao(dados: {
  simulacaoId: string
  tipoSimulacao: TipoSimulacaoHistorico
  tipoEvento: TipoEventoHistorico
  descricao: string
  simulacaoNome?: string
  empresa?: string
  cnpj?: string
  clienteId?: string | null
  userId?: string | null
  alteracoes?: ItemAlteracaoCampo[]
  snapshotAnterior?: SnapshotSimulacaoResumo
  snapshotNovo?: SnapshotSimulacaoResumo
}): Promise<HistoricoSimulacaoRegistro> {
  const authUser = pb.authStore.record
  const effectiveUserId = dados.userId || authUser?.id || null
  const agoraIso = new Date().toISOString()

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
    simulacao_id: dados.simulacaoId,
    tipo_simulacao: dados.tipoSimulacao,
    tipo_evento: dados.tipoEvento,
    descricao: dados.descricao,
    simulacao_nome: dados.simulacaoNome || '',
    empresa: dados.empresa || '',
    cnpj: dados.cnpj || '',
    cliente_id: dados.clienteId || '',
    user_id: effectiveUserId,
    autor_nome: autorNome,
    autor_email: autorEmail,
    autor_nivel: autorNivel,
    alteracoes_json: dados.alteracoes || [],
    snapshot_anterior_json: dados.snapshotAnterior || {},
    snapshot_novo_json: dados.snapshotNovo || {},
  }

  // Tenta persistir no PocketBase
  if (effectiveUserId) {
    try {
      const rec = await pb.collection('historico_simulacoes').create<any>(payload)
      return {
        id: rec.id,
        simulacao_id: rec.simulacao_id,
        tipo_simulacao: rec.tipo_simulacao,
        tipo_evento: rec.tipo_evento,
        descricao: rec.descricao,
        simulacao_nome: rec.simulacao_nome,
        empresa: rec.empresa,
        cnpj: rec.cnpj,
        cliente_id: rec.cliente_id || null,
        user_id: rec.user_id || null,
        autor_nome: rec.autor_nome,
        autor_email: rec.autor_email,
        autor_nivel: rec.autor_nivel,
        alteracoes_json: rec.alteracoes_json || [],
        snapshot_anterior_json: rec.snapshot_anterior_json || undefined,
        snapshot_novo_json: rec.snapshot_novo_json || undefined,
        created: rec.created,
        updated: rec.updated,
        origem: 'nuvem',
      }
    } catch (err) {
      console.warn('Erro ao salvar histórico de simulação no PocketBase, usando local:', err)
    }
  }

  // Fallback local
  const itemLocal: HistoricoSimulacaoRegistro = {
    id: 'local_hist_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    simulacao_id: dados.simulacaoId,
    tipo_simulacao: dados.tipoSimulacao,
    tipo_evento: dados.tipoEvento,
    descricao: dados.descricao,
    simulacao_nome: dados.simulacaoNome,
    empresa: dados.empresa,
    cnpj: dados.cnpj,
    cliente_id: dados.clienteId,
    user_id: effectiveUserId,
    autor_nome: autorNome,
    autor_email: autorEmail,
    autor_nivel: autorNivel,
    alteracoes_json: dados.alteracoes || [],
    snapshot_anterior_json: dados.snapshotAnterior,
    snapshot_novo_json: dados.snapshotNovo,
    created: agoraIso,
    origem: 'local',
  }

  const lista = carregarHistoricoLocal()
  salvarHistoricoLocal([itemLocal, ...lista])
  return itemLocal
}

// ==========================================
// CONSULTA DE HISTÓRICO COM PERMISSÕES
// ==========================================

export function formatarDataHistorico(isoString?: string): string {
  if (!isoString) return '-'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return isoString
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

export async function listarHistoricoSimulacao(
  simulacaoId: string,
): Promise<HistoricoSimulacaoRegistro[]> {
  if (!simulacaoId) return []

  const authUser = pb.authStore.record
  const locais = carregarHistoricoLocal().filter((h) => h.simulacao_id === simulacaoId)

  if (!authUser) {
    return locais
  }

  try {
    const records = await pb.collection('historico_simulacoes').getFullList<any>({
      filter: `simulacao_id = "${simulacaoId}"`,
      sort: '-created',
    })

    const daNuvem: HistoricoSimulacaoRegistro[] = records.map((rec) => {
      let alteracoes: ItemAlteracaoCampo[] = []
      let snapAnt: SnapshotSimulacaoResumo | undefined
      let snapNov: SnapshotSimulacaoResumo | undefined

      try {
        alteracoes =
          typeof rec.alteracoes_json === 'string'
            ? JSON.parse(rec.alteracoes_json)
            : rec.alteracoes_json || []
      } catch {
        alteracoes = []
      }
      try {
        snapAnt =
          typeof rec.snapshot_anterior_json === 'string'
            ? JSON.parse(rec.snapshot_anterior_json)
            : rec.snapshot_anterior_json
      } catch {
        snapAnt = undefined
      }
      try {
        snapNov =
          typeof rec.snapshot_novo_json === 'string'
            ? JSON.parse(rec.snapshot_novo_json)
            : rec.snapshot_novo_json
      } catch {
        snapNov = undefined
      }

      return {
        id: rec.id,
        simulacao_id: rec.simulacao_id,
        tipo_simulacao: rec.tipo_simulacao,
        tipo_evento: rec.tipo_evento,
        descricao: rec.descricao,
        simulacao_nome: rec.simulacao_nome,
        empresa: rec.empresa,
        cnpj: rec.cnpj,
        cliente_id: rec.cliente_id || null,
        user_id: rec.user_id || null,
        autor_nome: rec.autor_nome,
        autor_email: rec.autor_email,
        autor_nivel: rec.autor_nivel,
        alteracoes_json: alteracoes,
        snapshot_anterior_json: snapAnt,
        snapshot_novo_json: snapNov,
        created: rec.created,
        updated: rec.updated,
        origem: 'nuvem',
      }
    })

    // Unifica locais e nuvem evitando duplicações
    const nuvemIds = new Set(daNuvem.map((d) => d.id))
    const locaisUnicos = locais.filter((l) => !nuvemIds.has(l.id))

    const todos = [...daNuvem, ...locaisUnicos]
    todos.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
    return todos
  } catch (err) {
    console.warn('Erro ao buscar histórico de simulação na nuvem, usando local:', err)
    return locais
  }
}
