import type { RecordModel } from 'pocketbase'

export interface CrmMetaModel {
  id: string
  analista_id: string
  mes_ano: string // 'YYYY-MM'
  meta_novos_clientes?: number
  meta_receita_carteira?: number
  meta_creditos_recuperados?: number
  meta_diagnosticos_concluidos?: number
  observacoes?: string
  created: string
  updated: string
  expand?: {
    analista_id?: {
      id: string
      name?: string
      email?: string
      nivel_acesso?: string
    }
  }
}

export type CrmMetaRecord = CrmMetaModel & RecordModel

export interface SalvarMetaInput {
  analista_id?: string
  mes_ano: string
  meta_novos_clientes?: number
  meta_receita_carteira?: number
  meta_creditos_recuperados?: number
  meta_diagnosticos_concluidos?: number
  observacoes?: string
}

export type EstadoIndicadorMeta = 'atingida' | 'em_progresso' | 'abaixo'

export interface ItemIndicadorMeta {
  id: 'novos_clientes' | 'receita_carteira' | 'creditos_recuperados' | 'diagnosticos_concluidos'
  titulo: string
  descricao: string
  unidade: 'qtd' | 'moeda'
  realizado: number
  meta: number
  percentual: number // ex: 85.5% (se meta = 0, 100% se realizado > 0 senão 0%)
  diferenca: number // realizado - meta
  gapParaMeta: number // Math.max(0, meta - realizado)
  estado: EstadoIndicadorMeta
}

export interface DashboardMetasResultado {
  mesAno: string // 'YYYY-MM'
  mesAnoRotulo: string // ex: 'Maio de 2025'
  analistaId: string
  analistaNome: string
  isVisaoConsolidada: boolean
  totalCarteiras: number
  indicadores: {
    novosClientes: ItemIndicadorMeta
    receitaCarteira: ItemIndicadorMeta
    creditosRecuperados: ItemIndicadorMeta
    diagnosticosConcluidos: ItemIndicadorMeta
  }
  metaRecord: CrmMetaRecord | null
  indicadorMaisDistante: ItemIndicadorMeta
  resumoAtingimentoGeral: {
    totalAtingidas: number
    totalEmProgresso: number
    totalAbaixo: number
    percentualMedio: number
  }
}
