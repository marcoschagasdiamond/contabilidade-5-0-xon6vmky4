import { jsPDF } from 'jspdf'
import type {
  ParametrosSimulacaoCalculadora,
  ResultadosSimulacaoCalculadora,
} from '@/types/simulacaoCalculadora'

export interface GerarPdfSimulacaoOptions {
  nomeSimulacao: string
  parametros: ParametrosSimulacaoCalculadora
  resultados: ResultadosSimulacaoCalculadora
  empresa?: string
  cnpj?: string
  dataGeracao?: string
}

/**
 * Utilitário profissional para geração de relatório em PDF da Calculadora IBS/CBS
 * Identidade visual: Diamond Group
 * - Azul Escuro Primário (#07132B / rgb(7, 19, 43))
 * - Azul Escuro Secundário (#0B1E3F / rgb(11, 30, 63))
 * - Dourado (#D4AF37 / rgb(212, 175, 55))
 * - Verde (#2ECC71 / rgb(46, 204, 113))
 */
export function gerarRelatorioSimulacaoPDF(options: GerarPdfSimulacaoOptions): void {
  const { nomeSimulacao, parametros, resultados, empresa, cnpj, dataGeracao } = options

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 16
  const contentWidth = pageWidth - margin * 2

  let currentY = 0

  // Cores Diamond Group
  const COR_PRIMARIA = [7, 19, 43] as const // #07132B
  const COR_SECUNDARIA = [11, 30, 63] as const // #0B1E3F
  const COR_DOURADO = [212, 175, 55] as const // #D4AF37
  const COR_VERDE = [46, 204, 113] as const // #2ECC71
  const COR_TEXTO = [30, 41, 59] as const // slate-800
  const COR_MUTED = [100, 116, 139] as const // slate-500
  const COR_BG_LIGHT = [248, 250, 252] as const // slate-50
  const COR_BORDA = [226, 232, 240] as const // slate-200

  const formatarMoeda = (val: number): string => {
    return (
      'R$ ' +
      (val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    )
  }

  const verificarQuebraPagina = (espacoNecessario: number) => {
    if (currentY + espacoNecessario > pageHeight - 20) {
      doc.addPage()
      currentY = 20
      adicionarCabecalhoCompacto()
    }
  }

  const adicionarCabecalhoCompacto = () => {
    doc.setFillColor(COR_PRIMARIA[0], COR_PRIMARIA[1], COR_PRIMARIA[2])
    doc.rect(margin, 10, contentWidth, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
    doc.text('CONTABILIDADE 5.0 — SIMULADOR IBS / CBS (DIAMOND GROUP)', margin, 8)
  }

  // ==========================================
  // CABEÇALHO PRINCIPAL DIAMOND GROUP
  // ==========================================
  doc.setFillColor(COR_PRIMARIA[0], COR_PRIMARIA[1], COR_PRIMARIA[2])
  doc.rect(0, 0, pageWidth, 40, 'F')

  // Faixa dourada decorativa
  doc.setFillColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.rect(0, 40, pageWidth, 2.5, 'F')

  // Marca / Logo textual
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('CONTABILIDADE 5.0', margin, 17)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.text('DIAMOND GROUP • MOTOR TRIBUTÁRIO IBS / CBS (EC 132/2023 & LC 214/2025)', margin, 24)

  const dataString =
    dataGeracao ||
    new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(203, 213, 225)
  doc.text(
    `Simulação: "${nomeSimulacao}" | Gerado em: ${dataString} | Documento Estratégico`,
    margin,
    32,
  )

  currentY = 50

  // ==========================================
  // BLOCO 1: DADOS DA EMPRESA & IDENTIFICAÇÃO DO CENÁRIO
  // ==========================================
  doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(margin, currentY, contentWidth, 38, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(COR_SECUNDARIA[0], COR_SECUNDARIA[1], COR_SECUNDARIA[2])
  doc.text('IDENTIFICAÇÃO DA EMPRESA E PARÂMETROS OPERACIONAIS', margin + 4, currentY + 6)

  doc.setFontSize(8)
  doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])

  // Coluna 1
  const nomeEmpresaExibir = empresa || parametros.empresa || 'Empresa em Simulação'
  const cnpjExibir = cnpj || parametros.cnpj || 'Não informado'

  doc.setFont('helvetica', 'bold')
  doc.text('Empresa / Cliente:', margin + 4, currentY + 13)
  doc.setFont('helvetica', 'normal')
  doc.text(nomeEmpresaExibir, margin + 32, currentY + 13)

  doc.setFont('helvetica', 'bold')
  doc.text('CNPJ:', margin + 4, currentY + 18)
  doc.setFont('helvetica', 'normal')
  doc.text(cnpjExibir, margin + 32, currentY + 18)

  doc.setFont('helvetica', 'bold')
  doc.text('Faturamento:', margin + 4, currentY + 23)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `${formatarMoeda(parametros.faturamentoMensal)}/mês (${formatarMoeda(parametros.faturamentoMensal * 12)}/ano)`,
    margin + 32,
    currentY + 23,
  )

  doc.setFont('helvetica', 'bold')
  doc.text('Folha / Margem:', margin + 4, currentY + 28)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `${formatarMoeda(parametros.folhaPagamentoMensal)}/mês | Margem: ${parametros.margemLucroEstimada}%`,
    margin + 32,
    currentY + 28,
  )

  doc.setFont('helvetica', 'bold')
  doc.text('Compras / Insumos:', margin + 4, currentY + 33)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `${parametros.percentualComprasVendasComparativo}% das vendas (${formatarMoeda((parametros.faturamentoMensal * parametros.percentualComprasVendasComparativo) / 100)}/mês)`,
    margin + 32,
    currentY + 33,
  )

  // Coluna 2
  const col2X = margin + 98
  doc.setFont('helvetica', 'bold')
  doc.text('Ramo de Atividade:', col2X, currentY + 13)
  doc.setFont('helvetica', 'normal')
  const labelRamo =
    parametros.tipoAtividade === 'servico'
      ? 'Serviços'
      : parametros.tipoAtividade === 'comercio'
        ? 'Comércio'
        : parametros.tipoAtividade === 'industria'
          ? 'Indústria'
          : 'Misto'
  doc.text(labelRamo, col2X + 32, currentY + 13)

  doc.setFont('helvetica', 'bold')
  doc.text('UF de Origem:', col2X, currentY + 18)
  doc.setFont('helvetica', 'normal')
  doc.text(`${parametros.ufOrigem || 'SP'}`, col2X + 32, currentY + 18)

  doc.setFont('helvetica', 'bold')
  doc.text('Despesas c/ Crédito:', col2X, currentY + 23)
  doc.setFont('helvetica', 'normal')
  doc.text(`${formatarMoeda(parametros.despesasComCreditosMensais)}/mês`, col2X + 32, currentY + 23)

  doc.setFont('helvetica', 'bold')
  doc.text('Exportação:', col2X, currentY + 28)
  doc.setFont('helvetica', 'normal')
  doc.text(`${parametros.percentualExportacao || 0}% da receita`, col2X + 32, currentY + 28)

  doc.setFont('helvetica', 'bold')
  doc.text('Alíquotas IVA Dual:', col2X, currentY + 33)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `CBS ${parametros.config.cbsPadrao}% + IBS ${parametros.config.ibsPadrao}% = ${parametros.config.totalIvaDual}%`,
    col2X + 32,
    currentY + 33,
  )

  currentY += 44

  // ==========================================
  // BLOCO 2: RESUMO EXECUTIVO (MÓDULO 6 - DASHBOARD)
  // ==========================================
  doc.setFillColor(COR_PRIMARIA[0], COR_PRIMARIA[1], COR_PRIMARIA[2])
  doc.roundedRect(margin, currentY, contentWidth, 32, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.text('MÓDULO 6 • DASHBOARD EXECUTIVO & DIAGNÓSTICO', margin + 6, currentY + 7)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text(
    `Recomendado: ${resultados.resultadoDashboard.regimeRecomendado}`,
    margin + 6,
    currentY + 16,
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(226, 232, 240)
  doc.text(
    `Alíquota Efetiva Atual: ${resultados.resultadoDashboard.aliquotaEfetivaAtual.toFixed(2)}%  →  Nova Alíquota (IBS/CBS): ${resultados.resultadoDashboard.aliquotaEfetivaNova.toFixed(2)}%`,
    margin + 6,
    currentY + 23,
  )

  // Card de Economia Anual
  const ecoWidth = 56
  const ecoX = margin + contentWidth - ecoWidth - 6
  doc.setFillColor(COR_SECUNDARIA[0], COR_SECUNDARIA[1], COR_SECUNDARIA[2])
  doc.roundedRect(ecoX, currentY + 4, ecoWidth, 24, 2, 2, 'F')

  doc.setFontSize(6.5)
  doc.setTextColor(203, 213, 225)
  doc.text('ECONOMIA ANUAL PROJETADA', ecoX + 4, currentY + 9)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(COR_VERDE[0], COR_VERDE[1], COR_VERDE[2])
  doc.text(
    formatarMoeda(resultados.resultadoDashboard.economiaAnualProjetada),
    ecoX + 4,
    currentY + 16,
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.text(
    `Economia: ${formatarMoeda(resultados.resultadoDashboard.economiaMensalProjetada)}/mês`,
    ecoX + 4,
    currentY + 22,
  )

  currentY += 38

  // ==========================================
  // BLOCO 3: MÓDULO 3 - COMPARATIVO DE REGIMES
  // ==========================================
  verificarQuebraPagina(50)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(COR_PRIMARIA[0], COR_PRIMARIA[1], COR_PRIMARIA[2])
  doc.text('MÓDULO 3 • COMPARATIVO DE REGIMES TRIBUTÁRIOS', margin, currentY + 4)

  currentY += 7

  // Cabeçalho da Tabela
  doc.setFillColor(COR_SECUNDARIA[0], COR_SECUNDARIA[1], COR_SECUNDARIA[2])
  doc.rect(margin, currentY, contentWidth, 7, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.text('Regime Fiscal', margin + 3, currentY + 4.8)
  doc.text('Impostos Brutos', margin + 45, currentY + 4.8)
  doc.text('Créditos Apropriados', margin + 85, currentY + 4.8)
  doc.text('Carga Efetiva Mensal', margin + 125, currentY + 4.8)
  doc.text('Alíq. Efetiva', margin + 162, currentY + 4.8)

  currentY += 7

  const regimes = [
    {
      nome: 'Simples Nacional',
      dados: resultados.resultadoComparativo.simplesNacional,
      isRecomendado: resultados.resultadoDashboard.regimeRecomendado === 'Simples Nacional',
    },
    {
      nome: 'Lucro Presumido',
      dados: resultados.resultadoComparativo.lucroPresumido,
      isRecomendado: resultados.resultadoDashboard.regimeRecomendado === 'Lucro Presumido',
    },
    {
      nome: 'Lucro Real',
      dados: resultados.resultadoComparativo.lucroReal,
      isRecomendado: resultados.resultadoDashboard.regimeRecomendado === 'Lucro Real',
    },
    {
      nome: 'IBS / CBS (Reforma)',
      dados: resultados.resultadoComparativo.ibsCbs,
      isRecomendado:
        resultados.resultadoDashboard.regimeRecomendado === 'IBS/CBS' ||
        resultados.resultadoDashboard.regimeRecomendado === 'IBS / CBS',
    },
  ]

  regimes.forEach((reg, idx) => {
    doc.setFillColor(
      reg.isRecomendado ? 236 : idx % 2 === 0 ? 255 : 248,
      reg.isRecomendado ? 253 : idx % 2 === 0 ? 255 : 250,
      reg.isRecomendado ? 245 : idx % 2 === 0 ? 255 : 252,
    )
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.rect(margin, currentY, contentWidth, 7.5, 'FD')

    doc.setFont('helvetica', reg.isRecomendado ? 'bold' : 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(
      reg.isRecomendado ? COR_SECUNDARIA[0] : COR_TEXTO[0],
      reg.isRecomendado ? COR_SECUNDARIA[1] : COR_TEXTO[1],
      reg.isRecomendado ? COR_SECUNDARIA[2] : COR_TEXTO[2],
    )

    doc.text(`${reg.nome}${reg.isRecomendado ? ' (Recomendado)' : ''}`, margin + 3, currentY + 5)
    doc.text(formatarMoeda(reg.dados.totalNominal), margin + 45, currentY + 5)
    doc.text(formatarMoeda(reg.dados.creditos), margin + 85, currentY + 5)

    doc.setFont('helvetica', 'bold')
    doc.text(formatarMoeda(reg.dados.totalEfetivo), margin + 125, currentY + 5)
    doc.text(`${reg.dados.aliquotaEfetiva.toFixed(2)}%`, margin + 162, currentY + 5)

    currentY += 7.5
  })

  currentY += 6

  // ==========================================
  // BLOCO 4: MÓDULO 2 (CALCULADORA SIMPLES) & MÓDULO 4 (CRÉDITOS)
  // ==========================================
  verificarQuebraPagina(40)

  const halfWidth = (contentWidth - 6) / 2

  // Box Módulo 2
  doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(margin, currentY, halfWidth, 34, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(COR_SECUNDARIA[0], COR_SECUNDARIA[1], COR_SECUNDARIA[2])
  doc.text('MÓDULO 2 • OPERAÇÃO UNITÁRIA', margin + 4, currentY + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
  doc.text(
    `Valor da Operação: ${formatarMoeda(parametros.valorOperacao)}`,
    margin + 4,
    currentY + 12,
  )
  doc.text(
    `Alíquota Total Aplicada: ${resultados.resultadoSimples.aliquotaTotalAplicada.toFixed(2)}%`,
    margin + 4,
    currentY + 17,
  )
  doc.text(
    `Débito CBS (${resultados.resultadoSimples.aliquotaCbsAplicada}%): ${formatarMoeda(resultados.resultadoSimples.debitoCbs)}`,
    margin + 4,
    currentY + 22,
  )
  doc.text(
    `Débito IBS (${resultados.resultadoSimples.aliquotaIbsAplicada}%): ${formatarMoeda(resultados.resultadoSimples.debitoIbs)}`,
    margin + 4,
    currentY + 27,
  )
  doc.setFont('helvetica', 'bold')
  doc.text(
    `Valor Líquido a Recolher: ${formatarMoeda(resultados.resultadoSimples.valorARecolher)}`,
    margin + 4,
    currentY + 32,
  )

  // Box Módulo 4
  const box4X = margin + halfWidth + 6
  doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
  doc.roundedRect(box4X, currentY, halfWidth, 34, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(COR_SECUNDARIA[0], COR_SECUNDARIA[1], COR_SECUNDARIA[2])
  doc.text('MÓDULO 4 • SIMULADOR DE CRÉDITOS', box4X + 4, currentY + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
  doc.text(
    `Créditos Regime Antigo (PIS/COFINS): ${formatarMoeda(resultados.resultadoCreditos.totalAntigo)}/mês`,
    box4X + 4,
    currentY + 12,
  )
  doc.text(
    `Créditos Novo IVA Dual (26,5%): ${formatarMoeda(resultados.resultadoCreditos.totalNovo)}/mês`,
    box4X + 4,
    currentY + 17,
  )
  doc.text(
    `Ganho Mensal em Créditos: +${formatarMoeda(resultados.resultadoCreditos.adicionalGanho)}/mês`,
    box4X + 4,
    currentY + 22,
  )
  doc.text(
    `Aumento Percentual: +${resultados.resultadoCreditos.aumentoPercentual.toFixed(1)}% de aproveitamento`,
    box4X + 4,
    currentY + 27,
  )
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COR_VERDE[0], COR_VERDE[1], COR_VERDE[2])
  doc.text(
    `Economia Anual em Créditos: ${formatarMoeda(resultados.resultadoCreditos.economiaAnual)}`,
    box4X + 4,
    currentY + 32,
  )

  currentY += 40

  // ==========================================
  // BLOCO NOVO: SPLIT PAYMENT & CRÉDITO DE ESTOQUE
  // ==========================================
  if (resultados.resultadoSplitPayment || resultados.resultadoEstoque) {
    verificarQuebraPagina(38)

    // Caixa Split Payment
    if (resultados.resultadoSplitPayment) {
      doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
      doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
      doc.roundedRect(margin, currentY, halfWidth, 32, 2, 2, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(COR_SECUNDARIA[0], COR_SECUNDARIA[1], COR_SECUNDARIA[2])
      doc.text('SPLIT PAYMENT • FLUXO DE CAIXA', margin + 4, currentY + 5.5)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
      doc.text(
        `Retenção na Nota (IBS/CBS): ${formatarMoeda(resultados.resultadoSplitPayment.retencaoMensalNota)}/mês`,
        margin + 4,
        currentY + 11.5,
      )
      doc.text(
        `Recolhimento Antigo (Dia 20): ${formatarMoeda(resultados.resultadoSplitPayment.recolhimentoAtualMensal)}/mês`,
        margin + 4,
        currentY + 16.5,
      )
      doc.text(
        `Taxa de Capital de Giro: ${resultados.resultadoSplitPayment.taxaMensalCapital.toFixed(2)}% a.m. (~${resultados.resultadoSplitPayment.diasAntecipacao} dias)`,
        margin + 4,
        currentY + 21.5,
      )
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(185, 28, 28)
      doc.text(
        `Custo da Antecipação: ${formatarMoeda(resultados.resultadoSplitPayment.custoCapitalAnual)}/ano`,
        margin + 4,
        currentY + 27,
      )
    }

    // Caixa Crédito de Estoque
    if (resultados.resultadoEstoque) {
      doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
      doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
      doc.roundedRect(box4X, currentY, halfWidth, 32, 2, 2, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(COR_SECUNDARIA[0], COR_SECUNDARIA[1], COR_SECUNDARIA[2])
      doc.text('CRÉDITO PRESUMIDO DE ESTOQUE', box4X + 4, currentY + 5.5)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
      doc.text(
        `Estoque na Virada: ${formatarMoeda(resultados.resultadoEstoque.valorEstoqueVirada)}`,
        box4X + 4,
        currentY + 11.5,
      )
      doc.text(
        `Alíquota de Crédito Presumido: ${resultados.resultadoEstoque.aliquotaCreditoPresumido.toFixed(2)}% (CBS)`,
        box4X + 4,
        currentY + 16.5,
      )
      doc.text('Aproveitamento no 1º Ano da Transição (2027)', box4X + 4, currentY + 21.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(COR_VERDE[0], COR_VERDE[1], COR_VERDE[2])
      doc.text(
        `Abatimento de Estoque: -${formatarMoeda(resultados.resultadoEstoque.economiaAno1)}`,
        box4X + 4,
        currentY + 27,
      )
    }

    currentY += 38
  }

  // ==========================================
  // BLOCO 5: MÓDULO 5 - CRONOGRAMA DE TRANSIÇÃO (2026-2033)
  // ==========================================
  verificarQuebraPagina(55)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(COR_PRIMARIA[0], COR_PRIMARIA[1], COR_PRIMARIA[2])
  doc.text('MÓDULO 5 • CRONOGRAMA DA TRANSIÇÃO TRIBUTÁRIA (2026–2033)', margin, currentY + 3)

  currentY += 6

  doc.setFillColor(COR_PRIMARIA[0], COR_PRIMARIA[1], COR_PRIMARIA[2])
  doc.rect(margin, currentY, contentWidth, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('Ano', margin + 3, currentY + 4.2)
  doc.text('Fase Constitucional da Reforma', margin + 18, currentY + 4.2)
  doc.text('CBS', margin + 98, currentY + 4.2)
  doc.text('IBS', margin + 115, currentY + 4.2)
  doc.text('Alíq. Efetiva', margin + 132, currentY + 4.2)
  doc.text('Imposto Projetado', margin + 155, currentY + 4.2)

  currentY += 6

  resultados.resultadoTransicao.forEach((item, idx) => {
    const isDestaque = item.ano === 2026 || item.ano === 2027 || item.ano === 2033
    doc.setFillColor(
      isDestaque ? 236 : idx % 2 === 0 ? 255 : 248,
      isDestaque ? 253 : idx % 2 === 0 ? 255 : 250,
      isDestaque ? 245 : idx % 2 === 0 ? 255 : 252,
    )
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.rect(margin, currentY, contentWidth, 5.5, 'FD')

    doc.setFont('helvetica', isDestaque ? 'bold' : 'normal')
    doc.setFontSize(7)
    doc.setTextColor(
      isDestaque ? COR_SECUNDARIA[0] : COR_TEXTO[0],
      isDestaque ? COR_SECUNDARIA[1] : COR_TEXTO[1],
      isDestaque ? COR_SECUNDARIA[2] : COR_TEXTO[2],
    )

    doc.text(`${item.ano}`, margin + 3, currentY + 3.8)
    doc.text(item.fase, margin + 18, currentY + 3.8)
    doc.text(`${item.aliquotaCbs.toFixed(1)}%`, margin + 98, currentY + 3.8)
    doc.text(`${item.aliquotaIbs.toFixed(2)}%`, margin + 115, currentY + 3.8)
    doc.text(`${item.aliquotaEfetivaTotal.toFixed(2)}%`, margin + 132, currentY + 3.8)
    doc.text(formatarMoeda(item.impostoEstimado), margin + 155, currentY + 3.8)

    currentY += 5.5
  })

  currentY += 8

  // ==========================================
  // BLOCO 6: MÓDULO 1 - ALÍQUOTAS E CONFIGURAÇÕES
  // ==========================================
  verificarQuebraPagina(30)

  doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(margin, currentY, contentWidth, 18, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(COR_SECUNDARIA[0], COR_SECUNDARIA[1], COR_SECUNDARIA[2])
  doc.text('MÓDULO 1 • PARÂMETROS GERAIS DO IVA DUAL UTILIZADOS', margin + 3, currentY + 4.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
  doc.text(
    `CBS Padrão: ${parametros.config.cbsPadrao}% | IBS Padrão: ${parametros.config.ibsPadrao}% | Total IVA Dual: ${parametros.config.totalIvaDual}% | Lucro Real PIS: ${parametros.config.lucroRealPis}% / COFINS: ${parametros.config.lucroRealCofins}% / ICMS: ${parametros.config.lucroRealIcms}% / ISS: ${parametros.config.lucroRealIss}% | Lucro Presumido PIS: ${parametros.config.lucroPresumidoPis}% / COFINS: ${parametros.config.lucroPresumidoCofins}% / ISS: ${parametros.config.lucroPresumidoIss}%`,
    margin + 3,
    currentY + 9,
  )
  doc.text(
    `Regimes Diferenciados: Saúde/Educação (${parametros.config.saudeEducacaoAliquota}% — redução de 60%) | Transporte de Passageiros (${parametros.config.transporteAliquota}% — redução de 30%) | Cesta Básica Nacional (${parametros.config.cestaBasicaIsencao}% — Alíquota Zero)`,
    margin + 3,
    currentY + 13.5,
  )

  currentY += 22

  // ==========================================
  // BLOCO 7: AVISO LEGAL INSTITUCIONAL
  // ==========================================
  verificarQuebraPagina(24)

  doc.setFillColor(254, 242, 242)
  doc.setDrawColor(254, 202, 202)
  doc.roundedRect(margin, currentY, contentWidth, 18, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(185, 28, 28)
  doc.text('AVISO LEGAL & LIMITAÇÕES TÉCNICAS DA SIMULAÇÃO', margin + 3, currentY + 4.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.2)
  doc.setTextColor(127, 29, 29)
  const aviso = doc.splitTextToSize(
    'Este relatório consolida estimativas fiscais baseadas nas normas constitucionais da Reforma Tributária (EC 132/2023 e LC 214/2025). As alíquotas oficiais de referência e regras de não-cumulatividade plena dependerão de atos regulamentares do Senado Federal e do Comitê Gestor do IBS (CGIBS). Não substitui planejamento contábil formal ou parecer emitido por profissional habilitado.',
    contentWidth - 6,
  )
  doc.text(aviso, margin + 3, currentY + 8.5)

  // ==========================================
  // RODAPÉ EM TODAS AS PÁGINAS (DIAMOND GROUP)
  // ==========================================
  const totalPages = doc.internal.pages.length - 1
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.8)
    doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
    doc.text(
      'Contabilidade 5.0 — Diamond Group | Inteligência Fiscal, Consultoria & BPO | contato@contabilidade50.com.br',
      margin,
      pageHeight - 8,
    )
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 8)
  }

  // Nome do arquivo formatado
  const nomeSanitizado = (nomeSimulacao || 'simulacao')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
  const nomeArquivo = `simulacao-ibs-cbs-${nomeSanitizado}.pdf`
  doc.save(nomeArquivo)
}
