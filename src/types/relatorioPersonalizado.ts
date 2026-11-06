import type { DadosEmpresaPerfil } from '@/types/dadosEmpresa'
import type { SimulacaoCalculadora } from '@/types/simulacaoCalculadora'
import type { SimulacaoRecuperador } from '@/types/recuperadorCreditos'
import type { DiagnosticoRecord } from '@/services/diagnosticos'
import type { ResultadoDiagnosticoCompleto } from '@/lib/regimes'

export type ModuloAnaliseTipo = 'calculadora' | 'recuperador' | 'diagnostico'

export type SecaoCalculadoraTipo =
  | 'calc_resumo'
  | 'calc_comparativo'
  | 'calc_evolucao'
  | 'calc_split'
  | 'calc_creditos'
  | 'calc_passos'

export type SecaoRecuperadorTipo =
  | 'recup_resumo'
  | 'recup_tipos'
  | 'recup_ano_a_ano'
  | 'recup_passos'

export type SecaoDiagnosticoTipo =
  | 'diag_resumo'
  | 'diag_matriz_riscos'
  | 'diag_autoavaliacao'
  | 'diag_transicao'
  | 'diag_enquadramento'
  | 'diag_dados_gerenciais'
  | 'diag_vinculos_societarios'

export type SecaoRelatorioTipo = SecaoCalculadoraTipo | SecaoRecuperadorTipo | SecaoDiagnosticoTipo

export interface ConfiguracaoRelatorioPersonalizado {
  titulo: string
  subtitulo?: string
  observacoes?: string
  incluirCalculadora: boolean
  incluirRecuperador: boolean
  incluirDiagnostico: boolean
  secoesCalculadora: SecaoCalculadoraTipo[]
  secoesRecuperador: SecaoRecuperadorTipo[]
  secoesDiagnostico: SecaoDiagnosticoTipo[]
  ordemAnalises?: ModuloAnaliseTipo[]
  // Snapshots ou IDs vinculados
  idSimulacaoCalculadora?: string | null
  idSimulacaoRecuperador?: string | null
  idDiagnostico360?: string | null
  // Snapshots dos dados salvos no momento do relatório (para histórico fiel e regeneração)
  snapshotDadosEmpresa?: DadosEmpresaPerfil | null
  snapshotCalculadora?: SimulacaoCalculadora | null
  snapshotRecuperador?: SimulacaoRecuperador | null
  snapshotDiagnostico?: DiagnosticoRecord | null
  snapshotResultadoDiagnostico?: ResultadoDiagnosticoCompleto | null
  responsavelNome?: string
  responsavelCrc?: string
}

export interface RelatorioPersonalizadoRecord {
  id: string
  user_id?: string
  cliente_id?: string
  empresa_id?: string
  crm_cliente_id?: string
  canal_envio?: string
  enviado_para?: string
  data_envio?: string
  nome: string
  empresa_nome?: string
  cnpj?: string
  analises_incluidas?: ModuloAnaliseTipo[]
  secoes_selecionadas?: SecaoRelatorioTipo[]
  observacoes?: string
  configuracao: ConfiguracaoRelatorioPersonalizado
  created: string
  updated: string
}
