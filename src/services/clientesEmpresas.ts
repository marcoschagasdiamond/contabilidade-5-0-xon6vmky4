import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'
import type { DadosEmpresaPerfil } from '@/types/dadosEmpresa'

export interface ClienteEmpresaModel {
  id?: string
  user_id?: string
  nome_contato: string
  nome_empresa: string
  cnpj: string
  email: string
  telefone: string
  uf_origem: string
  cidade: string
  segmento: string
  regime_atual?: string
  funcionarios?: string
  emissao_nf?: string
  atividade_mista?: boolean
  faturamento_mensal?: number
  percentual_compras_vendas?: number
  tipo_atividade?: string
  subatividade_servico?: string
  subatividade_industria?: string
  subatividade_comercio?: string
  proporcao_servico_misto?: number
  folha_pagamento_mensal?: number
  margem_lucro_estimada?: number
  despesas_creditos_mensais?: number
  percentual_exportacao?: number
  ano_base_transicao?: number
  created?: string
  updated?: string
}

export type ClienteEmpresaRecord = ClienteEmpresaModel & RecordModel

/**
 * Converte DadosEmpresaPerfil (camelCase) para o formato do banco (snake_case)
 */
export function perfilToRecord(
  perfil: Partial<DadosEmpresaPerfil>,
  userId?: string,
): Partial<ClienteEmpresaModel> {
  const result: Partial<ClienteEmpresaModel> = {}

  if (userId) result.user_id = userId
  if (perfil.nomeContato !== undefined) result.nome_contato = perfil.nomeContato
  if (perfil.nomeEmpresa !== undefined) result.nome_empresa = perfil.nomeEmpresa
  if (perfil.cnpj !== undefined) result.cnpj = perfil.cnpj
  if (perfil.email !== undefined) result.email = perfil.email
  if (perfil.telefone !== undefined) result.telefone = perfil.telefone
  if (perfil.ufOrigem !== undefined) result.uf_origem = perfil.ufOrigem
  if (perfil.cidade !== undefined) result.cidade = perfil.cidade
  if (perfil.segmento !== undefined) result.segmento = perfil.segmento
  if (perfil.regimeAtual !== undefined) result.regime_atual = perfil.regimeAtual
  if (perfil.funcionarios !== undefined) result.funcionarios = perfil.funcionarios
  if (perfil.emissaoNf !== undefined) result.emissao_nf = perfil.emissaoNf
  if (perfil.atividadeMista !== undefined) result.atividade_mista = perfil.atividadeMista
  if (perfil.faturamentoMensal !== undefined) result.faturamento_mensal = perfil.faturamentoMensal
  if (perfil.percentualComprasVendas !== undefined)
    result.percentual_compras_vendas = perfil.percentualComprasVendas
  if (perfil.tipoAtividade !== undefined) result.tipo_atividade = perfil.tipoAtividade
  if (perfil.subatividadeServico !== undefined)
    result.subatividade_servico = perfil.subatividadeServico
  if (perfil.subatividadeIndustria !== undefined)
    result.subatividade_industria = perfil.subatividadeIndustria
  if (perfil.subatividadeComercio !== undefined)
    result.subatividade_comercio = perfil.subatividadeComercio
  if (perfil.proporcaoServicoMisto !== undefined)
    result.proporcao_servico_misto = perfil.proporcaoServicoMisto
  if (perfil.folhaPagamentoMensal !== undefined)
    result.folha_pagamento_mensal = perfil.folhaPagamentoMensal
  if (perfil.margemLucroEstimada !== undefined)
    result.margem_lucro_estimada = perfil.margemLucroEstimada
  if (perfil.despesasComCreditosMensais !== undefined)
    result.despesas_creditos_mensais = perfil.despesasComCreditosMensais
  if (perfil.percentualExportacao !== undefined)
    result.percentual_exportacao = perfil.percentualExportacao
  if (perfil.anoBaseTransicao !== undefined) result.ano_base_transicao = perfil.anoBaseTransicao

  return result
}

/**
 * Converte o registro do banco para DadosEmpresaPerfil
 */
export function recordToPerfil(rec: ClienteEmpresaRecord): DadosEmpresaPerfil {
  return {
    nomeContato: rec.nome_contato || '',
    nomeEmpresa: rec.nome_empresa || '',
    cnpj: rec.cnpj || '',
    email: rec.email || '',
    telefone: rec.telefone || '',
    ufOrigem: rec.uf_origem || 'SP',
    cidade: rec.cidade || 'sp-sao-paulo',
    segmento: (rec.segmento as any) || 'Serviços',
    regimeAtual: rec.regime_atual || 'Simples Nacional',
    funcionarios: rec.funcionarios || '1 a 5 funcionários',
    emissaoNf: rec.emissao_nf || 'Predominante para Pessoas Jurídicas (B2B)',
    atividadeMista: !!rec.atividade_mista,
    faturamentoMensal: rec.faturamento_mensal ?? 200000,
    percentualComprasVendas: rec.percentual_compras_vendas ?? 40,
    tipoAtividade: (rec.tipo_atividade as any) || 'servico',
    subatividadeServico: (rec.subatividade_servico as any) || 'servico_comum',
    subatividadeIndustria: (rec.subatividade_industria as any) || 'industria_comum',
    subatividadeComercio: (rec.subatividade_comercio as any) || 'varejo_comum',
    proporcaoServicoMisto: rec.proporcao_servico_misto ?? 50,
    folhaPagamentoMensal: rec.folha_pagamento_mensal ?? 50000,
    margemLucroEstimada: rec.margem_lucro_estimada ?? 20,
    despesasComCreditosMensais: rec.despesas_creditos_mensais ?? 30000,
    percentualExportacao: rec.percentual_exportacao ?? 0,
    anoBaseTransicao: (rec.ano_base_transicao as any) || 2026,
    atualizadoEm: rec.updated || rec.created,
  }
}

/**
 * Busca o registro de Dados da Empresa do usuário autenticado (ou por user_id)
 */
export async function getClienteEmpresaPorUsuario(
  userId: string,
): Promise<ClienteEmpresaRecord | null> {
  try {
    const list = await pb.collection('clientes_empresas').getList<ClienteEmpresaRecord>(1, 1, {
      filter: `user_id = "${userId}"`,
    })
    return list.items[0] || null
  } catch (err) {
    console.warn('Registro de empresa não encontrado para o usuário:', err)
    return null
  }
}

/**
 * Salva ou atualiza os Dados da Empresa no banco vinculados ao usuário
 */
export async function salvarClienteEmpresaNoBanco(
  perfil: Partial<DadosEmpresaPerfil>,
  userId: string,
): Promise<ClienteEmpresaRecord> {
  const payload = perfilToRecord(perfil, userId)

  const existente = await getClienteEmpresaPorUsuario(userId)
  if (existente) {
    return await pb
      .collection('clientes_empresas')
      .update<ClienteEmpresaRecord>(existente.id, payload)
  }

  // Se for criação, garante campos obrigatórios básicos
  const createPayload: Record<string, any> = {
    user_id: userId,
    nome_contato: payload.nome_contato || 'Responsável',
    nome_empresa: payload.nome_empresa || 'Empresa',
    cnpj: payload.cnpj || '00.000.000/0000-00',
    email: payload.email || pb.authStore.record?.email || '',
    telefone: payload.telefone || '+55 (11) 99999-9999',
    uf_origem: payload.uf_origem || 'SP',
    cidade: payload.cidade || 'sp-sao-paulo',
    segmento: payload.segmento || 'Serviços',
    ...payload,
  }

  return await pb.collection('clientes_empresas').create<ClienteEmpresaRecord>(createPayload)
}

/**
 * Lista todos os clientes empresas (para o painel admin)
 */
export async function getTodosClientesEmpresas(): Promise<ClienteEmpresaRecord[]> {
  return await pb.collection('clientes_empresas').getFullList<ClienteEmpresaRecord>({
    sort: '-created',
  })
}

/**
 * Exclui registro de cliente empresa
 */
export async function deleteClienteEmpresa(id: string): Promise<boolean> {
  return await pb.collection('clientes_empresas').delete(id)
}
