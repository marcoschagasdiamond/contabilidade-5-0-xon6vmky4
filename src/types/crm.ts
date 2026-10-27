import type { RecordModel } from 'pocketbase'

export type EstagioFunilCrm = 'lead' | 'diagnostico' | 'proposta' | 'cliente_ativo' | 'descartado'

export interface EstagioFunilConfig {
  id: EstagioFunilCrm
  rotulo: string
  subtitulo: string
  corBorda: string
  corBadge: string
  corHeaderBg: string
}

export const ESTAGIOS_FUNIL_CRM: EstagioFunilConfig[] = [
  {
    id: 'lead',
    rotulo: 'Lead',
    subtitulo: 'Contato inicial / prospecção',
    corBorda: 'border-slate-300',
    corBadge: 'bg-slate-100 text-slate-700 border-slate-300',
    corHeaderBg: 'bg-slate-100 text-slate-800',
  },
  {
    id: 'diagnostico',
    rotulo: 'Diagnóstico',
    subtitulo: 'Em levantamento ou concluído',
    corBorda: 'border-blue-300',
    corBadge: 'bg-blue-50 text-blue-800 border-blue-200',
    corHeaderBg: 'bg-blue-50 text-blue-900',
  },
  {
    id: 'proposta',
    rotulo: 'Proposta',
    subtitulo: 'Apresentação comercial enviada',
    corBorda: 'border-[#D4AF37]/60',
    corBadge: 'bg-[#D4AF37]/15 text-[#07132B] border-[#D4AF37]',
    corHeaderBg: 'bg-[#D4AF37]/20 text-[#07132B]',
  },
  {
    id: 'cliente_ativo',
    rotulo: 'Cliente Ativo',
    subtitulo: 'Fechado / em atendimento',
    corBorda: 'border-emerald-300',
    corBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    corHeaderBg: 'bg-emerald-50 text-emerald-900',
  },
  {
    id: 'descartado',
    rotulo: 'Descartado',
    subtitulo: 'Sem interesse ou perdido',
    corBorda: 'border-rose-200',
    corBadge: 'bg-rose-50 text-rose-700 border-rose-200',
    corHeaderBg: 'bg-rose-50 text-rose-800',
  },
]

export interface CrmAnotacao {
  id: string
  cliente?: string
  cliente_empresa_id?: string
  autor: string
  autor_nome?: string
  autor_email?: string
  texto: string
  created: string
  updated?: string
}

export type CrmAnotacaoRecord = CrmAnotacao & RecordModel

export type StatusTarefaCrm = 'pendente' | 'concluida' | 'cancelada'

export interface CrmTarefa {
  id: string
  cliente?: string
  cliente_empresa_id?: string
  titulo: string
  descricao?: string
  prazo?: string
  responsavel?: string
  responsavel_nome?: string
  responsavel_email?: string
  status: StatusTarefaCrm
  autor?: string
  autor_nome?: string
  concluida_em?: string
  created: string
  updated?: string
}

export type CrmTarefaRecord = CrmTarefa & RecordModel

export interface CriarAnotacaoInput {
  clienteId: string
  collectionOrigem?: 'clientes' | 'clientes_empresas'
  texto: string
}

export interface CriarTarefaInput {
  clienteId: string
  collectionOrigem?: 'clientes' | 'clientes_empresas'
  titulo: string
  descricao?: string
  prazo?: string
  responsavelId?: string
}
