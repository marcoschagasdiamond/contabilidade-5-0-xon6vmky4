/**
 * Gerador de Parecer Executivo em PDF para a Etapa 06: Análise de Fornecedores.
 *
 * Padrão Diamond Group:
 * - Sem ícones ou emojis nos elementos gráficos
 * - Cabeçalho escuro #07132B com acento dourado #D4AF37
 * - Dados da Empresa ativa
 * - Rodapé oficial com a identidade do escritório adquirente via renderizarRodapeEscritorioPdf
 * - Tabelas de ranking, comparativo por regime e evolução 2026-2033
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { renderizarRodapeEscritorioPdf } from './pdfIdentidadeEscritorio'
import type { ResumoCarteiraFornecedores } from './calculoFornecedores'

export interface DadosEmpresaPdfFornecedores {
  nomeEmpresa: string
  cnpj?: string
  cidade?: string
  uf?: string
  segmento?: string
  regimeAtual?: string
}

export function gerarPdfParecerFornecedores(
  resumo: ResumoCarteiraFornecedores,
  empresa: DadosEmpresaPdfFornecedores,
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const primaryColor = [7, 19, 43] // #07132B
  const goldColor = [212, 175, 55] // #D4AF37
  const greenColor = [46, 204, 113] // #2ECC71
  const redColor = [231, 76, 60] // #E74C3C

  // PÁGINA 1
  // Header executivo
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 0, 210, 36, 'F')

  // Faixa dourada decorativa
  doc.setFillColor(goldColor[0], goldColor[1], goldColor[2])
  doc.rect(0, 36, 210, 1.5, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('DIAMOND INTELLIGENCE • ECOSSISTEMA CORPORATIVO', 14, 12)

  doc.setFontSize(16)
  doc.setTextColor(goldColor[0], goldColor[1], goldColor[2])
  doc.text('PARECER TÉCNICO • ANÁLISE DE FORNECEDORES (ETAPA 06)', 14, 21)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(220, 225, 235)
  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  doc.text(
    `EMPRESA: ${empresa.nomeEmpresa || 'Cliente Ativo'} | Emissão: ${dataHoje} | Base Legal: EC 132/2023 · LC 214/2025`,
    14,
    29,
  )

  let y = 46

  // Box: Identificação do Cenário Avaliado
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(14, y, 182, 22, 2, 2, 'F')
  doc.setDrawColor(210, 215, 225)
  doc.roundedRect(14, y, 182, 22, 2, 2, 'S')

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('DADOS DA EMPRESA E CENÁRIO DA ANÁLISE', 18, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(80, 90, 100)
  const linha1 = `Razão Social: ${empresa.nomeEmpresa || 'Não informada'}   |   CNPJ: ${empresa.cnpj || 'Não informado'}   |   Segmento: ${empresa.segmento || 'Geral'}`
  const regimeFormatado =
    resumo.regimeComprador === 'lucro_real'
      ? 'Lucro Real'
      : resumo.regimeComprador === 'lucro_presumido'
        ? 'Lucro Presumido'
        : 'Simples Nacional'
  const linha2 = `Regime do Adquirente (Etapa 06): ${regimeFormatado}   |   Ano da Transição em Foco: ${resumo.anoSelecionado}   |   Total de Fornecedores: ${resumo.totalFornecedores}`

  doc.text(linha1, 18, y + 12)
  doc.text(linha2, 18, y + 18)

  y += 28

  // Cards de Totais Executivos
  const cardW = 43
  const cardH = 22
  const gap = 3.3

  // Card 1: Volume Compras
  doc.setFillColor(248, 249, 251)
  doc.roundedRect(14, y, cardW, cardH, 2, 2, 'F')
  doc.setDrawColor(220, 225, 235)
  doc.roundedRect(14, y, cardW, cardH, 2, 2, 'S')
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(110, 120, 130)
  doc.text('VOLUME TOTAL COMPRAS', 17, y + 6)
  doc.setFontSize(10)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text(
    `R$ ${resumo.volumeTotalCompras.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    17,
    y + 14,
  )

  // Card 2: Crédito Aproveitável
  doc.setFillColor(248, 249, 251)
  doc.roundedRect(14 + cardW + gap, y, cardW, cardH, 2, 2, 'F')
  doc.setDrawColor(220, 225, 235)
  doc.roundedRect(14 + cardW + gap, y, cardW, cardH, 2, 2, 'S')
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(110, 120, 130)
  doc.text('CRÉDITO APROVEITÁVEL', 17 + cardW + gap, y + 6)
  doc.setFontSize(10)
  doc.setTextColor(greenColor[0], greenColor[1], greenColor[2])
  doc.text(
    `R$ ${resumo.creditoAproveitavelTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    17 + cardW + gap,
    y + 14,
  )

  // Card 3: Custo Líquido
  doc.setFillColor(248, 249, 251)
  doc.roundedRect(14 + (cardW + gap) * 2, y, cardW, cardH, 2, 2, 'F')
  doc.setDrawColor(220, 225, 235)
  doc.roundedRect(14 + (cardW + gap) * 2, y, cardW, cardH, 2, 2, 'S')
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(110, 120, 130)
  doc.text('CUSTO LÍQUIDO TOTAL', 17 + (cardW + gap) * 2, y + 6)
  doc.setFontSize(10)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text(
    `R$ ${resumo.custoLiquidoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    17 + (cardW + gap) * 2,
    y + 14,
  )

  // Card 4: Crédito Perdido (Gargalo)
  doc.setFillColor(254, 242, 242)
  doc.roundedRect(14 + (cardW + gap) * 3, y, cardW, cardH, 2, 2, 'F')
  doc.setDrawColor(252, 165, 165)
  doc.roundedRect(14 + (cardW + gap) * 3, y, cardW, cardH, 2, 2, 'S')
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(redColor[0], redColor[1], redColor[2])
  doc.text('CRÉDITO PERDIDO (GAP)', 17 + (cardW + gap) * 3, y + 6)
  doc.setFontSize(10)
  doc.setTextColor(redColor[0], redColor[1], redColor[2])
  doc.text(
    `R$ ${resumo.creditoPerdidoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    17 + (cardW + gap) * 3,
    y + 14,
  )

  y += 28

  // Título Seção: Distribuição por Regime
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('1. DISTRIBUIÇÃO DA CARTEIRA POR REGIME TRIBUTÁRIO DO FORNECEDOR', 14, y)
  y += 3

  const distRows = [
    [
      'Lucro Real',
      String(resumo.distribuicaoPorRegime.lucroReal.quantidade),
      `R$ ${resumo.distribuicaoPorRegime.lucroReal.volume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${resumo.distribuicaoPorRegime.lucroReal.creditoAproveitado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${resumo.distribuicaoPorRegime.lucroReal.perda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      'Crédito integral do regime regular (~26,5% na reforma plena)',
    ],
    [
      'Lucro Presumido',
      String(resumo.distribuicaoPorRegime.lucroPresumido.quantidade),
      `R$ ${resumo.distribuicaoPorRegime.lucroPresumido.volume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${resumo.distribuicaoPorRegime.lucroPresumido.creditoAproveitado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${resumo.distribuicaoPorRegime.lucroPresumido.perda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      'Gera crédito integral de IBS/CBS idêntico ao Lucro Real',
    ],
    [
      'Simples Nacional',
      String(resumo.distribuicaoPorRegime.simplesNacional.quantidade),
      `R$ ${resumo.distribuicaoPorRegime.simplesNacional.volume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${resumo.distribuicaoPorRegime.simplesNacional.creditoAproveitado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${resumo.distribuicaoPorRegime.simplesNacional.perda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      'Transfere apenas a parcela interna do DAS (~3,5% a 7,0% LC 214)',
    ],
    [
      'Misto (Proporcional)',
      String(resumo.distribuicaoPorRegime.misto.quantidade),
      `R$ ${resumo.distribuicaoPorRegime.misto.volume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${resumo.distribuicaoPorRegime.misto.creditoAproveitado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${resumo.distribuicaoPorRegime.misto.perda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      'Crédito ponderado conforme proporção declarada de compras',
    ],
  ]

  autoTable(doc, {
    startY: y,
    head: [
      [
        'Regime Fornecedor',
        'Qtd',
        'Volume de Compras',
        'Crédito Aproveitado',
        'Crédito Perdido',
        'Impacto Tributário',
      ],
    ],
    body: distRows,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [7, 19, 43], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 28 },
      1: { halign: 'center', cellWidth: 10 },
      2: { halign: 'right', cellWidth: 32 },
      3: { halign: 'right', cellWidth: 32 },
      4: { halign: 'right', cellWidth: 30, textColor: [200, 30, 30] },
      5: { cellWidth: 50 },
    },
  })

  // @ts-expect-error
  y = doc.lastAutoTable.finalY + 8

  // Título Seção: Ranking dos Maiores Gargalos
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text(
    `2. RANKING DE GARGALOS: MAIORES PERDAS DE CRÉDITO NO ANO ${resumo.anoSelecionado}`,
    14,
    y,
  )
  y += 3

  const rankingRows = resumo.rankingGargalos.slice(0, 10).map((r, idx) => {
    const regLabel =
      r.fornecedor.regime === 'lucro_real'
        ? 'Lucro Real'
        : r.fornecedor.regime === 'lucro_presumido'
          ? 'Lucro Presumido'
          : r.fornecedor.regime === 'simples_nacional'
            ? 'Simples Nacional'
            : `Misto (${r.fornecedor.proporcao_misto || 50}%)`

    const classLabel =
      r.fornecedor.classificacao_credito === 'integral'
        ? 'Integral (100%)'
        : r.fornecedor.classificacao_credito === 'parcial'
          ? `Parcial (${r.fornecedor.percentual_credito_parcial || 50}%)`
          : 'Não gera (0%)'

    return [
      `#${idx + 1}`,
      r.fornecedor.nome,
      regLabel,
      classLabel,
      `R$ ${r.volumeCompras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${r.creditoAproveitavel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${r.custoLiquidoAquisicao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${r.creditoPerdido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    ]
  })

  autoTable(doc, {
    startY: y,
    head: [
      [
        '#',
        'Fornecedor',
        'Regime',
        'Classificação Item',
        'Volume Compras',
        'Crédito Ganho',
        'Custo Líquido',
        'Crédito Perdido',
      ],
    ],
    body: rankingRows,
    theme: 'grid',
    styles: { fontSize: 6.8, cellPadding: 1.8 },
    headStyles: { fillColor: [7, 19, 43], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 38, fontStyle: 'bold' },
      2: { cellWidth: 24 },
      3: { cellWidth: 22 },
      4: { halign: 'right', cellWidth: 23 },
      5: { halign: 'right', cellWidth: 21 },
      6: { halign: 'right', cellWidth: 22 },
      7: { halign: 'right', cellWidth: 24, textColor: [200, 30, 30], fontStyle: 'bold' },
    },
  })

  renderizarRodapeEscritorioPdf(doc, 1, 2)

  // PÁGINA 2: EVOLUÇÃO ANO A ANO 2026-2033 E PARECER CONCLUSIVO
  doc.addPage()

  // Header página 2
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 0, 210, 22, 'F')
  doc.setFillColor(goldColor[0], goldColor[1], goldColor[2])
  doc.rect(0, 22, 210, 1, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('CRONOGRAMA DE TRANSIÇÃO 2026–2033 • ANÁLISE DE FORNECEDORES', 14, 11)
  doc.setFontSize(7.5)
  doc.setTextColor(goldColor[0], goldColor[1], goldColor[2])
  doc.text('IMPACTO DA EC 132/2023 E LC 214/2025 SOBRE O CRÉDITO DE ENTRADA', 14, 17)

  y = 30

  // Título Tabela Evolução
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('3. COMPARAÇÃO DE TODOS OS ANOS DA TRANSIÇÃO (2026 A 2033)', 14, y)
  y += 3

  const evolucaoRows = resumo.evolucaoAnos.map((ev) => {
    const isAnoFoco = ev.ano === resumo.anoSelecionado
    return [
      isAnoFoco ? `${ev.ano} (Foco)` : String(ev.ano),
      `${ev.aliquotaRegular.toFixed(1)}%`,
      `${ev.aliquotaSimples.toFixed(1)}%`,
      `R$ ${resumo.volumeTotalCompras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${ev.creditoAproveitavelTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${ev.custoLiquidoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${ev.creditoPerdidoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    ]
  })

  autoTable(doc, {
    startY: y,
    head: [
      [
        'Ano',
        'Alíq. Regular',
        'Alíq. Simples',
        'Volume Total',
        'Crédito Carteira',
        'Custo Líquido',
        'Perda Acumulada',
      ],
    ],
    body: evolucaoRows,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [7, 19, 43], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'center', cellWidth: 20 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 29 },
      5: { halign: 'right', cellWidth: 29 },
      6: { halign: 'right', cellWidth: 30, textColor: [200, 30, 30], fontStyle: 'bold' },
    },
  })

  // @ts-expect-error
  y = doc.lastAutoTable.finalY + 10

  // Parecer Técnico Conclusivo
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('4. PARECER TÉCNICO E RECOMENDAÇÕES ESTRATÉGICAS', 14, y)
  y += 5

  doc.setFillColor(248, 249, 251)
  doc.roundedRect(14, y, 182, 80, 2, 2, 'F')
  doc.setDrawColor(210, 215, 225)
  doc.roundedRect(14, y, 182, 80, 2, 2, 'S')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.8)
  doc.setTextColor(50, 60, 70)

  const recomendacoes = [
    `1. Avaliação do Regime do Adquirente: A empresa compradora foi apurada como optante do ${regimeFormatado}. Se o adquirente permanecer no Simples Nacional tradicional, a perda de crédito é mitigada por não haver não-cumulatividade contra o DAS; contudo, para empresas do Lucro Real e Presumido, a compra de fornecedores do Simples gera um gap de crédito de até ${(resumo.evolucaoAnos.find((e) => e.ano === 2033)?.aliquotaRegular || 26.5) - (resumo.evolucaoAnos.find((e) => e.ano === 2033)?.aliquotaSimples || 6.5)} pontos percentuais.`,
    `2. Renegociação de Preço de Compra: Fornecedores do Simples Nacional que não transferem crédito pleno devem praticar desconto comercial de face equivalente à perda de crédito tributário gerada no adquirente, preservando o Custo Líquido de Aquisição da sua empresa.`,
    `3. Classificação de Itens e Produtos: Os produtos classificados como "Não gera crédito" desfrutam de neutralidade fiscal de aquisição — isto é, o preço nominal de face define integralmente a decisão de compra, sem prejuízo ao crédito tributário da empresa.`,
    `4. Planejamento para a Transição Plena (2033): A perda potencial acumulada da carteira atinge R$ ${resumo.evolucaoAnos.find((e) => e.ano === 2033)?.creditoPerdidoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'} em 2033. Recomenda-se qualificar os principais gargalos e incentivar fornecedores estratégicos a avaliarem a opção de recolhimento de IBS/CBS por fora (Simples Híbrido - LC 214/2025 art. 41, § 3º).`,
  ]

  let textY = y + 7
  recomendacoes.forEach((rec) => {
    const linhas = doc.splitTextToSize(rec, 174)
    doc.text(linhas, 18, textY)
    textY += linhas.length * 4 + 2
  })

  renderizarRodapeEscritorioPdf(doc, 2, 2)

  // Download do PDF
  const nomeSanitizado = (empresa.nomeEmpresa || 'Empresa')
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '_')
  doc.save(`parecer_fornecedores_${nomeSanitizado}_${resumo.anoSelecionado}.pdf`)
}
