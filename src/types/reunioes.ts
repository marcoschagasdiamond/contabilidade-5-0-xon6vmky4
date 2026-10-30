export type StatusReuniao = 'agendada' | 'reagendada' | 'cancelada' | 'realizada'

export interface ReuniaoRecord {
  id: string
  user_id: string
  cliente_nome: string
  cliente_email: string
  cliente_telefone?: string
  empresa?: string
  data: string // YYYY-MM-DD
  horario: string // HH:mm
  assunto: string
  observacao?: string
  origem_contexto?: string
  status: StatusReuniao
  resposta_especialista?: string
  cancelado_motivo?: string
  created: string
  updated: string
  expand?: {
    user_id?: {
      id: string
      name?: string
      email?: string
    }
  }
}

export interface NovaReuniaoInput {
  cliente_nome: string
  cliente_email: string
  cliente_telefone?: string
  empresa?: string
  data: string // YYYY-MM-DD
  horario: string // HH:mm
  assunto: string
  observacao?: string
  origem_contexto?: string
}

export interface ConfiguracaoAgendaRecord {
  id: string
  chave: string
  dias_semana_json?: string | number[] // 0=domingo, 1=segunda ... 6=sabado
  horarios_disponiveis_json?: string | string[]
  duracao_minutos?: number
  antecedencia_minima_horas?: number
  ativo?: boolean
  observacoes?: string
  created: string
  updated: string
}

export interface DisponibilidadeAgendaDia {
  data: string
  disponivel: boolean
  motivo?: string
  diasSemanaHabilitados: number[]
  horariosConfigurados: string[]
  horariosOcupados: string[]
  horariosLivres: string[]
}
