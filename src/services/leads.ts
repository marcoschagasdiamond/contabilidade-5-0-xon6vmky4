import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface Lead {
  id?: string
  nome: string
  email: string
  telefone: string
  empresa: string
  segmento:
    | 'Tecnologia'
    | 'Varejo'
    | 'Indústria'
    | 'Serviços'
    | 'Agronegócio'
    | 'Sociedade de Profissionais'
    | 'Outros'
    | string
  funcionarios: '1–5' | '6–20' | '21–50' | '51–200' | 'Mais de 200' | string
  mensagem?: string
  created?: string
  updated?: string
}

export type LeadRecord = Lead & RecordModel

export async function createLead(
  data: Omit<Lead, 'id' | 'created' | 'updated'>,
): Promise<LeadRecord> {
  const record = await pb.collection('leads').create<LeadRecord>(data)
  return record
}

export async function getLeads(): Promise<LeadRecord[]> {
  return await pb.collection('leads').getFullList<LeadRecord>({
    sort: '-created',
  })
}

export async function getLeadCount(): Promise<number> {
  const result = await pb.collection('leads').getList(1, 1, {
    fields: 'id',
  })
  return result.totalItems
}

export async function deleteLead(id: string): Promise<boolean> {
  return await pb.collection('leads').delete(id)
}
