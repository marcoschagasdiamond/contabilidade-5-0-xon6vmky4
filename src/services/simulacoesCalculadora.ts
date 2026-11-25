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
  const { registrarEventoHistoricoSimulacao } = await import('@/services/historicoSimulacoes')
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

      const simulacaoCriada = recordToSimulacao(rec)

      // Registra evento de criação no histórico auditável
      try {
        await registrarEventoHistoricoSimulacao({
          simulacaoId: simulacaoCriada.id,
          tipoSimulacao: 'calculadora',
          tipoEvento: 'criacao',
          descricao: `Simulação "${simulacaoCriada.nome}" criada na Calculadora IBS/CBS`,
          simulacaoNome: simulacaoCriada.nome,
          empresa: simulacaoCriada.empresa,
          cnpj: simulacaoCriada.cnpj,
          clienteId: simulacaoCriada.cliente_id,
          userId: effectiveUserId,
          snapshotNovo: {
            nome: simulacaoCriada.nome,
            empresa: simulacaoCriada.empresa,
            cnpj: simulacaoCriada.cnpj,
            regime: simulacaoCriada.regime_recomendado,
            faturamentoMensal: simulacaoCriada.faturamento_mensal,
            aliquotaEfetiva: simulacaoCriada.aliquota_efetiva,
            economiaAnual: simulacaoCriada.economia_anual,
            tipoAtividade: simulacaoCriada.parametros?.tipoAtividade,
          },
        })
      } catch (histErr) {
        console.warn('Aviso ao registrar histórico de criação:', histErr)
      }

      // Atualiza progresso do onboarding (Passo 3: Calculadora IBS/CBS)
      try {
        const { salvarProgressoOnboarding } = await import('@/services/onboarding')
        await salvarProgressoOnboarding(effectiveUserId, { passo_calculadora_concluido: true })
      } catch (onbErr) {
        console.warn('[Onboarding] Aviso ao atualizar passo calculadora:', onbErr)
      }

      return simulacaoCriada
    } catch (err) {
      console.warn('Erro ao salvar no PocketBase, usando fallback local:', err)
      const local = salvarSimulacaoLocal(
        dados.nome,
        dados.parametros,
        dados.resultados,
        dados.empresa,
        dados.cnpj,
        dados.clienteId,
      )
      try {
        await registrarEventoHistoricoSimulacao({
          simulacaoId: local.id,
          tipoSimulacao: 'calculadora',
          tipoEvento: 'criacao',
          descricao: `Simulação local "${local.nome}" criada na Calculadora IBS/CBS`,
          simulacaoNome: local.nome,
          empresa: local.empresa,
          cnpj: local.cnpj,
          clienteId: local.cliente_id,
          userId: null,
          snapshotNovo: {
            nome: local.nome,
            empresa: local.empresa,
            cnpj: local.cnpj,
            regime: local.regime_recomendado,
            faturamentoMensal: local.faturamento_mensal,
            aliquotaEfetiva: local.aliquota_efetiva,
            economiaAnual: local.economia_anual,
            tipoAtividade: local.parametros?.tipoAtividade,
          },
        })
      } catch {
        /* intentionally ignored */
      }
      return local
    }
  }

  // Não autenticado: fallback local
  const local = salvarSimulacaoLocal(
    dados.nome,
    dados.parametros,
    dados.resultados,
    dados.empresa,
    dados.cnpj,
    dados.clienteId,
  )
  try {
    await registrarEventoHistoricoSimulacao({
      simulacaoId: local.id,
      tipoSimulacao: 'calculadora',
      tipoEvento: 'criacao',
      descricao: `Simulação local "${local.nome}" criada na Calculadora IBS/CBS`,
      simulacaoNome: local.nome,
      empresa: local.empresa,
      cnpj: local.cnpj,
      clienteId: local.cliente_id,
      userId: null,
      snapshotNovo: {
        nome: local.nome,
        empresa: local.empresa,
        cnpj: local.cnpj,
        regime: local.regime_recomendado,
        faturamentoMensal: local.faturamento_mensal,
        aliquotaEfetiva: local.aliquota_efetiva,
        economiaAnual: local.economia_anual,
        tipoAtividade: local.parametros?.tipoAtividade,
      },
    })
  } catch {
    /* intentionally ignored */
  }
  return local
}

/**
 * Carrega a lista de simulações do usuário autenticado (ou do localStorage se não logado)
 * Caso haja simulações locais mesmo logado, elas também são mescladas (com prioridade da nuvem).
 */
export async function obterSimulacaoPorId(id: string): Promise<SimulacaoCalculadora | null> {
  // 1. Tenta carregar do PocketBase
  try {
    const rec = await pb.collection('simulacoes_calculadora').getOne<any>(id)
    if (rec) {
      let parametros = {}
      let resultados = {}
      try {
        parametros =
          typeof rec.parametros_json === 'string'
            ? JSON.parse(rec.parametros_json)
            : rec.parametros_json || {}
      } catch {
        /* ignorado */
      }
      try {
        resultados =
          typeof rec.resultados_json === 'string'
            ? JSON.parse(rec.resultados_json)
            : rec.resultados_json || {}
      } catch {
        /* ignorado */
      }

      return {
        id: rec.id,
        user_id: rec.user_id,
        cliente_id: rec.cliente_id || null,
        nome: rec.nome,
        empresa: rec.empresa || '',
        cnpj: rec.cnpj || '',
        parametros: parametros as any,
        resultados: resultados as any,
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
  } catch {
    /* fallback local */
  }

  // 2. Fallback localStorage
  const locais = carregarSimulacoesLocais()
  const encontrada = locais.find((s) => s.id === id)
  return encontrada || null
}

export type EscopoListagemSimulacoes = 'proprio' | 'todos'

/**
 * Lista simulações da Calculadora.
 * - escopo 'proprio' (padrão): somente as simulações do próprio usuário logado
 *   (filtro user_id para TODOS os usuários, incluindo master/admin).
 * - escopo 'todos': todas as simulações da nuvem (usado por telas que montam
 *   visões de carteira/histórico de terceiros, ex. MeusRelatorios e a
 *   vinculação manual de simulações em /clientes/:id).
 * A listagem da própria Calculadora (/calculadora-ibs-cbs) usa o padrão:
 * cada usuário — inclusive o master — vê apenas as próprias simulações salvas.
 * A regra de supervisão da CARTEIRA (master vê todos os clientes) NÃO passa
 * por aqui e permanece intocada.
 */
export async function listarSimulacoes(
  userId?: string | null,
  escopo: EscopoListagemSimulacoes = 'proprio',
): Promise<SimulacaoCalculadora[]> {
  const authUser = pb.authStore.record
  const effectiveUserId = userId || authUser?.id
  const locais = carregarSimulacoesLocais()

  if (!effectiveUserId) {
    return locais
  }

  try {
    const filter = escopo === 'todos' ? '' : `user_id = "${effectiveUserId}"`

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
  const { registrarEventoHistoricoSimulacao } = await import('@/services/historicoSimulacoes')
  const authUser = pb.authStore.record

  // Registra no histórico que a simulação foi excluída (não bloqueia a exclusão se falhar)
  try {
    await registrarEventoHistoricoSimulacao({
      simulacaoId: simulacao.id,
      tipoSimulacao: 'calculadora',
      tipoEvento: 'exclusao',
      descricao: `Simulação "${simulacao.nome}" excluída`,
      simulacaoNome: simulacao.nome,
      empresa: simulacao.empresa,
      cnpj: simulacao.cnpj,
      clienteId: simulacao.cliente_id,
      userId: simulacao.user_id || authUser?.id || null,
      snapshotAnterior: {
        nome: simulacao.nome,
        empresa: simulacao.empresa,
        cnpj: simulacao.cnpj,
        regime: simulacao.regime_recomendado,
        faturamentoMensal: simulacao.faturamento_mensal,
        aliquotaEfetiva: simulacao.aliquota_efetiva,
        economiaAnual: simulacao.economia_anual,
      },
    })
  } catch (histErr) {
    console.warn('Aviso ao registrar histórico de exclusão:', histErr)
  }

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
 * Exclui todas as simulações da calculadora vinculadas a um cliente (por cliente_id).
 */
export async function excluirSimulacoesCalculadoraPorCliente(clienteId: string): Promise<number> {
  if (!clienteId) return 0
  let totalExcluidos = 0

  // 1. Limpa locais
  try {
    const locais = carregarSimulacoesLocais()
    const filtrados = locais.filter((s) => s.cliente_id !== clienteId)
    totalExcluidos += locais.length - filtrados.length
    salvarSimulacoesLocais(filtrados)
  } catch (err) {
    console.warn('Erro ao excluir simulações locais do cliente:', err)
  }

  // 2. Limpa nuvem
  try {
    const nuvem = await pb
      .collection('simulacoes_calculadora')
      .getFullList<PocketBaseSimulacaoRecord>({
        filter: `cliente_id = "${clienteId}"`,
      })
    for (const rec of nuvem) {
      try {
        await pb.collection('simulacoes_calculadora').delete(rec.id)
        totalExcluidos++
      } catch (e) {
        console.warn(`Erro ao excluir simulação ${rec.id}:`, e)
      }
    }
  } catch (err) {
    console.warn('Erro ao excluir simulações na nuvem do cliente:', err)
  }

  return totalExcluidos
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
  const nomeAnterior = simulacao.nome

  const { registrarEventoHistoricoSimulacao } = await import('@/services/historicoSimulacoes')
  const authUser = pb.authStore.record

  let sucesso = false
  if (simulacao.origem === 'nuvem') {
    try {
      await pb.collection('simulacoes_calculadora').update(simulacao.id, {
        nome: nomeTrim,
      })
      sucesso = true
    } catch (err) {
      console.error('Erro ao renomear simulação na nuvem:', err)
      return false
    }
  } else {
    renomearSimulacaoLocal(simulacao.id, nomeTrim)
    sucesso = true
  }

  if (sucesso && nomeAnterior !== nomeTrim) {
    try {
      await registrarEventoHistoricoSimulacao({
        simulacaoId: simulacao.id,
        tipoSimulacao: 'calculadora',
        tipoEvento: 'renomeacao',
        descricao: `Simulação renomeada de "${nomeAnterior}" para "${nomeTrim}"`,
        simulacaoNome: nomeTrim,
        empresa: simulacao.empresa,
        cnpj: simulacao.cnpj,
        clienteId: simulacao.cliente_id,
        userId: simulacao.user_id || authUser?.id || null,
        alteracoes: [
          {
            campo: 'nome',
            rotulo: 'Nome da Simulação',
            valorAnterior: nomeAnterior,
            valorNovo: nomeTrim,
            valorAnteriorFormatado: nomeAnterior,
            valorNovoFormatado: nomeTrim,
          },
        ],
        snapshotAnterior: {
          nome: nomeAnterior,
          empresa: simulacao.empresa,
          cnpj: simulacao.cnpj,
          regime: simulacao.regime_recomendado,
        },
        snapshotNovo: {
          nome: nomeTrim,
          empresa: simulacao.empresa,
          cnpj: simulacao.cnpj,
          regime: simulacao.regime_recomendado,
        },
      })
    } catch (histErr) {
      console.warn('Aviso ao registrar histórico de renomeação:', histErr)
    }
  }

  return sucesso
}

/**
 * Atualiza parâmetros e resultados de uma simulação existente da Calculadora
 * e registra no histórico o diff detalhado dos campos alterados.
 */
export async function atualizarParametrosSimulacao(
  simulacaoId: string,
  novosParametros: ParametrosSimulacaoCalculadora,
  novosResultados: ResultadosSimulacaoCalculadora,
  dadosExtras?: {
    nome?: string
    empresa?: string
    cnpj?: string
  },
): Promise<SimulacaoCalculadora | null> {
  const { calcularDiffCalculadora, registrarEventoHistoricoSimulacao } =
    await import('@/services/historicoSimulacoes')
  const authUser = pb.authStore.record

  // Obtém versão anterior para comparação de diff
  const versaoAnterior = await obterSimulacaoPorId(simulacaoId)
  if (!versaoAnterior) return null

  const nomeFinal = dadosExtras?.nome?.trim() || versaoAnterior.nome
  const empresaFinal = dadosExtras?.empresa?.trim() || versaoAnterior.empresa
  const cnpjFinal = dadosExtras?.cnpj?.trim() || versaoAnterior.cnpj

  // Calcula diff dos campos
  const alteracoes = calcularDiffCalculadora(
    {
      nome: versaoAnterior.nome,
      parametros: versaoAnterior.parametros,
      resultados: versaoAnterior.resultados,
    },
    {
      nome: nomeFinal,
      parametros: novosParametros,
      resultados: novosResultados,
    },
  )

  if (versaoAnterior.origem === 'nuvem') {
    try {
      const payload: Record<string, any> = {
        nome: nomeFinal,
        empresa: empresaFinal,
        cnpj: cnpjFinal,
        parametros_json: novosParametros,
        resultados_json: novosResultados,
        regime_recomendado: novosResultados.resultadoDashboard.regimeRecomendado,
        economia_anual: novosResultados.resultadoDashboard.economiaAnualProjetada,
        aliquota_efetiva: novosResultados.resultadoDashboard.aliquotaEfetivaNova,
        faturamento_mensal: novosParametros.faturamentoMensal,
      }

      const rec = await pb
        .collection('simulacoes_calculadora')
        .update<PocketBaseSimulacaoRecord>(simulacaoId, payload)
      const simulacaoAtualizada = recordToSimulacao(rec)

      if (alteracoes.length > 0) {
        try {
          await registrarEventoHistoricoSimulacao({
            simulacaoId,
            tipoSimulacao: 'calculadora',
            tipoEvento: 'edicao_parametros',
            descricao: `Parâmetros atualizados (${alteracoes.length} ${
              alteracoes.length === 1 ? 'campo alterado' : 'campos alterados'
            })`,
            simulacaoNome: nomeFinal,
            empresa: empresaFinal,
            cnpj: cnpjFinal,
            clienteId: versaoAnterior.cliente_id,
            userId: versaoAnterior.user_id || authUser?.id || null,
            alteracoes,
            snapshotAnterior: {
              nome: versaoAnterior.nome,
              empresa: versaoAnterior.empresa,
              cnpj: versaoAnterior.cnpj,
              regime: versaoAnterior.regime_recomendado,
              faturamentoMensal: versaoAnterior.faturamento_mensal,
              aliquotaEfetiva: versaoAnterior.aliquota_efetiva,
              economiaAnual: versaoAnterior.economia_anual,
              tipoAtividade: versaoAnterior.parametros?.tipoAtividade,
            },
            snapshotNovo: {
              nome: nomeFinal,
              empresa: empresaFinal,
              cnpj: cnpjFinal,
              regime: novosResultados.resultadoDashboard.regimeRecomendado,
              faturamentoMensal: novosParametros.faturamentoMensal,
              aliquotaEfetiva: novosResultados.resultadoDashboard.aliquotaEfetivaNova,
              economiaAnual: novosResultados.resultadoDashboard.economiaAnualProjetada,
              tipoAtividade: novosParametros.tipoAtividade,
            },
          })
        } catch (histErr) {
          console.warn('Aviso ao registrar histórico de alteração de parâmetros:', histErr)
        }
      }

      return simulacaoAtualizada
    } catch (err) {
      console.warn('Erro ao atualizar simulação na nuvem, atualizando local:', err)
    }
  }

  // Fallback local
  const locais = carregarSimulacoesLocais()
  let atualizadaLocal: SimulacaoCalculadora | null = null
  const novas = locais.map((item) => {
    if (item.id === simulacaoId) {
      atualizadaLocal = {
        ...item,
        nome: nomeFinal,
        empresa: empresaFinal,
        cnpj: cnpjFinal,
        parametros: novosParametros,
        resultados: novosResultados,
        regime_recomendado: novosResultados.resultadoDashboard.regimeRecomendado,
        economia_anual: novosResultados.resultadoDashboard.economiaAnualProjetada,
        aliquota_efetiva: novosResultados.resultadoDashboard.aliquotaEfetivaNova,
        faturamento_mensal: novosParametros.faturamentoMensal,
        updated: new Date().toISOString(),
      }
      return atualizadaLocal
    }
    return item
  })
  salvarSimulacoesLocais(novas)

  if (alteracoes.length > 0) {
    try {
      await registrarEventoHistoricoSimulacao({
        simulacaoId,
        tipoSimulacao: 'calculadora',
        tipoEvento: 'edicao_parametros',
        descricao: `Parâmetros locais atualizados (${alteracoes.length} ${
          alteracoes.length === 1 ? 'campo alterado' : 'campos alterados'
        })`,
        simulacaoNome: nomeFinal,
        empresa: empresaFinal,
        cnpj: cnpjFinal,
        clienteId: versaoAnterior.cliente_id,
        userId: null,
        alteracoes,
        snapshotAnterior: {
          nome: versaoAnterior.nome,
          empresa: versaoAnterior.empresa,
          cnpj: versaoAnterior.cnpj,
          regime: versaoAnterior.regime_recomendado,
          faturamentoMensal: versaoAnterior.faturamento_mensal,
          aliquotaEfetiva: versaoAnterior.aliquota_efetiva,
          economiaAnual: versaoAnterior.economia_anual,
          tipoAtividade: versaoAnterior.parametros?.tipoAtividade,
        },
        snapshotNovo: {
          nome: nomeFinal,
          empresa: empresaFinal,
          cnpj: cnpjFinal,
          regime: novosResultados.resultadoDashboard.regimeRecomendado,
          faturamentoMensal: novosParametros.faturamentoMensal,
          aliquotaEfetiva: novosResultados.resultadoDashboard.aliquotaEfetivaNova,
          economiaAnual: novosResultados.resultadoDashboard.economiaAnualProjetada,
          tipoAtividade: novosParametros.tipoAtividade,
        },
      })
    } catch {
      /* intentionally ignored */
    }
  }

  return atualizadaLocal
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
  // Consulta direta por cliente_id: o histórico do cliente em /clientes/:id
  // deve mostrar as simulações dele mesmo quando gravadas por outro usuário
  // (ex. analista) — não depende do comportamento admin de listarSimulacoes.
  try {
    const cloudRecords = await pb
      .collection('simulacoes_calculadora')
      .getFullList<PocketBaseSimulacaoRecord>({
        filter: `cliente_id = "${clienteId}"`,
        sort: '-created',
      })
    const locais = carregarSimulacoesLocais().filter((s) => s.cliente_id === clienteId)
    return [...cloudRecords.map(recordToSimulacao), ...locais]
  } catch (err) {
    console.warn('Erro ao buscar simulações do cliente na nuvem, retornando apenas locais:', err)
    return carregarSimulacoesLocais().filter((s) => s.cliente_id === clienteId)
  }
}
