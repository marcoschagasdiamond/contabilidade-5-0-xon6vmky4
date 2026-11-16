import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'
import type { DadosEmpresaPerfil } from '@/types/dadosEmpresa'
import type { Cliente } from '@/types/cliente'

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
  // Campos Fase 1
  perfil_insumos_aliquota_cheia?: number
  perfil_insumos_monofasicos?: number
  perfil_insumos_aliquota_reduzida?: number
  presenca_monofasicos?: boolean
  categorias_monofasicos?: string[]
  insumos_energeticos?: boolean
  intangiveis_royalties?: boolean
  imobilizado_ultimos_5_anos?: number
  imobilizado_anos_detalhe?: Record<string, number>
  // Campos Fase 2
  percentual_compras_sem_credito?: number
  saldo_credor_acumulado?: number
  percentual_vendas_interestaduais?: number
  regime_especial_atual?: string
  perfil_retencao_split?: string
  percentual_retencao_split?: number
  // Campos Fase 3
  autos_infracao_ativos?: boolean
  autos_infracao_quantidade?: number
  autos_infracao_valor?: number
  parcelamentos_em_curso?: boolean
  parcelamentos_quantidade?: number
  divida_ativa_execucao_fiscal?: boolean
  obrigacoes_acessorias_atraso?: boolean
  numero_filiais?: number
  ufs_operacao?: string[]
  documento_fiscal_importado?: any
  vinculos_societarios?: any
  cnaes_secundarios?: any
  vedacoes_simples_art17?: any
  vedacao_simples_outra?: string
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

  // Fase 1
  if (perfil.perfilInsumosAliquotaCheia !== undefined)
    result.perfil_insumos_aliquota_cheia = perfil.perfilInsumosAliquotaCheia
  if (perfil.perfilInsumosMonofasicos !== undefined)
    result.perfil_insumos_monofasicos = perfil.perfilInsumosMonofasicos
  if (perfil.perfilInsumosAliquotaReduzida !== undefined)
    result.perfil_insumos_aliquota_reduzida = perfil.perfilInsumosAliquotaReduzida
  if (perfil.presencaMonofasicos !== undefined)
    result.presenca_monofasicos = perfil.presencaMonofasicos
  if (perfil.categoriasMonofasicos !== undefined)
    result.categorias_monofasicos = perfil.categoriasMonofasicos
  if (perfil.insumosEnergeticos !== undefined)
    result.insumos_energeticos = perfil.insumosEnergeticos
  if (perfil.intangiveisRoyalties !== undefined)
    result.intangiveis_royalties = perfil.intangiveisRoyalties
  if (perfil.imobilizadoUltimos5Anos !== undefined)
    result.imobilizado_ultimos_5_anos = perfil.imobilizadoUltimos5Anos
  if (perfil.imobilizadoAnosDetalhe !== undefined)
    result.imobilizado_anos_detalhe = perfil.imobilizadoAnosDetalhe

  // Fase 2
  if (perfil.percentualComprasSemCredito !== undefined)
    result.percentual_compras_sem_credito = perfil.percentualComprasSemCredito
  if (perfil.saldoCredorAcumulado !== undefined)
    result.saldo_credor_acumulado = perfil.saldoCredorAcumulado
  if (perfil.percentualVendasInterestaduais !== undefined)
    result.percentual_vendas_interestaduais = perfil.percentualVendasInterestaduais
  if (perfil.regimeEspecialAtual !== undefined)
    result.regime_especial_atual = perfil.regimeEspecialAtual
  if (perfil.perfilRetencaoSplit !== undefined)
    result.perfil_retencao_split = perfil.perfilRetencaoSplit
  if (perfil.percentualRetencaoSplit !== undefined)
    result.percentual_retencao_split = perfil.percentualRetencaoSplit

  // Fase 3
  if (perfil.autosInfracaoAtivos !== undefined)
    result.autos_infracao_ativos = perfil.autosInfracaoAtivos
  if (perfil.autosInfracaoQuantidade !== undefined)
    result.autos_infracao_quantidade = perfil.autosInfracaoQuantidade
  if (perfil.autosInfracaoValor !== undefined)
    result.autos_infracao_valor = perfil.autosInfracaoValor
  if (perfil.parcelamentosEmCurso !== undefined)
    result.parcelamentos_em_curso = perfil.parcelamentosEmCurso
  if (perfil.parcelamentosQuantidade !== undefined)
    result.parcelamentos_quantidade = perfil.parcelamentosQuantidade
  if (perfil.dividaAtivaExecucaoFiscal !== undefined)
    result.divida_ativa_execucao_fiscal = perfil.dividaAtivaExecucaoFiscal
  if (perfil.obrigacoesAcessoriasAtraso !== undefined)
    result.obrigacoes_acessorias_atraso = perfil.obrigacoesAcessoriasAtraso
  if (perfil.numeroFiliais !== undefined) result.numero_filiais = perfil.numeroFiliais
  if (perfil.ufsOperacao !== undefined) result.ufs_operacao = perfil.ufsOperacao

  if (perfil.documentoFiscalImportado !== undefined)
    result.documento_fiscal_importado = perfil.documentoFiscalImportado

  if (perfil.certidoesFiscais !== undefined)
    (result as any).certidoes_fiscais = perfil.certidoesFiscais

  if (perfil.historicoDocumentosFiscais !== undefined)
    (result as any).historico_documentos_fiscais = perfil.historicoDocumentosFiscais

  if (perfil.vinculosSocietarios !== undefined)
    (result as any).vinculos_societarios = perfil.vinculosSocietarios

  if (perfil.cnaesSecundarios !== undefined)
    (result as any).cnaes_secundarios = perfil.cnaesSecundarios

  if (perfil.vedacoesSimplesArt17 !== undefined)
    (result as any).vedacoes_simples_art17 = perfil.vedacoesSimplesArt17

  if (perfil.vedacaoSimplesArt17Outra !== undefined)
    (result as any).vedacao_simples_outra = perfil.vedacaoSimplesArt17Outra

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
    // Fase 1: Perfil de Insumos
    // Quando os três percentuais estiverem zerados ou indefinidos (ex: registro antigo no banco),
    // trata como "não preenchido" e aplica 100/0/0 como padrão seguro
    perfilInsumosAliquotaCheia: (() => {
      const cheia = rec.perfil_insumos_aliquota_cheia
      const mono = rec.perfil_insumos_monofasicos
      const reduz = rec.perfil_insumos_aliquota_reduzida
      const todosZeradosOuIndefinidos =
        (cheia === 0 || cheia === undefined || cheia === null) &&
        (mono === 0 || mono === undefined || mono === null) &&
        (reduz === 0 || reduz === undefined || reduz === null)
      return todosZeradosOuIndefinidos ? 100 : (cheia ?? 100)
    })(),
    perfilInsumosMonofasicos: (() => {
      const cheia = rec.perfil_insumos_aliquota_cheia
      const mono = rec.perfil_insumos_monofasicos
      const reduz = rec.perfil_insumos_aliquota_reduzida
      const todosZeradosOuIndefinidos =
        (cheia === 0 || cheia === undefined || cheia === null) &&
        (mono === 0 || mono === undefined || mono === null) &&
        (reduz === 0 || reduz === undefined || reduz === null)
      return todosZeradosOuIndefinidos ? 0 : (mono ?? 0)
    })(),
    perfilInsumosAliquotaReduzida: (() => {
      const cheia = rec.perfil_insumos_aliquota_cheia
      const mono = rec.perfil_insumos_monofasicos
      const reduz = rec.perfil_insumos_aliquota_reduzida
      const todosZeradosOuIndefinidos =
        (cheia === 0 || cheia === undefined || cheia === null) &&
        (mono === 0 || mono === undefined || mono === null) &&
        (reduz === 0 || reduz === undefined || reduz === null)
      return todosZeradosOuIndefinidos ? 0 : (reduz ?? 0)
    })(),
    presencaMonofasicos: !!rec.presenca_monofasicos,
    categoriasMonofasicos: Array.isArray(rec.categorias_monofasicos)
      ? rec.categorias_monofasicos
      : typeof rec.categorias_monofasicos === 'string'
        ? (() => {
            try {
              return JSON.parse(rec.categorias_monofasicos)
            } catch {
              return []
            }
          })()
        : [],
    insumosEnergeticos: !!rec.insumos_energeticos,
    intangiveisRoyalties: !!rec.intangiveis_royalties,
    imobilizadoUltimos5Anos: rec.imobilizado_ultimos_5_anos ?? 0,
    imobilizadoAnosDetalhe:
      typeof rec.imobilizado_anos_detalhe === 'object' && rec.imobilizado_anos_detalhe !== null
        ? rec.imobilizado_anos_detalhe
        : typeof rec.imobilizado_anos_detalhe === 'string'
          ? (() => {
              try {
                return JSON.parse(rec.imobilizado_anos_detalhe)
              } catch {
                return {}
              }
            })()
          : {},
    // Fase 2: Refinamento Tributário & Operacional (valores neutros se indefinidos)
    percentualComprasSemCredito: rec.percentual_compras_sem_credito ?? 0,
    saldoCredorAcumulado: rec.saldo_credor_acumulado ?? 0,
    percentualVendasInterestaduais: rec.percentual_vendas_interestaduais ?? 0,
    regimeEspecialAtual: (rec.regime_especial_atual as any) || 'nenhum',
    perfilRetencaoSplit: (rec.perfil_retencao_split as any) || 'nao',
    percentualRetencaoSplit: rec.percentual_retencao_split ?? 0,
    // Fase 3: Situação Fiscal & Multi-UF (valores neutros se indefinidos)
    autosInfracaoAtivos: !!rec.autos_infracao_ativos,
    autosInfracaoQuantidade: rec.autos_infracao_quantidade ?? 0,
    autosInfracaoValor: rec.autos_infracao_valor ?? 0,
    parcelamentosEmCurso: !!rec.parcelamentos_em_curso,
    parcelamentosQuantidade: rec.parcelamentos_quantidade ?? 0,
    dividaAtivaExecucaoFiscal: !!rec.divida_ativa_execucao_fiscal,
    obrigacoesAcessoriasAtraso: !!rec.obrigacoes_acessorias_atraso,
    numeroFiliais: rec.numero_filiais && rec.numero_filiais > 0 ? rec.numero_filiais : 1,
    ufsOperacao: Array.isArray(rec.ufs_operacao)
      ? rec.ufs_operacao
      : typeof rec.ufs_operacao === 'string'
        ? (() => {
            try {
              const parsed = JSON.parse(rec.ufs_operacao)
              return Array.isArray(parsed) ? parsed : []
            } catch {
              return []
            }
          })()
        : [],
    documentoFiscalImportado:
      typeof rec.documento_fiscal_importado === 'object' && rec.documento_fiscal_importado !== null
        ? rec.documento_fiscal_importado
        : typeof rec.documento_fiscal_importado === 'string'
          ? (() => {
              try {
                return JSON.parse(rec.documento_fiscal_importado)
              } catch {
                return undefined
              }
            })()
          : undefined,
    certidoesFiscais: Array.isArray((rec as any).certidoes_fiscais)
      ? (rec as any).certidoes_fiscais
      : typeof (rec as any).certidoes_fiscais === 'string'
        ? (() => {
            try {
              const parsed = JSON.parse((rec as any).certidoes_fiscais)
              return Array.isArray(parsed) ? parsed : []
            } catch {
              return []
            }
          })()
        : [],
    historicoDocumentosFiscais: Array.isArray((rec as any).historico_documentos_fiscais)
      ? (rec as any).historico_documentos_fiscais
      : typeof (rec as any).historico_documentos_fiscais === 'string'
        ? (() => {
            try {
              const parsed = JSON.parse((rec as any).historico_documentos_fiscais)
              return Array.isArray(parsed) ? parsed : []
            } catch {
              return []
            }
          })()
        : [],
    vinculosSocietarios: Array.isArray((rec as any).vinculos_societarios)
      ? (rec as any).vinculos_societarios
      : typeof (rec as any).vinculos_societarios === 'string'
        ? (() => {
            try {
              const parsed = JSON.parse((rec as any).vinculos_societarios)
              return Array.isArray(parsed) ? parsed : []
            } catch {
              return []
            }
          })()
        : [],
    cnaesSecundarios: Array.isArray((rec as any).cnaes_secundarios)
      ? (rec as any).cnaes_secundarios
      : typeof (rec as any).cnaes_secundarios === 'string'
        ? (() => {
            try {
              const parsed = JSON.parse((rec as any).cnaes_secundarios)
              return Array.isArray(parsed) ? parsed : []
            } catch {
              return []
            }
          })()
        : [],
    vedacoesSimplesArt17: Array.isArray((rec as any).vedacoes_simples_art17)
      ? (rec as any).vedacoes_simples_art17
      : typeof (rec as any).vedacoes_simples_art17 === 'string'
        ? (() => {
            try {
              const parsed = JSON.parse((rec as any).vedacoes_simples_art17)
              return Array.isArray(parsed) ? parsed : []
            } catch {
              return []
            }
          })()
        : [],
    vedacaoSimplesArt17Outra: (rec as any).vedacao_simples_outra || '',
    atualizadoEm: rec.updated || rec.created,
  }
}

/**
 * Busca o registro de Dados da Empresa do usuário autenticado (ou por user_id)
 */
export async function getClienteEmpresaPorId(id: string): Promise<ClienteEmpresaRecord | null> {
  if (!id) return null
  try {
    const rec = await pb.collection('clientes_empresas').getOne<ClienteEmpresaRecord>(id)
    return rec
  } catch (err) {
    console.warn('Registro de empresa não encontrado por ID:', id, err)
    return null
  }
}

export async function getClienteEmpresaPorCnpj(cnpj: string): Promise<ClienteEmpresaRecord | null> {
  if (!cnpj) return null
  const limpo = cnpj.replace(/\D/g, '')
  try {
    const list = await pb.collection('clientes_empresas').getList<ClienteEmpresaRecord>(1, 1, {
      filter: `cnpj ~ "${limpo}" || cnpj = "${cnpj}"`,
    })
    return list.items[0] || null
  } catch (err) {
    console.warn('Registro de empresa não encontrado por CNPJ:', cnpj, err)
    return null
  }
}

export async function salvarClienteEmpresaPorId(
  id: string,
  perfil: Partial<DadosEmpresaPerfil>,
): Promise<ClienteEmpresaRecord> {
  let anterior: ClienteEmpresaRecord | null = null
  try {
    anterior = await pb
      .collection('clientes_empresas')
      .getOne<ClienteEmpresaRecord>(id)
      .catch(() => null)
  } catch {
    // ignore
  }

  const payload = perfilToRecord(perfil)
  const atualizado = await pb
    .collection('clientes_empresas')
    .update<ClienteEmpresaRecord>(id, payload)

  if (anterior) {
    import('@/services/historicoCliente')
      .then(({ calcularDiffGenerico, registrarEventoAuditoriaCliente }) => {
        const diffs = calcularDiffGenerico(anterior as any, payload as any)
        if (diffs.length > 0) {
          registrarEventoAuditoriaCliente({
            empresaId: atualizado.id,
            clienteId: atualizado.id,
            nomeEmpresa: atualizado.nome_empresa,
            cnpj: atualizado.cnpj,
            origemAjuste: 'edicao_cliente_empresa',
            descricao: `Edição em Dados da Empresa (${diffs.length} campo(s) alterado(s))`,
            alteracoes: diffs,
            snapshotAnterior: anterior as any,
            snapshotNovo: atualizado as any,
          }).catch((e) => console.warn('Erro ao registrar histórico de cliente_empresa:', e))
        }
      })
      .catch(() => {})
  }

  return atualizado
}

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
 * Localiza o registro de clientes_empresas do Cliente Ativo quando a sessão
 * do usuário logado não tem dados próprios (ex.: master visualizando cliente
 * cadastrado por outro técnico). A vinculação é feita por empresa_id, quando
 * existe, e cai para CNPJ e nome da empresa em sequência.
 */
export async function getClienteEmpresaPorClienteAtivo(
  cliente: Pick<Cliente, 'empresa_id' | 'cnpj_cpf' | 'nome'> | null | undefined,
): Promise<ClienteEmpresaRecord | null> {
  if (!cliente) return null

  if (cliente.empresa_id) {
    try {
      const porId = await getClienteEmpresaPorId(cliente.empresa_id)
      if (porId) return porId
    } catch (err) {
      console.warn('Registro de empresa não encontrado por empresa_id do cliente:', err)
    }
  }

  if (cliente.cnpj_cpf) {
    const porCnpj = await getClienteEmpresaPorCnpj(cliente.cnpj_cpf)
    if (porCnpj) return porCnpj
  }

  if (cliente.nome) {
    const limpo = cliente.nome.replace(/"/g, '\\"')
    try {
      const list = await pb
        .collection('clientes_empresas')
        .getList<ClienteEmpresaRecord>(1, 1, { filter: `nome_empresa ~ "${limpo}"` })
      return list.items[0] || null
    } catch (err) {
      console.warn('Registro de empresa não encontrado pelo nome do cliente:', err)
      return null
    }
  }

  return null
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
 * Alias de conveniência para listar todos os clientes empresas
 */
export async function listarClientesEmpresas(): Promise<ClienteEmpresaRecord[]> {
  return await getTodosClientesEmpresas()
}

/**
 * Exclui registro de cliente empresa
 */
export async function deleteClienteEmpresa(id: string): Promise<boolean> {
  return await pb.collection('clientes_empresas').delete(id)
}
