import { jsPDF } from 'jspdf'
import type { ResultadoDiagnosticoCompleto, DadosEntradaDiagnostico } from './regimes'

interface GerarPdfOptions {
  dados: DadosEntradaDiagnostico
  resultado: ResultadoDiagnosticoCompleto
}

/**
 * Utilitário profissional para geração de relatório em PDF do Diagnóstico Tributário Contabilidade 5.0
 * Paleta visual: Verde escuro (#0A1A13) e Verde esmeralda (#145A32 / #2ECC71).
 */
export function gerarRelatorioDiagnosticoPDF({ dados, resultado }: GerarPdfOptions): void {
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

  // Cores institucionais
  const COR_PRIMARIA = [10, 26, 19] as const // #0A1A13
  const COR_SECUNDARIA = [20, 90, 50] as const // #145A32
  const COR_DESTAQUE = [46, 204, 113] as const // #2ECC71
  const COR_TEXTO = [30, 41, 59] as const // slate-800
  const COR_MUTED = [100, 116, 139] as const // slate-500
  const COR_BG_LIGHT = [248, 250, 252] as const // slate-50
  const COR_BORDA = [226, 232, 240] as const // slate-200

  const formatarMoeda = (val: number): string => {
    return (
      'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
    doc.setTextColor(COR_SECUNDARIA[0], COR_SECUNDARIA[1], COR_SECUNDARIA[2])
    doc.text('CONTABILIDADE 5.0 — RELATÓRIO DE DIAGNÓSTICO TRIBUTÁRIO', margin, 8)
  }

  // ==========================================
  // CABEÇALHO PRINCIPAL
  // ==========================================
  doc.setFillColor(COR_PRIMARIA[0], COR_PRIMARIA[1], COR_PRIMARIA[2])
  doc.rect(0, 0, pageWidth, 36, 'F')

  // Faixa de destaque verde
  doc.setFillColor(COR_DESTAQUE[0], COR_DESTAQUE[1], COR_DESTAQUE[2])
  doc.rect(0, 36, pageWidth, 2.5, 'F')

  // Título e subtítulo
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('CONTABILIDADE 5.0', margin, 17)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(COR_DESTAQUE[0], COR_DESTAQUE[1], COR_DESTAQUE[2])
  doc.text('INTELIGÊNCIA TRIBUTÁRIA E GESTÃO CONTÁBIL DE ALTA PERFORMANCE', margin, 23)

  doc.setFontSize(8)
  doc.setTextColor(203, 213, 225)
  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  doc.text(`Simulação gerada em: ${dataHoje} | Documento confidencial`, margin, 30)

  currentY = 46

  // ==========================================
  // BLOCO 1: DADOS DA EMPRESA
  // ==========================================
  doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(margin, currentY, contentWidth, 31, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(COR_SECUNDARIA[0], COR_SECUNDARIA[1], COR_SECUNDARIA[2])
  doc.text('DADOS DA EMPRESA ANALISADA', margin + 4, currentY + 6)

  doc.setFontSize(8.5)
  doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])

  // Coluna 1
  doc.setFont('helvetica', 'bold')
  doc.text('Empresa:', margin + 4, currentY + 12)
  doc.setFont('helvetica', 'normal')
  doc.text(dados.empresa || 'Não informada', margin + 22, currentY + 12)

  doc.setFont('helvetica', 'bold')
  doc.text('CNPJ:', margin + 4, currentY + 17.5)
  doc.setFont('helvetica', 'normal')
  doc.text(dados.cnpj || 'Não informado', margin + 22, currentY + 17.5)

  doc.setFont('helvetica', 'bold')
  doc.text('Contato:', margin + 4, currentY + 23)
  doc.setFont('helvetica', 'normal')
  doc.text(`${dados.nome || 'Não informado'} (${dados.email || '-'})`, margin + 22, currentY + 23)

  doc.setFont('helvetica', 'bold')
  doc.text('WhatsApp:', margin + 4, currentY + 28)
  doc.setFont('helvetica', 'normal')
  doc.text(dados.telefone || 'Não informado', margin + 22, currentY + 28)

  // Coluna 2
  const col2X = margin + 98
  doc.setFont('helvetica', 'bold')
  doc.text('Segmento:', col2X, currentY + 12)
  doc.setFont('helvetica', 'normal')
  doc.text(dados.segmento || '-', col2X + 26, currentY + 12)

  doc.setFont('helvetica', 'bold')
  doc.text('Cidade / ISS:', col2X, currentY + 17.5)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `${resultado.cidade} (${resultado.aliquotaISS.toFixed(1)}%)`,
    col2X + 26,
    currentY + 17.5,
  )

  doc.setFont('helvetica', 'bold')
  doc.text('Regime Atual:', col2X, currentY + 23)
  doc.setFont('helvetica', 'normal')
  doc.text(String(dados.regimeAtual || 'Simples Nacional'), col2X + 26, currentY + 23)

  currentY += 37

  // ==========================================
  // BLOCO 2: RESUMO EXECUTIVO & REGIME RECOMENDADO
  // ==========================================
  doc.setFillColor(COR_PRIMARIA[0], COR_PRIMARIA[1], COR_PRIMARIA[2])
  doc.roundedRect(margin, currentY, contentWidth, 36, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(COR_DESTAQUE[0], COR_DESTAQUE[1], COR_DESTAQUE[2])
  doc.text('DIAGNÓSTICO EXECUTIVO • REGIME RECOMENDADO', margin + 6, currentY + 8)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text(resultado.regimeRecomendado, margin + 6, currentY + 16)

  if (resultado.empateTecnico && resultado.regimeEmpatado) {
    doc.setFontSize(8)
    doc.setTextColor(COR_DESTAQUE[0], COR_DESTAQUE[1], COR_DESTAQUE[2])
    doc.text(
      `(Empate técnico com ${resultado.regimeEmpatado} — diferença inferior a 1,5%)`,
      margin + 6,
      currentY + 21,
    )
  }

  // Card de economia destacada
  const ecoBoxWidth = 56
  const ecoBoxX = margin + contentWidth - ecoBoxWidth - 6
  doc.setFillColor(20, 90, 50)
  doc.roundedRect(ecoBoxX, currentY + 5, ecoBoxWidth, 26, 2, 2, 'F')

  doc.setFontSize(7)
  doc.setTextColor(203, 213, 225)
  doc.text('ECONOMIA ANUAL ESTIMADA', ecoBoxX + 4, currentY + 11)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(COR_DESTAQUE[0], COR_DESTAQUE[1], COR_DESTAQUE[2])
  doc.text(formatarMoeda(resultado.economiaAnual), ecoBoxX + 4, currentY + 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(255, 255, 255)
  doc.text('em relação à 2ª melhor alternativa', ecoBoxX + 4, currentY + 23)

  // Resumo em linguagem simples
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(226, 232, 240)
  const resumoLinhas = doc.splitTextToSize(
    resultado.resumoSimplesTexto || resultado.explicacaoRecomendacao,
    contentWidth - ecoBoxWidth - 16,
  )
  doc.text(resumoLinhas, margin + 6, currentY + 26)

  currentY += 41

  // ==========================================
  // BLOCO 3: RANKING COMPARATIVO DOS REGIMES
  // ==========================================
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(COR_PRIMARIA[0], COR_PRIMARIA[1], COR_PRIMARIA[2])
  doc.text('RANKING COMPARATIVO DE REGIMES TRIBUTÁRIOS', margin, currentY + 4)

  currentY += 7

  // Cabeçalho da Tabela
  doc.setFillColor(COR_SECUNDARIA[0], COR_SECUNDARIA[1], COR_SECUNDARIA[2])
  doc.rect(margin, currentY, contentWidth, 7, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('Posição', margin + 3, currentY + 4.8)
  doc.text('Regime Fiscal', margin + 20, currentY + 4.8)
  doc.text('Status / Elegibilidade', margin + 60, currentY + 4.8)
  doc.text('Carga Tributária Anual', margin + 105, currentY + 4.8)
  doc.text('Alíq. Efetiva', margin + 148, currentY + 4.8)

  currentY += 7

  // Linhas do ranking
  resultado.ranking.forEach((item, idx) => {
    const isPrimeiro = idx === 0
    doc.setFillColor(
      isPrimeiro ? 236 : idx % 2 === 0 ? 255 : 248,
      isPrimeiro ? 253 : idx % 2 === 0 ? 255 : 250,
      isPrimeiro ? 245 : idx % 2 === 0 ? 255 : 252,
    )
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.rect(margin, currentY, contentWidth, 8, 'FD')

    doc.setFont('helvetica', isPrimeiro ? 'bold' : 'normal')
    doc.setFontSize(8)
    doc.setTextColor(
      isPrimeiro ? COR_SECUNDARIA[0] : COR_TEXTO[0],
      isPrimeiro ? COR_SECUNDARIA[1] : COR_TEXTO[1],
      isPrimeiro ? COR_SECUNDARIA[2] : COR_TEXTO[2],
    )

    doc.text(`${item.posicao}º`, margin + 4, currentY + 5.2)
    doc.text(item.regime, margin + 20, currentY + 5.2)

    if (item.elegivel) {
      doc.setTextColor(34, 139, 34)
      doc.text(isPrimeiro ? '✓ Recomendado' : 'Elegível', margin + 60, currentY + 5.2)
    } else {
      doc.setTextColor(185, 28, 28)
      doc.text('Inelegível (teto fiscal)', margin + 60, currentY + 5.2)
    }

    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    doc.text(item.elegivel ? formatarMoeda(item.cargaAnual) : '—', margin + 105, currentY + 5.2)
    doc.text(
      item.elegivel ? `${item.aliquotaEfetiva.toFixed(2)}%` : '—',
      margin + 148,
      currentY + 5.2,
    )

    currentY += 8
  })

  currentY += 6

  // ==========================================
  // BLOCO 4: POR QUE ESTE REGIME? (MOTIVOS DIDÁTICOS)
  // ==========================================
  verificarQuebraPagina(40)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(COR_PRIMARIA[0], COR_PRIMARIA[1], COR_PRIMARIA[2])
  doc.text('POR QUE ESTE REGIME É O MAIS VANTAJOSO?', margin, currentY + 3)

  currentY += 6

  doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])

  const boxTopY = currentY
  let internalY = currentY + 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])

  resultado.motivosRecomendacao.forEach((motivo) => {
    const lines = doc.splitTextToSize(`• ${motivo}`, contentWidth - 8)
    doc.text(lines, margin + 4, internalY)
    internalY += lines.length * 4.2
  })

  // Desenha o box com altura dinâmica
  const boxHeight = internalY - boxTopY + 3
  doc.roundedRect(margin, boxTopY, contentWidth, boxHeight, 2, 2, 'D')

  currentY = internalY + 7

  // ==========================================
  // BLOCO 5: REGRAS FISCAIS APLICADAS
  // ==========================================
  verificarQuebraPagina(45)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(COR_PRIMARIA[0], COR_PRIMARIA[1], COR_PRIMARIA[2])
  doc.text('REGRAS FISCAIS APLICADAS NESTA SIMULAÇÃO', margin, currentY + 3)

  currentY += 6

  resultado.regrasAplicadas.forEach((regra) => {
    verificarQuebraPagina(20)

    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])

    // Pequena barra colorida lateral conforme o tipo
    let borderFill: readonly [number, number, number] = COR_SECUNDARIA
    if (regra.tipo === 'alerta') borderFill = [217, 119, 6] // amber
    if (regra.tipo === 'sucesso') borderFill = [16, 185, 129] // emerald

    const startRegraY = currentY
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    doc.text(regra.titulo, margin + 5, currentY + 5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
    const descLines = doc.splitTextToSize(regra.descricao, contentWidth - 10)
    doc.text(descLines, margin + 5, currentY + 9)

    let alturaRegra = 12 + descLines.length * 3.5

    if (regra.impacto) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(7)
      doc.setTextColor(COR_SECUNDARIA[0], COR_SECUNDARIA[1], COR_SECUNDARIA[2])
      const impLines = doc.splitTextToSize(`Impacto: ${regra.impacto}`, contentWidth - 10)
      doc.text(impLines, margin + 5, currentY + 10 + descLines.length * 3.5)
      alturaRegra += impLines.length * 3.5
    }

    doc.roundedRect(margin, startRegraY, contentWidth, alturaRegra, 1.5, 1.5, 'D')
    doc.setFillColor(borderFill[0], borderFill[1], borderFill[2])
    doc.rect(margin, startRegraY, 2.5, alturaRegra, 'F')

    currentY += alturaRegra + 3.5
  })

  // ==========================================
  // BLOCO 6: GATILHOS E ALERTAS PARA REVISÃO
  // ==========================================
  verificarQuebraPagina(35)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(COR_PRIMARIA[0], COR_PRIMARIA[1], COR_PRIMARIA[2])
  doc.text('GATILHOS DE MUDANÇA E ALERTAS OPERACIONAIS', margin, currentY + 3)

  currentY += 6

  resultado.gatilhosMudanca.forEach((gatilho) => {
    verificarQuebraPagina(16)
    doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])

    const startGatY = currentY
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    doc.text(`⚡ ${gatilho.condicao || gatilho.titulo}`, margin + 4, currentY + 4.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
    const textoDescricao = gatilho.descricao || ''
    const recomendLines = doc.splitTextToSize(textoDescricao, contentWidth - 8)
    doc.text(recomendLines, margin + 4, currentY + 9)

    const altGat = 11 + recomendLines.length * 3.2
    doc.roundedRect(margin, startGatY, contentWidth, altGat, 1.5, 1.5, 'FD')
    currentY += altGat + 3
  })

  // ==========================================
  // BLOCO 7: DETALHAMENTO TÉCNICO POR TRIBUTO
  // ==========================================
  verificarQuebraPagina(40)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(COR_PRIMARIA[0], COR_PRIMARIA[1], COR_PRIMARIA[2])
  doc.text('DETALHAMENTO TÉCNICO ESTIMADO POR TRIBUTO', margin, currentY + 3)

  currentY += 6

  // Tabela de Detalhes
  doc.setFillColor(COR_PRIMARIA[0], COR_PRIMARIA[1], COR_PRIMARIA[2])
  doc.rect(margin, currentY, contentWidth, 6.5, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.text('Componente / Tributo', margin + 3, currentY + 4.5)
  doc.text('Simples Nacional', margin + 55, currentY + 4.5)
  doc.text('Lucro Presumido', margin + 98, currentY + 4.5)
  doc.text('Lucro Real', margin + 142, currentY + 4.5)

  currentY += 6.5

  const linhasTecnicas = [
    {
      nome: 'IRPJ (Imposto de Renda)',
      simples: 'Embutido no DAS',
      presumido: formatarMoeda(resultado.presumido.detalhes.irpj || 0),
      real: formatarMoeda(resultado.real.detalhes.irpj || 0),
    },
    {
      nome: 'CSLL (Contribuição Social)',
      simples: 'Embutido no DAS',
      presumido: formatarMoeda(resultado.presumido.detalhes.csll || 0),
      real: formatarMoeda(resultado.real.detalhes.csll || 0),
    },
    {
      nome: 'PIS / COFINS',
      simples: 'Embutido no DAS',
      presumido: formatarMoeda(resultado.presumido.detalhes.pisCofins || 0),
      real: formatarMoeda(resultado.real.detalhes.pisCofins || 0),
    },
    {
      nome: `ISS / ICMS (${resultado.cidade})`,
      simples: 'Embutido no DAS',
      presumido: formatarMoeda(resultado.presumido.detalhes.icmsOuIss || 0),
      real: formatarMoeda(resultado.real.detalhes.icmsOuIss || 0),
    },
    {
      nome: 'Carga Anual Consolidada',
      simples: resultado.simples.elegivel
        ? formatarMoeda(resultado.simples.cargaAnual)
        : 'Inelegível',
      presumido: resultado.presumido.elegivel
        ? formatarMoeda(resultado.presumido.cargaAnual)
        : 'Inelegível',
      real: formatarMoeda(resultado.real.cargaAnual),
      destaque: true,
    },
  ]

  linhasTecnicas.forEach((lin, idx) => {
    doc.setFillColor(
      lin.destaque ? 240 : idx % 2 === 0 ? 255 : 248,
      lin.destaque ? 253 : idx % 2 === 0 ? 255 : 250,
      lin.destaque ? 244 : idx % 2 === 0 ? 255 : 252,
    )
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.rect(margin, currentY, contentWidth, 7, 'FD')

    doc.setFont('helvetica', lin.destaque ? 'bold' : 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(
      lin.destaque ? COR_SECUNDARIA[0] : COR_TEXTO[0],
      lin.destaque ? COR_SECUNDARIA[1] : COR_TEXTO[1],
      lin.destaque ? COR_SECUNDARIA[2] : COR_TEXTO[2],
    )

    doc.text(lin.nome, margin + 3, currentY + 4.8)
    doc.text(lin.simples, margin + 55, currentY + 4.8)
    doc.text(lin.presumido, margin + 98, currentY + 4.8)
    doc.text(lin.real, margin + 142, currentY + 4.8)

    currentY += 7
  })

  currentY += 8

  // ==========================================
  // BLOCO 8: AVISO LEGAL E LIMITAÇÕES DA SIMULAÇÃO
  // ==========================================
  verificarQuebraPagina(30)

  doc.setFillColor(254, 242, 242)
  doc.setDrawColor(254, 202, 202)
  doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(185, 28, 28)
  doc.text('AVISO LEGAL E LIMITAÇÕES DESTA SIMULAÇÃO TRIBUTÁRIA', margin + 4, currentY + 5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(127, 29, 29)
  const avisoLinhas = doc.splitTextToSize(
    'Este diagnóstico é uma simulação preliminar e estimativa fiscal elaborada com base nas informações prestadas pelo usuário e nas tabelas da legislação federal e municipal vigente. Não substitui o planejamento tributário formal, análise de NCMs, benefícios fiscais estaduais (ST/DIFAL) ou parecer emitido por contador registrado perante o CRC. A opção definitiva de regime ocorre em janeiro de cada exercício fiscal.',
    contentWidth - 8,
  )
  doc.text(avisoLinhas, margin + 4, currentY + 9.5)

  // ==========================================
  // RODAPÉ EM TODAS AS PÁGINAS
  // ==========================================
  const totalPages = doc.internal.pages.length - 1
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
    doc.text(
      'Contabilidade 5.0 — Gestão Contábil, Fiscal & Financeira Integrada | contato@contabilidade50.com.br',
      margin,
      pageHeight - 8,
    )
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 8)
  }

  // Download do arquivo PDF
  const nomeSanitizado = (dados.empresa || 'empresa')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
  const nomeArquivo = `Diagnostico_Tributario_${nomeSanitizado}_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(nomeArquivo)
}
