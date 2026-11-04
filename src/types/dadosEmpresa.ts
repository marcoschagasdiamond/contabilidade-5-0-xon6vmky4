import {
  SegmentoEmpresa,
  RegimeAtualEmpresa,
  PorteFuncionarios,
  EmissaoNotaFiscal,
} from '@/lib/regimes'
import {
  TipoAtividade,
  SubatividadeServico,
  SubatividadeIndustria,
  SubatividadeComercio,
  SubatividadeTipo,
} from '@/types/calculadoraIbsCbs'
import { AnoBaseSimulacao } from '@/lib/reformaTributaria'

export interface DadosEmpresaPerfil {
  // Bloco 1: Dados operacionais da empresa (fiel ao Passo 1 do Diagnóstico)
  // Identificação
  nomeContato: string // ex: 'Carlos Eduardo Silva' (Passo 1: "Seu Nome Completo *")
  nomeEmpresa: string // ex: 'Inova Tecnologia & Consultoria Ltda' (Passo 1: "Nome da Empresa *")
  cnpj: string // ex: '00.000.000/0000-00' (Passo 1: "CNPJ da Empresa *")
  email: string // ex: 'carlos@empresa.com.br' (Passo 1: "E-mail Corporativo *")
  telefone: string // ex: '+55 (11) 99999-9999' (Passo 1: "Telefone / WhatsApp *")

  // Localização
  ufOrigem: string // ex: 'SP' (Passo 1: "UF de Origem (ICMS Estadual) *")
  cidade: string // id da cidade para ISS, ex: 'sp-sao-paulo' (Passo 1: "Cidade / UF (Alíquota de ISS) *")

  // Segmento (1 das 10 opções)
  segmento: SegmentoEmpresa // ex: 'Comércio', 'Serviços', 'Tecnologia'...

  // Perfil Operacional da Empresa
  regimeAtual: RegimeAtualEmpresa | string // ex: 'Simples Nacional' (Passo 1: "Regime Tributário Atual")
  funcionarios: PorteFuncionarios | string // ex: '1 a 5 funcionários' (Passo 1: "Quadro de Colaboradores")
  emissaoNf: EmissaoNotaFiscal | string // ex: 'Predominante para Pessoas Jurídicas (B2B)' (Passo 1: "Perfil dos Clientes / Emissão de NF")
  atividadeMista: boolean // Passo 1: "Atividade Mista (Comércio + Serviço)"

  // Campos operacionais para os motores de cálculo (Calculadora IBS/CBS, Comparativo e Diagnóstico Passo 2)
  faturamentoMensal: number // ex: 200000
  percentualComprasVendas: number // ex: 40 (%)
  tipoAtividade: TipoAtividade // 'servico' | 'industria' | 'comercio' | 'misto'
  subatividadeServico: SubatividadeServico
  subatividadeIndustria: SubatividadeIndustria
  subatividadeComercio: SubatividadeComercio
  proporcaoServicoMisto: number // ex: 50 (% de servico no misto)

  // Bloco 2: Parâmetros de alta precisão tributária
  folhaPagamentoMensal: number // ex: 50000 (com pró-labore)
  margemLucroEstimada: number // ex: 20 (%)
  despesasComCreditosMensais: number // ex: 30000 (energia, aluguel, TI)
  percentualExportacao: number // ex: 0 (%)
  anoBaseTransicao: AnoBaseSimulacao // ex: 2026, 2027...

  // Bloco 3: Fase 1 — Parâmetros Fiscais & Insumos (Fonte Mestra)
  // 1. Perfil de insumos (% tributados à alíquota cheia, % monofásicos, % alíquota reduzida — somam 100%)
  perfilInsumosAliquotaCheia: number // ex: 70 (%)
  perfilInsumosMonofasicos: number // ex: 20 (%)
  perfilInsumosAliquotaReduzida: number // ex: 10 (%)

  // 2. Presença de monofásicos
  presencaMonofasicos: boolean // sim / não
  categoriasMonofasicos: string[] // 'combustiveis' | 'bebidas' | 'medicamentos' | 'pneus' | 'veiculos' | 'agroquimicos'

  // 3. Insumos energéticos (energia elétrica, vapor para indústria)
  insumosEnergeticos: boolean // sim / não

  // 4. Intangíveis / royalties (software, marcas, licenças)
  intangiveisRoyalties: boolean // sim / não

  // 5. Imobilizado (investimentos em ativo imobilizado nos últimos 5 anos)
  imobilizadoUltimos5Anos: number // Valor total investido nos últimos 5 anos (R$)
  imobilizadoAnosDetalhe?: Record<string, number> // Detalhamento opcional ano a ano ex: { "2021": 50000, ... }

  // Bloco 4: Fase 2 — Refinamento Tributário & Operacional (Fonte Mestra)
  // 1. % de compras que NÃO geram crédito (uso pessoal, isentas, não tributadas) - 0 a 100%
  percentualComprasSemCredito: number
  // 2. Saldo credor acumulado / estoque inicial de créditos tributários (R$)
  saldoCredorAcumulado: number
  // 3. % de vendas interestaduais - 0 a 100%
  percentualVendasInterestaduais: number
  // 4. Regime especial atual
  regimeEspecialAtual: RegimeEspecialAtual
  // 5. Perfil de retenção dos clientes / split payment
  perfilRetencaoSplit: PerfilRetencaoSplit
  // 5b. % retenção quando split for parcial - 0 a 100%
  percentualRetencaoSplit?: number

  // Bloco 5: Fase 3 — Situação Fiscal & Multi-UF (Fonte Mestra)
  // 1. Autos de infração ativos
  autosInfracaoAtivos: boolean
  autosInfracaoQuantidade?: number
  autosInfracaoValor?: number
  // 2. Parcelamentos em curso
  parcelamentosEmCurso: boolean
  parcelamentosQuantidade?: number
  // 3. Débitos com inscrição em dívida ativa ou execução fiscal
  dividaAtivaExecucaoFiscal: boolean
  // 4. Obrigações acessórias em atraso
  obrigacoesAcessoriasAtraso: boolean
  // 5. Número de filiais / estabelecimentos (mínimo 1)
  numeroFiliais: number
  // 6. UFs adicionais de operação (além da UF principal de origem)
  ufsOperacao: string[]

  // Metadados e Documento Fiscal Importado
  atualizadoEm?: string
  documentoFiscalImportado?: DocumentoFiscalImportadoReferencia
}

export interface AgregadosContabeisImportados {
  ativoTotal?: number
  passivoTotal?: number
  patrimonioLiquido?: number
  cmvCsp?: number
  lucroLiquido?: number
  receitaBruta?: number
  despesasOperacionais?: number
}

export interface TotaisFiscaisImportados {
  faturamentoPeriodo?: number
  comprasTotais?: number
  comprasComCredito?: number
  saldoCredorAcumulado?: number
  receitaInterestadual?: number
  receitaExportacao?: number
  percentualVendasInterestaduais?: number
}

export interface OrigemCampoImportado {
  chave: string
  rotulo: string
  documento: string
  tipo: 'efd_contribuicoes' | 'efd_icms_ipi' | 'balancete' | 'outro'
  dataImportacao: string
  valorFormatado?: string
}

export interface DocumentoFiscalImportadoReferencia {
  tipo: 'efd_contribuicoes' | 'efd_icms_ipi' | 'balancete' | 'outro'
  nomeTipo: string
  nomeArquivo: string
  periodoInicio?: string
  periodoFim?: string
  dataImportacao: string
  cnpjArquivo?: string
  linhasLidas?: number
  resumoExtracao?: string
  // Agregados contábeis e fiscais persistidos
  agregadosContabeis?: AgregadosContabeisImportados
  totaisFiscais?: TotaisFiscaisImportados
  // Rastreabilidade de proveniência campo a campo
  camposPreenchidos?: string[]
  origemCampos?: Record<string, OrigemCampoImportado>
}

export type RegimeEspecialAtual =
  | 'nenhum'
  | 'monofasico'
  | 'substituicao_tributaria'
  | 'zona_franca_manaus'
  | 'ret_permuta'

export type PerfilRetencaoSplit = 'sim_todos' | 'parcial' | 'nao'

export const REGIMES_ESPECIAIS_OPCOES: {
  id: RegimeEspecialAtual
  rotulo: string
  descricao: string
}[] = [
  {
    id: 'nenhum',
    rotulo: 'Nenhum / Regime Padrão',
    descricao: 'Tributação regular sem benefícios de regimes concentrados ou especiais.',
  },
  {
    id: 'monofasico',
    rotulo: 'Monofásico (PIS/COFINS)',
    descricao:
      'Cadeia com tributação concentrada no fabricante/importador e alíquota zero na revenda.',
  },
  {
    id: 'substituicao_tributaria',
    rotulo: 'Substituição Tributária (ICMS-ST)',
    descricao: 'ICMS retido antecipadamente na fonte pelo substituto tributário.',
  },
  {
    id: 'zona_franca_manaus',
    rotulo: 'Zona Franca de Manaus (ZFM / ALC)',
    descricao:
      'Benefícios constitucionais de isenção, crédito presumido e incentivos regionais mantidos.',
  },
  {
    id: 'ret_permuta',
    rotulo: 'RET / Permuta Imobiliária',
    descricao:
      'Regime Especial de Tributação de incorporações imobiliárias e patrimônio de afetação.',
  },
]

export const PERFIS_RETENCAO_SPLIT_OPCOES: {
  id: PerfilRetencaoSplit
  rotulo: string
  descricao: string
}[] = [
  {
    id: 'nao',
    rotulo: 'Não retêm (Recolhimento padrão pós-faturamento)',
    descricao: 'Os clientes liquidam a nota integralmente e o imposto é apurado por guia mensal.',
  },
  {
    id: 'parcial',
    rotulo: 'Parcialmente (Clientes corporativos/órgãos retêm % estimado)',
    descricao: 'Fração das vendas sofre retenção automática na liquidação financeira da nota.',
  },
  {
    id: 'sim_todos',
    rotulo: 'Sim, todos (Split payment integral na liquidação)',
    descricao: '100% do imposto apurado é retido na liquidação bancária/cartão.',
  },
]

export const CATEGORIAS_MONOFASICOS_OPCOES = [
  { id: 'combustiveis', rotulo: 'Combustíveis e derivados' },
  { id: 'bebidas', rotulo: 'Bebidas (cervejas, refrigerantes, águas)' },
  { id: 'medicamentos', rotulo: 'Medicamentos e produtos farmacêuticos' },
  { id: 'pneus', rotulo: 'Pneus e câmaras de ar' },
  { id: 'veiculos', rotulo: 'Veículos, autopeças e máquinas' },
  { id: 'agroquimicos', rotulo: 'Agroquímicos e insumos agrícolas' },
] as const

export const DADOS_EMPRESA_PADRAO: DadosEmpresaPerfil = {
  // Passo 1 - Identificação
  nomeContato: '',
  nomeEmpresa: '',
  cnpj: '',
  email: '',
  telefone: '',

  // Passo 1 - Localização
  ufOrigem: 'SP',
  cidade: 'sp-sao-paulo',

  // Passo 1 - Segmento (10 opções)
  segmento: 'Serviços',

  // Passo 1 - Perfil Operacional
  regimeAtual: 'Simples Nacional',
  funcionarios: '1 a 5 funcionários',
  emissaoNf: 'Predominante para Pessoas Jurídicas (B2B)',
  atividadeMista: false,

  // Campos operacionais / motores de cálculo
  faturamentoMensal: 200000,
  percentualComprasVendas: 40,
  tipoAtividade: 'servico',
  subatividadeServico: 'servico_comum',
  subatividadeIndustria: 'industria_comum',
  subatividadeComercio: 'varejo_comum',
  proporcaoServicoMisto: 50,

  // Bloco 2
  folhaPagamentoMensal: 50000,
  margemLucroEstimada: 20,
  despesasComCreditosMensais: 30000,
  percentualExportacao: 0,
  anoBaseTransicao: 2026,

  // Bloco 3 (Fase 1)
  perfilInsumosAliquotaCheia: 100,
  perfilInsumosMonofasicos: 0,
  perfilInsumosAliquotaReduzida: 0,
  presencaMonofasicos: false,
  categoriasMonofasicos: [],
  insumosEnergeticos: false,
  intangiveisRoyalties: false,
  imobilizadoUltimos5Anos: 0,
  imobilizadoAnosDetalhe: {},

  // Bloco 4 (Fase 2 - Neutros por padrão para preservar cálculos legados)
  percentualComprasSemCredito: 0,
  saldoCredorAcumulado: 0,
  percentualVendasInterestaduais: 0,
  regimeEspecialAtual: 'nenhum',
  perfilRetencaoSplit: 'nao',
  percentualRetencaoSplit: 0,

  // Bloco 5 (Fase 3 - Situação Fiscal & Multi-UF neutros por padrão)
  autosInfracaoAtivos: false,
  autosInfracaoQuantidade: 0,
  autosInfracaoValor: 0,
  parcelamentosEmCurso: false,
  parcelamentosQuantidade: 0,
  dividaAtivaExecucaoFiscal: false,
  obrigacoesAcessoriasAtraso: false,
  numeroFiliais: 1,
  ufsOperacao: [],
}

const STORAGE_KEY = 'contabilidade5_dados_empresa'
const STORAGE_EVENT = 'contabilidade5_dados_empresa_updated'

export function carregarDadosEmpresa(): DadosEmpresaPerfil {
  if (typeof window === 'undefined') return DADOS_EMPRESA_PADRAO
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DADOS_EMPRESA_PADRAO
    const parsed = JSON.parse(raw)
    return {
      ...DADOS_EMPRESA_PADRAO,
      ...parsed,
    }
  } catch (err) {
    console.warn('Erro ao carregar dados da empresa do localStorage:', err)
    return DADOS_EMPRESA_PADRAO
  }
}

export function salvarDadosEmpresa(dados: Partial<DadosEmpresaPerfil>): DadosEmpresaPerfil {
  if (typeof window === 'undefined') return { ...DADOS_EMPRESA_PADRAO, ...dados }
  try {
    const atual = carregarDadosEmpresa()
    const atualizado: DadosEmpresaPerfil = {
      ...atual,
      ...dados,
      atualizadoEm: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizado))
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: atualizado }))
    return atualizado
  } catch (err) {
    console.error('Erro ao salvar dados da empresa no localStorage:', err)
    return { ...DADOS_EMPRESA_PADRAO, ...dados }
  }
}

export function existeDadosEmpresaSalvos(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    // Para ser considerado realmente preenchido/salvo pelo usuário,
    // verifica se possui campos de identificação mínimos preenchidos
    const temNome = typeof parsed.nomeContato === 'string' && parsed.nomeContato.trim().length > 0
    const temEmpresa =
      typeof parsed.nomeEmpresa === 'string' && parsed.nomeEmpresa.trim().length > 0
    const temCnpj = typeof parsed.cnpj === 'string' && parsed.cnpj.trim().length > 0
    return temNome && temEmpresa && temCnpj
  } catch {
    return false
  }
}

export function limparDadosEmpresa(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: null }))
  } catch (err) {
    console.error('Erro ao limpar dados da empresa do localStorage:', err)
  }
}

/**
 * Retorna a rota inicial da esteira/trilha de diagnósticos.
 * O fluxo de diagnóstico gratuito sempre inicia na etapa de Configurações (/diagnostico-configuracoes),
 * independentemente de existirem dados previamente salvos.
 */
export function obterRotaInicialDiagnostico(_temDadosSalvos?: boolean): string {
  return '/diagnostico-configuracoes'
}

export { STORAGE_KEY, STORAGE_EVENT }
