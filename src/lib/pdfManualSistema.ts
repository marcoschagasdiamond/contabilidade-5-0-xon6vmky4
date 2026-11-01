import { jsPDF } from 'jspdf'
import { renderizarRodapeEscritorioPdf } from '@/lib/pdfIdentidadeEscritorio'

// Paleta Diamond Group
const COR_NAVY = [7, 19, 43] as const // #07132B
const COR_GOLD = [212, 175, 55] as const // #D4AF37
const COR_TEXTO = [30, 41, 59] as const // slate-800
const COR_MUTED = [100, 116, 139] as const // slate-500
const COR_BG_LIGHT = [248, 250, 252] as const // slate-50
const COR_BORDA = [226, 232, 240] as const // slate-200
const COR_EMERALD = [46, 204, 113] as const // #2ECC71

export interface SecaoManualPdf {
  id: string
  titulo: string
  subtitulo?: string
  conteudo: string[]
  itensDestaque?: Array<{
    rotulo: string
    descricao: string
  }>
  tabela?: {
    cabecalhos: string[]
    linhas: string[][]
  }
}

export interface ManualPdfOptions {
  perfilFiltro?: string // 'todos' | 'empresario' | 'analista' | 'admin'
  secoes: SecaoManualPdf[]
  usuarioNome?: string
  perfilUsuario?: string
}

function aplicarCabecalhoManual(doc: jsPDF, tituloSecao: string, subtituloSecao?: string): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 16

  // Faixa Superior Navy #07132B
  doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.rect(0, 0, pageWidth, 28, 'F')

  // Faixa Dourada Diamond #D4AF37
  doc.setFillColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
  doc.rect(0, 28, pageWidth, 1.5, 'F')

  // Topo do Header
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('CONTABILIDADE 5.0 • DIAMOND GROUP', margin, 11)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
  doc.text(
    'MANUAL OFICIAL OPERACIONAL & ESTRATÉGICO DO SISTEMA (EC 132/2023 · LC 214/2025)',
    margin,
    17,
  )

  doc.setFontSize(7)
  doc.setTextColor(203, 213, 225)
  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  doc.text(
    `Edição: 2025/2026  |  Emissão: ${dataHoje}  |  Padrão Corporativo Diamond Group`,
    margin,
    23,
  )

  // Subtítulo da seção logo abaixo da barra dourada
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.text(tituloSecao.toUpperCase(), margin, 38)

  if (subtituloSecao) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
    doc.text(subtituloSecao, margin, 43)
  }

  doc.setDrawColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
  doc.setLineWidth(0.6)
  doc.line(margin, 46, margin + 45, 46)

  return 52
}

function aplicarRodapeManual(doc: jsPDF) {
  const totalPages = doc.internal.pages.length - 1
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 16

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.setLineWidth(0.3)
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)

    renderizarRodapeEscritorioPdf(doc, i, totalPages, pageHeight - 7)
  }
}

export function gerarManualPDF(options: ManualPdfOptions): void {
  const { secoes, perfilFiltro = 'todos', usuarioNome } = options

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margin = 16
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - margin * 2

  // ==========================================
  // CAPA / ABERTURA DO MANUAL
  // ==========================================
  // Fundo Navy estilizado na capa
  doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  // Moldura dourada
  doc.setDrawColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
  doc.setLineWidth(1)
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20)

  // Barra de topo dourada interna
  doc.setFillColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
  doc.rect(14, 14, pageWidth - 28, 3, 'F')

  let yCapa = 45
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text('CONTABILIDADE 5.0', margin + 6, yCapa)

  yCapa += 8
  doc.setFontSize(11)
  doc.setTextColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
  doc.text('DIAMOND GROUP • INTELIGÊNCIA TRIBUTÁRIA E GESTÃO CONTÁBIL', margin + 6, yCapa)

  yCapa += 20
  doc.setDrawColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
  doc.setLineWidth(0.5)
  doc.line(margin + 6, yCapa, margin + 80, yCapa)

  yCapa += 16
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text('MANUAL OPERACIONAL', margin + 6, yCapa)

  yCapa += 8
  doc.setFontSize(14)
  doc.setTextColor(COR_EMERALD[0], COR_EMERALD[1], COR_EMERALD[2])
  doc.text('DO SISTEMA POR PERFIL DE ACESSO', margin + 6, yCapa)

  yCapa += 14
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(203, 213, 225)
  const perfilDesc =
    perfilFiltro === 'empresario'
      ? 'Visão Focada: Perfil Empresário / Cliente'
      : perfilFiltro === 'analista'
        ? 'Visão Focada: Perfil Analista & Carteira'
        : perfilFiltro === 'admin'
          ? 'Visão Focada: Perfil Administrador & Master'
          : 'Visão Completa: Todos os Perfis (Empresário, Analista e Admin/Master)'

  doc.text(perfilDesc, margin + 6, yCapa)

  yCapa += 18
  // Bloco de destaque com resumo dos tópicos
  doc.setFillColor(14, 36, 66) // navy mais claro
  doc.roundedRect(margin + 6, yCapa, contentWidth - 12, 75, 3, 3, 'F')
  doc.setDrawColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
  doc.setLineWidth(0.3)
  doc.roundedRect(margin + 6, yCapa, contentWidth - 12, 75, 3, 3, 'D')

  let yTopicos = yCapa + 10
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
  doc.text('ESTRUTURA ABRANGIDA NESTE MANUAL:', margin + 12, yTopicos)

  yTopicos += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(241, 245, 249)

  const linhasTopicos = [
    '• 1. Visão Geral: Arquitetura da Reforma Tributária (EC 132/2023 · LC 214/2025)',
    '• 2. Perfis de Acesso & Níveis de Permissão (Empresário, Analista, Admin e Master)',
    '• 3. Site Institucional, 12 Serviços 5.0 e Captação de Oportunidades',
    '• 4. Trilha Guiada de Diagnósticos 00 a 06 (360°, Riscos, Transição, Regimes e Fornecedores)',
    '• 5. Calculadora IBS/CBS (6 Módulos, Split Payment, Crédito sobre Estoque e IA)',
    '• 6. Recuperador de Créditos Tributários & Pareceres Administrativos em PDF',
    '• 7. Legislação & Radar Tributário de Alertas Contextuais com Aplicação Direta',
    '• 8. Sistema de Relatórios & Dossiês Personalizados Unificados',
    '• 9. Gestão do Escritório: CRM de 6 Abas, Carteira, Metas e Agendamento',
    '• 10. Módulos Corporativos: Painel Admin, Back Office White-Label e Mercado de Créditos',
    '• 11. Vantagens Estratégicas e 7 Benefícios do Sistema',
  ]

  for (const lt of linhasTopicos) {
    doc.text(lt, margin + 12, yTopicos)
    yTopicos += 5.2
  }

  // Rodapé da capa
  const yRodapeCapa = pageHeight - 30
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  if (usuarioNome) {
    doc.text(`Manual gerado para: ${usuarioNome}`, margin + 6, yRodapeCapa)
  }
  doc.text(
    `Emissão: ${new Date().toLocaleDateString('pt-BR')}  |  Padrão Executivo Diamond Group  |  Versão 100% em Português`,
    margin + 6,
    yRodapeCapa + 6,
  )

  // ==========================================
  // PÁGINAS DE CONTEÚDO DAS SEÇÕES
  // ==========================================
  for (const secao of secoes) {
    doc.addPage()
    let y = aplicarCabecalhoManual(doc, secao.titulo, secao.subtitulo)

    // Parágrafos de conteúdo
    for (const p of secao.conteudo) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])

      const linhasTexto = doc.splitTextToSize(p, contentWidth)
      const alturaBloco = linhasTexto.length * 4.2

      // Quebra de página automática se ultrapassar a altura máxima
      if (y + alturaBloco > pageHeight - 20) {
        doc.addPage()
        y = aplicarCabecalhoManual(doc, secao.titulo, `${secao.subtitulo || ''} (continuação)`)
      }

      doc.text(linhasTexto, margin, y)
      y += alturaBloco + 3.5
    }

    // Tabela opcional da seção (ex: tabela de perfis de acesso)
    if (secao.tabela && secao.tabela.linhas.length > 0) {
      if (y + 35 > pageHeight - 20) {
        doc.addPage()
        y = aplicarCabecalhoManual(doc, secao.titulo, 'Tabela Resumo (continuação)')
      }

      y += 2
      const numCols = secao.tabela.cabecalhos.length
      const colWidth = contentWidth / numCols

      // Cabeçalho da tabela
      doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
      doc.rect(margin, y, contentWidth, 7, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)

      for (let c = 0; c < numCols; c++) {
        doc.text(secao.tabela.cabecalhos[c], margin + c * colWidth + 2.5, y + 4.8)
      }
      y += 7

      // Linhas da tabela
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)

      for (let l = 0; l < secao.tabela.linhas.length; l++) {
        const linha = secao.tabela.linhas[l]

        // Calcular altura da linha com base no texto mais longo
        let maxLinhasCol = 1
        for (let c = 0; c < numCols; c++) {
          const split = doc.splitTextToSize(linha[c] || '', colWidth - 5)
          if (split.length > maxLinhasCol) maxLinhasCol = split.length
        }
        const rowHeight = Math.max(6, maxLinhasCol * 3.5 + 2)

        if (y + rowHeight > pageHeight - 20) {
          doc.addPage()
          y = aplicarCabecalhoManual(doc, secao.titulo, 'Tabela (continuação)')
        }

        doc.setFillColor(l % 2 === 0 ? 255 : 248, l % 2 === 0 ? 255 : 250, l % 2 === 0 ? 255 : 252)
        doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
        doc.rect(margin, y, contentWidth, rowHeight, 'FD')

        doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
        for (let c = 0; c < numCols; c++) {
          const split = doc.splitTextToSize(linha[c] || '', colWidth - 5)
          doc.text(split, margin + c * colWidth + 2.5, y + 4)
        }

        y += rowHeight
      }
      y += 4
    }

    // Itens de destaque opcionais (boxes)
    if (secao.itensDestaque && secao.itensDestaque.length > 0) {
      y += 2
      for (const item of secao.itensDestaque) {
        const descLinhas = doc.splitTextToSize(item.descricao, contentWidth - 10)
        const boxHeight = 11 + descLinhas.length * 3.6

        if (y + boxHeight > pageHeight - 20) {
          doc.addPage()
          y = aplicarCabecalhoManual(doc, secao.titulo, 'Destaques Estratégicos (continuação)')
        }

        doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
        doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
        doc.roundedRect(margin, y, contentWidth, boxHeight, 1.5, 1.5, 'FD')

        // Filete dourado lateral
        doc.setFillColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
        doc.rect(margin, y, 2.5, boxHeight, 'F')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
        doc.text(item.rotulo, margin + 6, y + 5.5)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
        doc.text(descLinhas, margin + 6, y + 10)

        y += boxHeight + 3.5
      }
    }
  }

  // Aplicação de rodapés em todas as páginas após a capa
  aplicarRodapeManual(doc)

  const nomeArquivo = `manual_contabilidade_50_${perfilFiltro}_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(nomeArquivo)
}
