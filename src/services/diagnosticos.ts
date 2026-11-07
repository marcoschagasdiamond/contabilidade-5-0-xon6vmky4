import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export type TipoDiagnostico = '360' | 'transicao' | 'regimes' | 'enquadramento'

export interface Diagnostico {
  id?: string
  user_id?: string
  cliente_id?: string | null
  tipo_diagnostico?: TipoDiagnostico | string
  nome: string
  email: string
  telefone: string
  empresa: string
  cnpj?: string
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
    | string
  rbt12: number
  folha12: number
  margem_lucro: number
  regime_recomendado: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | string
  carga_simples: number
  carga_presumido: number
  carga_real: number
  economia_anual?: number
  // Campos da Reforma Tributária (EC 132/2023, LC 214/2025)
  ano_base?: number
  sistema_recomendado_atual?: string
  sistema_recomendado_novo?: string
  carga_simples_novo?: number
  carga_presumido_novo?: number
  carga_real_novo?: number
  economia_anual_novo?: number
  detalhes_reforma_json?: Record<string, any>
  dados_extra_json?: Record<string, any>
  configuracoes_diagnostico_json?: {
    regime_atual?: string
    segmento?: string
    atividade_mista?: boolean
    proporcao_servico_misto?: number
    ano_base_transicao?: number
    uf_origem?: string
    cidade?: string
    funcionarios?: string
    emissao_nf?: string
    cnpj?: string
    razao_social?: string
    nome_contato?: string
  }
  // Novos campos do Módulo 3
  folha_pagamento?: number // folha mensal
  despesas_creditos?: number // despesas com créditos mensais
  percentual_exportacao?: number // % exportação
  uf_origem?: string // sigla UF
  aliquota_icms?: number // alíquota de ICMS da UF
  funcionarios?: string
  emissao_nf?: string
  atividade_mista?: boolean
  regime_atual?: string
  cidade?: string
  aliquota_iss?: number
  ranking_json?: Array<{
    posicao: number
    regime: string
    cargaAnual: number
    aliquotaEfetiva: number
    elegivel: boolean
    diferencaValor: number
    diferencaPercent: number
  }>
  created?: string
  updated?: string
}

export type DiagnosticoRecord = Diagnostico & RecordModel

const STORAGE_CLIENTE_ATIVO_ID_KEY = 'contabilidade50_cliente_ativo_id_v1'

/**
 * Garante o vínculo do diagnóstico com o Cliente Ativo (coleção 'diagnosticos'.cliente_id).
 * Quando o chamador não informa cliente_id (etapas antigas do Diagnóstico), recupera o
 * Cliente Ativo selecionado do localStorage (mesma chave usada pelo ClienteAtivoContext)
 * para que o registro NUNCA fique órfão quando há cliente selecionado.
 */
function resolverClienteId(data: { cliente_id?: string | null }): {
  clienteId: string
  veioDoFallback: boolean
} {
  const informado = (data.cliente_id || '').trim()
  if (informado) return { clienteId: informado, veioDoFallback: false }

  let doStorage = ''
  try {
    doStorage = (localStorage.getItem(STORAGE_CLIENTE_ATIVO_ID_KEY) || '').trim()
  } catch {
    doStorage = ''
  }
  return { clienteId: doStorage, veioDoFallback: Boolean(doStorage) }
}

export async function createDiagnostico(
  data: Omit<Diagnostico, 'id' | 'created' | 'updated'>,
): Promise<DiagnosticoRecord> {
  // Correção de diagnósticos órfãos: grava cliente_id sempre que houver Cliente Ativo
  const { clienteId, veioDoFallback } = resolverClienteId(data as { cliente_id?: string | null })
  const payload = { ...data, cliente_id: clienteId }

  if (!clienteId) {
    console.warn(
      '[Diagnósticos] Registro salvo SEM vínculo de cliente (cliente_id vazio): nenhum Cliente Ativo selecionado.',
    )
    try {
      window.dispatchEvent(
        new CustomEvent('contabilidade50_diagnostico_salvo_sem_vinculo', {
          detail: { tipo: (data as any).tipo_diagnostico || '' },
        }),
      )
    } catch {
      /* ambiente sem window — ignora */
    }
  } else if (veioDoFallback) {
    console.info('[Diagnósticos] cliente_id aplicado via Cliente Ativo do localStorage.')
  }

  const record = await pb.collection('diagnosticos').create<DiagnosticoRecord>(payload)

  // Se o usuário estiver autenticado, atualiza progresso de onboarding
  const userId = (data as any).user_id || pb.authStore.record?.id
  if (userId) {
    import('@/services/onboarding').then(({ salvarProgressoOnboarding }) => {
      salvarProgressoOnboarding(userId, { passo_diagnostico_concluido: true }).catch((e) =>
        console.warn('[Onboarding] Aviso ao atualizar passo diagnostico:', e),
      )
    })
  }

  return record
}

export async function getDiagnosticos(filter?: string): Promise<DiagnosticoRecord[]> {
  return await pb.collection('diagnosticos').getFullList<DiagnosticoRecord>({
    filter: filter || undefined,
    sort: '-created',
  })
}

export async function getDiagnosticoPorId(id: string): Promise<DiagnosticoRecord | null> {
  if (!id) return null
  try {
    return await pb.collection('diagnosticos').getOne<DiagnosticoRecord>(id)
  } catch (err) {
    console.warn(`Diagnóstico ${id} não encontrado:`, err)
    return null
  }
}

export async function atualizarDiagnostico(
  id: string,
  data: Partial<Diagnostico>,
): Promise<DiagnosticoRecord> {
  return await pb.collection('diagnosticos').update<DiagnosticoRecord>(id, data)
}

export async function getDiagnosticosPorCliente(clienteId: string): Promise<DiagnosticoRecord[]> {
  if (!clienteId) return []
  return await pb.collection('diagnosticos').getFullList<DiagnosticoRecord>({
    filter: `cliente_id = "${clienteId}"`,
    sort: '-created',
  })
}

/**
 * Fallback do Relatório Consolidado: busca diagnósticos da empresa vinculada
 * quando a busca por cliente_id volta vazia (ex.: registros salvos por outro
 * usuário sem vínculo de cliente_id — regras globais master/admin migração 0063).
 * Normaliza CNPJ para só dígitos e faz busca por nome (~) como alternativa.
 * Nunca lança: devolve [] em caso de erro para não quebrar a página.
 */
export async function buscarDiagnosticosPorEmpresa(
  nomeEmpresa?: string,
  cnpj?: string,
): Promise<DiagnosticoRecord[]> {
  const cnpjDigitos = (cnpj || '').replace(/\D/g, '')
  const nomeLimpo = (nomeEmpresa || '').trim()

  if (!cnpjDigitos && !nomeLimpo) return []

  const filtros: string[] = []
  if (cnpjDigitos) {
    // CNPJ pode estar salvo formatado ou não — cobre os dois casos
    filtros.push(`cnpj ~ "${cnpjDigitos}"`)
    try {
      const formatado = formatarCNPJString(cnpjDigitos)
      if (formatado !== cnpjDigitos) filtros.push(`cnpj ~ "${formatado}"`)
    } catch {
      /* CNPJ incompleto — usa só os dígitos */
    }
  }
  if (nomeLimpo) {
    const escapado = nomeLimpo.replace(/"/g, '\\"')
    filtros.push(`empresa ~ "${escapado}"`)
  }

  try {
    return await pb.collection('diagnosticos').getFullList<DiagnosticoRecord>({
      filter: filtros.join(' || '),
      sort: '-created',
    })
  } catch (err) {
    console.warn('[Diagnósticos] Erro ao buscar diagnósticos por empresa:', err)
    return []
  }
}

/** Formata dígitos de CNPJ como 00.000.000/0000-00 (para o filtro do PocketBase). */
function formatarCNPJString(digitos: string): string {
  const d = digitos.slice(0, 14).padStart(14, '0')
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`
}

export async function vincularDiagnosticoACliente(
  diagnosticoId: string,
  clienteId: string | null,
): Promise<DiagnosticoRecord> {
  return await pb.collection('diagnosticos').update<DiagnosticoRecord>(diagnosticoId, {
    cliente_id: clienteId || '',
  })
}

export async function getDiagnosticoCount(): Promise<number> {
  const result = await pb.collection('diagnosticos').getList(1, 1, {
    fields: 'id',
  })
  return result.totalItems
}

export async function deleteDiagnostico(id: string): Promise<boolean> {
  return await pb.collection('diagnosticos').delete(id)
}

export type EtapaDiagnosticoIdentificador =
  | 'configuracoes'
  | 'autoavaliacao'
  | 'transicao'
  | 'regimes'
  | 'enquadramento'

/**
 * Remove a etapa individual de diagnóstico de um cliente.
 * - 'configuracoes': limpa configuracoes_diagnostico_json nos registros vinculados e, se ativo, limpa localStorage.
 * - 'autoavaliacao': exclui registros com tipo_diagnostico '360' ou 'autoavaliacao'.
 * - 'transicao': exclui registros com tipo_diagnostico 'transicao'.
 * - 'regimes': exclui registros com tipo_diagnostico 'regimes'.
 * - 'enquadramento': exclui registros com tipo_diagnostico 'enquadramento' ou sem tipo_diagnostico definido.
 */
/**
 * Exclui todos os diagnósticos de Transição Fiscal (tipo_diagnostico = 'transicao')
 * por clienteId, userId e/ou diagnosticoId específico.
 */
export async function excluirDiagnosticoTransicao(params: {
  clienteId?: string | null
  userId?: string | null
  diagnosticoId?: string | null
}): Promise<{ success: boolean; totalRemovidos: number }> {
  let totalRemovidos = 0

  // 1. Se foi informado um diagnosticoId específico
  if (params.diagnosticoId) {
    try {
      await pb.collection('diagnosticos').delete(params.diagnosticoId)
      totalRemovidos++
    } catch (err) {
      console.warn(`Erro ao excluir diagnóstico por id ${params.diagnosticoId}:`, err)
    }
  }

  // 2. Se foi informado clienteId
  if (params.clienteId) {
    try {
      const res = await excluirEtapaDiagnosticoPorCliente(params.clienteId, 'transicao')
      totalRemovidos += res.totalRemovidos
    } catch (err) {
      console.warn(`Erro ao excluir etapa transicao do cliente ${params.clienteId}:`, err)
    }
  }

  // 3. Se foi informado userId (e/ou sem clienteId)
  if (params.userId) {
    try {
      const lista = await pb.collection('diagnosticos').getFullList<DiagnosticoRecord>({
        filter: `user_id = "${params.userId}" && tipo_diagnostico = "transicao"`,
      })
      for (const d of lista) {
        try {
          await pb.collection('diagnosticos').delete(d.id)
          totalRemovidos++
        } catch (e) {
          console.warn(`Erro ao excluir diagnóstico de transição ${d.id}:`, e)
        }
      }
    } catch (err) {
      console.warn(`Erro ao listar transição do user ${params.userId}:`, err)
    }
  }

  return { success: true, totalRemovidos }
}

export async function excluirEtapaDiagnosticoPorCliente(
  clienteId: string,
  etapa: EtapaDiagnosticoIdentificador,
): Promise<{ success: boolean; totalRemovidos: number }> {
  if (!clienteId) return { success: false, totalRemovidos: 0 }

  try {
    const lista = await getDiagnosticosPorCliente(clienteId)
    let totalRemovidos = 0

    if (etapa === 'configuracoes') {
      // Remove o snapshot de configurações dos diagnósticos vinculados
      for (const diag of lista) {
        if (
          diag.configuracoes_diagnostico_json &&
          Object.keys(diag.configuracoes_diagnostico_json).length > 0
        ) {
          try {
            await pb.collection('diagnosticos').update(diag.id, {
              configuracoes_diagnostico_json: null,
            })
            totalRemovidos++
          } catch (err) {
            console.warn(`Erro ao limpar configuracoes do diagnostico ${diag.id}:`, err)
          }
        }
      }
      return { success: true, totalRemovidos }
    }

    const matchesEtapa = (d: DiagnosticoRecord): boolean => {
      const tipo = d.tipo_diagnostico
      if (etapa === 'autoavaliacao') {
        return tipo === '360' || tipo === 'autoavaliacao'
      }
      if (etapa === 'transicao') {
        return tipo === 'transicao'
      }
      if (etapa === 'regimes') {
        return tipo === 'regimes'
      }
      if (etapa === 'enquadramento') {
        return tipo === 'enquadramento' || !tipo
      }
      return false
    }

    const alvos = lista.filter(matchesEtapa)
    for (const d of alvos) {
      try {
        await pb.collection('diagnosticos').delete(d.id)
        totalRemovidos++
      } catch (err) {
        console.warn(`Erro ao excluir diagnóstico ${d.id} da etapa ${etapa}:`, err)
      }
    }

    return { success: true, totalRemovidos }
  } catch (err) {
    console.error(`Erro ao excluir etapa ${etapa} do cliente ${clienteId}:`, err)
    return { success: false, totalRemovidos: 0 }
  }
}

/**
 * Exclui a trilha completa de diagnósticos tributários vinculada a um cliente:
 * 1. Registros das etapas de diagnósticos (360/Autoavaliação, Transição, Comparação, Enquadramento e snapshots de Configurações).
 * 2. Todas as versões arquivadas do relatório consolidado (coleção historico_relatorios_diagnostico + local).
 */
export async function excluirDiagnosticoCompletoPorCliente(params: {
  clienteId?: string | null
  empresaNome?: string | null
  clienteNome?: string | null
  diagnosticoId?: string | null
}): Promise<{
  success: boolean
  totalDiagnosticosExcluidos: number
  totalRelatoriosExcluidos: number
}> {
  let totalDiagnosticosExcluidos = 0
  let totalRelatoriosExcluidos = 0

  try {
    // 1. Localiza os diagnósticos vinculados por clienteId ou pelo registro do diagnóstico
    const diagsParaRemover: DiagnosticoRecord[] = []

    if (params.clienteId) {
      const diagsDoCliente = await getDiagnosticosPorCliente(params.clienteId)
      diagsParaRemover.push(...diagsDoCliente)
    }

    // Se tiver diagnosticoId pontual e ainda não estiver na lista
    if (params.diagnosticoId) {
      if (!diagsParaRemover.some((d) => d.id === params.diagnosticoId)) {
        const diagPontual = await getDiagnosticoPorId(params.diagnosticoId)
        if (diagPontual) {
          diagsParaRemover.push(diagPontual)
          // Se esse diagnóstico tiver cliente_id ou empresa, busca irmãos para garantir apagar a trilha toda
          if (diagPontual.cliente_id && !params.clienteId) {
            const irmaos = await getDiagnosticosPorCliente(diagPontual.cliente_id)
            for (const irm of irmaos) {
              if (!diagsParaRemover.some((d) => d.id === irm.id)) {
                diagsParaRemover.push(irm)
              }
            }
          }
        }
      }
    }

    // Se foi passado empresaNome mas sem clienteId, busca diagnósticos que batam com a empresa
    if (params.empresaNome && diagsParaRemover.length === 0) {
      try {
        const porEmpresa = await pb.collection('diagnosticos').getFullList<DiagnosticoRecord>({
          filter: `empresa = "${params.empresaNome.replace(/"/g, '\\"')}"`,
        })
        diagsParaRemover.push(...porEmpresa)
      } catch (e) {
        console.warn('Erro ao buscar diagnósticos por nome de empresa:', e)
      }
    }

    // Exclui todos os diagnósticos identificados
    for (const diag of diagsParaRemover) {
      try {
        await pb.collection('diagnosticos').delete(diag.id)
        totalDiagnosticosExcluidos++
      } catch (err) {
        console.warn(`Erro ao excluir diagnóstico ${diag.id}:`, err)
      }
    }

    // 2. Exclui versões arquivadas do relatório consolidado
    // Importa dinamicamente ou executa via PocketBase para evitar ciclo
    try {
      const { excluirHistoricoRelatoriosPorCliente } =
        await import('@/services/historicoRelatorios')
      totalRelatoriosExcluidos = await excluirHistoricoRelatoriosPorCliente({
        clienteId: params.clienteId,
        empresaNome: params.empresaNome,
        clienteNome: params.clienteNome,
      })
    } catch (errRel) {
      console.warn('Erro ao excluir histórico de relatórios:', errRelRef(errRel))
    }

    return {
      success: true,
      totalDiagnosticosExcluidos,
      totalRelatoriosExcluidos,
    }
  } catch (err) {
    console.error('Erro ao excluir diagnóstico completo do cliente:', err)
    return {
      success: false,
      totalDiagnosticosExcluidos,
      totalRelatoriosExcluidos,
    }
  }
}

function errRelRef(err: unknown) {
  return err instanceof Error ? err.message : String(err)
}
