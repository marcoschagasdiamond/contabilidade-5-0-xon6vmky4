/**
 * Auditoria dos Vínculos Societários / Grupo Econômico.
 *
 * Cada operação BEM-SUCEDIDA de adicionar/remover vínculo grava um registro em
 * `historico_vinculos` (JSON na própria empresa, clientes_empresas) com:
 * data/hora, usuário (id e nome), ação, nome/CNPJ da empresa afetada e tipo de
 * vínculo. Operação que falha NUNCA grava auditoria (o chamador só registra
 * depois que o update do banco confirma). Leitura limitada aos 20 mais recentes.
 */
import type { VinculoSocietario } from '@/types/dadosEmpresa'
import type { ClienteEmpresaRecord } from '@/services/clientesEmpresas'

export const MAX_HISTORICO_VINCULOS_ARMAZENADO = 100
export const LIMITE_EXIBICAO_HISTORICO_VINCULOS = 20

export type AcaoHistoricoVinculo =
  | 'vinculo_adicionado'
  | 'vinculo_removido'
  | 'faturamento_importado'
  | 'faturamento_importado_planilha'

export interface RegistroHistoricoVinculo {
  /** Data/hora ISO da operação bem-sucedida */
  data: string
  /** ID do usuário logado que executou a operação */
  usuario_id: string
  /** Nome do usuário logado (fallback: email) */
  usuario_nome: string
  /** Ação executada */
  acao: AcaoHistoricoVinculo
  /** Nome da empresa afetada (a vinculada/desvinculada) */
  empresa_nome: string
  /** CNPJ da empresa afetada (só dígitos, como gravado no vínculo) */
  empresa_cnpj: string
  /** Tipo de vínculo societário */
  tipo_vinculo: string
  /** Detalhe exclusivo do faturamento importado: "R$ X → R$ Y", quando acao = 'faturamento_importado' */
  detalhe_faturamento?: string
}

/**
 * Constrói um registro de auditoria a partir de um vínculo e da ação aplicada.
 */
export function criarRegistroHistoricoVinculo(
  vinculo: VinculoSocietario,
  acao: AcaoHistoricoVinculo,
  usuario: { id: string; nome: string },
): RegistroHistoricoVinculo {
  return {
    data: new Date().toISOString(),
    usuario_id: usuario.id,
    usuario_nome: usuario.nome,
    acao,
    empresa_nome: vinculo.nomeEmpresa || '',
    empresa_cnpj: vinculo.cnpj || '',
    tipo_vinculo: vinculo.papelCliente || '',
  }
}

/**
 * Anexa um registro ao histórico existente (mais recente no final), respeitando
 * o limite de armazenamento. Retorna novo array — nunca muta o original.
 */
export function anexarRegistroHistoricoVinculo(
  historicoAtual: RegistroHistoricoVinculo[] | string | null | undefined,
  registro: RegistroHistoricoVinculo | RegistroHistoricoVinculo[],
): RegistroHistoricoVinculo[] {
  const lista = normalizarHistoricoVinculos(historicoAtual)
  const novos = Array.isArray(registro) ? registro : [registro]
  const nova = [...lista, ...novos]
  if (nova.length > MAX_HISTORICO_VINCULOS_ARMAZENADO) {
    return nova.slice(nova.length - MAX_HISTORICO_VINCULOS_ARMAZENADO)
  }
  return nova
}

/** Normaliza o campo bruto do banco (array ou string JSON) em lista tipada. */
export function normalizarHistoricoVinculos(
  bruto: RegistroHistoricoVinculo[] | string | null | undefined,
): RegistroHistoricoVinculo[] {
  if (!bruto) return []
  if (Array.isArray(bruto)) return bruto as RegistroHistoricoVinculo[]
  if (typeof bruto === 'string') {
    try {
      const parsed = JSON.parse(bruto)
      return Array.isArray(parsed) ? (parsed as RegistroHistoricoVinculo[]) : []
    } catch {
      return []
    }
  }
  return []
}

/** Linha pronta para exibição no painel GE. */
export interface ItemHistoricoVinculoExibicao {
  chave: string
  dataFormatada: string
  acaoFormatada: string
  removido: boolean
  empresaNome: string
  empresaCnpj: string
  usuarioNome: string
  /** Detalhe "R$ X → R$ Y" quando a ação é faturamento importado */
  detalheFaturamento?: string
}

const ROTULO_ACAO: Record<AcaoHistoricoVinculo, string> = {
  vinculo_adicionado: 'Vínculo adicionado',
  vinculo_removido: 'Vínculo removido',
  faturamento_importado: 'Faturamento importado de arquivo',
  faturamento_importado_planilha: 'Faturamento importado de planilha',
}

/** Histórico para exibição: mais recente primeiro, limitado aos 20 primeiros. */
export function historicoParaExibicao(
  bruto: RegistroHistoricoVinculo[] | string | null | undefined,
): ItemHistoricoVinculoExibicao[] {
  return normalizarHistoricoVinculos(bruto)
    .filter((r) => !!r && typeof r === 'object' && !!r.data)
    .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0))
    .slice(0, LIMITE_EXIBICAO_HISTORICO_VINCULOS)
    .map((r, i) => ({
      chave: `${r.data}_${r.acao}_${i}_${r.empresa_cnpj || r.empresa_nome || ''}`,
      dataFormatada: formatarDataHistorico(r.data),
      acaoFormatada: ROTULO_ACAO[r.acao] || r.acao,
      removido: r.acao === 'vinculo_removido',
      empresaNome: r.empresa_nome || 'Empresa sem nome',
      empresaCnpj: r.empresa_cnpj || '',
      usuarioNome: r.usuario_nome || 'Desconhecido',
      detalheFaturamento:
        r.acao === 'faturamento_importado' || r.acao === 'faturamento_importado_planilha'
          ? r.detalhe_faturamento
          : undefined,
    }))
}

function formatarDataHistorico(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Extrai o histórico de auditoria de um registro do banco da empresa. */
export function extrairHistoricoDeRegistro(
  rec: ClienteEmpresaRecord | null | undefined,
): RegistroHistoricoVinculo[] {
  if (!rec) return []
  return normalizarHistoricoVinculos((rec as any).historico_vinculos)
}
