/**
 * Parser de Documentos Fiscais SPED (EFD Contribuições e EFD ICMS/IPI)
 *
 * Processamento client-side (no navegador), tolerante a arquivos grandes (linhas delimitadas por pipe |).
 *
 * EFD Contribuições:
 *  - Bloco 0: 0000 (dados do contribuinte, CNPJ, nome, período DT_INI/DT_FIN, UF)
 *  - Bloco 0140: Cadastro de estabelecimentos (para detectar filiais e UFs de operação)
 *  - Blocos A / C / D / F:
 *     - C100 / C170 / C180 / C190: Documentos de mercadorias
 *     - C170: CST_PIS (campo 25), CST_COFINS (campo 31), CFOP (campo 11), VL_ITEM (campo 7)
 *     - C181 / C185 / C191 / C195: totalizadores consolidados por CST
 *     - A100 / A170: Serviços (CSTs e valores)
 *     - D100 / D101 / D105: Transportes
 *     - F100: Demais documentos e operações
 *  - Bloco M:
 *     - M100 / M500: Créditos de PIS e COFINS apurados no período
 *     - M200 / M600: Contribuição a recolher consolidada
 *     - M105 / M505: Detalhamento da base de cálculo de créditos por CST/natureza
 *
 * EFD ICMS/IPI:
 *  - Bloco 0: 0000 (CNPJ, Nome, UF, Período), 0005 (Fantasia, Endereço, Fone, Email)
 *  - Bloco C / D: Compras/Vendas, CFOPs interestaduais (CFOP iniciando com '2' compras ou '6'/'7' vendas)
 *  - Bloco E: E110 (saldo credor acumulado de ICMS - campo 14 VL_SLD_CREDOR_TRANSPORTAR)
 *  - Bloco G: Controle de Crédito de ICMS do Ativo Permanente (CIAP - G110/G125)
 */

import { DadosEmpresaPerfil, RegimeEspecialAtual } from '@/types/dadosEmpresa'

export type TipoDocumentoFiscalSped = 'efd_contribuicoes' | 'efd_icms_ipi' | 'desconhecido'

export interface MetadadosSped {
  tipo: TipoDocumentoFiscalSped
  nomeTipo: string
  cnpj: string
  nomeEmpresa: string
  nomeFantasia?: string
  uf: string
  periodoInicio: string // YYYY-MM-DD ou DDMMAAAA
  periodoFim: string
  versaoLeiaute?: string
  linhasLidas: number
  tamanhoBytes: number
  nomeArquivo: string
  dataProcessamento: string
}

export interface DetalhesExtracaoSped {
  // Faturamento e Receitas
  faturamentoPeriodo: number
  faturamentoMensalEstimado: number
  mesesNoArquivo: number

  // CFOPs e Interestadual
  receitaInterestadual: number
  receitaEstadual: number
  receitaExportacao: number
  percentualVendasInterestaduais: number
  percentualExportacao: number

  // Compras e Créditos
  comprasTotais: number
  comprasComCredito: number
  comprasSemCredito: number
  percentualComprasSemCredito: number
  percentualComprasVendasEstimado: number

  // Perfil de Insumos (Cheia, Monofásicos, Reduzida/Zero/Isentos)
  insumosAliquotaCheia: number
  insumosMonofasicos: number
  insumosAliquotaReduzida: number
  perfilInsumosAliquotaCheia: number // %
  perfilInsumosMonofasicos: number // %
  perfilInsumosAliquotaReduzida: number // %

  // Monofásicos detectados
  presencaMonofasicos: boolean
  categoriasMonofasicosDetectadas: string[]

  // Insumos energéticos e intangíveis detectados
  insumosEnergeticosDetectados: boolean
  intangiveisDetectados: boolean

  // Ativo imobilizado / CIAP
  imobilizadoIdentificado: number

  // Saldo credor acumulado apurado
  saldoCredorAcumulado: number

  // Estabelecimentos e UFs
  filiaisDetectadas: number
  ufsOperacaoDetectadas: string[]

  // Regime especial sugerido
  regimeEspecialSugerido: RegimeEspecialAtual

  // Alertas / avisos de inconsistência durante o parsing
  avisos: string[]
}

export interface CampoExtracaoComparativo {
  chave: keyof DadosEmpresaPerfil
  rotulo: string
  grupo: 'identificacao' | 'operacional' | 'fase1' | 'fase2' | 'fase3'
  valorAtual: unknown
  valorExtraido: unknown
  valorFormatadoAtual: string
  valorFormatadoExtraido: string
  relevante: boolean
  motivoExtracao: string
}

export interface ResultadoParsingSped {
  valido: boolean
  erro?: string
  metadados: MetadadosSped
  detalhes: DetalhesExtracaoSped
  camposSugeridos: Partial<DadosEmpresaPerfil>
  camposComparativo: CampoExtracaoComparativo[]
  agregadosContabeis?: {
    ativoTotal?: number
    passivoTotal?: number
    patrimonioLiquido?: number
    cmvCsp?: number
    lucroLiquido?: number
    receitaBruta?: number
    despesasOperacionais?: number
  }
}

// Helpers numéricos de SPED: "1234,56" -> 1234.56
export function parseNumeroSped(val: string | undefined): number {
  if (!val) return 0
  const limpo = val.trim().replace(/\./g, '').replace(',', '.')
  const num = parseFloat(limpo)
  return isNaN(num) ? 0 : Math.max(0, num)
}

// Helpers de formatação CNPJ: "00000000000000" -> "00.000.000/0000-00"
export function formatarCnpjRaw(val: string): string {
  const d = val.replace(/\D/g, '').slice(0, 14)
  if (d.length !== 14) return val
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`
}

// Data DDMMAAAA -> YYYY-MM-DD
export function formatarDataSped(d: string): string {
  if (!d || d.length !== 8) return d || ''
  const dia = d.slice(0, 2)
  const mes = d.slice(2, 4)
  const ano = d.slice(4, 8)
  return `${ano}-${mes}-${dia}`
}

/**
 * Detecta o tipo de SPED pelo cabeçalho (registro |0000|)
 */
export function identificarTipoSped(linhasIniciais: string[]): TipoDocumentoFiscalSped {
  for (const raw of linhasIniciais) {
    const l = raw.trim()
    if (!l.startsWith('|')) continue
    const parts = l.split('|').slice(1, -1)
    if (parts[0] === '0000') {
      // EFD Contribuições: campo 2 normalmente é COD_VER ou TIPO_ESCRIT, campo 3 é IND_SIT_ESP ou COD_VER
      // Um indicativo clássico é se possui registros como M100/M200, 0110, A001 etc.
      // Ou pelo campo 2 da EFD ICMS/IPI que é COD_VER e campo 3 COD_FIN (0 ou 1)
      return 'efd_contribuicoes'
    }
  }
  return 'desconhecido'
}

/**
 * Mapeamento de CST PIS/COFINS para classificação
 * CSTs de Saída / Faturamento:
 *  - 01, 02, 03: Tributável cheia/básica
 *  - 04: Tributação monofásica (revenda alíquota zero)
 *  - 05: Substituição tributária
 *  - 06: Alíquota zero
 *  - 07: Operação isenta
 *  - 08: Sem incidência
 *  - 09: Outras operações de saída
 *
 * CSTs de Entrada / Créditos:
 *  - 50, 51, 52: Vinculados à receita tributada no mercado interno (alíquota básica)
 *  - 53, 54, 55, 56: Vinculados a outras receitas / exportação
 *  - 60, 61, 62: Crédito presumido
 *  - 70, 71, 72, 73, 74, 75: Compras sem direito a crédito (não geram crédito)
 *  - 98, 99: Outras operações de entrada
 */

/**
 * Parser principal de EFD Contribuições / EFD ICMS
 */
export function parseSpedConteudo(
  conteudo: string,
  nomeArquivo: string,
  perfilAtual: DadosEmpresaPerfil,
): ResultadoParsingSped {
  const avisos: string[] = []

  if (!conteudo || conteudo.trim().length === 0) {
    return criarResultadoInvalido(nomeArquivo, 'O arquivo está vazio.')
  }

  // Divide em linhas (suporta \r\n e \n)
  const linhas = conteudo.split(/\r?\n/)
  if (linhas.length < 5) {
    return criarResultadoInvalido(
      nomeArquivo,
      'O arquivo não possui linhas suficientes para ser uma EFD válida.',
    )
  }

  let encontrou0000 = false
  let tipoDetectado: TipoDocumentoFiscalSped = 'desconhecido'

  // Metadados do Registro 0000
  let cnpj = ''
  let nomeEmpresa = ''
  let nomeFantasia = ''
  let uf = ''
  let dtIni = ''
  let dtFin = ''
  let codVer = ''

  // Detecção de blocos e indicadores específicos
  let temBlocoM = false
  let temBlocoC = false
  let temBlocoE = false

  // Faturamento e Receitas
  let faturamentoTotal = 0
  let receitaEstadual = 0
  let receitaInterestadual = 0
  let receitaExportacao = 0

  // Compras e Créditos
  let comprasTotais = 0
  let comprasComCredito = 0
  let comprasSemCredito = 0

  // Insumos por alíquota (Base de PIS/COFINS das saídas e entradas)
  let insumosCheia = 0
  let insumosMonofasicos = 0
  let insumosReduzidaIsenta = 0

  // Categorias de monofásicos identificadas via texto de itens (0200) ou NCM
  const categoriasMonofasicosSet = new Set<string>()
  const itensMonofasicosDescricao: Record<string, string> = {}

  // Energia e Intangíveis
  let temEnergia = false
  let temIntangiveis = false

  // Imobilizado
  let imobilizadoSoma = 0

  // Saldo credor
  let saldoCredorApurado = 0

  // Filiais e UFs de operação
  const ufsSet = new Set<string>()
  let estabelecimentosCount = 0

  // Iteração rápida linha a linha
  for (let idx = 0; idx < linhas.length; idx++) {
    const rawLinha = linhas[idx].trim()
    if (!rawLinha.startsWith('|')) continue

    const parts = rawLinha.split('|').slice(1, -1)
    if (parts.length === 0) continue

    const reg = parts[0]?.toUpperCase()

    // -------------------------------------------------------------------------
    // REGISTRO 0000: Abertura e Identificação
    // -------------------------------------------------------------------------
    if (reg === '0000') {
      encontrou0000 = true

      // EFD Contribuições:
      // |0000|COD_VER|TIPO_ESCRIT|IND_SIT_ESP|NUM_REC_ANTERIOR|DT_INI|DT_FIN|NOME|CNPJ|UF|COD_MUN|SUFRAMA|IND_NAT_PJ|IND_ATIV|
      // ou EFD ICMS/IPI:
      // |0000|COD_VER|COD_FIN|DT_INI|DT_FIN|NOME|CNPJ|CPF|UF|COD_MUN|IM|IE|...
      // Vamos tentar detectar pela posição do CNPJ e datas:
      codVer = parts[1] || ''

      // Tenta achar campo com formato de CNPJ (14 dígitos)
      for (let pIdx = 1; pIdx < parts.length; pIdx++) {
        const val = parts[pIdx].trim().replace(/\D/g, '')
        if (val.length === 14 && !cnpj) {
          cnpj = formatarCnpjRaw(val)
        }
      }

      // Tenta achar UF (2 letras maiúsculas conhecidas)
      const ufsValidas = [
        'AC',
        'AL',
        'AP',
        'AM',
        'BA',
        'CE',
        'DF',
        'ES',
        'GO',
        'MA',
        'MT',
        'MS',
        'MG',
        'PA',
        'PB',
        'PR',
        'PE',
        'PI',
        'RJ',
        'RN',
        'RS',
        'RO',
        'RR',
        'SC',
        'SP',
        'SE',
        'TO',
      ]
      for (let pIdx = 1; pIdx < parts.length; pIdx++) {
        const val = parts[pIdx].trim().toUpperCase()
        if (ufsValidas.includes(val) && !uf) {
          uf = val
          ufsSet.add(val)
        }
      }

      // Tenta achar datas DDMMAAAA
      for (let pIdx = 1; pIdx < parts.length; pIdx++) {
        const val = parts[pIdx].trim()
        if (/^\d{8}$/.test(val)) {
          if (!dtIni) {
            dtIni = formatarDataSped(val)
          } else if (!dtFin) {
            dtFin = formatarDataSped(val)
          }
        }
      }

      // Tenta achar Nome da Empresa (campo de texto com mais de 3 chars que não seja número ou código)
      for (let pIdx = 1; pIdx < parts.length; pIdx++) {
        const val = parts[pIdx].trim()
        if (
          val.length > 3 &&
          !/^\d+$/.test(val) &&
          val !== uf &&
          !val.includes('@') &&
          !nomeEmpresa
        ) {
          nomeEmpresa = val
        }
      }
    }

    // -------------------------------------------------------------------------
    // REGISTRO 0005: Dados complementares (EFD ICMS)
    // -------------------------------------------------------------------------
    if (reg === '0005') {
      if (parts[1] && !nomeFantasia) nomeFantasia = parts[1].trim()
    }

    // -------------------------------------------------------------------------
    // REGISTRO 0140: Cadastro de Estabelecimento (EFD Contribuições)
    // -------------------------------------------------------------------------
    if (reg === '0140') {
      estabelecimentosCount++
      // |0140|COD_EST|NOME|CNPJ|UF|IE|COD_MUN|IM|SUFRAMA|
      const ufEst = parts[4]?.trim().toUpperCase()
      if (ufEst && ufEst.length === 2) {
        ufsSet.add(ufEst)
      }
    }

    // -------------------------------------------------------------------------
    // REGISTRO 0200: Identificação de Itens (Produtos/Serviços)
    // Permite categorizar monofásicos pela descrição ou NCM
    // |0200|COD_ITEM|DESCR_ITEM|COD_BARRA|COD_ANT_ITEM|UNID_INV|TIPO_ITEM|COD_NCM|...
    // -------------------------------------------------------------------------
    if (reg === '0200') {
      const codItem = parts[1]?.trim()
      const descr = parts[2]?.trim().toLowerCase() || ''
      const ncm = parts[7]?.trim().replace(/\D/g, '') || ''

      if (codItem) {
        // Classifica se é potencial monofásico
        const cat = classificarMonofasicoPorTextoOuNcm(descr, ncm)
        if (cat) {
          categoriasMonofasicosSet.add(cat)
          itensMonofasicosDescricao[codItem] = cat
        }
        if (descr.includes('energia eletrica') || descr.includes('eletricidade')) {
          temEnergia = true
        }
        if (descr.includes('software') || descr.includes('licenca') || descr.includes('royalt')) {
          temIntangiveis = true
        }
      }
    }

    // -------------------------------------------------------------------------
    // BLOCO C / D / A / F: DOCUMENTOS E OPERAÇÕES FISCAIS
    // -------------------------------------------------------------------------

    // C100 / C190 / C170: Notas Fiscais
    if (reg === 'C100' || reg === 'D100' || reg === 'A100') {
      temBlocoC = true
      const indOper = parts[1]?.trim() // 0 = Entrada/Aquisição, 1 = Saída/Prestação
      const vlDoc = parseNumeroSped(parts[11] || parts[12])

      if (indOper === '1') {
        faturamentoTotal += vlDoc
      } else if (indOper === '0') {
        comprasTotais += vlDoc
      }
    }

    // C170: Itens da Nota Fiscal (Entradas e Saídas)
    // |C170|NUM_ITEM|COD_ITEM|DESCR_COMPL|QTD|UNID|VL_ITEM|VL_DESC|IND_MOV|CST_ICMS|CFOP|COD_NAT|...|CST_PIS|VL_BC_PIS|ALIQ_PIS|...|CST_COFINS|VL_BC_COFINS|ALIQ_COFINS|...
    if (reg === 'C170') {
      const codItem = parts[2]?.trim()
      const vlItem = parseNumeroSped(parts[6]) // VL_ITEM
      const cfop = parts[10]?.trim() || ''

      // Na EFD Contribuições: CST PIS é campo 24 ou 25; na prática, busca índice dos campos CST
      const cstPis = extrairCstDeLinhaC170(parts, 24, 25)

      // Análise do CFOP
      if (cfop.startsWith('5')) {
        // Venda interna estadual
        receitaEstadual += vlItem
      } else if (cfop.startsWith('6')) {
        // Venda interestadual
        receitaInterestadual += vlItem
      } else if (cfop.startsWith('7')) {
        // Exportação
        receitaExportacao += vlItem
      } else if (cfop.startsWith('1')) {
        // Compra interna
      } else if (cfop.startsWith('2')) {
        // Compra interestadual
      }

      // Análise do CST PIS (ou COFINS)
      if (cstPis) {
        if (['01', '02', '03', '50', '51', '52'].includes(cstPis)) {
          insumosCheia += vlItem
          comprasComCredito += vlItem
        } else if (['04', '05'].includes(cstPis)) {
          insumosMonofasicos += vlItem
          if (codItem && itensMonofasicosDescricao[codItem]) {
            categoriasMonofasicosSet.add(itensMonofasicosDescricao[codItem])
          }
        } else if (['06', '07', '08', '09', '70', '71', '72', '73', '74', '75'].includes(cstPis)) {
          insumosReduzidaIsenta += vlItem
          comprasSemCredito += vlItem
        }
      }
    }

    // C181 / C185 / C191 / C195 (Resumo da EFD Contribuições por CST)
    // C181: Detalhamento da Operação por CST PIS (CFOP, CST_PIS, VL_ITEM, VL_DESC, VL_BC_PIS, ALIQ_PIS, VL_PIS)
    if (reg === 'C181' || reg === 'C191' || reg === 'C185' || reg === 'C195') {
      const cst = parts[1]?.trim() || parts[2]?.trim() || ''
      const cfop = parts[2]?.trim() || parts[3]?.trim() || ''
      const vlItem = parseNumeroSped(parts[3] || parts[4])

      if (cfop.startsWith('6')) {
        receitaInterestadual += vlItem
      } else if (cfop.startsWith('7')) {
        receitaExportacao += vlItem
      } else if (cfop.startsWith('5')) {
        receitaEstadual += vlItem
      }

      if (['01', '02', '03'].includes(cst)) {
        insumosCheia += vlItem
      } else if (['04', '05'].includes(cst)) {
        insumosMonofasicos += vlItem
      } else if (['06', '07', '08', '09'].includes(cst)) {
        insumosReduzidaIsenta += vlItem
      }
    }

    // F100: Demais Documentos e Operações (Aluguéis, Energia, Serviços)
    if (reg === 'F100') {
      const indOper = parts[1]?.trim() // 0 = Aquisição/despesa, 1 = Receita
      const vlOper = parseNumeroSped(parts[5])
      const cstPis = parts[6]?.trim()

      if (indOper === '0') {
        if (['50', '51', '52', '60'].includes(cstPis)) {
          comprasComCredito += vlOper
        } else {
          comprasSemCredito += vlOper
        }
      }
    }

    // F120: Bens Incorporados ao Ativo Imobilizado
    if (reg === 'F120' || reg === 'F130') {
      const vlOper = parseNumeroSped(parts[5] || parts[6])
      if (vlOper > 0) {
        imobilizadoSoma += vlOper
      }
    }

    // CIAP na EFD ICMS/IPI: Bloco G (G110/G125)
    if (reg === 'G125') {
      const vlBem = parseNumeroSped(parts[4] || parts[5])
      if (vlBem > 0) {
        imobilizadoSoma += vlBem
      }
    }

    // -------------------------------------------------------------------------
    // BLOCO M: APURAÇÃO DA CONTRIBUIÇÃO E CRÉDITOS (EFD Contribuições)
    // M100 / M500: Créditos de PIS / COFINS apurados
    // M200 / M600: Contribuição apurada a recolher
    // -------------------------------------------------------------------------
    if (reg === 'M100' || reg === 'M500') {
      temBlocoM = true
      const vlCredApur = parseNumeroSped(parts[8] || parts[7])
      if (vlCredApur > 0) {
        saldoCredorApurado += vlCredApur
      }
    }

    if (reg === 'M105' || reg === 'M505') {
      temBlocoM = true
      // Detalhamento de créditos por base de cálculo
      const vlBcCred = parseNumeroSped(parts[4] || parts[5])
      if (vlBcCred > 0) {
        comprasComCredito += vlBcCred
      }
    }

    // M200 / M600: Consolidação de Contribuições
    if (reg === 'M200' || reg === 'M600') {
      temBlocoM = true
      // VL_TOT_REC (total receitas apuradas) se disponível
      const vlTotRec = parseNumeroSped(parts[1] || parts[2])
      if (vlTotRec > 0 && faturamentoTotal === 0) {
        faturamentoTotal = vlTotRec
      }
    }

    // -------------------------------------------------------------------------
    // BLOCO E: APURAÇÃO DO ICMS (EFD ICMS/IPI)
    // E110: Apuração do ICMS - Operações Próprias
    // Campo 14: VL_SLD_CREDOR_TRANSPORTAR (Saldo credor a transportar para o período seguinte)
    // -------------------------------------------------------------------------
    if (reg === 'E110') {
      temBlocoE = true
      const sldCredor = parseNumeroSped(parts[13] || parts[14])
      if (sldCredor > 0) {
        saldoCredorApurado = Math.max(saldoCredorApurado, sldCredor)
      }
    }
  }

  // Validação mínima de existência do cabeçalho
  if (!encontrou0000) {
    return criarResultadoInvalido(
      nomeArquivo,
      'Não foi encontrado o registro inicial de abertura (|0000|). O arquivo não parece ser um arquivo SPED válido.',
    )
  }

  // Determinação do tipo
  if (temBlocoM) {
    tipoDetectado = 'efd_contribuicoes'
  } else if (temBlocoE) {
    tipoDetectado = 'efd_icms_ipi'
  } else {
    tipoDetectado = 'efd_contribuicoes' // padrão assumido quando cabeçalho e estrutura pipe são válidos
  }

  // Estimativa de meses no período
  const mesesNoArquivo = calcularMesesEntreDatas(dtIni, dtFin)
  const faturamentoMensalEstimado =
    faturamentoTotal > 0
      ? Math.round(faturamentoTotal / Math.max(1, mesesNoArquivo))
      : perfilAtual.faturamentoMensal

  // Cálculo de percentual de vendas interestaduais e exportação
  const totalReceitasClassificadas = receitaEstadual + receitaInterestadual + receitaExportacao
  let percentualVendasInterestaduais = perfilAtual.percentualVendasInterestaduais
  let percentualExportacao = perfilAtual.percentualExportacao

  if (totalReceitasClassificadas > 0) {
    percentualVendasInterestaduais = Math.min(
      100,
      Math.max(0, Math.round((receitaInterestadual / totalReceitasClassificadas) * 100)),
    )
    percentualExportacao = Math.min(
      100,
      Math.max(0, Math.round((receitaExportacao / totalReceitasClassificadas) * 100)),
    )
  }

  // Cálculo de % compras sem crédito
  let percentualComprasSemCredito = perfilAtual.percentualComprasSemCredito
  const totalComprasApuradas = comprasComCredito + comprasSemCredito
  if (totalComprasApuradas > 0) {
    percentualComprasSemCredito = Math.min(
      100,
      Math.max(0, Math.round((comprasSemCredito / totalComprasApuradas) * 100)),
    )
  }

  // Estimativa da proporção Compras/Vendas
  let percentualComprasVendasEstimado = perfilAtual.percentualComprasVendas
  if (faturamentoTotal > 0 && comprasTotais > 0) {
    percentualComprasVendasEstimado = Math.min(
      100,
      Math.max(10, Math.round((comprasTotais / faturamentoTotal) * 100)),
    )
  }

  // Cálculo do perfil de insumos (Cheia / Monofásicos / Reduzida)
  const totalInsumosClassificados = insumosCheia + insumosMonofasicos + insumosReduzidaIsenta
  let perfilInsumosCheia = perfilAtual.perfilInsumosAliquotaCheia
  let perfilInsumosMono = perfilAtual.perfilInsumosMonofasicos
  let perfilInsumosReduz = perfilAtual.perfilInsumosAliquotaReduzida

  if (totalInsumosClassificados > 0) {
    perfilInsumosCheia = Math.round((insumosCheia / totalInsumosClassificados) * 100)
    perfilInsumosMono = Math.round((insumosMonofasicos / totalInsumosClassificados) * 100)
    perfilInsumosReduz = Math.max(0, 100 - perfilInsumosCheia - perfilInsumosMono)
  }

  // Detecção de presença de monofásicos e regime especial sugerido
  const presencaMonofasicos =
    insumosMonofasicos > 0 ||
    categoriasMonofasicosSet.size > 0 ||
    perfilInsumosMono > 0 ||
    perfilAtual.presencaMonofasicos

  let regimeEspecialSugerido: RegimeEspecialAtual = perfilAtual.regimeEspecialAtual
  if (presencaMonofasicos && regimeEspecialSugerido === 'nenhum') {
    regimeEspecialSugerido = 'monofasico'
  }

  // Quantidade de filiais detectadas
  const filiaisDetectadas = Math.max(
    1,
    estabelecimentosCount > 0 ? estabelecimentosCount : perfilAtual.numeroFiliais || 1,
  )

  // UFs de operação detectadas (adicionais à UF de origem)
  const ufPrincipal = uf || perfilAtual.ufOrigem || 'SP'
  const ufsAdicionais = Array.from(ufsSet).filter((u) => u !== ufPrincipal)

  const categoriasMonofasicosArray = Array.from(categoriasMonofasicosSet)

  // Metadados montados
  const metadados: MetadadosSped = {
    tipo: tipoDetectado,
    nomeTipo:
      tipoDetectado === 'efd_contribuicoes'
        ? 'EFD Contribuições (SPED PIS/Cofins)'
        : tipoDetectado === 'efd_icms_ipi'
          ? 'EFD ICMS/IPI (SPED Fiscal)'
          : 'Documento Fiscal SPED',
    cnpj: cnpj || perfilAtual.cnpj,
    nomeEmpresa: nomeEmpresa || perfilAtual.nomeEmpresa,
    nomeFantasia: nomeFantasia || undefined,
    uf: ufPrincipal,
    periodoInicio: dtIni,
    periodoFim: dtFin,
    versaoLeiaute: codVer,
    linhasLidas: linhas.length,
    tamanhoBytes: conteudo.length,
    nomeArquivo,
    dataProcessamento: new Date().toISOString(),
  }

  const detalhes: DetalhesExtracaoSped = {
    faturamentoPeriodo: faturamentoTotal,
    faturamentoMensalEstimado,
    mesesNoArquivo,
    receitaInterestadual,
    receitaEstadual,
    receitaExportacao,
    percentualVendasInterestaduais,
    percentualExportacao,
    comprasTotais,
    comprasComCredito,
    comprasSemCredito,
    percentualComprasSemCredito,
    percentualComprasVendasEstimado,
    insumosAliquotaCheia: insumosCheia,
    insumosMonofasicos,
    insumosAliquotaReduzida: insumosReduzidaIsenta,
    perfilInsumosAliquotaCheia: perfilInsumosCheia,
    perfilInsumosMonofasicos: perfilInsumosMono,
    perfilInsumosAliquotaReduzida: perfilInsumosReduz,
    presencaMonofasicos,
    categoriasMonofasicosDetectadas: categoriasMonofasicosArray,
    insumosEnergeticosDetectados: temEnergia || perfilAtual.insumosEnergeticos,
    intangiveisDetectados: temIntangiveis || perfilAtual.intangiveisRoyalties,
    imobilizadoIdentificado:
      imobilizadoSoma > 0 ? imobilizadoSoma : perfilAtual.imobilizadoUltimos5Anos,
    saldoCredorAcumulado:
      saldoCredorApurado > 0 ? saldoCredorApurado : perfilAtual.saldoCredorAcumulado,
    filiaisDetectadas,
    ufsOperacaoDetectadas: ufsAdicionais.length > 0 ? ufsAdicionais : perfilAtual.ufsOperacao || [],
    regimeEspecialSugerido,
    avisos,
  }

  // Prepara campos sugeridos para preenchimento na fonte mestra
  const camposSugeridos: Partial<DadosEmpresaPerfil> = {}

  if (cnpj && cnpj !== perfilAtual.cnpj) camposSugeridos.cnpj = cnpj
  if (nomeEmpresa && nomeEmpresa !== perfilAtual.nomeEmpresa)
    camposSugeridos.nomeEmpresa = nomeEmpresa
  if (ufPrincipal && ufPrincipal !== perfilAtual.ufOrigem) camposSugeridos.ufOrigem = ufPrincipal

  if (faturamentoMensalEstimado > 0 && faturamentoTotal > 0) {
    camposSugeridos.faturamentoMensal = faturamentoMensalEstimado
  }

  if (totalReceitasClassificadas > 0) {
    camposSugeridos.percentualVendasInterestaduais = percentualVendasInterestaduais
    camposSugeridos.percentualExportacao = percentualExportacao
  }

  if (totalComprasApuradas > 0) {
    camposSugeridos.percentualComprasSemCredito = percentualComprasSemCredito
  }

  if (faturamentoTotal > 0 && comprasTotais > 0) {
    camposSugeridos.percentualComprasVendas = percentualComprasVendasEstimado
  }

  if (totalInsumosClassificados > 0) {
    camposSugeridos.perfilInsumosAliquotaCheia = perfilInsumosCheia
    camposSugeridos.perfilInsumosMonofasicos = perfilInsumosMono
    camposSugeridos.perfilInsumosAliquotaReduzida = perfilInsumosReduz
  }

  if (presencaMonofasicos) {
    camposSugeridos.presencaMonofasicos = true
    if (categoriasMonofasicosArray.length > 0) {
      camposSugeridos.categoriasMonofasicos = Array.from(
        new Set([...(perfilAtual.categoriasMonofasicos || []), ...categoriasMonofasicosArray]),
      )
    }
  }

  if (temEnergia) camposSugeridos.insumosEnergeticos = true
  if (temIntangiveis) camposSugeridos.intangiveisRoyalties = true
  if (imobilizadoSoma > 0) camposSugeridos.imobilizadoUltimos5Anos = imobilizadoSoma
  if (saldoCredorApurado > 0) camposSugeridos.saldoCredorAcumulado = saldoCredorApurado

  if (filiaisDetectadas > 1) camposSugeridos.numeroFiliais = filiaisDetectadas
  if (ufsAdicionais.length > 0) {
    camposSugeridos.ufsOperacao = Array.from(
      new Set([...(perfilAtual.ufsOperacao || []), ...ufsAdicionais]),
    )
  }

  if (regimeEspecialSugerido !== perfilAtual.regimeEspecialAtual) {
    camposSugeridos.regimeEspecialAtual = regimeEspecialSugerido
  }

  // Gera o resumo comparativo campo a campo
  const camposComparativo = gerarCamposComparativo(perfilAtual, camposSugeridos, detalhes)

  return {
    valido: true,
    metadados,
    detalhes,
    camposSugeridos,
    camposComparativo,
  }
}

/**
 * Auxiliar para erro de validação
 */
function criarResultadoInvalido(nomeArquivo: string, erro: string): ResultadoParsingSped {
  return {
    valido: false,
    erro,
    metadados: {
      tipo: 'desconhecido',
      nomeTipo: 'Arquivo Inválido',
      cnpj: '',
      nomeEmpresa: '',
      uf: 'SP',
      periodoInicio: '',
      periodoFim: '',
      linhasLidas: 0,
      tamanhoBytes: 0,
      nomeArquivo,
      dataProcessamento: new Date().toISOString(),
    },
    detalhes: {
      faturamentoPeriodo: 0,
      faturamentoMensalEstimado: 0,
      mesesNoArquivo: 1,
      receitaInterestadual: 0,
      receitaEstadual: 0,
      receitaExportacao: 0,
      percentualVendasInterestaduais: 0,
      percentualExportacao: 0,
      comprasTotais: 0,
      comprasComCredito: 0,
      comprasSemCredito: 0,
      percentualComprasSemCredito: 0,
      percentualComprasVendasEstimado: 0,
      insumosAliquotaCheia: 0,
      insumosMonofasicos: 0,
      insumosAliquotaReduzida: 0,
      perfilInsumosAliquotaCheia: 100,
      perfilInsumosMonofasicos: 0,
      perfilInsumosAliquotaReduzida: 0,
      presencaMonofasicos: false,
      categoriasMonofasicosDetectadas: [],
      insumosEnergeticosDetectados: false,
      intangiveisDetectados: false,
      imobilizadoIdentificado: 0,
      saldoCredorAcumulado: 0,
      filiaisDetectadas: 1,
      ufsOperacaoDetectadas: [],
      regimeEspecialSugerido: 'nenhum',
      avisos: [erro],
    },
    camposSugeridos: {},
    camposComparativo: [],
  }
}

/**
 * Classificação semântica simples de itens monofásicos por descrição ou NCM
 */
function classificarMonofasicoPorTextoOuNcm(descr: string, ncm: string): string | null {
  // Combustíveis: NCM capítulo 27 (2710...)
  if (
    ncm.startsWith('2710') ||
    ncm.startsWith('2711') ||
    descr.includes('gasolina') ||
    descr.includes('diesel') ||
    descr.includes('etanol') ||
    descr.includes('combustivel') ||
    descr.includes('oleo lubrificante')
  ) {
    return 'combustiveis'
  }

  // Bebidas: NCM capítulo 22 (cervejas 2203, refrigerantes 2202, águas 2201)
  if (
    ncm.startsWith('2201') ||
    ncm.startsWith('2202') ||
    ncm.startsWith('2203') ||
    descr.includes('cerveja') ||
    descr.includes('refrigerante') ||
    descr.includes('agua mineral') ||
    descr.includes('energetico')
  ) {
    return 'bebidas'
  }

  // Medicamentos e fármacos: NCM capítulo 30
  if (
    ncm.startsWith('3003') ||
    ncm.startsWith('3004') ||
    descr.includes('medicamento') ||
    descr.includes('remedio') ||
    descr.includes('farmaceutico') ||
    descr.includes('vacina') ||
    descr.includes('comprimido')
  ) {
    return 'medicamentos'
  }

  // Pneus: NCM 4011
  if (ncm.startsWith('4011') || descr.includes('pneu') || descr.includes('camara de ar')) {
    return 'pneus'
  }

  // Veículos e autopeças: NCM capítulos 87 e peças 84
  if (
    ncm.startsWith('8702') ||
    ncm.startsWith('8703') ||
    ncm.startsWith('8704') ||
    ncm.startsWith('8708') ||
    descr.includes('veiculo') ||
    descr.includes('autopeca') ||
    descr.includes('motocicleta') ||
    descr.includes('trator')
  ) {
    return 'veiculos'
  }

  // Agroquímicos: NCM 3808
  if (
    ncm.startsWith('3808') ||
    descr.includes('defensivo') ||
    descr.includes('agrotoxico') ||
    descr.includes('fertilizante') ||
    descr.includes('herbicida') ||
    descr.includes('fungicida')
  ) {
    return 'agroquimicos'
  }

  return null
}

/**
 * Extrai CST PIS de uma linha C170 testando posições padrão
 */
function extrairCstDeLinhaC170(parts: string[], ...indices: number[]): string | null {
  for (const idx of indices) {
    const val = parts[idx]?.trim()
    if (val && /^\d{2}$/.test(val)) {
      return val
    }
  }
  // Varredura de fallback para campos com exatamente 2 dígitos no intervalo 20 a 32
  for (let i = 20; i < Math.min(parts.length, 33); i++) {
    const val = parts[i]?.trim()
    if (val && /^\d{2}$/.test(val)) {
      return val
    }
  }
  return null
}

/**
 * Calcula quantidade estimada de meses entre DT_INI e DT_FIN
 */
function calcularMesesEntreDatas(dtIni: string, dtFin: string): number {
  if (!dtIni || !dtFin) return 1
  try {
    const ini = new Date(dtIni)
    const fin = new Date(dtFin)
    const diffTime = Math.abs(fin.getTime() - ini.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays <= 35) return 1
    return Math.max(1, Math.round(diffDays / 30))
  } catch {
    return 1
  }
}

/**
 * Gera lista comparativa campo a campo para o resumo antes da confirmação
 */
function gerarCamposComparativo(
  atual: DadosEmpresaPerfil,
  extraido: Partial<DadosEmpresaPerfil>,
  detalhes: DetalhesExtracaoSped,
): CampoExtracaoComparativo[] {
  const lista: CampoExtracaoComparativo[] = []

  const formatarMoeda = (val: number) =>
    Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // 1. CNPJ
  if (extraido.cnpj && extraido.cnpj !== atual.cnpj) {
    lista.push({
      chave: 'cnpj',
      rotulo: 'CNPJ da Empresa',
      grupo: 'identificacao',
      valorAtual: atual.cnpj,
      valorExtraido: extraido.cnpj,
      valorFormatadoAtual: atual.cnpj || 'Não preenchido',
      valorFormatadoExtraido: extraido.cnpj,
      relevante: true,
      motivoExtracao: 'Identificado no registro |0000| da EFD.',
    })
  }

  // 2. Razão Social
  if (extraido.nomeEmpresa && extraido.nomeEmpresa !== atual.nomeEmpresa) {
    lista.push({
      chave: 'nomeEmpresa',
      rotulo: 'Nome da Empresa (Razão Social)',
      grupo: 'identificacao',
      valorAtual: atual.nomeEmpresa,
      valorExtraido: extraido.nomeEmpresa,
      valorFormatadoAtual: atual.nomeEmpresa || 'Não preenchido',
      valorFormatadoExtraido: extraido.nomeEmpresa,
      relevante: true,
      motivoExtracao: 'Razão social oficial declarada no cabeçalho SPED.',
    })
  }

  // 3. UF de Origem
  if (extraido.ufOrigem && extraido.ufOrigem !== atual.ufOrigem) {
    lista.push({
      chave: 'ufOrigem',
      rotulo: 'UF de Origem (Sede)',
      grupo: 'identificacao',
      valorAtual: atual.ufOrigem,
      valorExtraido: extraido.ufOrigem,
      valorFormatadoAtual: atual.ufOrigem || 'Não preenchido',
      valorFormatadoExtraido: extraido.ufOrigem,
      relevante: true,
      motivoExtracao: 'Estado da sede declarado no registro |0000|.',
    })
  }

  // 4. Faturamento Mensal Estimado
  if (extraido.faturamentoMensal && extraido.faturamentoMensal !== atual.faturamentoMensal) {
    lista.push({
      chave: 'faturamentoMensal',
      rotulo: 'Faturamento Mensal Estimado',
      grupo: 'operacional',
      valorAtual: atual.faturamentoMensal,
      valorExtraido: extraido.faturamentoMensal,
      valorFormatadoAtual: formatarMoeda(atual.faturamentoMensal),
      valorFormatadoExtraido: `${formatarMoeda(extraido.faturamentoMensal)}/mês (total período: ${formatarMoeda(detalhes.faturamentoPeriodo)})`,
      relevante: true,
      motivoExtracao: `Calculado a partir do total de receitas escrituradas nos blocos A, C e D (${detalhes.mesesNoArquivo} mês/meses no arquivo).`,
    })
  }

  // 5. % Vendas Interestaduais
  if (
    extraido.percentualVendasInterestaduais !== undefined &&
    extraido.percentualVendasInterestaduais !== atual.percentualVendasInterestaduais
  ) {
    lista.push({
      chave: 'percentualVendasInterestaduais',
      rotulo: '% Vendas Interestaduais',
      grupo: 'fase2',
      valorAtual: atual.percentualVendasInterestaduais,
      valorExtraido: extraido.percentualVendasInterestaduais,
      valorFormatadoAtual: `${atual.percentualVendasInterestaduais}%`,
      valorFormatadoExtraido: `${extraido.percentualVendasInterestaduais}%`,
      relevante: true,
      motivoExtracao: `Proporção de receitas com CFOP iniciado em 6xxx (R$ ${detalhes.receitaInterestadual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`,
    })
  }

  // 6. % Exportação
  if (
    extraido.percentualExportacao !== undefined &&
    extraido.percentualExportacao !== atual.percentualExportacao
  ) {
    lista.push({
      chave: 'percentualExportacao',
      rotulo: '% de Exportação',
      grupo: 'operacional',
      valorAtual: atual.percentualExportacao,
      valorExtraido: extraido.percentualExportacao,
      valorFormatadoAtual: `${atual.percentualExportacao}%`,
      valorFormatadoExtraido: `${extraido.percentualExportacao}%`,
      relevante: true,
      motivoExtracao: `Proporção de saídas com CFOP 7xxx (R$ ${detalhes.receitaExportacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`,
    })
  }

  // 7. % Compras sem Crédito
  if (
    extraido.percentualComprasSemCredito !== undefined &&
    extraido.percentualComprasSemCredito !== atual.percentualComprasSemCredito
  ) {
    lista.push({
      chave: 'percentualComprasSemCredito',
      rotulo: '% Compras sem Crédito (Fase 2)',
      grupo: 'fase2',
      valorAtual: atual.percentualComprasSemCredito,
      valorExtraido: extraido.percentualComprasSemCredito,
      valorFormatadoAtual: `${atual.percentualComprasSemCredito}%`,
      valorFormatadoExtraido: `${extraido.percentualComprasSemCredito}%`,
      relevante: true,
      motivoExtracao: `Mapeado por CSTs de entrada sem direito a crédito (70 a 75 e isentos).`,
    })
  }

  // 8. Perfil de Insumos (Fase 1: Cheia, Monofásicos, Reduzida)
  const perfilMudou =
    extraido.perfilInsumosAliquotaCheia !== undefined &&
    (extraido.perfilInsumosAliquotaCheia !== atual.perfilInsumosAliquotaCheia ||
      extraido.perfilInsumosMonofasicos !== atual.perfilInsumosMonofasicos ||
      extraido.perfilInsumosAliquotaReduzida !== atual.perfilInsumosAliquotaReduzida)

  if (perfilMudou) {
    lista.push({
      chave: 'perfilInsumosAliquotaCheia',
      rotulo: 'Perfil de Insumos: Cheia / Monofásicos / Reduzida',
      grupo: 'fase1',
      valorAtual: {
        cheia: atual.perfilInsumosAliquotaCheia,
        mono: atual.perfilInsumosMonofasicos,
        reduz: atual.perfilInsumosAliquotaReduzida,
      },
      valorExtraido: {
        cheia: extraido.perfilInsumosAliquotaCheia,
        mono: extraido.perfilInsumosMonofasicos,
        reduz: extraido.perfilInsumosAliquotaReduzida,
      },
      valorFormatadoAtual: `${atual.perfilInsumosAliquotaCheia}% Cheia | ${atual.perfilInsumosMonofasicos}% Monofásicos | ${atual.perfilInsumosAliquotaReduzida}% Reduzida`,
      valorFormatadoExtraido: `${extraido.perfilInsumosAliquotaCheia}% Cheia | ${extraido.perfilInsumosMonofasicos}% Monofásicos | ${extraido.perfilInsumosAliquotaReduzida}% Reduzida`,
      relevante: true,
      motivoExtracao:
        'Apurado pela agregação das bases tributáveis nos registros C170/C181/C191 da escrituração.',
    })
  }

  // 9. Presença de Monofásicos e Categorias
  if (
    extraido.presencaMonofasicos !== undefined &&
    extraido.presencaMonofasicos !== atual.presencaMonofasicos
  ) {
    lista.push({
      chave: 'presencaMonofasicos',
      rotulo: 'Presença de Produtos Monofásicos',
      grupo: 'fase1',
      valorAtual: atual.presencaMonofasicos,
      valorExtraido: extraido.presencaMonofasicos,
      valorFormatadoAtual: atual.presencaMonofasicos ? 'Sim' : 'Não',
      valorFormatadoExtraido: extraido.presencaMonofasicos ? 'Sim' : 'Não',
      relevante: true,
      motivoExtracao: `Itens ou operações com CST 04/05 detectados na EFD (${detalhes.categoriasMonofasicosDetectadas.join(', ') || 'Monofásicos em geral'}).`,
    })
  }

  // 10. Saldo Credor Acumulado
  if (
    extraido.saldoCredorAcumulado !== undefined &&
    extraido.saldoCredorAcumulado !== atual.saldoCredorAcumulado &&
    extraido.saldoCredorAcumulado > 0
  ) {
    lista.push({
      chave: 'saldoCredorAcumulado',
      rotulo: 'Saldo Credor Acumulado (Fase 2)',
      grupo: 'fase2',
      valorAtual: atual.saldoCredorAcumulado,
      valorExtraido: extraido.saldoCredorAcumulado,
      valorFormatadoAtual: formatarMoeda(atual.saldoCredorAcumulado),
      valorFormatadoExtraido: formatarMoeda(extraido.saldoCredorAcumulado),
      relevante: true,
      motivoExtracao:
        'Apurado no Bloco M (créditos escriturados M100/M500) ou Bloco E110 do SPED Fiscal.',
    })
  }

  // 11. Multi-UF e Filiais
  if (
    extraido.numeroFiliais !== undefined &&
    extraido.numeroFiliais > 1 &&
    extraido.numeroFiliais !== atual.numeroFiliais
  ) {
    lista.push({
      chave: 'numeroFiliais',
      rotulo: 'Número de Estabelecimentos / Filiais',
      grupo: 'fase3',
      valorAtual: atual.numeroFiliais,
      valorExtraido: extraido.numeroFiliais,
      valorFormatadoAtual: `${atual.numeroFiliais} estabelecimento(s)`,
      valorFormatadoExtraido: `${extraido.numeroFiliais} estabelecimentos detectados`,
      relevante: true,
      motivoExtracao: 'Registros 0140 (estabelecimentos cadastrados) no arquivo EFD.',
    })
  }

  if (
    extraido.ufsOperacao &&
    extraido.ufsOperacao.length > 0 &&
    JSON.stringify(extraido.ufsOperacao) !== JSON.stringify(atual.ufsOperacao)
  ) {
    lista.push({
      chave: 'ufsOperacao',
      rotulo: 'UFs Adicionais de Operação (Multi-UF)',
      grupo: 'fase3',
      valorAtual: atual.ufsOperacao,
      valorExtraido: extraido.ufsOperacao,
      valorFormatadoAtual:
        atual.ufsOperacao && atual.ufsOperacao.length > 0
          ? atual.ufsOperacao.join(', ')
          : 'Apenas UF Sede',
      valorFormatadoExtraido: extraido.ufsOperacao.join(', '),
      relevante: true,
      motivoExtracao: 'UFs identificadas nos estabelecimentos filiais (registro 0140).',
    })
  }

  // 12. Insumos Energéticos
  if (extraido.insumosEnergeticos && !atual.insumosEnergeticos) {
    lista.push({
      chave: 'insumosEnergeticos',
      rotulo: 'Insumos Energéticos (Energia Elétrica / Vapor)',
      grupo: 'fase1',
      valorAtual: atual.insumosEnergeticos,
      valorExtraido: true,
      valorFormatadoAtual: 'Não',
      valorFormatadoExtraido: 'Sim',
      relevante: true,
      motivoExtracao:
        'Itens com descrição ou NCM de fornecimento de energia elétrica no Bloco C/0200.',
    })
  }

  // 13. Regime Especial
  if (
    extraido.regimeEspecialAtual &&
    extraido.regimeEspecialAtual !== atual.regimeEspecialAtual &&
    extraido.regimeEspecialAtual !== 'nenhum'
  ) {
    lista.push({
      chave: 'regimeEspecialAtual',
      rotulo: 'Regime Especial Vigente',
      grupo: 'fase2',
      valorAtual: atual.regimeEspecialAtual,
      valorExtraido: extraido.regimeEspecialAtual,
      valorFormatadoAtual: atual.regimeEspecialAtual,
      valorFormatadoExtraido: extraido.regimeEspecialAtual,
      relevante: true,
      motivoExtracao: 'Regime com incidência concentrada monofásica apurado no SPED.',
    })
  }

  return lista
}
