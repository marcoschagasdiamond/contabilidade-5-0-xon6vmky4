/**
 * Motor de Cálculo Tributário - Contabilidade 5.0
 * Compara Simples Nacional, Lucro Presumido e Lucro Real
 * com base no Novo Código Tributário (Reforma Tributária - EC 132/2023, LC 214/2025)
 * e mantém a comparação com o Sistema Atual vigente.
 */

import {
  type AnoBaseSimulacao,
  ANOS_SIMULACAO_DISPONIVEIS,
  calcularAliquotasEfetivasReforma,
  obterPercentualConsumoSimplesPorAno,
  segmentoSusceptivelImpostoSeletivo,
  FATOR_TRANSICAO_IBS,
  FATOR_REMANESCENTE_ICMS_ISS,
  TAXA_CBS_REFERENCIA,
  TAXA_IBS_REFERENCIA,
} from './reformaTributaria'

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

export type PorteFuncionarios =
  | 'Apenas sócios (sem funcionários)'
  | '1 a 5 funcionários'
  | '6 a 15 funcionários'
  | '16 a 50 funcionários'
  | 'Mais de 50 funcionários'

export type EmissaoNotaFiscal =
  | 'Predominante para Pessoas Jurídicas (B2B)'
  | 'Predominante para Consumidor Final / PF (B2C)'
  | 'Equilibrado (PF e PJ)'

export type RegimeAtualEmpresa =
  | 'Simples Nacional'
  | 'Lucro Presumido'
  | 'Lucro Real'
  | 'MEI (Microempreendedor)'
  | 'Nova empresa / Ainda não optante'

export interface ItemCidadeISS {
  id: string
  nome: string
  uf: string
  aliquota: number // Alíquota percentual de ISS (ex: 2.0, 3.0, 5.0)
  descricao?: string
}

export const CIDADES_ISS_MAPA: ItemCidadeISS[] = [
  {
    id: 'sp-sao-paulo',
    nome: 'São Paulo',
    uf: 'SP',
    aliquota: 3.0,
    descricao: 'São Paulo/SP (3,0% padrão serviços)',
  },
  { id: 'sp-campinas', nome: 'Campinas', uf: 'SP', aliquota: 3.0, descricao: 'Campinas/SP (3,0%)' },
  {
    id: 'sp-guarulhos',
    nome: 'Guarulhos',
    uf: 'SP',
    aliquota: 2.5,
    descricao: 'Guarulhos/SP (2,5%)',
  },
  {
    id: 'sp-sao-bernardo',
    nome: 'São Bernardo do Campo',
    uf: 'SP',
    aliquota: 2.5,
    descricao: 'São Bernardo do Campo/SP (2,5%)',
  },
  {
    id: 'sp-santo-andre',
    nome: 'Santo André',
    uf: 'SP',
    aliquota: 2.5,
    descricao: 'Santo André/SP (2,5%)',
  },
  {
    id: 'sp-osasco',
    nome: 'Osasco',
    uf: 'SP',
    aliquota: 2.0,
    descricao: 'Osasco/SP (2,0% polo serviços/TI)',
  },
  {
    id: 'sp-barueri',
    nome: 'Barueri (Alphaville)',
    uf: 'SP',
    aliquota: 2.0,
    descricao: 'Barueri/SP (2,0% polo tecnológico)',
  },
  {
    id: 'sp-ribeirao-preto',
    nome: 'Ribeirão Preto',
    uf: 'SP',
    aliquota: 3.0,
    descricao: 'Ribeirão Preto/SP (3,0%)',
  },
  {
    id: 'sp-sao-jose-dos-campos',
    nome: 'São José dos Campos',
    uf: 'SP',
    aliquota: 2.5,
    descricao: 'São José dos Campos/SP (2,5%)',
  },
  { id: 'sp-sorocaba', nome: 'Sorocaba', uf: 'SP', aliquota: 2.5, descricao: 'Sorocaba/SP (2,5%)' },
  {
    id: 'rj-rio-de-janeiro',
    nome: 'Rio de Janeiro',
    uf: 'RJ',
    aliquota: 5.0,
    descricao: 'Rio de Janeiro/RJ (5,0%)',
  },
  { id: 'rj-niteroi', nome: 'Niterói', uf: 'RJ', aliquota: 4.0, descricao: 'Niterói/RJ (4,0%)' },
  {
    id: 'rj-duque-de-caxias',
    nome: 'Duque de Caxias',
    uf: 'RJ',
    aliquota: 3.0,
    descricao: 'Duque de Caxias/RJ (3,0%)',
  },
  {
    id: 'mg-belo-horizonte',
    nome: 'Belo Horizonte',
    uf: 'MG',
    aliquota: 4.0,
    descricao: 'Belo Horizonte/MG (4,0%)',
  },
  {
    id: 'mg-uberlandia',
    nome: 'Uberlândia',
    uf: 'MG',
    aliquota: 3.0,
    descricao: 'Uberlândia/MG (3,0%)',
  },
  { id: 'mg-contagem', nome: 'Contagem', uf: 'MG', aliquota: 3.0, descricao: 'Contagem/MG (3,0%)' },
  {
    id: 'mg-juiz-de-fora',
    nome: 'Juiz de Fora',
    uf: 'MG',
    aliquota: 3.0,
    descricao: 'Juiz de Fora/MG (3,0%)',
  },
  { id: 'pr-curitiba', nome: 'Curitiba', uf: 'PR', aliquota: 4.0, descricao: 'Curitiba/PR (4,0%)' },
  { id: 'pr-londrina', nome: 'Londrina', uf: 'PR', aliquota: 3.0, descricao: 'Londrina/PR (3,0%)' },
  { id: 'pr-maringa', nome: 'Maringá', uf: 'PR', aliquota: 3.0, descricao: 'Maringá/PR (3,0%)' },
  {
    id: 'sc-florianopolis',
    nome: 'Florianópolis',
    uf: 'SC',
    aliquota: 3.0,
    descricao: 'Florianópolis/SC (3,0%)',
  },
  {
    id: 'sc-joinville',
    nome: 'Joinville',
    uf: 'SC',
    aliquota: 3.0,
    descricao: 'Joinville/SC (3,0%)',
  },
  { id: 'sc-blumenau', nome: 'Blumenau', uf: 'SC', aliquota: 3.0, descricao: 'Blumenau/SC (3,0%)' },
  {
    id: 'rs-porto-alegre',
    nome: 'Porto Alegre',
    uf: 'RS',
    aliquota: 4.0,
    descricao: 'Porto Alegre/RS (4,0%)',
  },
  {
    id: 'rs-caxias-do-sul',
    nome: 'Caxias do Sul',
    uf: 'RS',
    aliquota: 3.0,
    descricao: 'Caxias do Sul/RS (3,0%)',
  },
  { id: 'ba-salvador', nome: 'Salvador', uf: 'BA', aliquota: 4.5, descricao: 'Salvador/BA (4,5%)' },
  { id: 'pe-recife', nome: 'Recife', uf: 'PE', aliquota: 5.0, descricao: 'Recife/PE (5,0%)' },
  {
    id: 'ce-fortaleza',
    nome: 'Fortaleza',
    uf: 'CE',
    aliquota: 4.0,
    descricao: 'Fortaleza/CE (4,0%)',
  },
  { id: 'df-brasilia', nome: 'Brasília', uf: 'DF', aliquota: 4.0, descricao: 'Brasília/DF (4,0%)' },
  { id: 'go-goiania', nome: 'Goiânia', uf: 'GO', aliquota: 3.5, descricao: 'Goiânia/GO (3,5%)' },
  { id: 'es-vitoria', nome: 'Vitória', uf: 'ES', aliquota: 3.0, descricao: 'Vitória/ES (3,0%)' },
  {
    id: 'es-vila-velha',
    nome: 'Vila Velha',
    uf: 'ES',
    aliquota: 3.0,
    descricao: 'Vila Velha/ES (3,0%)',
  },
  {
    id: 'ms-campo-grande',
    nome: 'Campo Grande',
    uf: 'MS',
    aliquota: 3.5,
    descricao: 'Campo Grande/MS (3,5%)',
  },
  { id: 'mt-cuiaba', nome: 'Cuiabá', uf: 'MT', aliquota: 3.5, descricao: 'Cuiabá/MT (3,5%)' },
  { id: 'am-manaus', nome: 'Manaus', uf: 'AM', aliquota: 3.0, descricao: 'Manaus/AM (3,0%)' },
  { id: 'pa-belem', nome: 'Belém', uf: 'PA', aliquota: 4.0, descricao: 'Belém/PA (4,0%)' },
  { id: 'ma-sao-luis', nome: 'São Luís', uf: 'MA', aliquota: 4.0, descricao: 'São Luís/MA (4,0%)' },
  { id: 'rn-natal', nome: 'Natal', uf: 'RN', aliquota: 4.0, descricao: 'Natal/RN (4,0%)' },
  {
    id: 'pb-joao-pessoa',
    nome: 'João Pessoa',
    uf: 'PB',
    aliquota: 4.0,
    descricao: 'João Pessoa/PB (4,0%)',
  },
  { id: 'al-maceio', nome: 'Maceió', uf: 'AL', aliquota: 4.0, descricao: 'Maceió/AL (4,0%)' },
  { id: 'se-aracaju', nome: 'Aracaju', uf: 'SE', aliquota: 4.0, descricao: 'Aracaju/SE (4,0%)' },
  { id: 'pi-teresina', nome: 'Teresina', uf: 'PI', aliquota: 4.0, descricao: 'Teresina/PI (4,0%)' },
  { id: 'to-palmas', nome: 'Palmas', uf: 'TO', aliquota: 3.0, descricao: 'Palmas/TO (3,0%)' },
  {
    id: 'ro-porto-velho',
    nome: 'Porto Velho',
    uf: 'RO',
    aliquota: 3.0,
    descricao: 'Porto Velho/RO (3,0%)',
  },
  {
    id: 'outra',
    nome: 'Outra cidade',
    uf: 'BR',
    aliquota: 2.0,
    descricao: 'Outra cidade / Interior (2,0% mínimo legal)',
  },
]

export function obterAliquotaISS(cidadeOuId?: string): { cidadeNome: string; aliquota: number } {
  if (!cidadeOuId) {
    return { cidadeNome: 'São Paulo - SP', aliquota: 3.0 }
  }
  const limpo = cidadeOuId.toLowerCase().trim()
  const encontrado = CIDADES_ISS_MAPA.find(
    (c) =>
      c.id.toLowerCase() === limpo ||
      c.nome.toLowerCase() === limpo ||
      `${c.nome}/${c.uf}`.toLowerCase() === limpo ||
      `${c.nome} - ${c.uf}`.toLowerCase() === limpo,
  )
  if (encontrado) {
    return {
      cidadeNome:
        encontrado.id === 'outra' ? 'Outra cidade' : `${encontrado.nome} - ${encontrado.uf}`,
      aliquota: encontrado.aliquota,
    }
  }
  return { cidadeNome: cidadeOuId, aliquota: 2.0 }
}

export interface DadosEntradaDiagnostico {
  nome: string
  email: string
  telefone: string
  empresa: string
  cnpj?: string
  segmento: SegmentoEmpresa
  rbt12: number // Receita Bruta acumulada dos últimos 12 meses
  folha12: number // Folha de pagamento dos últimos 12 meses (salários, pró-labore, encargos)
  margemLucro: number // Margem de lucro líquida estimada (0 a 100%)
  funcionarios?: PorteFuncionarios | string
  emissaoNf?: EmissaoNotaFiscal | string
  atividadeMista?: boolean // Comércio e serviços integrados
  regimeAtual?: RegimeAtualEmpresa | string
  cidade?: string // Cidade/UF selecionada
  anoBase?: number // Ano da simulação (2026 a 2033)
}

export interface ItemRankingRegime {
  posicao: number
  regime: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real'
  cargaAnual: number
  aliquotaEfetiva: number
  elegivel: boolean
  motivoInelegibilidade?: string
  diferencaValor: number // em relação ao 1º colocado (R$)
  diferencaPercent: number // diferença percentual da carga ou alíquota
  empateTecnicoComPrimeiro: boolean // diferença menor que 3%
  statusDescritivo: string
}

export interface RegraAplicada {
  titulo: string
  descricao: string
  tipo: 'sucesso' | 'alerta' | 'informativo' | 'inelegivel'
  impacto: string
}

export interface GatilhoMudanca {
  titulo: string
  descricao: string
  condicao: string
}

export interface JustificativaAlternativa {
  regime: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real'
  quandoValeAPena: string
  statusNesteCenario: string
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
    pisCofinsPercent?: number
    presuncaoIRPJPercent?: number
    presuncaoCSLLPercent?: number
    aliquotaISSPercent?: number
    cidadeISS?: string
  }
  descricaoCurta: string
}

export interface DetalhesReformaRegime {
  anoBase: number
  aliquotaCBS: number
  aliquotaIBS: number
  aliquotaICMSRemanescente: number
  aliquotaISSRemanescente: number
  fatorReducaoSetorial: number
  parcelaCBSReais: number
  parcelaIBSReais: number
  parcelaICMSouISSReais: number
  percentualCreditoTransferidoSimples?: number
  creditoTransferidoValorReais?: number
  alertaSublimiteIBS?: boolean // RBT12 > 3.6M: IBS por fora do DAS
  impostoSeletivoAlerta?: string
}

export interface ResultadoNovoSistemaReforma {
  anoBase: number
  simples: ResultadoRegime & { detalhesReforma?: DetalhesReformaRegime }
  presumido: ResultadoRegime & { detalhesReforma?: DetalhesReformaRegime }
  real: ResultadoRegime & { detalhesReforma?: DetalhesReformaRegime }
  regimeRecomendado: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real'
  economiaAnual: number
  segundoMaisVantajoso?: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real'
  ranking: ItemRankingRegime[]
  empateTecnico: boolean
  regimeEmpatado?: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real'
  explicacaoTransicao: string
  projecaoAnos: Array<{
    ano: number
    cargaSimples: number
    cargaPresumido: number
    cargaReal: number
    melhorRegime: string
  }>
}

export interface ResultadoDiagnosticoCompleto {
  // Sistema Atual
  simples: ResultadoRegime
  presumido: ResultadoRegime
  real: ResultadoRegime
  regimeRecomendado: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real'
  economiaAnual: number // economia comparado com a segunda opção elegível mais vantajosa (ou 0)
  segundoMaisVantajoso?: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real'
  explicacaoRecomendacao: string
  fatorR: number
  fatorRElegivelAnexoIII: boolean
  // Dados de localização e ISS
  cidade: string
  aliquotaISS: number
  // Novos dados estruturados
  resumoSimplesTexto: string // 2 a 3 frases sem jargão para o cliente
  ranking: ItemRankingRegime[]
  empateTecnico: boolean
  regimeEmpatado?: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real'
  regrasAplicadas: RegraAplicada[]
  motivosRecomendacao: string[] // 3 a 5 bullets didáticos vinculando input -> consequência fiscal
  gatilhosMudanca: GatilhoMudanca[]
  alternativas: JustificativaAlternativa[]
  // NOVO CÓDIGO TRIBUTÁRIO (Reforma Tributária - EC 132/2023, LC 214/2025)
  anoBase: number
  novoSistema: ResultadoNovoSistemaReforma
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
export function calcularLucroPresumido(
  rbt12: number,
  segmento: SegmentoEmpresa,
  aliquotaISSPercent: number = 2.0,
  cidadeNome?: string,
): ResultadoRegime {
  if (rbt12 <= 0) {
    return {
      nome: 'Lucro Presumido',
      elegivel: true,
      cargaAnual: 0,
      aliquotaEfetiva: 0,
      detalhes: {
        aliquotaISSPercent,
        cidadeISS: cidadeNome,
      },
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
      detalhes: {
        aliquotaISSPercent,
        cidadeISS: cidadeNome,
      },
      descricaoCurta:
        'Tributação simplificada sobre lucro pré-fixado pela Receita Federal, limitada a empresas com faturamento até R$ 78 milhões.',
    }
  }

  // Base de presunção IRPJ e CSLL no Lucro Presumido:
  // - Comércio, Indústria, Agro: IRPJ 8%, CSLL 12%, ICMS 12%
  // - Bares e Restaurantes: predominantemente venda de refeições/mercadorias -> presunção 8% IRPJ, 12% CSLL, ICMS 12%
  // - Transporte: serviços de transporte de passageiros/cargas possuem presunção própria legal de 16% no IRPJ (art. 15 da Lei 9.249/95), CSLL 12%, ISS municipal ou ICMS frete
  // - Serviços, Saúde, Educação, Tecnologia, Construção Civil: IRPJ 32%, CSLL 32%, ISS municipal (conforme cidade)
  let basePresuncaoIRPJPercent = 0.32
  let basePresuncaoCSLLPercent = 0.32
  const issDecimal = (aliquotaISSPercent || 2.0) / 100
  let icmsOuIssPercent = issDecimal

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
    icmsOuIssPercent = issDecimal // ISS intramunicipal ou ICMS frete
  } else {
    // Serviços, Saúde, Educação, Tecnologia, Construção Civil
    basePresuncaoIRPJPercent = 0.32
    basePresuncaoCSLLPercent = 0.32
    icmsOuIssPercent = issDecimal // ISS conforme cidade
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
      presuncaoIRPJPercent: Math.round(basePresuncaoIRPJPercent * 100),
      presuncaoCSLLPercent: Math.round(basePresuncaoCSLLPercent * 100),
      aliquotaISSPercent,
      cidadeISS: cidadeNome,
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
  aliquotaISSPercent: number = 2.0,
  cidadeNome?: string,
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

  // Tributo sobre consumo: ICMS 12% (Comércio/Indústria/Agro/Bares e Restaurantes) ou ISS municipal (Serviços, Saúde, Educação, Tecnologia, Construção Civil, Transporte)
  const isMercadoria =
    segmento === 'Comércio' ||
    segmento === 'Indústria' ||
    segmento === 'Agro' ||
    segmento === 'Bares e Restaurantes'
  const issDecimal = (aliquotaISSPercent || 2.0) / 100
  const impostoConsumoPercent = isMercadoria ? 0.12 : issDecimal
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
      pisCofinsPercent: 9.25,
      aliquotaISSPercent,
      cidadeISS: cidadeNome,
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
  const { rbt12, folha12, margemLucro, segmento, atividadeMista, regimeAtual, cidade } = dados

  const { cidadeNome, aliquota: aliquotaISS } = obterAliquotaISS(cidade)

  const simples = calcularSimplesNacional(rbt12, folha12, segmento)
  const presumido = calcularLucroPresumido(rbt12, segmento, aliquotaISS, cidadeNome)
  const real = calcularLucroReal(rbt12, margemLucro, segmento, aliquotaISS, cidadeNome)

  const fatorR = rbt12 > 0 ? (folha12 / rbt12) * 100 : 0
  const fatorRElegivelAnexoIII = fatorR >= 28

  // Lista dos 3 regimes
  const todosOsRegimes = [simples, presumido, real]
  const elegiveis = todosOsRegimes
    .filter((r) => r.elegivel)
    .sort((a, b) => a.cargaAnual - b.cargaAnual)
  const inelegiveis = todosOsRegimes.filter((r) => !r.elegivel)

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

  // 1. Construir Ranking completo dos 3 regimes
  // Ordena primeiro elegíveis por menor carga, depois inelegíveis
  const regimesOrdenados = [...elegiveis, ...inelegiveis]
  const cargaPrimeiro = elegiveis.length > 0 ? elegiveis[0].cargaAnual : 0
  const aliqPrimeiro = elegiveis.length > 0 ? elegiveis[0].aliquotaEfetiva : 0

  let empateTecnico = false
  let regimeEmpatado: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | undefined = undefined

  const ranking: ItemRankingRegime[] = regimesOrdenados.map((reg, idx) => {
    const posicao = idx + 1
    const diferencaValor = reg.elegivel
      ? Math.max(0, Math.round((reg.cargaAnual - cargaPrimeiro) * 100) / 100)
      : 0
    // Diferença em percentual relativo da alíquota
    const diferencaPercent =
      reg.elegivel && cargaPrimeiro > 0
        ? Math.round(((reg.cargaAnual - cargaPrimeiro) / cargaPrimeiro) * 1000) / 10
        : 0

    // Empate técnico: diferença de alíquota efetiva < 1.0 ponto percentual OU diferença relativa de carga < 3%
    const diferencaAliq = Math.abs(reg.aliquotaEfetiva - aliqPrimeiro)
    const ehEmpate =
      posicao === 2 &&
      reg.elegivel &&
      (diferencaPercent < 3.0 || diferencaAliq < 1.0) &&
      rbt12 <= LIMITE_PRESUMIDO

    if (ehEmpate) {
      empateTecnico = true
      regimeEmpatado = reg.nome
    }

    let statusDescritivo = ''
    if (!reg.elegivel) {
      statusDescritivo = 'Inelegível legalmente'
    } else if (posicao === 1) {
      statusDescritivo = '1º lugar • Mais econômico'
    } else if (ehEmpate) {
      statusDescritivo = '2º lugar • Empate técnico viável'
    } else {
      statusDescritivo = `${posicao}º lugar • Carga maior em R$ ${diferencaValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano`
    }

    return {
      posicao,
      regime: reg.nome,
      cargaAnual: reg.cargaAnual,
      aliquotaEfetiva: reg.aliquotaEfetiva,
      elegivel: reg.elegivel,
      motivoInelegibilidade: reg.motivoInelegibilidade,
      diferencaValor,
      diferencaPercent,
      empateTecnicoComPrimeiro: ehEmpate,
      statusDescritivo,
    }
  })

  // 2. Regras de análise aplicadas à empresa
  const regrasAplicadas: RegraAplicada[] = []

  // Regra de faturamento Simples Nacional
  if (rbt12 <= LIMITE_SIMPLES) {
    regrasAplicadas.push({
      titulo: 'Elegibilidade ao Simples Nacional',
      descricao: `Sua receita bruta anual de R$ ${rbt12.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} está dentro do sublimite de R$ 4,8 milhões/ano.`,
      tipo: 'sucesso',
      impacto: 'Empresa autorizada a recolher via guia única (DAS).',
    })
  } else {
    regrasAplicadas.push({
      titulo: 'Inelegibilidade ao Simples Nacional',
      descricao: `A receita bruta de R$ ${rbt12.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ultrapassou o teto federal de R$ 4.800.000,00.`,
      tipo: 'inelegivel',
      impacto: 'Obrigatório optar entre Lucro Presumido ou Lucro Real.',
    })
  }

  // Regra do Fator R (se aplicável ao segmento)
  const isSegmentoFatorR =
    segmento === 'Serviços' ||
    segmento === 'Saúde' ||
    segmento === 'Educação' ||
    segmento === 'Tecnologia' ||
    segmento === 'Construção Civil'

  if (isSegmentoFatorR && rbt12 <= LIMITE_SIMPLES) {
    if (fatorRElegivelAnexoIII) {
      regrasAplicadas.push({
        titulo: 'Fator R favorável (Anexo III)',
        descricao: `Sua folha de pagamento representa ${fatorR.toFixed(1)}% do faturamento (regra de 28% superada com sucesso).`,
        tipo: 'sucesso',
        impacto: 'Tributação pelo Anexo III (alíquota inicial de 6% em vez dos 15,5% do Anexo V).',
      })
    } else {
      regrasAplicadas.push({
        titulo: 'Fator R abaixo do corte (Anexo V)',
        descricao: `Sua folha representa ${fatorR.toFixed(1)}% do faturamento (abaixo dos 28% exigidos pelo art. 18 da LC 123/2006).`,
        tipo: 'alerta',
        impacto: 'No Simples a empresa cai no Anexo V (tributação a partir de 15,5%).',
      })
    }
  }

  // Regra de presunção do segmento no Lucro Presumido
  let presuncaoTexto = '32% (serviços em geral)'
  if (
    segmento === 'Comércio' ||
    segmento === 'Indústria' ||
    segmento === 'Agro' ||
    segmento === 'Bares e Restaurantes'
  ) {
    presuncaoTexto = '8% para IRPJ e 12% para CSLL (atividades mercantis/industriais)'
  } else if (segmento === 'Transporte') {
    presuncaoTexto = '16% para IRPJ e 12% para CSLL (transporte de cargas/passageiros)'
  }
  regrasAplicadas.push({
    titulo: `Presunção legal para o setor de ${segmento}`,
    descricao: `No Lucro Presumido, a base de cálculo estipulada pela Receita Federal é de ${presuncaoTexto}.`,
    tipo: 'informativo',
    impacto: `Sua margem estimada é de ${margemLucro}%. Quando sua margem real for maior que a presunção, o Presumido torna-se atrativo.`,
  })

  // Regra de ISS municipal
  const isSegmentoComISS =
    segmento === 'Serviços' ||
    segmento === 'Saúde' ||
    segmento === 'Educação' ||
    segmento === 'Tecnologia' ||
    segmento === 'Construção Civil' ||
    segmento === 'Transporte'

  if (isSegmentoComISS) {
    regrasAplicadas.push({
      titulo: `ISS Municipal aplicado: ${aliquotaISS.toFixed(1)}% (${cidadeNome})`,
      descricao: `Para o município de ${cidadeNome}, foi aplicada a alíquota municipal de ISS de ${aliquotaISS.toFixed(1)}% sobre as receitas de serviços no Lucro Presumido e Lucro Real.`,
      tipo: aliquotaISS > 3.0 ? 'alerta' : 'sucesso',
      impacto: `Impacto anual de R$ ${(rbt12 * (aliquotaISS / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em tributos municipais fora do Simples.`,
    })
  }

  // Regra do teto de R$ 78 milhões
  if (rbt12 > LIMITE_PRESUMIDO) {
    regrasAplicadas.push({
      titulo: 'Obrigatoriedade legal do Lucro Real',
      descricao: `Receita anual acima de R$ 78.000.000,00 obriga a empresa ao Lucro Real por determinação do art. 14 da Lei 9.718/1998.`,
      tipo: 'inelegivel',
      impacto: 'Não é permitida a opção pelo Lucro Presumido ou Simples.',
    })
  }

  // Regra de atividade mista (se informada)
  if (atividadeMista) {
    regrasAplicadas.push({
      titulo: 'Operação mista de Comércio e Serviços',
      descricao:
        'Sua empresa combina venda de mercadorias com prestação de serviços no mesmo CNPJ.',
      tipo: 'alerta',
      impacto:
        'Exige segregação de receitas no Simples (Anexo I + Anexo III/V) ou segregação de presunções (8% + 32%) no Lucro Presumido.',
    })
  }

  // 3. Resumo simples em 2 a 3 frases sem jargão
  let resumoSimplesTexto = ''
  const nomeSegundo = segundoMaisVantajoso || 'outros regimes'
  const economiaFormatada = economiaAnual.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  if (rbt12 > LIMITE_PRESUMIDO) {
    resumoSimplesTexto = `Pelo volume de faturamento de R$ ${rbt12.toLocaleString('pt-BR')}, sua empresa está enquadrada obrigatoriamente no Lucro Real pela lei brasileira. A gestão contábil rigorosa de despesas e créditos é o caminho para manter a carga no menor nível possível.`
  } else if (empateTecnico && regimeEmpatado) {
    resumoSimplesTexto = `Para o perfil da sua empresa de ${segmento}, identificamos um empate técnico muito próximo entre o ${regimeRecomendado} e o ${regimeEmpatado}, com diferença de menos de 3% no valor final de impostos. Ambas as opções são viáveis e a melhor escolha vai depender do controle de créditos e emissão de notas.`
  } else if (regimeRecomendado === 'Simples Nacional') {
    resumoSimplesTexto = `Para uma empresa de ${segmento} faturando R$ ${rbt12.toLocaleString('pt-BR')} por ano, o Simples Nacional é a opção mais econômica, com economia estimada de R$ ${economiaFormatada} ao ano em relação ao ${nomeSegundo}. A unificação de impostos no DAS simplifica sua rotina e protege seu fluxo de caixa.`
  } else if (regimeRecomendado === 'Lucro Presumido') {
    resumoSimplesTexto = `Para uma empresa de ${segmento} faturando R$ ${rbt12.toLocaleString('pt-BR')} por ano, o Lucro Presumido tende a ser a alternativa mais vantajosa, gerando economia anual estimada de R$ ${economiaFormatada} frente ao ${nomeSegundo}. A margem de presunção fixada em lei é mais vantajosa do que as faixas avançadas do Simples ou a tributação sobre o lucro real.`
  } else {
    // Lucro Real
    resumoSimplesTexto = `Para a margem de rentabilidade informada (${margemLucro}%), o Lucro Real desponta como o regime mais vantajoso, economizando cerca de R$ ${economiaFormatada} ao ano em relação ao ${nomeSegundo}. Como seus impostos incidirão apenas sobre o resultado contábil efetivo, despesas comprovadas reduzem diretamente a conta fiscal.`
  }

  // 4. Motivos da recomendação (3 a 5 bullets didáticos vinculando input -> consequência fiscal)
  const motivosRecomendacao: string[] = []

  if (regimeRecomendado === 'Simples Nacional') {
    motivosRecomendacao.push(
      `Faturamento dentro do teto: sua receita anual (R$ ${rbt12.toLocaleString('pt-BR')}) aproveita as faixas competitivas do Simples Nacional com guia única (DAS).`,
    )
    if (isSegmentoFatorR) {
      if (fatorRElegivelAnexoIII) {
        motivosRecomendacao.push(
          `Folha salarial favorável: sua folha consome ${fatorR.toFixed(1)}% da receita (Fator R ≥ 28%), garantindo o enquadramento no Anexo III, com alíquota inicial muito mais baixa que os 15,5% do Anexo V.`,
        )
      } else {
        motivosRecomendacao.push(
          `Carga global consolidada: mesmo com o Fator R em ${fatorR.toFixed(1)}%, a alíquota efetiva do Simples (${simples.aliquotaEfetiva}%) ainda supera a soma de IRPJ, CSLL, PIS, COFINS e ISS do regime Presumido.`,
        )
      }
    }
    motivosRecomendacao.push(
      `Isenção de CPP na folha (exceto Anexo IV): no Simples Nacional, os 20% de cota patronal do INSS sobre a folha já vêm incluídos na alíquota do DAS, barateando a contratação.`,
    )
    motivosRecomendacao.push(
      `Menor burocracia contábil: dispensa entrega de SPED Contábil complexo, ECF e retenções federais na fonte sobre notas de serviços.`,
    )
  } else if (regimeRecomendado === 'Lucro Presumido') {
    motivosRecomendacao.push(
      `Esgotamento das faixas do Simples: para o seu faturamento (R$ ${rbt12.toLocaleString('pt-BR')}), as alíquotas marginais das últimas faixas do Simples superam os tributos federais fixos do Lucro Presumido.`,
    )
    motivosRecomendacao.push(
      `Margem de lucro declarada (${margemLucro}%): a presunção legal fixa para ${segmento} protege seus ganhos excedentes, pois a Receita Federal não tributa o que passar da base estimada.`,
    )
    motivosRecomendacao.push(
      `PIS e COFINS cumulativo: alíquota enxuta de 3,65% sobre o faturamento bruto, sem complexidades de apuração e sem o risco da alíquota de 9,25% do Lucro Real.`,
    )
    motivosRecomendacao.push(
      `Distribuição de dividendos isenta: todo o lucro apurado acima da presunção pode ser distribuído aos sócios 100% livre de Imposto de Renda.`,
    )
  } else {
    // Lucro Real
    motivosRecomendacao.push(
      `Margem líquida moderada (${margemLucro}%): como seu lucro efetivo é menor do que as presunções de tabela (8% a 32%), a base do IRPJ (15%+10%) e da CSLL (9%) fica reduzida.`,
    )
    motivosRecomendacao.push(
      `Tributação estritamente sobre resultado: em meses com prejuízo fiscal ou despesas elevadas, a empresa não paga IRPJ nem CSLL sobre tais competências.`,
    )
    motivosRecomendacao.push(
      `Aproveitamento de créditos de PIS/COFINS (9,25%): insumos, aluguéis de prédios, depreciação de máquinas e energia elétrica geram abatimentos fiscais no regime não cumulativo.`,
    )
    if (rbt12 > LIMITE_PRESUMIDO) {
      motivosRecomendacao.push(
        `Exigência legal obrigatória: faturamentos anuais acima de R$ 78 milhões exigem por lei a adoção compulsória do Lucro Real.`,
      )
    }
  }

  // 5. Quando cada regime alternativo faria sentido
  const alternativas: JustificativaAlternativa[] = [
    {
      regime: 'Simples Nacional',
      quandoValeAPena:
        'Vale a pena quando o faturamento não ultrapassa R$ 4,8 milhões/ano e a folha salarial é bem equilibrada (Fator R ≥ 28% em serviços) ou o custo com colaboradores CLT é expressivo.',
      statusNesteCenario:
        regimeRecomendado === 'Simples Nacional'
          ? 'Recomendado neste diagnóstico como a opção mais vantajosa.'
          : simples.elegivel
            ? `Carga calculada em R$ ${simples.cargaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${simples.aliquotaEfetiva}% efetivo) — ${simples.cargaAnual > cargaPrimeiro ? `R$ ${(simples.cargaAnual - cargaPrimeiro).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} mais caro ao ano` : 'competitivo'}.`
            : simples.motivoInelegibilidade ||
              'Inelegível devido ao faturamento acima do teto de R$ 4,8 milhões.',
    },
    {
      regime: 'Lucro Presumido',
      quandoValeAPena:
        'Vale a pena para empresas com margem de lucro real alta (superior à presunção legal do segmento), folha de pagamento baixa em relação à receita, ou faturamento entre R$ 2M e R$ 78M.',
      statusNesteCenario:
        regimeRecomendado === 'Lucro Presumido'
          ? 'Recomendado neste diagnóstico como a opção mais vantajosa.'
          : presumido.elegivel
            ? `Carga calculada em R$ ${presumido.cargaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${presumido.aliquotaEfetiva}% efetivo) — ${presumido.cargaAnual > cargaPrimeiro ? `R$ ${(presumido.cargaAnual - cargaPrimeiro).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} mais caro ao ano` : 'competitivo'}.`
            : presumido.motivoInelegibilidade || 'Inelegível pelo teto de R$ 78 milhões.',
    },
    {
      regime: 'Lucro Real',
      quandoValeAPena:
        'Vale a pena para empresas com margem de lucro líquida reduzida (abaixo de 10%–15%), custos operacionais pesados, histórico de prejuízos compensáveis ou faturamento acima de R$ 78 milhões.',
      statusNesteCenario:
        regimeRecomendado === 'Lucro Real'
          ? 'Recomendado neste diagnóstico como a opção mais vantajosa.'
          : `Carga calculada em R$ ${real.cargaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${real.aliquotaEfetiva}% efetivo) — R$ ${(real.cargaAnual - cargaPrimeiro).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} mais caro devido à margem declarada de ${margemLucro}% e alíquota de PIS/COFINS de 9,25%.`,
    },
  ]

  // 6. Gatilhos que podem mudar a recomendação
  const gatilhosMudanca: GatilhoMudanca[] = []

  // Gatilho: Proximidade do teto do Simples (acima de 80% do teto = R$ 3.840.000)
  if (rbt12 >= 3_840_000 && rbt12 <= LIMITE_SIMPLES) {
    gatilhosMudanca.push({
      titulo: 'Proximidade do teto do Simples Nacional (zona de atenção)',
      descricao: `Seu faturamento está em ${((rbt12 / LIMITE_SIMPLES) * 100).toFixed(0)}% do teto legal de R$ 4,8M. Um crescimento pequeno em 2025 pode desenquadrar a empresa ou elevar a alíquota na última faixa, tornando o Lucro Presumido mais barato ao longo do ano.`,
      condicao: 'Crescimento de receita > 15%',
    })
  }

  // Gatilho: Sensibilidade da Margem de Lucro
  gatilhosMudanca.push({
    titulo: 'Variação na Margem de Lucro Real',
    descricao: `O cálculo do Lucro Real utilizou sua estimativa de margem de ${margemLucro}%. Se no fechamento do balanço a margem real for inferior a ${Math.max(3, Math.round(margemLucro * 0.65))}%, o Lucro Real pode se tornar muito mais vantajoso.`,
    condicao: 'Margem de lucro real incerta ou variável',
  })

  // Gatilho: Fator R pró-labore
  if (isSegmentoFatorR && !fatorRElegivelAnexoIII && rbt12 <= LIMITE_SIMPLES) {
    const folhaNecessaria = Math.ceil(rbt12 * 0.28)
    const diferencaFolha = folhaNecessaria - folha12
    gatilhosMudanca.push({
      titulo: 'Gatilho de otimização do Fator R via Pró-labore',
      descricao: `Aumentar o pró-labore dos sócios em R$ ${Math.round(diferencaFolha / 12).toLocaleString('pt-BR')}/mês elevaria seu Fator R para 28%, transferindo a tributação do Anexo V (15,5%) para o Anexo III (6,0%) no Simples Nacional.`,
      condicao: 'Ajuste de pró-labore com planejamento previdenciário',
    })
  }

  // Gatilho: Operação mista / Emissão de Notas
  if (atividadeMista) {
    gatilhosMudanca.push({
      titulo: 'Proporção entre Comércio e Serviços',
      descricao:
        'Se a maior parte da receita vier do comércio, o Simples Anexo I ou Presumido com presunção de 8% se destacam. Se os serviços crescerem, a carga pode oscilar.',
      condicao: 'Mudança no mix de faturamento',
    })
  }

  // Justificativa geral (mantida compatível)
  let explicacaoRecomendacao = resumoSimplesTexto

  // =========================================================================
  // CÁLCULO DO NOVO CÓDIGO TRIBUTÁRIO (REFORMA TRIBUTÁRIA - EC 132/2023, LC 214/2025)
  // =========================================================================
  const anoSimulacao = (dados.anoBase || 2026) as AnoBaseSimulacao
  const novoSistema = calcularDiagnosticoReformaTributaria({
    rbt12,
    folha12,
    margemLucro,
    segmento,
    aliquotaISS,
    cidadeNome,
    anoBase: anoSimulacao,
    simplesAtual: simples,
    presumidoAtual: presumido,
    realAtual: real,
  })

  // Adicionar regras e gatilhos da Reforma Tributária às listas existentes
  if (rbt12 > 3_600_000 && rbt12 <= LIMITE_SIMPLES) {
    regrasAplicadas.unshift({
      titulo: 'Sublimite Estadual de R$ 3,6M (IBS por fora do DAS)',
      descricao: `Pela LC 214/2025 art. 519 e art. 13-A da LC 123/2006, empresas com RBT12 entre R$ 3,6M e R$ 4,8M recolhem tributos federais no DAS, mas o IBS (assim como ICMS/ISS) é recolhido OBRIGATORIAMENTE por fora do Simples no regime regular.`,
      tipo: 'alerta',
      impacto: 'Gera apuração híbrida obrigatória e necessidade de apuração não-cumulativa de IBS.',
    })

    gatilhosMudanca.unshift({
      titulo: 'Gatilho de Sublimite: IBS por fora do DAS (R$ 3,6M a R$ 4,8M)',
      descricao: `Sua receita está na 6ª faixa do Simples. No novo código tributário, o IBS estadual/municipal deixa de integrar a guia única DAS e passa a ser recolhido pelo regime regular com débito e crédito.`,
      condicao: 'RBT12 acima de R$ 3.600.000,00',
    })
  }

  // Gatilho de clientes B2B e transferência de créditos no Simples
  const infoIS = segmentoSusceptivelImpostoSeletivo(segmento)
  if (infoIS.suscetivel && infoIS.motivo) {
    regrasAplicadas.push({
      titulo: 'Atenção ao Imposto Seletivo (IS — EC 132/2023)',
      descricao: infoIS.motivo,
      tipo: 'alerta',
      impacto: 'Alíquotas específicas a serem fixadas por lei ordinária a partir de 2027.',
    })
  }

  // Regra de Split Payment
  regrasAplicadas.push({
    titulo: 'Mecanismo de Split Payment (Liquidação Financeira)',
    descricao:
      'No Novo Código Tributário, o IBS e a CBS serão retidos e recolhidos automaticamente no momento da liquidação bancária/cartão/PIX da transação comercial.',
    tipo: 'informativo',
    impacto:
      'Exige planejamento rigoroso de capital de giro, pois o imposto não fica mais represado até o dia 20 do mês seguinte.',
  })

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
    cidade: cidadeNome,
    aliquotaISS,
    resumoSimplesTexto,
    ranking,
    empateTecnico,
    regimeEmpatado,
    regrasAplicadas,
    motivosRecomendacao,
    gatilhosMudanca,
    alternativas,
    anoBase: anoSimulacao,
    novoSistema,
  }
}

/**
 * Calcula os regimes no Novo Sistema Tributário (IBS / CBS / IS) para um determinado ano
 */
export function calcularDiagnosticoReformaTributaria(params: {
  rbt12: number
  folha12: number
  margemLucro: number
  segmento: SegmentoEmpresa
  aliquotaISS: number
  cidadeNome: string
  anoBase: AnoBaseSimulacao
  simplesAtual: ResultadoRegime
  presumidoAtual: ResultadoRegime
  realAtual: ResultadoRegime
}): ResultadoNovoSistemaReforma {
  const {
    rbt12,
    folha12,
    margemLucro,
    segmento,
    aliquotaISS,
    cidadeNome,
    anoBase,
    simplesAtual,
    presumidoAtual,
    realAtual,
  } = params

  const {
    aliquotaCBS,
    aliquotaIBS,
    aliquotaICMSRemanescente,
    aliquotaISSRemanescente,
    fatorReducaoSetorial,
    explicacaoTransicao,
  } = calcularAliquotasEfetivasReforma(anoBase, segmento, aliquotaISS)

  const isMercadoria =
    segmento === 'Comércio' ||
    segmento === 'Indústria' ||
    segmento === 'Agro' ||
    segmento === 'Bares e Restaurantes'

  // Identificar faixa do Simples
  let faixaNumero = 1
  if (rbt12 > 3_600_000) faixaNumero = 6
  else if (rbt12 > 1_800_000) faixaNumero = 5
  else if (rbt12 > 720_000) faixaNumero = 4
  else if (rbt12 > 360_000) faixaNumero = 3
  else if (rbt12 > 180_000) faixaNumero = 2

  const partilhaSimples = obterPercentualConsumoSimplesPorAno(anoBase, faixaNumero)
  const isSublimiteIBS = rbt12 > 3_600_000 && rbt12 <= LIMITE_SIMPLES

  // 1. Simples Nacional no Novo Sistema
  let cargaSimplesNovo = simplesAtual.cargaAnual
  let parcelaCBSSimples = 0
  let parcelaIBSSimples = 0
  let creditoTransferidoSimples = 0

  if (simplesAtual.elegivel && rbt12 > 0) {
    if (anoBase === 2026) {
      // 2026: Simples totalmente inalterado (art. 348 LC 214)
      cargaSimplesNovo = simplesAtual.cargaAnual
      parcelaCBSSimples = 0
      parcelaIBSSimples = 0
      creditoTransferidoSimples = 0
    } else {
      // Alíquota efetiva do Simples permanece a mesma (LC 214 art. 519)
      // O que muda é a repartição interna dos tributos na guia DAS
      cargaSimplesNovo = simplesAtual.cargaAnual
      parcelaCBSSimples = cargaSimplesNovo * (partilhaSimples.percentualCBS / 100)
      parcelaIBSSimples = cargaSimplesNovo * (partilhaSimples.percentualIBS / 100)

      // Crédito transferido aos clientes PJ (alíquota efetiva * soma CBS+IBS na faixa)
      const pctCredito =
        (simplesAtual.aliquotaEfetiva * (partilhaSimples.percentualTotalNovosImpostos / 100)) / 100
      creditoTransferidoSimples = Math.round(rbt12 * pctCredito * 100) / 100

      // Se sublimite de R$ 3,6M a R$ 4,8M: IBS é apurado por fora no regime regular!
      if (isSublimiteIBS && anoBase >= 2029) {
        const fatorIBS = FATOR_TRANSICAO_IBS[anoBase]
        const ibsPorFora = rbt12 * TAXA_IBS_REFERENCIA * fatorIBS * fatorReducaoSetorial
        cargaSimplesNovo = Math.round((cargaSimplesNovo + ibsPorFora) * 100) / 100
      }
    }
  }

  const detalhesSimplesReforma: DetalhesReformaRegime = {
    anoBase,
    aliquotaCBS: Math.round(aliquotaCBS * 10000) / 100,
    aliquotaIBS: Math.round(aliquotaIBS * 10000) / 100,
    aliquotaICMSRemanescente: Math.round(aliquotaICMSRemanescente * 10000) / 100,
    aliquotaISSRemanescente: Math.round(aliquotaISSRemanescente * 10000) / 100,
    fatorReducaoSetorial,
    parcelaCBSReais: Math.round(parcelaCBSSimples * 100) / 100,
    parcelaIBSReais: Math.round(parcelaIBSSimples * 100) / 100,
    parcelaICMSouISSReais: 0,
    percentualCreditoTransferidoSimples:
      anoBase > 2026 ? Math.round(partilhaSimples.percentualTotalNovosImpostos * 100) / 100 : 0,
    creditoTransferidoValorReais: creditoTransferidoSimples,
    alertaSublimiteIBS: isSublimiteIBS,
  }

  const simplesNovo: ResultadoRegime & { detalhesReforma?: DetalhesReformaRegime } = {
    nome: 'Simples Nacional',
    elegivel: simplesAtual.elegivel,
    motivoInelegibilidade: simplesAtual.motivoInelegibilidade,
    cargaAnual: Math.round(cargaSimplesNovo * 100) / 100,
    aliquotaEfetiva: rbt12 > 0 ? Math.round((cargaSimplesNovo / rbt12) * 10000) / 100 : 0,
    detalhes: {
      ...simplesAtual.detalhes,
    },
    descricaoCurta:
      anoBase === 2026
        ? 'No ano-base 2026, o Simples Nacional permanece inalterado pela LC 214/2025 art. 348.'
        : `Guia DAS com CBS (~${partilhaSimples.percentualCBS.toFixed(1)}%) e IBS (~${partilhaSimples.percentualIBS.toFixed(1)}%) na partilha interna.`,
    detalhesReforma: detalhesSimplesReforma,
  }

  // 2. Lucro Presumido no Novo Sistema
  // IRPJ e CSLL continuam existindo (não foram extintos);
  // PIS/COFINS (3,65%) são substituídos pela CBS de referência do ano;
  // ICMS/ISS substituídos por IBS + resíduo transitório de ICMS/ISS.
  let cargaPresumidoNovo = 0
  let parcelaCBSPresumido = 0
  let parcelaIBSPresumido = 0
  let parcelaAntigosPresumido = 0

  if (presumidoAtual.elegivel && rbt12 > 0) {
    const irpjPresumido = presumidoAtual.detalhes.irpj || 0
    const csllPresumido = presumidoAtual.detalhes.csll || 0

    if (anoBase === 2026) {
      // 2026: CBS 0,9% e IBS 0,1% são dispensados de recolhimento; PIS/COFINS e ICMS/ISS normais
      cargaPresumidoNovo = presumidoAtual.cargaAnual
    } else {
      // CBS substitui PIS/COFINS
      parcelaCBSPresumido = rbt12 * aliquotaCBS
      // IBS com transição
      parcelaIBSPresumido = rbt12 * aliquotaIBS
      // ICMS ou ISS remanescentes da transição
      const aliqAntiga = isMercadoria ? aliquotaICMSRemanescente : aliquotaISSRemanescente
      parcelaAntigosPresumido = rbt12 * aliqAntiga

      cargaPresumidoNovo =
        irpjPresumido +
        csllPresumido +
        parcelaCBSPresumido +
        parcelaIBSPresumido +
        parcelaAntigosPresumido
    }
  }

  const detalhesPresumidoReforma: DetalhesReformaRegime = {
    anoBase,
    aliquotaCBS: Math.round(aliquotaCBS * 10000) / 100,
    aliquotaIBS: Math.round(aliquotaIBS * 10000) / 100,
    aliquotaICMSRemanescente: Math.round(aliquotaICMSRemanescente * 10000) / 100,
    aliquotaISSRemanescente: Math.round(aliquotaISSRemanescente * 10000) / 100,
    fatorReducaoSetorial,
    parcelaCBSReais: Math.round(parcelaCBSPresumido * 100) / 100,
    parcelaIBSReais: Math.round(parcelaIBSPresumido * 100) / 100,
    parcelaICMSouISSReais: Math.round(parcelaAntigosPresumido * 100) / 100,
  }

  const presumidoNovo: ResultadoRegime & { detalhesReforma?: DetalhesReformaRegime } = {
    nome: 'Lucro Presumido',
    elegivel: presumidoAtual.elegivel,
    motivoInelegibilidade: presumidoAtual.motivoInelegibilidade,
    cargaAnual: Math.round(cargaPresumidoNovo * 100) / 100,
    aliquotaEfetiva: rbt12 > 0 ? Math.round((cargaPresumidoNovo / rbt12) * 10000) / 100 : 0,
    detalhes: {
      ...presumidoAtual.detalhes,
    },
    descricaoCurta:
      anoBase === 2026
        ? 'Lucro Presumido com regras do ano-teste de 2026.'
        : `Presunção de IRPJ/CSLL mantida; CBS ${(aliquotaCBS * 100).toFixed(1)}% e IBS ${(aliquotaIBS * 100).toFixed(1)}% substituem PIS, COFINS, ICMS e ISS.`,
    detalhesReforma: detalhesPresumidoReforma,
  }

  // 3. Lucro Real no Novo Sistema
  // IRPJ e CSLL sobre lucro real mantidos;
  // PIS/COFINS (9,25%) substituídos pela CBS de referência;
  // ICMS/ISS substituídos pelo IBS com transição.
  let cargaRealNovo = 0
  let parcelaCBSReal = 0
  let parcelaIBSReal = 0
  let parcelaAntigosReal = 0

  if (rbt12 > 0) {
    const irpjReal = realAtual.detalhes.irpj || 0
    const csllReal = realAtual.detalhes.csll || 0

    if (anoBase === 2026) {
      cargaRealNovo = realAtual.cargaAnual
    } else {
      parcelaCBSReal = rbt12 * aliquotaCBS
      parcelaIBSReal = rbt12 * aliquotaIBS
      const aliqAntiga = isMercadoria ? aliquotaICMSRemanescente : aliquotaISSRemanescente
      parcelaAntigosReal = rbt12 * aliqAntiga

      cargaRealNovo = irpjReal + csllReal + parcelaCBSReal + parcelaIBSReal + parcelaAntigosReal
    }
  }

  const detalhesRealReforma: DetalhesReformaRegime = {
    anoBase,
    aliquotaCBS: Math.round(aliquotaCBS * 10000) / 100,
    aliquotaIBS: Math.round(aliquotaIBS * 10000) / 100,
    aliquotaICMSRemanescente: Math.round(aliquotaICMSRemanescente * 10000) / 100,
    aliquotaISSRemanescente: Math.round(aliquotaISSRemanescente * 10000) / 100,
    fatorReducaoSetorial,
    parcelaCBSReais: Math.round(parcelaCBSReal * 100) / 100,
    parcelaIBSReais: Math.round(parcelaIBSReal * 100) / 100,
    parcelaICMSouISSReais: Math.round(parcelaAntigosReal * 100) / 100,
  }

  const realNovo: ResultadoRegime & { detalhesReforma?: DetalhesReformaRegime } = {
    nome: 'Lucro Real',
    elegivel: true,
    cargaAnual: Math.round(cargaRealNovo * 100) / 100,
    aliquotaEfetiva: rbt12 > 0 ? Math.round((cargaRealNovo / rbt12) * 10000) / 100 : 0,
    detalhes: {
      ...realAtual.detalhes,
    },
    descricaoCurta:
      anoBase === 2026
        ? 'Lucro Real no ano-base 2026 com compensação de teste CBS/IBS.'
        : `Lucro contábil para IRPJ/CSLL com CBS ${(aliquotaCBS * 100).toFixed(1)}% e IBS ${(aliquotaIBS * 100).toFixed(1)}% com aproveitamento amplo de créditos.`,
    detalhesReforma: detalhesRealReforma,
  }

  // Ranking do Novo Sistema
  const todosNovos = [simplesNovo, presumidoNovo, realNovo]
  const elegiveisNovos = todosNovos
    .filter((r) => r.elegivel)
    .sort((a, b) => a.cargaAnual - b.cargaAnual)
  const inelegiveisNovos = todosNovos.filter((r) => !r.elegivel)

  let regimeRecomendadoNovo: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' =
    elegiveisNovos.length > 0 ? elegiveisNovos[0].nome : 'Lucro Real'
  let economiaAnualNovo = 0
  let segundoNovo: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | undefined = undefined

  if (elegiveisNovos.length > 1) {
    segundoNovo = elegiveisNovos[1].nome
    economiaAnualNovo = Math.max(
      0,
      Math.round((elegiveisNovos[1].cargaAnual - elegiveisNovos[0].cargaAnual) * 100) / 100,
    )
  }

  if (rbt12 > LIMITE_PRESUMIDO) {
    regimeRecomendadoNovo = 'Lucro Real'
  }

  const cargaPrimeiroNovo = elegiveisNovos.length > 0 ? elegiveisNovos[0].cargaAnual : 0
  const aliqPrimeiroNovo = elegiveisNovos.length > 0 ? elegiveisNovos[0].aliquotaEfetiva : 0
  let empateTecnicoNovo = false
  let regimeEmpatadoNovo: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | undefined =
    undefined

  const ordenadosNovos = [...elegiveisNovos, ...inelegiveisNovos]
  const rankingNovo: ItemRankingRegime[] = ordenadosNovos.map((reg, idx) => {
    const posicao = idx + 1
    const diferencaValor = reg.elegivel
      ? Math.max(0, Math.round((reg.cargaAnual - cargaPrimeiroNovo) * 100) / 100)
      : 0
    const diferencaPercent =
      reg.elegivel && cargaPrimeiroNovo > 0
        ? Math.round(((reg.cargaAnual - cargaPrimeiroNovo) / cargaPrimeiroNovo) * 1000) / 10
        : 0
    const diferencaAliq = Math.abs(reg.aliquotaEfetiva - aliqPrimeiroNovo)
    const ehEmpate =
      posicao === 2 &&
      reg.elegivel &&
      (diferencaPercent < 3.0 || diferencaAliq < 1.0) &&
      rbt12 <= LIMITE_PRESUMIDO

    if (ehEmpate) {
      empateTecnicoNovo = true
      regimeEmpatadoNovo = reg.nome
    }

    let statusDescritivo = ''
    if (!reg.elegivel) {
      statusDescritivo = 'Inelegível legalmente'
    } else if (posicao === 1) {
      statusDescritivo = `1º lugar no Novo Sistema (${anoBase})`
    } else if (ehEmpate) {
      statusDescritivo = '2º lugar • Empate técnico no Novo Sistema'
    } else {
      statusDescritivo = `${posicao}º lugar • Carga maior em R$ ${diferencaValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano`
    }

    return {
      posicao,
      regime: reg.nome,
      cargaAnual: reg.cargaAnual,
      aliquotaEfetiva: reg.aliquotaEfetiva,
      elegivel: reg.elegivel,
      motivoInelegibilidade: reg.motivoInelegibilidade,
      diferencaValor,
      diferencaPercent,
      empateTecnicoComPrimeiro: ehEmpate,
      statusDescritivo,
    }
  })

  // Mini série temporal de projeção de 2026 até 2033
  const projecaoAnos = ANOS_SIMULACAO_DISPONIVEIS.map((ano) => {
    const resAno = calcularAliquotasEfetivasReforma(ano, segmento, aliquotaISS)
    let cSimples = simplesAtual.cargaAnual
    let cPresumido = presumidoAtual.cargaAnual
    let cReal = realAtual.cargaAnual

    if (ano > 2026) {
      const irpjPres = presumidoAtual.detalhes.irpj || 0
      const csllPres = presumidoAtual.detalhes.csll || 0
      const cbsPres = rbt12 * resAno.aliquotaCBS
      const ibsPres = rbt12 * resAno.aliquotaIBS
      const antPres =
        rbt12 * (isMercadoria ? resAno.aliquotaICMSRemanescente : resAno.aliquotaISSRemanescente)
      cPresumido = Math.round((irpjPres + csllPres + cbsPres + ibsPres + antPres) * 100) / 100

      const irpjR = realAtual.detalhes.irpj || 0
      const csllR = realAtual.detalhes.csll || 0
      const cbsR = rbt12 * resAno.aliquotaCBS
      const ibsR = rbt12 * resAno.aliquotaIBS
      const antR =
        rbt12 * (isMercadoria ? resAno.aliquotaICMSRemanescente : resAno.aliquotaISSRemanescente)
      cReal = Math.round((irpjR + csllR + cbsR + ibsR + antR) * 100) / 100

      if (isSublimiteIBS && ano >= 2029) {
        const fatorIBS = FATOR_TRANSICAO_IBS[ano]
        const ibsPorFora = rbt12 * TAXA_IBS_REFERENCIA * fatorIBS * resAno.fatorReducaoSetorial
        cSimples = Math.round((cSimples + ibsPorFora) * 100) / 100
      }
    }

    const opcoes = [
      { regime: 'Simples Nacional', carga: cSimples, elegivel: simplesAtual.elegivel },
      { regime: 'Lucro Presumido', carga: cPresumido, elegivel: presumidoAtual.elegivel },
      { regime: 'Lucro Real', carga: cReal, elegivel: true },
    ].filter((o) => o.elegivel)

    opcoes.sort((a, b) => a.carga - b.carga)
    const melhor = opcoes.length > 0 ? opcoes[0].regime : 'Lucro Real'

    return {
      ano,
      cargaSimples: simplesAtual.elegivel ? cSimples : 0,
      cargaPresumido: presumidoAtual.elegivel ? cPresumido : 0,
      cargaReal: cReal,
      melhorRegime: melhor,
    }
  })

  return {
    anoBase,
    simples: simplesNovo,
    presumido: presumidoNovo,
    real: realNovo,
    regimeRecomendado: regimeRecomendadoNovo,
    economiaAnual: economiaAnualNovo,
    segundoMaisVantajoso: segundoNovo,
    ranking: rankingNovo,
    empateTecnico: empateTecnicoNovo,
    regimeEmpatado: regimeEmpatadoNovo,
    explicacaoTransicao,
    projecaoAnos,
  }
}
