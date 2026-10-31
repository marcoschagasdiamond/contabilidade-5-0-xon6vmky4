import pb from '@/lib/pocketbase/client'
import type { DadosEmpresaPerfil } from '@/types/dadosEmpresa'
import type {
  HistoricoDadosEmpresaRegistro,
  ItemAlteracaoDadosEmpresa,
} from '@/types/historicoDadosEmpresa'

const LOCAL_STORAGE_HISTORICO_EMPRESA_KEY = 'contabilidade50_historico_dados_empresa_v1'

const ROTULOS_CAMPOS_EMPRESA: Record<string, string> = {
  nomeEmpresa: 'Razão Social / Nome da Empresa',
  nomeContato: 'Nome do Responsável / Contato',
  cnpj: 'CNPJ',
  email: 'E-mail Corporativo',
  telefone: 'Telefone / WhatsApp',
  ufOrigem: 'UF de Origem (ICMS)',
  cidade: 'Cidade / Município (ISS)',
  segmento: 'Segmento Econômico',
  regimeAtual: 'Regime Tributário Atual',
  funcionarios: 'Quadro de Colaboradores',
  emissaoNf: 'Perfil de Emissão de NF (B2B/B2C)',
  atividadeMista: 'Atividade Mista',
  tipoAtividade: 'Ramo Principal de Atividade',
  subatividadeServico: 'Subatividade de Serviço',
  subatividadeIndustria: 'Subatividade de Indústria',
  subatividadeComercio: 'Subatividade de Comércio',
  proporcaoServicoMisto: 'Proporção Serviço / Comércio',
  faturamentoMensal: 'Faturamento Mensal',
  percentualComprasVendas: '% Compras sobre Vendas',
  folhaPagamentoMensal: 'Folha de Pagamento Mensal',
  margemLucroEstimada: 'Margem de Lucro Estimada',
  despesasComCreditosMensais: 'Despesas com Crédito Mensais',
  percentualExportacao: '% de Exportação',
  anoBaseTransicao: 'Ano-Base da Transição',
}

function formatarValorEmpresa(campo: string, val: any): string {
  if (val === undefined || val === null || val === '') return 'Não informado'
  if (typeof val === 'boolean') return val ? 'Sim' : 'Não'
  if (typeof val === 'number') {
    if (
      campo.toLowerCase().includes('faturamento') ||
      campo.toLowerCase().includes('folha') ||
      campo.toLowerCase().includes('despesas')
    ) {
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }
    if (
      campo.toLowerCase().includes('percentual') ||
      campo.toLowerCase().includes('margem') ||
      campo.toLowerCase().includes('proporcao')
    ) {
      return `${val}%`
    }
    return val.toLocaleString('pt-BR')
  }
  return String(val)
}

/**
 * Calcula a lista de campos que mudaram entre a versão antiga e a nova dos Dados da Empresa.
 */
export function calcularDiffDadosEmpresa(
  antigo: Partial<DadosEmpresaPerfil>,
  novo: Partial<DadosEmpresaPerfil>,
): ItemAlteracaoDadosEmpresa[] {
  const alteracoes: ItemAlteracaoDadosEmpresa[] = []

  const chavesParaComparar = Object.keys(ROTULOS_CAMPOS_EMPRESA) as (keyof DadosEmpresaPerfil)[]

  for (const chave of chavesParaComparar) {
    const valAntigo = antigo[chave]
    const valNovo = novo[chave]

    // Ignora se o campo não estiver presente em nenhum dos dois
    if (valAntigo === undefined && valNovo === undefined) continue

    // Normaliza strings vazias e null
    const normAntigo = valAntigo === null ? '' : valAntigo
    const normNovo = valNovo === null ? '' : valNovo

    if (normAntigo !== normNovo && normNovo !== undefined) {
      // Se antigo não estava preenchido e novo veio com valor padrão idêntico, só ignora se for vazio
      if (
        (normAntigo === '' || normAntigo === undefined) &&
        (normNovo === '' || normNovo === undefined)
      ) {
        continue
      }

      alteracoes.push({
        campo: String(chave),
        rotulo: ROTULOS_CAMPOS_EMPRESA[String(chave)] || String(chave),
        valorAnterior: normAntigo ?? '',
        valorNovo: normNovo,
        valorAnteriorFormatado: formatarValorEmpresa(String(chave), normAntigo),
        valorNovoFormatado: formatarValorEmpresa(String(chave), normNovo),
      })
    }
  }

  return alteracoes
}

export function carregarHistoricoDadosEmpresaLocal(): HistoricoDadosEmpresaRegistro[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_HISTORICO_EMPRESA_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Erro ao ler histórico de dados da empresa local:', err)
    return []
  }
}

export function salvarHistoricoDadosEmpresaLocal(itens: HistoricoDadosEmpresaRegistro[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_HISTORICO_EMPRESA_KEY, JSON.stringify(itens.slice(0, 100)))
  } catch (err) {
    console.error('Erro ao salvar histórico de dados da empresa local:', err)
  }
}

/**
 * Registra um evento de auditoria imutável de alteração cadastral da empresa (de -> para, data/hora, autor).
 */
export async function registrarAuditoriaDadosEmpresa(dados: {
  empresaId?: string | null
  clienteId?: string | null
  userId?: string | null
  origemAjuste?: string // 'botao_corrigir_dados' | 'dados_empresa' | etc.
  descricao?: string
  nomeEmpresa?: string
  cnpj?: string
  alteracoes: ItemAlteracaoDadosEmpresa[]
  snapshotAnterior?: Partial<DadosEmpresaPerfil>
  snapshotNovo?: Partial<DadosEmpresaPerfil>
}): Promise<HistoricoDadosEmpresaRegistro> {
  const authUser = pb.authStore.record
  const effectiveUserId = dados.userId || authUser?.id || null
  const agoraIso = new Date().toISOString()

  const autorNome =
    (authUser as any)?.name ||
    authUser?.email?.split('@')[0] ||
    (effectiveUserId ? 'Usuário do Sistema' : 'Sessão Local')
  const autorEmail = authUser?.email || ''
  const autorNivel = ((authUser as any)?.nivel_acesso ||
    (authUser as any)?.role ||
    (authUser as any)?.perfil ||
    'empresario') as string

  const payload: Record<string, any> = {
    empresa_id: dados.empresaId || '',
    cliente_id: dados.clienteId || '',
    user_id: effectiveUserId,
    autor_nome: autorNome,
    autor_email: autorEmail,
    autor_nivel: autorNivel,
    origem_ajuste: dados.origemAjuste || 'dados_empresa',
    descricao:
      dados.descricao ||
      `Ajuste cadastral realizado por ${autorNome} (${dados.alteracoes.length} campo(s) alterado(s))`,
    nome_empresa: dados.nomeEmpresa || dados.snapshotNovo?.nomeEmpresa || '',
    cnpj: dados.cnpj || dados.snapshotNovo?.cnpj || '',
    alteracoes_json: dados.alteracoes,
    snapshot_anterior_json: dados.snapshotAnterior || {},
    snapshot_novo_json: dados.snapshotNovo || {},
  }

  // Persiste no PocketBase
  if (effectiveUserId) {
    try {
      const rec = await pb.collection('historico_dados_empresa').create<any>(payload)
      const auditReg: HistoricoDadosEmpresaRegistro = {
        id: rec.id,
        empresa_id: rec.empresa_id,
        cliente_id: rec.cliente_id,
        user_id: rec.user_id,
        autor_nome: rec.autor_nome,
        autor_email: rec.autor_email,
        autor_nivel: rec.autor_nivel,
        origem_ajuste: rec.origem_ajuste,
        descricao: rec.descricao,
        nome_empresa: rec.nome_empresa,
        cnpj: rec.cnpj,
        alteracoes_json: rec.alteracoes_json || [],
        snapshot_anterior_json: rec.snapshot_anterior_json || {},
        snapshot_novo_json: rec.snapshot_novo_json || {},
        created: rec.created,
        updated: rec.updated,
      }

      // Atualiza também cache local
      const locais = carregarHistoricoDadosEmpresaLocal()
      salvarHistoricoDadosEmpresaLocal([auditReg, ...locais.filter((i) => i.id !== auditReg.id)])
      return auditReg
    } catch (err) {
      console.warn('Falha ao registrar auditoria de empresa no PocketBase:', err)
    }
  }

  // Fallback local se não autenticado no banco
  const localReg: HistoricoDadosEmpresaRegistro = {
    id: `local_audit_${Date.now()}`,
    empresa_id: dados.empresaId || undefined,
    cliente_id: dados.clienteId || undefined,
    user_id: effectiveUserId || undefined,
    autor_nome: autorNome,
    autor_email: autorEmail,
    autor_nivel: autorNivel,
    origem_ajuste: dados.origemAjuste,
    descricao: payload.descricao,
    nome_empresa: payload.nome_empresa,
    cnpj: payload.cnpj,
    alteracoes_json: dados.alteracoes,
    snapshot_anterior_json: dados.snapshotAnterior,
    snapshot_novo_json: dados.snapshotNovo,
    created: agoraIso,
  }

  const locais = carregarHistoricoDadosEmpresaLocal()
  salvarHistoricoDadosEmpresaLocal([localReg, ...locais])
  return localReg
}

/**
 * Busca o histórico de auditoria de alterações de uma empresa (por empresaId, clienteId ou userId)
 */
export async function listarAuditoriaDadosEmpresa(opcoes?: {
  empresaId?: string
  clienteId?: string
  userId?: string
  limite?: number
}): Promise<HistoricoDadosEmpresaRegistro[]> {
  try {
    const filtros: string[] = []
    if (opcoes?.empresaId) filtros.push(`empresa_id = "${opcoes.empresaId}"`)
    if (opcoes?.clienteId) filtros.push(`cliente_id = "${opcoes.clienteId}"`)
    if (opcoes?.userId) filtros.push(`user_id = "${opcoes.userId}"`)

    const filterString = filtros.length > 0 ? filtros.join(' || ') : ''

    const records = await pb.collection('historico_dados_empresa').getFullList<any>({
      filter: filterString || undefined,
      sort: '-created',
      requestKey: null,
    })

    return records.map((rec) => ({
      id: rec.id,
      empresa_id: rec.empresa_id,
      cliente_id: rec.cliente_id,
      user_id: rec.user_id,
      autor_nome: rec.autor_nome,
      autor_email: rec.autor_email,
      autor_nivel: rec.autor_nivel,
      origem_ajuste: rec.origem_ajuste,
      descricao: rec.descricao,
      nome_empresa: rec.nome_empresa,
      cnpj: rec.cnpj,
      alteracoes_json: rec.alteracoes_json || [],
      snapshot_anterior_json: rec.snapshot_anterior_json || {},
      snapshot_novo_json: rec.snapshot_novo_json || {},
      created: rec.created,
      updated: rec.updated,
    }))
  } catch (err) {
    console.warn('Erro ao listar auditoria no PocketBase, usando local:', err)
    return carregarHistoricoDadosEmpresaLocal()
  }
}
