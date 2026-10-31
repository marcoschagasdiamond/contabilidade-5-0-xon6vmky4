export type TipoSimulacaoHistorico = 'calculadora' | 'recuperador'

export type TipoEventoHistorico = 'criacao' | 'renomeacao' | 'edicao_parametros' | 'exclusao'

export interface ItemAlteracaoCampo {
  campo: string
  rotulo: string
  valorAnterior: any
  valorNovo: any
  valorAnteriorFormatado?: string
  valorNovoFormatado?: string
}

export interface SnapshotSimulacaoResumo {
  nome: string
  empresa?: string
  cnpj?: string
  regime?: string
  faturamentoMensal?: number
  aliquotaEfetiva?: number
  economiaAnual?: number
  totalRecuperavelIntegral?: number
  totalRecuperavelConservador?: number
  anoTransicao?: string | number
  tipoAtividade?: string
  [key: string]: any
}

export interface EstadoReconstruidoSimulacao {
  eventoId?: string
  dataEvento?: string
  tipoEvento?: TipoEventoHistorico
  descricao?: string
  autorNome?: string
  campos: Record<string, { rotulo: string; valor: any; valorFormatado: string }>
}

export interface HistoricoSimulacaoRegistro {
  id: string
  simulacao_id: string
  tipo_simulacao: TipoSimulacaoHistorico
  tipo_evento: TipoEventoHistorico
  descricao: string
  simulacao_nome?: string
  empresa?: string
  cnpj?: string
  cliente_id?: string | null
  user_id?: string | null
  autor_nome?: string
  autor_email?: string
  autor_nivel?: string
  alteracoes_json?: ItemAlteracaoCampo[]
  snapshot_anterior_json?: SnapshotSimulacaoResumo
  snapshot_novo_json?: SnapshotSimulacaoResumo
  created: string
  updated?: string
  origem?: 'nuvem' | 'local'
}
