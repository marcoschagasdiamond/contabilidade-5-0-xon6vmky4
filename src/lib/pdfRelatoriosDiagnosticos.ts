import { jsPDF } from 'jspdf'
import type { DadosEmpresaPerfil } from '@/types/dadosEmpresa'
import type { DiagnosticoRecord } from '@/services/diagnosticos'
import { formatarCNPJ } from '@/lib/cnpj'

export interface DadosRelatorioConsolidado {
  clienteNome?: string
  dadosEmpresa?: DadosEmpresaPerfil | null
  diagnosticoEnquadramento?: DiagnosticoRecord | null
  diagnosticoAutoavaliacao?: DiagnosticoRecord | null
  diagnosticoTransicao?: DiagnosticoRecord | null
  diagnosticoRegimes?: DiagnosticoRecord | null
  dataEmissao?: string
}

// Cores Diamond Group
const COR_NAVY = [7, 19, 43] as const // #07132B
const COR_GOLD = [212, 175, 55] as const // #D4AF37
const COR_EMERALD = [46, 204, 113] as const // #2ECC71
const COR_TEXTO = [30, 41, 59] as const // slate-800
const COR_MUTED = [100, 116, 139] as const // slate-500
const COR_BG_LIGHT = [248, 250, 252] as const // slate-50
const COR_BORDA = [226, 232, 240] as const // slate-200
const COR_ROSE = [225, 29, 72] as const

function formatarMoeda(val?: number): string {
  if (val === undefined || val === null || isNaN(val)) return 'R$ 0,00'
  return 'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function aplicarCabecalhoPadrao(
  doc: jsPDF,
  tituloSecao: string,
  clienteNome?: string,
  empresaNome?: string,
) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 16

  // Faixa Superior Navy
  doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.rect(0, 0, pageWidth, 32, 'F')

  // Faixa Dourada Diamond
  doc.setFillColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
  doc.rect(0, 32, pageWidth, 2, 'F')

  // Topo do Header
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('CONTABILIDADE 5.0 • DIAMOND GROUP', margin, 13)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
  doc.text(
    'INTELIGÊNCIA TRIBUTÁRIA E GOVERNANÇA CORPORATIVA (EC 132/2023 · LC 214/2025)',
    margin,
    19,
  )

  doc.setFontSize(7.5)
  doc.setTextColor(203, 213, 225)
  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const infoCliente = clienteNome ? `CLIENTE ATIVO: ${clienteNome}  |  ` : ''
  const infoEmpresa = empresaNome ? `EMPRESA: ${empresaNome}  |  ` : ''
  doc.text(`${infoCliente}${infoEmpresa}Emissão: ${dataHoje} | Documento Confidencial`, margin, 26)

  // Subtítulo da seção logo abaixo da barra dourada
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.text(tituloSecao.toUpperCase(), margin, 42)

  doc.setDrawColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
  doc.line(margin, 44, margin + 40, 44)

  return 52
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
      'Contabilidade 5.0 — Diamond Group | Diagnóstico Estrutural e Enquadramento Tributário',
      margin,
      pageHeight - 8,
    )
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 22, pageHeight - 8)
  }
}

/**
 * RELATÓRIO INDIVIDUAL: ETAPA 1 - CONFIGURAÇÕES
 */
export function exportarPdfEtapaConfiguracoes(
  dadosEmpresa: DadosEmpresaPerfil | null,
  clienteNome?: string,
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margin = 16
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - margin * 2

  const empresa = dadosEmpresa?.nomeEmpresa || 'Empresa não informada'
  let y = aplicarCabecalhoPadrao(
    doc,
    'Relatório de Configurações e Parâmetros Base',
    clienteNome,
    empresa,
  )

  if (!dadosEmpresa) {
    doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(COR_ROSE[0], COR_ROSE[1], COR_ROSE[2])
    doc.text('ETAPA NÃO CONCLUÍDA', margin + 6, y + 10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
    doc.text(
      'Os dados operacionais da empresa ainda não foram cadastrados nas Configurações da Trilha.',
      margin + 6,
      y + 16,
    )
    aplicarRodape(doc)
    doc.save('Diagnostico_Etapa01_Configuracoes.pdf')
    return
  }

  doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(margin, y, contentWidth, 75, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.text('DADOS CADASTRAIS & LOCALIZAÇÃO', margin + 6, y + 8)

  const campos = [
    { rotulo: 'Razão Social:', valor: dadosEmpresa.nomeEmpresa || '—' },
    { rotulo: 'CNPJ:', valor: dadosEmpresa.cnpj ? formatarCNPJ(dadosEmpresa.cnpj) : '—' },
    { rotulo: 'Contato / Responsável:', valor: dadosEmpresa.nomeContato || '—' },
    { rotulo: 'E-mail:', valor: dadosEmpresa.email || '—' },
    { rotulo: 'Telefone / WhatsApp:', valor: dadosEmpresa.telefone || '—' },
    { rotulo: 'UF de Origem:', valor: dadosEmpresa.ufOrigem || '—' },
    { rotulo: 'Cidade de Operação:', valor: dadosEmpresa.cidade || '—' },
    { rotulo: 'Segmento Homologado:', valor: dadosEmpresa.segmento || '—' },
    { rotulo: 'Regime Tributário Atual:', valor: dadosEmpresa.regimeAtual || '—' },
    { rotulo: 'Quadro de Colaboradores:', valor: dadosEmpresa.funcionarios || '—' },
    { rotulo: 'Perfil de Emissão NF:', valor: dadosEmpresa.emissaoNf || '—' },
    {
      rotulo: 'Atividade Mista (Comércio + Serviço):',
      valor: dadosEmpresa.atividadeMista
        ? `Sim (${dadosEmpresa.proporcaoServicoMisto ?? 50}% Serviços)`
        : 'Não (Atividade Pura)',
    },
    { rotulo: 'Ano-Base da Transição:', valor: String(dadosEmpresa.anoBaseTransicao || 2026) },
  ]

  let campoY = y + 16
  const col1X = margin + 6
  const col2X = margin + 98

  campos.forEach((c, idx) => {
    const isCol2 = idx >= 7
    const curX = isCol2 ? col2X : col1X
    const actualY = isCol2 ? y + 16 + (idx - 7) * 8 : campoY

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    doc.text(c.rotulo, curX, actualY)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
    doc.text(String(c.valor), curX + 42, actualY)

    if (!isCol2) {
      campoY += 8
    }
  })

  aplicarRodape(doc)
  doc.save(
    `Diagnostico_Etapa01_Configuracoes_${dadosEmpresa.nomeEmpresa ? dadosEmpresa.nomeEmpresa.replace(/\s+/g, '_') : 'empresa'}.pdf`,
  )
}

/**
 * RELATÓRIO INDIVIDUAL: ETAPA 2 - AUTOAVALIAÇÃO DAS 7 FRENTES
 */
export function exportarPdfEtapaAutoavaliacao(
  diag: DiagnosticoRecord | null,
  clienteNome?: string,
  empresaNome?: string,
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margin = 16
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - margin * 2

  const empresa = diag?.empresa || empresaNome || 'Empresa não informada'
  let y = aplicarCabecalhoPadrao(
    doc,
    'Relatório de Autoavaliação das 7 Frentes (Matriz Semáforo & 30-60-90)',
    clienteNome,
    empresa,
  )

  const extra = diag?.dados_extra_json
  if (!diag || !extra) {
    doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(COR_ROSE[0], COR_ROSE[1], COR_ROSE[2])
    doc.text('ETAPA NÃO CONCLUÍDA', margin + 6, y + 10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
    doc.text(
      'A autoavaliação das 7 frentes (14 perguntas) ainda não foi realizada para este cliente.',
      margin + 6,
      y + 16,
    )
    aplicarRodape(doc)
    doc.save('Diagnostico_Etapa02_Autoavaliacao.pdf')
    return
  }

  const resumo = extra.resumo || {}

  // Resumo Global
  doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
  doc.text('PERFIL GLOBAL DE MATURIDADE E CONTROLE', margin + 6, y + 8)

  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text(resumo.perfil || 'Mapeamento Estrutural das 7 Frentes', margin + 6, y + 16)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(203, 213, 225)
  doc.text(
    `Críticos: ${resumo.totalCriticos || 0}  |  Alertas: ${resumo.totalAlertas || 0}  |  Controlados: ${resumo.totalControlados || 0} (Total de 14 respostas avaliadas)`,
    margin + 6,
    y + 22,
  )

  y += 33

  // Tabela das 7 frentes
  doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.rect(margin, y, contentWidth, 7, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('Frente Estrutural', margin + 4, y + 5)
  doc.text('Dimensão 1 (Exposição)', margin + 70, y + 5)
  doc.text('Dimensão 2 (Proteção)', margin + 115, y + 5)
  doc.text('Score / Classificação', margin + 155, y + 5)

  y += 7

  const scores = extra.scoresPorFrente || {}
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
    const item = scores[f] || { scoreMedio: 2, p1: 2, p2: 2 }
    const nivelLabel = (n: number) =>
      n === 3 ? 'Alto (Crítico)' : n === 2 ? 'Médio (Alerta)' : 'Baixo (Controlado)'
    const scoreMedio = item.scoreMedio || 2
    const statusLabel = scoreMedio >= 2.5 ? 'Crítico' : scoreMedio >= 1.75 ? 'Alerta' : 'Controlado'

    doc.setFillColor(f % 2 === 0 ? 255 : 248, f % 2 === 0 ? 255 : 250, f % 2 === 0 ? 255 : 252)
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.rect(margin, y, contentWidth, 7, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
    doc.text(FRENTES_NOMES[f] || `Frente ${f}`, margin + 4, y + 4.8)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    doc.text(nivelLabel(item.p1), margin + 70, y + 4.8)
    doc.text(nivelLabel(item.p2), margin + 115, y + 4.8)

    doc.setFont('helvetica', 'bold')
    if (statusLabel === 'Crítico') doc.setTextColor(COR_ROSE[0], COR_ROSE[1], COR_ROSE[2])
    else if (statusLabel === 'Alerta') doc.setTextColor(217, 119, 6)
    else doc.setTextColor(COR_EMERALD[0], COR_EMERALD[1], COR_EMERALD[2])

    doc.text(`${scoreMedio.toFixed(1)} / 3.0 • ${statusLabel}`, margin + 155, y + 4.8)

    y += 7
  }

  y += 6

  // Plano de Ação 30-60-90
  doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
  doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.text('PLANO DE AÇÃO 30-60-90 ESTRUTURADO', margin + 6, y + 7)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
  doc.text(
    '• 30 Dias (Liquidez Rápida e Crédito): Renegociação de dívidas, blindagem do fluxo de caixa e contingências imediatas.',
    margin + 6,
    y + 14,
  )
  doc.text(
    '• 60 Dias (Societário, Parcerias e Governança): Revisão de contratos sociais, alinhamento de sócios e auditoria fiscal preventiva.',
    margin + 6,
    y + 21,
  )
  doc.text(
    '• 90 Dias (Transição Tributária, Cultura e Processos): Adequação de ERP, treinamento fiscal interno e plano de sucessão.',
    margin + 6,
    y + 28,
  )

  aplicarRodape(doc)
  doc.save(`Diagnostico_Etapa02_Autoavaliacao_${empresa.replace(/\s+/g, '_')}.pdf`)
}

/**
 * RELATÓRIO INDIVIDUAL: ETAPA 3 - TRANSIÇÃO FISCAL
 */
export function exportarPdfEtapaTransicao(
  diag: DiagnosticoRecord | null,
  clienteNome?: string,
  empresaNome?: string,
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margin = 16
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - margin * 2

  const empresa = diag?.empresa || empresaNome || 'Empresa não informada'
  let y = aplicarCabecalhoPadrao(
    doc,
    'Relatório de Transição Fiscal (Roteiro 40 min · Farol & ERP)',
    clienteNome,
    empresa,
  )

  const extra = diag?.dados_extra_json
  if (!diag || !extra) {
    doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(COR_ROSE[0], COR_ROSE[1], COR_ROSE[2])
    doc.text('ETAPA NÃO CONCLUÍDA', margin + 6, y + 10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
    doc.text(
      'O diagnóstico de Transição Fiscal ainda não foi concluído para este cliente.',
      margin + 6,
      y + 16,
    )
    aplicarRodape(doc)
    doc.save('Diagnostico_Etapa03_Transicao.pdf')
    return
  }

  const laudo = extra.laudo || {}

  // Farol Box
  doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
  doc.text('PARECER DE TRANSIÇÃO E FAROL DE RISCO', margin + 6, y + 8)

  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text(laudo.farol || 'Farol de Urgência da Transição Fiscal', margin + 6, y + 17)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(203, 213, 225)
  doc.text(
    `Serviço Recomendado: ${laudo.servicoRecomendado || 'Diagnóstico e Adequação Fiscal'}`,
    margin + 6,
    y + 24,
  )

  y += 36

  // Prioridades 90 dias
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.text('AS 3 PRIORIDADES ESTRATÉGICAS PARA OS PRÓXIMOS 90 DIAS', margin, y + 4)

  y += 8

  const prioridades: string[] = laudo.prioridades || [
    'Revisar cadastros de produtos e serviços para enquadramento na LC 214/2025',
    'Conectar o sistema ERP aos requisitos do Split Payment automatizado',
    'Auditar a cadeia de compras para maximizar créditos da CBS e IBS',
  ]

  prioridades.forEach((p, idx) => {
    doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
    doc.text(`0${idx + 1}`, margin + 4, y + 7.5)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    const pLinhas = doc.splitTextToSize(p, contentWidth - 20)
    doc.text(pLinhas, margin + 14, y + 7.5)

    y += 15
  })

  aplicarRodape(doc)
  doc.save(`Diagnostico_Etapa03_Transicao_${empresa.replace(/\s+/g, '_')}.pdf`)
}

/**
 * RELATÓRIO INDIVIDUAL: ETAPA 4 - COMPARAÇÃO DE REGIME
 */
export function exportarPdfEtapaRegimes(
  diag: DiagnosticoRecord | null,
  clienteNome?: string,
  empresaNome?: string,
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margin = 16
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - margin * 2

  const empresa = diag?.empresa || empresaNome || 'Empresa não informada'
  let y = aplicarCabecalhoPadrao(
    doc,
    'Relatório de Comparação dos 4 Regimes Societários',
    clienteNome,
    empresa,
  )

  const extra = diag?.dados_extra_json
  if (!diag || !extra) {
    doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(COR_ROSE[0], COR_ROSE[1], COR_ROSE[2])
    doc.text('ETAPA NÃO CONCLUÍDA', margin + 6, y + 10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
    doc.text(
      'A Comparação de Regimes Societários ainda não foi gerada para este cliente.',
      margin + 6,
      y + 16,
    )
    aplicarRodape(doc)
    doc.save('Diagnostico_Etapa04_Regimes.pdf')
    return
  }

  // Box Destaque
  doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
  doc.text('REGIME SOCIETÁRIO MAIS VANTAJOSO', margin + 6, y + 8)

  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text(
    diag.sistema_recomendado_novo || diag.regime_recomendado || 'Simples Nacional',
    margin + 6,
    y + 17,
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(COR_EMERALD[0], COR_EMERALD[1], COR_EMERALD[2])
  doc.text(
    `Economia Estimada: ${formatarMoeda(diag.economia_anual_novo || diag.economia_anual || 0)} / ano`,
    margin + 6,
    y + 23,
  )

  y += 35

  // Tabela Comparativa de Carga
  doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.rect(margin, y, contentWidth, 7, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('Regime Fiscal', margin + 4, y + 5)
  doc.text('Carga Sistema Atual', margin + 60, y + 5)
  doc.text('Carga Novo Sistema', margin + 110, y + 5)
  doc.text('Elegibilidade', margin + 155, y + 5)

  y += 7

  const regimes = [
    {
      nome: 'Simples Nacional',
      cargaAtual: diag.carga_simples,
      cargaNovo: diag.carga_simples_novo,
      elegivel: true,
    },
    {
      nome: 'Lucro Presumido',
      cargaAtual: diag.carga_presumido,
      cargaNovo: diag.carga_presumido_novo,
      elegivel: true,
    },
    {
      nome: 'Lucro Real',
      cargaAtual: diag.carga_real,
      cargaNovo: diag.carga_real_novo,
      elegivel: true,
    },
  ]

  regimes.forEach((r, idx) => {
    doc.setFillColor(
      idx % 2 === 0 ? 255 : 248,
      idx % 2 === 0 ? 255 : 250,
      idx % 2 === 0 ? 255 : 252,
    )
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.rect(margin, y, contentWidth, 8, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
    doc.text(r.nome, margin + 4, y + 5.5)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    doc.text(formatarMoeda(r.cargaAtual), margin + 60, y + 5.5)
    doc.text(formatarMoeda(r.cargaNovo || r.cargaAtual), margin + 110, y + 5.5)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COR_EMERALD[0], COR_EMERALD[1], COR_EMERALD[2])
    doc.text('Elegível', margin + 155, y + 5.5)

    y += 8
  })

  aplicarRodape(doc)
  doc.save(`Diagnostico_Etapa04_Regimes_${empresa.replace(/\s+/g, '_')}.pdf`)
}

/**
 * RELATÓRIO CONSOLIDADO COMPLETO (REUNINDO AS 5 ETAPAS)
 */
export function exportarPdfRelatorioConsolidado(dados: DadosRelatorioConsolidado) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margin = 16
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - margin * 2

  const empresa =
    dados.clienteNome ||
    dados.dadosEmpresa?.nomeEmpresa ||
    dados.diagnosticoEnquadramento?.empresa ||
    'Empresa do Cliente Ativo'

  let y = aplicarCabecalhoPadrao(
    doc,
    'Relatório Consolidado do Diagnóstico Tributário',
    dados.clienteNome,
    empresa,
  )

  // Sumário Executivo
  doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
  doc.text('DOSSIÊ CONSOLIDADO DA ESTEIRA DIAGNÓSTICA CONTABILIDADE 5.0', margin + 6, y + 8)

  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text(`Diagnóstico Integrado: ${empresa}`, margin + 6, y + 17)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(203, 213, 225)
  doc.text(
    'Reúne as 5 etapas da trilha: Configurações, Autoavaliação 360°, Transição Fiscal, Comparador e Enquadramento.',
    margin + 6,
    y + 23,
  )

  y += 34

  // SEÇÃO 1: CONFIGURAÇÕES
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.text('1. DADOS DAS CONFIGURAÇÕES E PARÂMETROS BASE', margin, y + 4)
  y += 7

  if (dados.dadosEmpresa) {
    doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'FD')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])

    doc.text(`• Razão Social: ${dados.dadosEmpresa.nomeEmpresa || '—'}`, margin + 4, y + 6)
    doc.text(
      `• CNPJ: ${dados.dadosEmpresa.cnpj ? formatarCNPJ(dados.dadosEmpresa.cnpj) : '—'}`,
      margin + 4,
      y + 12,
    )
    doc.text(
      `• Contato: ${dados.dadosEmpresa.nomeContato || '—'} (${dados.dadosEmpresa.email || '—'})`,
      margin + 4,
      y + 18,
    )
    doc.text(
      `• UF/Cidade: ${dados.dadosEmpresa.ufOrigem || '—'} / ${dados.dadosEmpresa.cidade || '—'}`,
      margin + 4,
      y + 24,
    )

    const col2 = margin + 95
    doc.text(`• Segmento: ${dados.dadosEmpresa.segmento || '—'}`, col2, y + 6)
    doc.text(`• Regime Atual: ${dados.dadosEmpresa.regimeAtual || '—'}`, col2, y + 12)
    doc.text(`• Colaboradores: ${dados.dadosEmpresa.funcionarios || '—'}`, col2, y + 18)
    doc.text(`• Perfil NF: ${dados.dadosEmpresa.emissaoNf || '—'}`, col2, y + 24)

    y += 36
  } else {
    doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(COR_ROSE[0], COR_ROSE[1], COR_ROSE[2])
    doc.text('ETAPA NÃO CONCLUÍDA', margin + 4, y + 6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
    doc.text('Parâmetros operacionais não cadastrados nas Configurações.', margin + 4, y + 10.5)
    y += 18
  }

  // SEÇÃO 2: AUTOAVALIAÇÃO DAS 7 FRENTES (MATRIZ SEMÁFORO COMPLETA)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.text('2. AUTOAVALIAÇÃO DAS 7 FRENTES (MATRIZ SEMÁFORO & PLANO 30-60-90)', margin, y + 4)
  y += 7

  if (dados.diagnosticoAutoavaliacao?.dados_extra_json) {
    const extra = dados.diagnosticoAutoavaliacao.dados_extra_json
    const resumo = extra.resumo || {}
    const scores = extra.scoresPorFrente || {}

    // Bloco resumo executivo do perfil
    doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(COR_GOLD[0], COR_GOLD[1], COR_GOLD[2])
    doc.text(
      `PERFIL GLOBAL: ${resumo.perfil || 'Mapeamento Estrutural das 7 Frentes'}`,
      margin + 4,
      y + 6.5,
    )

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(203, 213, 225)
    doc.text(
      `Semáforo Consolidado: ${resumo.totalCriticos || 0} Crítico(s) (Vermelho)  |  ${resumo.totalAlertas || 0} Alerta(s) (Amarelo)  |  ${resumo.totalControlados || 0} Controlado(s) (Verde) • 14 Respostas Avaliadas`,
      margin + 4,
      y + 13,
    )

    y += 22

    // Tabela completa da Matriz das 7 Frentes com Cores do Semáforo
    doc.setFillColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
    doc.rect(margin, y, contentWidth, 6.5, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.text('Frente Estrutural (7 Frentes Diamond)', margin + 3, y + 4.5)
    doc.text('Dimensão 1: Exposição & Vulnerab.', margin + 70, y + 4.5)
    doc.text('Dimensão 2: Proteção & Controle', margin + 118, y + 4.5)
    doc.text('Score & Semáforo', margin + 158, y + 4.5)

    y += 6.5

    const FRENTES_NOMES_MATRIZ: Record<number, string> = {
      1: '1. Financeiro & Crédito',
      2: '2. Investimentos & Wealth',
      3: '3. Societário & Parcerias — Risco Hub',
      4: '4. Fiscal & Contábil',
      5: '5. Tributário',
      6: '6. Jurídico',
      7: '7. Operacional, Humano & Cultura',
    }

    const nivelLabelTexto = (n?: number) =>
      n === 3
        ? 'Alto (Crítico)'
        : n === 2
          ? 'Médio (Alerta)'
          : n === 1
            ? 'Baixo (Controlado)'
            : 'Pendente'

    for (let f = 1; f <= 7; f++) {
      const item = scores[f] || { scoreMedio: 2, p1: 2, p2: 2 }
      const scoreMedio = typeof item.scoreMedio === 'number' ? item.scoreMedio : 2
      const p1 = item.p1 ?? 2
      const p2 = item.p2 ?? 2

      const isCritico = scoreMedio >= 2.5
      const isAlerta = !isCritico && scoreMedio >= 1.75
      const statusLabel = isCritico ? 'Crítico' : isAlerta ? 'Alerta' : 'Controlado'

      // Pinta a linha/célula no mesmo padrão visual do painel web da Matriz Semáforo
      // Vermelho (#FEE2E2 / borda #FCA5A5), Amarelo (#FEF3C7 / borda #FCD34D), Verde (#DCFCE7 / borda #86EFAC)
      if (isCritico) {
        doc.setFillColor(254, 242, 242) // rose-50 / red-50
        doc.setDrawColor(254, 205, 211) // rose-200
      } else if (isAlerta) {
        doc.setFillColor(254, 243, 199) // amber-50
        doc.setDrawColor(253, 230, 138) // amber-200
      } else {
        doc.setFillColor(236, 253, 245) // emerald-50
        doc.setDrawColor(167, 243, 208) // emerald-200
      }

      doc.rect(margin, y, contentWidth, 6.2, 'FD')

      // Badge/Semáforo indicador lateral colorido
      if (isCritico) {
        doc.setFillColor(225, 29, 72) // rose-600
      } else if (isAlerta) {
        doc.setFillColor(217, 119, 6) // amber-600
      } else {
        doc.setFillColor(22, 163, 74) // emerald-600
      }
      doc.rect(margin, y, 2, 6.2, 'F')

      // Nome da frente
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
      doc.text(FRENTES_NOMES_MATRIZ[f] || `Frente ${f}`, margin + 4, y + 4.3)

      // Dimensões 1 e 2
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
      doc.text(nivelLabelTexto(p1), margin + 70, y + 4.3)
      doc.text(nivelLabelTexto(p2), margin + 118, y + 4.3)

      // Célula do Semáforo com fundo e texto destacado
      if (isCritico) {
        doc.setFillColor(244, 63, 94) // rose-500
        doc.setTextColor(159, 18, 57) // rose-900
      } else if (isAlerta) {
        doc.setFillColor(245, 158, 11) // amber-500
        doc.setTextColor(146, 64, 14) // amber-900
      } else {
        doc.setFillColor(16, 185, 129) // emerald-500
        doc.setTextColor(6, 95, 70) // emerald-900
      }

      doc.setFont('helvetica', 'bold')
      doc.text(
        `${scoreMedio.toFixed(1)} / 3.0 • ${statusLabel.toUpperCase()}`,
        margin + 158,
        y + 4.3,
      )

      y += 6.2
    }

    y += 3
  } else {
    doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(COR_ROSE[0], COR_ROSE[1], COR_ROSE[2])
    doc.text('ETAPA NÃO CONCLUÍDA', margin + 4, y + 6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
    doc.text(
      'A autoavaliação interativa das 7 frentes ainda não foi preenchida.',
      margin + 4,
      y + 10.5,
    )
    y += 18
  }

  // SEÇÃO 3: TRANSIÇÃO FISCAL
  if (y > 225) {
    doc.addPage()
    y = 20
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.text('3. DIAGNÓSTICO DE TRANSIÇÃO FISCAL (REFORMA TRIBUTÁRIA 2026–2033)', margin, y + 4)
  y += 7

  if (dados.diagnosticoTransicao?.dados_extra_json) {
    const extra = dados.diagnosticoTransicao.dados_extra_json
    const laudo = extra.laudo || {}

    doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
    doc.text(`Farol de Risco: ${laudo.farol || 'Urgência Identificada'}`, margin + 4, y + 6)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    doc.text(
      `Solução recomendada: ${laudo.servicoRecomendado || 'Workshop e Adequação Fiscal'}`,
      margin + 4,
      y + 12,
    )
    doc.text(
      '3 Prioridades de 90 dias: Adequação cadastral · Split Payment ERP · Amplo aproveitamento de crédito CBS/IBS.',
      margin + 4,
      y + 17,
    )

    y += 26
  } else {
    doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(COR_ROSE[0], COR_ROSE[1], COR_ROSE[2])
    doc.text('ETAPA NÃO CONCLUÍDA', margin + 4, y + 6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
    doc.text('Roteiro de 40 minutos de Transição Fiscal ainda não executado.', margin + 4, y + 10.5)
    y += 18
  }

  // SEÇÃO 4 & 5: COMPARAÇÃO E ENQUADRAMENTO (se necessário cria nova página)
  if (y > 220) {
    doc.addPage()
    y = 20
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
  doc.text('4 & 5. COMPARAÇÃO DE REGIME E PARECER DO ENQUADRAMENTO COMPLETO', margin, y + 4)
  y += 7

  const enq = dados.diagnosticoEnquadramento || dados.diagnosticoRegimes
  if (enq) {
    doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(COR_NAVY[0], COR_NAVY[1], COR_NAVY[2])
    doc.text(
      `Regime Recomendado: ${enq.sistema_recomendado_novo || enq.regime_recomendado || 'Simples Nacional'}`,
      margin + 4,
      y + 7,
    )

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(COR_EMERALD[0], COR_EMERALD[1], COR_EMERALD[2])
    doc.text(
      `Economia Anual Estimada: ${formatarMoeda(enq.economia_anual_novo || enq.economia_anual || 0)} / ano`,
      margin + 4,
      y + 14,
    )

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(COR_TEXTO[0], COR_TEXTO[1], COR_TEXTO[2])
    doc.text(
      `Cargas tributárias anuais projetadas: Simples ${formatarMoeda(enq.carga_simples_novo || enq.carga_simples)}  |  Presumido ${formatarMoeda(enq.carga_presumido_novo || enq.carga_presumido)}  |  Real ${formatarMoeda(enq.carga_real_novo || enq.carga_real)}`,
      margin + 4,
      y + 21,
    )
    doc.text(
      `Ano-Base Simulado: ${enq.ano_base || 2026}  |  RBT12: ${formatarMoeda(enq.rbt12)}  |  Folha 12m: ${formatarMoeda(enq.folha12)}`,
      margin + 4,
      y + 27,
    )
  } else {
    doc.setFillColor(COR_BG_LIGHT[0], COR_BG_LIGHT[1], COR_BG_LIGHT[2])
    doc.setDrawColor(COR_BORDA[0], COR_BORDA[1], COR_BORDA[2])
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(COR_ROSE[0], COR_ROSE[1], COR_ROSE[2])
    doc.text('ETAPA NÃO CONCLUÍDA', margin + 4, y + 6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COR_MUTED[0], COR_MUTED[1], COR_MUTED[2])
    doc.text(
      'O simulador de enquadramento completo com ranking ainda não foi calculado.',
      margin + 4,
      y + 10.5,
    )
  }

  aplicarRodape(doc)
  doc.save(`Relatorio_Consolidado_Diagnostico_${empresa.replace(/\s+/g, '_')}.pdf`)
}
