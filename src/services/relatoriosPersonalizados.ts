import pb from '@/lib/pocketbase/client'
import type {
  RelatorioPersonalizadoRecord,
  ConfiguracaoRelatorioPersonalizado,
  ModuloAnaliseTipo,
  SecaoRelatorioTipo,
} from '@/types/relatorioPersonalizado'

const COLECAO = 'relatorios_personalizados'

export interface SalvarRelatorioPersonalizadoParams {
  id?: string
  nome: string
  empresa_nome?: string
  cnpj?: string
  cliente_id?: string | null
  empresa_id?: string | null
  user_id?: string | null
  analises_incluidas: ModuloAnaliseTipo[]
  secoes_selecionadas: SecaoRelatorioTipo[]
  observacoes?: string
  configuracao: ConfiguracaoRelatorioPersonalizado
}

/**
 * Salva ou atualiza um relatório personalizado no PocketBase
 */
export async function salvarRelatorioPersonalizado(
  params: SalvarRelatorioPersonalizadoParams,
): Promise<RelatorioPersonalizadoRecord> {
  const userId = params.user_id || pb.authStore.record?.id

  const payload: Record<string, any> = {
    nome: params.nome.trim() || 'Relatório Personalizado',
    empresa_nome: params.empresa_nome || '',
    cnpj: params.cnpj || '',
    cliente_id: params.cliente_id || '',
    empresa_id: params.empresa_id || '',
    user_id: userId || null,
    analises_incluidas: params.analises_incluidas,
    secoes_selecionadas: params.secoes_selecionadas,
    observacoes: params.observacoes || '',
    configuracao: params.configuracao,
  }

  if (params.id) {
    return await pb.collection(COLECAO).update<RelatorioPersonalizadoRecord>(params.id, payload)
  }

  return await pb.collection(COLECAO).create<RelatorioPersonalizadoRecord>(payload)
}

/**
 * Lista relatórios personalizados com filtros contextuais:
 * - Se userId for informado ou usuário for empresário, lista os dele
 * - Se clienteId for informado (visão do Analista com cliente ativo), filtra pelo cliente
 */
export async function listarRelatoriosPersonalizados(filtros?: {
  userId?: string | null
  clienteId?: string | null
  empresaId?: string | null
}): Promise<RelatorioPersonalizadoRecord[]> {
  try {
    const condicoes: string[] = []

    if (filtros?.clienteId) {
      condicoes.push(`cliente_id = "${filtros.clienteId}"`)
    } else if (filtros?.userId) {
      condicoes.push(`user_id = "${filtros.userId}"`)
    } else if (filtros?.empresaId) {
      condicoes.push(`empresa_id = "${filtros.empresaId}"`)
    }

    const filterString = condicoes.length > 0 ? condicoes.join(' || ') : undefined

    return await pb.collection(COLECAO).getFullList<RelatorioPersonalizadoRecord>({
      filter: filterString,
      sort: '-created',
    })
  } catch (err) {
    console.warn('[RelatoriosPersonalizados] Erro ao listar relatórios:', err)
    return []
  }
}

/**
 * Obtém um relatório personalizado pelo ID
 */
export async function obterRelatorioPersonalizadoPorId(
  id: string,
): Promise<RelatorioPersonalizadoRecord | null> {
  if (!id) return null
  try {
    return await pb.collection(COLECAO).getOne<RelatorioPersonalizadoRecord>(id)
  } catch (err) {
    console.warn(`[RelatoriosPersonalizados] Erro ao obter relatório ${id}:`, err)
    return null
  }
}

/**
 * Renomeia um relatório personalizado
 */
export async function renomearRelatorioPersonalizado(
  id: string,
  novoNome: string,
): Promise<RelatorioPersonalizadoRecord> {
  const relatorio = await pb.collection(COLECAO).getOne<RelatorioPersonalizadoRecord>(id)
  const novaConfig = {
    ...relatorio.configuracao,
    titulo: novoNome.trim(),
  }
  return await pb.collection(COLECAO).update<RelatorioPersonalizadoRecord>(id, {
    nome: novoNome.trim(),
    configuracao: novaConfig,
  })
}

/**
 * Exclui um relatório personalizado do banco
 */
export async function excluirRelatorioPersonalizado(id: string): Promise<boolean> {
  try {
    await pb.collection(COLECAO).delete(id)
    return true
  } catch (err) {
    console.error(`[RelatoriosPersonalizados] Erro ao excluir ${id}:`, err)
    return false
  }
}
