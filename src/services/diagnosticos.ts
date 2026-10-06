import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface Diagnostico {
  id?: string
  nome: string
  email: string
  telefone: string
  empresa: string
  segmento:
    | 'Comércio'
    | 'Serviços'
    | 'Indústria'
    | 'Saúde'
    | 'Educação'
    | 'Agro'
    | 'Transporte'
    | 'Tecnologia'
    | 'Construção Civil'
    | 'Bares e Restaurantes'
    | string
  rbt12: number
  folha12: number
  margem_lucro: number
  regime_recomendado: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | string
  carga_simples: number
  carga_presumido: number
  carga_real: number
  economia_anual?: number
  funcionarios?: string
  emissao_nf?: string
  atividade_mista?: boolean
  regime_atual?: string
  cidade?: string
  aliquota_iss?: number
  ranking_json?: Array<{
    posicao: number
    regime: string
    cargaAnual: number
    aliquotaEfetiva: number
    elegivel: boolean
    diferencaValor: number
    diferencaPercent: number
  }>
  created?: string
  updated?: string
}

export type DiagnosticoRecord = Diagnostico & RecordModel

export async function createDiagnostico(
  data: Omit<Diagnostico, 'id' | 'created' | 'updated'>,
): Promise<DiagnosticoRecord> {
  const record = await pb.collection('diagnosticos').create<DiagnosticoRecord>(data)
  return record
}

export async function getDiagnosticos(): Promise<DiagnosticoRecord[]> {
  return await pb.collection('diagnosticos').getFullList<DiagnosticoRecord>({
    sort: '-created',
  })
}

export async function getDiagnosticoCount(): Promise<number> {
  const result = await pb.collection('diagnosticos').getList(1, 1, {
    fields: 'id',
  })
  return result.totalItems
}

export async function deleteDiagnostico(id: string): Promise<boolean> {
  return await pb.collection('diagnosticos').delete(id)
}
