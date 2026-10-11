import { SegmentoEmpresa, RegimeAtualEmpresa } from '@/lib/regimes'
import {
  TipoAtividade,
  SubatividadeServico,
  SubatividadeIndustria,
  SubatividadeComercio,
  SubatividadeTipo,
} from '@/types/calculadoraIbsCbs'
import { AnoBaseSimulacao } from '@/lib/reformaTributaria'

export interface DadosEmpresaPerfil {
  // Bloco 1: Dados operacionais da empresa
  nomeEmpresa?: string
  cnpj?: string
  faturamentoMensal: number // ex: 200000
  percentualComprasVendas: number // ex: 40 (%)
  tipoAtividade: TipoAtividade // 'servico' | 'industria' | 'comercio' | 'misto'
  subatividadeServico: SubatividadeServico
  subatividadeIndustria: SubatividadeIndustria
  subatividadeComercio: SubatividadeComercio
  proporcaoServicoMisto: number // ex: 50 (% de servico no misto)
  ufOrigem: string // ex: 'SP'
  cidade: string // id da cidade para ISS, ex: 'sp-sao-paulo'
  segmento: SegmentoEmpresa // ex: 'Comércio', 'Serviços', etc.

  // Bloco 2: Parâmetros de alta precisão tributária
  folhaPagamentoMensal: number // ex: 50000 (com pró-labore)
  margemLucroEstimada: number // ex: 20 (%)
  despesasComCreditosMensais: number // ex: 30000 (energia, aluguel, TI)
  percentualExportacao: number // ex: 0 (%)
  regimeAtual: RegimeAtualEmpresa | string // ex: 'Simples Nacional'
  anoBaseTransicao: AnoBaseSimulacao // ex: 2026, 2027...

  // Metadados
  atualizadoEm?: string
}

export const DADOS_EMPRESA_PADRAO: DadosEmpresaPerfil = {
  nomeEmpresa: '',
  cnpj: '',
  faturamentoMensal: 200000,
  percentualComprasVendas: 40,
  tipoAtividade: 'servico',
  subatividadeServico: 'servico_comum',
  subatividadeIndustria: 'industria_comum',
  subatividadeComercio: 'varejo_comum',
  proporcaoServicoMisto: 50,
  ufOrigem: 'SP',
  cidade: 'sp-sao-paulo',
  segmento: 'Serviços',

  folhaPagamentoMensal: 50000,
  margemLucroEstimada: 20,
  despesasComCreditosMensais: 30000,
  percentualExportacao: 0,
  regimeAtual: 'Simples Nacional',
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
