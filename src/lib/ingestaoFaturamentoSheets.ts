/**
 * Fonte Google Sheets da camada de ingestão de faturamento.
 *
 * Cada usuário conecta a SUA PRÓPRIA conta Google dentro do app
 * (ConnectorButton, toolkit 'googlesheets' — habilitado via app connectors).
 * A leitura usa o execute() de skipConnectors.ts — nunca OAuth manual, $http
 * ou secrets. Nada é gravado aqui: a função devolve uma intermediária
 * análoga à IngestaoPlanilhaIntermediaria (arquivo) e o modal transforma em
 * pré-visualização; a gravação continua sendo responsabilidade da página
 * (DadosEmpresaContext.salvar()).
 */
import { execute } from '@/lib/skipConnectors'
import type { LinhaPlanilhaBruta } from '@/lib/ingestaoFaturamento'

export interface IngestaoSheetsIntermediaria {
  sucesso: boolean
  erro?: string
  id: string
  titulo?: string
  colunas: string[]
  linhas: LinhaPlanilhaBruta[]
  totalLinhas: number
  amostra: LinhaPlanilhaBruta[]
}

const MSG_LINK_INVALIDO =
  'Link do Google Sheets não reconhecido. Cole o endereço completo da planilha (…/d/<ID>/edit) ou o próprio ID.'

const MSG_SEM_ACESSO =
  'Não foi possível acessar a planilha. Verifique se ela foi compartilhada com sua conta Google conectada (permissão de leitor ou superior) e tente novamente.'

const MSG_SEM_DADOS =
  'A planilha foi acessada, mas não contém dados legíveis. Verifique se a primeira aba tem cabeçalho e valores na mesma linha.'

/**
 * Extrai o ID da planilha de um link do Google Sheets (…/d/<ID>/edit…) ou
 * aceita o ID puro. Retorna null quando não reconhece.
 */
export function extrairIdPlanilha(entrada: string): string | null {
  const texto = (entrada || '').trim()
  if (!texto) return null
  const m = texto.match(/\/d\/([a-zA-Z0-9-_]+)/)
  if (m?.[1]) return m[1]
  // ID puro: sem barra, sem espaço e dentro do alfabeto de IDs do Google
  if (/^[a-zA-Z0-9-_]{20,}$/.test(texto)) return texto
  return null
}

/**
 * Caminha defensivamente pelo JSON da resposta do conector procurando o
 * PRIMEIRO array-de-arrays de células (linhas de valores). A forma exata da
 * resposta pode divergir da documentada (ex.: data.spreadsheet.valueRanges
 * .ranges) — nunca confiamos nela.
 */
function procurarPrimeiroArrayDeArrays(value: unknown, depth = 0): unknown[][] | null {
  if (depth > 8) return null
  if (Array.isArray(value)) {
    if (value.length > 0 && value.every((l) => Array.isArray(l))) {
      return value as unknown[][]
    }
    for (const item of value) {
      const achado = procurarPrimeiroArrayDeArrays(item, depth + 1)
      if (achado) return achado
    }
    return null
  }
  if (typeof value === 'object' && value !== null) {
    for (const item of Object.values(value as Record<string, unknown>)) {
      const achado = procurarPrimeiroArrayDeArrays(item, depth + 1)
      if (achado) return achado
    }
  }
  return null
}

/** Erro do provedor é acesso negado / inexistente? (403/404/permissão) */
function ehErroAcesso(mensagem: string): boolean {
  const m = (mensagem || '').toLowerCase()
  return (
    m.includes('403') ||
    m.includes('404') ||
    m.includes('permission') ||
    m.includes('permiss') ||
    m.includes('denied') ||
    m.includes('negad') ||
    m.includes('not found') ||
    m.includes('não encontrado') ||
    m.includes('nao encontrado') ||
    m.includes('unauthorized') ||
    m.includes('forbidden') ||
    m.includes('disabled') ||
    m.includes('not connected')
  )
}

/** Normaliza células em LinhaPlanilhaBruta (1ª linha = cabeçalho). */
function normalizarLinhas(valores: unknown[][]): {
  colunas: string[]
  linhas: LinhaPlanilhaBruta[]
} {
  const paraTexto = (v: unknown): string => {
    if (v === null || v === undefined) return ''
    if (typeof v === 'object') return JSON.stringify(v)
    return String(v)
  }

  const brutas = valores.map((linha) =>
    (Array.isArray(linha) ? linha : []).map((c) => paraTexto(c)),
  )
  if (brutas.length === 0) return { colunas: [], linhas: [] }

  const largura = brutas.reduce((acc, l) => Math.max(acc, l.length), 0)

  const cabecalho = brutas[0].map((c, i) => {
    const nome = c.trim()
    return nome || `Coluna ${i + 1}`
  })
  while (cabecalho.length < largura) {
    cabecalho.push(`Coluna ${cabecalho.length + 1}`)
  }

  const linhas: LinhaPlanilhaBruta[] = []
  for (const bruta of brutas.slice(1)) {
    const temConteudo = bruta.some((c) => c.trim() !== '')
    if (!temConteudo) continue
    const objeto: LinhaPlanilhaBruta = {}
    for (let i = 0; i < largura; i++) {
      objeto[cabecalho[i]] = bruta[i] ?? ''
    }
    linhas.push(objeto)
  }

  return { colunas: cabecalho, linhas }
}

/**
 * Lê a planilha do Google Sheets do usuário (1ª aba) e devolve a intermediária
 * para o modal montar a pré-visualização. Qualquer falha de acesso ou de dados
 * legíveis devolve { sucesso: false, erro } — NADA é gravado.
 */
export async function importarFaturamentoGoogleSheets(
  entrada: string,
): Promise<IngestaoSheetsIntermediaria> {
  const id = extrairIdPlanilha(entrada)
  if (!id) {
    return {
      sucesso: false,
      erro: MSG_LINK_INVALIDO,
      id: '',
      colunas: [],
      linhas: [],
      totalLinhas: 0,
      amostra: [],
    }
  }

  let data: unknown = null
  let titulo: string | undefined

  // Preferido: leitura de valores já formatados como número (UNFORMATTED_VALUE)
  const primario = await execute('GOOGLESHEETS_SPREADSHEETS_VALUES_BATCH_GET', {
    spreadsheet_id: id,
    valueRenderOption: 'UNFORMATTED_VALUE',
  }).catch((err: unknown) => ({
    successful: false,
    data: null,
    error: err instanceof Error ? err.message : String(err),
  }))

  if (primario.successful) {
    data = primario.data
    titulo = extrairTitulo(data)
  } else {
    const msgPrimario = primario.error || ''
    if (ehErroAcesso(msgPrimario)) {
      return {
        sucesso: false,
        erro: MSG_SEM_ACESSO,
        id,
        colunas: [],
        linhas: [],
        totalLinhas: 0,
        amostra: [],
      }
    }
    // Fallback: ferramenta alternativa de leitura com ranges explícitos
    const fallback = await execute('GOOGLESHEETS_BATCH_GET', {
      spreadsheet_id: id,
      ranges: ['A1:ZZ10000'],
    }).catch((err: unknown) => ({
      successful: false,
      data: null,
      error: err instanceof Error ? err.message : String(err),
    }))
    if (!fallback.successful) {
      return {
        sucesso: false,
        erro: ehErroAcesso(fallback.error || '')
          ? MSG_SEM_ACESSO
          : fallback.error || MSG_SEM_ACESSO,
        id,
        colunas: [],
        linhas: [],
        totalLinhas: 0,
        amostra: [],
      }
    }
    data = fallback.data
    titulo = extrairTitulo(data)
  }

  const valores = procurarPrimeiroArrayDeArrays(data)
  if (!valores || valores.length < 2) {
    return {
      sucesso: false,
      erro: MSG_SEM_DADOS,
      id,
      titulo,
      colunas: [],
      linhas: [],
      totalLinhas: 0,
      amostra: [],
    }
  }

  const { colunas, linhas } = normalizarLinhas(valores)
  if (linhas.length === 0) {
    return {
      sucesso: false,
      erro: MSG_SEM_DADOS,
      id,
      titulo,
      colunas: [],
      linhas: [],
      totalLinhas: 0,
      amostra: [],
    }
  }

  return {
    sucesso: true,
    id,
    titulo,
    colunas,
    linhas,
    totalLinhas: linhas.length,
    amostra: linhas.slice(0, 5),
  }
}

/** Tenta achar um título humano da planilha na resposta (best-effort). */
function extrairTitulo(data: unknown): string | undefined {
  if (typeof data === 'object' && data !== null) {
    const candidatos = [
      (data as any)?.spreadsheet?.properties?.title,
      (data as any)?.properties?.title,
      (data as any)?.spreadsheet?.title,
      (data as any)?.title,
      (data as any)?.name,
    ]
    for (const c of candidatos) {
      if (typeof c === 'string' && c.trim()) return c.trim()
    }
  }
  return undefined
}
