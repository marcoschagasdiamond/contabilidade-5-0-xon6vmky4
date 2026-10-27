import pb from '@/lib/pocketbase/client'
import type {
  CrmAnotacao,
  CrmAnotacaoRecord,
  CrmTarefa,
  CrmTarefaRecord,
  EstagioFunilCrm,
  StatusTarefaCrm,
  CriarAnotacaoInput,
  CriarTarefaInput,
} from '@/types/crm'

/**
 * Atualiza o estágio de funil de um cliente na coleção 'clientes' ou 'clientes_empresas'
 * Registra auditoria: funil_atualizado_em e funil_atualizado_por.
 */
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
    // Tenta fallback na outra coleção se der erro de ID não encontrado
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

/**
 * Lista anotações de um cliente específico (ordenadas da mais recente para a mais antiga).
 */
export async function listarAnotacoesCliente(params: {
  clienteId: string
  collectionOrigem?: 'clientes' | 'clientes_empresas'
}): Promise<CrmAnotacao[]> {
  const { clienteId, collectionOrigem } = params
  if (!clienteId) return []

  try {
    // Filtro para cobrir cliente (relation clientes) ou cliente_empresa_id (text)
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

/**
 * Cria uma nova anotação para o cliente.
 */
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

/**
 * Exclui uma anotação.
 * Master e Admin podem excluir qualquer uma; o autor pode excluir a sua.
 */
export async function excluirAnotacao(anotacaoId: string): Promise<boolean> {
  await pb.collection('crm_anotacoes').delete(anotacaoId)
  return true
}

/**
 * Lista tarefas de um cliente específico.
 */
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

/**
 * Cria uma nova tarefa vinculada ao cliente.
 */
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

/**
 * Atualiza o status de uma tarefa (concluir, reabrir/desfazer, cancelar).
 */
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

/**
 * Exclui uma tarefa.
 */
export async function excluirTarefa(tarefaId: string): Promise<boolean> {
  await pb.collection('crm_tarefas').delete(tarefaId)
  return true
}

/**
 * Busca todas as tarefas pendentes globais ou do usuário logado para exibição do resumo no topo.
 */
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
