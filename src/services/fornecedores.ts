import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export type RegimeFornecedor = 'lucro_real' | 'lucro_presumido' | 'simples_nacional' | 'misto'
export type ClassificacaoCreditoItem = 'integral' | 'parcial' | 'nao_gera'

export interface FornecedorDiagnostico {
  id?: string
  user_id?: string
  cliente_id?: string
  diagnostico_id?: string
  nome: string
  cnpj?: string
  regime: RegimeFornecedor
  proporcao_misto?: number // 0-100 (% Lucro Real se misto)
  volume_compras: number // R$ no período anual ou mensal
  classificacao_credito: ClassificacaoCreditoItem
  percentual_credito_parcial?: number // 0-100 (se classificação == 'parcial')
  descricao_item?: string
  aliquota_simples_informada?: number // Alíquota declarada do Simples (padrão 3 a 7%)
  ncm?: string // Código NCM do item (ex: 1006.30.21 ou 10063021)
  ncm_classificado_auto?: boolean // Se a classificação do item foi sugerida automaticamente via tabela NCM
  observacoes?: string
  ativo?: boolean
  dados_extra_json?: Record<string, any>
  created?: string
  updated?: string
}

export type FornecedorDiagnosticoRecord = FornecedorDiagnostico & RecordModel

export async function listarFornecedores(params?: {
  clienteId?: string | null
  userId?: string | null
}): Promise<FornecedorDiagnosticoRecord[]> {
  try {
    const filtros: string[] = []
    if (params?.clienteId) {
      filtros.push(`cliente_id = "${params.clienteId}"`)
    } else if (params?.userId) {
      filtros.push(`user_id = "${params.userId}"`)
    }

    const filterStr = filtros.length > 0 ? filtros.join(' && ') : undefined

    return await pb
      .collection('fornecedores_diagnostico')
      .getFullList<FornecedorDiagnosticoRecord>({
        filter: filterStr,
        sort: '-volume_compras,-created',
      })
  } catch (err) {
    console.warn('Aviso: falha ao buscar fornecedores do banco:', err)
    return []
  }
}

export async function criarFornecedor(
  data: Omit<FornecedorDiagnostico, 'id' | 'created' | 'updated'>,
): Promise<FornecedorDiagnosticoRecord> {
  return await pb.collection('fornecedores_diagnostico').create<FornecedorDiagnosticoRecord>(data)
}

export async function atualizarFornecedor(
  id: string,
  data: Partial<FornecedorDiagnostico>,
): Promise<FornecedorDiagnosticoRecord> {
  return await pb
    .collection('fornecedores_diagnostico')
    .update<FornecedorDiagnosticoRecord>(id, data)
}

export async function excluirFornecedor(id: string): Promise<boolean> {
  return await pb.collection('fornecedores_diagnostico').delete(id)
}

export async function salvarLoteFornecedores(
  fornecedores: Array<Omit<FornecedorDiagnostico, 'id' | 'created' | 'updated'>>,
): Promise<FornecedorDiagnosticoRecord[]> {
  const criados: FornecedorDiagnosticoRecord[] = []
  for (const f of fornecedores) {
    try {
      const rec = await criarFornecedor(f)
      criados.push(rec)
    } catch (err) {
      console.warn('Erro ao salvar fornecedor no lote:', f.nome, err)
    }
  }
  return criados
}

export async function limparFornecedoresPorCliente(params: {
  clienteId?: string | null
  userId?: string | null
}): Promise<number> {
  const lista = await listarFornecedores(params)
  let count = 0
  for (const f of lista) {
    try {
      await pb.collection('fornecedores_diagnostico').delete(f.id)
      count++
    } catch (e) {
      console.warn('Erro ao excluir fornecedor:', f.id, e)
    }
  }
  return count
}
