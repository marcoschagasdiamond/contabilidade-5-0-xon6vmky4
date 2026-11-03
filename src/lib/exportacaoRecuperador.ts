import type {
  ParametrosRecuperador,
  ResultadosRecuperador,
  SimulacaoRecuperador,
} from '@/types/recuperadorCreditos'
import { formatarMoeda } from '@/lib/calculadoraUtils'
import { gerarParecerRecuperadorPDF } from '@/lib/pdfRecuperadorCreditos'
import type { ResponsavelTecnicoDados } from '@/components/calculadora/ModalGerarPdf'

export interface DadosParaExportacaoRecuperador {
  nomeAnalise: string
  empresa?: string
  cnpj?: string
  dataRegistro?: string
  parametros: ParametrosRecuperador
  resultados: ResultadosRecuperador
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
 * Constrói a planilha estruturada em CSV com todos os parâmetros e resultados do Recuperador de Créditos:
 * 1. Identificação e dados da empresa / parâmetros (faturamento, folha, período auditado)
 * 2. Parâmetros operacionais e alíquotas cadastradas
 * 3. Resumo executivo (Cenário Integral vs. Cenário Conservador e acréscimo SELIC)
 * 4. Créditos identificados por bloco de tributo (PIS/COFINS, Folha/Previdenciário, IRPJ/CSLL, ICMS/ISS/Outros)
 * 5. Distribuição por farol de risco (Verde, Amarelo, Vermelho)
 * 6. Quadro completo de teses com valores originais e correção SELIC
 * 7. Apuração e evolução temporal ano a ano (60 meses) com faturamento e SELIC
 * 8. Crédito de estoque na virada da transição para IBS/CBS (LC 214/2025)
 * 9. Comparativo antes/depois com IBS/CBS (EC 132/2023 & LC 214/2025)
 * 10. Premissas técnicas e aviso legal orientativo
 */
export function gerarCsvRecuperador(dados: DadosParaExportacaoRecuperador): string {
  const { nomeAnalise, empresa, cnpj, dataRegistro, parametros, resultados } = dados
  const linhas: string[] = []

  const adicionarLinha = (...colunas: any[]) => {
    linhas.push(colunas.map((col) => escaparCsv(col)).join(';'))
  }

  const cfg = parametros.configuracoes
  const anosAuditados = cfg.anosFaturamento || []
  const listaAnos = anosAuditados.map((a) => a.ano).sort((a, b) => a - b)
  const periodoAuditadoTexto =
    listaAnos.length > 0
      ? `${listaAnos[0]} a ${listaAnos[listaAnos.length - 1]} (${listaAnos.length} anos / 60 competências)`
      : 'Últimos 60 Meses (5 Anos)'

  // Faturamento total somado dos 60 meses
  const faturamentoTotal60Meses =
    anosAuditados.length > 0
      ? anosAuditados.reduce((acc, a) => acc + (a.faturamento || 0), 0)
      : (cfg.faturamentoMensal || 0) * 60

  const fatMedioAnual =
    anosAuditados.length > 0 ? faturamentoTotal60Meses / anosAuditados.length : 0
  const fatMedioMensal =
    cfg.faturamentoMensal && cfg.faturamentoMensal > 0 ? cfg.faturamentoMensal : fatMedioAnual / 12
  const pctCompras = cfg.percentualComprasVendas || 40

  // Crédito de estoque estimado na virada (LC 214/2025): 1,5 meses de compras x 8,80% CBS
  const comprasMensaisEstimadas = (fatMedioMensal * pctCompras) / 100
  const estoqueEstimadoVirada = comprasMensaisEstimadas * 1.5
  const creditoEstoqueEstimado = (estoqueEstimadoVirada * 8.8) / 100

  // Comparativo antes / depois IBS/CBS
  const regimeAtualEmpresa = cfg.regimeAtual || 'Lucro Presumido'
  let aliqAtualRef = 14.65
  if (regimeAtualEmpresa === 'Lucro Real') aliqAtualRef = 26.25
  else if (regimeAtualEmpresa === 'Simples Nacional') aliqAtualRef = 10.5

  const impostoAtualAnual = (fatMedioAnual * aliqAtualRef) / 100
  const comprasAnuais = (fatMedioAnual * pctCompras) / 100
  const debitoIbsCbs = (fatMedioAnual * 26.5) / 100
  const creditoIbsCbs = (comprasAnuais * 26.5) / 100
  const impostoNovoAnual = Math.max(0, debitoIbsCbs - creditoIbsCbs)
  const diferencaAnual = impostoNovoAnual - impostoAtualAnual

  // CABEÇALHO DO ARQUIVO
  adicionarLinha('CONTABILIDADE 5.0 — RECUPERADOR DE CRÉDITOS TRIBUTÁRIOS (DIAMOND GROUP)')
  adicionarLinha('RELATÓRIO COMPLETO DE DADOS DA ANÁLISE DE CRÉDITOS (60 MESES)')
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

  // 1. IDENTIFICAÇÃO E PARÂMETROS DA EMPRESA
  adicionarLinha('=== 1. IDENTIFICAÇÃO DO CENÁRIO E DADOS DA EMPRESA ===')
  adicionarLinha('Nome da Análise / Cenário', nomeAnalise)
  adicionarLinha('Empresa / Razão Social', empresa || cfg.empresa || 'Não informada')
  adicionarLinha('CNPJ', cnpj || cfg.cnpj || 'Não informado')
  adicionarLinha('Data do Registro Original', dataRegistro || 'Recente (em tela)')
  adicionarLinha('Regime Tributário Declarado', cfg.regimeAtual)
  adicionarLinha('Segmento / Ramo de Atividade', cfg.segmento || 'Não informado')
  adicionarLinha('UF de Origem', cfg.uf || 'SP')
  adicionarLinha(
    'NCM Informado (LC 214/2025)',
    cfg.ncm
      ? `${cfg.ncm} (${cfg.ncmCategoriaRotulo || 'Curado'}) - ${cfg.ncmOrigemSugerida ? 'Sugerido via NCM' : 'Manual'}`
      : 'Não informado (Manual)',
  )
  adicionarLinha('Período Auditado (Escopo)', periodoAuditadoTexto)
  adicionarLinha('')

  // 2. PARÂMETROS OPERACIONAIS E FOLHA
  adicionarLinha('=== 2. PARÂMETROS OPERACIONAIS E BASES DE CÁLCULO ===')
  adicionarLinha(
    'Faturamento Total (60 Meses)',
    formatarMoeda(faturamentoTotal60Meses),
    faturamentoTotal60Meses,
  )
  adicionarLinha('Faturamento Médio Mensal', formatarMoeda(fatMedioMensal), fatMedioMensal)
  adicionarLinha(
    'Massa Salarial Mensal',
    formatarMoeda(cfg.massaSalarialMensal),
    cfg.massaSalarialMensal,
  )
  adicionarLinha(
    'Massa Salarial Anual Estimada',
    formatarMoeda(cfg.massaSalarialMensal * 12),
    cfg.massaSalarialMensal * 12,
  )
  adicionarLinha('Número Médio de Empregados', cfg.numeroMedioEmpregados)
  adicionarLinha('Rotatividade Anual da Folha', `${cfg.percentualRotatividadeAnual}% a.a.`)
  adicionarLinha(
    'Alíquota Patronal Composta (INSS + Terceiros + RAT)',
    `${cfg.aliquotaPatronalComposta}%`,
  )
  adicionarLinha('Alíquota Padrão PIS/COFINS', `${cfg.aliquotaPisCofinsPadrao}%`)
  adicionarLinha('Compras e Insumos (% s/ Faturamento)', `${pctCompras}%`)
  adicionarLinha('')

  // 3. RESUMO EXECUTIVO CONSOLIDADO
  adicionarLinha('=== 3. RESUMO EXECUTIVO DOS CRÉDITOS APURADOS ===')
  adicionarLinha(
    'Total Recuperável Integral (c/ SELIC)',
    formatarMoeda(resultados.totalIntegralCorrigido),
    resultados.totalIntegralCorrigido,
  )
  adicionarLinha(
    'Principal Histórico Original (Integral)',
    formatarMoeda(resultados.totalIntegralOriginal),
    resultados.totalIntegralOriginal,
  )
  adicionarLinha(
    'Acréscimo Monetário Taxa SELIC (Integral)',
    formatarMoeda(resultados.totalIntegralSelic),
    resultados.totalIntegralSelic,
  )
  adicionarLinha(
    'Ganho Financeiro Médio SELIC (%)',
    resultados.totalIntegralOriginal > 0
      ? `${((resultados.totalIntegralSelic / resultados.totalIntegralOriginal) * 100).toFixed(1)}%`
      : '0,0%',
  )
  adicionarLinha(
    'Total Recuperável Conservador (Apenas Farol Verde)',
    formatarMoeda(resultados.totalConservadorCorrigido),
    resultados.totalConservadorCorrigido,
  )
  adicionarLinha(
    'Principal Original Conservador',
    formatarMoeda(resultados.totalConservadorOriginal),
    resultados.totalConservadorOriginal,
  )
  adicionarLinha(
    'Acréscimo SELIC Conservador',
    formatarMoeda(resultados.totalConservadorSelic),
    resultados.totalConservadorSelic,
  )
  adicionarLinha('')

  // 4. DISTRIBUIÇÃO POR BLOCO DE TRIBUTO
  adicionarLinha('=== 4. CRÉDITOS POR BLOCO DE TRIBUTO (VALORES COM CORREÇÃO SELIC) ===')
  adicionarLinha('Bloco Tributário', 'Total Corrigido (R$)', '% do Total Integral')
  adicionarLinha(
    'PIS / COFINS (Faturamento e Insumos)',
    formatarMoeda(resultados.totalPisCofinsCorrigido),
    resultados.totalIntegralCorrigido > 0
      ? `${((resultados.totalPisCofinsCorrigido / resultados.totalIntegralCorrigido) * 100).toFixed(1)}%`
      : '0%',
  )
  adicionarLinha(
    'Folha de Pagamento & Previdenciário (INSS/RAT)',
    formatarMoeda(resultados.totalFolhaCorrigido),
    resultados.totalIntegralCorrigido > 0
      ? `${((resultados.totalFolhaCorrigido / resultados.totalIntegralCorrigido) * 100).toFixed(1)}%`
      : '0%',
  )
  adicionarLinha(
    'IRPJ & CSLL (Diretos Federais / Lucro Presumido e Real)',
    formatarMoeda(resultados.totalIrpjCsllCorrigido || 0),
    resultados.totalIntegralCorrigido > 0
      ? `${(((resultados.totalIrpjCsllCorrigido || 0) / resultados.totalIntegralCorrigido) * 100).toFixed(1)}%`
      : '0%',
  )
  adicionarLinha(
    'ICMS, ISS & ITCMD (Estaduais e Municipais)',
    formatarMoeda(resultados.totalOutrosTributosCorrigido || 0),
    resultados.totalIntegralCorrigido > 0
      ? `${(((resultados.totalOutrosTributosCorrigido || 0) / resultados.totalIntegralCorrigido) * 100).toFixed(1)}%`
      : '0%',
  )
  adicionarLinha('')

  // 5. DISTRIBUIÇÃO POR FAROL DE RISCO JURÍDICO
  adicionarLinha('=== 5. DISTRIBUIÇÃO POR FAROL DE RISCO JURÍDICO ===')
  adicionarLinha('Classificação de Risco', 'Total Corrigido (R$)', 'Status / Jurisprudência')
  adicionarLinha(
    'Farol Verde (Baixo Risco)',
    formatarMoeda(resultados.totalVerdeCorrigido),
    'Jurisprudência pacificada STF / STJ (Aproveitamento seguro)',
  )
  adicionarLinha(
    'Farol Amarelo (Risco Moderado)',
    formatarMoeda(resultados.totalAmareloCorrigido),
    'Depende de laudo técnico, auditoria contábil ou decisão judicial',
  )
  adicionarLinha(
    'Farol Vermelho (Alto Risco)',
    formatarMoeda(resultados.totalVermelhoCorrigido),
    'Tese em disputa jurisprudencial / Discussão judicial recomendada',
  )
  adicionarLinha('')

  // 6. QUADRO CONSOLIDADO DE TESES SELECIONADAS
  adicionarLinha('=== 6. DETALHAMENTO DE TESES COM CORREÇÃO SELIC ===')
  adicionarLinha(
    'Código / Tese',
    'Módulo Tributário',
    'Origem da Seleção',
    'Farol de Risco',
    'Status na Simulação',
    'Original 60 Meses (R$)',
    'Acréscimo SELIC (R$)',
    'Total Corrigido (R$)',
  )
  resultados.resultadosTeses.forEach((t) => {
    const moduloNome =
      t.modulo === 'pis_cofins'
        ? 'PIS/COFINS'
        : t.modulo === 'folha'
          ? 'Folha/INSS'
          : t.modulo === 'irpj_csll'
            ? 'IRPJ/CSLL'
            : 'ICMS/ISS/Outros'
    const origemTexto =
      t.origem === 'ncm_sugerido'
        ? `Sugerido via NCM${t.ncmReferencia ? ` (${t.ncmReferencia})` : ''}`
        : 'Manual'
    adicionarLinha(
      `${t.titulo} [${t.fundamento}]`,
      moduloNome,
      origemTexto,
      t.farol.toUpperCase(),
      t.ativa ? 'ATIVA' : 'INATIVA',
      formatarMoeda(t.valorOriginalTotal),
      formatarMoeda(t.correcaoSelicTotal),
      formatarMoeda(t.totalCorrigido),
    )
  })
  adicionarLinha('')

  // 7. APURAÇÃO E EVOLUÇÃO TEMPORAL ANO A ANO (60 MESES)
  adicionarLinha('=== 7. EVOLUÇÃO TEMPORAL ANO A ANO COM TAXA SELIC ===')
  adicionarLinha(
    'Ano-Calendário',
    'Faturamento Declarado (R$)',
    'Crédito Original (R$)',
    'Correção SELIC (R$)',
    'Total Corrigido (R$)',
  )
  resultados.totaisPorAno.forEach((anoItem) => {
    const fatAno = anosAuditados.find((a) => a.ano === anoItem.ano)?.faturamento || 0
    adicionarLinha(
      `Ano ${anoItem.ano}`,
      formatarMoeda(fatAno),
      formatarMoeda(anoItem.valorOriginal),
      formatarMoeda(anoItem.correcaoSelic),
      formatarMoeda(anoItem.totalCorrigido),
    )
  })
  adicionarLinha('')

  // 8. CRÉDITO DE ESTOQUE NA TRANSIÇÃO DA REFORMA (LC 214/2025)
  adicionarLinha('=== 8. CRÉDITO PRESUMIDO DE ESTOQUE NA TRANSIÇÃO (LC 214/2025) ===')
  adicionarLinha('Faturamento Médio Anual', formatarMoeda(fatMedioAnual), fatMedioAnual)
  adicionarLinha(
    'Compras Mensais Estimadas',
    formatarMoeda(comprasMensaisEstimadas),
    comprasMensaisEstimadas,
  )
  adicionarLinha(
    'Estoque Físico Estimado na Virada (1,5 meses de compras)',
    formatarMoeda(estoqueEstimadoVirada),
    estoqueEstimadoVirada,
  )
  adicionarLinha('Alíquota do Crédito Presumido CBS na Virada', '8,80% (Artigo 385 da LC 214/2025)')
  adicionarLinha(
    'Crédito Presumido de Estoque Estimado',
    formatarMoeda(creditoEstoqueEstimado),
    creditoEstoqueEstimado,
  )
  adicionarLinha('Forma de Aproveitamento', 'Abatimento direto de débitos de CBS a partir de 2027')
  adicionarLinha('')

  // 9. COMPARATIVO ANTES / DEPOIS COM IBS / CBS (EC 132/2023 & LC 214/2025)
  adicionarLinha('=== 9. COMPARATIVO SISTEMA ATUAL VERSUS IBS / CBS (REFORMA TRIBUTÁRIA) ===')
  adicionarLinha('Regime Fiscal Atual da Empresa', regimeAtualEmpresa)
  adicionarLinha(
    'Tributos Extintos na Transição',
    'PIS, COFINS, IPI, ICMS e ISS (Substituídos por CBS e IBS)',
  )
  adicionarLinha(
    'Carga Anual Vigente Estimada (Sistema Atual)',
    formatarMoeda(impostoAtualAnual),
    impostoAtualAnual,
  )
  adicionarLinha('Alíquota Padrão Referencial IBS + CBS', '26,50% (IVA Dual)')
  adicionarLinha(
    'Crédito Anual de Insumos e Compras Projetado (IBS/CBS)',
    formatarMoeda(creditoIbsCbs),
    creditoIbsCbs,
  )
  adicionarLinha(
    'Carga Líquida Anual Projetada no Novo Sistema',
    formatarMoeda(impostoNovoAnual),
    impostoNovoAnual,
  )
  adicionarLinha(
    'Variação Anual Projetada (IBS/CBS - Atual)',
    formatarMoeda(diferencaAnual),
    diferencaAnual <= 0 ? 'ECONOMIA PROJETADA' : 'ACRÉSCIMO PROJETADO',
  )
  adicionarLinha(
    'Sinergia com Créditos Apurados (60m)',
    formatarMoeda(resultados.totalIntegralCorrigido),
    'Compensação cruzada via PER/DCOMP e amortização do Split Payment',
  )
  adicionarLinha('')

  // 10. PREMISSAS TÉCNICAS E AVISO LEGAL
  adicionarLinha('=== 10. PREMISSAS TÉCNICAS E AVISO LEGAL ORIENTATIVO ===')
  adicionarLinha(
    'Base Legal e Jurisprudência',
    'STF (Temas 69, 962, 1008), STJ (Temas 1008, 918, 851), EC 132/2023 e LC 214/2025.',
  )
  adicionarLinha(
    'Condições de Homologação',
    'Valores preliminares calculados por parametrização. A compensação via PER/DCOMP exige validação de SPED, DCTF Web e eSocial.',
  )
  adicionarLinha('Emissor', 'Diamond Group • Contabilidade 5.0')

  return '\uFEFF' + linhas.join('\r\n')
}

/**
 * Constrói e dispara o download do arquivo CSV / Planilha Excel compatível (.csv com UTF-8 BOM) do Recuperador.
 */
export function baixarPlanilhaCsvRecuperador(
  dados: DadosParaExportacaoRecuperador,
  prefixoArquivo = 'recuperador-creditos',
): void {
  const conteudoCsv = gerarCsvRecuperador(dados)
  const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const nomeSanitizado = (dados.nomeAnalise || 'analise_creditos')
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
 * Dispara a geração e download do parecer técnico em PDF do Recuperador de Créditos.
 */
export function baixarPdfRecuperador(
  dados: DadosParaExportacaoRecuperador,
  responsavelTecnico?: ResponsavelTecnicoDados,
): void {
  gerarParecerRecuperadorPDF({
    nomeAnalise: dados.nomeAnalise,
    parametros: dados.parametros,
    resultados: dados.resultados,
    clienteNome: dados.empresa,
    empresa: dados.empresa,
    cnpj: dados.cnpj,
    dataGeracao: dados.dataRegistro,
    responsavelTecnico,
    observacoesAnalista: responsavelTecnico?.observacoes,
  })
}

/**
 * Converte um objeto SimulacaoRecuperador salvo no histórico para a estrutura de exportação.
 */
export function converterSimulacaoRecuperadorSalvaParaExportacao(
  sim: SimulacaoRecuperador,
): DadosParaExportacaoRecuperador {
  return {
    nomeAnalise: sim.nome,
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
