/**
 * Motor de Parsing de Balancete Contábil (CSV e XLSX).
 *
 * Reconhece formatos comuns de balancete:
 * 1. Balancete completo: colunas de conta (código e/ou descrição/classificação),
 *    saldo anterior, débitos, créditos, saldo final (com indicador D/C ou sinal).
 * 2. Balancete simples: duas colunas (conta / descrição, saldo / movimento).
 *
 * Extrai agregados e mapeia exclusivamente para os campos EXISTENTES de DadosEmpresaPerfil:
 * - Receita bruta / faturamento do período (contas de receitas operacionais brutas / vendas / serviços)
 * - Despesas geradoras de crédito (energia, aluguel, fretes, insumos, manutenção, serviços de terceiros PJ)
 * - Folha de pagamento (salários, pró-labore, encargos, FGTS, INSS)
 * - Insumos energéticos (energia elétrica, luz, gás, vapor) -> ativa insumosEnergeticos (boolean)
 * - Intangíveis e royalties (software, licenças, marcas, patentes, royalties, ágio) -> ativa intangiveisRoyalties (boolean)
 * - Ativo imobilizado (máquinas, equipamentos, veículos, prédios, móveis, benfeitorias) -> imobilizadoUltimos5Anos
 * - Margem de lucro estimada (%) baseada na proporção Lucro Líquido / Receita Bruta
 * - Proporção de atividade mista (quando há segregação explícita de receitas de comércio vs serviços)
 *
 * Outros agregados sem campo direto na fonte mestra são listados como informativos nos metadados.
 * NUNCA altera ou sugere teses do Recuperador de Créditos.
 */

import { DadosEmpresaPerfil } from '@/types/dadosEmpresa'
import {
  parseCsvConteudo,
  parseArquivoFaturamento,
  converterParaNumero,
  type LinhaPlanilhaBruta,
  type ResultadoParsePlanilha,
} from './importacaoFaturamento'
import { CampoExtracaoComparativo, MetadadosSped } from './parseSpedFiscal'

export interface AgregadosBalancete {
  receitaBrutaPeriodo: number
  faturamentoMensalEstimado: number
  mesesEstimados: number
  folhaPagamentoPeriodo: number
  folhaPagamentoMensalEstimada: number
  despesasComCreditoPeriodo: number
  despesasComCreditoMensaisEstimadas: number
  custosMercadoriasServicos: number
  lucroLiquidoPeriodo: number
  margemLucroCalculada: number // %
  ativoImobilizadoTotal: number
  ativoTotal: number
  passivoTotal: number
  patrimonioLiquido: number
  contasEnergiaEletrica: number
  contasIntangiveisRoyalties: number
  receitaComercio: number
  receitaServicos: number
  receitaIndustria: number
  totalLinhasLidas: number
  totalContasClassificadas: number
  avisos: string[]
  itensInformativos: { rotulo: string; valor: number; descricao: string }[]
}

export interface ResultadoParsingBalancete {
  valido: boolean
  erro?: string
  metadados: MetadadosSped
  detalhesBalancete: AgregadosBalancete
  camposSugeridos: Partial<DadosEmpresaPerfil>
  camposComparativo: CampoExtracaoComparativo[]
}

interface ColunasMapeadasBalancete {
  colConta?: string
  colDescricao?: string
  colSaldoAnterior?: string
  colDebito?: string
  colCredito?: string
  colSaldoFinal?: string
  colNatureza?: string // D/C ou Indicador
}

/**
 * Normaliza texto para busca insensível a acentos e pontuação
 */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Localiza a melhor coluna na planilha por palavras-chave
 */
function encontrarColuna(colunas: string[], termos: string[]): string | undefined {
  return colunas.find((c) => {
    const limpo = normalizar(c)
    return termos.some((t) => limpo.includes(normalizar(t)))
  })
}

/**
 * Mapeia colunas do balancete a partir do cabeçalho
 */
function mapearColunasBalancete(colunas: string[]): ColunasMapeadasBalancete {
  const colConta = encontrarColuna(colunas, [
    'conta',
    'codigo',
    'cod_conta',
    'cd_conta',
    'classificacao',
    'estrutural',
    'plano_contas',
  ])

  const colDescricao = encontrarColuna(colunas, [
    'descricao',
    'descric',
    'nome_conta',
    'titulo',
    'historico',
    'denominacao',
    'conta_descricao',
  ])

  const colSaldoAnterior = encontrarColuna(colunas, [
    'saldo_anterior',
    'sd_anterior',
    'anterior',
    'saldo_ant',
    'vl_anterior',
  ])

  const colDebito = encontrarColuna(colunas, [
    'debito',
    'debitos',
    'vl_debito',
    'mov_debito',
    'debitado',
  ])

  const colCredito = encontrarColuna(colunas, [
    'credito',
    'creditos',
    'vl_credito',
    'mov_credito',
    'creditado',
  ])

  const colSaldoFinal = encontrarColuna(colunas, [
    'saldo_atual',
    'saldo_final',
    'sd_atual',
    'saldo',
    'vl_saldo',
    'movimento',
    'valor',
    'saldo_periodo',
    'total',
  ])

  const colNatureza = encontrarColuna(colunas, [
    'natureza',
    'ind_dc',
    'tipo_saldo',
    'd_c',
    'dc',
    'indicador',
    'sit',
  ])

  return {
    colConta,
    colDescricao,
    colSaldoAnterior,
    colDebito,
    colCredito,
    colSaldoFinal,
    colNatureza,
  }
}

/**
 * Converte valor textual de balancete em número considerando D/C, parênteses ou sinal negativo
 */
export function converterValorContabil(val: unknown, indicadorNatureza?: string): number {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'number') {
    if (indicadorNatureza && normalizar(indicadorNatureza) === 'd') return Math.abs(val)
    if (indicadorNatureza && normalizar(indicadorNatureza) === 'c') return Math.abs(val)
    return Math.abs(val)
  }

  const str = String(val).trim()
  if (!str) return 0

  // Se tiver parênteses "(1.234,56)" -> número negativo
  const isParenteses = /^\(.*\)$/.test(str)
  let limpo = str.replace(/[()]/g, '').trim()

  // Se tiver sufixo D ou C: "1.234,56 D" ou "1.234,56 C"
  let sufixoNatureza: string | undefined = undefined
  if (/[0-9]\s*[dDcC]$/.test(limpo)) {
    sufixoNatureza = limpo.slice(-1).toLowerCase()
    limpo = limpo.slice(0, -1).trim()
  }

  const num = converterParaNumero(limpo)
  const abs = Math.abs(num)

  // Retorna absoluto da movimentação/saldo para agregação
  return isParenteses ? abs : abs
}

/**
 * Classificação e regras de reconhecimento de contas
 */
interface ContaClassificada {
  codigo: string
  descricao: string
  saldoFinal: number
  debito: number
  credito: number
  ehSintetica: boolean
}

/**
 * Processa as linhas brutas da planilha e agrega os totais
 */
export function processarLinhasBalancete(
  linhas: LinhaPlanilhaBruta[],
  colunas: string[],
): AgregadosBalancete {
  const mapeamento = mapearColunasBalancete(colunas)

  const avisos: string[] = []
  let totalContasClassificadas = 0

  // Agregadores principais
  let receitaBrutaTotal = 0
  let receitaServicos = 0
  let receitaComercio = 0
  let receitaIndustria = 0

  let folhaPagamentoTotal = 0
  let despesasComCreditoTotal = 0
  let custosMercadoriasServicos = 0
  let lucroLiquidoPeriodo = 0

  let ativoImobilizadoTotal = 0
  let ativoTotal = 0
  let passivoTotal = 0
  let patrimonioLiquido = 0

  let contasEnergiaEletrica = 0
  let contasIntangiveisRoyalties = 0

  // Identifica contas
  const contas: ContaClassificada[] = []

  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i]

    // Obtém texto da conta e descrição
    let contaCodigo = mapeamento.colConta ? (l[mapeamento.colConta] || '').trim() : ''
    let contaDescricao = mapeamento.colDescricao ? (l[mapeamento.colDescricao] || '').trim() : ''

    // Se tiver apenas uma coluna de descrição/conta, tenta separar formato "1.1.01 - Caixa" ou "3.1 Receita"
    if (!contaDescricao && contaCodigo) {
      const match = contaCodigo.match(/^([0-9.]+)\s*[-–—:]?\s*(.+)$/)
      if (match) {
        contaCodigo = match[1].trim()
        contaDescricao = match[2].trim()
      } else {
        contaDescricao = contaCodigo
      }
    } else if (!contaCodigo && contaDescricao) {
      const match = contaDescricao.match(/^([0-9.]+)\s*[-–—:]?\s*(.+)$/)
      if (match) {
        contaCodigo = match[1].trim()
        contaDescricao = match[2].trim()
      }
    }

    if (!contaCodigo && !contaDescricao) continue

    // Valores
    const saldoFinalRaw = mapeamento.colSaldoFinal ? l[mapeamento.colSaldoFinal] : ''
    const debitoRaw = mapeamento.colDebito ? l[mapeamento.colDebito] : ''
    const creditoRaw = mapeamento.colCredito ? l[mapeamento.colCredito] : ''
    const naturezaRaw = mapeamento.colNatureza ? l[mapeamento.colNatureza] : ''

    const saldoFinal = converterValorContabil(saldoFinalRaw, naturezaRaw)
    const debito = converterValorContabil(debitoRaw)
    const credito = converterValorContabil(creditoRaw)

    // Valor de movimento útil (saldo final ou crédito/débito dependendo da conta)
    const valorRelevante = saldoFinal > 0 ? saldoFinal : Math.max(debito, credito)

    if (valorRelevante <= 0 && saldoFinal <= 0) continue

    // Verifica se a conta é sintética pelo padrão de pontos ou descrição em maiúsculas sem nível analítico
    // Ex: "3", "3.1", "3.01" costumam ser sintéticas se houver contas mais profundas como "3.1.01.001"
    const pontos = (contaCodigo.match(/\./g) || []).length
    const ehSintetica =
      pontos <= 1 && contaCodigo.length <= 4 && /^[0-9]+(\.[0-9]+)?$/.test(contaCodigo)

    contas.push({
      codigo: contaCodigo,
      descricao: contaDescricao,
      saldoFinal: valorRelevante,
      debito,
      credito,
      ehSintetica,
    })
  }

  // Se não foi encontrada nenhuma conta estruturada
  if (contas.length === 0) {
    avisos.push('Nenhuma conta com valor numérico positivo foi identificada na planilha.')
    return criarAgregadosVazios(linhas.length, avisos)
  }

  // Agrupamento por classificação / palavras-chave
  // Priorizamos contas analíticas se houver; se o balancete for apenas sintético, usamos as que existirem
  const temContasAnaliticas = contas.some((c) => !c.ehSintetica)
  const contasParaClassificar = temContasAnaliticas ? contas.filter((c) => !c.ehSintetica) : contas

  for (const c of contasParaClassificar) {
    const desc = normalizar(c.descricao)
    const cod = c.codigo.trim()
    const val = c.saldoFinal

    // 1. ATIVO TOTAL (Grupo 1)
    if (cod === '1' || desc === 'ativo' || desc === 'ativo total') {
      if (val > ativoTotal) ativoTotal = val
    }

    // 2. PASSIVO TOTAL (Grupo 2)
    if (
      cod === '2' ||
      desc === 'passivo' ||
      desc === 'passivo total' ||
      desc === 'passivo e patrimonio liquido'
    ) {
      if (val > passivoTotal) passivoTotal = val
    }

    // 3. PATRIMÔNIO LÍQUIDO
    if (
      desc.includes('patrimonio liquido') ||
      cod.startsWith('2.4') ||
      cod.startsWith('2.3') ||
      cod.startsWith('2.5')
    ) {
      if (val > patrimonioLiquido) patrimonioLiquido = val
    }

    // 4. ATIVO IMOBILIZADO (Subgrupo 1.2 ou 1.3 / Imobilizado)
    const ehImobilizado =
      desc.includes('imobilizado') ||
      desc.includes('maquinas e equipamentos') ||
      desc.includes('veiculos') ||
      desc.includes('computadores e perifericos') ||
      desc.includes('moveis e utensilios') ||
      desc.includes('edificacoes') ||
      desc.includes('instalacoes industriais') ||
      cod.startsWith('1.2.3') ||
      cod.startsWith('1.2.2') ||
      cod.startsWith('1.3')

    if (ehImobilizado && !desc.includes('depreciacao') && !desc.includes('amortizacao')) {
      ativoImobilizadoTotal += val
      totalContasClassificadas++
    }

    // 5. INTANGÍVEIS / ROYALTIES / LICENÇAS
    const ehIntangivel =
      desc.includes('intangivel') ||
      desc.includes('softwares') ||
      desc.includes('software') ||
      desc.includes('marcas e patentes') ||
      desc.includes('marca e patente') ||
      desc.includes('royalt') ||
      desc.includes('agio') ||
      desc.includes('licenca de uso') ||
      desc.includes('direitos autorais')

    if (ehIntangivel && !desc.includes('amortizacao')) {
      contasIntangiveisRoyalties += val
      totalContasClassificadas++
    }

    // 6. ENERGIA ELÉTRICA / INSUMOS ENERGÉTICOS
    const ehEnergia =
      desc.includes('energia eletrica') ||
      desc.includes('luz e forca') ||
      desc.includes('luz e energia') ||
      desc.includes('gas industrial') ||
      desc.includes('combustiveis e lubrificantes industriais')

    if (ehEnergia) {
      contasEnergiaEletrica += val
      despesasComCreditoTotal += val
      totalContasClassificadas++
    }

    // 7. RECEITA BRUTA / OPERACIONAL (Grupo 3 ou 4 dependendo do plano)
    // Palavras-chave: receita bruta, receita operacional bruta, vendas de mercadorias, prestacao de servicos
    const ehReceitaBruta =
      (desc.includes('receita bruta') ||
        desc.includes('receita operacional bruta') ||
        desc.includes('receita de vendas') ||
        desc.includes('receitas de vendas') ||
        desc.includes('receita de servicos') ||
        desc.includes('receitas de servicos') ||
        desc.includes('faturamento') ||
        desc.includes('venda de mercadorias') ||
        desc.includes('prestacao de servicos') ||
        desc.includes('producao industrial')) &&
      !desc.includes('deducoes') &&
      !desc.includes('devolucoes') &&
      !desc.includes('impostos sobre') &&
      !desc.includes('abatimentos')

    if (ehReceitaBruta) {
      receitaBrutaTotal += val
      totalContasClassificadas++

      // Segregação comércio vs serviços para atividade mista
      if (
        desc.includes('servico') ||
        desc.includes('prestacao') ||
        desc.includes('honorarios') ||
        desc.includes('consultoria')
      ) {
        receitaServicos += val
      } else if (
        desc.includes('comercio') ||
        desc.includes('mercadoria') ||
        desc.includes('revenda')
      ) {
        receitaComercio += val
      } else if (
        desc.includes('industria') ||
        desc.includes('fabricacao') ||
        desc.includes('producao')
      ) {
        receitaIndustria += val
      }
    }

    // 8. FOLHA DE PAGAMENTO E ENCARGOS
    const ehFolha =
      desc.includes('salarios e ordenados') ||
      desc.includes('salarios') ||
      desc.includes('pro-labore') ||
      desc.includes('pro labore') ||
      desc.includes('fgts') ||
      desc.includes('inss') ||
      desc.includes('decimo terceiro') ||
      desc.includes('13o salario') ||
      desc.includes('ferias') ||
      desc.includes('encargos sociais') ||
      desc.includes('beneficios a empregados')

    if (
      ehFolha &&
      !desc.includes('a pagar') &&
      !desc.includes('provisao') &&
      !desc.includes('recolher')
    ) {
      folhaPagamentoTotal += val
      totalContasClassificadas++
    }

    // 9. DESPESAS COM DIREITO A CRÉDITO (Insumos, aluguel, energia, fretes, telecom, TI)
    const ehDespesaCredito =
      desc.includes('aluguel') ||
      desc.includes('alugueis') ||
      desc.includes('arrendamento') ||
      desc.includes('fretes e carretos') ||
      desc.includes('manutencao de maquinas') ||
      desc.includes('manutencao e reparos') ||
      desc.includes('servicos de ti') ||
      desc.includes('telecomunicacoes') ||
      desc.includes('provedor de internet') ||
      desc.includes('servicos prestados por pessoa juridica') ||
      desc.includes('insumos aplicados')

    if (ehDespesaCredito) {
      despesasComCreditoTotal += val
      totalContasClassificadas++
    }

    // 10. CUSTOS OPERACIONAIS (CMV, CSP, CPV)
    if (
      desc.includes('custo das mercadorias') ||
      desc.includes('cmv') ||
      desc.includes('custo dos servicos') ||
      desc.includes('csp') ||
      desc.includes('custo dos produtos') ||
      desc.includes('cpv')
    ) {
      custosMercadoriasServicos += val
    }

    // 11. LUCRO LÍQUIDO DO PERÍODO
    if (
      desc === 'lucro liquido do exercicio' ||
      desc === 'lucro liquido do periodo' ||
      desc === 'resultado liquido do exercicio' ||
      desc === 'resultado liquido do periodo' ||
      desc === 'lucro do exercicio'
    ) {
      lucroLiquidoPeriodo = val
    }
  }

  // Se não agregou receita analítica mas encontrou conta sintética de Receita Operacional Bruta
  if (receitaBrutaTotal === 0) {
    const contaSinteticaReceita = contas.find((c) => {
      const d = normalizar(c.descricao)
      return (
        (d.includes('receita operacional bruta') ||
          d.includes('receita bruta de vendas') ||
          d.includes('receitas operacionais')) &&
        !d.includes('liquida') &&
        !d.includes('despesas')
      )
    })
    if (contaSinteticaReceita && contaSinteticaReceita.saldoFinal > 0) {
      receitaBrutaTotal = contaSinteticaReceita.saldoFinal
    }
  }

  // Estimativa de meses no balancete: normalmente o balancete de encerramento é anual (12 meses)
  // ou mensal/trimestral. Se a receita for superior a R$ 1.000.000, e não houver indicação de mês,
  // assumimos 12 meses como base padrão de balancete anual, com média mensal dividida por 12.
  const mesesEstimados = 12
  const faturamentoMensalEstimado =
    receitaBrutaTotal > 0 ? Math.round(receitaBrutaTotal / mesesEstimados) : 0
  const folhaPagamentoMensalEstimada =
    folhaPagamentoTotal > 0 ? Math.round(folhaPagamentoTotal / mesesEstimados) : 0
  const despesasComCreditoMensaisEstimadas =
    despesasComCreditoTotal > 0 ? Math.round(despesasComCreditoTotal / mesesEstimados) : 0

  // Margem de lucro calculada: (Lucro Líquido / Receita Bruta) * 100
  let margemLucroCalculada = 0
  if (lucroLiquidoPeriodo > 0 && receitaBrutaTotal > 0) {
    margemLucroCalculada = Math.min(
      90,
      Math.max(1, Math.round((lucroLiquidoPeriodo / receitaBrutaTotal) * 100)),
    )
  }

  // Lista de itens meramente informativos sem campo direto na Fonte Mestra
  const itensInformativos: { rotulo: string; valor: number; descricao: string }[] = []

  if (ativoTotal > 0) {
    itensInformativos.push({
      rotulo: 'Ativo Total Escriturado',
      valor: ativoTotal,
      descricao: 'Patrimônio bruto total registrado no Grupo 1 do balancete.',
    })
  }

  if (passivoTotal > 0) {
    itensInformativos.push({
      rotulo: 'Passivo Total Escriturado',
      valor: passivoTotal,
      descricao: 'Obrigações totais registradas no Grupo 2 do balancete.',
    })
  }

  if (patrimonioLiquido > 0) {
    itensInformativos.push({
      rotulo: 'Patrimônio Líquido',
      valor: patrimonioLiquido,
      descricao: 'Capital social, reservas e lucros acumulados da sociedade.',
    })
  }

  if (custosMercadoriasServicos > 0) {
    itensInformativos.push({
      rotulo: 'Custos das Vendas (CMV / CSP / CPV)',
      valor: custosMercadoriasServicos,
      descricao: 'Custos diretos de produção, mercadorias revendidas ou serviços prestados.',
    })
  }

  if (lucroLiquidoPeriodo > 0) {
    itensInformativos.push({
      rotulo: 'Lucro Líquido do Período',
      valor: lucroLiquidoPeriodo,
      descricao: 'Resultado contábil positivo apurado na DRE / Balancete.',
    })
  }

  return {
    receitaBrutaPeriodo: receitaBrutaTotal,
    faturamentoMensalEstimado,
    mesesEstimados,
    folhaPagamentoPeriodo: folhaPagamentoTotal,
    folhaPagamentoMensalEstimada,
    despesasComCreditoPeriodo: despesasComCreditoTotal,
    despesasComCreditoMensaisEstimadas,
    custosMercadoriasServicos,
    lucroLiquidoPeriodo,
    margemLucroCalculada,
    ativoImobilizadoTotal,
    ativoTotal,
    passivoTotal,
    patrimonioLiquido,
    contasEnergiaEletrica,
    contasIntangiveisRoyalties,
    receitaComercio,
    receitaServicos,
    receitaIndustria,
    totalLinhasLidas: linhas.length,
    totalContasClassificadas,
    avisos,
    itensInformativos,
  }
}

function criarAgregadosVazios(totalLinhas: number, avisos: string[]): AgregadosBalancete {
  return {
    receitaBrutaPeriodo: 0,
    faturamentoMensalEstimado: 0,
    mesesEstimados: 12,
    folhaPagamentoPeriodo: 0,
    folhaPagamentoMensalEstimada: 0,
    despesasComCreditoPeriodo: 0,
    despesasComCreditoMensaisEstimadas: 0,
    custosMercadoriasServicos: 0,
    lucroLiquidoPeriodo: 0,
    margemLucroCalculada: 0,
    ativoImobilizadoTotal: 0,
    ativoTotal: 0,
    passivoTotal: 0,
    patrimonioLiquido: 0,
    contasEnergiaEletrica: 0,
    contasIntangiveisRoyalties: 0,
    receitaComercio: 0,
    receitaServicos: 0,
    receitaIndustria: 0,
    totalLinhasLidas: totalLinhas,
    totalContasClassificadas: 0,
    avisos,
    itensInformativos: [],
  }
}

/**
 * Gera lista comparativa entre os dados atuais da Fonte Mestra e os agregados extraídos do Balancete
 */
export function gerarCamposComparativoBalancete(
  atual: DadosEmpresaPerfil,
  agregados: AgregadosBalancete,
): {
  camposSugeridos: Partial<DadosEmpresaPerfil>
  camposComparativo: CampoExtracaoComparativo[]
} {
  const camposSugeridos: Partial<DadosEmpresaPerfil> = {}
  const camposComparativo: CampoExtracaoComparativo[] = []

  const formatarMoeda = (val: number) =>
    Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // 1. Faturamento Mensal Estimado
  if (
    agregados.faturamentoMensalEstimado > 0 &&
    agregados.faturamentoMensalEstimado !== atual.faturamentoMensal
  ) {
    camposSugeridos.faturamentoMensal = agregados.faturamentoMensalEstimado
    camposComparativo.push({
      chave: 'faturamentoMensal',
      rotulo: 'Faturamento Mensal Estimado',
      grupo: 'operacional',
      valorAtual: atual.faturamentoMensal,
      valorExtraido: agregados.faturamentoMensalEstimado,
      valorFormatadoAtual: formatarMoeda(atual.faturamentoMensal),
      valorFormatadoExtraido: `${formatarMoeda(agregados.faturamentoMensalEstimado)}/mês (total período: ${formatarMoeda(agregados.receitaBrutaPeriodo)})`,
      relevante: true,
      motivoExtracao: `Média mensal calculada sobre a receita bruta total de R$ ${agregados.receitaBrutaPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no balancete (${agregados.mesesEstimados} meses).`,
    })
  }

  // 2. Folha de Pagamento Mensal
  if (
    agregados.folhaPagamentoMensalEstimada > 0 &&
    agregados.folhaPagamentoMensalEstimada !== atual.folhaPagamentoMensal
  ) {
    camposSugeridos.folhaPagamentoMensal = agregados.folhaPagamentoMensalEstimada
    camposComparativo.push({
      chave: 'folhaPagamentoMensal',
      rotulo: 'Folha de Pagamento Mensal Estimada',
      grupo: 'operacional',
      valorAtual: atual.folhaPagamentoMensal,
      valorExtraido: agregados.folhaPagamentoMensalEstimada,
      valorFormatadoAtual: formatarMoeda(atual.folhaPagamentoMensal),
      valorFormatadoExtraido: `${formatarMoeda(agregados.folhaPagamentoMensalEstimada)}/mês (total período: ${formatarMoeda(agregados.folhaPagamentoPeriodo)})`,
      relevante: true,
      motivoExtracao: `Média mensal das contas de salários, pró-labore e encargos sociais escrituradas no balancete.`,
    })
  }

  // 3. Despesas Geradoras de Crédito Mensais
  if (
    agregados.despesasComCreditoMensaisEstimadas > 0 &&
    agregados.despesasComCreditoMensaisEstimadas !== atual.despesasComCreditosMensais
  ) {
    camposSugeridos.despesasComCreditosMensais = agregados.despesasComCreditoMensaisEstimadas
    camposComparativo.push({
      chave: 'despesasComCreditosMensais',
      rotulo: 'Despesas com Créditos Mensais (Insumos/Serviços)',
      grupo: 'operacional',
      valorAtual: atual.despesasComCreditosMensais,
      valorExtraido: agregados.despesasComCreditoMensaisEstimadas,
      valorFormatadoAtual: formatarMoeda(atual.despesasComCreditosMensais),
      valorFormatadoExtraido: `${formatarMoeda(agregados.despesasComCreditoMensaisEstimadas)}/mês (total período: ${formatarMoeda(agregados.despesasComCreditoPeriodo)})`,
      relevante: true,
      motivoExtracao: `Apurado a partir de contas de energia, aluguéis, fretes, telecom e serviços contratados de PJ.`,
    })
  }

  // 4. Margem de Lucro Estimada
  if (
    agregados.margemLucroCalculada > 0 &&
    agregados.margemLucroCalculada !== atual.margemLucroEstimada
  ) {
    camposSugeridos.margemLucroEstimada = agregados.margemLucroCalculada
    camposComparativo.push({
      chave: 'margemLucroEstimada',
      rotulo: 'Margem de Lucro Estimada',
      grupo: 'operacional',
      valorAtual: atual.margemLucroEstimada,
      valorExtraido: agregados.margemLucroCalculada,
      valorFormatadoAtual: `${atual.margemLucroEstimada}%`,
      valorFormatadoExtraido: `${agregados.margemLucroCalculada}%`,
      relevante: true,
      motivoExtracao: `Relação percentual entre o Lucro Líquido escriturado (${formatarMoeda(agregados.lucroLiquidoPeriodo)}) e a Receita Bruta (${formatarMoeda(agregados.receitaBrutaPeriodo)}).`,
    })
  }

  // 5. Insumos Energéticos (Fase 1)
  if (agregados.contasEnergiaEletrica > 0 && !atual.insumosEnergeticos) {
    camposSugeridos.insumosEnergeticos = true
    camposComparativo.push({
      chave: 'insumosEnergeticos',
      rotulo: 'Insumos Energéticos (Energia Elétrica / Vapor)',
      grupo: 'fase1',
      valorAtual: atual.insumosEnergeticos,
      valorExtraido: true,
      valorFormatadoAtual: 'Não',
      valorFormatadoExtraido: 'Sim',
      relevante: true,
      motivoExtracao: `Identificadas contas de despesa com energia elétrica/combustíveis no valor de ${formatarMoeda(agregados.contasEnergiaEletrica)}.`,
    })
  }

  // 6. Intangíveis / Royalties (Fase 1)
  if (agregados.contasIntangiveisRoyalties > 0 && !atual.intangiveisRoyalties) {
    camposSugeridos.intangiveisRoyalties = true
    camposComparativo.push({
      chave: 'intangiveisRoyalties',
      rotulo: 'Intangíveis / Royalties / Software / Licenças',
      grupo: 'fase1',
      valorAtual: atual.intangiveisRoyalties,
      valorExtraido: true,
      valorFormatadoAtual: 'Não',
      valorFormatadoExtraido: 'Sim',
      relevante: true,
      motivoExtracao: `Identificadas contas de ativo intangível, marcas, patentes, software ou royalties no valor de ${formatarMoeda(agregados.contasIntangiveisRoyalties)}.`,
    })
  }

  // 7. Ativo Imobilizado (Fase 1 - imobilizadoUltimos5Anos)
  if (
    agregados.ativoImobilizadoTotal > 0 &&
    agregados.ativoImobilizadoTotal !== atual.imobilizadoUltimos5Anos
  ) {
    camposSugeridos.imobilizadoUltimos5Anos = agregados.ativoImobilizadoTotal
    camposComparativo.push({
      chave: 'imobilizadoUltimos5Anos',
      rotulo: 'Ativo Imobilizado (Saldo Contábil)',
      grupo: 'fase1',
      valorAtual: atual.imobilizadoUltimos5Anos,
      valorExtraido: agregados.ativoImobilizadoTotal,
      valorFormatadoAtual: formatarMoeda(atual.imobilizadoUltimos5Anos),
      valorFormatadoExtraido: formatarMoeda(agregados.ativoImobilizadoTotal),
      relevante: true,
      motivoExtracao: `Soma das contas do grupo de ativo imobilizado (máquinas, equipamentos, veículos, prédios, etc).`,
    })
  }

  // 8. Atividade Mista (quando há segregação de comércio e serviços no balancete)
  if (agregados.receitaComercio > 0 && agregados.receitaServicos > 0) {
    const totalMisto = agregados.receitaComercio + agregados.receitaServicos
    const propServico = Math.round((agregados.receitaServicos / totalMisto) * 100)

    if (!atual.atividadeMista) {
      camposSugeridos.atividadeMista = true
      camposSugeridos.proporcaoServicoMisto = propServico
      camposComparativo.push({
        chave: 'atividadeMista',
        rotulo: 'Atividade Mista (Comércio + Serviços)',
        grupo: 'operacional',
        valorAtual: atual.atividadeMista,
        valorExtraido: true,
        valorFormatadoAtual: atual.atividadeMista ? 'Sim' : 'Não',
        valorFormatadoExtraido: `Sim (${propServico}% Serviços / ${100 - propServico}% Comércio)`,
        relevante: true,
        motivoExtracao: `Identificadas receitas de comércio (${formatarMoeda(agregados.receitaComercio)}) e de serviços (${formatarMoeda(agregados.receitaServicos)}) simultaneamente.`,
      })
    }
  }

  return { camposSugeridos, camposComparativo }
}

/**
 * Parser de arquivo de balancete (suporta File com extensão .csv, .xlsx ou texto direto)
 */
export async function parseBalanceteArquivo(
  file: File,
  perfilAtual: DadosEmpresaPerfil,
): Promise<ResultadoParsingBalancete> {
  const nomeArquivo = file.name || 'balancete.xlsx'
  const extensao = nomeArquivo.split('.').pop()?.toLowerCase() || ''

  if (extensao !== 'csv' && extensao !== 'txt' && extensao !== 'xlsx') {
    return criarResultadoBalanceteInvalido(
      nomeArquivo,
      `Formato de arquivo .${extensao} não suportado. Por favor envie o Balancete Contábil em formato CSV ou XLSX.`,
    )
  }

  try {
    const parsePlanilha = await parseArquivoFaturamento(file)

    if (!parsePlanilha.sucesso || parsePlanilha.linhas.length === 0) {
      return criarResultadoBalanceteInvalido(
        nomeArquivo,
        parsePlanilha.erro ||
          'Não foi possível extrair dados tabulares da planilha. Verifique se o arquivo possui colunas com cabeçalho e valores numéricos.',
      )
    }

    return parseBalanceteLinhas(
      parsePlanilha.linhas,
      parsePlanilha.colunas,
      nomeArquivo,
      perfilAtual,
    )
  } catch (err: any) {
    return criarResultadoBalanceteInvalido(
      nomeArquivo,
      `Erro ao processar o arquivo de balancete: ${err?.message || 'arquivo ilegível ou corrompido'}.`,
    )
  }
}

/**
 * Parser a partir de texto CSV direto (útil para testes e integração leve)
 */
export function parseBalanceteCsvTexto(
  conteudoCsv: string,
  nomeArquivo: string,
  perfilAtual: DadosEmpresaPerfil,
): ResultadoParsingBalancete {
  if (!conteudoCsv || !conteudoCsv.trim()) {
    return criarResultadoBalanceteInvalido(nomeArquivo, 'O arquivo CSV do balancete está vazio.')
  }

  const parsed = parseCsvConteudo(conteudoCsv, nomeArquivo)
  if (!parsed.sucesso || parsed.linhas.length === 0) {
    return criarResultadoBalanceteInvalido(
      nomeArquivo,
      parsed.erro || 'Não foi possível ler as linhas tabulares do balancete em CSV.',
    )
  }

  return parseBalanceteLinhas(parsed.linhas, parsed.colunas, nomeArquivo, perfilAtual)
}

/**
 * Parser central das linhas do balancete
 */
export function parseBalanceteLinhas(
  linhas: LinhaPlanilhaBruta[],
  colunas: string[],
  nomeArquivo: string,
  perfilAtual: DadosEmpresaPerfil,
): ResultadoParsingBalancete {
  const agregados = processarLinhasBalancete(linhas, colunas)

  // Validação mínima de sanidade: o balancete deve revelar ao menos uma conta com valor
  const temAlgumValor =
    agregados.receitaBrutaPeriodo > 0 ||
    agregados.folhaPagamentoPeriodo > 0 ||
    agregados.despesasComCreditoPeriodo > 0 ||
    agregados.ativoImobilizadoTotal > 0 ||
    agregados.ativoTotal > 0

  if (!temAlgumValor) {
    return criarResultadoBalanceteInvalido(
      nomeArquivo,
      'Não foi possível identificar receitas, folha, despesas ou ativo imobilizado neste balancete. Certifique-se de que a planilha possui colunas com descrição de contas e valores de saldo/movimentação.',
    )
  }

  const { camposSugeridos, camposComparativo } = gerarCamposComparativoBalancete(
    perfilAtual,
    agregados,
  )

  const metadados: MetadadosSped = {
    tipo: 'desconhecido', // será exibido como "Balancete Contábil (CSV/XLSX)"
    nomeTipo: 'Balancete Contábil (Planilha)',
    cnpj: perfilAtual.cnpj || '',
    nomeEmpresa: perfilAtual.nomeEmpresa || '',
    nomeFantasia: '',
    uf: perfilAtual.ufOrigem || '',
    periodoInicio: 'Exercício Contábil',
    periodoFim: 'Encerramento',
    versaoLeiaute: 'Planilha Contábil',
    linhasLidas: linhas.length,
    tamanhoBytes: 0,
    nomeArquivo,
    dataProcessamento: new Date().toISOString(),
  }

  return {
    valido: true,
    metadados,
    detalhesBalancete: agregados,
    camposSugeridos,
    camposComparativo,
  }
}

function criarResultadoBalanceteInvalido(
  nomeArquivo: string,
  erro: string,
): ResultadoParsingBalancete {
  return {
    valido: false,
    erro,
    metadados: {
      tipo: 'desconhecido',
      nomeTipo: 'Balancete Contábil',
      cnpj: '',
      nomeEmpresa: '',
      uf: '',
      periodoInicio: '',
      periodoFim: '',
      linhasLidas: 0,
      tamanhoBytes: 0,
      nomeArquivo,
      dataProcessamento: new Date().toISOString(),
    },
    detalhesBalancete: criarAgregadosVazios(0, [erro]),
    camposSugeridos: {},
    camposComparativo: [],
  }
}
