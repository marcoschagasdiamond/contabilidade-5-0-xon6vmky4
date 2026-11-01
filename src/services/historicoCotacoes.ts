import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'
import type { RegimeFornecedorCotacao } from '@/lib/calculoComparadorCotacoes'

export interface HistoricoCotacaoFornecedor {
  id?: string
  user_id?: string
  cliente_id?: string
  fornecedor_id?: string
  fornecedor_nome: string
  data_cotacao?: string // ISO date (ex: YYYY-MM-DD)
  descricao_item?: string
  preco_informado: number
  regime: RegimeFornecedorCotacao
  percentual_efetivo_simples?: number
  custo_liquido_calculado: number
  credito_calculado?: number
  eh_vencedora?: boolean
  ano_transicao?: number
  regime_comprador?: string
  classificacao_item?: string
  observacoes?: string
  dados_comparacao_json?: Record<string, any>
  created?: string
  updated?: string
}

export type HistoricoCotacaoRecord = HistoricoCotacaoFornecedor & RecordModel

export interface ListarHistoricoCotacoesParams {
  clienteId?: string | null
  userId?: string | null
  fornecedorId?: string | null
  fornecedorNome?: string | null
  apenasVencedoras?: boolean
  limit?: number
}

/**
 * Lista registros do histórico de cotações salvos no PocketBase por cliente ou usuário.
 */
export async function listarHistoricoCotacoes(
  params?: ListarHistoricoCotacoesParams,
): Promise<HistoricoCotacaoRecord[]> {
  try {
    const filtros: string[] = []

    if (params?.clienteId) {
      filtros.push(`cliente_id = "${params.clienteId}"`)
    } else if (params?.userId) {
      filtros.push(`user_id = "${params.userId}"`)
    }

    if (params?.fornecedorId) {
      filtros.push(`fornecedor_id = "${params.fornecedorId}"`)
    }

    if (params?.fornecedorNome) {
      filtros.push(`fornecedor_nome ~ "${params.fornecedorNome}"`)
    }

    if (params?.apenasVencedoras) {
      filtros.push(`eh_vencedora = true`)
    }

    const filterStr = filtros.length > 0 ? filtros.join(' && ') : undefined

    return await pb
      .collection('historico_cotacoes_fornecedores')
      .getFullList<HistoricoCotacaoRecord>({
        filter: filterStr,
        sort: '-created',
      })
  } catch (err) {
    console.warn('Aviso: falha ao buscar histórico de cotações do banco:', err)
    return []
  }
}

/**
 * Cria um novo registro no histórico de cotações.
 */
export async function registrarCotacaoHistorico(
  data: Omit<HistoricoCotacaoFornecedor, 'id' | 'created' | 'updated'>,
): Promise<HistoricoCotacaoRecord> {
  const payload = {
    ...data,
    data_cotacao: data.data_cotacao || new Date().toISOString().split('T')[0],
    eh_vencedora: data.eh_vencedora ?? true,
  }
  return await pb
    .collection('historico_cotacoes_fornecedores')
    .create<HistoricoCotacaoRecord>(payload)
}

/**
 * Exclui um registro do histórico de cotações.
 */
export async function excluirCotacaoHistorico(id: string): Promise<boolean> {
  return await pb.collection('historico_cotacoes_fornecedores').delete(id)
}

/**
 * Obtém a última cotação vencedora registrada para o cliente/usuário ativo.
 * Usada como referência pré-preenchida no CardComparadorCotacoes.
 */
export async function obterUltimaCotacaoVencedora(params?: {
  clienteId?: string | null
  userId?: string | null
}): Promise<HistoricoCotacaoRecord | null> {
  try {
    const filtros: string[] = ['eh_vencedora = true']
    if (params?.clienteId) {
      filtros.push(`cliente_id = "${params.clienteId}"`)
    } else if (params?.userId) {
      filtros.push(`user_id = "${params.userId}"`)
    }

    const records = await pb
      .collection('historico_cotacoes_fornecedores')
      .getList<HistoricoCotacaoRecord>(1, 1, {
        filter: filtros.join(' && '),
        sort: '-created',
      })

    return records.items[0] || null
  } catch (err) {
    console.warn('Aviso: falha ao buscar última cotação vencedora:', err)
    return null
  }
}
