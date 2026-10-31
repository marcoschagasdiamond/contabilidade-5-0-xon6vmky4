import pb from '@/lib/pocketbase/client'
import type {
  UsuarioSistema,
  ClienteGlobalItem,
  AnalistaMetricasItem,
  NivelAcesso,
  PermissaoMaster,
} from '@/types/master'

// Cache local de fallback caso esteja offline ou sem PocketBase
const STORAGE_USUARIOS_KEY = 'c50_master_usuarios'

/**
 * Lista todos os usuários do sistema para o painel Master/Admin
 */
export async function listarTodosUsuarios(): Promise<UsuarioSistema[]> {
  try {
    const [records, diags, sims, clientes] = await Promise.all([
      pb.collection('users').getFullList({
        sort: '-created',
        expand: 'criado_por,autorizado_por',
      }),
      pb
        .collection('diagnosticos')
        .getFullList({ fields: 'id,user_id' })
        .catch(() => []),
      pb
        .collection('simulacoes_calculadora')
        .getFullList({ fields: 'id,user_id' })
        .catch(() => []),
      pb
        .collection('clientes')
        .getFullList({ fields: 'id,user_id' })
        .catch(() => []),
    ])

    // Mapa de contadores por user_id
    const diagsCount = new Map<string, number>()
    diags.forEach((d: any) => {
      if (d.user_id) diagsCount.set(d.user_id, (diagsCount.get(d.user_id) || 0) + 1)
    })
    const simsCount = new Map<string, number>()
    sims.forEach((s: any) => {
      if (s.user_id) simsCount.set(s.user_id, (simsCount.get(s.user_id) || 0) + 1)
    })
    const clientesCount = new Map<string, number>()
    clientes.forEach((c: any) => {
      if (c.user_id) clientesCount.set(c.user_id, (clientesCount.get(c.user_id) || 0) + 1)
    })

    const usuarios: UsuarioSistema[] = records.map((r: any) => {
      let permissoes: PermissaoMaster[] = []
      if (Array.isArray(r.permissoes_json)) {
        permissoes = r.permissoes_json
      } else if (typeof r.permissoes_json === 'string') {
        try {
          permissoes = JSON.parse(r.permissoes_json)
        } catch (_) {
          permissoes = []
        }
      }

      const isMarco = r.email?.toLowerCase() === 'marcoschagasdiamond@icloud.com'
      const nivel: NivelAcesso = isMarco
        ? 'master'
        : r.nivel_acesso ||
          (r.role === 'admin' ? 'admin' : r.perfil === 'empresario' ? 'empresario' : 'analista')

      const criadorExpand = r.expand?.criado_por
      const autorizadorExpand = r.expand?.autorizado_por

      return {
        id: r.id,
        name:
          r.name || (isMarco ? 'Dr. Marco Chagas (Master)' : r.email?.split('@')[0] || 'Usuário'),
        email: r.email || '',
        nivel_acesso: nivel,
        permissoes_json: permissoes,
        criado_por: r.criado_por,
        perfil: r.perfil || 'contador',
        role: r.role || (nivel === 'master' || nivel === 'admin' ? 'admin' : 'user'),
        plano: r.plano || 'gratuito',
        is_premium: r.is_premium || nivel === 'master' || nivel === 'admin',
        created: r.created,
        updated: r.updated,
        criador_nome: criadorExpand?.name || criadorExpand?.email,
        criador_email: criadorExpand?.email,
        // Novos campos
        valor_mensal_personalizado:
          typeof r.valor_mensal_personalizado === 'number'
            ? r.valor_mensal_personalizado
            : undefined,
        status_operacao:
          (r.status_operacao as 'autorizado' | 'suspenso') ||
          (nivel === 'analista' ? 'autorizado' : undefined),
        autorizado_por: r.autorizado_por,
        autorizado_por_nome: autorizadorExpand?.name || autorizadorExpand?.email,
        autorizado_em: r.autorizado_em,
        total_clientes: clientesCount.get(r.id) || 0,
        total_diagnosticos: diagsCount.get(r.id) || 0,
        total_simulacoes: simsCount.get(r.id) || 0,
        // Dados do escritório adquirente
        escritorio_nome: r.escritorio_nome || undefined,
        escritorio_responsavel: r.escritorio_responsavel || undefined,
        escritorio_cnpj: r.escritorio_cnpj || undefined,
        escritorio_email: r.escritorio_email || undefined,
        escritorio_telefone: r.escritorio_telefone || undefined,
        escritorio_uf: r.escritorio_uf || undefined,
        escritorio_cidade: r.escritorio_cidade || undefined,
        escritorio_cadastrado: !!r.escritorio_cadastrado,
      }
    })

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_USUARIOS_KEY, JSON.stringify(usuarios))
      } catch {
        /* intentionally ignored */
      }
    }

    return usuarios
  } catch (err) {
    console.warn('Erro ao listar usuários no PocketBase, usando cache local:', err)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_USUARIOS_KEY)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          /* intentionally ignored */
        }
      }
    }
    return []
  }
}

/**
 * Atualiza o nível de acesso e as funções/permissões de um usuário.
 * Apenas o Master pode promover ou rebaixar outros administradores.
 */
export async function atualizarNivelEPermissoesUsuario(params: {
  usuarioId: string
  nivel_acesso: NivelAcesso
  permissoes_json: PermissaoMaster[]
  masterUsuarioId?: string
}): Promise<UsuarioSistema> {
  const { usuarioId, nivel_acesso, permissoes_json, masterUsuarioId } = params

  const payload: Record<string, any> = {
    nivel_acesso,
    permissoes_json,
    // Se tornou admin/master, garante role 'admin' e is_premium no schema legado
    role: nivel_acesso === 'master' || nivel_acesso === 'admin' ? 'admin' : 'user',
    is_premium: nivel_acesso === 'master' || nivel_acesso === 'admin' ? true : undefined,
  }

  if (masterUsuarioId) {
    payload.criado_por = masterUsuarioId
  }

  const updated = await pb.collection('users').update(usuarioId, payload)

  let parsedPerms: PermissaoMaster[] = []
  if (Array.isArray(updated.permissoes_json)) {
    parsedPerms = updated.permissoes_json
  } else if (typeof updated.permissoes_json === 'string') {
    try {
      parsedPerms = JSON.parse(updated.permissoes_json)
    } catch (_) {
      parsedPerms = []
    }
  }

  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    nivel_acesso: (updated.nivel_acesso as NivelAcesso) || 'analista',
    permissoes_json: parsedPerms,
    criado_por: updated.criado_por,
    perfil: updated.perfil,
    role: updated.role,
    plano: updated.plano,
    is_premium: updated.is_premium,
    created: updated.created,
    updated: updated.updated,
  }
}

/**
 * Consolida a Visão Global de Clientes:
 * - Todos os clientes cadastrados em 'clientes' (com respectivo analista responsável via user_id)
 * - Todos os clientes cadastrados em 'clientes_empresas' (cadastros diretos ou pelo próprio empresário)
 * - Total de diagnósticos e simulações vinculados
 */
export async function listarClientesVisaoGlobal(): Promise<ClienteGlobalItem[]> {
  try {
    // 1. Carrega usuários para mapa analista_id -> nome/email
    const usuarios = await listarTodosUsuarios()
    const mapaUsuarios = new Map<string, UsuarioSistema>()
    usuarios.forEach((u) => mapaUsuarios.set(u.id, u))

    // 2. Carrega diagnósticos e simulações para cruzar métricas por cliente
    const [diags, sims, clientesLista, clientesEmpresasLista] = await Promise.all([
      pb
        .collection('diagnosticos')
        .getFullList({ fields: 'id,cliente_id,cnpj,email,empresa,created,user_id' })
        .catch(() => []),
      pb
        .collection('simulacoes_calculadora')
        .getFullList({ fields: 'id,cliente_id,cnpj,empresa,created,user_id' })
        .catch(() => []),
      pb
        .collection('clientes')
        .getFullList({ sort: '-created' })
        .catch(() => []),
      pb
        .collection('clientes_empresas')
        .getFullList({ sort: '-created' })
        .catch(() => []),
    ])

    const mapaDiagsPorCliente = new Map<string, number>()
    const mapaUltimoDiagData = new Map<string, string>()
    diags.forEach((d: any) => {
      const chaves = [
        d.cliente_id,
        d.cnpj ? `cnpj_${d.cnpj}` : null,
        d.email ? `email_${d.email.toLowerCase()}` : null,
      ].filter(Boolean) as string[]

      chaves.forEach((k) => {
        mapaDiagsPorCliente.set(k, (mapaDiagsPorCliente.get(k) || 0) + 1)
        if (!mapaUltimoDiagData.has(k) && d.created) {
          mapaUltimoDiagData.set(k, d.created)
        }
      })
    })

    const mapaSimsPorCliente = new Map<string, number>()
    sims.forEach((s: any) => {
      const chaves = [s.cliente_id, s.cnpj ? `cnpj_${s.cnpj}` : null].filter(Boolean) as string[]
      chaves.forEach((k) => {
        mapaSimsPorCliente.set(k, (mapaSimsPorCliente.get(k) || 0) + 1)
      })
    })

    const itensGlobais: ClienteGlobalItem[] = []

    // 3. Processa clientes da carteira de analistas ('clientes')
    clientesLista.forEach((c: any) => {
      const analista = c.user_id ? mapaUsuarios.get(c.user_id) : undefined
      const atualizador = c.funil_atualizado_por
        ? mapaUsuarios.get(c.funil_atualizado_por)
        : undefined

      const totalD =
        (mapaDiagsPorCliente.get(c.id) || 0) +
        (c.cnpj_cpf ? mapaDiagsPorCliente.get(`cnpj_${c.cnpj_cpf}`) || 0 : 0)
      const totalS =
        (mapaSimsPorCliente.get(c.id) || 0) +
        (c.cnpj_cpf ? mapaSimsPorCliente.get(`cnpj_${c.cnpj_cpf}`) || 0 : 0)

      // Fallback inteligente para estagio_funil: se não definido, calcula com base nas atividades
      const estagioCalculado =
        c.estagio_funil ||
        (totalD > 0 || totalS > 0
          ? totalD > 0 && totalS > 0
            ? 'proposta'
            : 'diagnostico'
          : 'lead')

      itensGlobais.push({
        id: c.id,
        nome: c.nome,
        empresa: c.nome,
        cnpj_cpf: c.cnpj_cpf || '',
        email: c.email || '',
        telefone: c.telefone || '',
        segmento: c.segmento || 'Outro',
        regime_atual: c.regime_atual || 'Não inf.',
        uf: c.uf || 'SP',
        cidade: '',
        origem_tipo: analista ? 'analista' : 'direto',
        analista_id: c.user_id,
        analista_nome: analista?.name || (c.user_id ? 'Analista Cadastrado' : 'Cadastro Direto'),
        analista_email: analista?.email,
        total_diagnosticos: totalD,
        total_simulacoes: totalS,
        ultimo_diagnostico_data:
          mapaUltimoDiagData.get(c.id) ||
          (c.cnpj_cpf ? mapaUltimoDiagData.get(`cnpj_${c.cnpj_cpf}`) : undefined),
        created: c.created,
        collection_origem: 'clientes',
        estagio_funil: estagioCalculado,
        origem_lead:
          c.origem_lead || (analista ? `Analista: ${analista.name}` : 'Cadastro Direto no Site'),
        funil_atualizado_em: c.funil_atualizado_em,
        funil_atualizado_por: c.funil_atualizado_por,
        funil_atualizado_por_nome: atualizador?.name || atualizador?.email,
      })
    })

    // 4. Processa cadastros diretos em clientes_empresas (evitando duplicar se mesmo CNPJ já existe)
    const cnpjsJaListados = new Set(
      itensGlobais.map((i) => i.cnpj_cpf.replace(/\D/g, '')).filter(Boolean),
    )

    clientesEmpresasLista.forEach((ce: any) => {
      const cnpjLimpo = (ce.cnpj || '').replace(/\D/g, '')
      if (cnpjLimpo && cnpjsJaListados.has(cnpjLimpo)) {
        // Já incluso via coleção 'clientes'
        return
      }

      const usuarioDono = ce.user_id ? mapaUsuarios.get(ce.user_id) : undefined
      const atualizador = ce.funil_atualizado_por
        ? mapaUsuarios.get(ce.funil_atualizado_por)
        : undefined

      const ehAnalista =
        usuarioDono?.perfil === 'contador' || usuarioDono?.nivel_acesso === 'analista'

      const totalD =
        (mapaDiagsPorCliente.get(ce.id) || 0) +
        (ce.cnpj ? mapaDiagsPorCliente.get(`cnpj_${ce.cnpj}`) || 0 : 0) +
        (ce.email ? mapaDiagsPorCliente.get(`email_${ce.email.toLowerCase()}`) || 0 : 0)

      const totalS =
        (mapaSimsPorCliente.get(ce.id) || 0) +
        (ce.cnpj ? mapaSimsPorCliente.get(`cnpj_${ce.cnpj}`) || 0 : 0)

      const estagioCalculado =
        ce.estagio_funil ||
        (totalD > 0 || totalS > 0
          ? totalD > 0 && totalS > 0
            ? 'proposta'
            : 'diagnostico'
          : 'lead')

      itensGlobais.push({
        id: ce.id,
        nome: ce.nome_contato || ce.nome_empresa,
        empresa: ce.nome_empresa || ce.nome_contato,
        cnpj_cpf: ce.cnpj || '',
        email: ce.email || '',
        telefone: ce.telefone || '',
        segmento: ce.segmento || 'Outro',
        regime_atual: ce.regime_atual || 'Não inf.',
        uf: ce.uf_origem || 'SP',
        cidade: ce.cidade || '',
        origem_tipo: ehAnalista ? 'analista' : 'direto',
        analista_id: ehAnalista ? ce.user_id : undefined,
        analista_nome: ehAnalista ? usuarioDono?.name : 'Cadastro Direto (Empresário)',
        analista_email: ehAnalista ? usuarioDono?.email : undefined,
        total_diagnosticos: totalD,
        total_simulacoes: totalS,
        faturamento_mensal: ce.faturamento_mensal,
        ultimo_diagnostico_data:
          mapaUltimoDiagData.get(ce.id) ||
          (ce.cnpj ? mapaUltimoDiagData.get(`cnpj_${ce.cnpj}`) : undefined),
        created: ce.created,
        collection_origem: 'clientes_empresas',
        estagio_funil: estagioCalculado,
        origem_lead:
          ce.origem_lead ||
          (ehAnalista ? `Analista: ${usuarioDono?.name}` : 'Cadastro Direto no Site'),
        funil_atualizado_em: ce.funil_atualizado_em,
        funil_atualizado_por: ce.funil_atualizado_por,
        funil_atualizado_por_nome: atualizador?.name || atualizador?.email,
      })
    })

    return itensGlobais
  } catch (err) {
    console.error('Erro ao listar clientes visão global:', err)
    return []
  }
}

/**
 * Consolida métricas por Analista/Parceiro com drill-down da carteira
 */
/**
 * Exclui um cliente da Visão Global (seja da coleção 'clientes' ou 'clientes_empresas')
 * e, opcionalmente (padrão true), remove todos os dados vinculados:
 * - Diagnósticos das 5 etapas
 * - Simulações da Calculadora IBS/CBS
 * - Versões do Relatório Consolidado
 * - Simulações do Recuperador
 * - Conversas do assistente
 */
export async function excluirClienteGlobal(params: {
  clienteId: string
  clienteNome: string
  empresaNome?: string
  collectionOrigem?: 'clientes' | 'clientes_empresas'
  excluirDadosVinculados?: boolean
}): Promise<{
  success: boolean
  totalDiagnosticos: number
  totalSimulacoes: number
  totalRelatorios: number
}> {
  const {
    clienteId,
    clienteNome,
    empresaNome,
    collectionOrigem = 'clientes',
    excluirDadosVinculados = true,
  } = params

  let totalDiagnosticos = 0
  let totalSimulacoes = 0
  let totalRelatorios = 0

  if (excluirDadosVinculados) {
    // 1. Diagnósticos das 5 etapas + histórico de relatórios
    try {
      const { excluirDiagnosticoCompletoPorCliente } = await import('@/services/diagnosticos')
      const resDiag = await excluirDiagnosticoCompletoPorCliente({
        clienteId,
        clienteNome,
        empresaNome: empresaNome || clienteNome,
      })
      totalDiagnosticos += resDiag.totalDiagnosticosExcluidos
      totalRelatorios += resDiag.totalRelatoriosExcluidos
    } catch (e) {
      console.warn('Erro ao excluir diagnósticos completos:', e)
    }

    // Garante exclusão de relatórios extras por nome
    try {
      const { excluirHistoricoRelatoriosPorCliente } =
        await import('@/services/historicoRelatorios')
      const relExtra = await excluirHistoricoRelatoriosPorCliente({
        clienteId,
        clienteNome,
        empresaNome: empresaNome || clienteNome,
      })
      totalRelatorios += relExtra
    } catch (e) {
      console.warn('Erro ao excluir histórico de relatórios:', e)
    }

    // 2. Simulações da Calculadora IBS/CBS
    try {
      const { excluirSimulacoesCalculadoraPorCliente } =
        await import('@/services/simulacoesCalculadora')
      totalSimulacoes = await excluirSimulacoesCalculadoraPorCliente(clienteId)
    } catch (e) {
      console.warn('Erro ao excluir simulações da calculadora:', e)
    }

    // 3. Simulações do Recuperador
    try {
      const recs = await pb
        .collection('simulacoes_recuperador')
        .getFullList({
          filter: `cliente_id = "${clienteId}"`,
        })
        .catch(() => [])
      for (const r of recs) {
        await pb
          .collection('simulacoes_recuperador')
          .delete(r.id)
          .catch(() => {})
      }
    } catch {
      /* intentionally ignored */
    }

    // 4. Conversas do assistente vinculadas ao cliente
    try {
      const convs = await pb
        .collection('conversas_assistente')
        .getFullList({
          filter: `cliente_id = "${clienteId}"`,
        })
        .catch(() => [])
      for (const c of convs) {
        await pb
          .collection('conversas_assistente')
          .delete(c.id)
          .catch(() => {})
      }
    } catch {
      /* intentionally ignored */
    }

    // 4.1 CRM Fase 2: Anotações e Tarefas do cliente
    try {
      const anotacoes = await pb
        .collection('crm_anotacoes')
        .getFullList({
          filter: `cliente = "${clienteId}" || cliente_empresa_id = "${clienteId}"`,
        })
        .catch(() => [])
      for (const a of anotacoes) {
        await pb
          .collection('crm_anotacoes')
          .delete(a.id)
          .catch(() => {})
      }

      const tarefas = await pb
        .collection('crm_tarefas')
        .getFullList({
          filter: `cliente = "${clienteId}" || cliente_empresa_id = "${clienteId}"`,
        })
        .catch(() => [])
      for (const t of tarefas) {
        await pb
          .collection('crm_tarefas')
          .delete(t.id)
          .catch(() => {})
      }
    } catch (e) {
      console.warn('Erro ao excluir anotações/tarefas do CRM vinculadas:', e)
    }
  }

  // 5. Excluir o registro principal de cadastro
  if (collectionOrigem === 'clientes_empresas') {
    try {
      await pb.collection('clientes_empresas').delete(clienteId)
    } catch (err) {
      console.warn('Tentando fallback para clientes:', err)
      await pb
        .collection('clientes')
        .delete(clienteId)
        .catch(() => {})
    }
  } else {
    try {
      await pb.collection('clientes').delete(clienteId)
    } catch (err) {
      console.warn('Tentando fallback para clientes_empresas:', err)
      await pb
        .collection('clientes_empresas')
        .delete(clienteId)
        .catch(() => {})
    }
  }

  // Limpa também do localStorage de carteira se existir
  try {
    const raw = localStorage.getItem('contabilidade50_carteira_clientes_v1')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const filtrados = parsed.filter((c: any) => c.id !== clienteId)
        localStorage.setItem('contabilidade50_carteira_clientes_v1', JSON.stringify(filtrados))
      }
    }
  } catch {
    /* intentionally ignored */
  }

  // Se o cliente era o Cliente Ativo no localStorage, limpa
  try {
    const ativoId = localStorage.getItem('contabilidade50_cliente_ativo_id_v1')
    if (ativoId === clienteId) {
      localStorage.removeItem('contabilidade50_cliente_ativo_id_v1')
    }
  } catch {
    /* intentionally ignored */
  }

  return {
    success: true,
    totalDiagnosticos,
    totalSimulacoes,
    totalRelatorios,
  }
}

/**
 * Transfere a carteira de clientes (e registros vinculados) de um analista para outro (ou para o master).
 */
export async function transferirCarteiraAnalista(params: {
  analistaOrigemId: string
  analistaDestinoId: string
}): Promise<{ totalTransferidos: number }> {
  const { analistaOrigemId, analistaDestinoId } = params
  let totalTransferidos = 0

  // 1. Atualizar clientes vinculados na coleção 'clientes'
  try {
    const clientesLista = await pb
      .collection('clientes')
      .getFullList({
        filter: `user_id = "${analistaOrigemId}"`,
      })
      .catch(() => [])

    for (const c of clientesLista) {
      await pb.collection('clientes').update(c.id, {
        user_id: analistaDestinoId,
      })
      totalTransferidos++
    }
  } catch (err) {
    console.error('Erro ao transferir clientes:', err)
  }

  // 2. Atualizar clientes_empresas vinculados se o analista era o dono
  try {
    const empresasLista = await pb
      .collection('clientes_empresas')
      .getFullList({
        filter: `user_id = "${analistaOrigemId}"`,
      })
      .catch(() => [])

    for (const ce of empresasLista) {
      await pb.collection('clientes_empresas').update(ce.id, {
        user_id: analistaDestinoId,
      })
    }
  } catch (err) {
    console.warn('Erro ao transferir clientes_empresas:', err)
  }

  // 3. Atualizar convites pendentes/aceitos do analista de origem
  try {
    const convites = await pb
      .collection('convites_clientes')
      .getFullList({
        filter: `analista_id = "${analistaOrigemId}"`,
      })
      .catch(() => [])

    for (const conv of convites) {
      await pb.collection('convites_clientes').update(conv.id, {
        analista_id: analistaDestinoId,
      })
    }
  } catch (err) {
    console.warn('Erro ao transferir convites:', err)
  }

  // 4. Atualizar diagnósticos e simulações com user_id do analista de origem
  try {
    const diags = await pb
      .collection('diagnosticos')
      .getFullList({
        filter: `user_id = "${analistaOrigemId}"`,
      })
      .catch(() => [])
    for (const d of diags) {
      await pb
        .collection('diagnosticos')
        .update(d.id, { user_id: analistaDestinoId })
        .catch(() => {})
    }
  } catch {
    /* intentionally ignored */
  }

  try {
    const sims = await pb
      .collection('simulacoes_calculadora')
      .getFullList({
        filter: `user_id = "${analistaOrigemId}"`,
      })
      .catch(() => [])
    for (const s of sims) {
      await pb
        .collection('simulacoes_calculadora')
        .update(s.id, { user_id: analistaDestinoId })
        .catch(() => {})
    }
  } catch {
    /* intentionally ignored */
  }

  return { totalTransferidos }
}

/**
 * Exclui um Analista:
 * 1. Transfere os clientes da carteira dele para o analista destino (ou master)
 * 2. Remove o registro do usuário na coleção 'users'
 */
export async function excluirAnalista(params: {
  analistaId: string
  analistaDestinoId: string
}): Promise<{ success: boolean; totalTransferidos: number }> {
  const { analistaId, analistaDestinoId } = params

  // 1. Transfere a carteira antes de excluir
  const { totalTransferidos } = await transferirCarteiraAnalista({
    analistaOrigemId: analistaId,
    analistaDestinoId,
  })

  // 2. Remove o usuário analista da coleção 'users'
  await pb.collection('users').delete(analistaId)

  return { success: true, totalTransferidos }
}

/**
 * Exclui um Usuário do sistema (Aba Usuários & Permissões):
 * - Marco Chagas (marcoschagasdiamond@icloud.com ou nivel_acesso = 'master') NUNCA pode ser excluído
 * - Apenas Master pode excluir Admins
 * - Trata vínculos órfãos desassociando ou transferindo para o master
 */
export async function excluirUsuario(params: {
  usuarioId: string
  executorNivel: NivelAcesso
  executorEmail?: string
  masterId?: string
}): Promise<boolean> {
  const { usuarioId, executorNivel, executorEmail, masterId } = params

  // 1. Carrega dados do usuário a ser excluído
  const alvo = await pb.collection('users').getOne(usuarioId)
  if (!alvo) {
    throw new Error('Usuário não encontrado.')
  }

  const emailAlvo = (alvo.email || '').toLowerCase()
  const nivelAlvo = ((alvo as any).nivel_acesso || alvo.role || 'empresario') as NivelAcesso

  // Marco Chagas NUNCA pode ser excluído
  if (emailAlvo === 'marcoschagasdiamond@icloud.com' || nivelAlvo === 'master') {
    throw new Error(
      'O Administrador Master (Dr. Marco Chagas) é o titular vitalício e não pode ser excluído.',
    )
  }

  // Apenas Master pode excluir Admins
  const ehMasterExecutor =
    executorNivel === 'master' || executorEmail?.toLowerCase() === 'marcoschagasdiamond@icloud.com'
  if (nivelAlvo === 'admin' && !ehMasterExecutor) {
    throw new Error(
      'Permissão negada: apenas o Administrador Master tem autoridade para excluir Administradores.',
    )
  }

  // 2. Trata vínculos órfãos:
  // Se tiver clientes vinculados e houver masterId, transfere a posse dos clientes para o master
  if (masterId && masterId !== usuarioId) {
    try {
      await transferirCarteiraAnalista({
        analistaOrigemId: usuarioId,
        analistaDestinoId: masterId,
      })
    } catch (e) {
      console.warn('Erro ao reassociar registros ao master:', e)
    }
  }

  // 3. Exclui o registro na coleção users
  await pb.collection('users').delete(usuarioId)

  return true
}

export async function obterMetricasAnalistas(): Promise<AnalistaMetricasItem[]> {
  const [usuarios, clientesGlobais, diags, sims] = await Promise.all([
    listarTodosUsuarios(),
    listarClientesVisaoGlobal(),
    pb
      .collection('diagnosticos')
      .getFullList({ fields: 'id,user_id' })
      .catch(() => []),
    pb
      .collection('simulacoes_calculadora')
      .getFullList({ fields: 'id,user_id' })
      .catch(() => []),
  ])

  // Filtrar apenas usuários com perfil analista/contador ou admins
  const analistas = usuarios.filter(
    (u) =>
      u.nivel_acesso === 'analista' ||
      u.perfil === 'contador' ||
      u.nivel_acesso === 'admin' ||
      u.nivel_acesso === 'master',
  )

  const diagsPorUser = new Map<string, number>()
  diags.forEach((d: any) => {
    if (d.user_id) diagsPorUser.set(d.user_id, (diagsPorUser.get(d.user_id) || 0) + 1)
  })

  const simsPorUser = new Map<string, number>()
  sims.forEach((s: any) => {
    if (s.user_id) simsPorUser.set(s.user_id, (simsPorUser.get(s.user_id) || 0) + 1)
  })

  return analistas.map((a) => {
    const carteira = clientesGlobais.filter((c) => c.analista_id === a.id)
    const diagsCarteira = carteira.reduce((acc, c) => acc + c.total_diagnosticos, 0)
    const simsCarteira = carteira.reduce((acc, c) => acc + c.total_simulacoes, 0)

    const diagsDiretos = diagsPorUser.get(a.id) || 0
    const simsDiretos = simsPorUser.get(a.id) || 0

    return {
      id: a.id,
      name: a.name,
      email: a.email,
      nivel_acesso: a.nivel_acesso,
      total_clientes: carteira.length,
      total_diagnosticos: Math.max(diagsCarteira, diagsDiretos),
      total_simulacoes: Math.max(simsCarteira, simsDiretos),
      ultimo_acesso_ou_criado: a.updated || a.created || '',
      clientes_carteira: carteira,
      // Dados do escritório adquirente
      escritorio_nome: a.escritorio_nome,
      escritorio_responsavel: a.escritorio_responsavel,
      escritorio_cnpj: a.escritorio_cnpj,
      escritorio_email: a.escritorio_email,
      escritorio_telefone: a.escritorio_telefone,
      escritorio_uf: a.escritorio_uf,
      escritorio_cidade: a.escritorio_cidade,
      escritorio_cadastrado: a.escritorio_cadastrado,
    }
  })
}

/**
 * Atualiza o controle comercial do Analista:
 * - valor_mensal_personalizado (padrão R$ 347, pode ser abaixado pelo admin)
 * - status_operacao ('autorizado' | 'suspenso')
 * - autorizado_por e autorizado_em
 */
export async function atualizarControleComercialAnalista(params: {
  analistaId: string
  status_operacao: 'autorizado' | 'suspenso'
  valor_mensal_personalizado?: number | null
  autorizadorId?: string
}): Promise<boolean> {
  const { analistaId, status_operacao, valor_mensal_personalizado, autorizadorId } = params

  const payload: Record<string, any> = {
    status_operacao,
    valor_mensal_personalizado:
      typeof valor_mensal_personalizado === 'number' && valor_mensal_personalizado >= 0
        ? valor_mensal_personalizado
        : null,
  }

  if (autorizadorId) {
    payload.autorizado_por = autorizadorId
    payload.autorizado_em = new Date().toISOString()
  }

  await pb.collection('users').update(analistaId, payload)
  return true
}

/**
 * Atualiza dados cadastrais básicos de um usuário (nome, e-mail, telefone/whats)
 */
export async function atualizarDadosBasicosUsuario(params: {
  usuarioId: string
  name: string
}): Promise<boolean> {
  const { usuarioId, name } = params
  await pb.collection('users').update(usuarioId, { name })
  return true
}

/**
 * Suspende ou reactiva o acesso de um usuário empresário/cliente
 */
export async function alternarStatusOperacaoUsuario(params: {
  usuarioId: string
  novoStatus: 'autorizado' | 'suspenso'
  autorizadorId?: string
}): Promise<boolean> {
  const { usuarioId, novoStatus, autorizadorId } = params
  const payload: Record<string, any> = {
    status_operacao: novoStatus,
  }
  if (autorizadorId) {
    payload.autorizado_por = autorizadorId
    payload.autorizado_em = new Date().toISOString()
  }
  await pb.collection('users').update(usuarioId, payload)
  return true
}

/**
 * Criação manual de usuário pelo Master/Admin chamando o hook do backend
 */
export async function incluirUsuarioManual(params: {
  nome: string
  email: string
  whatsapp?: string
  nivel_acesso: NivelAcesso
  permissoes_json?: PermissaoMaster[]
  valor_mensal_personalizado?: number
  status_operacao?: 'autorizado' | 'suspenso'
}): Promise<{ success: boolean; message?: string; error?: string; email_enviado?: boolean }> {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const res = await pb.send('/backend/v1/usuarios/incluir-manual', {
      method: 'POST',
      body: {
        nome: params.nome.trim(),
        email: params.email.trim().toLowerCase(),
        whatsapp: params.whatsapp?.trim(),
        nivel_acesso: params.nivel_acesso,
        permissoes_json: params.permissoes_json || [],
        valor_mensal_personalizado: params.valor_mensal_personalizado,
        status_operacao: params.status_operacao || 'autorizado',
        base_url: origin,
      },
    })
    return res
  } catch (err: any) {
    console.error('Erro ao incluir usuário manualmente:', err)
    return {
      success: false,
      error:
        err?.data?.message ||
        err?.message ||
        'Não foi possível criar o usuário. Verifique se o e-mail já existe.',
    }
  }
}

/**
 * Envio de convite com nível pré-definido (admin, analista, empresario)
 */
export async function enviarConviteComNivel(params: {
  email: string
  nivel_convite: NivelAcesso
  whatsapp?: string
  mensagem?: string
  cliente_id?: string
  cliente_nome?: string
}): Promise<{ success: boolean; link?: string; error?: string }> {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const res = await pb.send('/backend/v1/convites/enviar', {
      method: 'POST',
      body: {
        email: params.email.trim().toLowerCase(),
        nivel_convite: params.nivel_convite,
        whatsapp: params.whatsapp?.trim(),
        mensagem: params.mensagem?.trim(),
        cliente_id: params.cliente_id || '',
        cliente_nome: params.cliente_nome || '',
        base_url: origin,
      },
    })
    return res
  } catch (err: any) {
    console.error('Erro ao enviar convite com nível:', err)
    return {
      success: false,
      error: err?.data?.message || err?.message || 'Falha ao enviar convite por e-mail.',
    }
  }
}
