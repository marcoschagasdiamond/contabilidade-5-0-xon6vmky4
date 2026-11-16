import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import {
  getProgressoOnboarding,
  salvarProgressoOnboarding,
  verificarHistoricoExistenteUsuario,
  type OnboardingRecord,
} from '@/services/onboarding'
import type { PassoOnboardingInfo, PassoOnboardingId } from '@/types/onboarding'

export interface UseOnboardingReturn {
  carregando: boolean
  // Passo 1: Dados da Empresa
  passoEmpresaConcluido: boolean
  // Passo 2: Primeiro Diagnóstico (trilha 360° etapa 01)
  passoDiagnosticoConcluido: boolean
  // Passo 3: Primeira Simulação Calculadora IBS/CBS
  passoCalculadoraConcluido: boolean
  // Totais
  totalConcluidos: number
  totalPassos: number
  percentualConcluido: number
  todosPassosConcluidos: boolean
  // Controle do Wizard (modal guiado inicial)
  exibirWizard: boolean
  dispensarWizard: () => Promise<void>
  abrirWizard: () => void
  fecharModalWizardTemporariamente: () => void
  modalWizardAberto: boolean
  // Controle do Checklist "Comece por aqui"
  checklistRecolhido: boolean
  alternarChecklistRecolhido: () => Promise<void>
  exibirChecklist: boolean
  // Ações de marcação
  marcarPassoConcluido: (passo: PassoOnboardingId, concluido?: boolean) => Promise<void>
  recarregar: () => Promise<void>
  // Lista com metadados para renderização
  passos: PassoOnboardingInfo[]
  // Detecção de usuário pré-existente
  usuarioExistente: boolean
  // Registro bruto de progresso (onboarding_progresso) — permite checar
  // concluido_em / wizard_dispensado sem duplicar consultas (ex.: banner da home)
  progresso: OnboardingRecord | null
}

export function useOnboarding(): UseOnboardingReturn {
  const { user, isAuthenticated, isEmpresario } = useAuth()
  const { temDadosSalvos, salvoNoBanco, dadosEmpresa } = useDadosEmpresa()

  const [registro, setRegistro] = useState<OnboardingRecord | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [usuarioExistente, setUsuarioExistente] = useState(false)
  const [modalWizardAberto, setModalWizardAberto] = useState(false)

  const userId = user?.id || ''
  const userEmail = user?.email || ''

  const carregarDados = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      setRegistro(null)
      setCarregando(false)
      setUsuarioExistente(false)
      setModalWizardAberto(false)
      return
    }

    setCarregando(true)
    try {
      // 1. Busca histórico do usuário (para verificar se é usuário antigo)
      const historico = await verificarHistoricoExistenteUsuario(userId, userEmail)
      const temDadosEmpresaLocal = Boolean(
        dadosEmpresa.nomeEmpresa?.trim() && dadosEmpresa.cnpj?.trim(),
      )
      const temQualquerHistorico =
        historico.temEmpresa ||
        historico.temDiagnostico ||
        historico.temSimulacao ||
        (temDadosSalvos && temDadosEmpresaLocal)

      // 2. Busca progresso salvo no backend
      let prog = await getProgressoOnboarding(userId)

      // Se não há registro de onboarding ainda, mas o usuário já tinha dados,
      // inicializamos no backend marcando os passos que já foram feitos
      if (!prog) {
        prog = await salvarProgressoOnboarding(userId, {
          passo_empresa_concluido: historico.temEmpresa || (temDadosSalvos && temDadosEmpresaLocal),
          passo_diagnostico_concluido: historico.temDiagnostico,
          passo_calculadora_concluido: historico.temSimulacao,
          // Usuários existentes que já têm dados prévios dispensam o wizard automaticamente
          wizard_dispensado: temQualquerHistorico,
          checklist_recolhido: false,
        })
      } else {
        // Se já existe registro, atualiza se novos dados forem detectados organicamente
        const updates: any = {}
        let precisaAtualizar = false

        if (
          !prog.passo_empresa_concluido &&
          (historico.temEmpresa || (temDadosSalvos && temDadosEmpresaLocal))
        ) {
          updates.passo_empresa_concluido = true
          precisaAtualizar = true
        }
        if (!prog.passo_diagnostico_concluido && historico.temDiagnostico) {
          updates.passo_diagnostico_concluido = true
          precisaAtualizar = true
        }
        if (!prog.passo_calculadora_concluido && historico.temSimulacao) {
          updates.passo_calculadora_concluido = true
          precisaAtualizar = true
        }

        if (precisaAtualizar) {
          prog = await salvarProgressoOnboarding(userId, updates)
        }
      }

      setRegistro(prog)
      setUsuarioExistente(temQualquerHistorico)

      // Determina se deve abrir o modal de wizard na primeira carga:
      // Apenas se:
      // - Perfil for Empresário (onboarding é voltado para Empresário/Cliente)
      // - Não for usuário pré-existente (sem histórico prévio)
      // - Não tiver dispensado o wizard ainda
      // - Ainda houver passos pendentes
      const wizardDispensado = prog?.wizard_dispensado ?? false
      const todosCompletos =
        Boolean(prog?.passo_empresa_concluido) &&
        Boolean(prog?.passo_diagnostico_concluido) &&
        Boolean(prog?.passo_calculadora_concluido)

      if (isEmpresario && !temQualquerHistorico && !wizardDispensado && !todosCompletos) {
        setModalWizardAberto(true)
      } else {
        setModalWizardAberto(false)
      }
    } catch (err) {
      console.warn('[useOnboarding] Erro ao sincronizar onboarding:', err)
    } finally {
      setCarregando(false)
    }
  }, [
    isAuthenticated,
    userId,
    userEmail,
    isEmpresario,
    temDadosSalvos,
    dadosEmpresa.nomeEmpresa,
    dadosEmpresa.cnpj,
  ])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Passo 1 concluído
  const passoEmpresaConcluido = useMemo(() => {
    if (registro?.passo_empresa_concluido) return true
    // Se no contexto já há razão social e cnpj válidos
    return Boolean(dadosEmpresa.nomeEmpresa?.trim() && dadosEmpresa.cnpj?.trim())
  }, [registro?.passo_empresa_concluido, dadosEmpresa.nomeEmpresa, dadosEmpresa.cnpj])

  // Passo 2 concluído
  const passoDiagnosticoConcluido = Boolean(registro?.passo_diagnostico_concluido)

  // Passo 3 concluído
  const passoCalculadoraConcluido = Boolean(registro?.passo_calculadora_concluido)

  const totalPassos = 3
  const totalConcluidos =
    (passoEmpresaConcluido ? 1 : 0) +
    (passoDiagnosticoConcluido ? 1 : 0) +
    (passoCalculadoraConcluido ? 1 : 0)

  const percentualConcluido = Math.round((totalConcluidos / totalPassos) * 100)
  const todosPassosConcluidos = totalConcluidos === totalPassos

  // Passos em formato padronizado com desbloqueio sequencial
  const passos: PassoOnboardingInfo[] = useMemo(() => {
    return [
      {
        id: 'empresa',
        numero: 1,
        titulo: 'Completar Dados da Empresa',
        subtitulo: 'CNPJ, regime tributário, faturamento e porte',
        descricao:
          'Cadastre os dados essenciais da sua empresa para calibrar os cálculos fiscais com precisão.',
        tempoEstimado: '~2 min',
        rota: '/dados-empresa?origem=onboarding',
        labelBotao: passoEmpresaConcluido ? 'Revisar Dados' : 'Completar Dados da Empresa',
        concluido: passoEmpresaConcluido,
        liberado: true, // Primeiro passo sempre liberado
      },
      {
        id: 'diagnostico',
        numero: 2,
        titulo: 'Fazer o Primeiro Diagnóstico',
        subtitulo: 'Entrar na trilha 360° pela etapa 01',
        descricao:
          'Inicie a Trilha 360° para mapear riscos tributários, avaliar o impacto da transição e comparar regimes.',
        tempoEstimado: '~3 min',
        rota: '/diagnostico-configuracoes?origem=onboarding',
        labelBotao: passoDiagnosticoConcluido ? 'Ver Diagnóstico' : 'Iniciar Diagnóstico 360°',
        concluido: passoDiagnosticoConcluido,
        // Liberado se o passo 1 estiver concluído (ou para navegação livre direta)
        liberado: passoEmpresaConcluido,
      },
      {
        id: 'calculadora',
        numero: 3,
        titulo: 'Rodar Simulação na Calculadora IBS/CBS',
        subtitulo: 'Projeção completa sob a LC 214/2025',
        descricao:
          'Simule a tributação do seu negócio no novo modelo tributário (2026–2033) e descubra a economia estimada.',
        tempoEstimado: '~2 min',
        rota: '/calculadora-ibs-cbs?origem=onboarding',
        labelBotao: passoCalculadoraConcluido ? 'Abrir Simulação' : 'Rodar Simulação IBS/CBS',
        concluido: passoCalculadoraConcluido,
        // Liberado se o passo 2 estiver concluído
        liberado: passoDiagnosticoConcluido,
      },
    ]
  }, [passoEmpresaConcluido, passoDiagnosticoConcluido, passoCalculadoraConcluido])

  // Ações de persistência
  const dispensarWizard = useCallback(async () => {
    setModalWizardAberto(false)
    if (!userId) return
    const atualizado = await salvarProgressoOnboarding(userId, { wizard_dispensado: true })
    if (atualizado) setRegistro(atualizado)
  }, [userId])

  const abrirWizard = useCallback(() => {
    setModalWizardAberto(true)
  }, [])

  const fecharModalWizardTemporariamente = useCallback(() => {
    setModalWizardAberto(false)
  }, [])

  const alternarChecklistRecolhido = useCallback(async () => {
    if (!userId) return
    const novoValor = !(registro?.checklist_recolhido ?? false)
    const atualizado = await salvarProgressoOnboarding(userId, { checklist_recolhido: novoValor })
    if (atualizado) setRegistro(atualizado)
  }, [userId, registro?.checklist_recolhido])

  const marcarPassoConcluido = useCallback(
    async (passo: PassoOnboardingId, concluido: boolean = true) => {
      if (!userId) return
      const updates: any = {}
      if (passo === 'empresa') updates.passo_empresa_concluido = concluido
      if (passo === 'diagnostico') updates.passo_diagnostico_concluido = concluido
      if (passo === 'calculadora') updates.passo_calculadora_concluido = concluido

      const atualizado = await salvarProgressoOnboarding(userId, updates)
      if (atualizado) setRegistro(atualizado)
    },
    [userId],
  )

  const checklistRecolhido = registro?.checklist_recolhido ?? false

  // Checklist visível se autenticado como Empresário/Cliente
  // (ou se for usuário novo com passos a fazer)
  const exibirChecklist = isAuthenticated && isEmpresario

  return {
    carregando,
    passoEmpresaConcluido,
    passoDiagnosticoConcluido,
    passoCalculadoraConcluido,
    totalConcluidos,
    totalPassos,
    percentualConcluido,
    todosPassosConcluidos,
    exibirWizard: modalWizardAberto,
    dispensarWizard,
    abrirWizard,
    fecharModalWizardTemporariamente,
    modalWizardAberto,
    checklistRecolhido,
    alternarChecklistRecolhido,
    exibirChecklist,
    marcarPassoConcluido,
    recarregar: carregarDados,
    passos,
    usuarioExistente,
    progresso: registro,
  }
}
