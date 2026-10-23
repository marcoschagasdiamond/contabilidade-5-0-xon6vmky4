import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export type TipoDiagnostico = '360' | 'transicao' | 'regimes' | 'enquadramento'

export interface Diagnostico {
  id?: string
  user_id?: string
  cliente_id?: string | null
  tipo_diagnostico?: TipoDiagnostico | string
  nome: string
  email: string
  telefone: string
  empresa: string
  cnpj?: string
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
  // Campos da Reforma Tributária (EC 132/2023, LC 214/2025)
  ano_base?: number
  sistema_recomendado_atual?: string
  sistema_recomendado_novo?: string
  carga_simples_novo?: number
  carga_presumido_novo?: number
  carga_real_novo?: number
  economia_anual_novo?: number
  detalhes_reforma_json?: Record<string, any>
  dados_extra_json?: Record<string, any>
  configuracoes_diagnostico_json?: {
    regime_atual?: string
    segmento?: string
    atividade_mista?: boolean
    proporcao_servico_misto?: number
    ano_base_transicao?: number
    uf_origem?: string
    cidade?: string
    funcionarios?: string
    emissao_nf?: string
    cnpj?: string
    razao_social?: string
    nome_contato?: string
  }
  // Novos campos do Módulo 3
  folha_pagamento?: number // folha mensal
  despesas_creditos?: number // despesas com créditos mensais
  percentual_exportacao?: number // % exportação
  uf_origem?: string // sigla UF
  aliquota_icms?: number // alíquota de ICMS da UF
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

export async function getDiagnosticos(filter?: string): Promise<DiagnosticoRecord[]> {
  return await pb.collection('diagnosticos').getFullList<DiagnosticoRecord>({
    filter: filter || undefined,
    sort: '-created',
  })
}

export async function getDiagnosticoPorId(id: string): Promise<DiagnosticoRecord | null> {
  if (!id) return null
  try {
    return await pb.collection('diagnosticos').getOne<DiagnosticoRecord>(id)
  } catch (err) {
    console.warn(`Diagnóstico ${id} não encontrado:`, err)
    return null
  }
}

export async function atualizarDiagnostico(
  id: string,
  data: Partial<Diagnostico>,
): Promise<DiagnosticoRecord> {
  return await pb.collection('diagnosticos').update<DiagnosticoRecord>(id, data)
}

export async function getDiagnosticosPorCliente(clienteId: string): Promise<DiagnosticoRecord[]> {
  if (!clienteId) return []
  return await pb.collection('diagnosticos').getFullList<DiagnosticoRecord>({
    filter: `cliente_id = "${clienteId}"`,
    sort: '-created',
  })
}

export async function vincularDiagnosticoACliente(
  diagnosticoId: string,
  clienteId: string | null,
): Promise<DiagnosticoRecord> {
  return await pb.collection('diagnosticos').update<DiagnosticoRecord>(diagnosticoId, {
    cliente_id: clienteId || '',
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
