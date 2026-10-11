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

  // Metadados
  atualizadoEm?: string
}

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
    return localStorage.getItem(STORAGE_KEY) !== null
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

export { STORAGE_KEY, STORAGE_EVENT }
