import { jsPDF } from 'jspdf'
import type {
  ParametrosRecuperador,
  ResultadosRecuperador,
  ResultadoTese,
} from '@/types/recuperadorCreditos'
import { desenharAvisoLegalCompletoPDF } from '@/components/common/AvisoOrientativo'
import type { ResponsavelTecnicoDados } from '@/components/calculadora/ModalGerarPdf'
import {
  desenharLogoContabilidade50,
  adicionarBlocoResponsavelTecnico,
  adicionarBlocoAssinatura,
} from '@/lib/pdfSimulacaoCalculadora'
import { renderizarRodapeEscritorioPdf } from '@/lib/pdfIdentidadeEscritorio'

// Identidade visual Diamond Group (Navy / Dourado)
export const COR_NAVY = [7, 19, 43] as const // #07132B
export const COR_NAVY_LIGHT = [15, 34, 64] as const // #0F2240
export const COR_DOURADO = [212, 175, 55] as const // #D4AF37
export const COR_TEXTO = [30, 41, 59] as const // slate-800
export const COR_MUTED = [100, 116, 139] as const // slate-500
export const COR_BG_LIGHT = [248, 250, 252] as const // slate-50
export const COR_BORDA = [226, 232, 240] as const // slate-200
export const COR_EMERALD = [16, 185, 129] as const // emerald-500
export const COR_AMBER = [217, 119, 6] as const // amber-600
export const COR_ROSE = [225, 29, 72] as const // rose-600

// Aliases para retrocompatibilidade
export const COR_VERDE_ESCURO = COR_NAVY
export const COR_VERDE_MEDIO = COR_NAVY_LIGHT

const formatarMoeda = (val: number): string => {
  return (
    'R$ ' +
    (val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  )
}

export interface GerarPdfRecuperadorOptions {
  nomeAnalise: string
  parametros: ParametrosRecuperador
  resultados: ResultadosRecuperador
  clienteNome?: string
  empresa?: string
  cnpj?: string
  dataGeracao?: string
  responsavelTecnico?: ResponsavelTecnicoDados
  observacoesAnalista?: string
}

export function gerarParecerRecuperadorPDF(options: GerarPdfRecuperadorOptions): void {
  const {
    nomeAnalise,
    parametros,
    resultados,
    clienteNome,
    empresa,
    cnpj,
    dataGeracao,
    responsavelTecnico,
    observacoesAnalista,
  } = options

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

  const adicionarCabecalhoCompacto = (
    tituloSecao = 'RECUPERADOR DE CRÉDITOS TRIBUTÁRIOS & PREVIDENCIÁRIOS',
  ) => {
    doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
    doc.rect(margin, 10, contentWidth, 2.5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
    doc.text(`CONTABILIDADE 5.0 — DIAMOND GROUP • ${tituloSecao}`, margin, 8)
  }

  const verificarQuebraPagina = (espacoNecessario: number, tituloSecao?: string) => {
    if (currentY + espacoNecessario > pageHeight - 20) {
      doc.addPage()
      currentY = 18
      adicionarCabecalhoCompacto(tituloSecao)
    }
  }

  // =========================================================================
  // PÁGINA 1: CABEÇALHO COM LOGO DIAMOND GROUP (NAVY / DOURADO)
  // =========================================================================
  doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.rect(0, 0, pageWidth, 42, 'F')

  // Faixa dourada decorativa
  doc.setFillColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.rect(0, 42, pageWidth, 2.5, 'F')

  // Logotipo desenhado em vetor (hexágono Diamond + seta ascendente)
  desenharLogoContabilidade50(doc, margin, 11, 19, true)

  const brandX = margin + 24
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.text('CONTABILIDADE 5.0', brandX, 19)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.text('DIAMOND GROUP • RELATÓRIO EXECUTIVO DE RECUPERAÇÃO DE CRÉDITOS TRIBUTÁRIOS', brandX, 26)

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
  doc.setFontSize(7.5)
  doc.setTextColor(203, 213, 225)
  const infoCliente = clienteNome ? `Cliente: ${clienteNome} | ` : ''
  const segmentoLabel = parametros.configuracoes.segmento
    ? `Setor: ${parametros.configuracoes.segmento} | `
    : ''
  doc.text(
    `${infoCliente}${segmentoLabel}Análise: "${nomeAnalise}" | Emissão: ${dataString} | Escopo: 60 Meses`,
    brandX,
    33,
  )

  currentY = 51

  // =========================================================================
  // BLOCO: RESPONSÁVEL TÉCNICO (SE INFORMADO)
  // =========================================================================
  currentY = adicionarBlocoResponsavelTecnico(
    doc,
    margin,
    currentY,
    contentWidth,
    responsavelTecnico,
  )

  // =========================================================================
  // BLOCO 1: IDENTIFICAÇÃO DA EMPRESA E DADOS OPERACIONAIS
  // =========================================================================
  const nomeEmpresaExibir =
    clienteNome || empresa || parametros.configuracoes.empresa || 'Empresa em Análise'
  const cnpjExibir = cnpj || parametros.configuracoes.cnpj || 'Não informado'
  const regimeExibir = parametros.configuracoes.regimeAtual || 'Lucro Presumido'

  doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(margin, currentY, contentWidth, 38, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.text('DADOS GERAIS DA EMPRESA & PARÂMETROS OPERACIONAIS (60 MESES)', margin + 4, currentY + 6)

  // Badge Dourado Regime
  doc.setFillColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.roundedRect(margin + contentWidth - 54, currentY + 2.5, 50, 5, 1, 1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.text(`REGIME: ${regimeExibir.toUpperCase()}`, margin + contentWidth - 29, currentY + 6, {
    align: 'center',
  })

  doc.setFontSize(7.5)
  doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])

  // Coluna 1
  doc.setFont('helvetica', 'bold')
  doc.text('Cliente / Empresa:', margin + 4, currentY + 13)
  doc.setFont('helvetica', 'normal')
  doc.text(nomeEmpresaExibir, margin + 35, currentY + 13)

  doc.setFont('helvetica', 'bold')
  doc.text('CNPJ:', margin + 4, currentY + 19)
  doc.setFont('helvetica', 'normal')
  doc.text(cnpjExibir, margin + 35, currentY + 19)

  doc.setFont('helvetica', 'bold')
  doc.text('Segmento / UF:', margin + 4, currentY + 25)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `${parametros.configuracoes.segmento || 'Comércio'} • UF: ${parametros.configuracoes.uf || 'SP'}`,
    margin + 35,
    currentY + 25,
  )

  doc.setFont('helvetica', 'bold')
  doc.text('Alíquota Patronal:', margin + 4, currentY + 31)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `~${parametros.configuracoes.aliquotaPatronalComposta || 26.8}% composta (INSS + Terceiros + RAT)`,
    margin + 35,
    currentY + 31,
  )

  // Coluna 2
  const col2X = margin + 104
  doc.setFont('helvetica', 'bold')
  doc.text('Nº Médio de Empregados:', col2X, currentY + 13)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `${parametros.configuracoes.numeroMedioEmpregados} colaboradores`,
    col2X + 42,
    currentY + 13,
  )

  doc.setFont('helvetica', 'bold')
  doc.text('Rotatividade Anual:', col2X, currentY + 19)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `${parametros.configuracoes.percentualRotatividadeAnual}% a.a.`,
    col2X + 42,
    currentY + 19,
  )

  doc.setFont('helvetica', 'bold')
  doc.text('Massa Salarial Mensal:', col2X, currentY + 25)
  doc.setFont('helvetica', 'normal')
  doc.text(formatarMoeda(parametros.configuracoes.massaSalarialMensal), col2X + 42, currentY + 25)

  doc.setFont('helvetica', 'bold')
  doc.text('Correção Monetária:', col2X, currentY + 31)
  doc.setFont('helvetica', 'normal')
  doc.text('SELIC acumulada por competência (60m)', col2X + 42, currentY + 31)

  currentY += 44

  // =========================================================================
  // REQUISITO (A): RESUMO EXECUTIVO NO TOPO
  // Total recuperável, períodos e crédito de estoque na transição para CBS/IBS
  // =========================================================================
  const anosAuditados = parametros.configuracoes.anosFaturamento || []
  const listaAnos = anosAuditados.map((a) => a.ano).sort((a, b) => a - b)
  const periodoTexto =
    listaAnos.length > 0
      ? `${listaAnos[0]} a ${listaAnos[listaAnos.length - 1]} (${listaAnos.length} anos / 60 competências)`
      : 'Últimos 60 Meses (5 Anos)'

  // Faturamento médio anual e estoque estimado na virada (LC 214/2025)
  const fatTotal60m = anosAuditados.reduce((acc, a) => acc + (a.faturamento || 0), 0)
  const fatMedioAnual = anosAuditados.length > 0 ? fatTotal60m / anosAuditados.length : 0
  const fatMedioMensal =
    parametros.configuracoes.faturamentoMensal && parametros.configuracoes.faturamentoMensal > 0
      ? parametros.configuracoes.faturamentoMensal
      : fatMedioAnual / 12
  const pctCompras = parametros.configuracoes.percentualComprasVendas || 40
  // Estimativa de estoque físico na virada: ~1,5 meses de compras (conforme metodologia da Calculadora)
  const comprasMensaisEstimadas = (fatMedioMensal * pctCompras) / 100
  const estoqueEstimadoVirada = comprasMensaisEstimadas * 1.5
  // Alíquota de crédito presumido de estoque na entrada da CBS (LC 214/2025): 8,80%
  const creditoEstoqueEstimado = (estoqueEstimadoVirada * 8.8) / 100

  doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.roundedRect(margin, currentY, contentWidth, 42, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.text(
    'RESUMO EXECUTIVO • TOTAL RECUPERÁVEL, PERÍODOS & CRÉDITO DE ESTOQUE',
    margin + 6,
    currentY + 7,
  )

  // Card Integral (Lado Esquerdo)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(203, 213, 225)
  doc.text('Cenário Integral (Todas as teses elegíveis + SELIC):', margin + 6, currentY + 14)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text(formatarMoeda(resultados.totalIntegralCorrigido), margin + 6, currentY + 21)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.text(
    `Original: ${formatarMoeda(resultados.totalIntegralOriginal)}  |  SELIC: +${formatarMoeda(resultados.totalIntegralSelic)}`,
    margin + 6,
    currentY + 27,
  )

  doc.setFontSize(6.5)
  doc.setTextColor(203, 213, 225)
  doc.text(`Período Auditado: ${periodoTexto}`, margin + 6, currentY + 33)

  doc.text(
    `Farol Verde: ${formatarMoeda(resultados.totalVerdeCorrigido)} | Amarelo: ${formatarMoeda(resultados.totalAmareloCorrigido)} | Vermelho: ${formatarMoeda(resultados.totalVermelhoCorrigido)}`,
    margin + 6,
    currentY + 38,
  )

  // Card Conservador + Crédito Estoque (Lado Direito)
  const cardExecDireitoWidth = 64
  const cardExecDireitoX = margin + contentWidth - cardExecDireitoWidth - 6

  // Subcard 1: Conservador
  doc.setFillColor(COR_NAVY_LIGHT[0], COR_NAVY_LIGHT[1], COR_NAVY_LIGHT[2])
  doc.roundedRect(cardExecDireitoX, currentY + 4, cardExecDireitoWidth, 16, 1.5, 1.5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(COR_EMERALD[0], COR_EMERALD[1], COR_EMERALD[2])
  doc.text('CENÁRIO CONSERVADOR (FAROL VERDE)', cardExecDireitoX + 3, currentY + 8.5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.text(formatarMoeda(resultados.totalConservadorCorrigido), cardExecDireitoX + 3, currentY + 15)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.8)
  doc.setTextColor(203, 213, 225)
  doc.text(
    'Apenas teses pacificadas STF/STJ',
    cardExecDireitoX + cardExecDireitoWidth - 3,
    currentY + 15,
    {
      align: 'right',
    },
  )

  // Subcard 2: Crédito de Estoque na Transição (LC 214/2025)
  doc.setFillColor(COR_NAVY_LIGHT[0], COR_NAVY_LIGHT[1], COR_NAVY_LIGHT[2])
  doc.roundedRect(cardExecDireitoX, currentY + 22, cardExecDireitoWidth, 16, 1.5, 1.5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.text('CRÉDITO ESTOQUE VIRADA 2026/27 (LC 214)', cardExecDireitoX + 3, currentY + 26.5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.text(formatarMoeda(creditoEstoqueEstimado), cardExecDireitoX + 3, currentY + 33)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.8)
  doc.setTextColor(203, 213, 225)
  doc.text(
    'Abatimento CBS 8,80% em 2027',
    cardExecDireitoX + cardExecDireitoWidth - 3,
    currentY + 33,
    {
      align: 'right',
    },
  )

  currentY += 48

  // =========================================================================
  // QUADRO DE DISTRIBUIÇÃO DOS CRÉDITOS APURADOS POR BLOCO
  // =========================================================================
  doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.text('DISTRIBUIÇÃO DOS CRÉDITOS APURADOS POR BLOCO DE TRIBUTO', margin + 4, currentY + 6)

  doc.setFontSize(7)
  doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
  doc.setFont('helvetica', 'bold')
  doc.text('Por Tributo:', margin + 4, currentY + 12)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `PIS/COFINS: ${formatarMoeda(resultados.totalPisCofinsCorrigido)}   |   Folha/INSS: ${formatarMoeda(resultados.totalFolhaCorrigido)}   |   IRPJ/CSLL: ${formatarMoeda(resultados.totalIrpjCsllCorrigido || 0)}   |   ICMS/ISS/Outros: ${formatarMoeda(resultados.totalOutrosTributosCorrigido || 0)}`,
    margin + 26,
    currentY + 12,
  )

  doc.setFont('helvetica', 'bold')
  doc.text('Por Farol:', margin + 4, currentY + 17.5)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Verde (Baixo Risco): ${formatarMoeda(resultados.totalVerdeCorrigido)}   |   Amarelo (Risco Moderado): ${formatarMoeda(resultados.totalAmareloCorrigido)}   |   Vermelho (Alto Risco): ${formatarMoeda(resultados.totalVermelhoCorrigido)}`,
    margin + 26,
    currentY + 17.5,
  )

  currentY += 28

  // =========================================================================
  // REQUISITO (B) & (C): DETALHAMENTO POR TIPO DE CRÉDITO E BASE LEGAL CITADA
  // =========================================================================
  const renderizarTabelaBloco = (
    tituloBloco: string,
    subtituloBloco: string,
    tesesBloco: ResultadoTese[],
  ) => {
    if (tesesBloco.length === 0) return

    verificarQuebraPagina(45, tituloBloco)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
    doc.text(tituloBloco, margin, currentY)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.8)
    doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
    doc.text(subtituloBloco, margin, currentY + 4)

    currentY += 6.5

    // Cabeçalho da Tabela
    doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
    doc.rect(margin, currentY, contentWidth, 6, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.text('Tese Tributária / Previdenciária & Base Legal Citada', margin + 3, currentY + 4.2)
    doc.text('Farol', margin + 104, currentY + 4.2)
    doc.text('Original (60m)', margin + 120, currentY + 4.2)
    doc.text('SELIC', margin + 144, currentY + 4.2)
    doc.text('Total Corrigido', margin + 162, currentY + 4.2)

    currentY += 6

    tesesBloco.forEach((t, idx) => {
      // Cada linha possui 2 níveis: Linha 1 = Título da Tese, Linha 2 = Base Legal Citada (Requisito c)
      verificarQuebraPagina(10, tituloBloco)

      doc.setFillColor(
        idx % 2 === 0 ? 255 : 248,
        idx % 2 === 0 ? 255 : 250,
        idx % 2 === 0 ? 255 : 252,
      )
      doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
      doc.rect(margin, currentY, contentWidth, 9.5, 'FD')

      // Título da Tese
      doc.setFont('helvetica', t.ativa ? 'bold' : 'normal')
      doc.setFontSize(6.8)
      doc.setTextColor(
        t.ativa ? COR_TEXTO[0] : COR_MUTED[0],
        t.ativa ? COR_TEXTO[1] : COR_MUTED[1],
        t.ativa ? COR_TEXTO[2] : COR_MUTED[2],
      )
      const titTrunc = t.titulo.length > 56 ? t.titulo.slice(0, 54) + '...' : t.titulo
      doc.text(titTrunc, margin + 3, currentY + 4)

      // Base Legal Citada (Requisito c)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(5.8)
      doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
      const fundamentoTexto = t.fundamento
        ? `Base Legal: ${t.fundamento}`
        : 'Base Legal: Legislação Tributária Vigente'
      const fundTrunc =
        fundamentoTexto.length > 68 ? fundamentoTexto.slice(0, 66) + '...' : fundamentoTexto
      doc.text(fundTrunc, margin + 3, currentY + 7.8)

      // Farol de Risco
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      if (t.farol === 'verde') {
        doc.setTextColor(COR_EMERALD[0], COR_EMERALD[1], COR_EMERALD[2])
        doc.text('VERDE', margin + 104, currentY + 5)
      } else if (t.farol === 'amarelo') {
        doc.setTextColor(COR_AMBER[0], COR_AMBER[1], COR_AMBER[2])
        doc.text('AMARELO', margin + 104, currentY + 5)
      } else {
        doc.setTextColor(COR_ROSE[0], COR_ROSE[1], COR_ROSE[2])
        doc.text('VERMELHO', margin + 104, currentY + 5)
      }

      // Valores
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
      doc.text(formatarMoeda(t.valorOriginalTotal), margin + 120, currentY + 5)
      doc.text(`+${formatarMoeda(t.correcaoSelicTotal)}`, margin + 144, currentY + 5)

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
      doc.text(formatarMoeda(t.totalCorrigido), margin + 162, currentY + 5)

      currentY += 9.5
    })

    currentY += 6
  }

  // Bloco 1: PIS / COFINS
  const tesesPis = resultados.resultadosTeses.filter((t) => t.modulo === 'pis_cofins')
  renderizarTabelaBloco(
    `BLOCO 1 • CRÉDITOS DE PIS / COFINS (SETOR: ${(parametros.configuracoes.segmento || 'GERAL').toUpperCase()})`,
    'Teses vinculadas à exclusão da base, insumos produtivos e regimes monofásicos.',
    tesesPis,
  )

  // Bloco 2: Folha / Previdenciário
  const tesesFolha = resultados.resultadosTeses.filter((t) => t.modulo === 'folha')
  renderizarTabelaBloco(
    `BLOCO 2 • CRÉDITOS DE FOLHA DE PAGAMENTO & PREVIDENCIÁRIO (INSS / RAT)`,
    'Verbas indenizatórias, desoneração da folha, revisão FAP/RAT e limites de contribuição.',
    tesesFolha,
  )

  // Bloco 3: IRPJ & CSLL
  const tesesIrpjCsll = resultados.resultadosTeses.filter((t) => t.modulo === 'irpj_csll')
  renderizarTabelaBloco(
    `BLOCO 3 • CRÉDITOS DE IRPJ & CSLL (DIRETOS FEDERAIS - LUCRO REAL E PRESUMIDO)`,
    'Exclusões de bases presumidas, incentivos de ICMS e não incidência sobre juros SELIC.',
    tesesIrpjCsll,
  )

  // Bloco 4: Outros Tributos
  const tesesOutrosTributos = resultados.resultadosTeses.filter(
    (t) => t.modulo === 'outros_tributos',
  )
  renderizarTabelaBloco(
    `BLOCO 4 • CRÉDITOS DE ICMS, ISS & ITCMD (ESTADUAIS, MUNICIPAIS & PATRIMONIAIS)`,
    'Creditamento industrial de ICMS, ressarcimento ST, ISS uniprofissional e imunidades.',
    tesesOutrosTributos,
  )

  // =========================================================================
  // REQUISITO (B): DETALHAMENTO POR PERÍODO (EVOLUÇÃO TEMPORAL ANO A ANO)
  // =========================================================================
  verificarQuebraPagina(50, 'EVOLUÇÃO TEMPORAL DA RECUPERAÇÃO ANO A ANO')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.text('DETALHAMENTO POR PERÍODO • EVOLUÇÃO TEMPORAL ANO A ANO (60 MESES)', margin, currentY)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
  doc.text(
    'Faturamento declarado, crédito original apurado e correção monetária acumulada pela taxa SELIC.',
    margin,
    currentY + 4,
  )

  currentY += 6.5

  doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.rect(margin, currentY, contentWidth, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(6.8)
  doc.setFont('helvetica', 'bold')
  doc.text('Competência / Ano-Calendário', margin + 3, currentY + 4.2)
  doc.text('Faturamento Anual Declarado', margin + 44, currentY + 4.2)
  doc.text('Crédito Original', margin + 92, currentY + 4.2)
  doc.text('Correção SELIC Estimada', margin + 124, currentY + 4.2)
  doc.text('Total Recuperável Corrigido', margin + 158, currentY + 4.2)

  currentY += 6

  resultados.totaisPorAno.forEach((anoItem, idx) => {
    verificarQuebraPagina(7, 'EVOLUÇÃO TEMPORAL DA RECUPERAÇÃO ANO A ANO')

    doc.setFillColor(
      idx % 2 === 0 ? 255 : 248,
      idx % 2 === 0 ? 255 : 250,
      idx % 2 === 0 ? 255 : 252,
    )
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.rect(margin, currentY, contentWidth, 6.2, 'FD')

    const fatAno =
      parametros.configuracoes.anosFaturamento.find((a) => a.ano === anoItem.ano)?.faturamento || 0

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.8)
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    doc.text(`Ano-Calendário ${anoItem.ano}`, margin + 3, currentY + 4.2)
    doc.text(formatarMoeda(fatAno), margin + 44, currentY + 4.2)
    doc.text(formatarMoeda(anoItem.valorOriginal), margin + 92, currentY + 4.2)
    doc.text(`+${formatarMoeda(anoItem.correcaoSelic)}`, margin + 124, currentY + 4.2)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
    doc.text(formatarMoeda(anoItem.totalCorrigido), margin + 158, currentY + 4.2)

    currentY += 6.2
  })

  currentY += 8

  // =========================================================================
  // REQUISITO (D): COMPARATIVO ANTES / DEPOIS COM IBS / CBS (REFORMA TRIBUTÁRIA)
  // Mostra a transição do sistema atual para a Reforma (EC 132/2023 e LC 214/2025)
  // =========================================================================
  verificarQuebraPagina(55, 'COMPARATIVO ANTES / DEPOIS COM IBS / CBS')

  // Estimativa comparativa do sistema atual vs IBS/CBS
  const regimeAtualEmpresa = parametros.configuracoes.regimeAtual || 'Lucro Presumido'
  let aliqAtualRef = 14.65 // Média referencial Lucro Presumido (3,65% PIS/COFINS + ICMS/ISS médio)
  if (regimeAtualEmpresa === 'Lucro Real')
    aliqAtualRef = 26.25 // 9,25% PIS/COFINS + 17% ICMS/ISS
  else if (regimeAtualEmpresa === 'Simples Nacional') aliqAtualRef = 10.5

  const impostoAtualAnual = (fatMedioAnual * aliqAtualRef) / 100
  // Carga plena IBS/CBS: 26,50% nominal sobre faturamento abatendo créditos de compras e insumos
  const comprasAnuais = (fatMedioAnual * pctCompras) / 100
  const debitoIbsCbs = (fatMedioAnual * 26.5) / 100
  const creditoIbsCbs = (comprasAnuais * 26.5) / 100
  const impostoNovoAnual = Math.max(0, debitoIbsCbs - creditoIbsCbs)
  const diferencaAnual = impostoNovoAnual - impostoAtualAnual

  doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.roundedRect(margin, currentY, contentWidth, 48, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.text(
    'COMPARATIVO ANTES / DEPOIS: SISTEMA ATUAL VERSUS IBS / CBS (EC 132/2023 & LC 214/2025)',
    margin + 6,
    currentY + 7,
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  doc.setTextColor(203, 213, 225)
  doc.text(
    'Impacto da extinção do PIS, COFINS, ICMS e ISS com a entrada da Contribuição e Imposto sobre Bens e Serviços (IVA Dual):',
    margin + 6,
    currentY + 13,
  )

  // 3 Colunas: Sistema Atual | Novo Sistema IBS/CBS | Integração com Recuperação
  const colCompW = (contentWidth - 16) / 3

  // Coluna A: Sistema Atual
  const colAX = margin + 4
  doc.setFillColor(COR_NAVY_LIGHT[0], COR_NAVY_LIGHT[1], COR_NAVY_LIGHT[2])
  doc.roundedRect(colAX, currentY + 16, colCompW, 28, 1.5, 1.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.8)
  doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.text('SISTEMA ATUAL VIGENTE', colAX + 3, currentY + 21)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.3)
  doc.setTextColor(255, 255, 255)
  doc.text(`Regime: ${regimeAtualEmpresa}`, colAX + 3, currentY + 26)
  doc.text(`Tributos: PIS, COFINS, ICMS, ISS`, colAX + 3, currentY + 31)
  doc.text(`Carga Anual Ref: ${formatarMoeda(impostoAtualAnual)}`, colAX + 3, currentY + 36)
  doc.text(`Cumulatividade residual e créditos restritos`, colAX + 3, currentY + 41)

  // Coluna B: Novo Sistema IBS / CBS
  const colBX = colAX + colCompW + 4
  doc.setFillColor(COR_NAVY_LIGHT[0], COR_NAVY_LIGHT[1], COR_NAVY_LIGHT[2])
  doc.roundedRect(colBX, currentY + 16, colCompW, 28, 1.5, 1.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.8)
  doc.setTextColor(255, 255, 255)
  doc.text('NOVO CÓDIGO (IBS / CBS)', colBX + 3, currentY + 21)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.3)
  doc.setTextColor(203, 213, 225)
  doc.text(`Alíquota Referência: 26,50%`, colBX + 3, currentY + 26)
  doc.text(`Não-cumulatividade plena (crédito amplo)`, colBX + 3, currentY + 31)
  doc.text(`Carga Líquida Anual: ${formatarMoeda(impostoNovoAnual)}`, colBX + 3, currentY + 36)
  const diffTxt =
    diferencaAnual <= 0
      ? `Economia: ${formatarMoeda(Math.abs(diferencaAnual))}/ano`
      : `Acréscimo: +${formatarMoeda(diferencaAnual)}/ano`
  doc.text(diffTxt, colBX + 3, currentY + 41)

  // Coluna C: Recuperação & Crédito Estoque
  const colCX = colBX + colCompW + 4
  doc.setFillColor(COR_NAVY_LIGHT[0], COR_NAVY_LIGHT[1], COR_NAVY_LIGHT[2])
  doc.roundedRect(colCX, currentY + 16, colCompW, 28, 1.5, 1.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.8)
  doc.setTextColor(COR_EMERALD[0], COR_EMERALD[1], COR_EMERALD[2])
  doc.text('SINERGIA COM A RECUPERAÇÃO', colCX + 3, currentY + 21)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.3)
  doc.setTextColor(255, 255, 255)
  doc.text(
    `Créditos 60m: ${formatarMoeda(resultados.totalIntegralCorrigido)}`,
    colCX + 3,
    currentY + 26,
  )
  doc.text(`Crédito Estoque: ${formatarMoeda(creditoEstoqueEstimado)}`, colCX + 3, currentY + 31)
  doc.text(`Compensação cruzada via PER/DCOMP`, colCX + 3, currentY + 36)
  doc.text(`Blindagem de caixa para o Split Payment`, colCX + 3, currentY + 41)

  currentY += 54

  // =========================================================================
  // REQUISITO (E): PRÓXIMOS PASSOS RECOMENDADOS
  // =========================================================================
  verificarQuebraPagina(48, 'PRÓXIMOS PASSOS RECOMENDADOS')

  doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(margin, currentY, contentWidth, 38, 2, 2, 'FD')
  doc.setFillColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.rect(margin, currentY, 2.5, 38, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.text(
    'PRÓXIMOS PASSOS RECOMENDADOS PARA HOMOLOGAÇÃO & MONETIZAÇÃO DOS CRÉDITOS',
    margin + 6,
    currentY + 6,
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])

  const passosTexto = [
    {
      num: 'Passo 1',
      tit: 'Auditoria Cruzada dos Arquivos Digitais (SPED & eSocial):',
      desc: 'Validação eletrônica de arquivos SPED Fiscal (EFD ICMS/IPI), EFD-Contribuições, eventos eSocial (S-1200 e S-1210) e DCTF Web dos 60 meses para apuração exata do indébito.',
    },
    {
      num: 'Passo 2',
      tit: 'Formalização e Transmissão de Retificadoras & PER/DCOMP:',
      desc: 'Transmissão das obrigações acessórias retificadoras e envio eletrônico dos Pedidos de Restituição/Ressarcimento e Declarações de Compensação Administrativa perante a Receita Federal.',
    },
    {
      num: 'Passo 3',
      tit: 'Apropriação Contínua em Tributos Vincendos & Crédito de Estoque:',
      desc: 'Compensação mensal dos créditos deferidos contra débitos correntes da empresa (PIS, COFINS, IRPJ, CSLL e Previdenciário) e planejamento do crédito de estoque de 2027.',
    },
    {
      num: 'Passo 4',
      tit: 'Governança Tributária 5.0 & Transição para IBS/CBS:',
      desc: 'Adequação contábil para o Split Payment e integração dos cadastros tributários às regras da Emenda Constitucional 132/2023 e Lei Complementar 214/2025.',
    },
  ]

  passosTexto.forEach((p, pIdx) => {
    const pY = currentY + 11.5 + pIdx * 6.6
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
    doc.text(`${p.num} • ${p.tit}`, margin + 6, pY)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    const descLinha = doc.splitTextToSize(p.desc, contentWidth - 10)
    doc.text(descLinha[0], margin + 6, pY + 3.2)
  })

  currentY += 44

  // =========================================================================
  // OBSERVAÇÕES DO ANALISTA & RESPONSÁVEL TÉCNICO
  // =========================================================================
  verificarQuebraPagina(30, 'OBSERVAÇÕES DO ANALISTA')

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'D')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.text('OBSERVAÇÕES DO ANALISTA RESPONSÁVEL', margin + 5, currentY + 5.5)

  const textoObs =
    observacoesAnalista ||
    responsavelTecnico?.observacoes ||
    'Os montantes apurados neste relatório executivo preliminar foram calculados por amostragem e parametrização setorial. A compensação administrativa requer a validação integral dos arquivos SPED, DCTF Web e eSocial da empresa.'

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
  const linhasObs = doc.splitTextToSize(textoObs, contentWidth - 10)
  doc.text(linhasObs, margin + 5, currentY + 11)

  currentY += 28

  // =========================================================================
  // AVISO TÉCNICO REGULATÓRIO & LIMITAÇÃO DE ESCOPO
  // =========================================================================
  verificarQuebraPagina(20, 'AVISO TÉCNICO REGULATÓRIO')

  doc.setFillColor(254, 243, 199) // amber-100
  doc.setDrawColor(245, 158, 11)
  doc.roundedRect(margin, currentY, contentWidth, 14, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.8)
  doc.setTextColor(180, 83, 9)
  doc.text('AVISO TÉCNICO REGULATÓRIO & LIMITAÇÃO DE ESCOPO:', margin + 4, currentY + 4.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.3)
  doc.setTextColor(146, 64, 14)
  const avisoTexto =
    'O valor homologado e passível de restituição/compensação depende da análise pormenorizada dos arquivos magnéticos oficiais (SPED Fiscal, EFD-Contribuições, eSocial e Folha de Pagamento Analítica). Esta estimativa prévia não gera direito automático de crédito perante a Secretaria da Receita Federal do Brasil.'
  const linhasAviso = doc.splitTextToSize(avisoTexto, contentWidth - 8)
  doc.text(linhasAviso, margin + 4, currentY + 8.5)

  currentY += 18

  // =========================================================================
  // AVISO LEGAL COMPLETO COM LINK INSTITUCIONAL
  // =========================================================================
  verificarQuebraPagina(26, 'AVISO LEGAL ORIENTATIVO')
  const hAvisoLegalRecup = desenharAvisoLegalCompletoPDF(doc, margin, currentY, contentWidth)
  currentY += hAvisoLegalRecup + 5

  // =========================================================================
  // BLOCO DE ASSINATURA FORMAL
  // =========================================================================
  verificarQuebraPagina(42, 'TERMO DE ENCERRAMENTO & ASSINATURA')
  const cidadeEmpresa = parametros.configuracoes.uf
    ? `São Paulo - ${parametros.configuracoes.uf}`
    : 'São Paulo - SP'
  adicionarBlocoAssinatura(doc, margin, currentY, contentWidth, responsavelTecnico, cidadeEmpresa)

  // =========================================================================
  // REQUISITO (F): RODAPÉ PADRÃO DIAMOND GROUP COM OS DADOS DA EMPRESA / ESCRITÓRIO
  // Consistente com os demais relatórios da plataforma Contabilidade 5.0
  // Plugado com a identidade do escritório adquirente e fallback gracioso
  // =========================================================================
  const totalPages = doc.internal.pages.length - 1
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.setLineWidth(0.3)
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)

    renderizarRodapeEscritorioPdf(doc, i, totalPages, pageHeight - 7)
  }

  // Baixar arquivo com nome sanitizado
  const nomeSanitizado = (nomeAnalise || 'recuperador_creditos')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
  doc.save(`parecer-recuperador-creditos-${nomeSanitizado}.pdf`)
}
