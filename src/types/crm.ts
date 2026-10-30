import type { RecordModel } from 'pocketbase'
import type { ClienteEmpresaRecord } from '@/services/clientesEmpresas'
import type { DiagnosticoRecord } from '@/services/diagnosticos'
import type { SimulacaoCalculadora } from '@/types/simulacaoCalculadora'
import type { SimulacaoRecuperador } from '@/types/recuperadorCreditos'
import type { ReuniaoRecord } from '@/types/reunioes'

export type StatusComercialCrm = 'Prospect' | 'Onboarding' | 'Ativo' | 'Inativo' | 'Perdido'

export interface StatusComercialConfig {
  id: StatusComercialCrm
  rotulo: string
  subtitulo: string
  corBorda: string
  corBadge: string
  corHeaderBg: string
}

export const STATUS_COMERCIAIS_CRM: StatusComercialConfig[] = [
  {
    id: 'Prospect',
    rotulo: 'Prospect',
    subtitulo: 'Contato inicial / sondagem comercial',
    corBorda: 'border-slate-300',
    corBadge: 'bg-slate-100 text-slate-800 border-slate-300',
    corHeaderBg: 'bg-slate-100 text-slate-900',
  },
  {
    id: 'Onboarding',
    rotulo: 'Onboarding',
    subtitulo: 'Entrada recente e implantação',
    corBorda: 'border-blue-300',
    corBadge: 'bg-blue-50 text-blue-800 border-blue-200',
    corHeaderBg: 'bg-blue-50 text-blue-900',
  },
  {
    id: 'Ativo',
    rotulo: 'Ativo',
    subtitulo: 'Cliente com serviço em execução',
    corBorda: 'border-emerald-300',
    corBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    corHeaderBg: 'bg-emerald-50 text-emerald-900',
  },
  {
    id: 'Inativo',
    rotulo: 'Inativo',
    subtitulo: 'Serviço pausado ou suspenso',
    corBorda: 'border-amber-300',
    corBadge: 'bg-amber-50 text-amber-800 border-amber-200',
    corHeaderBg: 'bg-amber-50 text-amber-900',
  },
  {
    id: 'Perdido',
    rotulo: 'Perdido',
    subtitulo: 'Negociação não concretizada',
    corBorda: 'border-rose-300',
    corBadge: 'bg-rose-50 text-rose-800 border-rose-200',
    corHeaderBg: 'bg-rose-50 text-rose-900',
  },
]

export type TipoInteracaoCrm = 'reuniao' | 'telefone' | 'email' | 'whatsapp' | 'outros'

export interface CrmClienteModel {
  id: string
  empresa_id?: string
  analista_responsavel: string
  status_comercial: StatusComercialCrm
  origem_contato?: string
  valor_mensal_servico?: number
  data_entrada?: string
  observacoes?: string
  dados_customizados_json?: Record<string, any>
  created: string
  updated: string
  expand?: {
    empresa_id?: ClienteEmpresaRecord
    analista_responsavel?: {
      id: string
      name?: string
      email?: string
      nivel_acesso?: string
    }
  }
}

export type CrmClienteRecord = CrmClienteModel & RecordModel

export interface CriarCrmClienteInput {
  empresa_id?: string
  analista_responsavel?: string
  status_comercial: StatusComercialCrm
  origem_contato?: string
  valor_mensal_servico?: number
  data_entrada?: string
  observacoes?: string
}

export interface CrmInteracaoModel {
  id: string
  crm_cliente_id: string
  usuario_id: string
  tipo: TipoInteracaoCrm
  data: string
  resumo: string
  proximo_passo?: string
  data_proximo_passo?: string
  created: string
  updated: string
  expand?: {
    usuario_id?: {
      id: string
      name?: string
      email?: string
    }
  }
}

export type CrmInteracaoRecord = CrmInteracaoModel & RecordModel

export interface CriarCrmInteracaoInput {
  crm_cliente_id: string
  tipo: TipoInteracaoCrm
  data: string
  resumo: string
  proximo_passo?: string
  data_proximo_passo?: string
}

/**
 * Ficha agregada do cliente no CRM com cruzamento automático
 * de diagnosticos, simulacoes_calculadora, recuperador e agendamentos.
 */
export interface CrmFichaAgregada {
  crmCliente: CrmClienteRecord
  empresa?: ClienteEmpresaRecord | null
  diagnosticos: DiagnosticoRecord[]
  simulacoesCalculadora: SimulacaoCalculadora[]
  simulacoesRecuperador: SimulacaoRecuperador[]
  reunioes: ReuniaoRecord[]
  interacoes: CrmInteracaoRecord[]
  temDiagnosticoConcluido: boolean
  totalCreditosRecuperador: number
  totalEconomiaAnualCalculadora: number
}

// =========================================================================
// Compatibilidade Legada (Funil Kanban e Tarefas da Fase 2 do Admin)
// =========================================================================

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
