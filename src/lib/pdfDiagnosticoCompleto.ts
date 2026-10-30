import { jsPDF } from 'jspdf'
import type { DadosEmpresaPerfil } from '@/types/dadosEmpresa'
import type { ResultadoDiagnosticoCompleto } from '@/lib/regimes'
import type { SimulacaoCalculadora } from '@/types/simulacaoCalculadora'
import type { SimulacaoRecuperador } from '@/types/recuperadorCreditos'
import type { DiagnosticoRecord } from '@/services/diagnosticos'
import { formatarCNPJ } from '@/lib/cnpj'
import { desenharAvisoLegalCompletoPDF } from '@/components/common/AvisoOrientativo'

export interface GerarDiagnosticoCompletoOptions {
  empresa: string
  cnpj?: string
  dadosEmpresa?: DadosEmpresaPerfil | null
  resultadoDiagnostico?: ResultadoDiagnosticoCompleto | null
  simulacaoCalculadora?: SimulacaoCalculadora | null
  simulacaoRecuperador?: SimulacaoRecuperador | null
  diagnostico360?: DiagnosticoRecord | null
  responsavelNome?: string
  responsavelCrc?: string
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

function aplicarCabecalhoCompleto(
  doc: jsPDF,
  tituloSecao: string,
  empresaNome: string,
  subtituloSecao?: string,
) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 16

  // Faixa Superior Navy #07132B
  doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.rect(0, 0, pageWidth, 32, 'F')

  // Faixa Dourada Diamond #D4AF37
  doc.setFillColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
  doc.rect(0, 32, pageWidth, 2, 'F')

  // Topo do Header
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('CONTABILIDADE 5.0 • DIAMOND GROUP', margin, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
  doc.text(
    'DIAGNÓSTICO COMPLETO INTEGRADO • CALCULADORA IBS/CBS + RECUPERADOR + DIAGNÓSTICO 360°',
    margin,
    18,
  )

  doc.setFontSize(7)
  doc.setTextColor(203, 213, 225)
  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  doc.text(
    `EMPRESA: ${empresaNome}  |  Emissão: ${dataHoje}  |  Base Legal: EC 132/2023 · LC 214/2025`,
    margin,
    25,
  )

  // Subtítulo da seção logo abaixo da barra dourada
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.text(tituloSecao.toUpperCase(), margin, 42)

  if (subtituloSecao) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
    doc.text(subtituloSecao, margin, 46.5)
  }

  doc.setDrawColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
  doc.line(margin, 49, margin + 45, 49)

  return 55
}

function aplicarRodape(doc: jsPDF) {
  const totalPages = doc.internal.pages.length - 1
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 16

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
    doc.text(
      'Contabilidade 5.0 — Diamond Group | Dossiê Diagnóstico Completo Integrado',
      margin,
      pageHeight - 8,
    )
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 22, pageHeight - 8)
  }
}

/**
 * Emite o Relatório Unificado Consolidado do Diagnóstico Completo:
 * 1. Diagnóstico 360° & Enquadramento Tributário
 * 2. Parecer da Calculadora IBS/CBS
 * 3. Relatório do Recuperador de Créditos
 */
export function gerarDiagnosticoCompletoPDF(options: GerarDiagnosticoCompletoOptions): void {
  const {
    empresa,
    cnpj,
    dadosEmpresa,
    resultadoDiagnostico,
    simulacaoCalculadora,
    simulacaoRecuperador,
    diagnostico360,
  } = options

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margin = 16
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - margin * 2

  // ==========================================
  // PÁGINA 1: VISÃO GERAL & DIAGNÓSTICO 360°
  // ==========================================
  let y = aplicarCabecalhoCompleto(
    doc,
    '1. Síntese Executiva & Diagnóstico 360°',
    empresa,
    'Visão consolidada da esteira diagnóstica, maturidade fiscal e enquadramento tributário.',
  )

  // Banner Dourado/Navy de Destaque
  doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
  doc.text('DOSSIÊ CONSOLIDADO TRÍPLICE (DIAMOND GROUP INTELLIGENCE)', margin + 6, y + 8)

  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text(`Análise Unificada: ${empresa}`, margin + 6, y + 16)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(203, 213, 225)
  const cnpjFmt = cnpj
    ? formatarCNPJ(cnpj)
    : dadosEmpresa?.cnpj
      ? formatarCNPJ(dadosEmpresa.cnpj)
      : '—'
  doc.text(
    `CNPJ: ${cnpjFmt}  |  Segmento: ${dadosEmpresa?.segmento || 'Geral'}  |  Regime Atual: ${dadosEmpresa?.regimeAtual || 'Simples Nacional'}`,
    margin + 6,
    y + 22,
  )

  y += 32

  // Bloco 1.1: Diagnóstico Tributário & Enquadramento
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.text('A. ENQUADRAMENTO TRIBUTÁRIO & REFORMA FISCAL (EC 132/2023)', margin, y + 4)
  y += 7

  if (resultadoDiagnostico) {
    doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
    doc.text(
      `Regime Recomendado no Novo Sistema (Ano ${resultadoDiagnostico.anoBase}): ${resultadoDiagnostico.novoSistema.regimeRecomendado}`,
      margin + 4,
      y + 7,
    )

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    doc.text(
      `Regime mais eficiente no sistema atual vigente: ${resultadoDiagnostico.regimeRecomendado}`,
      margin + 4,
      y + 13,
    )

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COR_EMERALD[0], COR_EMERALD[1], COR_EMERALD[2])
    doc.text(
      `Economia Projetada no Novo Código: ${formatarMoeda(resultadoDiagnostico.novoSistema.economiaAnual)} / ano vs. 2º regime`,
      margin + 4,
      y + 19,
    )

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    doc.text(
      `Cargas estimadas na Reforma: Simples ${formatarMoeda(resultadoDiagnostico.novoSistema.simples.cargaAnual)}  |  Presumido ${formatarMoeda(resultadoDiagnostico.novoSistema.presumido.cargaAnual)}  |  Real ${formatarMoeda(resultadoDiagnostico.novoSistema.real.cargaAnual)}`,
      margin + 4,
      y + 25,
    )
    const fat12m =
      resultadoDiagnostico.rbt12 ??
      (resultadoDiagnostico.faturamentoMensal !== undefined
        ? resultadoDiagnostico.faturamentoMensal * 12
        : (dadosEmpresa?.faturamentoMensal || 0) * 12)
    const folha12m =
      resultadoDiagnostico.folha12 ??
      (resultadoDiagnostico.folhaMensal !== undefined
        ? resultadoDiagnostico.folhaMensal * 12
        : (dadosEmpresa?.folhaPagamentoMensal || 0) * 12)
    doc.text(
      `Faturamento 12m: ${formatarMoeda(fat12m)}  |  Folha 12m: ${formatarMoeda(folha12m)}  |  Fator R: ${resultadoDiagnostico.fatorR.toFixed(1)}%`,
      margin + 4,
      y + 31,
    )

    y += 44
  } else {
    doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
    doc.text(
      'Parâmetros operacionais da simulação tributária integrados do cadastro ativo.',
      margin + 4,
      y + 10,
    )
    y += 24
  }

  // Bloco 1.2: Autoavaliação das 7 Frentes (Diagnóstico 360°)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.text('B. MATRIZ SEMÁFORO DE RISCOS & GOVERNANÇA (7 FRENTES 360°)', margin, y + 4)
  y += 7

  const extra360 = (diagnostico360?.dados_extra_json as any) || {}
  const scores360 = extra360.scoresPorFrente || {}

  doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.rect(margin, y, contentWidth, 6.5, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.text('Frente Estrutural Diamond', margin + 3, y + 4.5)
  doc.text('Exposição & Vulnerabilidade', margin + 70, y + 4.5)
  doc.text('Proteção & Controle', margin + 120, y + 4.5)
  doc.text('Classificação', margin + 158, y + 4.5)
  y += 6.5

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
    doc.rect(margin, y, contentWidth, 6, 'FD')

    // Faixa semáforo
    if (isCritico) doc.setFillColor(225, 29, 72)
    else if (isAlerta) doc.setFillColor(217, 119, 6)
    else doc.setFillColor(22, 163, 74)
    doc.rect(margin, y, 2.5, 6, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
    doc.text(FRENTES_NOMES[f] || `Frente ${f}`, margin + 5, y + 4.2)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    const labelDim = (n: number) => (n === 3 ? 'Alta' : n === 2 ? 'Média' : 'Baixa')
    doc.text(`Nível: ${labelDim(p1)}`, margin + 70, y + 4.2)
    doc.text(`Nível: ${labelDim(p2)}`, margin + 120, y + 4.2)

    doc.setFont('helvetica', 'bold')
    if (isCritico) doc.setTextColor(190, 18, 60)
    else if (isAlerta) doc.setTextColor(180, 83, 9)
    else doc.setTextColor(21, 128, 61)
    doc.text(`${scoreMedio.toFixed(1)} • ${statusLabel.toUpperCase()}`, margin + 158, y + 4.2)

    y += 6
  }

  // ==========================================
  // PÁGINA 2: CALCULADORA IBS/CBS & RECUPERADOR
  // ==========================================
  doc.addPage()
  y = aplicarCabecalhoCompleto(
    doc,
    '2. Parecer da Calculadora IBS/CBS & Recuperação de Créditos',
    empresa,
    'Memória de cálculo do Novo Sistema (EC 132/2023) e levantamento administrativo retroativo.',
  )

  // Bloco 2.1: Calculadora IBS/CBS
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.text('C. PARECER TÉCNICO DA CALCULADORA IBS/CBS', margin, y + 4)
  y += 7

  if (simulacaoCalculadora) {
    const res = simulacaoCalculadora.resultados
    const par = simulacaoCalculadora.parametros

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
    const creditosIbsCbs =
      res?.resultadoCreditos?.totalNovo || res?.resultadoComparativo?.ibsCbs?.creditos || 0
    const splitEstimado = res?.resultadoSplitPayment?.retencaoMensalNota || 0
    const ramoOuSetor =
      par?.config?.tipoAtividade || par?.tipoAtividade || par?.setorTransicao || 'Serviços'
    const comprasPct =
      par?.percentualComprasVendasComparativo ?? par?.percentualComprasVendasSimples ?? 40

    doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.roundedRect(margin, y, contentWidth, 44, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
    doc.text(
      `Simulação Vigente: "${simulacaoCalculadora.nome || 'Cenário Base'}" (Ano da Operação: ${par?.anoOperacao || par?.anoTransicao || 2026})`,
      margin + 4,
      y + 7,
    )

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    doc.text(`• Regime Mais Econômico Apurado: ${regimeVantajoso}`, margin + 4, y + 13)
    doc.text(
      `• Carga Atual (Vigente): ${formatarMoeda(cargaAtual)}/ano  |  Carga IBS/CBS Projetada: ${formatarMoeda(cargaNovo)}/ano`,
      margin + 4,
      y + 19,
    )

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COR_EMERALD[0], COR_EMERALD[1], COR_EMERALD[2])
    doc.text(
      `• Economia Anual Estimada: ${formatarMoeda(economiaEstimada)} / ano`,
      margin + 4,
      y + 25,
    )

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    doc.text(
      `• Créditos Apropriáveis de IBS/CBS: ${formatarMoeda(creditosIbsCbs)}/ano  |  Split Payment Estimado: ${formatarMoeda(splitEstimado)}/mês`,
      margin + 4,
      y + 31,
    )
    doc.text(
      `• Ramo Aplicado: ${ramoOuSetor}  |  Compras Tributadas: ${comprasPct}%  |  Alíquota Padrão Ref: 26,50%`,
      margin + 4,
      y + 37,
    )

    y += 50
  } else {
    doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
    doc.text(
      'Simulação de impacto da CBS e do IBS apurada pelos parâmetros da empresa.',
      margin + 4,
      y + 10,
    )
    y += 24
  }

  // Bloco 2.2: Recuperador de Créditos Tributários
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.text('D. LEVANTAMENTO DO RECUPERADOR DE CRÉDITOS TRIBUTÁRIOS', margin, y + 4)
  y += 7

  if (simulacaoRecuperador) {
    const resRec = simulacaoRecuperador.resultados
    const parRec = simulacaoRecuperador.parametros
    const cfgRec = parRec?.configuracoes

    const creditoPrincipal = resRec?.totalIntegralOriginal ?? 0
    const atualizacaoSelic = resRec?.totalIntegralSelic ?? 0
    const totalComSelic =
      simulacaoRecuperador.total_recuperavel_integral ??
      resRec?.totalIntegralCorrigido ??
      creditoPrincipal + atualizacaoSelic

    const creditoPisCofins =
      simulacaoRecuperador.total_pis_cofins ?? resRec?.totalPisCofinsCorrigido ?? 0
    const creditoFolha = simulacaoRecuperador.total_folha ?? resRec?.totalFolhaCorrigido ?? 0
    const creditoIrpjCsll =
      simulacaoRecuperador.total_irpj_csll ?? resRec?.totalIrpjCsllCorrigido ?? 0
    const creditoOutros =
      simulacaoRecuperador.total_outros_tributos ?? resRec?.totalOutrosTributosCorrigido ?? 0

    const faturamentoMedio =
      cfgRec?.faturamentoMensal ??
      (cfgRec?.anosFaturamento && cfgRec.anosFaturamento.length > 0
        ? cfgRec.anosFaturamento.reduce((acc, a) => acc + (a.faturamento || 0), 0) /
          (cfgRec.anosFaturamento.length * 12)
        : 0)

    const tesesAtivasCount = resRec?.resultadosTeses
      ? resRec.resultadosTeses.filter((t) => t.ativa).length
      : parRec?.teses
        ? Object.values(parRec.teses).filter((t) => t.ativa).length
        : 0

    doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.roundedRect(margin, y, contentWidth, 42, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
    doc.text(
      `Levantamento Administrativo (60 Meses): "${simulacaoRecuperador.nome || 'Auditoria de Créditos'}"`,
      margin + 4,
      y + 7,
    )

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    doc.text(
      `• Crédito Principal Homologado: ${formatarMoeda(creditoPrincipal)}  |  Atualização Oficial SELIC: ${formatarMoeda(atualizacaoSelic)}`,
      margin + 4,
      y + 13,
    )

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COR_EMERALD[0], COR_EMERALD[1], COR_EMERALD[2])
    doc.text(
      `• CRÉDITO TOTAL RECUPERÁVEL COM SELIC: ${formatarMoeda(totalComSelic)}`,
      margin + 4,
      y + 19,
    )

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    doc.text(
      `• PIS/COFINS (Insumos & Tese do Século): ${formatarMoeda(creditoPisCofins)}  |  Folha & Previdenciário: ${formatarMoeda(creditoFolha)}`,
      margin + 4,
      y + 25,
    )
    doc.text(
      `• IRPJ / CSLL: ${formatarMoeda(creditoIrpjCsll)}  |  Outros Tributos: ${formatarMoeda(creditoOutros)}`,
      margin + 4,
      y + 31,
    )
    doc.text(
      `• Faturamento Mensal Médio Auditado: ${formatarMoeda(faturamentoMedio)}  |  Teses Ativas no Checklist: ${tesesAtivasCount}`,
      margin + 4,
      y + 37,
    )

    y += 48
  } else {
    doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
    doc.text(
      'Levantamento administrativo preliminar dos últimos 60 meses com tese STF/STJ.',
      margin + 4,
      y + 10,
    )
    y += 24
  }

  // Bloco 2.3: Aviso Orientativo Legal Obrigatório
  if (y > 225) {
    doc.addPage()
    y = 20
  }
  desenharAvisoLegalCompletoPDF(doc, margin, y, contentWidth)

  aplicarRodape(doc)

  const nomeArquivo = `Dossie_Diagnostico_Completo_${empresa.replace(/\s+/g, '_')}.pdf`
  doc.save(nomeArquivo)
}
