import type { RecordModel } from 'pocketbase'

export interface Cliente {
  id: string
  user_id?: string
  nome: string
  cnpj_cpf: string
  uf: string
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
    | 'Outro'
    | string
  regime_atual: string
  email?: string
  telefone?: string
  arquivado?: boolean
  created?: string
  updated?: string
  estagio_funil?: 'lead' | 'diagnostico' | 'proposta' | 'cliente_ativo' | 'descartado'
  origem_lead?: string
  funil_atualizado_em?: string
  funil_atualizado_por?: string
  // Vínculos do CRM e dados finos da empresa
  empresa_id?: string
  crm_cliente_id?: string
  origem_fonte?: 'clientes' | 'crm_clientes' | 'clientes_empresas'
}

export type ClienteRecord = Cliente & RecordModel

export type ClienteInput = Omit<Cliente, 'id' | 'created' | 'updated'>
