/**
 * Camada de INGESTÃO de faturamento (fundação para múltiplas fontes).
 *
 * Fontes hoje suportadas:
 *  - arquivo OFX (extrato bancário) → soma dos lançamentos de crédito (receita) no período
 *  - arquivo CSV/XLSX → reutiliza o parser consolidado da Calculadora (importacaoFaturamento.ts)
 *  - Google Sheets (planilha online via conector do usuário) → ingestaoFaturamentoSheets.ts
 *
 * Fontes futuras (API de ERP) entram aqui como novas implementações de
 * FonteFaturamento — os consumidores (GE, Fase 04, dossiê) continuam lendo os
 * mesmos campos gravados, sem alteração de comportamento.
 */
import {
  parseArquivoFaturamento,
  sugerirMapeamentoColunas,
  processarMapeamentoFaturamento,
  type LinhaPlanilhaBruta,
  type MapeamentoColunasFaturamento,
} from '@/lib/importacaoFaturamento'

export type TipoFonteFaturamento = 'ofx' | 'csv' | 'xlsx' | 'sheets'

export interface TransacaoOfx {
  tipo: 'credito' | 'debito'
  valor: number
  data: string
  descricao: string
}

export interface ResultadoIngestaoFaturamento {
  sucesso: boolean
  erro?: string
  tipoFonte: TipoFonteFaturamento
  nomeArquivo: string
  /** Total de receita identificada no período (R$) */
  receitaTotal: number
  /** Quantidade de lançamentos de receita considerados */
  qtdLancamentos: number
  periodoInicio?: string
  periodoFim?: string
  /** Detalhamento por lançamento (pré-visualização) */
  lancamentos: TransacaoOfx[]
  avisos: string[]
}

/** Detecta o tipo de fonte pelo nome/ conteúdo do arquivo */
export function detectarTipoFonte(nomeArquivo: string): TipoFonteFaturamento | null {
  const ext = nomeArquivo.split('.').pop()?.toLowerCase() || ''
  if (ext === 'ofx') return 'ofx'
  if (ext === 'csv' || ext === 'txt') return 'csv'
  if (ext === 'xlsx') return 'xlsx'
  return null
}

/* ========================================================================= */
/* PARSER OFX (SGML simples, versões OFX 1.x e 2.x)                           */
/* ========================================================================= */

function extrairTag(conteudo: string, tag: string): string | undefined {
  const m = conteudo.match(new RegExp(`<${tag}>([^<]*)`, 'i'))
  return m?.[1]?.trim()
}

function converterDataOfx(valor: string): string {
  // Formato OFX: YYYYMMDDHHMMSS ou YYYYMMDD
  const m = valor.match(/^(\d{4})(\d{2})(\d{2})/)
  if (!m) return valor
  return `${m[1]}-${m[2]}-${m[3]}`
}

export interface FiltroPeriodoOfx {
  /** Data inicial (YYYY-MM-DD) — lançamentos anteriores são descartados */
  inicio?: string
  /** Data final (YYYY-MM-DD) — lançamentos posteriores são descartados */
  fim?: string
}

export function parseOfxConteudo(
  conteudo: string,
  nomeArquivo: string,
  filtroPeriodo?: FiltroPeriodoOfx,
): ResultadoIngestaoFaturamento {
  if (!conteudo || !conteudo.includes('<STMTTRN')) {
    return {
      sucesso: false,
      erro: 'Arquivo OFX sem lançamentos (<STMTTRN> não encontrado). Verifique se o extrato exportado contém movimentação.',
      tipoFonte: 'ofx',
      nomeArquivo,
      receitaTotal: 0,
      qtdLancamentos: 0,
      lancamentos: [],
      avisos: [],
    }
  }

  const blocos = conteudo.split('<STMTTRN>').slice(1)
  const lancamentos: TransacaoOfx[] = []
  const avisos: string[] = []

  for (const bloco of blocos) {
    const tipoRaw = (extrairTag(bloco, 'TRNTYPE') || '').toUpperCase()
    const valorRaw = extrairTag(bloco, 'TRNAMT') || '0'
    const dataRaw = extrairTag(bloco, 'DTPOSTED') || ''
    const descricao = extrairTag(bloco, 'MEMO') || extrairTag(bloco, 'NAME') || 'Lançamento'

    const valorNum = Number(String(valorRaw).replace(',', '.'))
    if (isNaN(valorNum)) {
      avisos.push(`Lançamento com valor inválido ignorado: "${valorRaw}" (${descricao})`)
      continue
    }

    lancamentos.push({
      tipo: valorNum > 0 ? 'credito' : 'debito',
      valor: Math.abs(valorNum),
      data: converterDataOfx(dataRaw),
      descricao,
    })
  }

  // FILTRO DE PERÍODO (opcional, indicado pelo técnico no modal quando o
  // OFX cobre mais de um mês): descarta lançamentos fora da janela ANTES de
  // somar, tanto receitas quanto despesas.
  const dentroDoPeriodo = (data: string): boolean => {
    if (!data) return true
    if (filtroPeriodo?.inicio && data < filtroPeriodo.inicio) return false
    if (filtroPeriodo?.fim && data > filtroPeriodo.fim) return false
    return true
  }
  let foraDoPeriodo = 0
  const lancamentosFiltrados =
    filtroPeriodo?.inicio || filtroPeriodo?.fim
      ? lancamentos.filter((l) => {
          const ok = dentroDoPeriodo(l.data)
          if (!ok) foraDoPeriodo++
          return ok
        })
      : lancamentos
  if (foraDoPeriodo > 0) {
    avisos.push(
      `${foraDoPeriodo} lançamento(s) fora do período indicado (${filtroPeriodo?.inicio || 'início'} a ${filtroPeriodo?.fim || 'fim'}) foram ignorados.`,
    )
  }

  const creditos = lancamentosFiltrados.filter((l) => l.tipo === 'credito')
  const receitaTotal = Math.round(creditos.reduce((acc, l) => acc + l.valor, 0) * 100) / 100

  if (creditos.length === 0) {
    return {
      sucesso: false,
      erro: 'Nenhum lançamento de ENTRADA (crédito) encontrado no OFX. A receita do período precisa de ao menos um crédito no extrato.',
      tipoFonte: 'ofx',
      nomeArquivo,
      receitaTotal: 0,
      qtdLancamentos: 0,
      lancamentos: lancamentosFiltrados.filter((l) => l.tipo === 'credito'),
      avisos,
    }
  }

  const datas = creditos
    .map((l) => l.data)
    .filter(Boolean)
    .sort()
  const periodoInicio = datas[0]
  const periodoFim = datas[datas.length - 1]

  return {
    sucesso: true,
    tipoFonte: 'ofx',
    nomeArquivo,
    receitaTotal,
    qtdLancamentos: creditos.length,
    periodoInicio,
    periodoFim,
    lancamentos: creditos,
    avisos,
  }
}

/* ========================================================================= */
/* PARSER CSV/XLSX: normaliza em LinhaPlanilhaBruta e reusa o processador      */
/* ========================================================================= */

export interface IngestaoPlanilhaIntermediaria {
  sucesso: boolean
  erro?: string
  nomeArquivo: string
  colunas: string[]
  linhas: LinhaPlanilhaBruta[]
  totalLinhas: number
  amostra: LinhaPlanilhaBruta[]
}

export async function parsePlanilhaCsvXlsx(file: File): Promise<IngestaoPlanilhaIntermediaria> {
  const res = await parseArquivoFaturamento(file)
  if (!res.sucesso) {
    return {
      sucesso: false,
      erro: res.erro || 'Não foi possível ler a planilha enviada.',
      nomeArquivo: res.nomeArquivo,
      colunas: [],
      linhas: [],
      totalLinhas: 0,
      amostra: [],
    }
  }
  return {
    sucesso: true,
    nomeArquivo: res.nomeArquivo,
    colunas: res.colunas,
    linhas: res.linhas,
    totalLinhas: res.totalLinhas,
    amostra: res.amostra,
  }
}

export {
  sugerirMapeamentoColunas,
  processarMapeamentoFaturamento,
  type MapeamentoColunasFaturamento,
  type LinhaPlanilhaBruta,
}
