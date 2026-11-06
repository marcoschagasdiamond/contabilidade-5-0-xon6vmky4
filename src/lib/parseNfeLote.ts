/**
 * Parser de Notas Fiscais Eletrônicas (NF-e modelo 55 / NFC-e modelo 65 em XML)
 * e agregação em lote para alimentação da Fonte Mestra e do Recuperador de Créditos.
 *
 * Processamento 100% no navegador (DOMParser nativo).
 *
 * Estrutura XML suportada:
 *  - procNFe / nfeProc / NFe / infNFe
 *  - ide: dEmi / dhEmi, natOp, tpNF (0=entrada, 1=saída)
 *  - emit: CNPJ/CPF, xNome, xFant, UF, IE, CRT
 *  - dest: CNPJ/CPF, xNome, UF, IE
 *  - det:
 *     - prod: cProd, cEAN, xProd, NCM, CFOP, uCom, qCom, vUnCom, vProd
 *     - imposto:
 *        - ICMS: ICMS00/10/20/30/40/51/60/70/90 ou ICMSSN101/102/201/202/500/900
 *                (CST ou CSOSN, vBC, pICMS, vICMS, vBCST, vICMSST)
 *        - PIS: PISAliq/PISQtde/PISNT/PISOutr (CST, vBC, pPIS, vPIS)
 *        - COFINS: COFINSAliq/COFINSQtde/COFINSNT/COFINSOutr (CST, vBC, pCOFINS, vCOFINS)
 *  - total / ICMSTot: vNF, vProd, vBC, vICMS, vPIS, vCOFINS, vFrete, vSeg, vDesc, vOutro
 */

import { DadosEmpresaPerfil, RegimeEspecialAtual, OrigemCampoImportado } from '@/types/dadosEmpresa'
import {
  ResultadoParsingSped,
  MetadadosSped,
  DetalhesExtracaoSped,
  CampoExtracaoComparativo,
} from './parseSpedFiscal'
import {
  buscarNcmPorCodigo,
  sugerirTesesPorItemNcm,
  SugestaoNcmRecuperador,
} from './ncmRecuperadorCreditos'

export interface ItemNfeExtraido {
  numeroItem: number
  codigo: string
  descricao: string
  ncm: string
  cfop: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  // Impostos
  cstIcms?: string
  csosnIcms?: string
  baseIcms?: number
  valorIcms?: number
  cstPis?: string
  basePis?: number
  valorPis?: number
  cstCofins?: string
  baseCofins?: number
  valorCofins?: number
  // Classificações inferidas
  geraCreditoEntrada: boolean
  isMonofasicoPisCofins: boolean
  isSubstituicaoTributaria: boolean
  // IBS/CBS (novo modelo) — presente só quando o XML trouxer o grupo IBSCBS
  ibsCbs?: {
    vIbs: number
    vCbs: number
    cst?: string
    cClassTrib?: string
  }
}

export interface NotaFiscalExtraida {
  chaveAcesso?: string
  numero?: string
  serie?: string
  tipoOperacao: 'entrada' | 'saida' // tpNF: 0=entrada, 1=saída
  naturezaOperacao: string
  dataEmissao: string // YYYY-MM-DD
  anoMes: string // YYYY-MM
  // Emitente
  emitenteCnpjCpf: string
  emitenteNome: string
  emitenteUf: string
  // Destinatário
  destinatarioCnpjCpf: string
  destinatarioNome: string
  destinatarioUf: string
  // Totais
  valorProdutos: number
  valorNota: number
  valorIcms: number
  valorPis: number
  valorCofins: number
  // Interestadual
  isInterestadual: boolean
  // Itens
  itens: ItemNfeExtraido[]
  nomeArquivoOrigem: string
}

export interface ErroImportacaoNfeItem {
  nomeArquivo: string
  motivo: string
}

export interface ItemNcmConsolidadoNfe {
  ncm: string
  descricao: string
  quantidadeTotal: number
  valorTotal: number
  totalItens: number
  notasCount: number
  categoriaRotulo: string
  tesesSugeridas: string[]
  sugestaoCompleta?: SugestaoNcmRecuperador
}

export interface AgregadosLoteNfe {
  totalNotasProcessadas: number
  totalNotasEntrada: number
  totalNotasSaida: number
  totalArquivosIgnorados: number
  erros: ErroImportacaoNfeItem[]
  periodoInicio: string
  periodoFim: string
  mesesCobertos: number
  mesesLista: string[]

  // Faturamento e Compras
  faturamentoTotalSaidas: number
  faturamentoMensalEstimado: number
  comprasTotaisEntradas: number
  comprasComCredito: number
  comprasSemCredito: number
  percentualComprasSemCredito: number
  percentualComprasVendasEstimado: number

  // Operações Interestaduais
  vendasInterestaduais: number
  vendasEstaduais: number
  percentualVendasInterestaduais: number

  // Monofásicos e ST por NCM/CST
  totalVendasMonofasicas: number
  totalItensMonofasicos: number
  presencaMonofasicos: boolean
  categoriasMonofasicosDetectadas: string[]
  presencaSt: boolean

  // NCMs consolidados para o Recuperador
  ncmsConsolidados: ItemNcmConsolidadoNfe[]
  totalNcmsDistintos: number

  // UFs e estabelecimentos
  ufsDetectadas: string[]
  cnpjsDetectados: string[]
  empresaCnpjPrincipal?: string
  empresaNomePrincipal?: string
  empresaUfPrincipal?: string

  // IBS/CBS destacados nos XML (só presentes quando o arquivo traz o grupo IBSCBS)
  ibsDestacadoTotal?: number
  cbsDestacadoTotal?: number
  cstIbsCbsDetectados?: string[]
  cClassTribDetectados?: string[]
}

export interface ResultadoParsingLoteNfe extends ResultadoParsingSped {
  agregadosNfe: AgregadosLoteNfe
  notas: NotaFiscalExtraida[]
}

// Helpers de leitura XML tolerantes a namespace
function getTagText(parent: Element | Document, tagName: string): string {
  // Procura por tag simples ou com prefixo de namespace (ex: nfe:dhEmi ou dhEmi)
  const direct = parent.getElementsByTagName(tagName)
  if (direct && direct.length > 0) {
    return direct[0].textContent?.trim() || ''
  }
  // Fallback busca localName
  const all = parent.getElementsByTagName('*')
  for (let i = 0; i < all.length; i++) {
    if (all[i].localName === tagName) {
      return all[i].textContent?.trim() || ''
    }
  }
  return ''
}

function getDirectChildText(parent: Element, tagName: string): string {
  for (let i = 0; i < parent.children.length; i++) {
    const c = parent.children[i]
    if (c.localName === tagName) {
      return c.textContent?.trim() || ''
    }
  }
  return ''
}

function parseNumeroXml(val: string | undefined): number {
  if (!val) return 0
  const limpo = val.trim().replace(',', '.')
  const n = parseFloat(limpo)
  return isNaN(n) ? 0 : Math.max(0, n)
}

function extrairDataEmissao(val: string): string {
  if (!val) return ''
  // Pode vir YYYY-MM-DD ou YYYY-MM-DDTHH:MM:SS-03:00
  const match = val.match(/^(\d{4}-\d{2}-\d{2})/)
  if (match) return match[1]
  return val.slice(0, 10)
}

/**
 * CSTs de PIS/COFINS em compras/entradas que geram direito a crédito na sistemática não cumulativa:
 * 50, 51, 52 (operações c/ direito a crédito - vinculadas a receita trib no MI)
 * 53, 54, 55, 56 (vinculadas a outras receitas/exportação)
 * 60, 61, 62 (crédito presumido)
 *
 * CSTs 70 a 75 e 98/99 não geram crédito.
 */
function geraCreditoEntradaPisCofins(cst?: string): boolean {
  if (!cst) return false
  const c = cst.padStart(2, '0')
  return ['50', '51', '52', '53', '54', '55', '56', '60', '61', '62'].includes(c)
}

/**
 * CSTs que indicam monofásico ou ST em PIS/COFINS (04=monofásico, 05=ST)
 */
function isMonofasicoCst(cst?: string): boolean {
  if (!cst) return false
  const c = cst.padStart(2, '0')
  return c === '04' || c === '02' // 04 revenda monofásica alíquota zero
}

function isStCst(cstPisCofins?: string, cstIcms?: string, csosnIcms?: string): boolean {
  if (cstPisCofins && cstPisCofins.padStart(2, '0') === '05') return true
  if (cstIcms && ['10', '30', '60', '70'].includes(cstIcms.padStart(2, '0'))) return true
  if (csosnIcms && ['201', '202', '203', '500'].includes(csosnIcms)) return true
  return false
}

/**
 * Faz o parse de UM XML de NF-e (string). Lança Error se não for NF-e válida.
 */
export function parseNfeXmlUnica(xmlTexto: string, nomeArquivo: string): NotaFiscalExtraida {
  if (!xmlTexto || typeof xmlTexto !== 'string' || xmlTexto.trim().length === 0) {
    throw new Error('Conteúdo do arquivo XML está vazio.')
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlTexto, 'application/xml')

  const parseError = doc.getElementsByTagName('parsererror')
  if (parseError && parseError.length > 0) {
    throw new Error('XML malformado ou corrompido.')
  }

  // Verifica se é uma NF-e procurando infNFe ou NFe
  let infNFe = doc.getElementsByTagName('infNFe')[0]
  if (!infNFe) {
    // Procura por localName
    const all = doc.getElementsByTagName('*')
    for (let i = 0; i < all.length; i++) {
      if (all[i].localName === 'infNFe') {
        infNFe = all[i]
        break
      }
    }
  }

  if (!infNFe) {
    throw new Error('Documento XML não é uma NF-e válida (tag infNFe ausente).')
  }

  const chaveAcesso = (infNFe.getAttribute('Id') || '').replace(/^NFe/, '')

  // ide
  const ideEl = infNFe.getElementsByTagName('ide')[0]
  const natOp = ideEl ? getTagText(ideEl, 'natOp') : ''
  const tpNFStr = ideEl ? getTagText(ideEl, 'tpNF') : '1'
  const tipoOperacao: 'entrada' | 'saida' = tpNFStr === '0' ? 'entrada' : 'saida'
  const dEmi = ideEl ? getTagText(ideEl, 'dhEmi') || getTagText(ideEl, 'dEmi') : ''
  const dataEmissao = extrairDataEmissao(dEmi)
  const anoMes = dataEmissao ? dataEmissao.slice(0, 7) : ''
  const numero = ideEl ? getTagText(ideEl, 'nNF') : ''
  const serie = ideEl ? getTagText(ideEl, 'serie') : ''

  // emit
  const emitEl = infNFe.getElementsByTagName('emit')[0]
  const emitCnpj = emitEl ? getTagText(emitEl, 'CNPJ') || getTagText(emitEl, 'CPF') : ''
  const emitNome = emitEl ? getTagText(emitEl, 'xNome') : ''
  const emitEnder = emitEl ? emitEl.getElementsByTagName('enderEmit')[0] : null
  const emitUf = emitEnder ? getTagText(emitEnder, 'UF') : emitEl ? getTagText(emitEl, 'UF') : ''

  // dest
  const destEl = infNFe.getElementsByTagName('dest')[0]
  const destCnpj = destEl ? getTagText(destEl, 'CNPJ') || getTagText(destEl, 'CPF') : ''
  const destNome = destEl ? getTagText(destEl, 'xNome') : ''
  const destEnder = destEl ? destEl.getElementsByTagName('enderDest')[0] : null
  const destUf = destEnder ? getTagText(destEnder, 'UF') : destEl ? getTagText(destEl, 'UF') : ''

  // total
  const totalEl = infNFe.getElementsByTagName('total')[0]
  const icmsTot = totalEl ? totalEl.getElementsByTagName('ICMSTot')[0] : null
  const valorProdutos = icmsTot ? parseNumeroXml(getTagText(icmsTot, 'vProd')) : 0
  const valorNota = icmsTot ? parseNumeroXml(getTagText(icmsTot, 'vNF')) : 0
  const valorIcms = icmsTot ? parseNumeroXml(getTagText(icmsTot, 'vICMS')) : 0
  const valorPis = icmsTot ? parseNumeroXml(getTagText(icmsTot, 'vPIS')) : 0
  const valorCofins = icmsTot ? parseNumeroXml(getTagText(icmsTot, 'vCOFINS')) : 0

  // Interestadual: UFs diferentes entre emitente e destinatário
  const isInterestadual = !!emitUf && !!destUf && emitUf.toUpperCase() !== destUf.toUpperCase()

  // det / itens
  const itens: ItemNfeExtraido[] = []
  const dets = infNFe.getElementsByTagName('det')

  for (let i = 0; i < dets.length; i++) {
    const detEl = dets[i]
    const nItem = parseInt(detEl.getAttribute('nItem') || String(i + 1), 10)
    const prodEl = detEl.getElementsByTagName('prod')[0]
    if (!prodEl) continue

    const codigo = getTagText(prodEl, 'cProd')
    const descricao = getTagText(prodEl, 'xProd')
    const ncmBruto = getTagText(prodEl, 'NCM').replace(/\D/g, '')
    const cfop = getTagText(prodEl, 'CFOP')
    const quantidade = parseNumeroXml(getTagText(prodEl, 'qCom'))
    const valorUnitario = parseNumeroXml(getTagText(prodEl, 'vUnCom'))
    const valorTotal = parseNumeroXml(getTagText(prodEl, 'vProd'))

    // imposto
    const impostoEl = detEl.getElementsByTagName('imposto')[0]
    let cstIcms = ''
    let csosnIcms = ''
    let baseIcms = 0
    let vIcms = 0

    let cstPis = ''
    let basePis = 0
    let vPis = 0

    let cstCofins = ''
    let baseCofins = 0
    let vCofins = 0
    let ibsCbs: ItemNfeExtraido['ibsCbs'] = undefined

    if (impostoEl) {
      // ICMS
      const icmsEl = impostoEl.getElementsByTagName('ICMS')[0]
      if (icmsEl && icmsEl.firstElementChild) {
        const sub = icmsEl.firstElementChild
        cstIcms = getDirectChildText(sub, 'CST')
        csosnIcms = getDirectChildText(sub, 'CSOSN')
        baseIcms = parseNumeroXml(getDirectChildText(sub, 'vBC'))
        vIcms = parseNumeroXml(getDirectChildText(sub, 'vICMS'))
      }

      // PIS
      const pisEl = impostoEl.getElementsByTagName('PIS')[0]
      if (pisEl && pisEl.firstElementChild) {
        const sub = pisEl.firstElementChild
        cstPis = getDirectChildText(sub, 'CST')
        basePis = parseNumeroXml(getDirectChildText(sub, 'vBC'))
        vPis = parseNumeroXml(getDirectChildText(sub, 'vPIS'))
      }

      // COFINS
      const cofinsEl = impostoEl.getElementsByTagName('COFINS')[0]
      if (cofinsEl && cofinsEl.firstElementChild) {
        const sub = cofinsEl.firstElementChild
        cstCofins = getDirectChildText(sub, 'CST')
        baseCofins = parseNumeroXml(getDirectChildText(sub, 'vBC'))
        vCofins = parseNumeroXml(getDirectChildText(sub, 'vCOFINS'))
      }

      // IBS/CBS: lido só se o grupo existir no XML; ausência não altera nada
      const ibsCbsEl = impostoEl.getElementsByTagName('IBSCBS')[0]
      if (ibsCbsEl) {
        const vIbs = parseNumeroXml(getTagText(ibsCbsEl, 'vIBS'))
        const vCbs = parseNumeroXml(getTagText(ibsCbsEl, 'vCBS'))
        const cstIbs = getDirectChildText(ibsCbsEl, 'CST')
        const cClass = getDirectChildText(ibsCbsEl, 'cClassTrib')
        if (vIbs > 0 || vCbs > 0 || cstIbs || cClass) {
          ibsCbs = {
            vIbs,
            vCbs,
            cst: cstIbs || undefined,
            cClassTrib: cClass || undefined,
          }
        }
      }
    }

    const geraCredito = tipoOperacao === 'entrada' && geraCreditoEntradaPisCofins(cstPis)
    const mono = isMonofasicoCst(cstPis) || isMonofasicoCst(cstCofins)
    const st = isStCst(cstPis, cstIcms, csosnIcms)

    itens.push({
      numeroItem: nItem,
      codigo,
      descricao,
      ncm: ncmBruto,
      cfop,
      quantidade,
      valorUnitario,
      valorTotal: valorTotal || quantidade * valorUnitario,
      cstIcms,
      csosnIcms,
      baseIcms,
      valorIcms: vIcms,
      cstPis,
      basePis,
      valorPis: vPis,
      cstCofins,
      baseCofins,
      valorCofins: vCofins,
      geraCreditoEntrada: geraCredito,
      isMonofasicoPisCofins: mono,
      isSubstituicaoTributaria: st,
      ...(ibsCbs ? { ibsCbs } : {}),
    })
  }

  return {
    chaveAcesso,
    numero,
    serie,
    tipoOperacao,
    naturezaOperacao: natOp,
    dataEmissao,
    anoMes,
    emitenteCnpjCpf: emitCnpj,
    emitenteNome: emitNome,
    emitenteUf: emitUf,
    destinatarioCnpjCpf: destCnpj,
    destinatarioNome: destNome,
    destinatarioUf: destUf,
    valorProdutos,
    valorNota: valorNota || valorProdutos,
    valorIcms,
    valorPis,
    valorCofins,
    isInterestadual,
    itens,
    nomeArquivoOrigem: nomeArquivo,
  }
}

/**
 * Agrega um lote de notas já extraídas para totalizar parâmetros contábeis e fiscais.
 */
export function agregarLoteNfe(
  notas: NotaFiscalExtraida[],
  erros: ErroImportacaoNfeItem[],
  perfilAtual: DadosEmpresaPerfil,
): AgregadosLoteNfe {
  let faturamentoTotalSaidas = 0
  let comprasTotaisEntradas = 0
  let comprasComCredito = 0
  let comprasSemCredito = 0

  let vendasInterestaduais = 0
  let vendasEstaduais = 0

  // IBS/CBS: acumulado apenas quando o XML traz o grupo (tolerante à ausência)
  let ibsDestacadoTotal = 0
  let cbsDestacadoTotal = 0
  let temIbsCbs = false
  const cstIbsSet = new Set<string>()
  const cClassTribSet = new Set<string>()

  let totalVendasMonofasicas = 0
  let totalItensMonofasicos = 0
  let presencaSt = false

  const mesesSet = new Set<string>()
  const ufsSet = new Set<string>()
  const cnpjsSet = new Set<string>()
  const categoriasMonoSet = new Set<string>()

  // Mapa de NCM -> consolidação
  const mapaNcm = new Map<
    string,
    {
      ncm: string
      descricao: string
      quantidadeTotal: number
      valorTotal: number
      totalItens: number
      notasSet: Set<string>
    }
  >()

  // Detecta se alguma nota é da empresa atual pelo CNPJ do cadastro
  const cnpjAtualLimpo = (perfilAtual.cnpj || '').replace(/\D/g, '')

  let totalNotasEntrada = 0
  let totalNotasSaida = 0

  for (const nota of notas) {
    if (nota.anoMes) mesesSet.add(nota.anoMes)
    if (nota.emitenteUf) ufsSet.add(nota.emitenteUf.toUpperCase())
    if (nota.destinatarioUf) ufsSet.add(nota.destinatarioUf.toUpperCase())
    if (nota.emitenteCnpjCpf) cnpjsSet.add(nota.emitenteCnpjCpf)
    if (nota.destinatarioCnpjCpf) cnpjsSet.add(nota.destinatarioCnpjCpf)

    // Se a nota tiver tpNF=saída, ou se o emitente é a empresa do cadastro
    const emitenteEAEmpresa =
      cnpjAtualLimpo.length >= 8 &&
      nota.emitenteCnpjCpf.replace(/\D/g, '').startsWith(cnpjAtualLimpo.slice(0, 8))

    const isSaida = nota.tipoOperacao === 'saida' || emitenteEAEmpresa

    if (isSaida) {
      totalNotasSaida++
      faturamentoTotalSaidas += nota.valorNota

      // CFOPs 6xxx ou destinatário em outra UF = interestadual
      const temCfopInterestadual = nota.itens.some((it) => it.cfop.startsWith('6'))
      if (nota.isInterestadual || temCfopInterestadual) {
        vendasInterestaduais += nota.valorNota
      } else {
        vendasEstaduais += nota.valorNota
      }
    } else {
      totalNotasEntrada++
      comprasTotaisEntradas += nota.valorNota

      // Compras com/sem crédito
      let valorComCreditoNota = 0
      let valorSemCreditoNota = 0

      for (const it of nota.itens) {
        if (it.geraCreditoEntrada) {
          valorComCreditoNota += it.valorTotal
        } else {
          valorSemCreditoNota += it.valorTotal
        }
      }

      if (valorComCreditoNota === 0 && valorSemCreditoNota === 0) {
        // Fallback: se nenhum CST detalhou crédito, assume compra total
        comprasComCredito += nota.valorNota
      } else {
        comprasComCredito += valorComCreditoNota
        comprasSemCredito += valorSemCreditoNota
      }
    }

    // Consolidação de itens por NCM
    for (const it of nota.itens) {
      if (it.isMonofasicoPisCofins) {
        totalVendasMonofasicas += it.valorTotal
        totalItensMonofasicos++
      }
      if (it.isSubstituicaoTributaria) {
        presencaSt = true
      }
      if (it.ibsCbs) {
        temIbsCbs = true
        ibsDestacadoTotal += it.ibsCbs.vIbs || 0
        cbsDestacadoTotal += it.ibsCbs.vCbs || 0
        if (it.ibsCbs.cst) cstIbsSet.add(it.ibsCbs.cst)
        if (it.ibsCbs.cClassTrib) cClassTribSet.add(it.ibsCbs.cClassTrib)
      }

      const ncmLimpo = it.ncm.replace(/\D/g, '')
      if (ncmLimpo.length >= 4) {
        const itemNcmCurado = buscarNcmPorCodigo(ncmLimpo)
        if (
          itemNcmCurado?.categoria === 'monofasico_imposto_seletivo' ||
          it.isMonofasicoPisCofins
        ) {
          categoriasMonoSet.add(itemNcmCurado?.categoria || 'monofasico_imposto_seletivo')
        }

        const atual = mapaNcm.get(ncmLimpo) || {
          ncm: ncmLimpo,
          descricao: it.descricao,
          quantidadeTotal: 0,
          valorTotal: 0,
          totalItens: 0,
          notasSet: new Set<string>(),
        }

        atual.quantidadeTotal += it.quantidade
        atual.valorTotal += it.valorTotal
        atual.totalItens++
        if (nota.numero) atual.notasSet.add(nota.numero)
        if (!atual.descricao && it.descricao) atual.descricao = it.descricao

        mapaNcm.set(ncmLimpo, atual)
      }
    }
  }

  const mesesLista = Array.from(mesesSet).sort()
  const mesesCobertos = Math.max(1, mesesLista.length)
  const periodoInicio = mesesLista.length > 0 ? `${mesesLista[0]}-01` : ''
  const periodoFim = mesesLista.length > 0 ? `${mesesLista[mesesLista.length - 1]}-28` : ''

  const faturamentoMensalEstimado =
    faturamentoTotalSaidas > 0 ? faturamentoTotalSaidas / mesesCobertos : 0

  const percentualComprasVendasEstimado =
    faturamentoTotalSaidas > 0
      ? Math.min(100, Math.round((comprasTotaisEntradas / faturamentoTotalSaidas) * 100))
      : comprasTotaisEntradas > 0
        ? 40
        : perfilAtual.percentualComprasVendas || 40

  const totalComprasApuradas = comprasComCredito + comprasSemCredito
  const percentualComprasSemCredito =
    totalComprasApuradas > 0 ? Math.round((comprasSemCredito / totalComprasApuradas) * 100) : 0

  const totalVendasApuradas = vendasInterestaduais + vendasEstaduais
  const percentualVendasInterestaduais =
    totalVendasApuradas > 0 ? Math.round((vendasInterestaduais / totalVendasApuradas) * 100) : 0

  // NCMs consolidados com sugestão do Recuperador
  const ncmsConsolidados: ItemNcmConsolidadoNfe[] = Array.from(mapaNcm.values())
    .map((item) => {
      const curado = buscarNcmPorCodigo(item.ncm)
      const sug = curado ? sugerirTesesPorItemNcm(curado) : undefined
      return {
        ncm: item.ncm,
        descricao: curado?.descricao || item.descricao,
        quantidadeTotal: Math.round(item.quantidadeTotal * 100) / 100,
        valorTotal: Math.round(item.valorTotal * 100) / 100,
        totalItens: item.totalItens,
        notasCount: item.notasSet.size,
        categoriaRotulo: curado?.categoriaRotulo || 'Geral',
        tesesSugeridas: sug?.tesesSugeridasIds || [],
        sugestaoCompleta: sug,
      }
    })
    .sort((a, b) => b.valorTotal - a.valorTotal)

  const presencaMonofasicos = totalItensMonofasicos > 0 || categoriasMonoSet.size > 0

  return {
    totalNotasProcessadas: notas.length,
    totalNotasEntrada,
    totalNotasSaida,
    totalArquivosIgnorados: erros.length,
    erros,
    periodoInicio,
    periodoFim,
    mesesCobertos,
    mesesLista,
    faturamentoTotalSaidas,
    faturamentoMensalEstimado,
    comprasTotaisEntradas,
    comprasComCredito,
    comprasSemCredito,
    percentualComprasSemCredito,
    percentualComprasVendasEstimado,
    vendasInterestaduais,
    vendasEstaduais,
    percentualVendasInterestaduais,
    totalVendasMonofasicas,
    totalItensMonofasicos,
    presencaMonofasicos,
    categoriasMonofasicosDetectadas: Array.from(categoriasMonoSet),
    presencaSt,
    ncmsConsolidados,
    totalNcmsDistintos: ncmsConsolidados.length,
    ufsDetectadas: Array.from(ufsSet),
    cnpjsDetectados: Array.from(cnpjsSet),
    empresaCnpjPrincipal: notas[0]?.emitenteCnpjCpf || perfilAtual.cnpj,
    empresaNomePrincipal: notas[0]?.emitenteNome || perfilAtual.nomeEmpresa,
    empresaUfPrincipal: notas[0]?.emitenteUf || perfilAtual.ufOrigem,
    ...(temIbsCbs
      ? {
          ibsDestacadoTotal: Math.round(ibsDestacadoTotal * 100) / 100,
          cbsDestacadoTotal: Math.round(cbsDestacadoTotal * 100) / 100,
          cstIbsCbsDetectados: Array.from(cstIbsSet),
          cClassTribDetectados: Array.from(cClassTribSet),
        }
      : {}),
  }
}

/**
 * Converte agregados do lote de NF-e no formato padrão de resultado compatível
 * com o ModalResumoImportacaoSped e a persistência na Fonte Mestra.
 */
export function construirResultadoParsingLoteNfe(
  agregados: AgregadosLoteNfe,
  notas: NotaFiscalExtraida[],
  nomeLoteOuArquivo: string,
  tamanhoTotalBytes: number,
  perfilAtual: DadosEmpresaPerfil,
): ResultadoParsingLoteNfe {
  const metadados: MetadadosSped = {
    tipo: 'desconhecido',
    nomeTipo: 'Lote de Notas Fiscais Eletrônicas (NF-e XML)',
    cnpj: agregados.empresaCnpjPrincipal || perfilAtual.cnpj,
    nomeEmpresa: agregados.empresaNomePrincipal || perfilAtual.nomeEmpresa,
    uf: agregados.empresaUfPrincipal || perfilAtual.ufOrigem,
    periodoInicio: agregados.periodoInicio,
    periodoFim: agregados.periodoFim,
    linhasLidas: agregados.totalNotasProcessadas,
    tamanhoBytes: tamanhoTotalBytes,
    nomeArquivo: nomeLoteOuArquivo,
    dataProcessamento: new Date().toISOString(),
  }

  const avisos: string[] = []
  if (agregados.totalNotasSaida === 0 && agregados.totalNotasEntrada > 0) {
    avisos.push(
      'O lote importado contém apenas notas de compra/entrada. Faturamento de vendas foi mantido como no cadastro.',
    )
  }
  if (agregados.erros.length > 0) {
    avisos.push(
      `${agregados.erros.length} arquivo(s) apresentaram erros de XML e foram ignorados sem impactar as notas válidas.`,
    )
  }
  if (agregados.presencaMonofasicos) {
    avisos.push(
      `Detectados itens sujeitos à tributação Monofásica/Alíquota Zero de PIS/COFINS nos NCMs importados (${agregados.categoriasMonofasicosDetectadas.join(', ') || 'Monofásicos'}).`,
    )
  }

  const regimeSugerido: RegimeEspecialAtual = agregados.presencaMonofasicos
    ? 'monofasico'
    : agregados.presencaSt
      ? 'substituicao_tributaria'
      : 'nenhum'

  // Perfil de insumos estimado a partir das compras
  const totalInsumos = agregados.comprasComCredito + agregados.comprasSemCredito
  const perfilCheia =
    totalInsumos > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              ((agregados.comprasComCredito - agregados.totalVendasMonofasicas) / totalInsumos) *
                100,
            ),
          ),
        )
      : perfilAtual.perfilInsumosAliquotaCheia || 100

  const perfilMono =
    totalInsumos > 0
      ? Math.max(
          0,
          Math.min(100, Math.round((agregados.totalVendasMonofasicas / totalInsumos) * 100)),
        )
      : agregados.presencaMonofasicos
        ? 15
        : 0

  const perfilReduzida = Math.max(0, 100 - perfilCheia - perfilMono)

  const detalhes: DetalhesExtracaoSped = {
    faturamentoPeriodo: agregados.faturamentoTotalSaidas,
    faturamentoMensalEstimado: agregados.faturamentoMensalEstimado,
    mesesNoArquivo: agregados.mesesCobertos,
    receitaInterestadual: agregados.vendasInterestaduais,
    receitaEstadual: agregados.vendasEstaduais,
    receitaExportacao: 0,
    percentualVendasInterestaduais: agregados.percentualVendasInterestaduais,
    percentualExportacao: 0,
    comprasTotais: agregados.comprasTotaisEntradas,
    comprasComCredito: agregados.comprasComCredito,
    comprasSemCredito: agregados.comprasSemCredito,
    percentualComprasSemCredito: agregados.percentualComprasSemCredito,
    percentualComprasVendasEstimado: agregados.percentualComprasVendasEstimado,
    insumosAliquotaCheia: agregados.comprasComCredito,
    insumosMonofasicos: agregados.totalVendasMonofasicas,
    insumosAliquotaReduzida: agregados.comprasSemCredito,
    perfilInsumosAliquotaCheia: perfilCheia,
    perfilInsumosMonofasicos: perfilMono,
    perfilInsumosAliquotaReduzida: perfilReduzida,
    presencaMonofasicos: agregados.presencaMonofasicos,
    categoriasMonofasicosDetectadas: agregados.categoriasMonofasicosDetectadas,
    insumosEnergeticosDetectados: false,
    intangiveisDetectados: false,
    imobilizadoIdentificado: 0,
    saldoCredorAcumulado: 0,
    filiaisDetectadas: Math.max(1, agregados.cnpjsDetectados.length),
    ufsOperacaoDetectadas: agregados.ufsDetectadas,
    regimeEspecialSugerido: regimeSugerido,
    avisos,
  }

  // Prepara campos sugeridos para Fonte Mestra
  const camposSugeridos: Partial<DadosEmpresaPerfil> = {}
  const camposComparativo: CampoExtracaoComparativo[] = []

  const fmtMoeda = (v?: number) =>
    (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtPct = (v?: number) => `${v || 0}%`

  // 1. Faturamento Mensal (apenas se houver notas de saída)
  if (agregados.faturamentoMensalEstimado > 0) {
    const fatArredondado = Math.round(agregados.faturamentoMensalEstimado)
    camposSugeridos.faturamentoMensal = fatArredondado
    camposComparativo.push({
      chave: 'faturamentoMensal',
      rotulo: 'Faturamento Mensal Estimado',
      grupo: 'operacional',
      valorAtual: perfilAtual.faturamentoMensal,
      valorExtraido: fatArredondado,
      valorFormatadoAtual: fmtMoeda(perfilAtual.faturamentoMensal),
      valorFormatadoExtraido: `${fmtMoeda(fatArredondado)}/mês (${agregados.totalNotasSaida} NFs saídas)`,
      relevante: true,
      motivoExtracao: `Média calculada sobre ${agregados.mesesCobertos} mês(es) com ${agregados.totalNotasSaida} NFs de saída extraídas.`,
    })
  }

  // 2. Percentual Compras / Vendas
  if (agregados.comprasTotaisEntradas > 0 && agregados.faturamentoTotalSaidas > 0) {
    camposSugeridos.percentualComprasVendas = agregados.percentualComprasVendasEstimado
    camposComparativo.push({
      chave: 'percentualComprasVendas',
      rotulo: '% Compras sobre Vendas',
      grupo: 'operacional',
      valorAtual: perfilAtual.percentualComprasVendas,
      valorExtraido: agregados.percentualComprasVendasEstimado,
      valorFormatadoAtual: fmtPct(perfilAtual.percentualComprasVendas),
      valorFormatadoExtraido: fmtPct(agregados.percentualComprasVendasEstimado),
      relevante: true,
      motivoExtracao: `Relação entre Compras (${fmtMoeda(agregados.comprasTotaisEntradas)}) e Vendas (${fmtMoeda(agregados.faturamentoTotalSaidas)}).`,
    })
  }

  // 3. Percentual Vendas Interestaduais
  if (agregados.faturamentoTotalSaidas > 0) {
    camposSugeridos.percentualVendasInterestaduais = agregados.percentualVendasInterestaduais
    camposComparativo.push({
      chave: 'percentualVendasInterestaduais',
      rotulo: '% Vendas Interestaduais (Destinatário outro UF / CFOP 6xxx)',
      grupo: 'operacional',
      valorAtual: perfilAtual.percentualVendasInterestaduais || 0,
      valorExtraido: agregados.percentualVendasInterestaduais,
      valorFormatadoAtual: fmtPct(perfilAtual.percentualVendasInterestaduais || 0),
      valorFormatadoExtraido: fmtPct(agregados.percentualVendasInterestaduais),
      relevante: true,
      motivoExtracao: `Apurado a partir do CFOP 6xxx e destinatários em UFs diferentes da emitente (${fmtMoeda(agregados.vendasInterestaduais)}).`,
    })
  }

  // 4. Presença de Monofásicos
  if (agregados.presencaMonofasicos) {
    camposSugeridos.presencaMonofasicos = true
    if (agregados.categoriasMonofasicosDetectadas.length > 0) {
      camposSugeridos.categoriasMonofasicos = agregados.categoriasMonofasicosDetectadas
    }
    camposComparativo.push({
      chave: 'presencaMonofasicos',
      rotulo: 'Presença de Produtos Monofásicos / ST (PIS/COFINS)',
      grupo: 'fase1',
      valorAtual: perfilAtual.presencaMonofasicos ? 'Sim' : 'Não',
      valorExtraido: 'Sim',
      valorFormatadoAtual: perfilAtual.presencaMonofasicos ? 'Sim' : 'Não',
      valorFormatadoExtraido: `Sim (${agregados.totalItensMonofasicos} itens / NCMs monofásicos)`,
      relevante: true,
      motivoExtracao: `Itens com CST 04/02 ou NCM de produtos monofásicos detectados nas notas (${agregados.categoriasMonofasicosDetectadas.join(', ') || 'monofásicos'}).`,
    })
  }

  // 5. Perfil de Insumos (Cheia, Monofásicos, Reduzida)
  if (agregados.comprasTotaisEntradas > 0) {
    camposSugeridos.perfilInsumosAliquotaCheia = perfilCheia
    camposSugeridos.perfilInsumosMonofasicos = perfilMono
    camposSugeridos.perfilInsumosAliquotaReduzida = perfilReduzida

    camposComparativo.push({
      chave: 'perfilInsumosAliquotaCheia',
      rotulo: 'Insumos Alíquota Cheia / Básica (%)',
      grupo: 'fase1',
      valorAtual: perfilAtual.perfilInsumosAliquotaCheia,
      valorExtraido: perfilCheia,
      valorFormatadoAtual: fmtPct(perfilAtual.perfilInsumosAliquotaCheia),
      valorFormatadoExtraido: fmtPct(perfilCheia),
      relevante: true,
      motivoExtracao: `Compras com CST gerador de crédito: ${fmtMoeda(agregados.comprasComCredito)}.`,
    })
  }

  // 6. UFs de Operação (se houver mais de 1 UF)
  if (agregados.ufsDetectadas.length > 0) {
    camposSugeridos.ufsOperacao = agregados.ufsDetectadas
    camposComparativo.push({
      chave: 'ufsOperacao',
      rotulo: 'UFs de Operação Detectadas',
      grupo: 'operacional',
      valorAtual: (perfilAtual.ufsOperacao || []).join(', ') || perfilAtual.ufOrigem,
      valorExtraido: agregados.ufsDetectadas,
      valorFormatadoAtual: (perfilAtual.ufsOperacao || []).join(', ') || perfilAtual.ufOrigem,
      valorFormatadoExtraido: agregados.ufsDetectadas.join(', '),
      relevante: agregados.ufsDetectadas.length > 1,
      motivoExtracao: `UFs de emitentes e destinatários presentes no lote de notas fiscais.`,
    })
  }

  return {
    valido: true,
    metadados,
    detalhes,
    camposSugeridos,
    camposComparativo,
    agregadosNfe: agregados,
    notas,
  }
}

/**
 * Cria o mapa de proveniência de campos para a importação de NF-e.
 */
export function construirOrigemCamposNfe(
  camposSugeridos: Partial<DadosEmpresaPerfil>,
  nomeLote: string,
  totalNotas: number,
): Record<string, OrigemCampoImportado> {
  const agora = new Date().toISOString()
  const origem: Record<string, OrigemCampoImportado> = {}

  const rotulos: Record<string, string> = {
    faturamentoMensal: 'Faturamento Mensal',
    percentualComprasVendas: '% Compras sobre Vendas',
    percentualVendasInterestaduais: '% Vendas Interestaduais',
    presencaMonofasicos: 'Presença de Monofásicos',
    categoriasMonofasicos: 'Categorias de Monofásicos',
    perfilInsumosAliquotaCheia: 'Insumos Alíquota Cheia',
    perfilInsumosMonofasicos: 'Insumos Monofásicos',
    perfilInsumosAliquotaReduzida: 'Insumos Alíquota Reduzida',
    ufsOperacao: 'UFs de Operação',
  }

  for (const [chave, valor] of Object.entries(camposSugeridos)) {
    if (valor !== undefined && valor !== null) {
      origem[chave] = {
        chave,
        rotulo: rotulos[chave] || chave,
        documento: `${nomeLote} (${totalNotas} NFs)`,
        tipo: 'nfe_xml',
        dataImportacao: agora,
        valorFormatado:
          typeof valor === 'number'
            ? valor.toLocaleString('pt-BR')
            : Array.isArray(valor)
              ? valor.join(', ')
              : String(valor),
      }
    }
  }

  return origem
}
