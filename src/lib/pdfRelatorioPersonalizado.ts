import { jsPDF } from 'jspdf'
import type { DadosEmpresaPerfil } from '@/types/dadosEmpresa'
import type { SimulacaoCalculadora } from '@/types/simulacaoCalculadora'
import type { SimulacaoRecuperador } from '@/types/recuperadorCreditos'
import type { DiagnosticoRecord } from '@/services/diagnosticos'
import type { ResultadoDiagnosticoCompleto } from '@/lib/regimes'
import type { ConfiguracaoRelatorioPersonalizado } from '@/types/relatorioPersonalizado'
import { formatarCNPJ } from '@/lib/cnpj'
import { desenharAvisoLegalCompletoPDF } from '@/components/common/AvisoOrientativo'
import { renderizarRodapeEscritorioPdf } from '@/lib/pdfIdentidadeEscritorio'
import { desenharLogoContabilidade50 } from '@/lib/pdfSimulacaoCalculadora'
import { analisarVinculosSocietarios } from '@/lib/vinculosSocietarios'
import { desenharBadgeConferenciaRtcPdf } from '@/lib/badgeConferenciaRtc'
import { obterRotuloRegimeVencedor } from '@/lib/rotuloRegimeVencedor'

export interface GerarRelatorioPersonalizadoOptions {
  configuracao: ConfiguracaoRelatorioPersonalizado
  empresa: string
  cnpj?: string
  dadosEmpresa?: DadosEmpresaPerfil | null
  simulacaoCalculadora?: SimulacaoCalculadora | null
  simulacaoRecuperador?: SimulacaoRecuperador | null
  diagnostico360?: DiagnosticoRecord | null
  resultadoDiagnostico?: ResultadoDiagnosticoCompleto | null
  clienteNome?: string
}

// Paleta Diamond Group
const COR_NAVY = [7, 19, 43] as const // #07132B
const COR_GOLD = [212, 175, 55] as const // #D4AF37
const COR_EMERALD = [46, 204, 113] as const // #2ECC71
const COR_TEXTO = [30, 41, 59] as const // slate-800
const COR_MUTED = [100, 116, 139] as const // slate-500
const COR_BG_LIGHT = [248, 250, 252] as const // slate-50
const COR_BORDA = [226, 232, 240] as const // slate-200

function formatarMoeda(val?: number): string {
  if (val === undefined || val === null || isNaN(val)) return 'R$ 0,00'
  return 'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function aplicarCabecalhoPersonalizado(
  doc: jsPDF,
  tituloDocumento: string,
  tituloSecao: string,
  empresaNome: string,
  subtituloSecao?: string,
) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 16

  // Faixa Superior Navy #07132B
  doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.rect(0, 0, pageWidth, 34, 'F')

  // Faixa Dourada Diamond #D4AF37
  doc.setFillColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
  doc.rect(0, 34, pageWidth, 2, 'F')

  // Logotipo vetorial oficial
  desenharLogoContabilidade50(doc, margin, 7, 18, true)

  const brandX = margin + 22
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('CONTABILIDADE 5.0 • DIAMOND GROUP', brandX, 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
  doc.text(tituloDocumento.toUpperCase(), brandX, 20)

  doc.setFontSize(7)
  doc.setTextColor(203, 213, 225)
  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  doc.text(
    `EMPRESA: ${empresaNome}  |  Emissão: ${dataHoje}  |  Diretrizes: EC 132/2023 · LC 214/2025`,
    brandX,
    27,
  )

  // Subtítulo da seção logo abaixo da barra dourada
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.text(tituloSecao.toUpperCase(), margin, 44)

  if (subtituloSecao) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
    doc.text(subtituloSecao, margin, 49)
  }

  doc.setDrawColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
  doc.line(margin, 52, margin + 45, 52)

  return 58
}

function aplicarRodape(doc: jsPDF) {
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

/**
 * Gerador de Relatório Personalizado para o perfil Empresário / Analista
 * Permite selecionar quais análises e seções entram, com notas e dados cadastrais somente leitura
 */
export function construirRelatorioPersonalizadoDoc(options: GerarRelatorioPersonalizadoOptions): {
  doc: jsPDF
  nomeArquivo: string
} {
  const {
    configuracao,
    empresa,
    cnpj,
    dadosEmpresa,
    simulacaoCalculadora,
    simulacaoRecuperador,
    diagnostico360,
    resultadoDiagnostico,
  } = options

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margin = 16
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - margin * 2

  const tituloGeral =
    configuracao.titulo && configuracao.titulo.trim().length > 0
      ? configuracao.titulo.trim()
      : `Relatório Personalizado — ${empresa}`

  const cnpjFmt = cnpj
    ? formatarCNPJ(cnpj)
    : dadosEmpresa?.cnpj
      ? formatarCNPJ(dadosEmpresa.cnpj)
      : '—'

  let currentY = 0

  const verificarQuebra = (espacoNecessario: number, tituloSecao: string, subtitulo?: string) => {
    if (currentY + espacoNecessario > pageHeight - 20) {
      doc.addPage()
      currentY = aplicarCabecalhoPersonalizado(doc, tituloGeral, tituloSecao, empresa, subtitulo)
    }
  }

  // PÁGINA 1: CAPA & IDENTIFICAÇÃO CADASTRAL + NOTAS DO EMPRESÁRIO
  currentY = aplicarCabecalhoPersonalizado(
    doc,
    tituloGeral,
    'Identificação Cadastral & Escopo Personalizado',
    empresa,
    configuracao.subtitulo || 'Dossiê técnico customizado com as análises e seções selecionadas.',
  )

  // Banner Dourado/Navy de Destaque
  doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.roundedRect(margin, currentY, contentWidth, 26, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
  doc.text('RELATÓRIO PERSONALIZÁVEL • PAINEL DO EMPRESÁRIO', margin + 6, currentY + 8)

  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text(tituloGeral, margin + 6, currentY + 16)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(203, 213, 225)
  doc.text(
    `Razão Social: ${empresa}  |  CNPJ: ${cnpjFmt}  |  Segmento: ${dadosEmpresa?.segmento || 'Geral'}  |  Regime: ${dadosEmpresa?.regimeAtual || 'Simples Nacional'}`,
    margin + 6,
    currentY + 22,
  )

  currentY += 32

  // Bloco dos Dados Cadastrais Oficiais (Somente Leitura do Cadastro)
  doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(margin, currentY, contentWidth, 34, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.text('DADOS OFICIAIS DO CADASTRO DA EMPRESA (SOMENTE LEITURA)', margin + 4, currentY + 6.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])

  const col1X = margin + 4
  const col2X = margin + contentWidth / 2 + 2

  doc.text(`• Razão Social: ${empresa}`, col1X, currentY + 13)
  doc.text(`• CNPJ Homologado: ${cnpjFmt}`, col1X, currentY + 19)
  doc.text(
    `• Localização: ${dadosEmpresa?.cidade || 'São Paulo'} - ${dadosEmpresa?.ufOrigem || 'SP'}`,
    col1X,
    currentY + 25,
  )

  doc.text(
    `• Segmento de Atuação: ${dadosEmpresa?.segmento || 'Comércio / Geral'}`,
    col2X,
    currentY + 13,
  )
  doc.text(
    `• Regime Tributário Atual: ${dadosEmpresa?.regimeAtual || 'Simples Nacional'}`,
    col2X,
    currentY + 19,
  )
  doc.text(
    `• Ano-Base da Transição: ${dadosEmpresa?.anoBaseTransicao || 2026} • Colaboradores: ${dadosEmpresa?.funcionarios || '—'}`,
    col2X,
    currentY + 25,
  )

  currentY += 40

  // Observações / Notas personalizadas do Empresário (se preenchido)
  if (configuracao.observacoes && configuracao.observacoes.trim().length > 0) {
    const textoObs = configuracao.observacoes.trim()
    const linhasObs = doc.splitTextToSize(textoObs, contentWidth - 10)
    const alturaObs = Math.max(22, 12 + linhasObs.length * 4.5)

    doc.setFillColor(254, 249, 235) // tom sutil bege/dourado
    doc.setDrawColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
    doc.roundedRect(margin, currentY, contentWidth, alturaObs, 2, 2, 'FD')

    // Faixa decorativa dourada
    doc.setFillColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
    doc.rect(margin, currentY, 2.5, alturaObs, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
    doc.text('NOTAS E DIRETRIZES ESTRATÉGICAS DO EMPRESÁRIO', margin + 6, currentY + 6.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    doc.text(linhasObs, margin + 6, currentY + 12)

    currentY += alturaObs + 8
  }

  // SEÇÃO A: CALCULADORA IBS/CBS (SE INCLUÍDA)
  if (configuracao.incluirCalculadora && simulacaoCalculadora) {
    verificarQuebra(55, 'Calculadora IBS/CBS • Parecer Técnico')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
    doc.text('1. SIMULAÇÃO DA REFORMA TRIBUTÁRIA (CALCULADORA IBS/CBS)', margin, currentY)
    currentY += 5

    const res = simulacaoCalculadora.resultados
    const par = simulacaoCalculadora.parametros

    // 1.1 Resumo Executivo da Calculadora
    if (configuracao.secoesCalculadora.includes('calc_resumo')) {
      const regimeVantajoso =
        res?.resultadoComparativo?.regimeMaisVantajoso ||
        res?.resultadoDashboard?.regimeRecomendado ||
        'Simples Nacional'
      const economiaEstimada =
        res?.resultadoDashboard?.economiaAnualProjetada ||
        res?.resultadoComparativo?.economiaVersusPior ||
        0
      const cargaAtual =
        res?.resultadoComparativo?.simplesNacional?.totalEfetivo ||
        res?.resultadoDashboard?.aliquotaEfetivaAtual ||
        0
      const cargaNovo =
        res?.resultadoComparativo?.ibsCbs?.totalEfetivo ||
        res?.resultadoDashboard?.aliquotaEfetivaNova ||
        0

      doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
      doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
      doc.roundedRect(margin, currentY, contentWidth, 26, 2, 2, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
      doc.text(
        `Cenário Calculado: "${simulacaoCalculadora.nome || 'Cenário Base'}" (Ano: ${par?.anoOperacao || par?.anoTransicao || 2026})`,
        margin + 4,
        currentY + 6,
      )

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
      doc.text(
        `• Regime mais vantajoso no modelo IBS/CBS: ${obterRotuloRegimeVencedor(
          regimeVantajoso,
          dadosEmpresa?.regimeAtual,
        )}`,
        margin + 4,
        currentY + 12,
      )
      doc.text(
        `• Carga Atual Estimada: ${formatarMoeda(cargaAtual)}/ano  |  Carga IBS/CBS: ${formatarMoeda(cargaNovo)}/ano`,
        margin + 4,
        currentY + 17,
      )

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(COR_EMERALD[0], COR_EMERALD[1], COR_EMERALD[2])
      doc.text(
        `• Economia Anual Estimada: ${formatarMoeda(economiaEstimada)} / ano`,
        margin + 4,
        currentY + 22,
      )

      currentY += 31
    }

    // 1.2 Comparativo Atual x IBS/CBS
    if (configuracao.secoesCalculadora.includes('calc_comparativo') && res?.resultadoComparativo) {
      verificarQuebra(40, 'Calculadora IBS/CBS • Comparativo Atual x Novo Sistema')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
      doc.text('Comparativo de Cargas Tributárias Efetivas por Regime', margin, currentY)
      currentY += 4

      doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
      doc.rect(margin, currentY, contentWidth, 6, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text('Regime Societário', margin + 3, currentY + 4.2)
      doc.text('Carga Efetiva Anual', margin + 70, currentY + 4.2)
      doc.text('Alíquota Efetiva', margin + 120, currentY + 4.2)
      doc.text('Avaliação Consultiva', margin + 155, currentY + 4.2)
      currentY += 6

      const linhasRegimes = [
        {
          nome: 'Simples Nacional',
          total: res.resultadoComparativo.simplesNacional?.totalEfetivo || 0,
          aliq: res.resultadoComparativo.simplesNacional?.aliquotaEfetiva || 0,
        },
        {
          nome: 'Lucro Presumido',
          total: res.resultadoComparativo.lucroPresumido?.totalEfetivo || 0,
          aliq: res.resultadoComparativo.lucroPresumido?.aliquotaEfetiva || 0,
        },
        {
          nome: 'Lucro Real',
          total: res.resultadoComparativo.lucroReal?.totalEfetivo || 0,
          aliq: res.resultadoComparativo.lucroReal?.aliquotaEfetiva || 0,
        },
        {
          nome: 'Novo Sistema (IBS/CBS)',
          total: res.resultadoComparativo.ibsCbs?.totalEfetivo || 0,
          aliq: res.resultadoComparativo.ibsCbs?.aliquotaEfetiva || 0,
        },
      ]

      linhasRegimes.forEach((item, idx) => {
        doc.setFillColor(
          idx % 2 === 0 ? 255 : 248,
          idx % 2 === 0 ? 255 : 250,
          idx % 2 === 0 ? 255 : 252,
        )
        doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
        doc.rect(margin, currentY, contentWidth, 5.5, 'FD')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
        doc.text(item.nome, margin + 4, currentY + 3.8)

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
        doc.text(formatarMoeda(item.total), margin + 70, currentY + 3.8)
        doc.text(`${item.aliq.toFixed(2)}%`, margin + 120, currentY + 3.8)

        const maisEconomico =
          item.nome === (res.resultadoComparativo.regimeMaisVantajoso || 'Simples Nacional')
        doc.setFont('helvetica', 'bold')
        if (maisEconomico) {
          doc.setTextColor(COR_EMERALD[0], COR_EMERALD[1], COR_EMERALD[2])
          doc.text('Mais Econômico', margin + 155, currentY + 3.8)
        } else {
          doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
          doc.text('Alternativa', margin + 155, currentY + 3.8)
        }

        currentY += 5.5
      })

      currentY += 6
    }

    // 1.3 Evolução do Cronograma de Transição 2026–2033
    if (
      configuracao.secoesCalculadora.includes('calc_evolucao') &&
      res?.resultadoTransicao &&
      res.resultadoTransicao.length > 0
    ) {
      verificarQuebra(40, 'Calculadora IBS/CBS • Evolução 2026–2033')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
      doc.text('Cronograma de Transição Tributária (2026 a 2033 — EC 132/2023)', margin, currentY)
      currentY += 4

      doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
      doc.rect(margin, currentY, contentWidth, 6, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text('Ano', margin + 3, currentY + 4.2)
      doc.text('Fase Tributária / Regra', margin + 25, currentY + 4.2)
      doc.text('Alíq. CBS', margin + 95, currentY + 4.2)
      doc.text('Alíq. IBS', margin + 125, currentY + 4.2)
      doc.text('IVA Dual', margin + 155, currentY + 4.2)
      currentY += 6

      res.resultadoTransicao.slice(0, 8).forEach((item: any, idx: number) => {
        doc.setFillColor(
          idx % 2 === 0 ? 255 : 248,
          idx % 2 === 0 ? 255 : 250,
          idx % 2 === 0 ? 255 : 252,
        )
        doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
        doc.rect(margin, currentY, contentWidth, 5.2, 'FD')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
        doc.text(String(item.ano), margin + 3, currentY + 3.6)

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
        const descricaoFase =
          item.ano === 2026
            ? 'Ano-teste operacional (0,9% CBS + 0,1% IBS)'
            : item.ano === 2027
              ? 'Extinção de PIS/COFINS e CBS plena'
              : item.ano >= 2029 && item.ano <= 2032
                ? `Transição gradual ICMS/ISS (${item.percentualIbs}% IBS)`
                : 'Novo sistema tributário integral (IBS/CBS)'
        doc.text(descricaoFase, margin + 25, currentY + 3.6)

        doc.text(`${(item.aliquotaCbs || 0).toFixed(2)}%`, margin + 95, currentY + 3.6)
        doc.text(`${(item.aliquotaIbs || 0).toFixed(2)}%`, margin + 125, currentY + 3.6)
        doc.text(`${(item.totalIvaDual || 0).toFixed(2)}%`, margin + 155, currentY + 3.6)

        currentY += 5.2
      })

      currentY += 6
    }

    // 1.4 Split Payment e Créditos de Estoque
    if (
      configuracao.secoesCalculadora.includes('calc_split') ||
      configuracao.secoesCalculadora.includes('calc_creditos')
    ) {
      verificarQuebra(32, 'Calculadora IBS/CBS • Split Payment & Créditos')

      doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
      doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
      doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
      doc.text(
        'SPLIT PAYMENT (RETENÇÃO NA FONTE) & CRÉDITOS APROPRIÁVEIS',
        margin + 4,
        currentY + 6,
      )

      const splitEstimado = res?.resultadoSplitPayment?.retencaoMensalNota || 0
      const impactoFluxo =
        (res?.resultadoSplitPayment as any)?.impactoFluxoCaixa ||
        ((res?.resultadoSplitPayment?.custoCapitalAnual ?? 0) > 0 ? 'Moderado' : 'Neutro')
      const creditosIbs =
        res?.resultadoCreditos?.totalNovo || res?.resultadoComparativo?.ibsCbs?.creditos || 0
      const comprasPct = par?.percentualComprasVendasComparativo ?? 40

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
      doc.text(
        `• Retenção Split Payment Estimada: ${formatarMoeda(splitEstimado)} / mês (Impacto no Capital de Giro: ${impactoFluxo})`,
        margin + 4,
        currentY + 12,
      )
      doc.text(
        `• Créditos Apropriáveis de IBS/CBS: ${formatarMoeda(creditosIbs)} / ano (Insumos tributados: ~${comprasPct}%)`,
        margin + 4,
        currentY + 17,
      )

      currentY += 30
    }

    // 1.5 Próximos Passos
    if (configuracao.secoesCalculadora.includes('calc_passos')) {
      verificarQuebra(25, 'Calculadora IBS/CBS • Recomendações')

      doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
      doc.roundedRect(margin, currentY, contentWidth, 18, 2, 2, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
      doc.text('PLANO DE AÇÃO RECOMENDADO PARA A TRANSIÇÃO IBS/CBS', margin + 4, currentY + 6)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(203, 213, 225)
      doc.text(
        '1. Parametrização cadastral de ERP para Split Payment e alíquotas de transição 2026.',
        margin + 4,
        currentY + 11,
      )
      doc.text(
        '2. Mapeamento de fornecedores com ampla apropriação de crédito e auditoria de compras tributadas.',
        margin + 4,
        currentY + 15,
      )

      currentY += 24
    }
  }

  // SEÇÃO B: RECUPERADOR DE CRÉDITOS (SE INCLUÍDO)
  if (configuracao.incluirRecuperador && simulacaoRecuperador) {
    verificarQuebra(55, 'Recuperador de Créditos • Levantamento 60 Meses')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
    doc.text('2. AUDITORIA DE CRÉDITOS TRIBUTÁRIOS & PREVIDENCIÁRIOS (60 MESES)', margin, currentY)
    currentY += 5

    const resRec = simulacaoRecuperador.resultados
    const parRec = simulacaoRecuperador.parametros
    const cfgRec = parRec?.configuracoes

    const creditoPrincipal = resRec?.totalIntegralOriginal ?? 0
    const atualizacaoSelic = resRec?.totalIntegralSelic ?? 0
    const totalComSelic =
      simulacaoRecuperador.total_recuperavel_integral ??
      resRec?.totalIntegralCorrigido ??
      creditoPrincipal + atualizacaoSelic

    // 2.1 Resumo Executivo
    if (configuracao.secoesRecuperador.includes('recup_resumo')) {
      doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
      doc.roundedRect(margin, currentY, contentWidth, 26, 2, 2, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
      doc.text(
        'TOTAL DE CRÉDITO RECUPERÁVEL HOMOLOGADO (COM SELIC ACUMULADA)',
        margin + 6,
        currentY + 7,
      )

      doc.setFontSize(13)
      doc.setTextColor(255, 255, 255)
      doc.text(formatarMoeda(totalComSelic), margin + 6, currentY + 16)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
      doc.text(
        `Crédito Original: ${formatarMoeda(creditoPrincipal)}  |  Atualização Monetária SELIC: +${formatarMoeda(atualizacaoSelic)}`,
        margin + 6,
        currentY + 22,
      )

      currentY += 31
    }

    // 2.2 Créditos por Tipo
    if (configuracao.secoesRecuperador.includes('recup_tipos')) {
      verificarQuebra(36, 'Recuperador de Créditos • Distribuição por Tributo')

      const pisCofins =
        simulacaoRecuperador.total_pis_cofins ?? resRec?.totalPisCofinsCorrigido ?? 0
      const folha = simulacaoRecuperador.total_folha ?? resRec?.totalFolhaCorrigido ?? 0
      const irpjCsll = simulacaoRecuperador.total_irpj_csll ?? resRec?.totalIrpjCsllCorrigido ?? 0
      const outros =
        simulacaoRecuperador.total_outros_tributos ?? resRec?.totalOutrosTributosCorrigido ?? 0

      doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
      doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
      doc.roundedRect(margin, currentY, contentWidth, 28, 2, 2, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
      doc.text('CRÉDITOS IDENTIFICADOS POR BLOCO TRIBUTÁRIO', margin + 4, currentY + 6)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
      doc.text(
        `• PIS/COFINS (Insumos & Tese do Século): ${formatarMoeda(pisCofins)}`,
        margin + 4,
        currentY + 12,
      )
      doc.text(
        `• Folha de Pagamento & Previdenciário: ${formatarMoeda(folha)}`,
        margin + 4,
        currentY + 17,
      )
      doc.text(
        `• IRPJ / CSLL (Exclusões de Base): ${formatarMoeda(irpjCsll)}`,
        margin + 4,
        currentY + 22,
      )
      doc.text(
        `• ICMS / ISS / Outros Tributos: ${formatarMoeda(outros)}`,
        margin + contentWidth / 2,
        currentY + 12,
      )

      currentY += 34
    }

    // 2.3 Quadro Ano a Ano
    if (configuracao.secoesRecuperador.includes('recup_ano_a_ano')) {
      verificarQuebra(30, 'Recuperador de Créditos • Quadro Competências')

      const anosFaturamento = cfgRec?.anosFaturamento || []

      doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
      doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
      doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
      doc.text(
        'HISTÓRICO OPERACIONAL E COMPETÊNCIAS AUDITADAS (ÚLTIMOS 5 ANOS)',
        margin + 4,
        currentY + 6,
      )

      const fatMedio =
        cfgRec?.faturamentoMensal ||
        (anosFaturamento.length > 0
          ? anosFaturamento.reduce((acc: number, a: any) => acc + (a.faturamento || 0), 0) /
            (anosFaturamento.length * 12)
          : 0)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
      doc.text(`• Faturamento Mensal Médio: ${formatarMoeda(fatMedio)}`, margin + 4, currentY + 12)
      doc.text(
        `• Massa Salarial Mensal: ${formatarMoeda(cfgRec?.massaSalarialMensal || 0)}  |  Colaboradores: ${cfgRec?.numeroMedioEmpregados || 0}`,
        margin + 4,
        currentY + 17,
      )

      currentY += 28
    }

    // 2.4 Próximos Passos
    if (configuracao.secoesRecuperador.includes('recup_passos')) {
      verificarQuebra(24, 'Recuperador de Créditos • Procedimento Administrativo')

      doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
      doc.roundedRect(margin, currentY, contentWidth, 18, 2, 2, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
      doc.text(
        'PROCEDIMENTO ADMINISTRATIVO DE COMPENSAÇÃO (RECEITA FEDERAL)',
        margin + 4,
        currentY + 6,
      )

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(203, 213, 225)
      doc.text(
        '1. Retificação de obrigações acessórias (EFD-Contribuições, DCTFWeb e ECF) sem necessidade de processo judicial.',
        margin + 4,
        currentY + 11,
      )
      doc.text(
        '2. Compensação via PER/DCOMP Web com homologação em até 60 dias para abatimento de tributos federais correntes.',
        margin + 4,
        currentY + 15,
      )

      currentY += 24
    }
  }

  // SEÇÃO C: DIAGNÓSTICO 360° (SE INCLUÍDO)
  if (configuracao.incluirDiagnostico) {
    verificarQuebra(55, 'Diagnóstico 360° • Governança & Riscos')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
    doc.text('3. DIAGNÓSTICO 360° & MATRIZ DE GOVERNANÇA TRIBUTÁRIA', margin, currentY)
    currentY += 5

    // 3.1 Resumo Diagnóstico
    if (configuracao.secoesDiagnostico.includes('diag_resumo') && resultadoDiagnostico) {
      doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
      doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
      doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
      doc.text(
        `Regime Recomendado na Reforma (Ano ${resultadoDiagnostico.anoBase}): ${resultadoDiagnostico.novoSistema.regimeRecomendado}`,
        margin + 4,
        currentY + 6,
      )

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
      doc.text(
        `Regime mais eficiente vigente: ${resultadoDiagnostico.regimeRecomendado}`,
        margin + 4,
        currentY + 12,
      )

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(COR_EMERALD[0], COR_EMERALD[1], COR_EMERALD[2])
      doc.text(
        `Economia Anual Projetada: ${formatarMoeda(resultadoDiagnostico.novoSistema.economiaAnual)} / ano`,
        margin + 4,
        currentY + 18,
      )

      currentY += 29
    }

    // 3.2 Matriz de 7 Riscos
    if (configuracao.secoesDiagnostico.includes('diag_matriz_riscos') && diagnostico360) {
      verificarQuebra(55, 'Diagnóstico 360° • Matriz Semáforo de 7 Riscos')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
      doc.text('Matriz Semáforo de Riscos (7 Frentes Diamond)', margin, currentY)
      currentY += 4

      const extra360 = (diagnostico360?.dados_extra_json as any) || {}
      const scores360 = extra360.scoresPorFrente || {}

      doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
      doc.rect(margin, currentY, contentWidth, 6, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text('Frente Estrutural', margin + 3, currentY + 4.2)
      doc.text('Exposição & Vulnerabilidade', margin + 70, currentY + 4.2)
      doc.text('Proteção & Controle', margin + 120, currentY + 4.2)
      doc.text('Classificação', margin + 158, currentY + 4.2)
      currentY += 6

      const FRENTES_NOMES: Record<number, string> = {
        1: '1. Financeiro & Crédito',
        2: '2. Investimentos & Wealth',
        3: '3. Societário & Parcerias',
        4: '4. Fiscal & Contábil',
        5: '5. Tributário',
        6: '6. Jurídico',
        7: '7. Operacional & Cultura',
      }

      for (let f = 1; f <= 7; f++) {
        const item = scores360[f] || { scoreMedio: 2, p1: 2, p2: 2 }
        const scoreMedio = typeof item.scoreMedio === 'number' ? item.scoreMedio : 2
        const p1 = item.p1 ?? 2
        const p2 = item.p2 ?? 2
        const isCritico = scoreMedio >= 2.5
        const isAlerta = !isCritico && scoreMedio >= 1.75
        const statusLabel = isCritico ? 'Crítico' : isAlerta ? 'Alerta' : 'Controlado'

        doc.setFillColor(f % 2 === 0 ? 255 : 248, f % 2 === 0 ? 255 : 250, f % 2 === 0 ? 255 : 252)
        doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
        doc.rect(margin, currentY, contentWidth, 5.5, 'FD')

        // Faixa semáforo
        if (isCritico) doc.setFillColor(225, 29, 72)
        else if (isAlerta) doc.setFillColor(217, 119, 6)
        else doc.setFillColor(22, 163, 74)
        doc.rect(margin, currentY, 2.5, 5.5, 'F')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.8)
        doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
        doc.text(FRENTES_NOMES[f] || `Frente ${f}`, margin + 5, currentY + 3.8)

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
        const labelDim = (n: number) => (n === 3 ? 'Alta' : n === 2 ? 'Média' : 'Baixa')
        doc.text(`Nível: ${labelDim(p1)}`, margin + 70, currentY + 3.8)
        doc.text(`Nível: ${labelDim(p2)}`, margin + 120, currentY + 3.8)

        doc.setFont('helvetica', 'bold')
        if (isCritico) doc.setTextColor(190, 18, 60)
        else if (isAlerta) doc.setTextColor(180, 83, 9)
        else doc.setTextColor(21, 128, 61)
        doc.text(
          `${scoreMedio.toFixed(1)} • ${statusLabel.toUpperCase()}`,
          margin + 158,
          currentY + 3.8,
        )

        currentY += 5.5
      }

      currentY += 6
    }

    // 3.3 Autoavaliação e Plano 30-60-90
    if (configuracao.secoesDiagnostico.includes('diag_autoavaliacao')) {
      verificarQuebra(32, 'Diagnóstico 360° • Plano de Ação 30-60-90')

      doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
      doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
      doc.roundedRect(margin, currentY, contentWidth, 26, 2, 2, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
      doc.text('PLANO DE AÇÃO ESTRUTURADO 30-60-90 DIAS', margin + 4, currentY + 6)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.2)
      doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
      doc.text(
        '• 30 Dias: Blindagem de caixa, saneamento de passivos e conciliação bancária 100% digital.',
        margin + 4,
        currentY + 12,
      )
      doc.text(
        '• 60 Dias: Governança societária, revisão de contratos e alinhamento de riscos tributários.',
        margin + 4,
        currentY + 17,
      )
      doc.text(
        '• 90 Dias: Adequação tecnológica e fiscal aos novos tributos (IBS/CBS/IS - EC 132/2023).',
        margin + 4,
        currentY + 22,
      )

      currentY += 31
    }

    // 3.4 Transição e Enquadramento
    if (
      configuracao.secoesDiagnostico.includes('diag_transicao') ||
      configuracao.secoesDiagnostico.includes('diag_enquadramento')
    ) {
      verificarQuebra(26, 'Diagnóstico 360° • Enquadramento & Transição')

      doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
      doc.roundedRect(margin, currentY, contentWidth, 20, 2, 2, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
      doc.text('SÍNTESE DA TRANSIÇÃO TRIBUTÁRIA E ENQUADRAMENTO', margin + 4, currentY + 6)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(203, 213, 225)
      doc.text(
        'Transição guiada de 2026 a 2033 com acompanhamento de alíquotas do comitê gestor e split payment.',
        margin + 4,
        currentY + 12,
      )
      doc.text(
        'Revisão periódica recomendada a cada encerramento de trimestre contábil.',
        margin + 4,
        currentY + 16,
      )

      currentY += 26
    }

    // 3.5 Dados Gerenciais Importados (Balancete & EFDs)
    if (configuracao.secoesDiagnostico.includes('diag_dados_gerenciais')) {
      const docFiscal = dadosEmpresa?.documentoFiscalImportado
      const agregados = docFiscal?.agregadosContabeis
      const totaisFiscais = docFiscal?.totaisFiscais

      const temDadosGerenciais =
        Boolean(docFiscal) &&
        (Boolean(
          agregados &&
          ((agregados.ativoTotal ?? 0) > 0 ||
            (agregados.passivoTotal ?? 0) > 0 ||
            (agregados.patrimonioLiquido ?? 0) !== 0 ||
            (agregados.cmvCsp ?? 0) > 0 ||
            (agregados.lucroLiquido ?? 0) !== 0 ||
            (agregados.receitaBruta ?? 0) > 0 ||
            (agregados.despesasOperacionais ?? 0) > 0),
        ) ||
          Boolean(
            totaisFiscais &&
            ((totaisFiscais.faturamentoPeriodo ?? 0) > 0 ||
              (totaisFiscais.comprasTotais ?? 0) > 0 ||
              (totaisFiscais.comprasComCredito ?? 0) > 0 ||
              (totaisFiscais.saldoCredorAcumulado ?? 0) > 0 ||
              (totaisFiscais.receitaInterestadual ?? 0) > 0 ||
              (totaisFiscais.receitaExportacao ?? 0) > 0),
          ))

      if (temDadosGerenciais && docFiscal) {
        verificarQuebra(50, 'Diagnóstico 360° • Dados Gerenciais Importados')

        const rotuloTipoDoc =
          docFiscal.tipo === 'balancete'
            ? 'Balancete Contábil'
            : docFiscal.tipo === 'efd_contribuicoes'
              ? 'EFD Contribuições'
              : docFiscal.tipo === 'efd_icms_ipi'
                ? 'EFD ICMS/IPI'
                : docFiscal.tipo === 'cnae_secundario'
                  ? 'CNAE Secundário'
                  : docFiscal.tipo === 'consulta_cnpj'
                    ? 'Consulta CNPJ'
                    : docFiscal.nomeTipo || 'Documento Fiscal'

        let dataFormatada = '—'
        if (docFiscal.dataImportacao) {
          try {
            const d = new Date(docFiscal.dataImportacao)
            if (!isNaN(d.getTime())) {
              dataFormatada = d.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })
            }
          } catch {
            dataFormatada = docFiscal.dataImportacao
          }
        }

        // Box de cabeçalho
        doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
        doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
        doc.roundedRect(margin, currentY, contentWidth, 14, 2, 2, 'FD')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
        doc.text('DADOS GERENCIAIS EXTRAÍDOS DE DOCUMENTO IMPORTADO', margin + 4, currentY + 5.5)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
        doc.text(
          `Origem: ${rotuloTipoDoc} • Arquivo: ${docFiscal.nomeArquivo || '—'} • Importado em: ${dataFormatada}`,
          margin + 4,
          currentY + 10.5,
        )

        currentY += 16

        // Bloco Agregados Contábeis (se existirem)
        if (agregados) {
          verificarQuebra(28, 'Diagnóstico 360° • Agregados Contábeis')

          doc.setFillColor(255, 255, 255)
          doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
          doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD')

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(7.5)
          doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
          doc.text('Quadro Gerencial Contábil (Balanço & DRE):', margin + 4, currentY + 5.5)

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(7)
          doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])

          const col1 = margin + 4
          const col2 = margin + 65
          const col3 = margin + 125

          doc.text(
            `• Ativo Total: ${formatarMoeda(agregados.ativoTotal || 0)}`,
            col1,
            currentY + 11,
          )
          doc.text(
            `• Passivo Total: ${formatarMoeda(agregados.passivoTotal || 0)}`,
            col2,
            currentY + 11,
          )
          doc.text(
            `• Patrimônio Líquido: ${formatarMoeda(agregados.patrimonioLiquido || 0)}`,
            col3,
            currentY + 11,
          )

          doc.text(
            `• Lucro Líquido: ${formatarMoeda(agregados.lucroLiquido || 0)}`,
            col1,
            currentY + 16.5,
          )
          doc.text(`• CMV / CSP: ${formatarMoeda(agregados.cmvCsp || 0)}`, col2, currentY + 16.5)
          doc.text(
            `• Receita Bruta: ${formatarMoeda(agregados.receitaBruta || 0)}`,
            col3,
            currentY + 16.5,
          )

          currentY += 27
        }

        // Bloco Totais Fiscais (se existirem)
        if (totaisFiscais) {
          verificarQuebra(28, 'Diagnóstico 360° • Totais Fiscais EFD')

          doc.setFillColor(255, 255, 255)
          doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
          doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD')

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(7.5)
          doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
          doc.text('Totais Fiscais Extraídos da EFD:', margin + 4, currentY + 5.5)

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(7)
          doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])

          const col1 = margin + 4
          const col2 = margin + 65
          const col3 = margin + 125

          doc.text(
            `• Faturamento Período: ${formatarMoeda(totaisFiscais.faturamentoPeriodo || 0)}`,
            col1,
            currentY + 11,
          )
          doc.text(
            `• Compras Totais: ${formatarMoeda(totaisFiscais.comprasTotais || 0)}`,
            col2,
            currentY + 11,
          )
          doc.text(
            `• Compras c/ Crédito: ${formatarMoeda(totaisFiscais.comprasComCredito || 0)}`,
            col3,
            currentY + 11,
          )

          doc.text(
            `• Saldo Credor Acum.: ${formatarMoeda(totaisFiscais.saldoCredorAcumulado || 0)}`,
            col1,
            currentY + 16.5,
          )
          doc.text(
            `• Vendas Interestaduais: ${formatarMoeda(totaisFiscais.receitaInterestadual || 0)}`,
            col2,
            currentY + 16.5,
          )
          doc.text(
            `• Exportação: ${formatarMoeda(totaisFiscais.receitaExportacao || 0)}`,
            col3,
            currentY + 16.5,
          )

          currentY += 27
        }

        currentY += 3
      }

      // -------------------------------------------------------------
      // SUBSEÇÃO: VÍNCULOS SOCIETÁRIOS & RISCO DE REGIME
      // -------------------------------------------------------------
      const incluirVinculos = configuracao.secoesDiagnostico.includes('diag_vinculos_societarios')
      const vinculos = dadosEmpresa?.vinculosSocietarios || []

      if (incluirVinculos && vinculos.length > 0) {
        verificarQuebra(50, 'Diagnóstico 360° • Vínculos Societários')

        const faturamentoProprio =
          (dadosEmpresa?.faturamentoMensal ? dadosEmpresa.faturamentoMensal * 12 : 0) || 0
        const resultadoVinculos = analisarVinculosSocietarios({
          vinculos,
          regimeAtual: dadosEmpresa?.regimeAtual || 'Simples Nacional',
          faturamentoAnualProprio: faturamentoProprio,
        })

        // Box de cabeçalho da subseção
        doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
        doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
        doc.roundedRect(margin, currentY, contentWidth, 14, 2, 2, 'FD')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
        doc.text(
          'ANÁLISE DE VÍNCULOS SOCIETÁRIOS & RISCO DE REGIME (LC 123/2006)',
          margin + 4,
          currentY + 5.5,
        )

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
        doc.text(
          `Vínculos Analisados: ${resultadoVinculos.totalVinculos} • Receita Global Simples: ${formatarMoeda(resultadoVinculos.faturamentoGlobalSimples)} • Achados: ${resultadoVinculos.achados.length}`,
          margin + 4,
          currentY + 10.5,
        )

        currentY += 16

        // Lista de Achados com Norma de Origem
        for (const achado of resultadoVinculos.achados) {
          verificarQuebra(26, 'Diagnóstico 360° • Achado de Vínculo Societário')

          const corSeveridade =
            achado.severidade === 'critico'
              ? [192, 57, 43] // Rose / Vermelho
              : achado.severidade === 'atencao'
                ? [211, 84, 0] // Âmbar / Laranja
                : [39, 174, 96] // Verde

          doc.setFillColor(255, 255, 255)
          doc.setDrawColor(corSeveridade[0], corSeveridade[1], corSeveridade[2])
          doc.roundedRect(margin, currentY, contentWidth, 23, 2, 2, 'FD')

          // Tarja lateral de severidade
          doc.setFillColor(corSeveridade[0], corSeveridade[1], corSeveridade[2])
          doc.roundedRect(margin, currentY, 3, 23, 1, 1, 'F')

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(7.5)
          doc.setTextColor(corSeveridade[0], corSeveridade[1], corSeveridade[2])
          const tagSeveridade = achado.severidade.toUpperCase()
          doc.text(`[${tagSeveridade}] ${achado.titulo}`, margin + 5, currentY + 5)

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(6.5)
          doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
          doc.text(`Norma de Origem: ${achado.normaOrigem}`, margin + 5, currentY + 9.5)

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(6.5)
          doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
          const descLinhas = doc.splitTextToSize(achado.descricao, contentWidth - 10)
          doc.text(descLinhas.slice(0, 2), margin + 5, currentY + 13.5)

          doc.setFont('helvetica', 'italic')
          doc.setFontSize(6)
          doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
          doc.text(`Impacto: ${achado.impactoRegime}`, margin + 5, currentY + 20.5)

          currentY += 25
        }

        currentY += 3
      }
    }
  }

  if (currentY > 220) {
    doc.addPage()
    currentY = 20
  }

  // BADGE DE CONFERÊNCIA RTC (Calculadora oficial da Receita — ver /validacao-rtc)
  if (currentY > 225) {
    doc.addPage()
    currentY = 20
  }
  const hBadgeRtc = desenharBadgeConferenciaRtcPdf(doc, margin, currentY, contentWidth)
  currentY += hBadgeRtc + 5

  desenharAvisoLegalCompletoPDF(doc, margin, currentY, contentWidth)
  aplicarRodape(doc)

  const sanitizado = empresa.replace(/[^a-zA-Z0-9_-]/g, '_')
  const nomeArquivo = `Relatorio_Personalizado_${sanitizado}.pdf`

  return { doc, nomeArquivo }
}

export function gerarRelatorioPersonalizadoPDF(options: GerarRelatorioPersonalizadoOptions): void {
  const { doc, nomeArquivo } = construirRelatorioPersonalizadoDoc(options)
  doc.save(nomeArquivo)
}

export function gerarRelatorioPersonalizadoBlob(options: GerarRelatorioPersonalizadoOptions): {
  blob: Blob
  nomeArquivo: string
  doc: jsPDF
} {
  const { doc, nomeArquivo } = construirRelatorioPersonalizadoDoc(options)
  const blob = doc.output('blob')
  return { blob, nomeArquivo, doc }
}
