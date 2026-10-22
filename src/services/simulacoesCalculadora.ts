import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'
import type {
  SimulacaoCalculadora,
  ParametrosSimulacaoCalculadora,
  ResultadosSimulacaoCalculadora,
} from '@/types/simulacaoCalculadora'

const LOCAL_STORAGE_SIMULACOES_KEY = 'contabilidade50_simulacoes_calculadora_v1'

interface PocketBaseSimulacaoRecord extends RecordModel {
  user_id?: string
  cliente_id?: string
  nome: string
  empresa?: string
  cnpj?: string
  parametros_json: any
  resultados_json: any
  regime_recomendado?: string
  economia_anual?: number
  aliquota_efetiva?: number
  faturamento_mensal?: number
  ano_base?: number
}

// ==========================================
// OPERAÇÕES LOCAL STORAGE (FALLBACK)
// ==========================================

export function carregarSimulacoesLocais(): SimulacaoCalculadora[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SIMULACOES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Erro ao ler simulações do localStorage:', err)
    return []
  }
}

export function salvarSimulacoesLocais(lista: SimulacaoCalculadora[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_SIMULACOES_KEY, JSON.stringify(lista))
  } catch (err) {
    console.error('Erro ao persistir simulações no localStorage:', err)
  }
}

export function salvarSimulacaoLocal(
  nome: string,
  parametros: ParametrosSimulacaoCalculadora,
  resultados: ResultadosSimulacaoCalculadora,
  empresa?: string,
  cnpj?: string,
  clienteId?: string | null,
): SimulacaoCalculadora {
  const lista = carregarSimulacoesLocais()
  const nova: SimulacaoCalculadora = {
    id: 'local_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    nome,
    cliente_id: clienteId || null,
    empresa: empresa || parametros.empresa || '',
    cnpj: cnpj || parametros.cnpj || '',
    parametros,
    resultados,
    regime_recomendado: resultados.resultadoDashboard.regimeRecomendado,
    economia_anual: resultados.resultadoDashboard.economiaAnualProjetada,
    aliquota_efetiva: resultados.resultadoDashboard.aliquotaEfetivaNova,
    faturamento_mensal: parametros.faturamentoMensal,
    ano_base: 2026,
    created: new Date().toISOString(),
    origem: 'local',
  }
  const atualizadas = [nova, ...lista]
  salvarSimulacoesLocais(atualizadas)
  return nova
}

export function excluirSimulacaoLocal(id: string): void {
  const lista = carregarSimulacoesLocais()
  const filtradas = lista.filter((item) => item.id !== id)
  salvarSimulacoesLocais(filtradas)
}

export function renomearSimulacaoLocal(id: string, novoNome: string): void {
  const lista = carregarSimulacoesLocais()
  const atualizadas = lista.map((item) =>
    item.id === id ? { ...item, nome: novoNome, updated: new Date().toISOString() } : item,
  )
  salvarSimulacoesLocais(atualizadas)
}

// ==========================================
// CONVERSÃO POCKETBASE <-> DOMÍNIO
// ==========================================

function recordToSimulacao(rec: PocketBaseSimulacaoRecord): SimulacaoCalculadora {
  let parametros: ParametrosSimulacaoCalculadora
  let resultados: ResultadosSimulacaoCalculadora

  try {
    parametros =
      typeof rec.parametros_json === 'string'
        ? JSON.parse(rec.parametros_json)
        : rec.parametros_json || {}
  } catch {
    parametros = {} as any
  }

  try {
    resultados =
      typeof rec.resultados_json === 'string'
        ? JSON.parse(rec.resultados_json)
        : rec.resultados_json || {}
  } catch {
    resultados = {} as any
  }

  return {
    id: rec.id,
    user_id: rec.user_id,
    cliente_id: rec.cliente_id || null,
    nome: rec.nome,
    empresa: rec.empresa || '',
    cnpj: rec.cnpj || '',
    parametros,
    resultados,
    regime_recomendado: rec.regime_recomendado,
    economia_anual: rec.economia_anual,
    aliquota_efetiva: rec.aliquota_efetiva,
    faturamento_mensal: rec.faturamento_mensal,
    ano_base: rec.ano_base,
    created: rec.created,
    updated: rec.updated,
    origem: 'nuvem',
  }
}

// ==========================================
// OPERAÇÕES UNIFICADAS (POCKETBASE COM FALLBACK)
// ==========================================

/**
 * Salva uma simulação. Se autenticado, grava na nuvem; senão, salva no localStorage.
 */
export async function salvarSimulacao(dados: {
  nome: string
  parametros: ParametrosSimulacaoCalculadora
  resultados: ResultadosSimulacaoCalculadora
  empresa?: string
  cnpj?: string
  userId?: string | null
  clienteId?: string | null
}): Promise<SimulacaoCalculadora> {
  const authUser = pb.authStore.record
  const effectiveUserId = dados.userId || authUser?.id

  if (effectiveUserId) {
    try {
      const payload: Record<string, any> = {
        user_id: effectiveUserId,
        cliente_id: dados.clienteId || '',
        nome: dados.nome.trim(),
        empresa: dados.empresa || dados.parametros.empresa || '',
        cnpj: dados.cnpj || dados.parametros.cnpj || '',
        parametros_json: dados.parametros,
        resultados_json: dados.resultados,
        regime_recomendado: dados.resultados.resultadoDashboard.regimeRecomendado,
        economia_anual: dados.resultados.resultadoDashboard.economiaAnualProjetada,
        aliquota_efetiva: dados.resultados.resultadoDashboard.aliquotaEfetivaNova,
        faturamento_mensal: dados.parametros.faturamentoMensal,
        ano_base: 2026,
      }

      const rec = await pb
        .collection('simulacoes_calculadora')
        .create<PocketBaseSimulacaoRecord>(payload)
      return recordToSimulacao(rec)
    } catch (err) {
      console.warn('Erro ao salvar no PocketBase, usando fallback local:', err)
      return salvarSimulacaoLocal(
        dados.nome,
        dados.parametros,
        dados.resultados,
        dados.empresa,
        dados.cnpj,
        dados.clienteId,
      )
    }
  }

  // Não autenticado: fallback local
  return salvarSimulacaoLocal(
    dados.nome,
    dados.parametros,
    dados.resultados,
    dados.empresa,
    dados.cnpj,
    dados.clienteId,
  )
}

/**
 * Carrega a lista de simulações do usuário autenticado (ou do localStorage se não logado)
 * Caso haja simulações locais mesmo logado, elas também são mescladas (com prioridade da nuvem).
 */
export async function listarSimulacoes(userId?: string | null): Promise<SimulacaoCalculadora[]> {
  const authUser = pb.authStore.record
  const effectiveUserId = userId || authUser?.id
  const locais = carregarSimulacoesLocais()

  if (!effectiveUserId) {
    return locais
  }

  try {
    const isAdmin =
      (authUser as any)?.role === 'admin' || authUser?.email === 'marcoschagasdiamond@icloud.com'

    const filter = isAdmin ? '' : `user_id = "${effectiveUserId}"`

    const cloudRecords = await pb
      .collection('simulacoes_calculadora')
      .getFullList<PocketBaseSimulacaoRecord>({
        filter: filter || undefined,
        sort: '-created',
      })

    const cloudSimulacoes = cloudRecords.map(recordToSimulacao)

    // Junta as simulações locais que não estejam na nuvem
    return [...cloudSimulacoes, ...locais]
  } catch (err) {
    console.warn('Erro ao buscar simulações na nuvem, retornando apenas locais:', err)
    return locais
  }
}

/**
 * Exclui uma simulação (na nuvem se for de lá, ou localmente)
 */
export async function excluirSimulacao(simulacao: SimulacaoCalculadora): Promise<boolean> {
  if (simulacao.origem === 'nuvem') {
    try {
      await pb.collection('simulacoes_calculadora').delete(simulacao.id)
      return true
    } catch (err) {
      console.error('Erro ao excluir simulação na nuvem:', err)
      return false
    }
  } else {
    excluirSimulacaoLocal(simulacao.id)
    return true
  }
}

/**
 * Renomeia uma simulação
 */
export async function renomearSimulacao(
  simulacao: SimulacaoCalculadora,
  novoNome: string,
): Promise<boolean> {
  const nomeTrim = novoNome.trim()
  if (!nomeTrim) return false

  if (simulacao.origem === 'nuvem') {
    try {
      await pb.collection('simulacoes_calculadora').update(simulacao.id, {
        nome: nomeTrim,
      })
      return true
    } catch (err) {
      console.error('Erro ao renomear simulação na nuvem:', err)
      return false
    }
  } else {
    renomearSimulacaoLocal(simulacao.id, nomeTrim)
    return true
  }
}

/**
 * Vincula uma simulação a um cliente
 */
export async function vincularSimulacaoACliente(
  simulacaoId: string,
  clienteId: string | null,
): Promise<boolean> {
  try {
    await pb.collection('simulacoes_calculadora').update(simulacaoId, {
      cliente_id: clienteId || '',
    })
    return true
  } catch (err) {
    console.error('Erro ao vincular simulação ao cliente:', err)
    // Tenta atualizar no local storage se for o caso
    const locais = carregarSimulacoesLocais()
    const atualizadas = locais.map((item) =>
      item.id === simulacaoId ? { ...item, cliente_id: clienteId || null } : item,
    )
    salvarSimulacoesLocais(atualizadas)
    return true
  }
}

/**
 * Lista simulações vinculadas a um cliente específico
 */
export async function listarSimulacoesPorCliente(
  clienteId: string,
): Promise<SimulacaoCalculadora[]> {
  if (!clienteId) return []
  const todas = await listarSimulacoes()
  return todas.filter((s) => s.cliente_id === clienteId)
}
