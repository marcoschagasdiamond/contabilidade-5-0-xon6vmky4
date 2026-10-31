/**
 * Utilitário para leitura e decodificação de planilhas CSV e XLSX (XML openxml nativo)
 * para importação de faturamento na Calculadora IBS/CBS.
 *
 * Suporta:
 * 1. Arquivos CSV com separador vírgula, ponto-e-vírgula ou tabulação, encoding UTF-8 / Latin1,
 *    com tratamento de aspas duplas e quebras de linha.
 * 2. Arquivos XLSX (OpenXML nativo descompactado via DecompressionStream do navegador)
 *    lendo sharedStrings.xml e sheet1.xml de forma robusta e sem dependências pesadas.
 * 3. Validação de formato com mensagens claras em Português.
 */

export interface LinhaPlanilhaBruta {
  [coluna: string]: string
}

export interface ResultadoParsePlanilha {
  sucesso: boolean
  erro?: string
  nomeArquivo: string
  colunas: string[]
  linhas: LinhaPlanilhaBruta[]
  totalLinhas: number
  amostra: LinhaPlanilhaBruta[]
}

export interface MapeamentoColunasFaturamento {
  colunaFaturamento: string
  colunaPeriodo?: string
  tipoFaturamento: 'mensal' | 'anual' | 'auto' // 'auto' calcula soma de meses se houver múltiplos
  colunaCompras?: string
  colunaFolha?: string
}

export interface FaturamentoExtraido {
  faturamentoMensal: number
  faturamentoAnual: number
  comprasMensal?: number
  folhaMensal?: number
  detalhamentoMeses?: { periodo: string; valor: number }[]
  totalMesesIdentificados: number
  avisos: string[]
}

/**
 * Converte valor textual em número decimal aceitando:
 * - Padrão brasileiro: "1.234.567,89" ou "1234,50" ou "R$ 50.000,00"
 * - Padrão internacional: "1,234,567.89" ou "1234.50" ou "$50,000.00"
 */
export function converterParaNumero(val: any): number {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val
  }
  if (!val) return 0

  let str = String(val).trim()
  if (!str) return 0

  // Remove símbolos de moeda e espaços
  str = str.replace(/[R$\s]/gi, '').trim()

  // Se tiver parênteses para negativo "(100)"
  const ehNegativo = str.startsWith('(') && str.endsWith(')')
  if (ehNegativo) {
    str = str.slice(1, -1).trim()
  }

  // Verifica se tem vírgula e ponto
  const temVirgula = str.includes(',')
  const temPonto = str.includes('.')

  if (temVirgula && temPonto) {
    const ultimoPonto = str.lastIndexOf('.')
    const ultimaVirgula = str.lastIndexOf(',')
    if (ultimaVirgula > ultimoPonto) {
      // Padrão BR: 1.250.000,50 -> remove ponto e troca vírgula por ponto
      str = str.replace(/\./g, '').replace(',', '.')
    } else {
      // Padrão US: 1,250,000.50 -> remove vírgula
      str = str.replace(/,/g, '')
    }
  } else if (temVirgula && !temPonto) {
    // 1500,50 -> padrão BR
    str = str.replace(',', '.')
  } else if (!temVirgula && temPonto) {
    // Pode ser 1.500 (milhar) ou 1500.50 (decimal)
    // Se tiver mais de um ponto ou exatamente 3 dígitos após o ponto no final (ex 50.000)
    const partes = str.split('.')
    if (partes.length > 2) {
      // 1.500.000 -> milhar
      str = str.replace(/\./g, '')
    } else if (partes.length === 2 && partes[1].length === 3 && parseInt(partes[0], 10) >= 1) {
      // Ambíguo, mas comum em planilhas sem casas decimais: 50.000 -> 50000
      // Porém pode ser 50.123. Se a parte inteira tem comprimento normal, checamos contexto.
      // Em números com decimais normalmente tem 2 casas. Se tiver 3 casas e for número redondo, tratamos milhar.
      if (partes[1] === '000') {
        str = partes[0] + partes[1]
      }
    }
  }

  const num = parseFloat(str)
  if (isNaN(num)) return 0
  return ehNegativo ? -num : num
}

/**
 * Divide linhas respeitando aspas
 */
function splitLinhasCsv(texto: string): string[] {
  const linhas: string[] = []
  let atual = ''
  let dentroAspas = false

  for (let i = 0; i < texto.length; i++) {
    const char = texto[i]
    if (char === '"') {
      dentroAspas = !dentroAspas
      atual += char
    } else if ((char === '\n' || char === '\r') && !dentroAspas) {
      if (char === '\r' && texto[i + 1] === '\n') {
        i++
      }
      if (atual.trim().length > 0) {
        linhas.push(atual)
      }
      atual = ''
    } else {
      atual += char
    }
  }
  if (atual.trim().length > 0) {
    linhas.push(atual)
  }
  return linhas
}

/**
 * Detecta delimitador (, ; ou \t)
 */
function detectarDelimitador(primeiraLinha: string): string {
  const contPontoEVirgula = (primeiraLinha.match(/;/g) || []).length
  const contVirgula = (primeiraLinha.match(/,/g) || []).length
  const contTab = (primeiraLinha.match(/\t/g) || []).length

  if (contTab > contPontoEVirgula && contTab > contVirgula) return '\t'
  if (contPontoEVirgula >= contVirgula) return ';'
  return ','
}

/**
 * Divide os campos de uma linha respeitando aspas
 */
function parseLinhaCsv(linha: string, delimitador: string): string[] {
  const campos: string[] = []
  let atual = ''
  let dentroAspas = false

  for (let i = 0; i < linha.length; i++) {
    const c = linha[i]
    if (c === '"') {
      if (dentroAspas && linha[i + 1] === '"') {
        atual += '"'
        i++
      } else {
        dentroAspas = !dentroAspas
      }
    } else if (c === delimitador && !dentroAspas) {
      campos.push(atual.trim())
      atual = ''
    } else {
      atual += c
    }
  }
  campos.push(atual.trim())
  return campos
}

/**
 * Realiza parse de conteúdo CSV puro
 */
export function parseCsvConteudo(
  conteudoTexto: string,
  nomeArquivo: string,
): ResultadoParsePlanilha {
  if (!conteudoTexto || !conteudoTexto.trim()) {
    return {
      sucesso: false,
      erro: 'O arquivo CSV está vazio ou ilegível.',
      nomeArquivo,
      colunas: [],
      linhas: [],
      totalLinhas: 0,
      amostra: [],
    }
  }

  const linhasBrutas = splitLinhasCsv(conteudoTexto)
  if (linhasBrutas.length < 2) {
    return {
      sucesso: false,
      erro: 'O arquivo precisa conter ao menos o cabeçalho e uma linha de dados de faturamento.',
      nomeArquivo,
      colunas: [],
      linhas: [],
      totalLinhas: 0,
      amostra: [],
    }
  }

  const delimitador = detectarDelimitador(linhasBrutas[0])
  const colunas = parseLinhaCsv(linhasBrutas[0], delimitador).map((c, idx) => {
    const limpo = c.replace(/^["']|["']$/g, '').trim()
    return limpo || `Coluna_${idx + 1}`
  })

  if (colunas.length === 0 || colunas.every((c) => !c)) {
    return {
      sucesso: false,
      erro: 'Não foi possível identificar o cabeçalho das colunas no arquivo.',
      nomeArquivo,
      colunas: [],
      linhas: [],
      totalLinhas: 0,
      amostra: [],
    }
  }

  const linhas: LinhaPlanilhaBruta[] = []
  for (let i = 1; i < linhasBrutas.length; i++) {
    const vals = parseLinhaCsv(linhasBrutas[i], delimitador)
    // Se a linha for toda vazia, ignora
    if (vals.every((v) => !v.trim())) continue

    const linhaObj: LinhaPlanilhaBruta = {}
    colunas.forEach((col, idx) => {
      linhaObj[col] = (vals[idx] || '').replace(/^["']|["']$/g, '').trim()
    })
    linhas.push(linhaObj)
  }

  if (linhas.length === 0) {
    return {
      sucesso: false,
      erro: 'Nenhuma linha de dados válida encontrada no arquivo CSV.',
      nomeArquivo,
      colunas,
      linhas: [],
      totalLinhas: 0,
      amostra: [],
    }
  }

  return {
    sucesso: true,
    nomeArquivo,
    colunas,
    linhas,
    totalLinhas: linhas.length,
    amostra: linhas.slice(0, 5),
  }
}

/**
 * Parser simples de ZIP/XLSX no navegador sem pacotes externos pesados
 * Um XLSX é um ZIP contendo `xl/sharedStrings.xml` e `xl/worksheets/sheet1.xml`
 */
async function extrairArquivosZip(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const mapa = new Map<string, Uint8Array>()
  const dataView = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  // Localiza os headers de arquivo local do ZIP (0x04034b50)
  let offset = 0
  const max = bytes.length - 30

  while (offset < max) {
    if (dataView.getUint32(offset, true) === 0x04034b50) {
      const compressionMethod = dataView.getUint16(offset + 8, true)
      const compressedSize = dataView.getUint32(offset + 18, true)
      const uncompressedSize = dataView.getUint32(offset + 22, true)
      const fileNameLength = dataView.getUint16(offset + 26, true)
      const extraFieldLength = dataView.getUint16(offset + 28, true)

      const fileNameBytes = bytes.slice(offset + 30, offset + 30 + fileNameLength)
      const fileName = new TextDecoder('utf-8').decode(fileNameBytes)

      const fileDataOffset = offset + 30 + fileNameLength + extraFieldLength
      const fileDataBytes = bytes.slice(fileDataOffset, fileDataOffset + compressedSize)

      if (compressedSize > 0) {
        if (compressionMethod === 0) {
          // Uncompressed
          mapa.set(fileName, fileDataBytes)
        } else if (compressionMethod === 8) {
          // Deflate
          try {
            if (typeof DecompressionStream !== 'undefined') {
              const stream = new Response(fileDataBytes).body?.pipeThrough(
                new DecompressionStream('deflate-raw'),
              )
              if (stream) {
                const decompressedBuffer = await new Response(stream).arrayBuffer()
                mapa.set(fileName, new Uint8Array(decompressedBuffer))
              }
            }
          } catch (_) {
            // Ignora arquivos que não conseguirmos descomprimir
          }
        }
      }

      offset = fileDataOffset + compressedSize
    } else {
      offset++
    }
  }

  return mapa
}

/**
 * Lê XML de XLSX descompactado e extrai linhas tabulares
 */
function parseXmlSheetXlsx(
  sheetXml: string,
  sharedStrings: string[],
): { colunas: string[]; linhas: LinhaPlanilhaBruta[] } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(sheetXml, 'application/xml')

  const rows = doc.getElementsByTagName('row')
  if (!rows || rows.length === 0) {
    return { colunas: [], linhas: [] }
  }

  const matrizValores: string[][] = []

  for (let r = 0; r < rows.length; r++) {
    const rowEl = rows[r]
    const cells = rowEl.getElementsByTagName('c')
    const linhaValores: string[] = []

    for (let c = 0; c < cells.length; c++) {
      const cell = cells[c]
      const t = cell.getAttribute('t')
      const rCoord = cell.getAttribute('r') || ''
      const vEl = cell.getElementsByTagName('v')[0]
      const rawVal = vEl ? vEl.textContent || '' : ''

      let cellValue = rawVal
      if (t === 's') {
        const strIdx = parseInt(rawVal, 10)
        if (!isNaN(strIdx) && sharedStrings[strIdx] !== undefined) {
          cellValue = sharedStrings[strIdx]
        }
      } else if (t === 'inlineStr') {
        const isEl = cell.getElementsByTagName('t')[0]
        if (isEl) cellValue = isEl.textContent || ''
      }

      // Calcula o índice da coluna baseado na letra da célula (A1, B1, etc)
      const colLetraMatch = rCoord.match(/^[A-Z]+/)
      if (colLetraMatch) {
        const letras = colLetraMatch[0]
        let colIdx = 0
        for (let l = 0; l < letras.length; l++) {
          colIdx = colIdx * 26 + (letras.charCodeAt(l) - 64)
        }
        colIdx = colIdx - 1
        while (linhaValores.length < colIdx) {
          linhaValores.push('')
        }
        linhaValores[colIdx] = cellValue
      } else {
        linhaValores.push(cellValue)
      }
    }

    if (linhaValores.some((v) => v && v.trim())) {
      matrizValores.push(linhaValores)
    }
  }

  if (matrizValores.length === 0) {
    return { colunas: [], linhas: [] }
  }

  const rawColunas = matrizValores[0]
  const colunas = rawColunas.map((col, idx) =>
    col && col.trim() ? col.trim() : `Coluna_${idx + 1}`,
  )

  const linhas: LinhaPlanilhaBruta[] = []
  for (let i = 1; i < matrizValores.length; i++) {
    const vals = matrizValores[i]
    if (vals.every((v) => !v || !v.trim())) continue
    const obj: LinhaPlanilhaBruta = {}
    colunas.forEach((col, idx) => {
      obj[col] = (vals[idx] || '').trim()
    })
    linhas.push(obj)
  }

  return { colunas, linhas }
}

/**
 * Lê sharedStrings.xml de um XLSX
 */
function parseSharedStringsXml(xmlStr: string): string[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlStr, 'application/xml')
  const siNodes = doc.getElementsByTagName('si')
  const strings: string[] = []

  for (let i = 0; i < siNodes.length; i++) {
    const si = siNodes[i]
    const tNodes = si.getElementsByTagName('t')
    let fullText = ''
    for (let j = 0; j < tNodes.length; j++) {
      fullText += tNodes[j].textContent || ''
    }
    strings.push(fullText)
  }

  return strings
}

/**
 * Parse principal de arquivo (File do browser) suportando CSV e XLSX
 */
export async function parseArquivoFaturamento(file: File): Promise<ResultadoParsePlanilha> {
  const nomeArquivo = file.name || 'arquivo'
  const extensao = nomeArquivo.split('.').pop()?.toLowerCase() || ''

  if (extensao === 'csv' || extensao === 'txt') {
    try {
      const texto = await file.text()
      return parseCsvConteudo(texto, nomeArquivo)
    } catch (e: any) {
      return {
        sucesso: false,
        erro: `Falha ao ler arquivo CSV: ${e?.message || 'erro de leitura'}`,
        nomeArquivo,
        colunas: [],
        linhas: [],
        totalLinhas: 0,
        amostra: [],
      }
    }
  }

  if (extensao === 'xlsx') {
    try {
      const buffer = await file.arrayBuffer()
      const zipArquivos = await extrairArquivosZip(buffer)

      // Shared strings
      let sharedStrings: string[] = []
      const ssEntry =
        zipArquivos.get('xl/sharedStrings.xml') || zipArquivos.get('xl/SharedStrings.xml')
      if (ssEntry) {
        const ssXml = new TextDecoder('utf-8').decode(ssEntry)
        sharedStrings = parseSharedStringsXml(ssXml)
      }

      // Procura primeira planilha
      let sheetEntry =
        zipArquivos.get('xl/worksheets/sheet1.xml') ||
        zipArquivos.get('xl/worksheets/Sheet1.xml') ||
        Array.from(zipArquivos.entries()).find(([k]) => k.startsWith('xl/worksheets/sheet'))?.[1]

      if (!sheetEntry) {
        return {
          sucesso: false,
          erro: 'A planilha XLSX não possui dados na aba principal.',
          nomeArquivo,
          colunas: [],
          linhas: [],
          totalLinhas: 0,
          amostra: [],
        }
      }

      const sheetXml = new TextDecoder('utf-8').decode(sheetEntry)
      const parsed = parseXmlSheetXlsx(sheetXml, sharedStrings)

      if (parsed.colunas.length === 0 || parsed.linhas.length === 0) {
        return {
          sucesso: false,
          erro: 'Nenhuma coluna ou linha legível encontrada na planilha Excel. Verifique se o arquivo possui dados preenchidos.',
          nomeArquivo,
          colunas: [],
          linhas: [],
          totalLinhas: 0,
          amostra: [],
        }
      }

      return {
        sucesso: true,
        nomeArquivo,
        colunas: parsed.colunas,
        linhas: parsed.linhas,
        totalLinhas: parsed.linhas.length,
        amostra: parsed.linhas.slice(0, 5),
      }
    } catch (e: any) {
      return {
        sucesso: false,
        erro: `Não foi possível processar a planilha XLSX: ${e?.message || 'formato corrompido ou compactação não suportada'}. Você também pode salvar o arquivo como CSV e tentar novamente.`,
        nomeArquivo,
        colunas: [],
        linhas: [],
        totalLinhas: 0,
        amostra: [],
      }
    }
  }

  return {
    sucesso: false,
    erro: `Formato de arquivo não suportado (.${extensao}). Envie uma planilha nos formatos CSV ou XLSX.`,
    nomeArquivo,
    colunas: [],
    linhas: [],
    totalLinhas: 0,
    amostra: [],
  }
}

/**
 * Sugere automaticamente as melhores colunas baseado nos nomes do cabeçalho
 */
export function sugerirMapeamentoColunas(colunas: string[]): Partial<MapeamentoColunasFaturamento> {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')

  let colunaFaturamento = ''
  let colunaPeriodo = ''
  let colunaCompras = ''
  let colunaFolha = ''

  for (const c of colunas) {
    const n = norm(c)
    if (!colunaFaturamento) {
      if (
        n.includes('faturamento') ||
        n.includes('receita') ||
        n.includes('receitabruta') ||
        n.includes('vendas') ||
        n.includes('totalvendas') ||
        n.includes('valorfaturado') ||
        n === 'valor'
      ) {
        colunaFaturamento = c
      }
    }
    if (!colunaPeriodo) {
      if (
        n.includes('mes') ||
        n.includes('competencia') ||
        n.includes('periodo') ||
        n.includes('ano') ||
        n.includes('data')
      ) {
        colunaPeriodo = c
      }
    }
    if (!colunaCompras) {
      if (
        n.includes('compra') ||
        n.includes('insumo') ||
        n.includes('fornecedor') ||
        n.includes('custo')
      ) {
        colunaCompras = c
      }
    }
    if (!colunaFolha) {
      if (
        n.includes('folha') ||
        n.includes('salario') ||
        n.includes('prolabore') ||
        n.includes('encargos')
      ) {
        colunaFolha = c
      }
    }
  }

  // Fallback se não achou faturamento mas tem alguma coluna com "valor" ou a primeira coluna
  if (!colunaFaturamento && colunas.length > 0) {
    colunaFaturamento =
      colunas.find((c) => norm(c).includes('valor')) || colunas[colunas.length - 1]
  }

  return {
    colunaFaturamento,
    colunaPeriodo,
    tipoFaturamento: 'auto',
    colunaCompras,
    colunaFolha,
  }
}

/**
 * Processa as linhas mapeadas e extrai o faturamento mensal e anual
 */
export function processarMapeamentoFaturamento(
  linhas: LinhaPlanilhaBruta[],
  mapeamento: MapeamentoColunasFaturamento,
): FaturamentoExtraido {
  const avisos: string[] = []
  const colFat = mapeamento.colunaFaturamento
  const colPer = mapeamento.colunaPeriodo
  const colComp = mapeamento.colunaCompras
  const colFolha = mapeamento.colunaFolha

  if (!colFat) {
    avisos.push('Nenhuma coluna de faturamento foi selecionada.')
    return {
      faturamentoMensal: 0,
      faturamentoAnual: 0,
      totalMesesIdentificados: 0,
      avisos,
    }
  }

  const valoresValidos: { periodo: string; valor: number; compras?: number; folha?: number }[] = []

  linhas.forEach((linha, idx) => {
    const rawVal = linha[colFat]
    const num = converterParaNumero(rawVal)
    const periodo = colPer ? linha[colPer] || `Linha ${idx + 1}` : `Linha ${idx + 1}`
    const compras = colComp ? converterParaNumero(linha[colComp]) : undefined
    const folha = colFolha ? converterParaNumero(linha[colFolha]) : undefined

    if (num > 0) {
      valoresValidos.push({ periodo, valor: num, compras, folha })
    }
  })

  if (valoresValidos.length === 0) {
    avisos.push(
      `A coluna "${colFat}" não continha valores numéricos positivos maiores que zero nas linhas da planilha.`,
    )
    return {
      faturamentoMensal: 0,
      faturamentoAnual: 0,
      totalMesesIdentificados: 0,
      avisos,
    }
  }

  let faturamentoMensal = 0
  let faturamentoAnual = 0
  let comprasMensal: number | undefined
  let folhaMensal: number | undefined

  // Se tiver apenas 1 linha de dados:
  if (valoresValidos.length === 1) {
    const unico = valoresValidos[0].valor
    if (mapeamento.tipoFaturamento === 'anual') {
      faturamentoAnual = unico
      faturamentoMensal = Math.round((unico / 12) * 100) / 100
      avisos.push('Valor único interpretado como faturamento anual: dividido em 12 meses na média.')
    } else {
      // Mensal ou auto
      faturamentoMensal = unico
      faturamentoAnual = Math.round(unico * 12 * 100) / 100
      avisos.push(
        'Valor único interpretado como faturamento mensal: multiplicado por 12 para o anual.',
      )
    }
    if (valoresValidos[0].compras) comprasMensal = valoresValidos[0].compras
    if (valoresValidos[0].folha) folhaMensal = valoresValidos[0].folha
  } else {
    // Múltiplas linhas (ex.: 12 meses de faturamento)
    const somaTotal = valoresValidos.reduce((acc, curr) => acc + curr.valor, 0)
    const mediaMensal = somaTotal / valoresValidos.length

    if (mapeamento.tipoFaturamento === 'anual') {
      // Forçado anual
      faturamentoAnual = Math.round(somaTotal * 100) / 100
      faturamentoMensal = Math.round((somaTotal / 12) * 100) / 100
      avisos.push(
        `Total de ${valoresValidos.length} registros somados como faturamento anual (R$ ${faturamentoAnual.toLocaleString('pt-BR')}). Média mensal calculada em 12 avos.`,
      )
    } else if (mapeamento.tipoFaturamento === 'mensal') {
      // Cada linha é um mês e o usuário quer média ou o mais recente?
      // O padrão seguro de importação é a média mensal dos períodos identificados
      faturamentoMensal = Math.round(mediaMensal * 100) / 100
      faturamentoAnual =
        Math.round((valoresValidos.length >= 12 ? somaTotal : mediaMensal * 12) * 100) / 100
      avisos.push(
        `Calculada a média mensal de ${valoresValidos.length} períodos: R$ ${faturamentoMensal.toLocaleString('pt-BR')}/mês.`,
      )
    } else {
      // Auto
      if (valoresValidos.length >= 10 && valoresValidos.length <= 14) {
        // Provavelmente os 12 meses do ano
        faturamentoAnual = Math.round(somaTotal * 100) / 100
        faturamentoMensal = Math.round(mediaMensal * 100) / 100
        avisos.push(
          `Identificados ${valoresValidos.length} períodos mensais. Total acumulado anual: R$ ${faturamentoAnual.toLocaleString('pt-BR')} (Média: R$ ${faturamentoMensal.toLocaleString('pt-BR')}/mês).`,
        )
      } else {
        // Quantidade genérica de linhas: calcula soma para anual se mais de 1 mês ou média mensal
        faturamentoMensal = Math.round(mediaMensal * 100) / 100
        faturamentoAnual = Math.round(mediaMensal * 12 * 100) / 100
        avisos.push(
          `Calculada a média ponderada de ${valoresValidos.length} linhas de faturamento: R$ ${faturamentoMensal.toLocaleString('pt-BR')}/mês.`,
        )
      }
    }

    if (colComp) {
      const somaComp = valoresValidos.reduce((acc, curr) => acc + (curr.compras || 0), 0)
      if (somaComp > 0) comprasMensal = Math.round((somaComp / valoresValidos.length) * 100) / 100
    }
    if (colFolha) {
      const somaFolha = valoresValidos.reduce((acc, curr) => acc + (curr.folha || 0), 0)
      if (somaFolha > 0) folhaMensal = Math.round((somaFolha / valoresValidos.length) * 100) / 100
    }
  }

  return {
    faturamentoMensal,
    faturamentoAnual,
    comprasMensal,
    folhaMensal,
    detalhamentoMeses: valoresValidos.map((v) => ({ periodo: v.periodo, valor: v.valor })),
    totalMesesIdentificados: valoresValidos.length,
    avisos,
  }
}
