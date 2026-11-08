export type EstagioPipelineLead = 'novo' | 'contato_feito' | 'reuniao' | 'cliente'

export interface ColunaPipelineLead {
  id: EstagioPipelineLead
  rotulo: string
  subtitulo: string
  corHeaderBg: string
  corBadge: string
  corBorder: string
}

export const ESTAGIOS_PIPELINE_LEAD: ColunaPipelineLead[] = [
  {
    id: 'novo',
    rotulo: 'Novo Lead',
    subtitulo: 'Aguardando primeiro contato',
    corHeaderBg: 'bg-blue-50 text-blue-900 border-blue-200',
    corBadge: 'bg-blue-100 text-blue-800 border-blue-300',
    corBorder: 'border-blue-300',
  },
  {
    id: 'contato_feito',
    rotulo: 'Contato Feito',
    subtitulo: 'Conversa iniciada / diagnóstico',
    corHeaderBg: 'bg-amber-50 text-amber-900 border-amber-200',
    corBadge: 'bg-amber-100 text-amber-800 border-amber-300',
    corBorder: 'border-amber-300',
  },
  {
    id: 'reuniao',
    rotulo: 'Reunião Agendada',
    subtitulo: 'Apresentação de proposta / alinhamento',
    corHeaderBg: 'bg-purple-50 text-purple-900 border-purple-200',
    corBadge: 'bg-purple-100 text-purple-800 border-purple-300',
    corBorder: 'border-purple-300',
  },
  {
    id: 'cliente',
    rotulo: 'Convertido em Cliente',
    subtitulo: 'Contrato fechado / onboarded',
    corHeaderBg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    corBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    corBorder: 'border-emerald-300',
  },
]

export type TipoInteracaoLead = 'whatsapp' | 'telefone' | 'email' | 'reuniao' | 'nota' | 'sistema'

export interface InteracaoLead {
  id: string
  data: string
  tipo: TipoInteracaoLead
  titulo?: string
  descricao: string
  autorNome?: string
  autorId?: string
  proximoPasso?: string
  dataProximoPasso?: string
}

export interface LeadProcessado {
  id: string
  nome: string
  email: string
  telefone: string
  empresa: string
  cnpj?: string
  segmento: string
  funcionarios: string
  mensagem?: string
  tipo_solicitacao?: string
  created?: string
  updated?: string
  estagio_pipeline: EstagioPipelineLead
  score: number
  fonte: string
  interacoes: InteracaoLead[]
  ultima_interacao?: string
  isQuenteEsquecido: boolean
  diasSemInteracao: number
}
