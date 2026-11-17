import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'
import type { DadosRelatorioConsolidado } from '@/lib/pdfRelatoriosDiagnosticos'
import type { DadosEmpresaPerfil } from '@/types/dadosEmpresa'
import type { DiagnosticoRecord } from '@/services/diagnosticos'

export interface ResumoSnapshotVersao {
  empresaNome?: string
  clienteNome?: string
  regimeRecomendado?: string
  economiaAnual?: number
  farolAutoavaliacao?: string
  totalCriticos?: number
  totalAlertas?: number
  totalControlados?: number
  farolTransicao?: string
  etapasConcluidas: number
  totalEtapas: number
  frentesCores?: Record<number, 'vermelho' | 'amarelo' | 'verde'>
}

export interface HistoricoRelatorioItem {
  id?: string
  cliente_id?: string
  cliente_nome?: string
  empresa_nome?: string
  gerado_por?: string
  user_id?: string
  versao_rotulo?: string
  motivo_evento?: string
  dados_json: DadosRelatorioConsolidado
  resumo_json?: ResumoSnapshotVersao
  created?: string
  updated?: string
}

export type HistoricoRelatorioRecord = HistoricoRelatorioItem & RecordModel

const STORAGE_KEY_FALLBACK = 'contabilidade50_historico_relatorios_local'

function carregarHistoricoLocal(): HistoricoRelatorioRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FALLBACK)
    if (!raw) return []
    return JSON.parse(raw) as HistoricoRelatorioRecord[]
  } catch (err) {
    console.warn('Falha ao ler histórico local:', err)
    return []
  }
}

function salvarHistoricoLocal(itens: HistoricoRelatorioRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_FALLBACK, JSON.stringify(itens.slice(0, 50)))
  } catch (err) {
    console.warn('Falha ao salvar histórico local:', err)
  }
}

export function derivarResumoSnapshot(dados: DadosRelatorioConsolidado): ResumoSnapshotVersao {
  let etapasConcluidas = 0
  if (dados.dadosEmpresa) etapasConcluidas++
  if (dados.diagnosticoAutoavaliacao) etapasConcluidas++
  if (dados.diagnosticoTransicao) etapasConcluidas++
  if (dados.diagnosticoRegimes) etapasConcluidas++
  if (dados.diagnosticoEnquadramento) etapasConcluidas++

  const autoExtra = (dados.diagnosticoAutoavaliacao?.dados_extra_json as any) || {}
  const scoresPorFrente = autoExtra.scoresPorFrente || {}
  const frentesCores: Record<number, 'vermelho' | 'amarelo' | 'verde'> = {}

  for (let f = 1; f <= 7; f++) {
    const item = scoresPorFrente[f]
    if (item && typeof item.scoreMedio === 'number') {
      if (item.scoreMedio >= 2.5) frentesCores[f] = 'vermelho'
      else if (item.scoreMedio >= 1.75) frentesCores[f] = 'amarelo'
      else frentesCores[f] = 'verde'
    }
  }

  const enq = dados.diagnosticoEnquadramento || dados.diagnosticoRegimes
  const regimeRecomendado =
    enq?.sistema_recomendado_novo || enq?.regime_recomendado || 'Não determinado'
  const economiaAnual =
    enq?.economia_anual_novo !== undefined
      ? enq.economia_anual_novo
      : enq?.economia_anual !== undefined
        ? enq.economia_anual
        : 0

  const transicaoExtra = (dados.diagnosticoTransicao?.dados_extra_json as any) || {}

  return {
    empresaNome:
      dados.dadosEmpresa?.nomeEmpresa ||
      dados.diagnosticoEnquadramento?.empresa ||
      dados.clienteNome ||
      'Empresa',
    clienteNome: dados.clienteNome,
    regimeRecomendado,
    economiaAnual,
    farolAutoavaliacao: autoExtra.resumo?.perfil || '',
    totalCriticos: autoExtra.resumo?.totalCriticos ?? 0,
    totalAlertas: autoExtra.resumo?.totalAlertas ?? 0,
    totalControlados: autoExtra.resumo?.totalControlados ?? 0,
    farolTransicao: transicaoExtra.laudo?.farol || '',
    etapasConcluidas,
    totalEtapas: 5,
    frentesCores,
  }
}

/** Resumo em 1 linha para o CRM a partir do resumo do snapshot do relatório */
export function resumoCrmSnapshotConsolidado(resumo?: ResumoSnapshotVersao): string {
  if (!resumo) return 'Snapshot registrado'
  const partes: string[] = []
  if (resumo.regimeRecomendado && resumo.regimeRecomendado !== 'Não determinado')
    partes.push(`regime ${resumo.regimeRecomendado}`)
  if (resumo.farolAutoavaliacao) partes.push(`perfil ${resumo.farolAutoavaliacao}`)
  if (typeof resumo.economiaAnual === 'number' && resumo.economiaAnual > 0)
    partes.push(
      `economia R$ ${resumo.economiaAnual.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/ano`,
    )
  const criticos = resumo.totalCriticos ?? 0
  if (criticos > 0) partes.push(`${criticos} ponto(s) crítico(s)`)
  const etapas = `${resumo.etapasConcluidas}/${resumo.totalEtapas} etapas`
  return [etapas, ...partes].join(' · ')
}

export async function registrarSnapshotSeClienteAtivo(
  clienteId?: string | null,
  clienteNome?: string | null,
  dadosEmpresa?: DadosEmpresaPerfil | null,
  motivoEvento?: string,
): Promise<HistoricoRelatorioRecord | null> {
  if (!clienteId) return null
  try {
    const todos = await pb.collection('diagnosticos').getFullList<DiagnosticoRecord>({
      filter: `cliente_id = "${clienteId}"`,
      sort: '-created',
    })

    const diagAutoavaliacao =
      todos.find((d) => d.tipo_diagnostico === '360' || d.tipo_diagnostico === 'autoavaliacao') ||
      null
    const diagTransicao = todos.find((d) => d.tipo_diagnostico === 'transicao') || null
    const diagRegimes = todos.find((d) => d.tipo_diagnostico === 'regimes') || null
    const diagEnquadramento =
      todos.find((d) => d.tipo_diagnostico === 'enquadramento' || !d.tipo_diagnostico) || null

    const dadosConsolidados: DadosRelatorioConsolidado = {
      clienteNome: clienteNome || undefined,
      dadosEmpresa: dadosEmpresa || null,
      diagnosticoAutoavaliacao: diagAutoavaliacao,
      diagnosticoTransicao: diagTransicao,
      diagnosticoRegimes: diagRegimes,
      diagnosticoEnquadramento: diagEnquadramento,
      dataEmissao: new Date().toLocaleDateString('pt-BR'),
    }

    const authUser = pb.authStore.record
    const nomeAutor = authUser?.name || authUser?.email || 'Analista Diamond'

    return await registrarVersaoRelatorio({
      cliente_id: clienteId,
      cliente_nome: clienteNome || undefined,
      empresa_nome: dadosEmpresa?.nomeEmpresa || diagEnquadramento?.empresa,
      gerado_por: nomeAutor,
      user_id: authUser?.id,
      motivo_evento: motivoEvento || 'Etapa salva no fluxo guiado',
      dados_json: dadosConsolidados,
    })
  } catch (err) {
    console.warn('Falha silenciosa ao registrar snapshot automático do relatório:', err)
    return null
  }
}

export async function registrarVersaoRelatorio(input: {
  cliente_id?: string
  cliente_nome?: string
  empresa_nome?: string
  gerado_por?: string
  user_id?: string
  versao_rotulo?: string
  motivo_evento?: string
  dados_json: DadosRelatorioConsolidado
}): Promise<HistoricoRelatorioRecord> {
  const resumo_json = derivarResumoSnapshot(input.dados_json)
  const agoraIso = new Date().toISOString()

  const payload: Omit<HistoricoRelatorioItem, 'id' | 'created' | 'updated'> = {
    cliente_id: input.cliente_id || '',
    cliente_nome: input.cliente_nome || input.dados_json.clienteNome || '',
    empresa_nome:
      input.empresa_nome ||
      input.dados_json.dadosEmpresa?.nomeEmpresa ||
      input.dados_json.diagnosticoEnquadramento?.empresa ||
      'Empresa',
    gerado_por: input.gerado_por || 'Analista Diamond',
    user_id: input.user_id || pb.authStore.record?.id || undefined,
    versao_rotulo:
      input.versao_rotulo ||
      `Versão de ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    motivo_evento: input.motivo_evento || 'Snapshot do Relatório Consolidado',
    dados_json: input.dados_json,
    resumo_json,
  }

  try {
    const record = await pb
      .collection('historico_relatorios_diagnostico')
      .create<HistoricoRelatorioRecord>(payload)

    // Integração CRM: registra o evento no lead vinculado por CNPJ (nunca cria lead)
    import('@/services/diagnosticoCrm')
      .then(({ registrarDiagnosticoNoCrm }) =>
        registrarDiagnosticoNoCrm({
          cnpj: payload.dados_json?.dadosEmpresa?.cnpj,
          nomeEmpresa:
            payload.empresa_nome || payload.dados_json?.dadosEmpresa?.nomeEmpresa || undefined,
          nomeDiagnostico: `Relatório Consolidado (${payload.versao_rotulo || payload.motivo_evento || 'snapshot'})`,
          resumo: resumoCrmSnapshotConsolidado(resumo_json),
        }),
      )
      .catch((e) => console.warn('[CRM] Aviso ao registrar relatório consolidado no lead:', e))

    return record
  } catch (err) {
    console.warn('Falha ao persistir no PocketBase, salvando em fallback local:', err)
    const localRecord: HistoricoRelatorioRecord = {
      ...payload,
      id: 'local_' + Date.now(),
      created: agoraIso,
      updated: agoraIso,
      collectionId: 'historico_relatorios_diagnostico',
      collectionName: 'historico_relatorios_diagnostico',
    }
    const lista = carregarHistoricoLocal()
    salvarHistoricoLocal([localRecord, ...lista])
    return localRecord
  }
}

export async function listarHistoricoRelatoriosPorCliente(
  clienteId?: string,
): Promise<HistoricoRelatorioRecord[]> {
  const local = carregarHistoricoLocal()
  try {
    const filter = clienteId ? `cliente_id = "${clienteId}"` : undefined
    const registros = await pb
      .collection('historico_relatorios_diagnostico')
      .getFullList<HistoricoRelatorioRecord>({
        filter,
        sort: '-created',
      })

    // Combina caso haja registros locais não sincronizados
    if (registros.length === 0 && local.length > 0) {
      if (clienteId) {
        return local.filter((item) => item.cliente_id === clienteId)
      }
      return local
    }
    return registros
  } catch (err) {
    console.warn('Erro ao listar histórico de relatórios via backend, usando local:', err)
    if (clienteId) {
      return local.filter((item) => item.cliente_id === clienteId)
    }
    return local
  }
}

export async function excluirVersaoRelatorio(id: string): Promise<boolean> {
  if (id.startsWith('local_')) {
    const lista = carregarHistoricoLocal().filter((it) => it.id !== id)
    salvarHistoricoLocal(lista)
    return true
  }
  try {
    await pb.collection('historico_relatorios_diagnostico').delete(id)
    return true
  } catch (err) {
    console.error('Erro ao excluir versão do relatório:', err)
    return false
  }
}

/**
 * Exclui todas as versões salvas de relatório consolidado vinculadas a um cliente
 * (por cliente_id ou fallback por nome/empresa).
 */
export async function excluirHistoricoRelatoriosPorCliente(params: {
  clienteId?: string | null
  empresaNome?: string | null
  clienteNome?: string | null
}): Promise<number> {
  let totalExcluidos = 0

  // 1. Limpa versões do localStorage
  try {
    const local = carregarHistoricoLocal()
    const filtradosLocal = local.filter((item) => {
      if (params.clienteId && item.cliente_id === params.clienteId) return false
      if (
        params.empresaNome &&
        item.empresa_nome?.trim().toLowerCase() === params.empresaNome.trim().toLowerCase()
      ) {
        return false
      }
      return true
    })
    totalExcluidos += local.length - filtradosLocal.length
    salvarHistoricoLocal(filtradosLocal)
  } catch (err) {
    console.warn('Erro ao limpar versões locais do relatório:', err)
  }

  // 2. Busca e exclui da coleção historico_relatorios_diagnostico no PocketBase
  try {
    const filtros: string[] = []
    if (params.clienteId) {
      filtros.push(`cliente_id = "${params.clienteId}"`)
    }
    if (params.empresaNome) {
      filtros.push(`empresa_nome = "${params.empresaNome.replace(/"/g, '\\"')}"`)
    }
    if (params.clienteNome) {
      filtros.push(`cliente_nome = "${params.clienteNome.replace(/"/g, '\\"')}"`)
    }

    if (filtros.length > 0) {
      const filterExpr = filtros.join(' || ')
      const lista = await pb
        .collection('historico_relatorios_diagnostico')
        .getFullList<HistoricoRelatorioRecord>({
          filter: filterExpr,
        })

      for (const reg of lista) {
        try {
          await pb.collection('historico_relatorios_diagnostico').delete(reg.id)
          totalExcluidos++
        } catch (e) {
          console.warn(`Erro ao excluir versão de relatório ${reg.id}:`, e)
        }
      }
    }
  } catch (err) {
    console.warn('Erro ao excluir versões no backend:', err)
  }

  return totalExcluidos
}
