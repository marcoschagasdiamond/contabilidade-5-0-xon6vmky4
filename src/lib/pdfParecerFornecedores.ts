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
import {
  type ResultadoComparadorCotacoes,
  rotuloRegimeFornecedor,
  calcularComparadorCotacoes,
} from './calculoComparadorCotacoes'
import type { HistoricoCotacaoFornecedor } from '@/services/historicoCotacoes'

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
  comparadorAtivo?: ResultadoComparadorCotacoes | null,
  historicoCotacoes?: HistoricoCotacaoFornecedor[] | null,
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

    const infoNcm = r.fornecedor.ncm
      ? `NCM ${r.fornecedor.ncm}${r.fornecedor.ncm_classificado_auto ? ' (Auto LC 214)' : ''}`
      : 'Classif. Manual'

    return [
      `#${idx + 1}`,
      r.fornecedor.nome,
      regLabel,
      classLabel,
      infoNcm,
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
        'Origem NCM',
        'Volume Compras',
        'Crédito Ganho',
        'Custo Líquido',
        'Crédito Perdido',
      ],
    ],
    body: rankingRows,
    theme: 'grid',
    styles: { fontSize: 6.5, cellPadding: 1.6 },
    headStyles: { fillColor: [7, 19, 43], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 7 },
      1: { cellWidth: 34, fontStyle: 'bold' },
      2: { cellWidth: 20 },
      3: { cellWidth: 21 },
      4: { cellWidth: 24, fontStyle: 'bold', textColor: [7, 19, 43] },
      5: { halign: 'right', cellWidth: 19 },
      6: { halign: 'right', cellWidth: 18 },
      7: { halign: 'right', cellWidth: 19 },
      8: { halign: 'right', cellWidth: 20, textColor: [200, 30, 30], fontStyle: 'bold' },
    },
  })

  renderizarRodapeEscritorioPdf(doc, 1, 3)

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

  // Se não houver comparador ativo passado, gera o comparador padrão representativo do usuário
  const comparador =
    comparadorAtivo ||
    calcularComparadorCotacoes(
      [
        {
          id: 'a',
          identificador: 'A',
          fornecedorNome: 'Fornecedor A (Simples Nacional)',
          preco: 92,
          regime: 'simples_nacional',
          aliquotaSimplesCustom: 4.5,
        },
        {
          id: 'b',
          identificador: 'B',
          fornecedorNome: 'Fornecedor B (Lucro Presumido)',
          preco: 100,
          regime: 'lucro_presumido',
          aliquotaSimplesCustom: 4.5,
        },
      ],
      {
        anoTransicao: resumo.anoSelecionado,
        regimeComprador: resumo.regimeComprador,
        classificacaoItem: 'integral',
        percentualCreditoParcial: 50,
      },
    )

  renderizarRodapeEscritorioPdf(doc, 2, 3)

  // PÁGINA 3: COMPARAÇÃO DE COTAÇÕES & PREÇO DE EQUILÍBRIO (BREAK-EVEN)
  doc.addPage()

  // Header página 3
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 0, 210, 22, 'F')
  doc.setFillColor(goldColor[0], goldColor[1], goldColor[2])
  doc.rect(0, 22, 210, 1, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('COMPARAÇÃO DE COTAÇÕES • PREÇO NOMINAL VS. CUSTO LÍQUIDO', 14, 11)
  doc.setFontSize(7.5)
  doc.setTextColor(goldColor[0], goldColor[1], goldColor[2])
  doc.text('DECISÃO TÁTICA DE COMPRA SOB A LC 214/2025 • ANÁLISE DE BREAK-EVEN', 14, 17)

  y = 30

  // Seção 5: Título
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('5. ANÁLISE COMPARATIVA DE COTAÇÕES DE FORNECEDORES', 14, y)
  y += 4

  // Box com parâmetros da cotação
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(14, y, 182, 14, 2, 2, 'F')
  doc.setDrawColor(210, 215, 225)
  doc.roundedRect(14, y, 182, 14, 2, 2, 'S')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(70, 80, 90)
  const descItem =
    comparador.configuracao.classificacaoItem === 'integral'
      ? 'Crédito Integral (100%)'
      : comparador.configuracao.classificacaoItem === 'parcial'
        ? `Crédito Parcial (${comparador.configuracao.percentualCreditoParcial || 50}%)`
        : 'Não Gera Crédito (Insumo Vedado)'

  const totalNcmClassificados = resumo.detalhamentoPorFornecedor.filter(
    (item) => item.fornecedor.ncm,
  ).length

  doc.text(
    `Classificação do Item: ${descItem}   |   Regime do Adquirente: ${regimeFormatado}   |   Itens com NCM: ${totalNcmClassificados} de ${resumo.totalFornecedores}`,
    18,
    y + 6,
  )
  doc.text(
    comparador.volumeMensalInformado
      ? `Volume Mensal Informado: R$ ${comparador.configuracao.volumeMensal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}   |   Economia Anualizada: R$ ${comparador.economiaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano`
      : 'Critério de Avaliação: Custo Líquido de Aquisição = Preço Pago de Compra − Crédito Tributário Recuperável',
    18,
    y + 11,
  )

  y += 18

  // Tabela das cotações comparadas
  const cotacoesTableRows = comparador.cotacoes.map((c) => {
    const isMelhor = c.identificador === comparador.melhorCotacao.identificador
    return [
      `Cotação ${c.identificador}`,
      c.fornecedorNome,
      c.regimeRotulo,
      `${c.aliquotaEfetivaAplicada.toFixed(1)}%`,
      `R$ ${c.precoBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${c.creditoRecuperavel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${c.custoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      isMelhor ? 'RECOMENDADA (Menor Custo)' : 'Opção Alternativa',
    ]
  })

  autoTable(doc, {
    startY: y,
    head: [
      [
        'Item',
        'Fornecedor',
        'Regime Tributário',
        'Alíq. Efetiva',
        'Preço de Face',
        'Crédito Ganho',
        'Custo Líquido',
        'Status',
      ],
    ],
    body: cotacoesTableRows,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [7, 19, 43], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'center', cellWidth: 16 },
      1: { cellWidth: 38, fontStyle: 'bold' },
      2: { cellWidth: 26 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 20, textColor: [46, 204, 113], fontStyle: 'bold' },
      6: { halign: 'right', cellWidth: 22, fontStyle: 'bold' },
      7: { cellWidth: 20, fontStyle: 'bold', halign: 'center' },
    },
  })

  // @ts-expect-error
  y = doc.lastAutoTable.finalY + 8

  // Seção de Preços de Equilíbrio (Break-Even)
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('PREÇO DE EQUILÍBRIO (BREAK-EVEN): A PARTIR DE QUE PREÇO A OUTRA OPÇÃO COMPENSA', 14, y)
  y += 4

  const breakEvenRows = comparador.breakEvens.map((b) => [
    `${b.nomeBase} (${b.base}) vs ${b.nomeComparada} (${b.comparada})`,
    `R$ ${b.precoMaximoBaseParaEquiparar.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    b.descricaoBreakEven,
  ])

  autoTable(doc, {
    startY: y,
    head: [['Relação de Cotações', 'Preço Teto / Piso', 'Condição de Decisão']],
    body: breakEvenRows,
    theme: 'grid',
    styles: { fontSize: 6.8, cellPadding: 2 },
    headStyles: { fillColor: [7, 19, 43], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { fontStyle: 'bold', halign: 'right', cellWidth: 30, textColor: [7, 19, 43] },
      2: { cellWidth: 102 },
    },
  })

  // @ts-expect-error
  y = doc.lastAutoTable.finalY + 8

  // Box do Veredito Executivo
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.roundedRect(14, y, 182, 34, 2, 2, 'F')
  doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2])
  doc.roundedRect(14, y, 182, 34, 2, 2, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(goldColor[0], goldColor[1], goldColor[2])
  doc.text('VEREDITO EXECUTIVO DIAMOND GROUP • RECOMENDAÇÃO DE COMPRA', 18, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(255, 255, 255)
  const linhasVeredito = doc.splitTextToSize(comparador.vereditoDireto, 174)
  doc.text(linhasVeredito, 18, y + 12)

  doc.setFontSize(7)
  doc.setTextColor(210, 220, 235)
  const linhasRec = doc.splitTextToSize(comparador.recomendacaoDetalhada, 174)
  doc.text(linhasRec, 18, y + 19)

  doc.setFontSize(6.5)
  doc.setTextColor(goldColor[0], goldColor[1], goldColor[2])
  const linhasReg = doc.splitTextToSize(comparador.explicacaoRegimes, 174)
  doc.text(linhasReg, 18, y + 29)

  y += 38

  // SEÇÃO: HISTÓRICO DE COTAÇÕES VENCEDORAS REGISTRADAS
  const listaHist =
    historicoCotacoes && historicoCotacoes.length > 0
      ? historicoCotacoes
      : [
          {
            fornecedor_nome: comparador.melhorCotacao.fornecedorNome,
            descricao_item: descItem,
            preco_informado: comparador.melhorCotacao.precoBruto,
            regime: comparador.melhorCotacao.regime,
            percentual_efetivo_simples: comparador.melhorCotacao.aliquotaEfetivaAplicada,
            custo_liquido_calculado: comparador.melhorCotacao.custoLiquido,
            credito_calculado: comparador.melhorCotacao.creditoRecuperavel,
            eh_vencedora: true,
            data_cotacao: new Date().toISOString().split('T')[0],
          },
        ]

  if (listaHist.length > 0) {
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('HISTÓRICO DE COTAÇÕES VENCEDORAS REGISTRADAS NA CARTEIRA', 14, y)
    y += 3.5

    const histRows = listaHist.slice(0, 6).map((h) => {
      const dataFmt = h.data_cotacao
        ? new Date(h.data_cotacao).toLocaleDateString('pt-BR')
        : 'Recente'
      const regimeDesc =
        h.regime === 'simples_nacional'
          ? `Simples (${h.percentual_efetivo_simples?.toFixed(1) || 4.5}%)`
          : h.regime === 'lucro_presumido'
            ? 'Lucro Presumido'
            : 'Lucro Real'

      return [
        dataFmt,
        h.fornecedor_nome,
        h.descricao_item || 'Item / Mercadoria',
        regimeDesc,
        `R$ ${h.preco_informado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${(h.credito_calculado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${h.custo_liquido_calculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        '★ Vencedora',
      ]
    })

    autoTable(doc, {
      startY: y,
      head: [
        [
          'Data',
          'Fornecedor',
          'Item / Insumo',
          'Regime',
          'Preço Face',
          'Crédito Ganho',
          'Custo Líquido',
          'Resultado',
        ],
      ],
      body: histRows,
      theme: 'grid',
      styles: { fontSize: 6.5, cellPadding: 1.8 },
      headStyles: { fillColor: [7, 19, 43], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 16 },
        1: { fontStyle: 'bold', cellWidth: 38 },
        2: { cellWidth: 32 },
        3: { cellWidth: 24 },
        4: { halign: 'right', cellWidth: 20 },
        5: { halign: 'right', cellWidth: 18, textColor: [46, 204, 113] },
        6: { halign: 'right', cellWidth: 20, fontStyle: 'bold' },
        7: { halign: 'center', cellWidth: 14, fontStyle: 'bold', textColor: [7, 19, 43] },
      },
    })
  }

  renderizarRodapeEscritorioPdf(doc, 3, 3)

  // Download do PDF
  const nomeSanitizado = (empresa.nomeEmpresa || 'Empresa')
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '_')
  doc.save(`parecer_fornecedores_${nomeSanitizado}_${resumo.anoSelecionado}.pdf`)
}
