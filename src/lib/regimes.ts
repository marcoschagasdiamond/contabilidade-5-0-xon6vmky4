/**
 * Motor de Cálculo Tributário - Contabilidade 5.0
 * Compara Simples Nacional, Lucro Presumido e Lucro Real
 * com base na legislação brasileira vigente (2025).
 */

export type SegmentoEmpresa =
  | 'Comércio'
  | 'Serviços'
  | 'Indústria'
  | 'Saúde'
  | 'Educação'
  | 'Agro'
  | 'Transporte'
  | 'Tecnologia'
  | 'Construção Civil'
  | 'Bares e Restaurantes'

export const LISTA_SEGMENTOS: SegmentoEmpresa[] = [
  'Comércio',
  'Serviços',
  'Indústria',
  'Saúde',
  'Educação',
  'Agro',
  'Transporte',
  'Tecnologia',
  'Construção Civil',
  'Bares e Restaurantes',
]

export interface DadosEntradaDiagnostico {
  nome: string
  email: string
  telefone: string
  empresa: string
  segmento: SegmentoEmpresa
  rbt12: number // Receita Bruta acumulada dos últimos 12 meses
  folha12: number // Folha de pagamento dos últimos 12 meses (salários, pró-labore, encargos)
  margemLucro: number // Margem de lucro líquida estimada (0 a 100%)
}

export interface ResultadoRegime {
  nome: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real'
  elegivel: boolean
  motivoInelegibilidade?: string
  cargaAnual: number
  aliquotaEfetiva: number // percentual (ex: 12.5)
  detalhes: {
    irpj?: number
    csll?: number
    pisCofins?: number
    icmsOuIss?: number
    simplesGeral?: number
    anexoUtilizado?: string
    fatorR?: number
  }
  descricaoCurta: string
}

export interface ResultadoDiagnosticoCompleto {
  simples: ResultadoRegime
  presumido: ResultadoRegime
  real: ResultadoRegime
  regimeRecomendado: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real'
  economiaAnual: number // economia comparado com a segunda opção elegível mais vantajosa (ou 0)
  segundoMaisVantajoso?: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real'
  explicacaoRecomendacao: string
  fatorR: number
  fatorRElegivelAnexoIII: boolean
}

// Limites legais
export const LIMITE_SIMPLES = 4_800_000 // R$ 4,8 milhões
export const LIMITE_PRESUMIDO = 78_000_000 // R$ 78 milhões

// Faixas de faturamento do Simples Nacional
const FAIXAS_SIMPLES = [180_000, 360_000, 720_000, 1_800_000, 3_600_000, 4_800_000]

// Tabelas do Simples Nacional 2025: [aliquotaNominalPercentual, deducaoReais]
const TABELAS_SIMPLES = {
  // Comércio
  anexoI: [
    { max: 180_000, aliq: 4.0, deducao: 0 },
    { max: 360_000, aliq: 7.3, deducao: 4_500 },
    { max: 720_000, aliq: 9.5, deducao: 11_700 },
    { max: 1_800_000, aliq: 10.7, deducao: 19_950 },
    { max: 3_600_000, aliq: 14.93, deducao: 58_140 },
    { max: 4_800_000, aliq: 19.0, deducao: 54_000 },
  ],
  // Indústria
  anexoII: [
    { max: 180_000, aliq: 4.5, deducao: 0 },
    { max: 360_000, aliq: 7.8, deducao: 4_500 },
    { max: 720_000, aliq: 10.0, deducao: 9_900 },
    { max: 1_800_000, aliq: 11.2, deducao: 17_400 },
    { max: 3_600_000, aliq: 14.7, deducao: 35_500 },
    { max: 4_800_000, aliq: 19.0, deducao: 60_000 },
  ],
  // Serviços - Anexo III (Fator R >= 28%)
  anexoIII: [
    { max: 180_000, aliq: 6.0, deducao: 0 },
    { max: 360_000, aliq: 11.31, deducao: 9_360 },
    { max: 720_000, aliq: 13.5, deducao: 17_640 },
    { max: 1_800_000, aliq: 16.0, deducao: 35_640 },
    { max: 3_600_000, aliq: 21.0, deducao: 125_000 },
    { max: 4_800_000, aliq: 33.0, deducao: 648_000 },
  ],
  // Serviços - Anexo V (Fator R < 28%)
  anexoV: [
    { max: 180_000, aliq: 15.5, deducao: 0 },
    { max: 360_000, aliq: 18.0, deducao: 4_500 },
    { max: 720_000, aliq: 19.5, deducao: 9_900 },
    { max: 1_800_000, aliq: 20.5, deducao: 17_100 },
    { max: 3_600_000, aliq: 23.0, deducao: 62_100 },
    { max: 4_800_000, aliq: 30.5, deducao: 540_000 },
  ],
}

/**
 * Calcula a carga tributária do Simples Nacional
 */
export function calcularSimplesNacional(
  rbt12: number,
  folha12: number,
  segmento: SegmentoEmpresa,
): ResultadoRegime {
  if (rbt12 <= 0) {
    return {
      nome: 'Simples Nacional',
      elegivel: true,
      cargaAnual: 0,
      aliquotaEfetiva: 0,
      detalhes: {},
      descricaoCurta:
        'Regime simplificado que unifica impostos federais, estaduais e municipais em guia única (DAS).',
    }
  }

  if (rbt12 > LIMITE_SIMPLES) {
    return {
      nome: 'Simples Nacional',
      elegivel: false,
      motivoInelegibilidade: `Receita bruta anual (R$ ${rbt12.toLocaleString('pt-BR')}) excede o limite legal de R$ 4.800.000,00.`,
      cargaAnual: 0,
      aliquotaEfetiva: 0,
      detalhes: {},
      descricaoCurta:
        'Regime simplificado unificado em guia única (DAS), limitado a faturamento de até R$ 4,8 milhões/ano.',
    }
  }

  const fatorR = rbt12 > 0 ? folha12 / rbt12 : 0
  let tabela = TABELAS_SIMPLES.anexoI
  let anexoNome = 'Anexo I'

  // Mapeamento Simples Nacional por segmento:
  // - Comércio: Anexo I
  // - Indústria: Anexo II
  // - Agro: tributado predominantemente na revenda/produção rural comercial/industrial (Anexo I/II; Anexo I padrão comercial)
  // - Bares e Restaurantes: comercialização e preparo de alimentos e bebidas fora do estabelecimento (Anexo I padrão comercial)
  // - Transporte: Anexo III para transporte de passageiros / cargas
  // - Serviços em geral (Serviços, Saúde, Educação, Tecnologia, Construção Civil):
  //   Sujeitos à regra do Fator R (>= 28% -> Anexo III, < 28% -> Anexo V) ou Anexo III direto (Construção Civil/Saúde com Fator R)
  if (segmento === 'Comércio' || segmento === 'Agro' || segmento === 'Bares e Restaurantes') {
    tabela = TABELAS_SIMPLES.anexoI
    anexoNome = 'Anexo I (Comércio)'
  } else if (segmento === 'Indústria') {
    tabela = TABELAS_SIMPLES.anexoII
    anexoNome = 'Anexo II (Indústria)'
  } else if (segmento === 'Transporte') {
    // Transporte de passageiros/cargas enquadra-se no Anexo III
    tabela = TABELAS_SIMPLES.anexoIII
    anexoNome = 'Anexo III (Transporte)'
  } else {
    // Serviços, Saúde, Educação, Tecnologia, Construção Civil:
    // Avaliados com a regra do Fator R (>= 28% -> Anexo III, < 28% -> Anexo V)
    if (fatorR >= 0.28) {
      tabela = TABELAS_SIMPLES.anexoIII
      anexoNome = 'Anexo III (Fator R ≥ 28%)'
    } else {
      tabela = TABELAS_SIMPLES.anexoV
      anexoNome = 'Anexo V (Fator R < 28%)'
    }
  }

  // Encontrar faixa
  const faixa = tabela.find((f) => rbt12 <= f.max) || tabela[tabela.length - 1]

  // Fórmula: Alíquota Efetiva = (RBT12 * Alíquota Nominal - Dedução) / RBT12
  const aliquotaEfetivaPercent = ((rbt12 * (faixa.aliq / 100) - faixa.deducao) / rbt12) * 100
  const aliqEfetivaAjustada = Math.max(0, aliquotaEfetivaPercent)
  const cargaAnual = Math.round(rbt12 * (aliqEfetivaAjustada / 100) * 100) / 100

  return {
    nome: 'Simples Nacional',
    elegivel: true,
    cargaAnual,
    aliquotaEfetiva: Math.round(aliqEfetivaAjustada * 100) / 100,
    detalhes: {
      simplesGeral: cargaAnual,
      anexoUtilizado: anexoNome,
      fatorR: Math.round(fatorR * 1000) / 10,
    },
    descricaoCurta:
      'Unifica IRPJ, CSLL, PIS, COFINS, CPP e ICMS/ISS em guia única (DAS). Excelente para empresas com estrutura enxuta ou alto custo de folha salarial.',
  }
}

/**
 * Calcula a carga tributária do Lucro Presumido
 */
export function calcularLucroPresumido(rbt12: number, segmento: SegmentoEmpresa): ResultadoRegime {
  if (rbt12 <= 0) {
    return {
      nome: 'Lucro Presumido',
      elegivel: true,
      cargaAnual: 0,
      aliquotaEfetiva: 0,
      detalhes: {},
      descricaoCurta:
        'Tributação baseada em margem de lucro pré-fixada pela legislação sobre o faturamento bruto.',
    }
  }

  if (rbt12 > LIMITE_PRESUMIDO) {
    return {
      nome: 'Lucro Presumido',
      elegivel: false,
      motivoInelegibilidade: `Receita bruta anual (R$ ${rbt12.toLocaleString('pt-BR')}) excede o teto de R$ 78.000.000,00.`,
      cargaAnual: 0,
      aliquotaEfetiva: 0,
      detalhes: {},
      descricaoCurta:
        'Tributação simplificada sobre lucro pré-fixado pela Receita Federal, limitada a empresas com faturamento até R$ 78 milhões.',
    }
  }

  // Base de presunção IRPJ e CSLL no Lucro Presumido:
  // - Comércio, Indústria, Agro: IRPJ 8%, CSLL 12%, ICMS 12%
  // - Bares e Restaurantes: predominantemente venda de refeições/mercadorias -> presunção 8% IRPJ, 12% CSLL, ICMS 12%
  // - Transporte: serviços de transporte de passageiros/cargas possuem presunção própria legal de 16% no IRPJ (art. 15 da Lei 9.249/95), CSLL 12%, ISS/ICMS (utilizamos ISS 2% para transporte intramunicipal/serviços)
  // - Serviços, Saúde, Educação, Tecnologia, Construção Civil: IRPJ 32%, CSLL 32%, ISS 2%
  let basePresuncaoIRPJPercent = 0.32
  let basePresuncaoCSLLPercent = 0.32
  let icmsOuIssPercent = 0.02

  if (segmento === 'Comércio' || segmento === 'Indústria' || segmento === 'Agro') {
    basePresuncaoIRPJPercent = 0.08
    basePresuncaoCSLLPercent = 0.12
    icmsOuIssPercent = 0.12 // ICMS
  } else if (segmento === 'Bares e Restaurantes') {
    // Para bares e restaurantes, a atividade preponderante é o fornecimento de alimentos/bebidas (venda mercantil),
    // o que na legislação do Lucro Presumido adota a presunção comercial de 8% de IRPJ e 12% de CSLL com ICMS (alíquota média).
    basePresuncaoIRPJPercent = 0.08
    basePresuncaoCSLLPercent = 0.12
    icmsOuIssPercent = 0.12 // ICMS
  } else if (segmento === 'Transporte') {
    // Serviços de transporte de passageiros e cargas têm presunção específica de 16% de IRPJ (art. 15, § 1º, II, 'a' da Lei 9.249/95)
    // e 12% de CSLL.
    basePresuncaoIRPJPercent = 0.16
    basePresuncaoCSLLPercent = 0.12
    icmsOuIssPercent = 0.02 // ISS / ICMS frete
  } else {
    // Serviços, Saúde, Educação, Tecnologia, Construção Civil
    basePresuncaoIRPJPercent = 0.32
    basePresuncaoCSLLPercent = 0.32
    icmsOuIssPercent = 0.02 // ISS
  }

  const basePresumidaIRPJ = rbt12 * basePresuncaoIRPJPercent
  const basePresumidaCSLL = rbt12 * basePresuncaoCSLLPercent

  // IRPJ: 15% sobre a base + adicional de 10% sobre o que exceder R$ 20.000/mês (R$ 240.000/ano)
  const irpjBasico = basePresumidaIRPJ * 0.15
  const excessoIRPJ = Math.max(0, basePresumidaIRPJ - 240_000)
  const adicionalIRPJ = excessoIRPJ * 0.1
  const irpjTotal = irpjBasico + adicionalIRPJ

  // CSLL: 9% sobre a base de presunção
  const csllTotal = basePresumidaCSLL * 0.09

  // PIS + COFINS cumulativo: PIS 0,65% + COFINS 3% = 3,65% sobre a receita bruta
  const pisCofins = rbt12 * 0.0365

  const icmsOuIss = rbt12 * icmsOuIssPercent

  const cargaAnual = Math.round((irpjTotal + csllTotal + pisCofins + icmsOuIss) * 100) / 100
  const aliquotaEfetiva = rbt12 > 0 ? (cargaAnual / rbt12) * 100 : 0

  return {
    nome: 'Lucro Presumido',
    elegivel: true,
    cargaAnual,
    aliquotaEfetiva: Math.round(aliquotaEfetiva * 100) / 100,
    detalhes: {
      irpj: Math.round(irpjTotal * 100) / 100,
      csll: Math.round(csllTotal * 100) / 100,
      pisCofins: Math.round(pisCofins * 100) / 100,
      icmsOuIss: Math.round(icmsOuIss * 100) / 100,
    },
    descricaoCurta:
      'Tributa o IRPJ e a CSLL sobre margem presumida (8% a 32%), com PIS/COFINS cumulativo (3,65%). É vantajoso quando a margem de lucro real da empresa for maior que a margem presumida.',
  }
}

/**
 * Calcula a carga tributária do Lucro Real
 */
export function calcularLucroReal(
  rbt12: number,
  margemLucroPercent: number,
  segmento: SegmentoEmpresa,
): ResultadoRegime {
  if (rbt12 <= 0) {
    return {
      nome: 'Lucro Real',
      elegivel: true,
      cargaAnual: 0,
      aliquotaEfetiva: 0,
      detalhes: {},
      descricaoCurta:
        'Tributação calculada diretamente sobre o lucro líquido contábil efetivo apurado.',
    }
  }

  // Lucro Real é sempre elegível (e obrigatório acima de 78M)
  // Lucro apurado = Receita * Margem de lucro (%)
  const margemDecimal = Math.max(0, margemLucroPercent) / 100
  const lucroRealApurado = rbt12 * margemDecimal

  // IRPJ: 15% sobre o lucro real + adicional de 10% sobre o que exceder R$ 20.000/mês (R$ 240.000/ano)
  const irpjBasico = lucroRealApurado * 0.15
  const excessoLucro = Math.max(0, lucroRealApurado - 240_000)
  const adicionalIRPJ = excessoLucro * 0.1
  const irpjTotal = irpjBasico + adicionalIRPJ

  // CSLL: 9% sobre o lucro real
  const csllTotal = lucroRealApurado * 0.09

  // PIS + COFINS não cumulativo: 9,25% sobre a receita bruta
  // (PIS 1,65% + COFINS 7,60%)
  const pisCofins = rbt12 * 0.0925

  // Tributo sobre consumo: ICMS 12% (Comércio/Indústria/Agro/Bares e Restaurantes) ou ISS 2% (Serviços, Saúde, Educação, Tecnologia, Construção Civil, Transporte)
  const isMercadoria =
    segmento === 'Comércio' ||
    segmento === 'Indústria' ||
    segmento === 'Agro' ||
    segmento === 'Bares e Restaurantes'
  const impostoConsumoPercent = isMercadoria ? 0.12 : 0.02
  const impostoConsumo = rbt12 * impostoConsumoPercent

  const cargaAnual = Math.round((irpjTotal + csllTotal + pisCofins + impostoConsumo) * 100) / 100
  const aliquotaEfetiva = rbt12 > 0 ? (cargaAnual / rbt12) * 100 : 0

  return {
    nome: 'Lucro Real',
    elegivel: true,
    cargaAnual,
    aliquotaEfetiva: Math.round(aliquotaEfetiva * 100) / 100,
    detalhes: {
      irpj: Math.round(irpjTotal * 100) / 100,
      csll: Math.round(csllTotal * 100) / 100,
      pisCofins: Math.round(pisCofins * 100) / 100,
      icmsOuIss: Math.round(impostoConsumo * 100) / 100,
    },
    descricaoCurta:
      'Impostos calculados diretamente sobre o lucro líquido efetivo apurado. Ideal para empresas com margem de lucro reduzida, despesas dedutíveis elevadas ou faturamento acima de R$ 78 milhões.',
  }
}

/**
 * Função principal que roda o diagnóstico completo comparando os 3 regimes
 */
export function executarDiagnosticoTributario(
  dados: Omit<DadosEntradaDiagnostico, 'nome' | 'email' | 'telefone' | 'empresa'>,
): ResultadoDiagnosticoCompleto {
  const { rbt12, folha12, margemLucro, segmento } = dados

  const simples = calcularSimplesNacional(rbt12, folha12, segmento)
  const presumido = calcularLucroPresumido(rbt12, segmento)
  const real = calcularLucroReal(rbt12, margemLucro, segmento)

  const fatorR = rbt12 > 0 ? (folha12 / rbt12) * 100 : 0
  const fatorRElegivelAnexoIII = fatorR >= 28

  // Lista dos regimes elegíveis ordenados pela menor carga tributária anual
  const regimes = [simples, presumido, real]
  const elegiveis = regimes.filter((r) => r.elegivel).sort((a, b) => a.cargaAnual - b.cargaAnual)

  let regimeRecomendado: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' = 'Lucro Real'
  let economiaAnual = 0
  let segundoMaisVantajoso: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | undefined =
    undefined

  if (elegiveis.length > 0) {
    regimeRecomendado = elegiveis[0].nome
    if (elegiveis.length > 1) {
      segundoMaisVantajoso = elegiveis[1].nome
      economiaAnual = Math.max(
        0,
        Math.round((elegiveis[1].cargaAnual - elegiveis[0].cargaAnual) * 100) / 100,
      )
    }
  }

  // Se faturamento > 78M, Lucro Real é obrigatório
  if (rbt12 > LIMITE_PRESUMIDO) {
    regimeRecomendado = 'Lucro Real'
  }

  // Gerar justificativa didática
  let explicacaoRecomendacao = ''
  if (rbt12 > LIMITE_PRESUMIDO) {
    explicacaoRecomendacao = `Com faturamento anual de R$ ${rbt12.toLocaleString('pt-BR')}, o enquadramento no Lucro Real é obrigatório pela legislação fiscal brasileira (acima de R$ 78 milhões).`
  } else if (regimeRecomendado === 'Simples Nacional') {
    const isServicoComFatorR =
      segmento === 'Serviços' ||
      segmento === 'Saúde' ||
      segmento === 'Educação' ||
      segmento === 'Tecnologia' ||
      segmento === 'Construção Civil'

    if (isServicoComFatorR) {
      if (fatorRElegivelAnexoIII) {
        explicacaoRecomendacao = `O Simples Nacional é o mais vantajoso gerando alíquota efetiva de ${simples.aliquotaEfetiva}%. No setor de ${segmento}, sua folha salarial representa ${fatorR.toFixed(1)}% do faturamento (Fator R ≥ 28%), o que enquadra sua empresa no vantajoso Anexo III em vez do Anexo V.`
      } else {
        explicacaoRecomendacao = `O Simples Nacional apresenta a menor carga fiscal total (${simples.aliquotaEfetiva}% efetivo) para ${segmento}, mesmo tributando no Anexo V (Fator R em ${fatorR.toFixed(1)}%). Vale analisar com nossos especialistas se um ajuste no pró-labore elevaria seu Fator R para 28% para reduzir ainda mais os impostos.`
      }
    } else {
      explicacaoRecomendacao = `O Simples Nacional proporciona a menor alíquota efetiva global (${simples.aliquotaEfetiva}%) unificando tributos federais e estaduais/municipais no DAS para o setor de ${segmento}, gerando uma economia estimada de R$ ${economiaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em relação ao segundo regime mais viável.`
    }
  } else if (regimeRecomendado === 'Lucro Presumido') {
    explicacaoRecomendacao = `O Lucro Presumido é a opção mais econômica neste cenário (${presumido.aliquotaEfetiva}% de alíquota efetiva). Como sua margem líquida (${margemLucro}%) ou faturamento superam os limites do Simples ou a base de presunção legal é mais favorável, este regime reduz a carga de IRPJ/CSLL consideravelmente.`
  } else {
    // Lucro Real
    if (!simples.elegivel && !presumido.elegivel) {
      explicacaoRecomendacao = `O Lucro Real é o único regime aplicável para a dimensão de faturamento informada, garantindo total conformidade contábil.`
    } else {
      explicacaoRecomendacao = `O Lucro Real foi o mais vantajoso (${real.aliquotaEfetiva}% de carga efetiva). Como a margem de lucro estimada é de ${margemLucro}%, a base de cálculo real do IRPJ e da CSLL é inferior à presunção do Lucro Presumido e às tabelas do Simples, gerando economia líquida de impostos.`
    }
  }

  return {
    simples,
    presumido,
    real,
    regimeRecomendado,
    economiaAnual,
    segundoMaisVantajoso,
    explicacaoRecomendacao,
    fatorR: Math.round(fatorR * 10) / 10,
    fatorRElegivelAnexoIII,
  }
}
