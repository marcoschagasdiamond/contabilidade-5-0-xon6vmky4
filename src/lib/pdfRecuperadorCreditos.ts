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

export const COR_VERDE_ESCURO = [10, 26, 19] as const // #0A1A13
export const COR_VERDE_MEDIO = [16, 42, 31] as const // #102A1F
export const COR_DOURADO = [212, 175, 55] as const // #D4AF37
export const COR_TEXTO = [30, 41, 59] as const // slate-800
export const COR_MUTED = [100, 116, 139] as const // slate-500
export const COR_BG_LIGHT = [248, 250, 252] as const // slate-50
export const COR_BORDA = [226, 232, 240] as const // slate-200
export const COR_EMERALD = [16, 185, 129] as const
export const COR_AMBER = [217, 119, 6] as const
export const COR_ROSE = [225, 29, 72] as const

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

  const adicionarCabecalhoCompacto = () => {
    doc.setFillColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
    doc.rect(margin, 10, contentWidth, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
    doc.text('CONTABILIDADE 5.0 — RECUPERADOR DE CRÉDITOS TRIBUTÁRIOS (DIAMOND GROUP)', margin, 8)
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

  const brandX = margin + 24
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.text('CONTABILIDADE 5.0', brandX, 19)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.text('DIAMOND GROUP • RECUPERAÇÃO DE CRÉDITOS TRIBUTÁRIOS & PREVIDENCIÁRIOS', brandX, 26)

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
    `${infoCliente}${segmentoLabel}Análise: "${nomeAnalise}" | Emissão: ${dataString} | Período: 60 Meses`,
    brandX,
    33,
  )

  currentY = 51

  // ==========================================
  // BLOCO: RESPONSÁVEL TÉCNICO
  // ==========================================
  currentY = adicionarBlocoResponsavelTecnico(
    doc,
    margin,
    currentY,
    contentWidth,
    responsavelTecnico,
  )

  // ==========================================
  // BLOCO 1: IDENTIFICAÇÃO DA EMPRESA E DADOS COMUNS
  // ==========================================
  const nomeEmpresaExibir =
    clienteNome || empresa || parametros.configuracoes.empresa || 'Empresa em Análise'
  const cnpjExibir = cnpj || parametros.configuracoes.cnpj || 'Não informado'
  const regimeExibir = parametros.configuracoes.regimeAtual || 'Lucro Presumido'

  doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(margin, currentY, contentWidth, 38, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.text('DADOS GERAIS DO CLIENTE & PARÂMETROS OPERACIONAIS (60 MESES)', margin + 4, currentY + 6)

  // Badge Dourado
  doc.setFillColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.roundedRect(margin + contentWidth - 54, currentY + 2.5, 50, 5, 1, 1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
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
  doc.text('SELIC acumulada por competência', col2X + 42, currentY + 31)

  currentY += 44

  // ==========================================
  // BLOCO 2: DASHBOARD EXECUTIVO — TOTAL RECUPERÁVEL & CENÁRIOS
  // ==========================================
  doc.setFillColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.roundedRect(margin, currentY, contentWidth, 34, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.text('DASHBOARD EXECUTIVO • POTENCIAL RECUPERÁVEL (60 MESES)', margin + 6, currentY + 7)

  // Card Integral
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(203, 213, 225)
  doc.text('Cenário Integral (Todas as teses elegíveis com SELIC):', margin + 6, currentY + 14)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text(formatarMoeda(resultados.totalIntegralCorrigido), margin + 6, currentY + 22)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.text(
    `Principal Original: ${formatarMoeda(resultados.totalIntegralOriginal)}  |  Acréscimo SELIC: +${formatarMoeda(resultados.totalIntegralSelic)}`,
    margin + 6,
    currentY + 29,
  )

  // Card Conservador
  const cardConsWidth = 62
  const cardConsX = margin + contentWidth - cardConsWidth - 6
  doc.setFillColor(COR_VERDE_MEDIO[0], COR_VERDE_MEDIO[1], COR_VERDE_MEDIO[2])
  doc.roundedRect(cardConsX, currentY + 4, cardConsWidth, 26, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(COR_EMERALD[0], COR_EMERALD[1], COR_EMERALD[2])
  doc.text('CENÁRIO CONSERVADOR (FAROL VERDE)', cardConsX + 4, currentY + 9)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text(formatarMoeda(resultados.totalConservadorCorrigido), cardConsX + 4, currentY + 17)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(203, 213, 225)
  doc.text('Apenas teses pacificadas (STF/STJ)', cardConsX + 4, currentY + 23)

  currentY += 40

  // ==========================================
  // BLOCO 3: DISTRIBUIÇÃO POR TRIBUTO & FAROL DE RISCO
  // ==========================================
  verificarQuebraPagina(40)

  doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(margin, currentY, contentWidth, 20, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.text('DISTRIBUIÇÃO DOS CRÉDITOS APURADOS', margin + 4, currentY + 6)

  doc.setFontSize(7.5)
  doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
  doc.setFont('helvetica', 'bold')
  doc.text('Por Bloco de Tributo:', margin + 4, currentY + 13)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `PIS/COFINS: ${formatarMoeda(resultados.totalPisCofinsCorrigido)}  |  Folha & Previdenciário: ${formatarMoeda(resultados.totalFolhaCorrigido)}`,
    margin + 36,
    currentY + 13,
  )

  doc.setFont('helvetica', 'bold')
  doc.text('Por Farol de Risco:', margin + 4, currentY + 17.5)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Verde (Baixo Risco): ${formatarMoeda(resultados.totalVerdeCorrigido)}  |  Amarelo (Risco Moderado): ${formatarMoeda(resultados.totalAmareloCorrigido)}  |  Vermelho (Alto Risco): ${formatarMoeda(resultados.totalVermelhoCorrigido)}`,
    margin + 36,
    currentY + 17.5,
  )

  currentY += 26

  // ==========================================
  // BLOCO 4: DETALHAMENTO DAS TESES DE PIS / COFINS
  // ==========================================
  const tesesPis = resultados.resultadosTeses.filter((t) => t.modulo === 'pis_cofins')

  if (tesesPis.length > 0) {
    verificarQuebraPagina(50)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
    doc.text(
      `BLOCO 1 • CRÉDITOS DE PIS / COFINS (SETOR: ${(parametros.configuracoes.segmento || 'GERAL').toUpperCase()})`,
      margin,
      currentY,
    )

    currentY += 4

    // Tabela PIS/COFINS
    doc.setFillColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
    doc.rect(margin, currentY, contentWidth, 6, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(6.8)
    doc.setFont('helvetica', 'bold')
    doc.text('Tese Tributária & Fundamento', margin + 3, currentY + 4.2)
    doc.text('Farol', margin + 98, currentY + 4.2)
    doc.text('Valor Original', margin + 116, currentY + 4.2)
    doc.text('Correção SELIC', margin + 140, currentY + 4.2)
    doc.text('Total Corrigido', margin + 164, currentY + 4.2)

    currentY += 6

    tesesPis.forEach((t, idx) => {
      verificarQuebraPagina(7)

      doc.setFillColor(
        idx % 2 === 0 ? 255 : 248,
        idx % 2 === 0 ? 255 : 250,
        idx % 2 === 0 ? 255 : 252,
      )
      doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
      doc.rect(margin, currentY, contentWidth, 6.2, 'FD')

      doc.setFont('helvetica', t.ativa ? 'bold' : 'normal')
      doc.setFontSize(6.8)
      doc.setTextColor(
        t.ativa ? COR_TEXTO[0] : COR_MUTED[0],
        t.ativa ? COR_TEXTO[1] : COR_MUTED[1],
        t.ativa ? COR_TEXTO[2] : COR_MUTED[2],
      )

      const titTrunc = t.titulo.length > 52 ? t.titulo.slice(0, 50) + '...' : t.titulo
      doc.text(titTrunc, margin + 3, currentY + 4.2)

      // Farol
      doc.setFont('helvetica', 'bold')
      if (t.farol === 'verde') {
        doc.setTextColor(COR_EMERALD[0], COR_EMERALD[1], COR_EMERALD[2])
        doc.text('VERDE', margin + 98, currentY + 4.2)
      } else if (t.farol === 'amarelo') {
        doc.setTextColor(COR_AMBER[0], COR_AMBER[1], COR_AMBER[2])
        doc.text('AMARELO', margin + 98, currentY + 4.2)
      } else {
        doc.setTextColor(COR_ROSE[0], COR_ROSE[1], COR_ROSE[2])
        doc.text('VERMELHO', margin + 98, currentY + 4.2)
      }

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.8)
      doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
      doc.text(formatarMoeda(t.valorOriginalTotal), margin + 116, currentY + 4.2)
      doc.text(formatarMoeda(t.correcaoSelicTotal), margin + 140, currentY + 4.2)

      doc.setFont('helvetica', 'bold')
      doc.text(formatarMoeda(t.totalCorrigido), margin + 164, currentY + 4.2)

      currentY += 6.2
    })

    currentY += 8
  }

  // ==========================================
  // BLOCO 5: DETALHAMENTO DAS TESES DA FOLHA / PREVIDENCIÁRIO
  // ==========================================
  const tesesFolha = resultados.resultadosTeses.filter((t) => t.modulo === 'folha')

  if (tesesFolha.length > 0) {
    verificarQuebraPagina(50)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
    doc.text(
      `BLOCO 2 • CRÉDITOS DE FOLHA & PREVIDENCIÁRIO (SETOR: ${(parametros.configuracoes.segmento || 'GERAL').toUpperCase()})`,
      margin,
      currentY,
    )

    currentY += 4

    // Tabela Folha
    doc.setFillColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
    doc.rect(margin, currentY, contentWidth, 6, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(6.8)
    doc.setFont('helvetica', 'bold')
    doc.text('Tese Previdenciária & Fundamento', margin + 3, currentY + 4.2)
    doc.text('Farol', margin + 98, currentY + 4.2)
    doc.text('Valor Original', margin + 116, currentY + 4.2)
    doc.text('Correção SELIC', margin + 140, currentY + 4.2)
    doc.text('Total Corrigido', margin + 164, currentY + 4.2)

    currentY += 6

    tesesFolha.forEach((t, idx) => {
      verificarQuebraPagina(7)

      doc.setFillColor(
        idx % 2 === 0 ? 255 : 248,
        idx % 2 === 0 ? 255 : 250,
        idx % 2 === 0 ? 255 : 252,
      )
      doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
      doc.rect(margin, currentY, contentWidth, 6.2, 'FD')

      doc.setFont('helvetica', t.ativa ? 'bold' : 'normal')
      doc.setFontSize(6.8)
      doc.setTextColor(
        t.ativa ? COR_TEXTO[0] : COR_MUTED[0],
        t.ativa ? COR_TEXTO[1] : COR_MUTED[1],
        t.ativa ? COR_TEXTO[2] : COR_MUTED[2],
      )

      const titTrunc = t.titulo.length > 52 ? t.titulo.slice(0, 50) + '...' : t.titulo
      doc.text(titTrunc, margin + 3, currentY + 4.2)

      // Farol
      doc.setFont('helvetica', 'bold')
      if (t.farol === 'verde') {
        doc.setTextColor(COR_EMERALD[0], COR_EMERALD[1], COR_EMERALD[2])
        doc.text('VERDE', margin + 98, currentY + 4.2)
      } else if (t.farol === 'amarelo') {
        doc.setTextColor(COR_AMBER[0], COR_AMBER[1], COR_AMBER[2])
        doc.text('AMARELO', margin + 98, currentY + 4.2)
      } else {
        doc.setTextColor(COR_ROSE[0], COR_ROSE[1], COR_ROSE[2])
        doc.text('VERMELHO', margin + 98, currentY + 4.2)
      }

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.8)
      doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
      doc.text(formatarMoeda(t.valorOriginalTotal), margin + 116, currentY + 4.2)
      doc.text(formatarMoeda(t.correcaoSelicTotal), margin + 140, currentY + 4.2)

      doc.setFont('helvetica', 'bold')
      doc.text(formatarMoeda(t.totalCorrigido), margin + 164, currentY + 4.2)

      currentY += 6.2
    })
  }

  // ==========================================
  // PÁGINA FINAL: QUADRO ANO A ANO, RISCOS, PRÓXIMOS PASSOS, OBSERVAÇÕES & ASSINATURA
  // ==========================================
  doc.addPage()
  currentY = 20
  adicionarCabecalhoCompacto()
  currentY = 28

  // Quadro Ano a Ano (60 Meses)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.text('EVOLUÇÃO TEMPORAL DA RECUPERAÇÃO ANO A ANO (COM CORREÇÃO SELIC)', margin, currentY)

  currentY += 5

  doc.setFillColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.rect(margin, currentY, contentWidth, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(6.8)
  doc.setFont('helvetica', 'bold')
  doc.text('Competência / Ano', margin + 3, currentY + 4.2)
  doc.text('Faturamento Anual Declarado', margin + 38, currentY + 4.2)
  doc.text('Crédito Original', margin + 90, currentY + 4.2)
  doc.text('Correção SELIC Estimada', margin + 124, currentY + 4.2)
  doc.text('Total Recuperável Corrigido', margin + 158, currentY + 4.2)

  currentY += 6

  resultados.totaisPorAno.forEach((anoItem, idx) => {
    doc.setFillColor(
      idx % 2 === 0 ? 255 : 248,
      idx % 2 === 0 ? 255 : 250,
      idx % 2 === 0 ? 255 : 252,
    )
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.rect(margin, currentY, contentWidth, 6, 'FD')

    const fatAno =
      parametros.configuracoes.anosFaturamento.find((a) => a.ano === anoItem.ano)?.faturamento || 0

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.8)
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    doc.text(`Ano-Calendário ${anoItem.ano}`, margin + 3, currentY + 4.2)
    doc.text(formatarMoeda(fatAno), margin + 38, currentY + 4.2)
    doc.text(formatarMoeda(anoItem.valorOriginal), margin + 90, currentY + 4.2)
    doc.text(`+${formatarMoeda(anoItem.correcaoSelic)}`, margin + 124, currentY + 4.2)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
    doc.text(formatarMoeda(anoItem.totalCorrigido), margin + 158, currentY + 4.2)

    currentY += 6
  })

  currentY += 8

  // Box Próximos Passos & Metodologia
  doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(margin, currentY, contentWidth, 26, 2, 2, 'FD')
  doc.setFillColor(COR_DOURADO[0], COR_DOURADO[1], COR_DOURADO[2])
  doc.rect(margin, currentY, 2.5, 26, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.text('PRÓXIMOS PASSOS PARA MONETIZAÇÃO DOS CRÉDITOS', margin + 6, currentY + 5.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
  const passosTexto = [
    '1. Levantamento e Cruzamento Digital: Importação e validação de arquivos SPED Fiscal (EFD ICMS/IPI), EFD-Contribuições, eSocial (eventos S-1200 e S-1210) e DCTF Web dos 60 meses.',
    '2. Retificação e Homologação Administrativa: Transmissão de declarações retificadoras e formalização de Pedidos Eletrônicos de Restituição / Ressarcimento e Declaração de Compensação (PER/DCOMP).',
    '3. Compensação Tributária Contínua: Utilização do crédito deferido no abatimento de tributos federais vincendos de competências futuras (IRPJ, CSLL, PIS, COFINS e Contribuições Previdenciárias).',
  ]
  passosTexto.forEach((p, pIdx) => {
    doc.text(p, margin + 6, currentY + 11 + pIdx * 4.8)
  })

  currentY += 31

  // Box Observações do Analista
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'D')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(COR_VERDE_ESCURO[0], COR_VERDE_ESCURO[1], COR_VERDE_ESCURO[2])
  doc.text('OBSERVAÇÕES DO ANALISTA RESPONSÁVEL', margin + 5, currentY + 5.5)

  const textoObs =
    observacoesAnalista ||
    responsavelTecnico?.observacoes ||
    'Os montantes apurados neste relatório preliminar foram calculados por amostragem e parametrização setorial. A compensação administrativa requer a validação integral dos registros fiscais e contábeis da empresa.'

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
  const linhasObs = doc.splitTextToSize(textoObs, contentWidth - 10)
  doc.text(linhasObs, margin + 5, currentY + 11)

  currentY += 28

  // AVISO TÉCNICO OBRIGATÓRIO (SPED / eSocial / Folha Analítica)
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
    'O valor final homologado e passível de restituição/compensação depende impreterivelmente da análise pormenorizada dos arquivos magnéticos oficiais (SPED Fiscal, EFD-Contribuições, eSocial e Folha de Pagamento Analítica). Esta estimativa prévia não gera direito automático de crédito perante a Secretaria da Receita Federal do Brasil.'
  const linhasAviso = doc.splitTextToSize(avisoTexto, contentWidth - 8)
  doc.text(linhasAviso, margin + 4, currentY + 8.5)

  currentY += 18

  // AVISO LEGAL COMPLETO NA PÁGINA FINAL (COM LINK PARA DIAGNÓSTICO 360°)
  verificarQuebraPagina(24)
  const hAvisoLegalRecup = desenharAvisoLegalCompletoPDF(doc, margin, currentY, contentWidth)
  currentY += hAvisoLegalRecup + 5

  // Bloco de Assinatura
  const cidadeEmpresa = parametros.configuracoes.uf
    ? `São Paulo - ${parametros.configuracoes.uf}`
    : 'São Paulo - SP'
  adicionarBlocoAssinatura(doc, margin, currentY, contentWidth, responsavelTecnico, cidadeEmpresa)

  // Paginação e rodapé padrão
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
      'Contabilidade 5.0 — Diamond Group | Recuperação de Créditos Tributários | contato@contabilidade50.com.br',
      margin,
      pageHeight - 7,
    )
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' })
  }

  // Baixar arquivo
  const nomeSanitizado = (nomeAnalise || 'recuperador')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
  doc.save(`parecer-recuperador-creditos-${nomeSanitizado}.pdf`)
}
