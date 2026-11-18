import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

// Coleção notas_fiscais — notas fiscais reais importadas em /dados-empresa (aba Notas Fiscais).
// Usadas na Calculadora IBS/CBS como fonte real de compras ("Usar notas fiscais reais").
// Padrão de acesso: dono do registro + master/admin (mesmo padrão de clientes_empresas).

export type OrigemNotaFiscal = 'csv' | 'xml_nfe' | 'manual'

export type RegimeNotaFiscal = 'lucro_real' | 'lucro_presumido' | 'simples_nacional' | '' | null

export interface NotaFiscal {
  id?: string
  user_id?: string
  cliente_id?: string
  numero: string
  data_emissao: string // YYYY-MM-DD
  cnpj_emitente?: string
  nome_emitente?: string
  valor_total: number
  valor_produtos: number
  regime_fornecedor?: RegimeNotaFiscal
  origem: OrigemNotaFiscal
  created?: string
  updated?: string
}

export type NotaFiscalRecord = NotaFiscal & RecordModel

export async function listarNotasFiscais(params?: {
  clienteId?: string | null
  userId?: string | null
}): Promise<NotaFiscalRecord[]> {
  try {
    const filtros: string[] = []
    if (params?.clienteId) {
      filtros.push(`cliente_id = "${params.clienteId}"`)
    } else if (params?.userId) {
      filtros.push(`user_id = "${params.userId}"`)
    }

    const filterStr = filtros.length > 0 ? filtros.join(' && ') : undefined

    return await pb.collection('notas_fiscais').getFullList<NotaFiscalRecord>({
      filter: filterStr,
      sort: '-data_emissao,-created',
    })
  } catch (err) {
    console.warn('Aviso: falha ao buscar notas fiscais do banco:', err)
    return []
  }
}

export async function criarNotaFiscal(
  data: Omit<NotaFiscal, 'id' | 'created' | 'updated'>,
): Promise<NotaFiscalRecord> {
  return await pb.collection('notas_fiscais').create<NotaFiscalRecord>(data)
}

export async function excluirNotaFiscal(id: string): Promise<boolean> {
  return await pb.collection('notas_fiscais').delete(id)
}

export async function salvarLoteNotasFiscais(
  notas: Array<Omit<NotaFiscal, 'id' | 'created' | 'updated'>>,
): Promise<NotaFiscalRecord[]> {
  const criadas: NotaFiscalRecord[] = []
  for (const n of notas) {
    try {
      const rec = await criarNotaFiscal(n)
      criadas.push(rec)
    } catch (err) {
      console.warn('Erro ao salvar nota fiscal no lote:', n.numero, err)
    }
  }
  return criadas
}

export async function limparNotasFiscaisPorCliente(params: {
  clienteId?: string | null
  userId?: string | null
}): Promise<number> {
  const lista = await listarNotasFiscais(params)
  let count = 0
  for (const n of lista) {
    try {
      await pb.collection('notas_fiscais').delete(n.id)
      count++
    } catch (e) {
      console.warn('Erro ao excluir nota fiscal:', n.id, e)
    }
  }
  return count
}

export interface TotaisNotasFiscais {
  quantidade: number
  valorTotal: number
  valorProdutos: number
  mediaValor: number
}

export function calcularTotaisNotasFiscais(notas: NotaFiscalRecord[]): TotaisNotasFiscais {
  const quantidade = notas.length
  const valorTotal = notas.reduce((acc, n) => acc + (Number(n.valor_total) || 0), 0)
  const valorProdutos = notas.reduce((acc, n) => acc + (Number(n.valor_produtos) || 0), 0)
  return {
    quantidade,
    valorTotal,
    valorProdutos,
    mediaValor: quantidade > 0 ? valorTotal / quantidade : 0,
  }
}
