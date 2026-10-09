export type RegimeDiferenciadoTipo = 'padrao' | 'saude_educacao' | 'transporte' | 'cesta_basica'

export type TipoAtividade = 'servico' | 'industria' | 'comercio' | 'misto'

export interface ConfiguracoesGerais {
  // Alíquotas Padrão IVA Dual
  cbsPadrao: number // 8.80
  ibsPadrao: number // 17.70
  totalIvaDual: number // 26.50

  // Regimes diferenciados
  saudeEducacaoReducao: number // 60%
  saudeEducacaoAliquota: number // 10.60%
  transporteReducao: number // 30%
  transporteAliquota: number // 18.55%
  cestaBasicaIsencao: number // 0%

  // Sistema Antigo Lucro Real
  lucroRealPis: number // 1.65%
  lucroRealCofins: number // 7.60%
  lucroRealIpi: number // 5.0%
  lucroRealIcms: number // 18.0%
  lucroRealIss: number // 3.0%

  // Sistema Antigo Lucro Presumido
  lucroPresumidoPis: number // 0.65%
  lucroPresumidoCofins: number // 3.00%
  lucroPresumidoIcms: number // 18.0%
  lucroPresumidoIss: number // 3.0%
  lucroPresumidoIpi: number // 5.0%
}

export const CONFIGURACOES_PADRAO: ConfiguracoesGerais = {
  cbsPadrao: 8.8,
  ibsPadrao: 17.7,
  totalIvaDual: 26.5,

  saudeEducacaoReducao: 60,
  saudeEducacaoAliquota: 10.6,
  transporteReducao: 30,
  transporteAliquota: 18.55,
  cestaBasicaIsencao: 0,

  lucroRealPis: 1.65,
  lucroRealCofins: 7.6,
  lucroRealIpi: 5.0,
  lucroRealIcms: 18.0,
  lucroRealIss: 3.0,

  lucroPresumidoPis: 0.65,
  lucroPresumidoCofins: 3.0,
  lucroPresumidoIcms: 18.0,
  lucroPresumidoIss: 3.0,
  lucroPresumidoIpi: 5.0,
}

export interface CategoriaDespesaCredito {
  id: string
  nome: string
  valorMensal: number
  // Taxa de crédito do sistema antigo em % (ex: 9.25% para PIS/COFINS LR, 18% para ICMS em insumos, etc.)
  aliquotaAntiga: number
  descricaoAntigo: string
}

export const CATEGORIAS_CREDITO_PADRAO: CategoriaDespesaCredito[] = [
  {
    id: 'materia_prima',
    nome: 'Matéria-prima',
    valorMensal: 100000,
    aliquotaAntiga: 27.25, // PIS 1.65 + COFINS 7.6 + ICMS 18
    descricaoAntigo: 'Crédito pleno no Lucro Real (PIS 1,65% + COFINS 7,6% + ICMS 18%)',
  },
  {
    id: 'energia_eletrica',
    nome: 'Energia elétrica',
    valorMensal: 15000,
    aliquotaAntiga: 9.25, // PIS/COFINS não-cumulativo (ICMS produtivo condicionado)
    descricaoAntigo: 'Crédito de PIS/COFINS (9,25%) no Lucro Real; ICMS com restrição setorial',
  },
  {
    id: 'aluguel',
    nome: 'Aluguel de imóveis/galpões',
    valorMensal: 25000,
    aliquotaAntiga: 9.25, // PIS/COFINS Lucro Real; Presumido = 0
    descricaoAntigo: 'PIS/COFINS 9,25% apenas Lucro Real de PJ; sem crédito no Presumido/Simples',
  },
  {
    id: 'servicos_ti',
    nome: 'Serviços de TI e Software',
    valorMensal: 20000,
    aliquotaAntiga: 0, // Tradicionalmente vedado/litigioso sem crédito ICMS/ISS
    descricaoAntigo:
      'Geralmente sem crédito no sistema antigo (ISS não gera crédito, PIS/COFINS restrito)',
  },
  {
    id: 'servicos_limpeza',
    nome: 'Serviços de limpeza e segurança',
    valorMensal: 12000,
    aliquotaAntiga: 9.25,
    descricaoAntigo:
      'Permite crédito de PIS/COFINS (9,25%) no Lucro Real como insumo de mão de obra',
  },
  {
    id: 'material_escritorio',
    nome: 'Material de escritório e expediente',
    valorMensal: 5000,
    aliquotaAntiga: 0,
    descricaoAntigo: 'Uso e consumo: Vedado crédito no sistema antigo (ICMS e PIS/COFINS)',
  },
  {
    id: 'telefonia_internet',
    nome: 'Telefonia e Internet',
    valorMensal: 6000,
    aliquotaAntiga: 0,
    descricaoAntigo:
      'Sem crédito para a maioria dos setores no sistema antigo (vedação de uso/consumo)',
  },
  {
    id: 'manutencao',
    nome: 'Manutenção de máquinas e instalações',
    valorMensal: 18000,
    aliquotaAntiga: 9.25,
    descricaoAntigo: 'PIS/COFINS 9,25% para bens de produção no Lucro Real; sem crédito de ISS',
  },
  {
    id: 'consultorias',
    nome: 'Consultorias e serviços profissionais',
    valorMensal: 15000,
    aliquotaAntiga: 0,
    descricaoAntigo: 'Serviços tributados por ISS: zero crédito tributário no sistema atual',
  },
  {
    id: 'frete_transporte',
    nome: 'Frete e Transporte de insumos',
    valorMensal: 30000,
    aliquotaAntiga: 21.25, // ICMS 12% + PIS/COFINS 9.25%
    descricaoAntigo: 'Crédito de PIS/COFINS (9,25%) e ICMS interestadual (~12%) no Lucro Real',
  },
]
