export interface OnboardingProgressoModel {
  id?: string
  user_id: string
  passo_empresa_concluido: boolean
  passo_diagnostico_concluido: boolean
  passo_calculadora_concluido: boolean
  wizard_dispensado: boolean
  checklist_recolhido: boolean
  concluido_em?: string | null
  created?: string
  updated?: string
}

export type PassoOnboardingId = 'empresa' | 'diagnostico' | 'calculadora'

export interface PassoOnboardingInfo {
  id: PassoOnboardingId
  numero: number
  titulo: string
  subtitulo: string
  descricao: string
  tempoEstimado: string
  rota: string
  labelBotao: string
  concluido: boolean
  liberado: boolean
}
