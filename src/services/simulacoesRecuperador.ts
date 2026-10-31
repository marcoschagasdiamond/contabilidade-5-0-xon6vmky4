import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'
import type {
  SimulacaoRecuperador,
  ParametrosRecuperador,
  ResultadosRecuperador,
} from '@/types/recuperadorCreditos'

const LOCAL_STORAGE_KEY = 'contabilidade50_simulacoes_recuperador_v1'

interface PbSimulacaoRecuperadorRecord extends RecordModel {
  user_id?: string
  cliente_id?: string
  nome: string
  empresa?: string
  cnpj?: string
  regime_atual?: string
  parametros_json: any
  resultados_json: any
  total_recuperavel_integral?: number
  total_recuperavel_conservador?: number
  total_pis_cofins?: number
  total_folha?: number
  total_irpj_csll?: number
  total_outros_tributos?: number
}

export function carregarSimulacoesRecuperadorLocais(): SimulacaoRecuperador[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Erro ao ler simulações do recuperador do localStorage:', err)
    return []
  }
}

export function salvarSimulacoesRecuperadorLocais(lista: SimulacaoRecuperador[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lista))
  } catch (err) {
    console.error('Erro ao persistir simulações do recuperador no localStorage:', err)
  }
}

export function salvarSimulacaoRecuperadorLocal(
  nome: string,
  parametros: ParametrosRecuperador,
  resultados: ResultadosRecuperador,
  empresa?: string,
  cnpj?: string,
  clienteId?: string | null,
): SimulacaoRecuperador {
  const lista = carregarSimulacoesRecuperadorLocais()
  const nova: SimulacaoRecuperador = {
    id: 'local_recup_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    nome,
    cliente_id: clienteId || null,
    empresa: empresa || parametros.configuracoes.empresa || '',
    cnpj: cnpj || parametros.configuracoes.cnpj || '',
    regime_atual: parametros.configuracoes.regimeAtual || 'Lucro Presumido',
    parametros,
    resultados,
    total_recuperavel_integral: resultados.totalIntegralCorrigido,
    total_recuperavel_conservador: resultados.totalConservadorCorrigido,
    total_pis_cofins: resultados.totalPisCofinsCorrigido,
    total_folha: resultados.totalFolhaCorrigido,
    total_irpj_csll: resultados.totalIrpjCsllCorrigido || 0,
    total_outros_tributos: resultados.totalOutrosTributosCorrigido || 0,
    created: new Date().toISOString(),
    origem: 'local',
  }
  const atualizadas = [nova, ...lista]
  salvarSimulacoesRecuperadorLocais(atualizadas)
  return nova
}

function recordToSimulacao(rec: PbSimulacaoRecuperadorRecord): SimulacaoRecuperador {
  let parametros: ParametrosRecuperador
  let resultados: ResultadosRecuperador

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
    regime_atual: rec.regime_atual || '',
    parametros,
    resultados,
    total_recuperavel_integral: rec.total_recuperavel_integral || 0,
    total_recuperavel_conservador: rec.total_recuperavel_conservador || 0,
    total_pis_cofins: rec.total_pis_cofins || 0,
    total_folha: rec.total_folha || 0,
    total_irpj_csll: rec.total_irpj_csll || 0,
    total_outros_tributos: rec.total_outros_tributos || 0,
    created: rec.created,
    updated: rec.updated,
    origem: 'nuvem',
  }
}

export async function salvarSimulacaoRecuperador(dados: {
  nome: string
  parametros: ParametrosRecuperador
  resultados: ResultadosRecuperador
  empresa?: string
  cnpj?: string
  regimeAtual?: string
  userId?: string | null
  clienteId?: string | null
}): Promise<SimulacaoRecuperador> {
  const { registrarEventoHistoricoSimulacao } = await import('@/services/historicoSimulacoes')
  const authUser = pb.authStore.record
  const effectiveUserId = dados.userId || authUser?.id

  if (effectiveUserId) {
    try {
      const payload: Record<string, any> = {
        user_id: effectiveUserId,
        cliente_id: dados.clienteId || '',
        nome: dados.nome.trim(),
        empresa: dados.empresa || dados.parametros.configuracoes.empresa || '',
        cnpj: dados.cnpj || dados.parametros.configuracoes.cnpj || '',
        regime_atual: dados.regimeAtual || dados.parametros.configuracoes.regimeAtual || '',
        parametros_json: dados.parametros,
        resultados_json: dados.resultados,
        total_recuperavel_integral: dados.resultados.totalIntegralCorrigido,
        total_recuperavel_conservador: dados.resultados.totalConservadorCorrigido,
        total_pis_cofins: dados.resultados.totalPisCofinsCorrigido,
        total_folha: dados.resultados.totalFolhaCorrigido,
        total_irpj_csll: dados.resultados.totalIrpjCsllCorrigido || 0,
        total_outros_tributos: dados.resultados.totalOutrosTributosCorrigido || 0,
      }

      const rec = await pb
        .collection('simulacoes_recuperador')
        .create<PbSimulacaoRecuperadorRecord>(payload)
      const simulacaoCriada = recordToSimulacao(rec)

      try {
        await registrarEventoHistoricoSimulacao({
          simulacaoId: simulacaoCriada.id,
          tipoSimulacao: 'recuperador',
          tipoEvento: 'criacao',
          descricao: `Análise "${simulacaoCriada.nome}" salva no Recuperador de Créditos`,
          simulacaoNome: simulacaoCriada.nome,
          empresa: simulacaoCriada.empresa,
          cnpj: simulacaoCriada.cnpj,
          clienteId: simulacaoCriada.cliente_id,
          userId: effectiveUserId,
          snapshotNovo: {
            nome: simulacaoCriada.nome,
            empresa: simulacaoCriada.empresa,
            cnpj: simulacaoCriada.cnpj,
            regime: simulacaoCriada.regime_atual,
            totalRecuperavelIntegral: simulacaoCriada.total_recuperavel_integral,
            totalRecuperavelConservador: simulacaoCriada.total_recuperavel_conservador,
            faturamentoMensal: simulacaoCriada.parametros?.configuracoes?.faturamentoMensal,
          },
        })
      } catch (histErr) {
        console.warn('Aviso ao registrar histórico do recuperador:', histErr)
      }

      return simulacaoCriada
    } catch (err) {
      console.warn(
        'Erro ao salvar simulação recuperador no PocketBase, usando fallback local:',
        err,
      )
      const local = salvarSimulacaoRecuperadorLocal(
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
          tipoSimulacao: 'recuperador',
          tipoEvento: 'criacao',
          descricao: `Análise local "${local.nome}" salva no Recuperador de Créditos`,
          simulacaoNome: local.nome,
          empresa: local.empresa,
          cnpj: local.cnpj,
          clienteId: local.cliente_id,
          userId: null,
          snapshotNovo: {
            nome: local.nome,
            empresa: local.empresa,
            cnpj: local.cnpj,
            regime: local.regime_atual,
            totalRecuperavelIntegral: local.total_recuperavel_integral,
            totalRecuperavelConservador: local.total_recuperavel_conservador,
          },
        })
      } catch {
        /* intentionally ignored */
      }
      return local
    }
  }

  const local = salvarSimulacaoRecuperadorLocal(
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
      tipoSimulacao: 'recuperador',
      tipoEvento: 'criacao',
      descricao: `Análise local "${local.nome}" salva no Recuperador de Créditos`,
      simulacaoNome: local.nome,
      empresa: local.empresa,
      cnpj: local.cnpj,
      clienteId: local.cliente_id,
      userId: null,
      snapshotNovo: {
        nome: local.nome,
        empresa: local.empresa,
        cnpj: local.cnpj,
        regime: local.regime_atual,
        totalRecuperavelIntegral: local.total_recuperavel_integral,
        totalRecuperavelConservador: local.total_recuperavel_conservador,
      },
    })
  } catch {
    /* intentionally ignored */
  }
  return local
}

export async function obterSimulacaoRecuperadorPorId(
  id: string,
): Promise<SimulacaoRecuperador | null> {
  // 1. Tenta carregar do PocketBase
  try {
    const rec = await pb.collection('simulacoes_recuperador').getOne<any>(id)
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
        regime_atual: rec.regime_atual || '',
        parametros: parametros as any,
        resultados: resultados as any,
        total_recuperavel_integral: rec.total_recuperavel_integral || 0,
        total_recuperavel_conservador: rec.total_recuperavel_conservador || 0,
        total_pis_cofins: rec.total_pis_cofins || 0,
        total_folha: rec.total_folha || 0,
        created: rec.created,
        updated: rec.updated,
        origem: 'nuvem',
      }
    }
  } catch {
    /* fallback local */
  }

  // 2. Fallback localStorage
  const locais = carregarSimulacoesRecuperadorLocais()
  const encontrada = locais.find((s) => s.id === id)
  return encontrada || null
}

export async function listarSimulacoesRecuperador(
  userId?: string | null,
): Promise<SimulacaoRecuperador[]> {
  const authUser = pb.authStore.record
  const effectiveUserId = userId || authUser?.id
  const locais = carregarSimulacoesRecuperadorLocais()

  if (!effectiveUserId) {
    return locais
  }

  try {
    const isAdmin =
      (authUser as any)?.role === 'admin' || authUser?.email === 'marcoschagasdiamond@icloud.com'

    const filter = isAdmin ? '' : `user_id = "${effectiveUserId}"`

    const cloudRecords = await pb
      .collection('simulacoes_recuperador')
      .getFullList<PbSimulacaoRecuperadorRecord>({
        filter: filter || undefined,
        sort: '-created',
      })

    const cloudSimulacoes = cloudRecords.map(recordToSimulacao)
    return [...cloudSimulacoes, ...locais]
  } catch (err) {
    console.warn('Erro ao buscar simulações do recuperador na nuvem, retornando locais:', err)
    return locais
  }
}

export async function excluirSimulacaoRecuperador(
  simulacao: SimulacaoRecuperador,
): Promise<boolean> {
  const { registrarEventoHistoricoSimulacao } = await import('@/services/historicoSimulacoes')
  const authUser = pb.authStore.record

  try {
    await registrarEventoHistoricoSimulacao({
      simulacaoId: simulacao.id,
      tipoSimulacao: 'recuperador',
      tipoEvento: 'exclusao',
      descricao: `Análise "${simulacao.nome}" excluída`,
      simulacaoNome: simulacao.nome,
      empresa: simulacao.empresa,
      cnpj: simulacao.cnpj,
      clienteId: simulacao.cliente_id,
      userId: simulacao.user_id || authUser?.id || null,
      snapshotAnterior: {
        nome: simulacao.nome,
        empresa: simulacao.empresa,
        cnpj: simulacao.cnpj,
        regime: simulacao.regime_atual,
        totalRecuperavelIntegral: simulacao.total_recuperavel_integral,
        totalRecuperavelConservador: simulacao.total_recuperavel_conservador,
      },
    })
  } catch (histErr) {
    console.warn('Aviso ao registrar histórico de exclusão recuperador:', histErr)
  }

  if (simulacao.origem === 'nuvem') {
    try {
      await pb.collection('simulacoes_recuperador').delete(simulacao.id)
      return true
    } catch (err) {
      console.error('Erro ao excluir simulação recuperador na nuvem:', err)
      return false
    }
  } else {
    const lista = carregarSimulacoesRecuperadorLocais()
    salvarSimulacoesRecuperadorLocais(lista.filter((item) => item.id !== simulacao.id))
    return true
  }
}

export async function renomearSimulacaoRecuperador(
  simulacao: SimulacaoRecuperador,
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
      await pb.collection('simulacoes_recuperador').update(simulacao.id, {
        nome: nomeTrim,
      })
      sucesso = true
    } catch (err) {
      console.error('Erro ao renomear simulação recuperador na nuvem:', err)
      return false
    }
  } else {
    const lista = carregarSimulacoesRecuperadorLocais()
    const atualizadas = lista.map((item) =>
      item.id === simulacao.id ? { ...item, nome: nomeTrim } : item,
    )
    salvarSimulacoesRecuperadorLocais(atualizadas)
    sucesso = true
  }

  if (sucesso && nomeAnterior !== nomeTrim) {
    try {
      await registrarEventoHistoricoSimulacao({
        simulacaoId: simulacao.id,
        tipoSimulacao: 'recuperador',
        tipoEvento: 'renomeacao',
        descricao: `Análise renomeada de "${nomeAnterior}" para "${nomeTrim}"`,
        simulacaoNome: nomeTrim,
        empresa: simulacao.empresa,
        cnpj: simulacao.cnpj,
        clienteId: simulacao.cliente_id,
        userId: simulacao.user_id || authUser?.id || null,
        alteracoes: [
          {
            campo: 'nome',
            rotulo: 'Nome da Análise',
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
          regime: simulacao.regime_atual,
        },
        snapshotNovo: {
          nome: nomeTrim,
          empresa: simulacao.empresa,
          cnpj: simulacao.cnpj,
          regime: simulacao.regime_atual,
        },
      })
    } catch (histErr) {
      console.warn('Aviso ao registrar histórico de renomeação do recuperador:', histErr)
    }
  }

  return sucesso
}

/**
 * Atualiza parâmetros e apuração de uma análise do Recuperador e gera histórico de alterações
 */
export async function atualizarParametrosSimulacaoRecuperador(
  simulacaoId: string,
  novosParametros: ParametrosRecuperador,
  novosResultados: ResultadosRecuperador,
  dadosExtras?: {
    nome?: string
    empresa?: string
    cnpj?: string
    regimeAtual?: string
  },
): Promise<SimulacaoRecuperador | null> {
  const { calcularDiffRecuperador, registrarEventoHistoricoSimulacao } =
    await import('@/services/historicoSimulacoes')
  const authUser = pb.authStore.record

  const versaoAnterior = await obterSimulacaoRecuperadorPorId(simulacaoId)
  if (!versaoAnterior) return null

  const nomeFinal = dadosExtras?.nome?.trim() || versaoAnterior.nome
  const empresaFinal = dadosExtras?.empresa?.trim() || versaoAnterior.empresa
  const cnpjFinal = dadosExtras?.cnpj?.trim() || versaoAnterior.cnpj
  const regimeFinal =
    dadosExtras?.regimeAtual ||
    novosParametros.configuracoes?.regimeAtual ||
    versaoAnterior.regime_atual

  const alteracoes = calcularDiffRecuperador(
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
        regime_atual: regimeFinal,
        parametros_json: novosParametros,
        resultados_json: novosResultados,
        total_recuperavel_integral: novosResultados.totalIntegralCorrigido,
        total_recuperavel_conservador: novosResultados.totalConservadorCorrigido,
        total_pis_cofins: novosResultados.totalPisCofinsCorrigido,
        total_folha: novosResultados.totalFolhaCorrigido,
        total_irpj_csll: novosResultados.totalIrpjCsllCorrigido || 0,
        total_outros_tributos: novosResultados.totalOutrosTributosCorrigido || 0,
      }

      const rec = await pb
        .collection('simulacoes_recuperador')
        .update<PbSimulacaoRecuperadorRecord>(simulacaoId, payload)
      const simulacaoAtualizada = recordToSimulacao(rec)

      if (alteracoes.length > 0) {
        try {
          await registrarEventoHistoricoSimulacao({
            simulacaoId,
            tipoSimulacao: 'recuperador',
            tipoEvento: 'edicao_parametros',
            descricao: `Parâmetros do recuperador atualizados (${alteracoes.length} ${
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
              regime: versaoAnterior.regime_atual,
              totalRecuperavelIntegral: versaoAnterior.total_recuperavel_integral,
              totalRecuperavelConservador: versaoAnterior.total_recuperavel_conservador,
            },
            snapshotNovo: {
              nome: nomeFinal,
              empresa: empresaFinal,
              cnpj: cnpjFinal,
              regime: regimeFinal,
              totalRecuperavelIntegral: novosResultados.totalIntegralCorrigido,
              totalRecuperavelConservador: novosResultados.totalConservadorCorrigido,
            },
          })
        } catch (histErr) {
          console.warn('Aviso ao registrar histórico de edição recuperador:', histErr)
        }
      }

      return simulacaoAtualizada
    } catch (err) {
      console.warn('Erro ao atualizar simulação recuperador na nuvem, atualizando local:', err)
    }
  }

  // Fallback local
  const locais = carregarSimulacoesRecuperadorLocais()
  let atualizadaLocal: SimulacaoRecuperador | null = null
  const novas = locais.map((item) => {
    if (item.id === simulacaoId) {
      atualizadaLocal = {
        ...item,
        nome: nomeFinal,
        empresa: empresaFinal,
        cnpj: cnpjFinal,
        regime_atual: regimeFinal,
        parametros: novosParametros,
        resultados: novosResultados,
        total_recuperavel_integral: novosResultados.totalIntegralCorrigido,
        total_recuperavel_conservador: novosResultados.totalConservadorCorrigido,
        total_pis_cofins: novosResultados.totalPisCofinsCorrigido,
        total_folha: novosResultados.totalFolhaCorrigido,
        updated: new Date().toISOString(),
      }
      return atualizadaLocal
    }
    return item
  })
  salvarSimulacoesRecuperadorLocais(novas)

  if (alteracoes.length > 0) {
    try {
      await registrarEventoHistoricoSimulacao({
        simulacaoId,
        tipoSimulacao: 'recuperador',
        tipoEvento: 'edicao_parametros',
        descricao: `Parâmetros locais do recuperador atualizados (${alteracoes.length} ${
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
          regime: versaoAnterior.regime_atual,
          totalRecuperavelIntegral: versaoAnterior.total_recuperavel_integral,
          totalRecuperavelConservador: versaoAnterior.total_recuperavel_conservador,
        },
        snapshotNovo: {
          nome: nomeFinal,
          empresa: empresaFinal,
          cnpj: cnpjFinal,
          regime: regimeFinal,
          totalRecuperavelIntegral: novosResultados.totalIntegralCorrigido,
          totalRecuperavelConservador: novosResultados.totalConservadorCorrigido,
        },
      })
    } catch {
      /* intentionally ignored */
    }
  }

  return atualizadaLocal
}

export async function vincularSimulacaoRecuperadorACliente(
  simulacaoId: string,
  clienteId: string | null,
): Promise<boolean> {
  try {
    await pb.collection('simulacoes_recuperador').update(simulacaoId, {
      cliente_id: clienteId || '',
    })
    return true
  } catch (err) {
    console.error('Erro ao vincular simulação recuperador ao cliente:', err)
    const locais = carregarSimulacoesRecuperadorLocais()
    const atualizadas = locais.map((item) =>
      item.id === simulacaoId ? { ...item, cliente_id: clienteId || null } : item,
    )
    salvarSimulacoesRecuperadorLocais(atualizadas)
    return true
  }
}

export async function listarSimulacoesRecuperadorPorCliente(
  clienteId: string,
): Promise<SimulacaoRecuperador[]> {
  if (!clienteId) return []
  const todas = await listarSimulacoesRecuperador()
  return todas.filter((s) => s.cliente_id === clienteId)
}
