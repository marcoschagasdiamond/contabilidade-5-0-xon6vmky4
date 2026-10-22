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
  created?: string
  updated?: string
}

export type ClienteRecord = Cliente & RecordModel

export type ClienteInput = Omit<Cliente, 'id' | 'created' | 'updated'>
