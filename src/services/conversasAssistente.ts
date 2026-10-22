import pb from '@/lib/pocketbase/client'

export interface MensagemConversaAssistente {
  papel: 'usuario' | 'assistente'
  texto: string
  data: string
}

export interface ConversaAssistente {
  id: string
  user_id: string
  cliente_id: string
  cliente_nome?: string
  conversa_id_nativo?: string
  titulo: string
  mensagens: MensagemConversaAssistente[]
  total_mensagens?: number
  created: string
  updated: string
}

const STORAGE_CONVERSAS_KEY = 'contabilidade50_conversas_assistente_local_v1'

/**
 * Lê conversas arquivadas localmente como fallback
 */
function obterConversasLocais(): ConversaAssistente[] {
  try {
    const raw = localStorage.getItem(STORAGE_CONVERSAS_KEY)
    if (!raw) return []
    return JSON.parse(raw) || []
  } catch {
    return []
  }
}

/**
 * Salva conversas localmente como fallback
 */
function salvarConversasLocais(lista: ConversaAssistente[]) {
  try {
    localStorage.setItem(STORAGE_CONVERSAS_KEY, JSON.stringify(lista))
  } catch {
    /* intentionally ignored */
  }
}

/**
 * Converte record do PocketBase para ConversaAssistente
 */
function recordParaConversa(rec: any): ConversaAssistente {
  let msgs: MensagemConversaAssistente[] = []
  try {
    if (Array.isArray(rec.mensagens)) {
      msgs = rec.mensagens
    } else if (typeof rec.mensagens === 'string') {
      msgs = JSON.parse(rec.mensagens)
    }
  } catch {
    msgs = []
  }

  return {
    id: rec.id,
    user_id: rec.user_id,
    cliente_id: rec.cliente_id || '',
    cliente_nome: rec.cliente_nome || '',
    conversa_id_nativo: rec.conversa_id_nativo || '',
    titulo: rec.titulo || 'Análise da Calculadora IBS/CBS',
    mensagens: msgs,
    total_mensagens: rec.total_mensagens || msgs.length,
    created: rec.created,
    updated: rec.updated,
  }
}

/**
 * Salva ou atualiza uma conversa arquivada do assistente
 */
export async function salvarConversaAssistente(dados: {
  id?: string
  conversa_id_nativo?: string
  cliente_id?: string
  cliente_nome?: string
  titulo?: string
  mensagens: MensagemConversaAssistente[]
}): Promise<ConversaAssistente | null> {
  const userId = pb.authStore.record?.id || 'anonimo'
  const agora = new Date().toISOString()
  const tituloGerado =
    dados.titulo ||
    (dados.cliente_nome ? `Análise — ${dados.cliente_nome}` : 'Análise Geral da Calculadora')

  // Se autenticado, salva no backend
  if (pb.authStore.isValid && pb.authStore.record?.id) {
    try {
      const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
      const res = await fetch(`${baseUrl}/backend/v1/calculadora/assistente-conversas/salvar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: pb.authStore.token,
        },
        body: JSON.stringify({
          id: dados.id,
          conversa_id_nativo: dados.conversa_id_nativo,
          cliente_id: dados.cliente_id || '',
          cliente_nome: dados.cliente_nome || '',
          titulo: tituloGerado,
          mensagens: dados.mensagens,
        }),
      })

      if (res.ok) {
        const payload = await res.json()
        return {
          id: payload.id,
          user_id: userId,
          cliente_id: payload.cliente_id || '',
          cliente_nome: payload.cliente_nome || '',
          conversa_id_nativo: payload.conversa_id_nativo || '',
          titulo: payload.titulo,
          mensagens: dados.mensagens,
          total_mensagens: payload.total_mensagens || dados.mensagens.length,
          created: payload.created || agora,
          updated: payload.updated || agora,
        }
      }
    } catch (err) {
      console.warn('Erro ao salvar conversa via endpoint, tentando direto na coleção:', err)
      try {
        let rec: any
        if (dados.id) {
          rec = await pb.collection('conversas_assistente').update(dados.id, {
            cliente_id: dados.cliente_id || '',
            cliente_nome: dados.cliente_nome || '',
            conversa_id_nativo: dados.conversa_id_nativo || '',
            titulo: tituloGerado,
            mensagens: dados.mensagens,
            total_mensagens: dados.mensagens.length,
          })
        } else {
          rec = await pb.collection('conversas_assistente').create({
            user_id: userId,
            cliente_id: dados.cliente_id || '',
            cliente_nome: dados.cliente_nome || '',
            conversa_id_nativo: dados.conversa_id_nativo || '',
            titulo: tituloGerado,
            mensagens: dados.mensagens,
            total_mensagens: dados.mensagens.length,
          })
        }
        return recordParaConversa(rec)
      } catch (colErr) {
        console.warn('Falha ao salvar conversa no backend:', colErr)
      }
    }
  }

  // Fallback local caso offline ou anônimo
  const locais = obterConversasLocais()
  let item = dados.id ? locais.find((c) => c.id === dados.id) : null
  if (!item && dados.conversa_id_nativo) {
    item = locais.find((c) => c.conversa_id_nativo === dados.conversa_id_nativo) || null
  }

  if (item) {
    item.cliente_id = dados.cliente_id || ''
    item.cliente_nome = dados.cliente_nome || ''
    item.titulo = tituloGerado
    item.mensagens = dados.mensagens
    item.total_mensagens = dados.mensagens.length
    item.updated = agora
  } else {
    item = {
      id: dados.id || `local-${Date.now()}`,
      user_id: userId,
      cliente_id: dados.cliente_id || '',
      cliente_nome: dados.cliente_nome || '',
      conversa_id_nativo: dados.conversa_id_nativo || '',
      titulo: tituloGerado,
      mensagens: dados.mensagens,
      total_mensagens: dados.mensagens.length,
      created: agora,
      updated: agora,
    }
    locais.unshift(item)
  }

  salvarConversasLocais(locais)
  return item
}

/**
 * Lista todas as conversas arquivadas do usuário logado
 */
export async function listarConversasAssistente(): Promise<ConversaAssistente[]> {
  if (pb.authStore.isValid && pb.authStore.record?.id) {
    try {
      const records = await pb.collection('conversas_assistente').getFullList({
        sort: '-updated',
      })
      return records.map(recordParaConversa)
    } catch (err) {
      console.warn('Erro ao listar conversas do backend:', err)
    }
  }
  return obterConversasLocais()
}

/**
 * Lista conversas de um cliente específico
 */
export async function listarConversasPorCliente(clienteId: string): Promise<ConversaAssistente[]> {
  if (!clienteId) return []
  if (pb.authStore.isValid && pb.authStore.record?.id) {
    try {
      const records = await pb.collection('conversas_assistente').getFullList({
        filter: `cliente_id = "${clienteId}"`,
        sort: '-updated',
      })
      return records.map(recordParaConversa)
    } catch (err) {
      console.warn(`Erro ao listar conversas do cliente ${clienteId}:`, err)
    }
  }
  return obterConversasLocais().filter((c) => c.cliente_id === clienteId)
}

/**
 * Lista conversas gerais (sem cliente vinculado)
 */
export async function listarConversasGerais(): Promise<ConversaAssistente[]> {
  if (pb.authStore.isValid && pb.authStore.record?.id) {
    try {
      const records = await pb.collection('conversas_assistente').getFullList({
        filter: `cliente_id = "" || cliente_id = null`,
        sort: '-updated',
      })
      return records.map(recordParaConversa)
    } catch (err) {
      console.warn('Erro ao listar conversas gerais do backend:', err)
    }
  }
  return obterConversasLocais().filter((c) => !c.cliente_id)
}

/**
 * Obtém uma conversa por ID
 */
export async function obterConversaPorId(id: string): Promise<ConversaAssistente | null> {
  if (!id) return null
  if (pb.authStore.isValid && pb.authStore.record?.id) {
    try {
      const rec = await pb.collection('conversas_assistente').getOne(id)
      return recordParaConversa(rec)
    } catch (err) {
      console.warn(`Erro ao buscar conversa ${id}:`, err)
    }
  }
  return obterConversasLocais().find((c) => c.id === id) || null
}

/**
 * Exclui uma conversa arquivada
 */
export async function excluirConversaAssistente(id: string): Promise<boolean> {
  if (!id) return false
  let ok = false
  if (pb.authStore.isValid && pb.authStore.record?.id) {
    try {
      await pb.collection('conversas_assistente').delete(id)
      ok = true
    } catch (err) {
      console.warn('Erro ao excluir conversa do backend:', err)
    }
  }
  const locais = obterConversasLocais().filter((c) => c.id !== id)
  salvarConversasLocais(locais)
  return ok || true
}
