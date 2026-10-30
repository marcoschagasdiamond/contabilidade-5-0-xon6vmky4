import pb from '@/lib/pocketbase/client'
import type {
  CrmClienteRecord,
  CriarCrmClienteInput,
  CrmInteracaoRecord,
  CriarCrmInteracaoInput,
  StatusComercialCrm,
  CrmFichaAgregada,
  CrmAnotacao,
  CrmAnotacaoRecord,
  CrmTarefa,
  CrmTarefaRecord,
  EstagioFunilCrm,
  StatusTarefaCrm,
  CriarAnotacaoInput,
  CriarTarefaInput,
} from '@/types/crm'
import type { ClienteEmpresaRecord } from '@/services/clientesEmpresas'
import type { DiagnosticoRecord } from '@/services/diagnosticos'
import type { SimulacaoCalculadora } from '@/types/simulacaoCalculadora'
import type { SimulacaoRecuperador } from '@/types/recuperadorCreditos'
import type { ReuniaoRecord } from '@/types/reunioes'

// =========================================================================
// CRM FASE 3: CRM_CLIENTES & CRM_INTERACOES
// =========================================================================

/**
 * Lista todos os clientes do CRM aos quais o usuário logado tem acesso.
 * Analista: apenas os registros sob sua responsabilidade.
 * Master / Admin: vê todos os registros de todas as carteiras.
 */
export async function listarCrmClientes(): Promise<CrmClienteRecord[]> {
  const authUser = pb.authStore.record
  if (!authUser) return []

  const nivel = (authUser as any).nivel_acesso || (authUser as any).role
  const isMasterOrAdmin =
    nivel === 'master' ||
    nivel === 'admin' ||
    (authUser as any).role === 'admin' ||
    authUser.email?.toLowerCase() === 'marcoschagasdiamond@icloud.com'

  try {
    const filter = isMasterOrAdmin ? '' : `analista_responsavel = "${authUser.id}"`

    const records = await pb.collection('crm_clientes').getFullList<CrmClienteRecord>({
      filter: filter || undefined,
      sort: '-created',
      expand: 'empresa_id,analista_responsavel',
    })

    return records
  } catch (err) {
    console.warn('Erro ao listar clientes do CRM:', err)
    return []
  }
}

/**
 * Obtém uma ficha do CRM por ID com expansão da empresa e analista responsável.
 */
export async function obterCrmClientePorId(id: string): Promise<CrmClienteRecord | null> {
  if (!id) return null
  try {
    const record = await pb.collection('crm_clientes').getOne<CrmClienteRecord>(id, {
      expand: 'empresa_id,analista_responsavel',
    })
    return record
  } catch (err) {
    console.warn(`Erro ao carregar ficha CRM ${id}:`, err)
    return null
  }
}

/**
 * Cria uma nova ficha no CRM.
 * Pode estar vinculada a uma empresa existente (empresa_id de clientes_empresas)
 * ou criada diretamente para prospecção.
 */
export async function criarCrmCliente(input: CriarCrmClienteInput): Promise<CrmClienteRecord> {
  const authUser = pb.authStore.record
  if (!authUser) {
    throw new Error('Usuário precisa estar autenticado para criar ficha no CRM.')
  }

  const payload: Record<string, any> = {
    analista_responsavel: input.analista_responsavel || authUser.id,
    status_comercial: input.status_comercial,
    origem_contato: input.origem_contato?.trim() || '',
    valor_mensal_servico:
      typeof input.valor_mensal_servico === 'number' ? input.valor_mensal_servico : 0,
    data_entrada: input.data_entrada || new Date().toISOString().slice(0, 10),
    observacoes: input.observacoes?.trim() || '',
  }

  if (input.empresa_id) {
    payload.empresa_id = input.empresa_id
  }

  const record = await pb.collection('crm_clientes').create<CrmClienteRecord>(payload, {
    expand: 'empresa_id,analista_responsavel',
  })
  return record
}

/**
 * Atualiza campos da ficha do CRM (status comercial, valor mensal, origem, observações).
 */
export async function atualizarCrmCliente(
  id: string,
  dados: Partial<CriarCrmClienteInput>,
): Promise<CrmClienteRecord> {
  const payload: Record<string, any> = {}
  if (dados.status_comercial !== undefined) payload.status_comercial = dados.status_comercial
  if (dados.origem_contato !== undefined) payload.origem_contato = dados.origem_contato
  if (dados.valor_mensal_servico !== undefined)
    payload.valor_mensal_servico = dados.valor_mensal_servico
  if (dados.data_entrada !== undefined) payload.data_entrada = dados.data_entrada
  if (dados.observacoes !== undefined) payload.observacoes = dados.observacoes
  if (dados.empresa_id !== undefined) payload.empresa_id = dados.empresa_id

  const record = await pb.collection('crm_clientes').update<CrmClienteRecord>(id, payload, {
    expand: 'empresa_id,analista_responsavel',
  })
  return record
}

/**
 * Exclui ficha do CRM.
 */
export async function excluirCrmCliente(id: string): Promise<boolean> {
  await pb.collection('crm_clientes').delete(id)
  return true
}

/**
 * Lista a timeline de interações vinculada a uma ficha do CRM.
 */
export async function listarInteracoesCrm(crmClienteId: string): Promise<CrmInteracaoRecord[]> {
  if (!crmClienteId) return []
  try {
    const records = await pb.collection('crm_interacoes').getFullList<CrmInteracaoRecord>({
      filter: `crm_cliente_id = "${crmClienteId}"`,
      sort: '-data,-created',
      expand: 'usuario_id',
    })
    return records
  } catch (err) {
    console.warn(`Erro ao listar interações da ficha ${crmClienteId}:`, err)
    return []
  }
}

/**
 * Cria uma nova interação na timeline da ficha.
 */
export async function criarInteracaoCrm(
  input: CriarCrmInteracaoInput,
): Promise<CrmInteracaoRecord> {
  const authUser = pb.authStore.record
  if (!authUser) {
    throw new Error('Usuário autenticado obrigatório para registrar interação.')
  }

  const payload: Record<string, any> = {
    crm_cliente_id: input.crm_cliente_id,
    usuario_id: authUser.id,
    tipo: input.tipo,
    data: input.data || new Date().toISOString().slice(0, 10),
    resumo: input.resumo.trim(),
    proximo_passo: input.proximo_passo?.trim() || '',
  }

  if (input.data_proximo_passo) {
    payload.data_proximo_passo = input.data_proximo_passo
  }

  const record = await pb.collection('crm_interacoes').create<CrmInteracaoRecord>(payload, {
    expand: 'usuario_id',
  })
  return record
}

/**
 * Exclui uma interação da timeline.
 */
export async function excluirInteracaoCrm(interacaoId: string): Promise<boolean> {
  await pb.collection('crm_interacoes').delete(interacaoId)
  return true
}

/**
 * DIFERENCIAL CHAVE: Ficha Agregada do CRM com cruzamento automático sem digitação manual.
 * Puxa dados da empresa (clientes_empresas), trilha 360° (diagnosticos),
 * simulações da calculadora (simulacoes_calculadora), levantamentos de créditos (simulacoes_recuperador),
 * agendamento de reuniões (reunioes) e timeline de interações (crm_interacoes).
 */
export async function carregarFichaAgregadaCrm(
  crmClienteId: string,
): Promise<CrmFichaAgregada | null> {
  const crmCliente = await obterCrmClientePorId(crmClienteId)
  if (!crmCliente) return null

  // Empresa vinculada (via expand ou busca)
  let empresa: ClienteEmpresaRecord | null = (crmCliente as any).expand?.empresa_id || null
  if (!empresa && crmCliente.empresa_id) {
    try {
      empresa = await pb
        .collection('clientes_empresas')
        .getOne<ClienteEmpresaRecord>(crmCliente.empresa_id)
    } catch {
      /* intentionally ignored */
    }
  }

  const empresaUserId = empresa?.user_id || ''
  const cnpjLimpo = empresa?.cnpj?.replace(/\D/g, '') || ''
  const nomeEmpresa = empresa?.nome_empresa?.trim().toLowerCase() || ''
  const emailEmpresa = empresa?.email?.trim().toLowerCase() || ''

  // Buscar interações específicas deste crmCliente
  const interacoes = await listarInteracoesCrm(crmClienteId)

  // Consultar coleções com cruzamento amplo (user_id, cnpj, empresa ou cliente_id)
  const filtrosDiag: string[] = []
  if (empresaUserId) filtrosDiag.push(`user_id = "${empresaUserId}"`)
  if (cnpjLimpo) filtrosDiag.push(`cnpj ~ "${cnpjLimpo}"`)
  if (emailEmpresa) filtrosDiag.push(`email = "${emailEmpresa}"`)
  if (nomeEmpresa) filtrosDiag.push(`empresa ~ "${empresa?.nome_empresa?.replace(/"/g, '')}"`)

  let diagnosticos: DiagnosticoRecord[] = []
  if (filtrosDiag.length > 0) {
    try {
      diagnosticos = await pb.collection('diagnosticos').getFullList<DiagnosticoRecord>({
        filter: filtrosDiag.join(' || '),
        sort: '-created',
      })
    } catch (e) {
      console.warn('Erro ao cruzar diagnósticos no CRM:', e)
    }
  }

  // Simulações da Calculadora IBS/CBS
  const filtrosCalc: string[] = []
  if (empresaUserId) filtrosCalc.push(`user_id = "${empresaUserId}"`)
  if (cnpjLimpo) filtrosCalc.push(`cnpj ~ "${cnpjLimpo}"`)
  if (nomeEmpresa) filtrosCalc.push(`empresa ~ "${empresa?.nome_empresa?.replace(/"/g, '')}"`)

  let simulacoesCalculadora: SimulacaoCalculadora[] = []
  if (filtrosCalc.length > 0) {
    try {
      const records = await pb.collection('simulacoes_calculadora').getFullList<any>({
        filter: filtrosCalc.join(' || '),
        sort: '-created',
      })
      simulacoesCalculadora = records.map((rec) => {
        let parametros = {}
        let resultados = {}
        try {
          parametros =
            typeof rec.parametros_json === 'string'
              ? JSON.parse(rec.parametros_json)
              : rec.parametros_json || {}
        } catch {
          /* intentionally ignored */
        }
        try {
          resultados =
            typeof rec.resultados_json === 'string'
              ? JSON.parse(rec.resultados_json)
              : rec.resultados_json || {}
        } catch {
          /* intentionally ignored */
        }
        return {
          id: rec.id,
          user_id: rec.user_id,
          cliente_id: rec.cliente_id || null,
          nome: rec.nome,
          empresa: rec.empresa || '',
          cnpj: rec.cnpj || '',
          parametros: parametros as any,
          resultados: resultados as any,
          regime_recomendado: rec.regime_recomendado,
          economia_anual: rec.economia_anual,
          aliquota_efetiva: rec.aliquota_efetiva,
          faturamento_mensal: rec.faturamento_mensal,
          ano_base: rec.ano_base,
          created: rec.created,
          updated: rec.updated,
          origem: 'nuvem',
        }
      })
    } catch (e) {
      console.warn('Erro ao cruzar simulações da calculadora no CRM:', e)
    }
  }

  // Simulações do Recuperador de Créditos
  let simulacoesRecuperador: SimulacaoRecuperador[] = []
  if (filtrosCalc.length > 0) {
    try {
      const records = await pb.collection('simulacoes_recuperador').getFullList<any>({
        filter: filtrosCalc.join(' || '),
        sort: '-created',
      })
      simulacoesRecuperador = records.map((rec) => {
        let parametros = {}
        let resultados = {}
        try {
          parametros =
            typeof rec.parametros_json === 'string'
              ? JSON.parse(rec.parametros_json)
              : rec.parametros_json || {}
        } catch {
          /* intentionally ignored */
        }
        try {
          resultados =
            typeof rec.resultados_json === 'string'
              ? JSON.parse(rec.resultados_json)
              : rec.resultados_json || {}
        } catch {
          /* intentionally ignored */
        }
        return {
          id: rec.id,
          user_id: rec.user_id,
          cliente_id: rec.cliente_id || null,
          nome: rec.nome,
          empresa: rec.empresa || '',
          cnpj: rec.cnpj || '',
          regime_atual: rec.regime_atual || '',
          parametros: parametros as any,
          resultados: resultados as any,
          total_recuperavel_integral: rec.total_recuperavel_integral || 0,
          total_recuperavel_conservador: rec.total_recuperavel_conservador || 0,
          total_pis_cofins: rec.total_pis_cofins || 0,
          total_folha: rec.total_folha || 0,
          total_irpj_csll: rec.total_irpj_csll || 0,
          total_outros_tributos: rec.total_outros_tributos || 0,
          created: rec.created,
          updated: rec.updated,
          origem: 'nuvem',
        }
      })
    } catch (e) {
      console.warn('Erro ao cruzar simulações do recuperador no CRM:', e)
    }
  }

  // Reuniões agendadas
  const filtrosReuniao: string[] = []
  if (empresaUserId) filtrosReuniao.push(`user_id = "${empresaUserId}"`)
  if (emailEmpresa) filtrosReuniao.push(`cliente_email = "${emailEmpresa}"`)
  if (nomeEmpresa) filtrosReuniao.push(`empresa ~ "${empresa?.nome_empresa?.replace(/"/g, '')}"`)

  let reunioes: ReuniaoRecord[] = []
  if (filtrosReuniao.length > 0) {
    try {
      reunioes = await pb.collection('reunioes').getFullList<ReuniaoRecord>({
        filter: filtrosReuniao.join(' || '),
        sort: '-data,-horario',
      })
    } catch (e) {
      console.warn('Erro ao cruzar reuniões no CRM:', e)
    }
  }

  // Cálculos consolidados
  const totalCreditosRecuperador = simulacoesRecuperador.reduce(
    (acc, curr) => acc + (curr.total_recuperavel_integral || 0),
    0,
  )

  const totalEconomiaAnualCalculadora = simulacoesCalculadora.reduce(
    (acc, curr) => acc + (curr.economia_anual || 0),
    0,
  )

  const temDiagnosticoConcluido = diagnosticos.some(
    (d) =>
      d.regime_recomendado || d.dados_extra_json || d.detalhes_reforma_json || d.carga_simples > 0,
  )

  return {
    crmCliente,
    empresa,
    diagnosticos,
    simulacoesCalculadora,
    simulacoesRecuperador,
    reunioes,
    interacoes,
    temDiagnosticoConcluido,
    totalCreditosRecuperador,
    totalEconomiaAnualCalculadora,
  }
}

// =========================================================================
// Funções Legadas (crm_anotacoes e crm_tarefas da Fase 2 para retrocompatibilidade)
// =========================================================================

export async function atualizarEstagioFunilCliente(params: {
  clienteId: string
  collectionOrigem?: 'clientes' | 'clientes_empresas'
  estagio: EstagioFunilCrm
  origemLead?: string
  usuarioId?: string
}): Promise<{ success: boolean; estagio: EstagioFunilCrm; atualizadoEm: string }> {
  const { clienteId, collectionOrigem = 'clientes', estagio, origemLead, usuarioId } = params

  const nowIso = new Date().toISOString()
  const payload: Record<string, any> = {
    estagio_funil: estagio,
    funil_atualizado_em: nowIso,
  }

  const userId = usuarioId || pb.authStore.record?.id
  if (userId) {
    payload.funil_atualizado_por = userId
  }
  if (origemLead !== undefined) {
    payload.origem_lead = origemLead
  }

  try {
    const colName = collectionOrigem === 'clientes_empresas' ? 'clientes_empresas' : 'clientes'
    await pb.collection(colName).update(clienteId, payload)
    return { success: true, estagio, atualizadoEm: nowIso }
  } catch (err) {
    const altCol = collectionOrigem === 'clientes_empresas' ? 'clientes' : 'clientes_empresas'
    try {
      await pb.collection(altCol).update(clienteId, payload)
      return { success: true, estagio, atualizadoEm: nowIso }
    } catch (fallbackErr) {
      console.error('Erro ao atualizar estágio de funil:', fallbackErr || err)
      throw err
    }
  }
}

export async function listarAnotacoesCliente(params: {
  clienteId: string
  collectionOrigem?: 'clientes' | 'clientes_empresas'
}): Promise<CrmAnotacao[]> {
  const { clienteId, collectionOrigem } = params
  if (!clienteId) return []

  try {
    const filter =
      collectionOrigem === 'clientes_empresas'
        ? `cliente_empresa_id = "${clienteId}" || cliente = "${clienteId}"`
        : `cliente = "${clienteId}" || cliente_empresa_id = "${clienteId}"`

    const records = await pb.collection('crm_anotacoes').getFullList<CrmAnotacaoRecord>({
      filter,
      sort: '-created',
      expand: 'autor',
    })

    return records.map((rec) => {
      const autorExpand = (rec as any).expand?.autor
      return {
        id: rec.id,
        cliente: rec.cliente,
        cliente_empresa_id: rec.cliente_empresa_id,
        autor: rec.autor,
        autor_nome: autorExpand?.name || autorExpand?.email || 'Autor',
        autor_email: autorExpand?.email,
        texto: rec.texto,
        created: rec.created,
        updated: rec.updated,
      }
    })
  } catch (err) {
    console.warn('Erro ao listar anotações do CRM:', err)
    return []
  }
}

export async function criarAnotacaoCliente(input: CriarAnotacaoInput): Promise<CrmAnotacao> {
  const authUser = pb.authStore.record
  if (!authUser) {
    throw new Error('Usuário precisa estar autenticado para criar anotações.')
  }

  const payload: Record<string, any> = {
    autor: authUser.id,
    texto: input.texto.trim(),
  }

  if (input.collectionOrigem === 'clientes_empresas') {
    payload.cliente_empresa_id = input.clienteId
  } else {
    payload.cliente = input.clienteId
    payload.cliente_empresa_id = input.clienteId
  }

  const rec = await pb.collection('crm_anotacoes').create<CrmAnotacaoRecord>(payload, {
    expand: 'autor',
  })

  const autorExpand = (rec as any).expand?.autor
  return {
    id: rec.id,
    cliente: rec.cliente,
    cliente_empresa_id: rec.cliente_empresa_id,
    autor: rec.autor,
    autor_nome: autorExpand?.name || authUser.name || authUser.email,
    autor_email: autorExpand?.email || authUser.email,
    texto: rec.texto,
    created: rec.created,
    updated: rec.updated,
  }
}

export async function excluirAnotacao(anotacaoId: string): Promise<boolean> {
  await pb.collection('crm_anotacoes').delete(anotacaoId)
  return true
}

export async function listarTarefasCliente(params: {
  clienteId: string
  collectionOrigem?: 'clientes' | 'clientes_empresas'
}): Promise<CrmTarefa[]> {
  const { clienteId, collectionOrigem } = params
  if (!clienteId) return []

  try {
    const filter =
      collectionOrigem === 'clientes_empresas'
        ? `cliente_empresa_id = "${clienteId}" || cliente = "${clienteId}"`
        : `cliente = "${clienteId}" || cliente_empresa_id = "${clienteId}"`

    const records = await pb.collection('crm_tarefas').getFullList<CrmTarefaRecord>({
      filter,
      sort: 'status,-created',
      expand: 'responsavel,autor',
    })

    return records.map((rec) => {
      const respExpand = (rec as any).expand?.responsavel
      const autorExpand = (rec as any).expand?.autor
      return {
        id: rec.id,
        cliente: rec.cliente,
        cliente_empresa_id: rec.cliente_empresa_id,
        titulo: rec.titulo,
        descricao: rec.descricao,
        prazo: rec.prazo,
        responsavel: rec.responsavel,
        responsavel_nome: respExpand?.name || respExpand?.email,
        responsavel_email: respExpand?.email,
        status: rec.status,
        autor: rec.autor,
        autor_nome: autorExpand?.name || autorExpand?.email,
        concluida_em: rec.concluida_em,
        created: rec.created,
        updated: rec.updated,
      }
    })
  } catch (err) {
    console.warn('Erro ao listar tarefas do CRM:', err)
    return []
  }
}

export async function criarTarefaCliente(input: CriarTarefaInput): Promise<CrmTarefa> {
  const authUser = pb.authStore.record
  if (!authUser) {
    throw new Error('Usuário precisa estar autenticado para criar tarefas.')
  }

  const payload: Record<string, any> = {
    titulo: input.titulo.trim(),
    descricao: input.descricao?.trim() || '',
    prazo: input.prazo || null,
    responsavel: input.responsavelId || authUser.id,
    status: 'pendente',
    autor: authUser.id,
  }

  if (input.collectionOrigem === 'clientes_empresas') {
    payload.cliente_empresa_id = input.clienteId
  } else {
    payload.cliente = input.clienteId
    payload.cliente_empresa_id = input.clienteId
  }

  const rec = await pb.collection('crm_tarefas').create<CrmTarefaRecord>(payload, {
    expand: 'responsavel,autor',
  })

  const respExpand = (rec as any).expand?.responsavel
  const autorExpand = (rec as any).expand?.autor

  return {
    id: rec.id,
    cliente: rec.cliente,
    cliente_empresa_id: rec.cliente_empresa_id,
    titulo: rec.titulo,
    descricao: rec.descricao,
    prazo: rec.prazo,
    responsavel: rec.responsavel,
    responsavel_nome: respExpand?.name || respExpand?.email || authUser.name,
    responsavel_email: respExpand?.email || authUser.email,
    status: rec.status,
    autor: rec.autor,
    autor_nome: autorExpand?.name || authUser.name,
    concluida_em: rec.concluida_em,
    created: rec.created,
    updated: rec.updated,
  }
}

export async function atualizarStatusTarefa(
  tarefaId: string,
  novoStatus: StatusTarefaCrm,
): Promise<{ success: boolean; status: StatusTarefaCrm }> {
  const payload: Record<string, any> = {
    status: novoStatus,
    concluida_em: novoStatus === 'concluida' ? new Date().toISOString() : null,
  }

  await pb.collection('crm_tarefas').update(tarefaId, payload)
  return { success: true, status: novoStatus }
}

export async function excluirTarefa(tarefaId: string): Promise<boolean> {
  await pb.collection('crm_tarefas').delete(tarefaId)
  return true
}

export async function listarResumoTarefasPendentes(usuarioId?: string): Promise<{
  totalPendentes: number
  totalVencidas: number
  tarefas: CrmTarefa[]
}> {
  try {
    const filter = usuarioId
      ? `status = "pendente" && (responsavel = "${usuarioId}" || autor = "${usuarioId}")`
      : `status = "pendente"`

    const records = await pb.collection('crm_tarefas').getFullList<CrmTarefaRecord>({
      filter,
      sort: 'prazo,created',
      expand: 'responsavel,cliente',
    })

    const hojeStr = new Date().toISOString().slice(0, 10)
    let totalVencidas = 0

    const tarefas: CrmTarefa[] = records.map((rec) => {
      const respExpand = (rec as any).expand?.responsavel
      if (rec.prazo && rec.prazo.slice(0, 10) < hojeStr) {
        totalVencidas++
      }
      return {
        id: rec.id,
        cliente: rec.cliente,
        cliente_empresa_id: rec.cliente_empresa_id,
        titulo: rec.titulo,
        descricao: rec.descricao,
        prazo: rec.prazo,
        responsavel: rec.responsavel,
        responsavel_nome: respExpand?.name || respExpand?.email,
        responsavel_email: respExpand?.email,
        status: rec.status,
        autor: rec.autor,
        concluida_em: rec.concluida_em,
        created: rec.created,
        updated: rec.updated,
      }
    })

    return {
      totalPendentes: tarefas.length,
      totalVencidas,
      tarefas,
    }
  } catch (err) {
    console.warn('Erro ao carregar resumo de tarefas pendentes:', err)
    return { totalPendentes: 0, totalVencidas: 0, tarefas: [] }
  }
}
