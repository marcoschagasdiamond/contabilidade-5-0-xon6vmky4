// ============================================================================
// VEDAÇÕES NA SIMULAÇÃO EXPRESSA (home "/")
// ============================================================================
// Dois níveis:
// 1. LOGADO: parte da matriz de vedações salva na fonte mestra
//    (clientes_empresas, via getClienteEmpresaPorClienteAtivo / PorUsuario).
// 2. ANÔNIMO: 1 pergunta extra no widget — qualquer "sim" sinaliza vedação
//    PROVÁVEL ao Simples (não confirmada), exibida como aviso orientativo.
//
// Indicativo apenas: não altera nenhuma fórmula de cálculo da calculadora,
// dos diagnósticos ou dos comparadores existentes.
// ============================================================================

import { ROTULO_INDISPONIVEL_VEDACAO } from './vedacoesSimples'
import {
  ROTULO_INDISPONIVEL_VEDACOES_PRESUMIDO,
  ROTULO_INDISPONIVEL_VEDACOES_MEI,
} from './vedacoesRegimes'

export type RegimeChave = 'simples' | 'presumido' | 'real'

/** Estado de um regime na Simulação Expressa, dada a matriz de vedações aplicada. */
export type StatusRegimeSimulacao = 'disponivel' | 'vedado' | 'possivel_vedacao'

export interface MatrizVedacoesSimulacao {
  /** true quando a matriz parte dos dados salvos do usuário logado (nível 1). */
  origemCadastro: boolean
  /** Regimes marcados como vedados na fonte mestra (apenas nível logado). */
  vedadosSimples: boolean
  vedadosPresumido: boolean
  vedadosMei: boolean
  /** Perfil cru da fonte mestra (para exibir rótulos, se necessário). */
  perfil: {
    vedacoesSimplesArt17?: string[]
    vedacaoSimplesArt17Outra?: string
    vedacoesPresumido?: string[]
    vedacaoPresumidoOutra?: string
    vedacoesMei?: string[]
    vedacaoMeiOutra?: string
  }
}

export const MATRIZ_VAZIA_SIMULACAO: MatrizVedacoesSimulacao = {
  origemCadastro: false,
  vedadosSimples: false,
  vedadosPresumido: false,
  vedadosMei: false,
  perfil: {},
}

/** Situações da pergunta extra do widget (nível anônimo). */
export const OPCOES_VEDACAO_ANONIMA = [
  {
    id: 'debito_inss_fazenda',
    rotulo: 'Débito com INSS ou Fazendas Públicas sem exigibilidade suspensa',
  },
  {
    id: 'socio_outra_empresa',
    rotulo: 'Sócio titular/participante de outra empresa',
  },
] as const

export type IdVedacaoAnonima = (typeof OPCOES_VEDACAO_ANONIMA)[number]['id']

/** Rótulo do regime "Possível vedação — confirmar com contador" (nível anônimo). */
export const ROTULO_POSSIVEL_VEDACAO_SIMPLES = 'Possível vedação — confirmar com contador'

/**
 * Matriz de vedações para o nível LOGADO, a partir do perfil da fonte mestra.
 * Tolerante a undefined/registros antigos: devolve matriz vazia.
 */
export function matrizVedacoesDoPerfil(
  perfil?: {
    vedacoesSimplesArt17?: string[]
    vedacaoSimplesArt17Outra?: string
    vedacoesPresumido?: string[]
    vedacaoPresumidoOutra?: string
    vedacoesMei?: string[]
    vedacaoMeiOutra?: string
  } | null,
): MatrizVedacoesSimulacao {
  const temSimples =
    Boolean(perfil?.vedacoesSimplesArt17?.length) ||
    Boolean(perfil?.vedacaoSimplesArt17Outra?.trim())
  const temPresumido =
    Boolean(perfil?.vedacoesPresumido?.length) || Boolean(perfil?.vedacaoPresumidoOutra?.trim())
  const temMei = Boolean(perfil?.vedacoesMei?.length) || Boolean(perfil?.vedacaoMeiOutra?.trim())

  if (!temSimples && !temPresumido && !temMei) return MATRIZ_VAZIA_SIMULACAO

  return {
    origemCadastro: true,
    vedadosSimples: temSimples,
    vedadosPresumido: temPresumido,
    vedadosMei: temMei,
    perfil: {
      vedacoesSimplesArt17: perfil?.vedacoesSimplesArt17 || [],
      vedacaoSimplesArt17Outra: perfil?.vedacaoSimplesArt17Outra || '',
      vedacoesPresumido: perfil?.vedacoesPresumido || [],
      vedacaoPresumidoOutra: perfil?.vedacaoPresumidoOutra || '',
      vedacoesMei: perfil?.vedacoesMei || [],
      vedacaoMeiOutra: perfil?.vedacaoMeiOutra || '',
    },
  }
}

/** Há alguma vedação marcada nas respostas anônimas do widget? */
export function temVedacaoAnonima(selecionadas: IdVedacaoAnonima[]): boolean {
  return selecionadas.length > 0
}

/**
 * Status de um regime na simulação, combinando matriz logada + resposta anônima.
 * - Logado com vedação registrada: regime sai da simulação ("Indisponível — vedação legal").
 * - Anônimo com situação marcada: Simples aparece como "Possível vedação — confirmar com contador".
 * - Caso contrário: disponível.
 */
export function statusRegimeNaSimulacao(
  regime: RegimeChave,
  matriz: MatrizVedacoesSimulacao,
  vedacaoAnonima: boolean,
): { status: StatusRegimeSimulacao; rotulo: string } {
  if (regime === 'simples') {
    if (matriz.vedadosSimples) return { status: 'vedado', rotulo: ROTULO_INDISPONIVEL_VEDACAO }
    if (vedacaoAnonima)
      return { status: 'possivel_vedacao', rotulo: ROTULO_POSSIVEL_VEDACAO_SIMPLES }
    return { status: 'disponivel', rotulo: '' }
  }
  if (regime === 'presumido') {
    if (matriz.vedadosPresumido)
      return { status: 'vedado', rotulo: ROTULO_INDISPONIVEL_VEDACOES_PRESUMIDO }
    return { status: 'disponivel', rotulo: '' }
  }
  if (matriz.vedadosMei) return { status: 'vedado', rotulo: ROTULO_INDISPONIVEL_VEDACOES_MEI }
  return { status: 'disponivel', rotulo: '' }
}

/**
 * Regime recomendado na Simulação Expressa, dada a matriz de vedações.
 * Sem vedação: segue o regime "atual" do usuário (comportamento anterior).
 * Com vedação (logada ou provável): foca nos regimes disponíveis — Presumido
 * quando o Simples está vedado/provável; Lucro Real quando o Presumido também está.
 */
export function regimeRecomendadoSimulacao(
  regimeAtual: RegimeChave,
  matriz: MatrizVedacoesSimulacao,
  vedacaoAnonima: boolean,
): { regime: RegimeChave; motivo: string } {
  const stSimples = statusRegimeNaSimulacao('simples', matriz, vedacaoAnonima)
  const stPresumido = statusRegimeNaSimulacao('presumido', matriz, vedacaoAnonima)

  const simplesOk = stSimples.status === 'disponivel'
  const presumidoOk = stPresumido.status === 'disponivel'

  // Nada vedado: mantém comportamento padrão (recomenda o regime atual informado)
  if (simplesOk && presumidoOk && !matriz.vedadosMei) {
    return { regime: regimeAtual, motivo: '' }
  }

  if (presumidoOk) {
    return {
      regime: 'presumido',
      motivo:
        stSimples.status === 'possivel_vedacao'
          ? 'Simples com possível vedação (art. 17, LC 123/2006) — recomendação foca no Lucro Presumido até confirmação com contador.'
          : 'Simples Nacional indisponível por vedação legal (art. 17, LC 123/2006) — análise foca em Lucro Presumido e Lucro Real.',
    }
  }

  return {
    regime: 'real',
    motivo:
      'Simples e Lucro Presumido indisponíveis por vedação legal — análise foca no Lucro Real.',
  }
}

/**
 * Descrição da economia exibida no card de resultado quando há vedação,
 * substituindo a descrição base do regime atual.
 */
export function descricaoEconomiaComVedacao(motivo: string, descricaoPadrao: string): string {
  return motivo || descricaoPadrao
}

/** Mensagem de alerta exibida no widget (usada no card de resultado). */
export function alertaVedacaoTexto(
  matriz: MatrizVedacoesSimulacao,
  vedacaoAnonima: boolean,
): string | null {
  if (matriz.origemCadastro) {
    const itens: string[] = []
    if (matriz.vedadosSimples) itens.push('Simples Nacional')
    if (matriz.vedadosPresumido) itens.push('Lucro Presumido')
    if (matriz.vedadosMei) itens.push('MEI')
    if (itens.length === 0) return null
    return `Conforme seus Dados da Empresa, há vedação legal registrada para: ${itens.join(', ')}.`
  }
  if (vedacaoAnonima) {
    return 'Situação marcada sugere vedação provável ao Simples Nacional (art. 17, LC 123/2006) — confirme com um contador.'
  }
  return null
}
