import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
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
    // 1. Clientes da coleção 'clientes'
    let cloudClientes: Cliente[] = []
    try {
      const cloudRecords = await pb.collection('clientes').getFullList<ClienteRecord>({
        sort: 'nome',
      })
      cloudClientes = cloudRecords.map((rec) => ({
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
        origem_fonte: 'clientes',
      }))
    } catch (e) {
      console.warn('Aviso: falha ao buscar clientes da coleção clientes:', e)
    }

    // 2. Clientes do CRM (crm_clientes com empresa_id expandido)
    let crmClientesLista: Cliente[] = []
    try {
      const crmRecords = await pb.collection('crm_clientes').getFullList<any>({
        sort: '-created',
        expand: 'empresa_id',
      })
      crmClientesLista = crmRecords.map((rec) => {
        const emp = rec.expand?.empresa_id
        const nomeEmp = emp?.nome_empresa || 'Cliente CRM'
        const cnpjEmp = emp?.cnpj || ''
        const ufEmp = emp?.uf_origem || 'SP'
        const segEmp = emp?.segmento || 'Serviços'
        const regEmp = emp?.regime_atual || 'Simples Nacional'
        const emailEmp = emp?.email || ''
        const telEmp = emp?.telefone || ''

        return {
          id: rec.id,
          user_id: rec.analista_responsavel || emp?.user_id,
          nome: nomeEmp,
          cnpj_cpf: cnpjEmp,
          uf: ufEmp,
          segmento: segEmp,
          regime_atual: regEmp,
          email: emailEmp,
          telefone: telEmp,
          arquivado: rec.status_comercial === 'Inativo' || rec.status_comercial === 'Perdido',
          created: rec.created,
          updated: rec.updated,
          crm_cliente_id: rec.id,
          empresa_id: rec.empresa_id,
          origem_fonte: 'crm_clientes',
        }
      })
    } catch (e) {
      console.warn('Aviso: falha ao buscar clientes de crm_clientes:', e)
    }

    // 3. Empresas cadastradas diretamente em clientes_empresas
    let empresasLista: Cliente[] = []
    try {
      const empRecords = await pb.collection('clientes_empresas').getFullList<any>({
        sort: '-created',
      })
      empresasLista = empRecords.map((emp) => ({
        id: emp.id,
        user_id: emp.user_id,
        nome: emp.nome_empresa,
        cnpj_cpf: emp.cnpj,
        uf: emp.uf_origem || 'SP',
        segmento: emp.segmento || 'Serviços',
        regime_atual: emp.regime_atual || 'Simples Nacional',
        email: emp.email,
        telefone: emp.telefone,
        arquivado: false,
        created: emp.created,
        updated: emp.updated,
        empresa_id: emp.id,
        origem_fonte: 'clientes_empresas',
      }))
    } catch (e) {
      console.warn('Aviso: falha ao buscar empresas de clientes_empresas:', e)
    }

    // Combina evitando duplicatas por CNPJ limpo ou ID
    const mapaUnico = new Map<string, Cliente>()

    // Prioridade 1: CRM Clientes
    crmClientesLista.forEach((c) => {
      const chaveCnpj = c.cnpj_cpf ? c.cnpj_cpf.replace(/\D/g, '') : ''
      const chave = chaveCnpj || `crm_${c.id}`
      mapaUnico.set(chave, c)
      mapaUnico.set(c.id, c)
      if (c.empresa_id) {
        mapaUnico.set(c.empresa_id, c)
      }
    })

    // Prioridade 2: Coleção clientes_empresas
    empresasLista.forEach((emp) => {
      const chaveCnpj = emp.cnpj_cpf ? emp.cnpj_cpf.replace(/\D/g, '') : ''
      const chave = chaveCnpj || `emp_${emp.id}`
      if (!mapaUnico.has(chave) && !mapaUnico.has(emp.id)) {
        mapaUnico.set(chave, emp)
        mapaUnico.set(emp.id, emp)
      }
    })

    // Prioridade 3: Coleção legada clientes
    cloudClientes.forEach((cli) => {
      const chaveCnpj = cli.cnpj_cpf ? cli.cnpj_cpf.replace(/\D/g, '') : ''
      const chave = chaveCnpj || `cli_${cli.id}`
      if (!mapaUnico.has(chave) && !mapaUnico.has(cli.id)) {
        mapaUnico.set(chave, cli)
        mapaUnico.set(cli.id, cli)
      }
    })

    // Adiciona locais únicos
    locais.forEach((l) => {
      const chaveCnpj = l.cnpj_cpf ? l.cnpj_cpf.replace(/\D/g, '') : ''
      const chave = chaveCnpj || `loc_${l.id}`
      if (!mapaUnico.has(chave) && !mapaUnico.has(l.id)) {
        mapaUnico.set(chave, l)
        mapaUnico.set(l.id, l)
      }
    })

    // Obter lista sem valores duplicados por objeto
    const todosClientes = Array.from(new Set(mapaUnico.values()))
    todosClientes.sort((a, b) => a.nome.localeCompare(b.nome))

    return todosClientes
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
    // Default do funil: todo cliente nasce com estágio válido (a resolução de
    // cliente ativo depende disso). Nível explícito no payload é respeitado.
    ...(dados.estagio_funil
      ? { estagio_funil: dados.estagio_funil }
      : { estagio_funil: 'diagnostico' as const }),
  }

  try {
    const rec = await pb.collection('clientes').create<ClienteRecord>(payload)
    const novoCli: Cliente = {
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

    // Registra evento de criação no histórico do cliente
    import('@/services/historicoCliente')
      .then(({ registrarEventoAuditoriaCliente }) => {
        registrarEventoAuditoriaCliente({
          clienteId: rec.id,
          nomeEmpresa: rec.nome,
          cnpj: rec.cnpj_cpf,
          origemAjuste: 'criacao_cliente',
          descricao: `Cliente "${rec.nome}" cadastrado no sistema`,
          snapshotNovo: payload,
        }).catch((e) => console.warn('Falha ao registrar criação no histórico:', e))
      })
      .catch(() => {})

    return novoCli
  } catch (err) {
    console.warn('[clientes] Erro ao criar cliente:', err)
    // Propaga o erro real: cadastro que falha NÃO pode parecer sucesso.
    // (O chamador decide — ModalCliente mostra toast com motivo + Tentar novamente.)
    throw new Error(getErrorMessage(err) || 'Falha ao cadastrar o cliente no servidor.')
  }
}

/**
 * Atualiza dados de um cliente
 */
export async function atualizarCliente(id: string, dados: Partial<ClienteInput>): Promise<Cliente> {
  let registroAnterior: ClienteRecord | null = null
  try {
    registroAnterior = await pb
      .collection('clientes')
      .getOne<ClienteRecord>(id)
      .catch(() => null)
  } catch {
    // ignore
  }

  try {
    const rec = await pb.collection('clientes').update<ClienteRecord>(id, dados)

    // Se houve alteração de campos, registra auditoria com diff
    if (registroAnterior) {
      import('@/services/historicoCliente')
        .then(({ calcularDiffGenerico, registrarEventoAuditoriaCliente }) => {
          const diffs = calcularDiffGenerico(registroAnterior as any, dados as any)
          if (diffs.length > 0) {
            registrarEventoAuditoriaCliente({
              clienteId: rec.id,
              nomeEmpresa: rec.nome,
              cnpj: rec.cnpj_cpf,
              origemAjuste: 'edicao_dados_cliente',
              descricao: `Dados cadastrais atualizados (${diffs.length} campo(s) alterado(s))`,
              alteracoes: diffs,
              snapshotAnterior: registroAnterior as any,
              snapshotNovo: { ...registroAnterior, ...dados },
            }).catch((e) => console.warn('Falha ao registrar auditoria de atualização:', e))
          }
        })
        .catch(() => {})
    }

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
