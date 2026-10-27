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
    const records = await pb.collection('users').getFullList({
      sort: '-created',
      expand: 'criado_por',
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
      const totalD =
        (mapaDiagsPorCliente.get(c.id) || 0) +
        (c.cnpj_cpf ? mapaDiagsPorCliente.get(`cnpj_${c.cnpj_cpf}`) || 0 : 0)
      const totalS =
        (mapaSimsPorCliente.get(c.id) || 0) +
        (c.cnpj_cpf ? mapaSimsPorCliente.get(`cnpj_${c.cnpj_cpf}`) || 0 : 0)

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
      const ehAnalista =
        usuarioDono?.perfil === 'contador' || usuarioDono?.nivel_acesso === 'analista'

      const totalD =
        (mapaDiagsPorCliente.get(ce.id) || 0) +
        (ce.cnpj ? mapaDiagsPorCliente.get(`cnpj_${ce.cnpj}`) || 0 : 0) +
        (ce.email ? mapaDiagsPorCliente.get(`email_${ce.email.toLowerCase()}`) || 0 : 0)

      const totalS =
        (mapaSimsPorCliente.get(ce.id) || 0) +
        (ce.cnpj ? mapaSimsPorCliente.get(`cnpj_${ce.cnpj}`) || 0 : 0)

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
    }
  })
}
