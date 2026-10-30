import type {
  ParametrosSimulacaoCalculadora,
  ResultadosSimulacaoCalculadora,
  SimulacaoCalculadora,
} from '@/types/simulacaoCalculadora'
import { formatarMoeda } from '@/lib/calculadoraUtils'
import { gerarRelatorioSimulacaoPDF } from '@/lib/pdfSimulacaoCalculadora'
import type { ResponsavelTecnicoDados } from '@/components/calculadora/ModalGerarPdf'

export interface DadosParaExportacaoSimulacao {
  nomeSimulacao: string
  empresa?: string
  cnpj?: string
  dataRegistro?: string
  parametros: ParametrosSimulacaoCalculadora
  resultados: ResultadosSimulacaoCalculadora
}

/**
 * Escapa valores para formato CSV seguro com delimitador ponto-e-vírgula (padrão Brasil/Excel).
 */
function escaparCsv(val: any): string {
  if (val === null || val === undefined) return '""'
  const str = String(val).replace(/"/g, '""')
  return `"${str}"`
}

/**
 * Constrói a planilha estruturada em CSV com todos os parâmetros e resultados:
 * - Identificação e metadados
 * - Parâmetros operacionais (faturamento, regime, ramo, alíquotas, compras, margem, etc.)
 * - Resultados executivos do Dashboard (regime recomendado, alíquota efetiva, economias)
 * - Matriz comparativa dos 4 regimes (Simples, Presumido, Real, IBS/CBS)
 * - Detalhamento do Simples Nacional na Reforma (LC 214/2025)
 * - Módulo 4: Crédito financeiro e despesas com créditos
 * - Módulo 5: Transição ano a ano 2026–2033 (alíquotas CBS, IBS, total, imposto projetado e crédito estoque)
 * - Crédito Presumido de Estoque na Virada
 * - Split Payment (retenção, impacto no fluxo de caixa e custo de capital de giro)
 */
export function gerarCsvSimulacao(dados: DadosParaExportacaoSimulacao): string {
  const { nomeSimulacao, empresa, cnpj, dataRegistro, parametros, resultados } = dados
  const linhas: string[] = []

  const adicionarLinha = (
    col1: string,
    col2: any = '',
    col3: any = '',
    col4: any = '',
    col5: any = '',
    col6: any = '',
    col7: any = '',
  ) => {
    linhas.push(
      [
        escaparCsv(col1),
        escaparCsv(col2),
        escaparCsv(col3),
        escaparCsv(col4),
        escaparCsv(col5),
        escaparCsv(col6),
        escaparCsv(col7),
      ].join(';'),
    )
  }

  const p = parametros
  const r = resultados
  const d = r.resultadoDashboard
  const c = r.resultadoComparativo

  // CABEÇALHO DO ARQUIVO
  adicionarLinha('CONTABILIDADE 5.0 — SIMULADOR TRIBUTÁRIO IBS / CBS (DIAMOND GROUP)')
  adicionarLinha('RELATÓRIO COMPLETO DE DADOS DA SIMULAÇÃO')
  adicionarLinha(
    'Data de Emissão',
    new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  )
  adicionarLinha('')

  // 1. IDENTIFICAÇÃO DO CENÁRIO E DA EMPRESA
  adicionarLinha('=== 1. IDENTIFICAÇÃO DO CENÁRIO E DADOS DA EMPRESA ===')
  adicionarLinha('Nome do Cenário / Simulação', nomeSimulacao)
  adicionarLinha('Empresa / Razão Social', empresa || p.empresa || 'Não informada')
  adicionarLinha('CNPJ', cnpj || p.cnpj || 'Não informado')
  adicionarLinha('Data do Registro Original', dataRegistro || 'Recente (em tela)')
  adicionarLinha('UF de Origem', p.ufOrigem || 'SP')
  adicionarLinha(
    'Regime Tributário Atual Cadastrado',
    p.regimeAtualFiltro || p.regimeAtualEmpresa || 'Simples Nacional',
  )
  adicionarLinha('Período de Visualização', (p.periodoDashboard || 'mensal').toUpperCase())
  adicionarLinha('')

  // 2. PARÂMETROS OPERACIONAIS
  adicionarLinha('=== 2. PARÂMETROS DE ENTRADA DA OPERAÇÃO ===')
  adicionarLinha('Faturamento Mensal', formatarMoeda(p.faturamentoMensal), p.faturamentoMensal)
  adicionarLinha(
    'Faturamento Anual Projetado',
    formatarMoeda(p.faturamentoAnualProjetado || p.faturamentoMensal * 12),
    p.faturamentoAnualProjetado || p.faturamentoMensal * 12,
  )
  adicionarLinha('Ramo de Atividade', p.tipoAtividade)
  adicionarLinha('Preset Setorial LC 214/2025', p.config?.presetSetor || 'Nenhum')
  adicionarLinha(
    'Ano da Transição Selecionado',
    p.anoTransicaoDashboard === 'atual'
      ? 'Ano Atual (Pré-Reforma)'
      : p.anoTransicaoDashboard || p.config?.anoTransicao || 2033,
  )
  adicionarLinha(
    'Compras e Insumos (% s/ Faturamento)',
    `${p.percentualComprasVendasComparativo}%`,
    (p.faturamentoMensal * p.percentualComprasVendasComparativo) / 100,
  )
  adicionarLinha(
    'Folha de Pagamento Mensal',
    formatarMoeda(p.folhaPagamentoMensal),
    p.folhaPagamentoMensal,
  )
  adicionarLinha('Margem de Lucro Estimada', `${p.margemLucroEstimada}%`)
  adicionarLinha(
    'Despesas com Crédito Mensais',
    formatarMoeda(p.despesasComCreditosMensais),
    p.despesasComCreditosMensais,
  )
  adicionarLinha('Percentual de Exportação', `${p.percentualExportacao || 0}%`)
  adicionarLinha('Alíquota Padrão CBS (Módulo 1)', `${p.config?.cbsPadrao ?? 8.8}%`)
  adicionarLinha('Alíquota Padrão IBS (Módulo 1)', `${p.config?.ibsPadrao ?? 17.7}%`)
  adicionarLinha('Alíquota Soma IVA Dual Referência', `${p.config?.totalIvaDual ?? 26.5}%`)
  adicionarLinha('')

  // 3. RESULTADO EXECUTIVO CONSOLIDADO (DASHBOARD)
  adicionarLinha('=== 3. RESULTADO EXECUTIVO CONSOLIDADO (MÓDULO 6 - DASHBOARD) ===')
  adicionarLinha('Regime Fiscal Recomendado', d.regimeRecomendado)
  adicionarLinha('Alíquota Efetiva Vigente (Atual)', `${d.aliquotaEfetivaAtual.toFixed(2)}%`)
  adicionarLinha('Alíquota Efetiva Nova (IBS/CBS)', `${d.aliquotaEfetivaNova.toFixed(2)}%`)
  adicionarLinha(
    'Economia Mensal Projetada',
    d.economiaMensalProjetada >= 0
      ? formatarMoeda(d.economiaMensalProjetada)
      : 'Sem economia neste cenário',
    d.economiaMensalProjetada,
  )
  adicionarLinha(
    'Economia Anual Projetada',
    d.economiaAnualProjetada >= 0
      ? formatarMoeda(d.economiaAnualProjetada)
      : 'Sem economia neste cenário',
    d.economiaAnualProjetada,
  )
  adicionarLinha('')

  // 4. COMPARATIVO ATUAL X IBS/CBS POR REGIME (MÓDULO 3)
  adicionarLinha('=== 4. MATRIZ COMPARATIVA DE REGIMES (MENSAL) ===')
  adicionarLinha(
    'Regime Fiscal',
    'Impostos Brutos (R$)',
    'Créditos Apropriados (R$)',
    'Carga Efetiva Líquida (R$)',
    'Alíquota Efetiva (%)',
    'Status',
  )
  adicionarLinha(
    'Simples Nacional',
    formatarMoeda(c.simplesNacional.totalNominal),
    formatarMoeda(c.simplesNacional.creditos),
    formatarMoeda(c.simplesNacional.totalEfetivo),
    `${c.simplesNacional.aliquotaEfetiva.toFixed(2)}%`,
    d.regimeRecomendado === 'Simples Nacional' ? 'RECOMENDADO' : '',
  )
  adicionarLinha(
    'Lucro Presumido',
    formatarMoeda(c.lucroPresumido.totalNominal),
    formatarMoeda(c.lucroPresumido.creditos),
    formatarMoeda(c.lucroPresumido.totalEfetivo),
    `${c.lucroPresumido.aliquotaEfetiva.toFixed(2)}%`,
    d.regimeRecomendado === 'Lucro Presumido' ? 'RECOMENDADO' : '',
  )
  adicionarLinha(
    'Lucro Real',
    formatarMoeda(c.lucroReal.totalNominal),
    formatarMoeda(c.lucroReal.creditos),
    formatarMoeda(c.lucroReal.totalEfetivo),
    `${c.lucroReal.aliquotaEfetiva.toFixed(2)}%`,
    d.regimeRecomendado === 'Lucro Real' ? 'RECOMENDADO' : '',
  )
  adicionarLinha(
    'IBS / CBS (Reforma)',
    formatarMoeda(c.ibsCbs.totalNominal),
    formatarMoeda(c.ibsCbs.creditos),
    formatarMoeda(c.ibsCbs.totalEfetivo),
    `${c.ibsCbs.aliquotaEfetiva.toFixed(2)}%`,
    d.regimeRecomendado === 'IBS/CBS' || d.regimeRecomendado === 'IBS / CBS' ? 'RECOMENDADO' : '',
  )
  adicionarLinha('')

  // 5. DETALHAMENTO DO SIMPLES NACIONAL NA TRANSIÇÃO (LC 214/2025)
  if (c.simplesReforma) {
    adicionarLinha('=== 5. SIMPLES NACIONAL NA REFORMA TRIBUTÁRIA (LC 214/2025) ===')
    adicionarLinha(
      'DAS Atual Total',
      formatarMoeda(c.simplesReforma.dasAtualTotal),
      `${c.simplesReforma.aliquotaEfetivaAtual.toFixed(2)}%`,
    )
    adicionarLinha(
      'CBS no DAS',
      formatarMoeda(c.simplesReforma.cbsNoDas),
      `${c.simplesReforma.aliquotaEfetivaCbsNoDas.toFixed(2)}%`,
    )
    adicionarLinha(
      'IBS por Fora (Créditos Apropriáveis)',
      formatarMoeda(c.simplesReforma.ibsPorFora),
      `${c.simplesReforma.aliquotaEfetivaIbsPorFora.toFixed(2)}%`,
    )
    adicionarLinha(
      'Cenário Transição Consolidado',
      formatarMoeda(c.simplesReforma.cenarioTransicaoTotal),
      `${c.simplesReforma.aliquotaEfetivaTransicao.toFixed(2)}%`,
    )
    adicionarLinha('Diferença Mensal Projetada', formatarMoeda(c.simplesReforma.diferencaMensal))
    adicionarLinha('Descrição da Fase Legal', c.simplesReforma.descricaoFase)
    adicionarLinha('')
  }

  // 6. MÓDULO 4: SIMULADOR DE CRÉDITOS
  adicionarLinha('=== 6. CRÉDITO FINANCEIRO (MÓDULO 4 - ANTIGO VS. NOVO IVA DUAL) ===')
  adicionarLinha('Total de Crédito Regime Antigo', formatarMoeda(r.resultadoCreditos.totalAntigo))
  adicionarLinha('Total de Crédito Novo IVA Dual', formatarMoeda(r.resultadoCreditos.totalNovo))
  adicionarLinha('Ganho Adicional Mensal', formatarMoeda(r.resultadoCreditos.adicionalGanho))
  adicionarLinha('Economia Anual com Créditos', formatarMoeda(r.resultadoCreditos.economiaAnual))
  adicionarLinha('')

  if (p.despesasCreditos && p.despesasCreditos.length > 0) {
    adicionarLinha('Detalhamento das Categorias de Despesas / Créditos:')
    adicionarLinha(
      'Categoria',
      'Valor Mensal (R$)',
      'Alíq. Antiga (%)',
      'Crédito Antigo (R$)',
      'Alíq. Nova (%)',
      'Crédito Novo (R$)',
      'Ganho (R$)',
    )
    p.despesasCreditos.forEach((cat) => {
      const base = cat.valorMensal || 0
      const aAntiga = cat.aliquotaAntiga || 0
      const cAntigo = (base * aAntiga) / 100
      const aNova =
        cat.aliquotaNova !== undefined
          ? cat.aliquotaNova
          : (r.resultadoCreditos.aliquotaReferencia ?? 26.5)
      const cNovo = (base * aNova) / 100
      const ganho = cNovo - cAntigo
      adicionarLinha(
        cat.nome,
        formatarMoeda(base),
        `${aAntiga.toFixed(1)}%`,
        formatarMoeda(cAntigo),
        `${aNova.toFixed(1)}%`,
        formatarMoeda(cNovo),
        formatarMoeda(ganho),
      )
    })
    adicionarLinha('')
  }

  // 7. CRONOGRAMA DE TRANSIÇÃO 2026–2033 (MÓDULO 5)
  adicionarLinha('=== 7. CRONOGRAMA DA TRANSIÇÃO TRIBUTÁRIA (2026–2033) ===')
  adicionarLinha(
    'Ano',
    'Fase Constitucional / Base Legal',
    'Alíquota CBS (%)',
    'Alíquota IBS (%)',
    'Alíquota Total Efetiva (%)',
    'Imposto Anual Projetado (R$)',
    'Crédito Estoque Ano (R$)',
  )
  r.resultadoTransicao.forEach((item) => {
    adicionarLinha(
      item.ano === 'atual' ? 'Atual' : String(item.ano),
      item.fase,
      `${item.aliquotaCbs.toFixed(2)}%`,
      `${item.aliquotaIbs.toFixed(2)}%`,
      `${item.aliquotaEfetivaTotal.toFixed(2)}%`,
      formatarMoeda(item.impostoEstimado),
      item.creditoEstoqueAno ? formatarMoeda(item.creditoEstoqueAno) : 'R$ 0,00',
    )
  })
  adicionarLinha('')

  // 8. CRÉDITO PRESUMIDO DE ESTOQUE NA VIRADA
  if (r.resultadoEstoque || p.valorEstoqueVirada) {
    adicionarLinha('=== 8. CRÉDITO PRESUMIDO DE ESTOQUE (VIRADA DA TRANSIÇÃO) ===')
    const estoque = r.resultadoEstoque
    const vEstoque = estoque?.valorEstoqueVirada ?? p.valorEstoqueVirada ?? 0
    const aEstoque = estoque?.aliquotaCreditoPresumido ?? 9.25
    const cEstoque = estoque?.creditoTotalEstoque ?? (vEstoque * aEstoque) / 100
    const ecoAno1 = estoque?.economiaAno1 ?? cEstoque / 24
    adicionarLinha('Valor do Estoque na Virada', formatarMoeda(vEstoque), vEstoque)
    adicionarLinha('Alíquota do Crédito Presumido', `${aEstoque.toFixed(2)}%`)
    adicionarLinha('Crédito Total Presumido Apropriável', formatarMoeda(cEstoque), cEstoque)
    adicionarLinha(
      'Aproveitamento Anual Projetado (1/24 avos / ano)',
      formatarMoeda(ecoAno1),
      ecoAno1,
    )
    adicionarLinha('')
  }

  // 9. IMPACTO DE FLUXO DE CAIXA: SPLIT PAYMENT
  if (r.resultadoSplitPayment) {
    adicionarLinha('=== 9. SPLIT PAYMENT E CAPITAL DE GIRO ===')
    const sp = r.resultadoSplitPayment
    adicionarLinha(
      'Retenção Automática Mensal na Liquidação da NF',
      formatarMoeda(sp.retencaoMensalNota),
      sp.retencaoMensalNota,
    )
    adicionarLinha(
      'Recolhimento Atual Mensal (modelo clássico)',
      formatarMoeda(sp.recolhimentoAtualMensal),
      sp.recolhimentoAtualMensal,
    )
    adicionarLinha(
      'Diferença de Fluxo de Caixa Mensal',
      formatarMoeda(sp.diferencaFluxoCaixa),
      sp.diferencaFluxoCaixa,
    )
    adicionarLinha('Dias Médios de Antecipação de Recolhimento', `${sp.diasAntecipacao || 30} dias`)
    adicionarLinha(
      'Taxa Mensal de Custo do Capital de Giro',
      `${(sp.taxaMensalCapital || 1).toFixed(2)}% a.m.`,
    )
    adicionarLinha(
      'Custo Financeiro Anual Estimado de Giro',
      formatarMoeda(sp.custoCapitalAnual),
      sp.custoCapitalAnual,
    )
    adicionarLinha('')
  }

  // AVISO LEGAL
  adicionarLinha('=== 10. PREMISSAS TÉCNICAS E AVISO LEGAL ===')
  adicionarLinha('Legislação Aplicável', 'EC 132/2023, LC 214/2025 e regulamentos do CGIBS.')
  adicionarLinha(
    'Finalidade',
    'Consultiva, analítica e educacional. Não substitui o planejamento formal individualizado.',
  )
  adicionarLinha('Emissor', 'Diamond Group • Contabilidade 5.0')

  return '\uFEFF' + linhas.join('\r\n')
}

/**
 * Constrói e dispara o download do arquivo CSV / Planilha Excel compatível (.csv com UTF-8 BOM).
 */
export function baixarPlanilhaCsvSimulacao(
  dados: DadosParaExportacaoSimulacao,
  prefixoArquivo = 'simulacao-ibs-cbs',
): void {
  const conteudoCsv = gerarCsvSimulacao(dados)
  const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const nomeSanitizado = (dados.nomeSimulacao || 'cenario')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')

  const dataIso = new Date().toISOString().slice(0, 10)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${prefixoArquivo}_${nomeSanitizado}_${dataIso}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Dispara a geração e download do relatório técnico em PDF da simulação
 */
export function baixarPdfSimulacao(
  dados: DadosParaExportacaoSimulacao,
  responsavelTecnico?: ResponsavelTecnicoDados,
): void {
  gerarRelatorioSimulacaoPDF({
    nomeSimulacao: dados.nomeSimulacao,
    parametros: dados.parametros,
    resultados: dados.resultados,
    empresa: dados.empresa || dados.parametros.empresa,
    cnpj: dados.cnpj || dados.parametros.cnpj,
    clienteNome: dados.empresa,
    dataGeracao: dados.dataRegistro,
    responsavelTecnico,
    observacoesContador: responsavelTecnico?.observacoes,
  })
}

/**
 * Converte um objeto SimulacaoCalculadora salvo no histórico para a estrutura unificada de exportação.
 */
export function converterSimulacaoSalvaParaExportacao(
  sim: SimulacaoCalculadora,
): DadosParaExportacaoSimulacao {
  return {
    nomeSimulacao: sim.nome,
    empresa: sim.empresa,
    cnpj: sim.cnpj,
    dataRegistro: new Date(sim.created).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    parametros: sim.parametros,
    resultados: sim.resultados,
  }
}
