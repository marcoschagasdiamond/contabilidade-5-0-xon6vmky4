import pb from '@/lib/pocketbase/client'
import type {
  EstadoReconstruidoSimulacao,
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
// RECONSTRUÇÃO DE ESTADO E COMPARAÇÃO TEMPORAL
// ==========================================

export const ROTULOS_PADRAO_CAMPOS: Record<string, string> = {
  nome: 'Nome da Simulação',
  empresa: 'Empresa',
  cnpj: 'CNPJ',
  regime: 'Regime Tributário Recomendado / Atual',
  faturamentoMensal: 'Faturamento Mensal',
  aliquotaEfetiva: 'Alíquota Efetiva Nova (IBS/CBS)',
  economiaAnual: 'Economia Anual Projetada',
  totalRecuperavelIntegral: 'Total de Créditos (Integral)',
  totalRecuperavelConservador: 'Total de Créditos (Conservador)',
  anoTransicao: 'Ano / Fase da Transição',
  tipoAtividade: 'Ramo / Tipo de Atividade',
  folhaPagamentoMensal: 'Folha de Pagamento Mensal',
  despesasComCreditosMensais: 'Compras e Insumos com Crédito',
  margemLucroEstimada: 'Margem de Lucro Estimada',
  totalIvaDual: 'Alíquota Padrão IVA Dual (IBS/CBS)',
  regimeRecomendado: 'Regime Tributário Recomendado',
  regimeAtual: 'Regime Tributário Atual',
  economiaAnualProjetada: 'Economia Anual Projetada',
  aliquotaEfetivaNova: 'Alíquota Efetiva Nova',
  totalIntegralCorrigido: 'Total de Créditos (Integral)',
  totalConservadorCorrigido: 'Total de Créditos (Conservador)',
}

export function formatarValorCampoPorChave(chave: string, valor: any): string {
  if (valor === undefined || valor === null || valor === '') return 'Não informado'
  if (
    chave === 'faturamentoMensal' ||
    chave === 'economiaAnual' ||
    chave === 'economiaAnualProjetada' ||
    chave === 'totalRecuperavelIntegral' ||
    chave === 'totalRecuperavelConservador' ||
    chave === 'totalIntegralCorrigido' ||
    chave === 'totalConservadorCorrigido' ||
    chave === 'folhaPagamentoMensal' ||
    chave === 'despesasComCreditosMensais'
  ) {
    if (typeof valor === 'number') return formatarMoeda(valor)
  }
  if (
    chave === 'aliquotaEfetiva' ||
    chave === 'aliquotaEfetivaNova' ||
    chave === 'totalIvaDual' ||
    chave === 'margemLucroEstimada'
  ) {
    if (typeof valor === 'number')
      return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`
  }
  if (chave === 'anoTransicao') {
    if (valor === 'atual') return 'Sistema Atual'
  }
  return formatarValorGenerico(valor)
}

/**
 * Recompõe o estado da simulação no momento de um evento específico.
 * Se houver snapshot registrado naquele evento, utiliza-o como base;
 * caso campos tenham sido alterados em eventos posteriores, aplica retroativamente
 * as alterações anteriores para reconstruir com precisão o estado histórico.
 */
export function reconstruirEstadoSimulacaoNoEvento(
  eventos: HistoricoSimulacaoRegistro[],
  eventoAlvoId: string,
  estadoAtualResumo?: Partial<SnapshotSimulacaoResumo>,
): EstadoReconstruidoSimulacao {
  // Ordena cronologicamente (do mais antigo para o mais novo)
  const cronologicos = [...eventos].sort(
    (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime(),
  )

  const indiceAlvo = cronologicos.findIndex((e) => e.id === eventoAlvoId)
  if (indiceAlvo === -1) {
    // Retorna vazio ou estado atual se não encontrar
    const camposMap: Record<string, { rotulo: string; valor: any; valorFormatado: string }> = {}
    if (estadoAtualResumo) {
      for (const [k, v] of Object.entries(estadoAtualResumo)) {
        if (v !== undefined) {
          camposMap[k] = {
            rotulo: ROTULOS_PADRAO_CAMPOS[k] || k,
            valor: v,
            valorFormatado: formatarValorCampoPorChave(k, v),
          }
        }
      }
    }
    return { campos: camposMap }
  }

  const eventoAlvo = cronologicos[indiceAlvo]

  // Mapa cumulativo de campos até o evento alvo (do início até o alvo)
  const camposCumulativos: Record<string, { rotulo: string; valor: any; valorFormatado: string }> =
    {}

  // 1. Aplica eventos do início até o eventoAlvo inclusive
  for (let i = 0; i <= indiceAlvo; i++) {
    const ev = cronologicos[i]

    // Se o evento tem snapshot_novo_json, incorpora seus campos
    if (ev.snapshot_novo_json) {
      for (const [k, v] of Object.entries(ev.snapshot_novo_json)) {
        if (v !== undefined && v !== null && v !== '') {
          camposCumulativos[k] = {
            rotulo: ROTULOS_PADRAO_CAMPOS[k] || k,
            valor: v,
            valorFormatado: formatarValorCampoPorChave(k, v),
          }
        }
      }
    }

    // Se o evento tem alteracoes_json, aplica o valorNovo de cada campo
    if (ev.alteracoes_json && Array.isArray(ev.alteracoes_json)) {
      for (const alt of ev.alteracoes_json) {
        camposCumulativos[alt.campo] = {
          rotulo: alt.rotulo || ROTULOS_PADRAO_CAMPOS[alt.campo] || alt.campo,
          valor: alt.valorNovo,
          valorFormatado:
            alt.valorNovoFormatado || formatarValorCampoPorChave(alt.campo, alt.valorNovo),
        }
      }
    }

    // Se foi evento de renomeação ou criação com nome
    if (ev.simulacao_nome) {
      camposCumulativos.nome = {
        rotulo: 'Nome da Simulação',
        valor: ev.simulacao_nome,
        valorFormatado: ev.simulacao_nome,
      }
    }
    if (ev.empresa) {
      camposCumulativos.empresa = {
        rotulo: 'Empresa',
        valor: ev.empresa,
        valorFormatado: ev.empresa,
      }
    }
    if (ev.cnpj) {
      camposCumulativos.cnpj = {
        rotulo: 'CNPJ',
        valor: ev.cnpj,
        valorFormatado: ev.cnpj,
      }
    }
  }

  // 2. Se ainda faltam campos que existem no estado atual e não foram modificados após o evento alvo,
  // ou se precisamos retroagir a partir do estado atual aplicando inversamente os diffs de (indiceAlvo + 1) até o fim:
  if (estadoAtualResumo) {
    const estadoInvertido: Record<string, any> = { ...estadoAtualResumo }

    // Aplica retroativamente de trás para frente (do evento mais recente até o próximo após o alvo)
    for (let j = cronologicos.length - 1; j > indiceAlvo; j--) {
      const ev = cronologicos[j]
      if (ev.alteracoes_json && Array.isArray(ev.alteracoes_json)) {
        for (const alt of ev.alteracoes_json) {
          if (alt.valorAnterior !== undefined) {
            estadoInvertido[alt.campo] = alt.valorAnterior
          }
        }
      }
    }

    // Mescla campos reconstruídos retroativamente caso não estejam definidos
    for (const [k, v] of Object.entries(estadoInvertido)) {
      if (v !== undefined && v !== null && v !== '' && !camposCumulativos[k]) {
        camposCumulativos[k] = {
          rotulo: ROTULOS_PADRAO_CAMPOS[k] || k,
          valor: v,
          valorFormatado: formatarValorCampoPorChave(k, v),
        }
      }
    }
  }

  return {
    eventoId: eventoAlvo.id,
    dataEvento: eventoAlvo.created,
    tipoEvento: eventoAlvo.tipo_evento,
    descricao: eventoAlvo.descricao,
    autorNome: eventoAlvo.autor_nome,
    campos: camposCumulativos,
  }
}

/**
 * Converte um estado atual da simulação (Calculadora ou Recuperador) em formato de campos
 */
export function extrairEstadoAtualParaComparacao(dados: {
  nome?: string
  empresa?: string
  cnpj?: string
  tipoSimulacao?: TipoSimulacaoHistorico
  dadosCalculadora?: {
    parametros?: any
    resultados?: any
  }
  dadosRecuperador?: {
    parametros?: any
    resultados?: any
  }
  snapshotAtual?: Partial<SnapshotSimulacaoResumo>
}): EstadoReconstruidoSimulacao {
  const campos: Record<string, { rotulo: string; valor: any; valorFormatado: string }> = {}

  if (dados.nome) {
    campos.nome = { rotulo: 'Nome da Simulação', valor: dados.nome, valorFormatado: dados.nome }
  }
  if (dados.empresa) {
    campos.empresa = { rotulo: 'Empresa', valor: dados.empresa, valorFormatado: dados.empresa }
  }
  if (dados.cnpj) {
    campos.cnpj = { rotulo: 'CNPJ', valor: dados.cnpj, valorFormatado: dados.cnpj }
  }

  // Dados Calculadora
  if (dados.dadosCalculadora?.parametros) {
    const p = dados.dadosCalculadora.parametros
    if (p.faturamentoMensal !== undefined) {
      campos.faturamentoMensal = {
        rotulo: 'Faturamento Mensal',
        valor: p.faturamentoMensal,
        valorFormatado: formatarMoeda(p.faturamentoMensal),
      }
    }
    if (p.tipoAtividade) {
      campos.tipoAtividade = {
        rotulo: 'Ramo / Tipo de Atividade',
        valor: p.tipoAtividade,
        valorFormatado: p.tipoAtividade.toUpperCase(),
      }
    }
    if (p.folhaPagamentoMensal !== undefined) {
      campos.folhaPagamentoMensal = {
        rotulo: 'Folha de Pagamento Mensal',
        valor: p.folhaPagamentoMensal,
        valorFormatado: formatarMoeda(p.folhaPagamentoMensal),
      }
    }
    if (p.despesasComCreditosMensais !== undefined) {
      campos.despesasComCreditosMensais = {
        rotulo: 'Compras e Insumos com Crédito',
        valor: p.despesasComCreditosMensais,
        valorFormatado: formatarMoeda(p.despesasComCreditosMensais),
      }
    }
    if (p.margemLucroEstimada !== undefined) {
      campos.margemLucroEstimada = {
        rotulo: 'Margem de Lucro Estimada',
        valor: p.margemLucroEstimada,
        valorFormatado: `${p.margemLucroEstimada}%`,
      }
    }
    const totalIva = p.config?.totalIvaDual
    if (totalIva !== undefined) {
      campos.totalIvaDual = {
        rotulo: 'Alíquota Padrão IVA Dual (IBS/CBS)',
        valor: totalIva,
        valorFormatado: `${totalIva}%`,
      }
    }
    const ano = p.anoTransicao || p.config?.anoTransicao
    if (ano !== undefined) {
      campos.anoTransicao = {
        rotulo: 'Ano / Fase da Transição',
        valor: ano,
        valorFormatado: ano === 'atual' ? 'Sistema Atual' : String(ano),
      }
    }
  }

  if (dados.dadosCalculadora?.resultados?.resultadoDashboard) {
    const r = dados.dadosCalculadora.resultados.resultadoDashboard
    if (r.regimeRecomendado) {
      campos.regimeRecomendado = {
        rotulo: 'Regime Tributário Recomendado',
        valor: r.regimeRecomendado,
        valorFormatado: r.regimeRecomendado,
      }
    }
    if (r.economiaAnualProjetada !== undefined) {
      campos.economiaAnual = {
        rotulo: 'Economia Anual Projetada',
        valor: r.economiaAnualProjetada,
        valorFormatado: formatarMoeda(r.economiaAnualProjetada),
      }
    }
    if (r.aliquotaEfetivaNova !== undefined) {
      campos.aliquotaEfetiva = {
        rotulo: 'Alíquota Efetiva Nova (IBS/CBS)',
        valor: r.aliquotaEfetivaNova,
        valorFormatado: `${r.aliquotaEfetivaNova.toFixed(2)}%`,
      }
    }
  }

  // Dados Recuperador
  if (dados.dadosRecuperador?.parametros?.configuracoes) {
    const c = dados.dadosRecuperador.parametros.configuracoes
    if (c.regimeAtual) {
      campos.regimeAtual = {
        rotulo: 'Regime Tributário Atual',
        valor: c.regimeAtual,
        valorFormatado: String(c.regimeAtual),
      }
    }
    const fat = c.faturamentoMensal || c.faturamentoMensalMedio
    if (fat !== undefined) {
      campos.faturamentoMensal = {
        rotulo: 'Faturamento Médio Mensal',
        valor: fat,
        valorFormatado: formatarMoeda(fat),
      }
    }
  }

  if (dados.dadosRecuperador?.resultados) {
    const res = dados.dadosRecuperador.resultados
    if (res.totalIntegralCorrigido !== undefined) {
      campos.totalRecuperavelIntegral = {
        rotulo: 'Total de Créditos (Integral)',
        valor: res.totalIntegralCorrigido,
        valorFormatado: formatarMoeda(res.totalIntegralCorrigido),
      }
    }
    if (res.totalConservadorCorrigido !== undefined) {
      campos.totalRecuperavelConservador = {
        rotulo: 'Total de Créditos (Conservador)',
        valor: res.totalConservadorCorrigido,
        valorFormatado: formatarMoeda(res.totalConservadorCorrigido),
      }
    }
  }

  // Complementa com snapshotAtual se fornecido
  if (dados.snapshotAtual) {
    for (const [k, v] of Object.entries(dados.snapshotAtual)) {
      if (v !== undefined && v !== null && v !== '' && !campos[k]) {
        campos[k] = {
          rotulo: ROTULOS_PADRAO_CAMPOS[k] || k,
          valor: v,
          valorFormatado: formatarValorCampoPorChave(k, v),
        }
      }
    }
  }

  return {
    descricao: 'Estado Atual da Simulação',
    campos,
  }
}

/**
 * Compara dois estados da mesma simulação (ex: evento anterior vs atual, ou evento A vs evento B)
 * e gera os diffs com indicação de quais campos sofreram alteração.
 */
export function compararDoisEstadosSimulacao(
  estadoA: EstadoReconstruidoSimulacao,
  estadoB: EstadoReconstruidoSimulacao,
): {
  diffs: ItemAlteracaoCampo[]
  camposIguais: Array<{ campo: string; rotulo: string; valorFormatado: string }>
  camposTotais: Array<{
    campo: string
    rotulo: string
    valorAFormatado: string
    valorBFormatado: string
    mudou: boolean
  }>
} {
  const todasChaves = Array.from(
    new Set([...Object.keys(estadoA.campos || {}), ...Object.keys(estadoB.campos || {})]),
  )

  const diffs: ItemAlteracaoCampo[] = []
  const camposIguais: Array<{ campo: string; rotulo: string; valorFormatado: string }> = []
  const camposTotais: Array<{
    campo: string
    rotulo: string
    valorAFormatado: string
    valorBFormatado: string
    mudou: boolean
  }> = []

  for (const chave of todasChaves) {
    const itemA = estadoA.campos[chave]
    const itemB = estadoB.campos[chave]

    const rotulo = itemA?.rotulo || itemB?.rotulo || ROTULOS_PADRAO_CAMPOS[chave] || chave
    const valA = itemA?.valor
    const valB = itemB?.valor
    const formatA =
      itemA?.valorFormatado ||
      (valA !== undefined ? formatarValorCampoPorChave(chave, valA) : 'Não definido')
    const formatB =
      itemB?.valorFormatado ||
      (valB !== undefined ? formatarValorCampoPorChave(chave, valB) : 'Não definido')

    // Normalização para comparar valores
    let mudou = false
    if (valA === undefined && valB !== undefined) {
      mudou = true
    } else if (valA !== undefined && valB === undefined) {
      mudou = true
    } else if (typeof valA === 'number' && typeof valB === 'number') {
      mudou = Math.abs(valA - valB) > 0.0001
    } else {
      mudou = String(valA ?? '').trim() !== String(valB ?? '').trim()
    }

    camposTotais.push({
      campo: chave,
      rotulo,
      valorAFormatado: formatA,
      valorBFormatado: formatB,
      mudou,
    })

    if (mudou) {
      diffs.push({
        campo: chave,
        rotulo,
        valorAnterior: valA,
        valorNovo: valB,
        valorAnteriorFormatado: formatA,
        valorNovoFormatado: formatB,
      })
    } else {
      camposIguais.push({
        campo: chave,
        rotulo,
        valorFormatado: formatA,
      })
    }
  }

  // Ordena os campos totais colocando os alterados no topo
  camposTotais.sort((a, b) => {
    if (a.mudou && !b.mudou) return -1
    if (!a.mudou && b.mudou) return 1
    return a.rotulo.localeCompare(b.rotulo)
  })

  return {
    diffs,
    camposIguais,
    camposTotais,
  }
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
