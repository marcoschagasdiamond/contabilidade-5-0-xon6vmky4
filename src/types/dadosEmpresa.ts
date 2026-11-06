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

  // Consulta de CNPJ Externa
  dadosCnpjConsulta?: {
    razaoSocial?: string
    nomeFantasia?: string
    situacaoCadastral?: string
    dataAbertura?: string
    cnaePrincipalCodigo?: string
    cnaePrincipalDescricao?: string
    enderecoCompleto?: string
    cep?: string
    fonte?: string
    consultadoEm?: string
    qsaDisponivel?: boolean
    totalSociosQsa?: number
    qsa?: SocioQsaConsulta[]
    qsaFonte?: string
    qsaConsultadoEm?: string
  }

  // Quadro de Sócios e Administradores (QSA) obtido externamente
  dadosQsaConsulta?: {
    socios: SocioQsaConsulta[]
    fonte: string
    consultadoEm: string
    aplicadoComoVinculos?: boolean
  }

  // Consulta de CNAE Externa
  dadosCnaeConsulta?: {
    codigo?: string
    codigoFormatado?: string
    descricao?: string
    secaoCodigo?: string
    secaoDescricao?: string
    divisaoCodigo?: string
    divisaoDescricao?: string
    segmentoSugerido?: string
    fonte?: string
    consultadoEm?: string
  }

  // Metadados e Documento Fiscal Importado
  atualizadoEm?: string
  documentoFiscalImportado?: DocumentoFiscalImportadoReferencia

  // Etapa 1: Integração Fiscal (Certidões & Consultas + Histórico Unificado)
  certidoesFiscais?: CertidaoFiscalRegistro[]
  historicoDocumentosFiscais?: ItemHistoricoDocumentoFiscal[]

  // Módulo Vínculos Societários & Risco de Regime (LC 123/2006, art. 3º)
  vinculosSocietarios?: VinculoSocietario[]
}

// ============================================================================
// VÍNCULOS SOCIETÁRIOS & RISCO DE REGIME (LC 123/2006, art. 3º)
// ============================================================================

export type PapelClienteNoVinculo =
  | 'socio_pf' // Sócio Pessoa Física da outra empresa
  | 'administrador' // Administrador / Diretor da outra empresa
  | 'pj_socia_holding' // PJ (holding/outra) como sócia da empresa analisada (Vedação art. 3º, §4º, I)
  | 'empresa_participa_outra' // A empresa analisada participa do capital de outra PJ (Vedação art. 3º, §4º, VII)

export type RegimeOutraEmpresa =
  | 'Simples Nacional'
  | 'Lucro Presumido'
  | 'Lucro Real'
  | 'MEI'
  | 'Outro'

export interface SocioQsaConsulta {
  id: string
  nome: string
  qualificacao: string
  cpfCnpj?: string
  percentualParticipacao?: number // 0 a 100
  dataEntrada?: string
  faixaEtaria?: string
  nomeRepresentanteLegal?: string
  qualificacaoRepresentanteLegal?: string
  paisOrigem?: string
  tipoPessoa?: 'PF' | 'PJ' | 'ESTRANGEIRO'
}

export interface VinculoSocietario {
  id: string
  nomeEmpresa: string
  cnpj: string
  papelCliente: PapelClienteNoVinculo
  percentualParticipacao: number // 0 a 100
  exerceAdministracao: boolean
  regimeEmpresa: RegimeOutraEmpresa
  faturamentoAnual: number // Faturamento bruto anual da outra empresa (R$)
  excecaoLegal?: boolean // Para empresa_participa_outra: cooperativa, central de compras, consórcio etc.
  observacoes?: string
  dataCadastro?: string // ISO string
  origemQsa?: boolean
  nomeSocioOrigem?: string
}

// ============================================================================
// ETAPA 1 DA INTEGRAÇÃO FISCAL: TIPOS DE CERTIDÕES E CONSULTAS
// ============================================================================

export type TipoCertidaoFiscal =
  | 'cnd_federal' // Certidão Negativa/Positiva Federal (PGFN / RFB)
  | 'cnd_estadual' // Certidão Negativa/Positiva Estadual (SEFAZ)
  | 'cnd_municipal' // Certidão Negativa/Positiva Municipal (ISS / IPTU)
  | 'cnd_fgts' // Certificado de Regularidade do FGTS (CRF / Caixa)
  | 'cndt_trabalhista' // Certidão Negativa de Débitos Trabalhistas (TST)
  | 'consulta_receita' // Comprovante / Consulta Situação Cadastral Receita Federal
  | 'consulta_sintegra' // Consulta Sintegra / CCC Estadual
  | 'declaracao_dctf' // Recibo / Declaração DCTF / DCTFWeb
  | 'outro' // Outra consulta ou certidão tributária

export type SituacaoCertidaoFiscal =
  | 'negativa' // Negativa (regular, sem pendências)
  | 'positiva_efeito_negativa' // Positiva com Efeito de Negativa (débitos suspensos/parcelados)
  | 'positiva' // Positiva (possui pendências/débitos ativos)
  | 'com_pendencias' // Pendências cadastrais ou omissões
  | 'regular' // Regular (situação cadastral ativa)
  | 'irregular' // Irregular (inapta, suspensa, baixada)

export type FonteOrigemDocumentoFiscal = 'manual' | 'api'

export interface CertidaoFiscalRegistro {
  id: string
  tipo: TipoCertidaoFiscal
  nomeTipo: string
  orgaoEmissor: string // Ex: "Receita Federal / PGFN", "SEFAZ-SP", "Prefeitura de São Paulo", "Caixa Econômica Federal", "TST"
  situacao: SituacaoCertidaoFiscal
  codigoControle?: string // Código de controle/autenticidade
  numeroCertidao?: string
  dataEmissao?: string // YYYY-MM-DD
  dataValidade?: string // YYYY-MM-DD
  nomeArquivo: string
  tamanhoArquivoBytes?: number
  tipoMime?: string
  fonte: FonteOrigemDocumentoFiscal // 'manual' vs 'api'
  dataRegistro: string // ISO string
  observacoes?: string
  // Impactos mapeados na Situação Fiscal (Fase 3)
  impactoSituacaoFiscal?: {
    sugereAutosInfracao?: boolean
    sugereDividaAtiva?: boolean
    sugereParcelamentos?: boolean
    sugereObrigacoesAtraso?: boolean
  }
}

export type TipoItemHistoricoFiscal =
  | 'efd_contribuicoes'
  | 'efd_icms_ipi'
  | 'balancete'
  | 'nfe_xml'
  | 'certidao_fiscal'
  | 'consulta_fiscal'
  | 'outro'

export interface ItemHistoricoDocumentoFiscal {
  id: string
  tipo: TipoItemHistoricoFiscal
  categoria: 'escrituracao' | 'balancete' | 'nfe' | 'certidao' | 'consulta'
  titulo: string
  nomeArquivo: string
  dataProcessamento: string // ISO string
  fonte: FonteOrigemDocumentoFiscal // 'manual' ou 'api'
  situacaoOuResumo: string
  dataValidade?: string // YYYY-MM-DD (para certidões)
  linhasLidas?: number
  detalhesAdicionais?: Record<string, any>
}

export const TIPOS_CERTIDOES_FISCAIS_OPCOES: {
  id: TipoCertidaoFiscal
  rotulo: string
  orgaoPadrao: string
  descricao: string
}[] = [
  {
    id: 'cnd_federal',
    rotulo: 'Certidão Conjunta Federal (PGFN / RFB)',
    orgaoPadrao: 'Receita Federal / PGFN',
    descricao: 'Tributos federais e Dívida Ativa da União.',
  },
  {
    id: 'cnd_estadual',
    rotulo: 'Certidão Estadual (SEFAZ / PGE)',
    orgaoPadrao: 'SEFAZ Estadual / PGE',
    descricao: 'ICMS e débitos inscritos em Dívida Ativa do Estado.',
  },
  {
    id: 'cnd_municipal',
    rotulo: 'Certidão Municipal (Tributos Mobiliários / ISS)',
    orgaoPadrao: 'Prefeitura Municipal',
    descricao: 'ISSQN, taxas municipais e Dívida Ativa Municipal.',
  },
  {
    id: 'cnd_fgts',
    rotulo: 'Certificado de Regularidade do FGTS (CRF)',
    orgaoPadrao: 'Caixa Econômica Federal',
    descricao: 'Regularidade de depósitos e obrigações do FGTS.',
  },
  {
    id: 'cndt_trabalhista',
    rotulo: 'Certidão Negativa Trabalhista (CNDT)',
    orgaoPadrao: 'Tribunal Superior do Trabalho (TST)',
    descricao: 'Inadimplência de débitos perante a Justiça do Trabalho.',
  },
  {
    id: 'consulta_receita',
    rotulo: 'Consulta / Situação Cadastral CNPJ',
    orgaoPadrao: 'Receita Federal do Brasil',
    descricao: 'Comprovante de inscrição e situação cadastral do CNPJ.',
  },
  {
    id: 'consulta_sintegra',
    rotulo: 'Consulta Sintegra / Cadastro Estadual (CCC)',
    orgaoPadrao: 'Sintegra / SEFAZ',
    descricao: 'Situação da Inscrição Estadual e habilitação para emitir NF-e.',
  },
  {
    id: 'declaracao_dctf',
    rotulo: 'DCTF / DCTFWeb / Recibo de Entrega',
    orgaoPadrao: 'Receita Federal do Brasil',
    descricao: 'Declaração de Débitos e Créditos Tributários Federais.',
  },
  {
    id: 'outro',
    rotulo: 'Outra Certidão ou Consulta Tributária',
    orgaoPadrao: 'Órgão Fiscal',
    descricao: 'Outro comprovante, termo de parcelamento ou notificação fiscal.',
  },
]

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

export type TipoDocumentoFiscalOrigem =
  | 'efd_contribuicoes'
  | 'efd_icms_ipi'
  | 'balancete'
  | 'nfe_xml'
  | 'outro'

export interface ItemNcmImportadoReferencia {
  ncm: string
  descricao: string
  quantidadeTotal: number
  valorTotal: number
  totalItens: number
  categoriaRotulo?: string
  tesesSugeridas?: string[]
}

export interface OrigemCampoImportado {
  chave: string
  rotulo: string
  documento: string
  tipo: TipoDocumentoFiscalOrigem
  dataImportacao: string
  valorFormatado?: string
}

export interface DocumentoFiscalImportadoReferencia {
  tipo: TipoDocumentoFiscalOrigem
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
  // NCMs extraídos de notas fiscais eletrônicas
  itensNcmImportados?: ItemNcmImportadoReferencia[]
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

  // Vínculos Societários
  vinculosSocietarios: [],
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
