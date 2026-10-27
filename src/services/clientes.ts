import pb from '@/lib/pocketbase/client'
import type { Cliente, ClienteRecord, ClienteInput } from '@/types/cliente'

const LOCAL_STORAGE_CLIENTES_KEY = 'contabilidade50_carteira_clientes_v1'

function carregarClientesLocais(): Cliente[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CLIENTES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Erro ao ler clientes do localStorage:', err)
    return []
  }
}

function salvarClientesLocais(lista: Cliente[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_CLIENTES_KEY, JSON.stringify(lista))
  } catch (err) {
    console.error('Erro ao salvar clientes no localStorage:', err)
  }
}

/**
 * Lista todos os clientes da carteira (PocketBase com fallback/mescla local)
 */
export async function listarClientes(): Promise<Cliente[]> {
  const locais = carregarClientesLocais()

  try {
    const cloudRecords = await pb.collection('clientes').getFullList<ClienteRecord>({
      sort: 'nome',
    })

    const cloudClientes: Cliente[] = cloudRecords.map((rec) => ({
      id: rec.id,
      user_id: rec.user_id,
      nome: rec.nome,
      cnpj_cpf: rec.cnpj_cpf,
      uf: rec.uf,
      segmento: rec.segmento,
      regime_atual: rec.regime_atual,
      email: rec.email,
      telefone: rec.telefone,
      arquivado: Boolean(rec.arquivado),
      created: rec.created,
      updated: rec.updated,
    }))

    // Mescla itens locais que não estejam na nuvem
    const idsNuvem = new Set(cloudClientes.map((c) => c.id))
    const locaisUnicos = locais.filter((l) => !idsNuvem.has(l.id))

    return [...cloudClientes, ...locaisUnicos]
  } catch (err) {
    console.warn('Erro ao carregar clientes do PocketBase, usando locais:', err)
    return locais
  }
}

/**
 * Busca um cliente por ID
 */
export async function obterClientePorId(id: string): Promise<Cliente | null> {
  if (!id) return null

  try {
    const rec = await pb.collection('clientes').getOne<ClienteRecord>(id)
    return {
      id: rec.id,
      user_id: rec.user_id,
      nome: rec.nome,
      cnpj_cpf: rec.cnpj_cpf,
      uf: rec.uf,
      segmento: rec.segmento,
      regime_atual: rec.regime_atual,
      email: rec.email,
      telefone: rec.telefone,
      arquivado: Boolean(rec.arquivado),
      created: rec.created,
      updated: rec.updated,
    }
  } catch (err) {
    console.warn(`Cliente ${id} não encontrado na nuvem, buscando local:`, err)
    const locais = carregarClientesLocais()
    return locais.find((c) => c.id === id) || null
  }
}

/**
 * Cria um novo cliente
 */
export async function criarCliente(dados: ClienteInput): Promise<Cliente> {
  const authUser = pb.authStore.record
  const payload = {
    user_id: dados.user_id || authUser?.id || '',
    nome: dados.nome.trim(),
    cnpj_cpf: dados.cnpj_cpf.trim(),
    uf: dados.uf.trim().toUpperCase(),
    segmento: dados.segmento,
    regime_atual: dados.regime_atual,
    email: dados.email?.trim() || '',
    telefone: dados.telefone?.trim() || '',
  }

  try {
    const rec = await pb.collection('clientes').create<ClienteRecord>(payload)
    return {
      id: rec.id,
      user_id: rec.user_id,
      nome: rec.nome,
      cnpj_cpf: rec.cnpj_cpf,
      uf: rec.uf,
      segmento: rec.segmento,
      regime_atual: rec.regime_atual,
      email: rec.email,
      telefone: rec.telefone,
      arquivado: Boolean(rec.arquivado),
      created: rec.created,
      updated: rec.updated,
    }
  } catch (err) {
    console.warn('Erro ao criar cliente no PocketBase, salvando local:', err)
    const locais = carregarClientesLocais()
    const novo: Cliente = {
      id: 'local_cli_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      ...payload,
      arquivado: false,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }
    salvarClientesLocais([novo, ...locais])
    return novo
  }
}

/**
 * Atualiza dados de um cliente
 */
export async function atualizarCliente(id: string, dados: Partial<ClienteInput>): Promise<Cliente> {
  try {
    const rec = await pb.collection('clientes').update<ClienteRecord>(id, dados)
    return {
      id: rec.id,
      user_id: rec.user_id,
      nome: rec.nome,
      cnpj_cpf: rec.cnpj_cpf,
      uf: rec.uf,
      segmento: rec.segmento,
      regime_atual: rec.regime_atual,
      email: rec.email,
      telefone: rec.telefone,
      arquivado: Boolean(rec.arquivado),
      created: rec.created,
      updated: rec.updated,
    }
  } catch (err) {
    console.warn('Erro ao atualizar cliente na nuvem, atualizando local:', err)
    const locais = carregarClientesLocais()
    const atualizados = locais.map((c) =>
      c.id === id ? { ...c, ...dados, updated: new Date().toISOString() } : c,
    )
    salvarClientesLocais(atualizados)
    const atualizado = atualizados.find((c) => c.id === id)
    if (!atualizado) throw new Error('Cliente não encontrado')
    return atualizado
  }
}

/**
 * Exclui um cliente
 */
export async function excluirCliente(id: string): Promise<boolean> {
  try {
    await pb.collection('clientes').delete(id)
    return true
  } catch (err) {
    console.warn('Erro ao excluir cliente na nuvem, removendo local:', err)
    const locais = carregarClientesLocais()
    const filtrados = locais.filter((c) => c.id !== id)
    salvarClientesLocais(filtrados)
    return true
  }
}

/**
 * Arquiva um cliente (mantém registros e vínculos intactos, apenas marca arquivado: true)
 */
export async function arquivarCliente(id: string): Promise<Cliente> {
  return await atualizarCliente(id, { arquivado: true })
}

/**
 * Desarquiva um cliente (restaura para a listagem ativa, arquivado: false)
 */
export async function desarquivarCliente(id: string): Promise<Cliente> {
  return await atualizarCliente(id, { arquivado: false })
}
