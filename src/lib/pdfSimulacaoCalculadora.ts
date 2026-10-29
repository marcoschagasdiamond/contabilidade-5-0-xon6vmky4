import { jsPDF } from 'jspdf'
import type {
  ParametrosSimulacaoCalculadora,
  ResultadosSimulacaoCalculadora,
  SimulacaoCalculadora,
} from '@/types/simulacaoCalculadora'
import {
  obterInfoRegimeOperacao,
  obterGrupoRegimeOperacao,
  CRONOGRAMA_FASES_TRANSICAO,
  CATEGORIAS_CREDITO_PADRAO,
  TEXTO_FASE_TESTE_2026,
  isAno2026,
  isAno2026OuAtual,
} from '@/types/calculadoraIbsCbs'
import { extrairConclusaoDeSimulacao, derivarFatoresExplicativos } from '@/lib/conclusaoAnalitica'
import type { ResponsavelTecnicoDados } from '@/components/calculadora/ModalGerarPdf'
import {
  desenharNotaCurtaPDF,
  desenharAvisoLegalCompletoPDF,
} from '@/components/common/AvisoOrientativo'

export interface GerarPdfSimulacaoOptions {
  nomeSimulacao: string
  parametros: ParametrosSimulacaoCalculadora
  resultados: ResultadosSimulacaoCalculadora
  empresa?: string
  cnpj?: string
  clienteNome?: string
  dataGeracao?: string
  responsavelTecnico?: ResponsavelTecnicoDados
  observacoesContador?: string
}

export interface GerarPdfComparativoOptions {
  simulacoes: SimulacaoCalculadora[]
  clienteNome?: string
  dataGeracao?: string
  responsavelTecnico?: ResponsavelTecnicoDados
  observacoesContador?: string
}

// ==========================================
// PALETA VISUAL DIAMOND GROUP
// ==========================================
const COR_VERDE_ESCURO = [10, 26, 19] as const // #0A1A13 (Verde Escuro Primário Diamond)
const COR_VERDE_MEDIO = [20, 50, 36] as const // #143224 (Verde Escuro Secundário)
const COR_DOURADO = [212, 175, 55] as const // #D4AF37 (Dourado Diamond)
const COR_DOURADO_CLARO = [245, 230, 180] as const
const COR_EMERALD = [16, 185, 129] as const // #10B981
const COR_TEXTO = [30, 41, 59] as const // slate-800
const COR_MUTED = [100, 116, 139] as const // slate-500
const COR_BG_LIGHT = [248, 250, 252] as const // slate-50
const COR_BORDA = [226, 232, 240] as const // slate-200

export const formatarMoeda = (val: number): string => {
  return (
    'R$ ' +
    (val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  )
}

export const formatarPorcentagem = (val: number, casas = 2): string => {
  return (val || 0).toFixed(casas).replace('.', ',') + '%'
}

/**
 * Desenha o logotipo oficial da Contabilidade 5.0 em vetores nativos do jsPDF
 * Hexágono estilizado com seta ascendente verde/dourada
 */
export function desenharLogoContabilidade50(
  doc: jsPDF,
  x: number,
  y: number,
  size = 14,
  fundoEscuro = true,
): void {
  const cx = x + size / 2
  const cy = y + size / 2
  const r = size / 2

  // Pontos do hexágono regular com topo pontiagudo
  // Ângulos: -90, -30, 30, 90, 150, 210 graus
  const pontos: Array<{ x: number; y: number }> = []
  for (let i = 0; i < 6; i++) {
    const angulo = (-90 + i * 60) * (Math.PI / 180)
    pontos.push({
      x: cx + r * Math.cos(angulo),
      y: cy + r * Math.sin(angulo),
    })
  }

  // Preenchimento do hexágono
  if (fundoEscuro) {
    doc.setFillColor(COR_VERDE_MEDIO[0], COR_VERDE_MEDIO[1], COR_VERDE_MEDIO[2])
    doc.setDrawColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  } else {
    doc.setFillColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
    doc.setDrawColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  }
  doc.setLineWidth(0.6)

  // Traçar polígono do hexágono
  const lines: number[][] = []
  for (let i = 1; i < pontos.length; i++) {
    lines.push([pontos[i].x - pontos[i - 1].x, pontos[i].y - pontos[i - 1].y])
  }
  doc.lines(lines, pontos[0].x, pontos[0].y, [1, 1], 'FD', true)

  // Seta ascendente em vetor dourado no centro (TrendingUp)
  doc.setDrawColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.setFillColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.setLineWidth(0.8)

  const sW = size * 0.28
  const sH = size * 0.28
  const startX = cx - sW * 0.8
  const startY = cy + sH * 0.6
  const midX = cx - sW * 0.1
  const midY = cy + sH * 0.1
  const endX = cx + sW * 0.7
  const endY = cy - sH * 0.6

  // Linha em zigue-zague subindo
  doc.line(startX, startY, midX, midY)
  doc.line(midX, midY, midX + sW * 0.2, midY + sH * 0.2)
  doc.line(midX + sW * 0.2, midY + sH * 0.2, endX, endY)

  // Ponta da seta (triângulo no endX, endY)
  const pSize = size * 0.14
  doc.triangle(
    endX,
    endY,
    endX - pSize * 1.3,
    endY + pSize * 0.2,
    endX - pSize * 0.3,
    endY + pSize * 1.2,
    'FD',
  )
}

/**
 * Adiciona o bloco do Responsável Técnico Contábil no documento
 */
export function adicionarBlocoResponsavelTecnico(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  dados?: ResponsavelTecnicoDados,
): number {
  const altura = 24
  doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(x, y, width, altura, 2, 2, 'FD')

  // Borda lateral decorativa em dourado
  doc.setFillColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.rect(x, y, 2.5, altura, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.text('RESPONSÁVEL TÉCNICO CONTÁBIL', x + 5, y + 5)

  doc.setFontSize(7.5)
  doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])

  const col1X = x + 5
  const col2X = x + width / 2 + 2

  doc.setFont('helvetica', 'bold')
  doc.text('Nome:', col1X, y + 11)
  doc.setFont('helvetica', 'normal')
  doc.text(dados?.nome || 'Não informado', col1X + 16, y + 11)

  doc.setFont('helvetica', 'bold')
  doc.text('CRC:', col1X, y + 17)
  doc.setFont('helvetica', 'normal')
  doc.text(dados?.crc || 'Não informado', col1X + 16, y + 17)

  doc.setFont('helvetica', 'bold')
  doc.text('E-mail:', col2X, y + 11)
  doc.setFont('helvetica', 'normal')
  doc.text(dados?.email || 'Não informado', col2X + 16, y + 11)

  doc.setFont('helvetica', 'bold')
  doc.text('Telefone:', col2X, y + 17)
  doc.setFont('helvetica', 'normal')
  doc.text(dados?.telefone || 'Não informado', col2X + 16, y + 17)

  return y + altura + 5
}

/**
 * Adiciona o bloco de assinatura formal no final do relatório
 */
export function adicionarBlocoAssinatura(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  dados?: ResponsavelTecnicoDados,
  cidadeUf = 'São Paulo - SP',
): number {
  const altura = 36
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(x, y, width, altura, 2, 2, 'D')

  const linhaWidth = 85
  const linhaX = x + (width - linhaWidth) / 2
  const linhaY = y + 18

  // Linha de assinatura
  doc.setDrawColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.setLineWidth(0.5)
  doc.line(linhaX, linhaY, linhaX + linhaWidth, linhaY)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  const nomeAssina = dados?.nome ? dados.nome.toUpperCase() : 'ANALISTA RESPONSÁVEL'
  doc.text(nomeAssina, x + width / 2, linhaY + 4.5, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
  const crcAssina = dados?.crc ? `Registro CRC: ${dados.crc}` : 'Contabilista Habilitado no CRC'
  doc.text(crcAssina, x + width / 2, linhaY + 9, { align: 'center' })

  const dataExtenso = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  doc.setFontSize(7)
  doc.text(`${cidadeUf}, ${dataExtenso}`, x + width / 2, linhaY + 14, { align: 'center' })

  return y + altura + 5
}

/**
 * Aplica o rodapé em todas as páginas do documento
 */
function aplicarRodapePadrao(doc: jsPDF, margin: number, pageWidth: number, pageHeight: number) {
  const totalPages = doc.internal.pages.length - 1
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.setLineWidth(0.3)
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.8)
    doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
    doc.text(
      'Contabilidade 5.0 — Diamond Group | Inteligência Fiscal & BPO Estratégico | contato@contabilidade50.com.br',
      margin,
      pageHeight - 7,
    )
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' })
  }
}

/**
 * Recalcula o regime mais econômico para cada ano da transição (Quadro Comparativo)
 * Mesma lógica já homologada no Modulo6Dashboard
 */
export function calcularRegimesMaisEconomicosPorAno(
  parametros: ParametrosSimulacaoCalculadora,
  resultados: ResultadosSimulacaoCalculadora,
): Record<string, string> {
  const lrTotal = resultados.resultadoComparativo.lucroReal.totalEfetivo
  const lpTotal = resultados.resultadoComparativo.lucroPresumido.totalEfetivo
  const snTotal = resultados.resultadoComparativo.simplesNacional.totalEfetivo

  const mapa: Record<string, string> = {}
  const fatMensal = parametros.faturamentoMensal || 1
  const pctCompras = parametros.percentualComprasVendasComparativo || 0
  const anoConfig = parametros.config?.anoTransicao

  resultados.resultadoTransicao.forEach((item) => {
    const ano = item.ano

    // Em 2026 e no ano atual pré-reforma (art. 348 da LC 214/2025):
    // A CBS (0,9%) e o IBS (0,1%) são fase de teste operacional compensável integralmente, sem ônus real.
    // IBS/CBS NÃO concorre no regime recomendado (disputa apenas entre Lucro Real, Lucro Presumido e Simples Nacional).
    if (isAno2026OuAtual(ano)) {
      const cenarios = [
        { nome: 'Lucro Real', total: lrTotal },
        { nome: 'Lucro Presumido', total: lpTotal },
        { nome: 'Simples Nacional', total: snTotal },
      ].sort((a, b) => a.total - b.total)
      mapa[String(ano)] = cenarios[0].nome
      return
    }

    const faseAno = CRONOGRAMA_FASES_TRANSICAO[ano] || CRONOGRAMA_FASES_TRANSICAO[2033]
    const cbsAno = faseAno.aliquotaCbs
    const ibsAno = faseAno.aliquotaIbs
    const totalIvaDualAno = faseAno.totalIvaDual

    let ibsCbsTotalAno = resultados.resultadoComparativo.ibsCbs.totalEfetivo

    if (ano !== anoConfig) {
      const comprasValor = (fatMensal * pctCompras) / 100
      const cbsNominal = (fatMensal * cbsAno) / 100
      const ibsNominal = (fatMensal * ibsAno) / 100
      const debitoTotal = cbsNominal + ibsNominal

      const creditosCompras = (comprasValor * totalIvaDualAno) / 100
      const creditosDespesas =
        ((parametros.despesasComCreditosMensais || 0) * totalIvaDualAno) / 100
      const creditosTotal = creditosCompras + creditosDespesas

      ibsCbsTotalAno = Math.max(0, debitoTotal - creditosTotal)
    }

    const cenarios = [
      { nome: 'Lucro Real', total: lrTotal },
      { nome: 'Lucro Presumido', total: lpTotal },
      { nome: 'Simples Nacional', total: snTotal },
      { nome: 'IBS/CBS', total: ibsCbsTotalAno },
    ].sort((a, b) => a.total - b.total)

    mapa[String(ano)] = cenarios[0].nome
  })

  return mapa
}

// ============================================================================
// 1) ENRIQUECER O PDF INDIVIDUAL (REFORMULAÇÃO COMPLETA)
// ============================================================================
export function gerarRelatorioSimulacaoPDF(options: GerarPdfSimulacaoOptions): void {
  const {
    nomeSimulacao,
    parametros,
    resultados,
    empresa,
    cnpj,
    clienteNome,
    dataGeracao,
    responsavelTecnico,
    observacoesContador,
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

  const adicionarCabecalhoCompacto = () => {
    doc.setFillColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
    doc.rect(margin, 10, contentWidth, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
    doc.text('CONTABILIDADE 5.0 — SIMULADOR IBS / CBS (DIAMOND GROUP)', margin, 8)
  }

  const verificarQuebraPagina = (espacoNecessario: number) => {
    if (currentY + espacoNecessario > pageHeight - 20) {
      doc.addPage()
      currentY = 20
      adicionarCabecalhoCompacto()
    }
  }

  // ==========================================
  // PÁGINA 1: CABEÇALHO COM LOGO DIAMOND GROUP
  // ==========================================
  doc.setFillColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.rect(0, 0, pageWidth, 42, 'F')

  // Faixa dourada decorativa
  doc.setFillColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.rect(0, 42, pageWidth, 2.5, 'F')

  // Logotipo desenhado em vetor (hexágono + seta)
  desenharLogoContabilidade50(doc, margin, 11, 19, true)

  // Textos da marca ao lado do logo
  const brandX = margin + 24
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.text('CONTABILIDADE 5.0', brandX, 19)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.text('DIAMOND GROUP • INTELIGÊNCIA TRIBUTÁRIA & TRANSIÇÃO IBS/CBS', brandX, 26)

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
  doc.text(
    `${infoCliente}Cenário: "${nomeSimulacao}" | Emissão: ${dataString} | Dossiê Técnico Individual`,
    brandX,
    33,
  )

  currentY = 51

  // ==========================================
  // BLOCO: RESPONSÁVEL TÉCNICO (PREENCHÍVEL / PERSISTIDO)
  // ==========================================
  currentY = adicionarBlocoResponsavelTecnico(
    doc,
    margin,
    currentY,
    contentWidth,
    responsavelTecnico,
  )

  // ==========================================
  // BLOCO 1: IDENTIFICAÇÃO DA EMPRESA & METADADOS DA SIMULAÇÃO
  // ==========================================
  const nomeEmpresaExibir = clienteNome || empresa || parametros.empresa || 'Empresa em Simulação'
  const cnpjExibir = cnpj || parametros.cnpj || 'Não informado'
  const periodoExibir = (parametros.periodoDashboard || 'mensal').toUpperCase()
  const regimeAtualExibir =
    parametros.regimeAtualFiltro || parametros.regimeAtualEmpresa || 'Simples Nacional'
  const anoTransicaoExibir =
    parametros.anoTransicaoDashboard === 'atual'
      ? 'Ano Atual (Pré-Reforma)'
      : parametros.anoTransicaoDashboard
        ? `Ano ${parametros.anoTransicaoDashboard}`
        : parametros.config?.anoTransicao === 'atual'
          ? 'Ano Atual (Pré-Reforma)'
          : `Ano ${parametros.config?.anoTransicao || 2033}`

  doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(margin, currentY, contentWidth, 42, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.text('IDENTIFICAÇÃO DA EMPRESA E METADADOS DA SIMULAÇÃO', margin + 4, currentY + 6)

  // Badge dourado do Ano da Transição selecionado no Dashboard
  doc.setFillColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.roundedRect(margin + contentWidth - 52, currentY + 2.5, 48, 5, 1, 1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.text(`FASE: ${anoTransicaoExibir.toUpperCase()}`, margin + contentWidth - 28, currentY + 6, {
    align: 'center',
  })

  doc.setFontSize(7.5)
  doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])

  // Coluna 1
  doc.setFont('helvetica', 'bold')
  doc.text('Empresa / Razão Social:', margin + 4, currentY + 13)
  doc.setFont('helvetica', 'normal')
  doc.text(nomeEmpresaExibir, margin + 40, currentY + 13)

  doc.setFont('helvetica', 'bold')
  doc.text('CNPJ:', margin + 4, currentY + 18)
  doc.setFont('helvetica', 'normal')
  doc.text(cnpjExibir, margin + 40, currentY + 18)

  doc.setFont('helvetica', 'bold')
  doc.text('Regime Atual da Empresa:', margin + 4, currentY + 23)
  doc.setFont('helvetica', 'normal')
  doc.text(regimeAtualExibir, margin + 40, currentY + 23)

  doc.setFont('helvetica', 'bold')
  doc.text('Período de Análise:', margin + 4, currentY + 28)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Visão ${periodoExibir} (${formatarMoeda(parametros.faturamentoMensal)}/mês)`,
    margin + 40,
    currentY + 28,
  )

  doc.setFont('helvetica', 'bold')
  doc.text('Compras / Insumos:', margin + 4, currentY + 33)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `${parametros.percentualComprasVendasComparativo}% das vendas (${formatarMoeda((parametros.faturamentoMensal * parametros.percentualComprasVendasComparativo) / 100)}/mês)`,
    margin + 40,
    currentY + 33,
  )

  doc.setFont('helvetica', 'bold')
  doc.text('Folha / Margem:', margin + 4, currentY + 38)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `${formatarMoeda(parametros.folhaPagamentoMensal)}/mês | Margem: ${parametros.margemLucroEstimada}%`,
    margin + 40,
    currentY + 38,
  )

  // Coluna 2
  const col2X = margin + 104
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
          : parametros.tipoAtividade === 'agronegocio'
            ? 'Agronegócio'
            : parametros.tipoAtividade === 'construcao_civil'
              ? 'Construção Civil'
              : parametros.tipoAtividade === 'locacao_bens'
                ? 'Locação de Bens'
                : parametros.tipoAtividade === 'food_service'
                  ? 'Bares / Food Service'
                  : 'Misto'
  doc.text(labelRamo, col2X + 32, currentY + 13)

  doc.setFont('helvetica', 'bold')
  doc.text('UF de Origem:', col2X, currentY + 18)
  doc.setFont('helvetica', 'normal')
  doc.text(`${parametros.ufOrigem || 'SP'}`, col2X + 32, currentY + 18)

  doc.setFont('helvetica', 'bold')
  doc.text('Ano Transição Dashboard:', col2X, currentY + 23)
  doc.setFont('helvetica', 'normal')
  doc.text(anoTransicaoExibir, col2X + 32, currentY + 23)

  doc.setFont('helvetica', 'bold')
  doc.text('Despesas c/ Crédito:', col2X, currentY + 28)
  doc.setFont('helvetica', 'normal')
  doc.text(`${formatarMoeda(parametros.despesasComCreditosMensais)}/mês`, col2X + 32, currentY + 28)

  doc.setFont('helvetica', 'bold')
  doc.text('Exportação:', col2X, currentY + 33)
  doc.setFont('helvetica', 'normal')
  doc.text(`${parametros.percentualExportacao || 0}% da receita`, col2X + 32, currentY + 33)

  doc.setFont('helvetica', 'bold')
  doc.text('IVA Dual Referência:', col2X, currentY + 38)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `CBS ${parametros.config.cbsPadrao}% + IBS ${parametros.config.ibsPadrao}% = ${parametros.config.totalIvaDual}%`,
    col2X + 32,
    currentY + 38,
  )

  currentY += 48

  // ==========================================
  // BLOCO 2: RESUMO EXECUTIVO (MÓDULO 6 - DASHBOARD)
  // ==========================================
  doc.setFillColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.roundedRect(margin, currentY, contentWidth, 32, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.text('MÓDULO 6 • DASHBOARD EXECUTIVO & DIAGNÓSTICO', margin + 6, currentY + 7)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text(
    `Regime Recomendado: ${resultados.resultadoDashboard.regimeRecomendado}`,
    margin + 6,
    currentY + 16,
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(226, 232, 240)
  doc.text(
    `Alíquota Efetiva Atual (${regimeAtualExibir}): ${resultados.resultadoDashboard.aliquotaEfetivaAtual.toFixed(2)}%  →  Nova Alíquota (IBS/CBS): ${resultados.resultadoDashboard.aliquotaEfetivaNova.toFixed(2)}%`,
    margin + 6,
    currentY + 23,
  )

  // Card de Economia Anual
  const ecoWidth = 56
  const ecoX = margin + contentWidth - ecoWidth - 6
  doc.setFillColor(COR_VERDE_MEDIO[0], COR_VERDE_MEDIO[1], COR_VERDE_MEDIO[2])
  doc.roundedRect(ecoX, currentY + 4, ecoWidth, 24, 2, 2, 'F')

  doc.setFontSize(6.5)
  doc.setTextColor(203, 213, 225)
  doc.text('ECONOMIA ANUAL PROJETADA', ecoX + 4, currentY + 9)

  const ecoAnualValor = resultados.resultadoDashboard.economiaAnualProjetada
  const ecoMensalValor = resultados.resultadoDashboard.economiaMensalProjetada
  const temEconomiaAnual = ecoAnualValor >= 0
  const temEconomiaMensal = ecoMensalValor >= 0

  doc.setFont('helvetica', 'bold')
  if (temEconomiaAnual) {
    doc.setFontSize(11)
    doc.setTextColor(COR_EMERALD[0], COR_EMERALD[1], COR_EMERALD[2])
    doc.text(formatarMoeda(ecoAnualValor), ecoX + 4, currentY + 16)
  } else {
    doc.setFontSize(7)
    doc.setTextColor(226, 232, 240)
    doc.text('Sem economia neste cenário', ecoX + 4, currentY + 16)
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.text(
    temEconomiaMensal
      ? `Economia: ${formatarMoeda(ecoMensalValor)}/mês`
      : 'Sem economia neste cenário',
    ecoX + 4,
    currentY + 22,
  )

  currentY += 34

  // Nota orientativa curta no rodapé do Bloco 2 (Dashboard)
  const hNotaBloco2 = desenharNotaCurtaPDF(doc, margin, currentY, contentWidth)
  currentY += hNotaBloco2 + 5

  // ==========================================
  // BLOCO 3: MÓDULO 3 - COMPARATIVO DOS 4 REGIMES
  // ==========================================
  verificarQuebraPagina(50)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.text('MÓDULO 3 • COMPARATIVO DE REGIMES TRIBUTÁRIOS', margin, currentY + 4)

  currentY += 7

  doc.setFillColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
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

  const anoDashboardSimulacao =
    parametros.anoTransicaoDashboard === 'atual'
      ? 'atual'
      : parametros.anoTransicaoDashboard || parametros.config?.anoTransicao || 2033
  const ehFaseTeste2026Simulacao = isAno2026(anoDashboardSimulacao)

  const regimes = [
    {
      nome: 'Simples Nacional',
      dados: resultados.resultadoComparativo.simplesNacional,
      isRecomendado: resultados.resultadoDashboard.regimeRecomendado === 'Simples Nacional',
      notaEspecial: undefined as string | undefined,
    },
    {
      nome: 'Lucro Presumido',
      dados: resultados.resultadoComparativo.lucroPresumido,
      isRecomendado: resultados.resultadoDashboard.regimeRecomendado === 'Lucro Presumido',
      notaEspecial: undefined as string | undefined,
    },
    {
      nome: 'Lucro Real',
      dados: resultados.resultadoComparativo.lucroReal,
      isRecomendado: resultados.resultadoDashboard.regimeRecomendado === 'Lucro Real',
      notaEspecial: undefined as string | undefined,
    },
    {
      nome: ehFaseTeste2026Simulacao ? 'IBS / CBS (2026 • Fase de Teste)' : 'IBS / CBS (Reforma)',
      dados: ehFaseTeste2026Simulacao
        ? {
            ...resultados.resultadoComparativo.ibsCbs,
            totalEfetivo: 0,
            aliquotaEfetiva: 0,
          }
        : resultados.resultadoComparativo.ibsCbs,
      isRecomendado:
        !ehFaseTeste2026Simulacao &&
        (resultados.resultadoDashboard.regimeRecomendado === 'IBS/CBS' ||
          resultados.resultadoDashboard.regimeRecomendado === 'IBS / CBS'),
      notaEspecial: ehFaseTeste2026Simulacao ? TEXTO_FASE_TESTE_2026 : undefined,
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
      reg.isRecomendado ? COR_VERDE_MEDIO[0] : COR_TEXTO[0],
      reg.isRecomendado ? COR_VERDE_MEDIO[1] : COR_TEXTO[1],
      reg.isRecomendado ? COR_VERDE_MEDIO[2] : COR_TEXTO[2],
    )

    doc.text(`${reg.nome}${reg.isRecomendado ? ' (Recomendado)' : ''}`, margin + 3, currentY + 5)
    doc.text(formatarMoeda(reg.dados.totalNominal), margin + 45, currentY + 5)
    doc.text(formatarMoeda(reg.dados.creditos), margin + 85, currentY + 5)

    doc.setFont('helvetica', 'bold')
    if (reg.notaEspecial) {
      doc.setFontSize(6.2)
      doc.text('R$ 0,00 (Compensável)', margin + 125, currentY + 4.2)
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(5.2)
      doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
      doc.text(reg.notaEspecial, margin + 125, currentY + 6.8)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(COR_VERDE_MEDIO[0], COR_VERDE_MEDIO[1], COR_VERDE_MEDIO[2])
    } else {
      doc.text(formatarMoeda(reg.dados.totalEfetivo), margin + 125, currentY + 5)
    }
    doc.text(`${reg.dados.aliquotaEfetiva.toFixed(2)}%`, margin + 162, currentY + 5)

    currentY += 7.5
  })

  currentY += 2

  // Nota orientativa curta no rodapé do Bloco 3 (Comparativo dos 4 Regimes)
  const hNotaBloco3 = desenharNotaCurtaPDF(doc, margin, currentY, contentWidth)
  currentY += hNotaBloco3 + 6

  // ==========================================
  // BLOCO 4: MÓDULO 4 - QUADRO DE CRÉDITOS POR CATEGORIA (ANTIGO VS. NOVO IVA DUAL)
  // ==========================================
  verificarQuebraPagina(60)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.text(
    'MÓDULO 4 • QUADRO DE CRÉDITOS POR CATEGORIA (ANTIGO VS. NOVO IVA DUAL)',
    margin,
    currentY + 3,
  )

  currentY += 6

  // Resumo numérico do Módulo 4
  const resCred = resultados.resultadoCreditos
  doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(margin, currentY, contentWidth, 14, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.2)
  doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
  doc.text(
    `Total Crédito Antigo: ${formatarMoeda(resCred.totalAntigo)}/mês  |  Crédito Novo IVA Dual: ${formatarMoeda(resCred.totalNovo)}/mês  |  Ganho Líquido: ${resCred.adicionalGanho >= 0 ? '+' : ''}${formatarMoeda(resCred.adicionalGanho)}/mês  |  Economia Anual: ${formatarMoeda(resCred.economiaAnual)}`,
    margin + 4,
    currentY + 8.5,
  )

  currentY += 17

  // Cabeçalho da Tabela de Créditos
  doc.setFillColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.rect(margin, currentY, contentWidth, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(6.8)
  doc.setFont('helvetica', 'bold')
  doc.text('Categoria de Despesa / Insumo', margin + 3, currentY + 4.2)
  doc.text('Base Mensal', margin + 66, currentY + 4.2)
  doc.text('Alíq. Antiga', margin + 92, currentY + 4.2)
  doc.text('Crédito Antigo', margin + 112, currentY + 4.2)
  doc.text('Alíq. Nova', margin + 137, currentY + 4.2)
  doc.text('Crédito Novo', margin + 155, currentY + 4.2)
  doc.text('Ganho', margin + 173, currentY + 4.2)

  currentY += 6

  const categoriasExibir =
    parametros.despesasCreditos && parametros.despesasCreditos.length > 0
      ? parametros.despesasCreditos
      : CATEGORIAS_CREDITO_PADRAO

  const aliqRefGeral = resCred.isAliquotaZero ? 0 : (resCred.aliquotaReferencia ?? 26.5)

  categoriasExibir.forEach((cat, idx) => {
    verificarQuebraPagina(6)

    const baseVal = cat.valorMensal || 0
    const aliqAntiga = cat.aliquotaAntiga || 0
    const credAntigo = (baseVal * aliqAntiga) / 100

    let aliqNova = aliqRefGeral
    if (resCred.isAliquotaZero) {
      aliqNova = 0
    } else if (cat.aliquotaNova !== undefined) {
      aliqNova = cat.aliquotaNova
    }

    const credNovo = (baseVal * aliqNova) / 100
    const ganho = credNovo - credAntigo

    doc.setFillColor(
      idx % 2 === 0 ? 255 : 248,
      idx % 2 === 0 ? 255 : 250,
      idx % 2 === 0 ? 255 : 252,
    )
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.rect(margin, currentY, contentWidth, 5.2, 'FD')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])

    // Trunca nome para caber na coluna
    const nomeTrunc = cat.nome.length > 36 ? cat.nome.slice(0, 34) + '...' : cat.nome
    doc.text(nomeTrunc, margin + 3, currentY + 3.6)
    doc.text(formatarMoeda(baseVal), margin + 66, currentY + 3.6)
    doc.text(`${aliqAntiga.toFixed(1)}%`, margin + 92, currentY + 3.6)
    doc.text(formatarMoeda(credAntigo), margin + 112, currentY + 3.6)
    doc.text(`${aliqNova.toFixed(1)}%`, margin + 137, currentY + 3.6)
    doc.text(formatarMoeda(credNovo), margin + 155, currentY + 3.6)

    doc.setFont('helvetica', 'bold')
    if (ganho > 0) {
      doc.setTextColor(COR_EMERALD[0], COR_EMERALD[1], COR_EMERALD[2])
      doc.text(`+${formatarMoeda(ganho)}`, margin + 173, currentY + 3.6)
    } else if (ganho < 0) {
      doc.setTextColor(185, 28, 28)
      doc.text(`-${formatarMoeda(Math.abs(ganho))}`, margin + 173, currentY + 3.6)
    } else {
      doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
      doc.text('R$ 0,00', margin + 173, currentY + 3.6)
    }

    currentY += 5.2
  })

  currentY += 2

  // Nota orientativa curta no rodapé do Bloco 4 (Simulador de Créditos)
  const hNotaBloco4 = desenharNotaCurtaPDF(doc, margin, currentY, contentWidth)
  currentY += hNotaBloco4 + 6

  // ==========================================
  // BLOCO 5: MÓDULO 5 - CRONOGRAMA DA TRANSIÇÃO COM COLUNA 'REGIME MAIS ECONÔMICO'
  // ==========================================
  verificarQuebraPagina(65)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.text('MÓDULO 5 • CRONOGRAMA DA TRANSIÇÃO TRIBUTÁRIA (2026–2033)', margin, currentY + 3)

  currentY += 6

  // Cabeçalho com a nova coluna 'Regime Mais Econômico'
  doc.setFillColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.rect(margin, currentY, contentWidth, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(6.8)
  doc.setFont('helvetica', 'bold')
  doc.text('Ano', margin + 3, currentY + 4.2)
  doc.text('Fase Constitucional da Reforma', margin + 18, currentY + 4.2)
  doc.text('CBS', margin + 82, currentY + 4.2)
  doc.text('IBS', margin + 98, currentY + 4.2)
  doc.text('Alíq. Efetiva', margin + 114, currentY + 4.2)
  doc.text('Imposto Projetado', margin + 134, currentY + 4.2)
  doc.text('Regime Mais Econômico', margin + 158, currentY + 4.2)

  currentY += 6

  const mapaVencedorAno = calcularRegimesMaisEconomicosPorAno(parametros, resultados)

  resultados.resultadoTransicao.forEach((item, idx) => {
    verificarQuebraPagina(6)
    const anoStr = String(item.ano)
    const isDestaque =
      anoStr === 'atual' || anoStr === '2026' || anoStr === '2027' || anoStr === '2033'
    const regimeVencedor = mapaVencedorAno[anoStr] || 'IBS/CBS'

    doc.setFillColor(
      isDestaque ? 236 : idx % 2 === 0 ? 255 : 248,
      isDestaque ? 253 : idx % 2 === 0 ? 255 : 250,
      isDestaque ? 245 : idx % 2 === 0 ? 255 : 252,
    )
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.rect(margin, currentY, contentWidth, 5.5, 'FD')

    doc.setFont('helvetica', isDestaque ? 'bold' : 'normal')
    doc.setFontSize(6.8)
    doc.setTextColor(
      isDestaque ? COR_VERDE_MEDIO[0] : COR_TEXTO[0],
      isDestaque ? COR_VERDE_MEDIO[1] : COR_TEXTO[1],
      isDestaque ? COR_VERDE_MEDIO[2] : COR_TEXTO[2],
    )

    doc.text(`${anoStr === 'atual' ? 'Atual' : anoStr}`, margin + 3, currentY + 3.8)
    if (isAno2026(item.ano)) {
      doc.text(
        'Fase de teste — compensável integralmente, sem ônus real (art. 348, LC 214/2025)',
        margin + 18,
        currentY + 3.8,
      )
    } else {
      const faseTrunc = item.fase.length > 34 ? item.fase.slice(0, 32) + '...' : item.fase
      doc.text(faseTrunc, margin + 18, currentY + 3.8)
    }
    doc.text(`${item.aliquotaCbs.toFixed(1)}%`, margin + 82, currentY + 3.8)
    doc.text(`${item.aliquotaIbs.toFixed(2)}%`, margin + 98, currentY + 3.8)
    doc.text(`${item.aliquotaEfetivaTotal.toFixed(2)}%`, margin + 114, currentY + 3.8)
    doc.text(formatarMoeda(item.impostoEstimado), margin + 134, currentY + 3.8)

    // Coluna Regime Mais Econômico com destaque sutil
    doc.setFont('helvetica', 'bold')
    if (regimeVencedor === 'IBS/CBS') {
      doc.setTextColor(COR_EMERALD[0], COR_EMERALD[1], COR_EMERALD[2])
    } else if (regimeVencedor === 'Lucro Presumido') {
      doc.setTextColor(180, 83, 9)
    } else {
      doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
    }
    doc.text(regimeVencedor, margin + 158, currentY + 3.8)

    currentY += 5.5
  })

  currentY += 2

  // Nota orientativa curta no rodapé do Bloco 5 (Cronograma da Transição)
  const hNotaBloco5 = desenharNotaCurtaPDF(doc, margin, currentY, contentWidth)
  currentY += hNotaBloco5 + 6

  // ==========================================
  // PÁGINA FINAL: CONCLUSÃO, RECOMENDAÇÃO EM TEXTO, OBSERVAÇÕES & ASSINATURA
  // ==========================================
  doc.addPage()
  currentY = 20
  adicionarCabecalhoCompacto()
  currentY = 28

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.text('PARECER TÉCNICO CONCLUSIVO & RECOMENDAÇÃO ESTRATÉGICA', margin, currentY)

  currentY += 8

  // Conclusão Analítica Estruturada (Veredito + Fatores Explicativos)
  const conclusaoAnalitica = extrairConclusaoDeSimulacao(parametros, resultados)

  // Box Parecer Técnico Recomendado & Veredito
  doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(margin, currentY, contentWidth, 38, 2, 2, 'FD')
  doc.setFillColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.rect(margin, currentY, 2.5, 38, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.text(
    `CONCLUSÃO ANALÍTICA • VEREDITO TÉCNICO (${conclusaoAnalitica.isAtual ? 'Cenário Atual' : `Ano ${conclusaoAnalitica.anoSelecionado}`})`,
    margin + 6,
    currentY + 6,
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.8)
  doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
  const linhasVeredito = doc.splitTextToSize(conclusaoAnalitica.vereditoTexto, contentWidth - 12)
  doc.text(linhasVeredito, margin + 6, currentY + 12)

  // Linha de resumo da economia / alíquota dentro do box
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  const resumoLinha = `Regime Recomendado: ${conclusaoAnalitica.regimeRecomendado}  |  Alíquota Efetiva: ${conclusaoAnalitica.aliquotaNova.toFixed(2)}%  |  Economia Anual: ${conclusaoAnalitica.economiaAnualStr}  |  Economia Mensal: ${conclusaoAnalitica.economiaMensalStr}`
  doc.text(resumoLinha, margin + 6, currentY + 33)

  currentY += 42

  // Box Fatores Explicativos do Resultado
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(margin, currentY, contentWidth, 34, 2, 2, 'FD')
  doc.setFillColor(COR_VERDE_MEDIO[0], COR_VERDE_MEDIO[1], COR_VERDE_MEDIO[2])
  doc.rect(margin, currentY, 2.5, 34, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.text('FATORES EXPLICATIVOS DO RESULTADO', margin + 6, currentY + 5.5)

  let fatorY = currentY + 11
  conclusaoAnalitica.fatores.forEach((fator, fIdx) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.2)
    doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
    doc.text(`• Fator ${fIdx + 1} — ${fator.titulo}:`, margin + 6, fatorY)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    const descLinhas = doc.splitTextToSize(fator.descricao, contentWidth - 14)
    doc.text(descLinhas, margin + 8, fatorY + 3.8)
    fatorY += 7.2
  })

  currentY += 38

  // ==========================================
  // SEÇÃO: LEGISLAÇÃO APLICÁVEL AO CENÁRIO
  // ==========================================
  verificarQuebraPagina(48)

  doc.setFillColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.rect(margin, currentY, contentWidth, 6.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.text('LEGISLAÇÃO & TESES APLICÁVEIS AO CENÁRIO SIMULADO', margin + 4, currentY + 4.5)

  currentY += 8.5

  // Box com normas específicas do perfil e enquadramento
  doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(margin, currentY, contentWidth, 32, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.text('Normas Regimentais e Jurisprudência Vinculante Direta:', margin + 4, currentY + 5)

  // Normas contextualizadas com base no ramo / atividade simulada
  const isIndustria = parametros.tipoAtividade === 'industria'
  const isServico = parametros.tipoAtividade === 'servico'
  const leisPerfil = [
    '• EC nº 132/2023 & LC nº 214/2025: Instituição do IBS/CBS e regras de transição não cumulativa.',
    isIndustria
      ? '• STJ Tema 77 (REsp 1.075.508) & RIPI Dec. 7.212/2010: Direito ao crédito de IPI na entrada de insumos desonerados.'
      : isServico
        ? '• STF RE 592.616 (Tema 118 RG): Exclusão definitiva do ISS destacado da base de cálculo do PIS/Cofins.'
        : '• STF RE 574.706 (Tema 69 RG): Exclusão do ICMS destacado da base de cálculo do PIS/Cofins.',
    '• Lei nº 12.973/2014 & RIR Dec. 9.580/2018: Regime de IRPJ/CSLL e convergência contábil de apuração.',
    isIndustria || parametros.tipoAtividade === 'comercio'
      ? '• STJ Tema 1182 (REsp 1.945.110/RN): Exclusão de créditos presumidos e benefícios de ICMS do PIS/Cofins e IRPJ.'
      : '• LC nº 116/2003 & LC nº 175/2020: Padrão nacional do ISSQN e transição para o IBS municipal.',
  ]

  let leiY = currentY + 10
  leisPerfil.forEach((lei) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.8)
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    const linhas = doc.splitTextToSize(lei, contentWidth - 8)
    doc.text(linhas, margin + 4, leiY)
    leiY += 4.8
  })

  currentY += 36

  // Box Observações do Analista
  verificarQuebraPagina(42)
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'D')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.text('NOTAS & OBSERVAÇÕES ESPECÍFICAS DO ANALISTA', margin + 5, currentY + 5)

  const textoObs =
    observacoesContador ||
    responsavelTecnico?.observacoes ||
    'Sem observações adicionais inseridas pelo responsável técnico nesta data. O planejamento tributário formal deve considerar a publicação dos regulamentos do CGIBS e as legislações estaduais/municipais dos anos correntes.'

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
  const linhasObs = doc.splitTextToSize(textoObs, contentWidth - 10)
  doc.text(linhasObs, margin + 5, currentY + 10)

  currentY += 28

  // AVISO LEGAL COMPLETO NA PÁGINA FINAL (COM LINK PARA DIAGNÓSTICO 360°)
  verificarQuebraPagina(22)
  const hAvisoLegal = desenharAvisoLegalCompletoPDF(doc, margin, currentY, contentWidth)
  currentY += hAvisoLegal + 6

  // Bloco de Assinatura
  verificarQuebraPagina(40)
  const cidadeEmpresa = parametros.ufOrigem
    ? `São Paulo - ${parametros.ufOrigem}`
    : 'São Paulo - SP'
  adicionarBlocoAssinatura(doc, margin, currentY, contentWidth, responsavelTecnico, cidadeEmpresa)

  // Aplica rodapé com paginação
  aplicarRodapePadrao(doc, margin, pageWidth, pageHeight)

  // Salvar
  const nomeSanitizado = (nomeSimulacao || 'simulacao')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
  doc.save(`simulacao-ibs-cbs-${nomeSanitizado}.pdf`)
}

// ============================================================================
// 3) CRIAR O PDF COMPARATIVO (2 OU 3 SIMULAÇÕES SALVAS)
// ============================================================================
export function gerarRelatorioComparativoPDF(options: GerarPdfComparativoOptions): void {
  const { simulacoes, clienteNome, dataGeracao, responsavelTecnico, observacoesContador } = options

  if (!simulacoes || simulacoes.length < 2) {
    throw new Error('O relatório comparativo requer ao menos 2 simulações selecionadas.')
  }

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

  const adicionarCabecalhoCompacto = () => {
    doc.setFillColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
    doc.rect(margin, 10, contentWidth, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
    doc.text('CONTABILIDADE 5.0 — DOSSIÊ COMPARATIVO DE CENÁRIOS (DIAMOND GROUP)', margin, 8)
  }

  const verificarQuebraPagina = (espacoNecessario: number) => {
    if (currentY + espacoNecessario > pageHeight - 20) {
      doc.addPage()
      currentY = 20
      adicionarCabecalhoCompacto()
    }
  }

  // ==========================================
  // CAPA / CABEÇALHO DO COMPARATIVO
  // ==========================================
  doc.setFillColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.rect(0, 0, pageWidth, 44, 'F')

  doc.setFillColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.rect(0, 44, pageWidth, 2.5, 'F')

  // Logo vetorial
  desenharLogoContabilidade50(doc, margin, 12, 20, true)

  const brandX = margin + 25
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.text('CONTABILIDADE 5.0', brandX, 20)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.text('DIAMOND GROUP • DOSSIÊ COMPARATIVO MULTI-CENÁRIOS IBS / CBS', brandX, 27)

  const dataStr =
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
  const infoCliComp = clienteNome ? `Cliente: ${clienteNome} | ` : ''
  doc.text(
    `${infoCliComp}Comparação técnica entre ${simulacoes.length} cenários selecionados | Emissão: ${dataStr}`,
    brandX,
    34,
  )

  currentY = 53

  // Responsável Técnico
  currentY = adicionarBlocoResponsavelTecnico(
    doc,
    margin,
    currentY,
    contentWidth,
    responsavelTecnico,
  )

  // ==========================================
  // CAPA: SIMULAÇÕES INCLUÍDAS (NOMES / DATAS)
  // ==========================================
  doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.text('CENÁRIOS INCLUÍDOS NO DOSSIÊ COMPARATIVO', margin + 4, currentY + 6)

  const simColW = contentWidth / simulacoes.length
  simulacoes.forEach((sim, idx) => {
    const sX = margin + idx * simColW + 4
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
    doc.text(`Cenário #${idx + 1}: ${sim.nome}`, sX, currentY + 12)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    const dataSim = new Date(sim.created).toLocaleDateString('pt-BR')
    const empSim = sim.empresa || 'Empresa Geral'
    doc.text(`${empSim} • Criado em ${dataSim}`, sX, currentY + 17)
    doc.text(`Fat: ${formatarMoeda(sim.parametros.faturamentoMensal)}/mês`, sX, currentY + 21)
  })

  currentY += 29

  // ==========================================
  // DESTAQUE DA SIMULAÇÃO COM MAIOR ECONOMIA
  // ==========================================
  // Identifica a simulação com maior economia anual
  const simVencedora = [...simulacoes].sort(
    (a, b) =>
      (b.resultados.resultadoDashboard.economiaAnualProjetada || 0) -
      (a.resultados.resultadoDashboard.economiaAnualProjetada || 0),
  )[0]

  doc.setFillColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.roundedRect(margin, currentY, contentWidth, 28, 2, 2, 'F')
  doc.setFillColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.rect(margin, currentY, 3, 28, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.text('DESTAQUE • CENÁRIO COM MAIOR ECONOMIA TRIBUTÁRIA PROJETADA', margin + 7, currentY + 7)

  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text(
    `"${simVencedora.nome}" — Recomendado: ${simVencedora.resultados.resultadoDashboard.regimeRecomendado}`,
    margin + 7,
    currentY + 15,
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(226, 232, 240)
  const ecoAnualVencedora = simVencedora.resultados.resultadoDashboard.economiaAnualProjetada
  const ecoMensalVencedora = simVencedora.resultados.resultadoDashboard.economiaMensalProjetada
  const textoDestaqueEco =
    ecoAnualVencedora >= 0
      ? `Economia Anual de ${formatarMoeda(ecoAnualVencedora)} (${formatarMoeda(ecoMensalVencedora)}/mês) | Nova Alíquota: ${simVencedora.resultados.resultadoDashboard.aliquotaEfetivaNova.toFixed(2)}%`
      : `Economia Anual: Sem economia neste cenário | Nova Alíquota: ${simVencedora.resultados.resultadoDashboard.aliquotaEfetivaNova.toFixed(2)}%`

  doc.text(textoDestaqueEco, margin + 7, currentY + 22)

  currentY += 34

  // ==========================================
  // TABELA COMPARATIVA LADO A LADO
  // ==========================================
  verificarQuebraPagina(70)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.text('MATRIZ COMPARATIVA LADO A LADO', margin, currentY + 3)

  currentY += 6

  const colMetricaW = 54
  const colCenarioW = (contentWidth - colMetricaW) / simulacoes.length

  // Cabeçalho da Matriz
  doc.setFillColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.rect(margin, currentY, contentWidth, 7, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.text('Métrica / Parâmetro Fiscal', margin + 3, currentY + 4.8)

  simulacoes.forEach((s, i) => {
    const colX = margin + colMetricaW + i * colCenarioW
    const nomeTrunc = s.nome.length > 20 ? s.nome.slice(0, 18) + '...' : s.nome
    doc.text(nomeTrunc, colX + 3, currentY + 4.8)
  })

  currentY += 7

  const linhasMatriz: Array<{
    titulo: string
    isSecao?: boolean
    getValores: (sim: SimulacaoCalculadora) => string
    isDestaque?: boolean
  }> = [
    // Seção Resultados
    {
      titulo: 'RESULTADOS & RECOMENDAÇÃO',
      isSecao: true,
      getValores: () => '',
    },
    {
      titulo: 'Regime Recomendado',
      isDestaque: true,
      getValores: (s) => s.resultados.resultadoDashboard.regimeRecomendado,
    },
    {
      titulo: 'Alíquota Efetiva Atual',
      getValores: (s) => `${s.resultados.resultadoDashboard.aliquotaEfetivaAtual.toFixed(2)}%`,
    },
    {
      titulo: 'Nova Alíquota (IBS/CBS)',
      getValores: (s) => `${s.resultados.resultadoDashboard.aliquotaEfetivaNova.toFixed(2)}%`,
    },
    {
      titulo: 'Economia Mensal Projetada',
      isDestaque: true,
      getValores: (s) =>
        s.resultados.resultadoDashboard.economiaMensalProjetada >= 0
          ? formatarMoeda(s.resultados.resultadoDashboard.economiaMensalProjetada)
          : 'Sem economia neste cenário',
    },
    {
      titulo: 'Economia Anual Projetada',
      isDestaque: true,
      getValores: (s) =>
        s.resultados.resultadoDashboard.economiaAnualProjetada >= 0
          ? formatarMoeda(s.resultados.resultadoDashboard.economiaAnualProjetada)
          : 'Sem economia neste cenário',
    },

    // Seção Carga dos 4 Regimes
    {
      titulo: 'CARGA EFETIVA MENSAL DOS 4 REGIMES',
      isSecao: true,
      getValores: () => '',
    },
    {
      titulo: 'Simples Nacional',
      getValores: (s) =>
        `${formatarMoeda(s.resultados.resultadoComparativo.simplesNacional.totalEfetivo)} (${s.resultados.resultadoComparativo.simplesNacional.aliquotaEfetiva.toFixed(2)}%)`,
    },
    {
      titulo: 'Lucro Presumido',
      getValores: (s) =>
        `${formatarMoeda(s.resultados.resultadoComparativo.lucroPresumido.totalEfetivo)} (${s.resultados.resultadoComparativo.lucroPresumido.aliquotaEfetiva.toFixed(2)}%)`,
    },
    {
      titulo: 'Lucro Real',
      getValores: (s) =>
        `${formatarMoeda(s.resultados.resultadoComparativo.lucroReal.totalEfetivo)} (${s.resultados.resultadoComparativo.lucroReal.aliquotaEfetiva.toFixed(2)}%)`,
    },
    {
      titulo: 'IBS / CBS (Reforma)',
      isDestaque: true,
      getValores: (s) => {
        const anoSim =
          s.parametros.anoTransicaoDashboard === 'atual'
            ? 'atual'
            : s.parametros.anoTransicaoDashboard || s.parametros.config?.anoTransicao || 2033
        if (isAno2026(anoSim)) {
          return 'R$ 0,00 (0,00%) — Fase de teste (art. 348)'
        }
        return `${formatarMoeda(s.resultados.resultadoComparativo.ibsCbs.totalEfetivo)} (${s.resultados.resultadoComparativo.ibsCbs.aliquotaEfetiva.toFixed(2)}%)`
      },
    },

    // Seção Parâmetros
    {
      titulo: 'PARÂMETROS OPERACIONAIS',
      isSecao: true,
      getValores: () => '',
    },
    {
      titulo: 'Faturamento Mensal',
      getValores: (s) => formatarMoeda(s.parametros.faturamentoMensal),
    },
    {
      titulo: 'Fase da Transição',
      getValores: (s) =>
        s.parametros.config?.anoTransicao === 'atual'
          ? 'Atual'
          : `Ano ${s.parametros.config?.anoTransicao || 2033}`,
    },
    {
      titulo: 'Ramo / Setor',
      getValores: (s) => s.parametros.tipoAtividade,
    },
    {
      titulo: 'Compras (% Vendas)',
      getValores: (s) => `${s.parametros.percentualComprasVendasComparativo}%`,
    },
    {
      titulo: 'Folha de Pagamento',
      getValores: (s) => formatarMoeda(s.parametros.folhaPagamentoMensal),
    },
    {
      titulo: 'Margem / Desp. Créditos',
      getValores: (s) =>
        `${s.parametros.margemLucroEstimada}% | ${formatarMoeda(s.parametros.despesasComCreditosMensais)}`,
    },
  ]

  linhasMatriz.forEach((linha, idx) => {
    verificarQuebraPagina(6.5)

    if (linha.isSecao) {
      doc.setFillColor(COR_VERDE_MEDIO[0], COR_VERDE_MEDIO[1], COR_VERDE_MEDIO[2])
      doc.rect(margin, currentY, contentWidth, 5.5, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
      doc.text(linha.titulo, margin + 3, currentY + 3.8)
      currentY += 5.5
      return
    }

    doc.setFillColor(
      idx % 2 === 0 ? 255 : 248,
      idx % 2 === 0 ? 255 : 250,
      idx % 2 === 0 ? 255 : 252,
    )
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.rect(margin, currentY, contentWidth, 6, 'FD')

    doc.setFont('helvetica', linha.isDestaque ? 'bold' : 'normal')
    doc.setFontSize(7)
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    doc.text(linha.titulo, margin + 3, currentY + 4.2)

    simulacoes.forEach((s, i) => {
      const colX = margin + colMetricaW + i * colCenarioW
      const val = linha.getValores(s)
      doc.setFont('helvetica', linha.isDestaque ? 'bold' : 'normal')
      if (linha.isDestaque && s.id === simVencedora.id) {
        doc.setTextColor(COR_EMERALD[0], COR_EMERALD[1], COR_EMERALD[2])
      } else {
        doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
      }
      doc.text(val, colX + 3, currentY + 4.2)
    })

    currentY += 6
  })

  currentY += 10

  // ==========================================
  // CRONOGRAMA DA TRANSIÇÃO POR CENÁRIO (COM 'REGIME MAIS ECONÔMICO')
  // ==========================================
  doc.addPage()
  currentY = 20
  adicionarCabecalhoCompacto()
  currentY = 28

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.text('CRONOGRAMA DE TRANSIÇÃO (2026–2033) POR CENÁRIO', margin, currentY)

  currentY += 6

  simulacoes.forEach((sim, idx) => {
    verificarQuebraPagina(40)

    doc.setFillColor(COR_VERDE_MEDIO[0], COR_VERDE_MEDIO[1], COR_VERDE_MEDIO[2])
    doc.rect(margin, currentY, contentWidth, 5.5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
    doc.text(
      `CENÁRIO #${idx + 1}: ${sim.nome.toUpperCase()} (${sim.empresa || 'Empresa Geral'})`,
      margin + 3,
      currentY + 3.8,
    )

    currentY += 5.5

    // Cabeçalho da tabela do cronograma
    doc.setFillColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
    doc.rect(margin, currentY, contentWidth, 5, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.text('Ano', margin + 3, currentY + 3.5)
    doc.text('Fase da Reforma', margin + 18, currentY + 3.5)
    doc.text('Alíq. Efetiva', margin + 90, currentY + 3.5)
    doc.text('Imposto Projetado', margin + 120, currentY + 3.5)
    doc.text('Regime Mais Econômico', margin + 152, currentY + 3.5)

    currentY += 5

    const mapaAno = calcularRegimesMaisEconomicosPorAno(sim.parametros, sim.resultados)

    sim.resultados.resultadoTransicao.forEach((item, cIdx) => {
      const anoStr = String(item.ano)
      const isDest = anoStr === 'atual' || anoStr === '2026' || anoStr === '2033'
      const regVencedor = mapaAno[anoStr] || 'IBS/CBS'

      doc.setFillColor(
        isDest ? 236 : cIdx % 2 === 0 ? 255 : 248,
        isDest ? 253 : cIdx % 2 === 0 ? 255 : 250,
        isDest ? 245 : cIdx % 2 === 0 ? 255 : 252,
      )
      doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
      doc.rect(margin, currentY, contentWidth, 4.8, 'FD')

      doc.setFont('helvetica', isDest ? 'bold' : 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
      doc.text(anoStr === 'atual' ? 'Atual' : anoStr, margin + 3, currentY + 3.3)
      if (isAno2026(item.ano)) {
        doc.text(
          'Fase de teste — compensável integralmente, sem ônus real (art. 348, LC 214/2025)',
          margin + 18,
          currentY + 3.3,
        )
      } else {
        const fTrunc = item.fase.length > 42 ? item.fase.slice(0, 40) + '...' : item.fase
        doc.text(fTrunc, margin + 18, currentY + 3.3)
      }
      doc.text(`${item.aliquotaEfetivaTotal.toFixed(2)}%`, margin + 90, currentY + 3.3)
      doc.text(formatarMoeda(item.impostoEstimado), margin + 120, currentY + 3.3)

      doc.setFont('helvetica', 'bold')
      if (regVencedor === 'IBS/CBS') {
        doc.setTextColor(COR_EMERALD[0], COR_EMERALD[1], COR_EMERALD[2])
      } else {
        doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
      }
      doc.text(regVencedor, margin + 152, currentY + 3.3)

      currentY += 4.8
    })

    currentY += 6
  })

  // ==========================================
  // SEÇÃO: CONCLUSÃO ANALÍTICA COMPARATIVA & VEREDITOS
  // ==========================================
  doc.addPage()
  currentY = 20
  adicionarCabecalhoCompacto()
  currentY = 28

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.text('CONCLUSÃO ANALÍTICA COMPARATIVA & VEREDITOS', margin, currentY)

  currentY += 6

  // Box de Destaque do Campeão em Economia
  const concVencedora = extrairConclusaoDeSimulacao(
    simVencedora.parametros,
    simVencedora.resultados,
  )
  doc.setFillColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.roundedRect(margin, currentY, contentWidth, 28, 2, 2, 'F')
  doc.setFillColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.rect(margin, currentY, 3, 28, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.text('CAMPEÃO EM ECONOMIA TRIBUTÁRIA PROJETADA', margin + 6, currentY + 6.5)

  doc.setFontSize(10.5)
  doc.setTextColor(255, 255, 255)
  doc.text(
    `Cenário Campeão: "${simVencedora.nome}" — Recomendado: ${concVencedora.regimeRecomendado}`,
    margin + 6,
    currentY + 14,
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.6)
  doc.setTextColor(226, 232, 240)
  const resumoCampeao = `Economia Anual: ${concVencedora.economiaAnualStr} (${concVencedora.economiaMensalStr}/mês)  |  Alíquota Projetada: ${concVencedora.aliquotaNova.toFixed(2)}%  |  Regime Base: ${concVencedora.regimeAtualReferencia}`
  doc.text(resumoCampeao, margin + 6, currentY + 21)

  currentY += 34

  // Veredito e Fatores de Cada Cenário Incluído
  simulacoes.forEach((sim, idx) => {
    verificarQuebraPagina(44)
    const conc = extrairConclusaoDeSimulacao(sim.parametros, sim.resultados)
    const isCampeao = sim.id === simVencedora.id

    doc.setFillColor(
      isCampeao ? 245 : COR_BG_LIGHT[0],
      isCampeao ? 250 : COR_BG_LIGHT[1],
      isCampeao ? 247 : COR_BG_LIGHT[2],
    )
    doc.setDrawColor(
      isCampeao ? COR_EMERALD[0] : COR_BORDA[0],
      isCampeao ? COR_EMERALD[1] : COR_BORDA[1],
      isCampeao ? COR_EMERALD[2] : COR_BORDA[2],
    )
    doc.roundedRect(margin, currentY, contentWidth, 38, 2, 2, 'FD')
    doc.setFillColor(
      isCampeao ? COR_DOURADO[0] : COR_VERDE_MEDIO[0],
      isCampeao ? COR_DOURADO[1] : COR_VERDE_MEDIO[1],
      isCampeao ? COR_DOURADO[2] : COR_VERDE_MEDIO[2],
    )
    doc.rect(margin, currentY, 2.5, 38, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
    doc.text(
      `CENÁRIO #${idx + 1}: ${sim.nome.toUpperCase()} ${isCampeao ? '★ (CAMPEÃO EM ECONOMIA)' : ''}`,
      margin + 6,
      currentY + 5.5,
    )

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    const linhasV = doc.splitTextToSize(conc.vereditoTexto, contentWidth - 12)
    doc.text(linhasV, margin + 6, currentY + 10.5)

    // Fatores resumidos
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.8)
    doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
    const fatoresTexto = conc.fatores.map((f, i) => `[Fator ${i + 1}] ${f.titulo}`).join('  |  ')
    const fatoresLinhas = doc.splitTextToSize(fatoresTexto, contentWidth - 12)
    doc.text(fatoresLinhas, margin + 6, currentY + 28)

    currentY += 42
  })

  // ==========================================
  // OBSERVAÇÕES E ASSINATURA
  // ==========================================
  verificarQuebraPagina(60)

  // Box Observações
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'D')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.text('NOTAS TÉCNICAS DO RESPONSÁVEL CONTÁBIL', margin + 5, currentY + 5)

  const anoVencedora =
    simVencedora.parametros.anoTransicaoDashboard === 'atual'
      ? 'atual'
      : simVencedora.parametros.anoTransicaoDashboard ||
        simVencedora.parametros.config?.anoTransicao ||
        2033
  const obsPadrao = isAno2026(anoVencedora)
    ? `Dossiê comparativo emitido para subsidiar o planejamento tributário. Para 2026, vigora o art. 348 da LC 214/2025 (${TEXTO_FASE_TESTE_2026}). O cenário "${simVencedora.nome}" indica a melhor opção entre os regimes vigentes.`
    : `Dossiê comparativo emitido para subsidiar o planejamento tributário. Dentre os cenários avaliados, o "${simVencedora.nome}" apresentou a melhor eficiência tributária líquida consolidada.`

  const obsTexto = observacoesContador || responsavelTecnico?.observacoes || obsPadrao

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.2)
  doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
  const linhasObs = doc.splitTextToSize(obsTexto, contentWidth - 10)
  doc.text(linhasObs, margin + 5, currentY + 10)

  currentY += 26

  // AVISO LEGAL COMPLETO NA PÁGINA FINAL (COM LINK PARA DIAGNÓSTICO 360°)
  verificarQuebraPagina(22)
  const hAvisoLegalComp = desenharAvisoLegalCompletoPDF(doc, margin, currentY, contentWidth)
  currentY += hAvisoLegalComp + 6

  // Bloco de Assinatura
  verificarQuebraPagina(40)
  adicionarBlocoAssinatura(doc, margin, currentY, contentWidth, responsavelTecnico)

  // Rodapé
  aplicarRodapePadrao(doc, margin, pageWidth, pageHeight)

  doc.save(`comparativo-ibs-cbs-${simulacoes.length}-cenarios.pdf`)
}
