import pb from '@/lib/pocketbase/client'
import { logPocketBaseError } from '@/lib/pocketbase/errors'
import type { RecordModel } from 'pocketbase'
import type { OnboardingProgressoModel } from '@/types/onboarding'

export type OnboardingRecord = OnboardingProgressoModel & RecordModel

const COLLECTION_NAME = 'onboarding_progresso'

/**
 * Busca o registro de onboarding do usuário informado
 */
export async function getProgressoOnboarding(userId: string): Promise<OnboardingRecord | null> {
  if (!userId) return null
  try {
    const list = await pb.collection(COLLECTION_NAME).getList<OnboardingRecord>(1, 1, {
      filter: `user_id = "${userId}"`,
    })
    return list.items[0] || null
  } catch (err) {
    console.warn('[OnboardingService] Erro ao carregar progresso do usuário:', err)
    return null
  }
}

/**
 * Cria ou atualiza o registro de progresso do onboarding no backend
 */
export async function salvarProgressoOnboarding(
  userId: string,
  dados: Partial<Omit<OnboardingProgressoModel, 'id' | 'user_id' | 'created' | 'updated'>>,
): Promise<OnboardingRecord | null> {
  if (!userId) return null

  try {
    const existente = await getProgressoOnboarding(userId)

    // Se todos os 3 passos ficarem marcados como true, define data de conclusão
    const empresaOk = dados.passo_empresa_concluido ?? existente?.passo_empresa_concluido ?? false
    const diagOk =
      dados.passo_diagnostico_concluido ?? existente?.passo_diagnostico_concluido ?? false
    const calcOk =
      dados.passo_calculadora_concluido ?? existente?.passo_calculadora_concluido ?? false
    const todosOk = empresaOk && diagOk && calcOk

    const wizardOk = dados.wizard_dispensado ?? existente?.wizard_dispensado ?? false
    // Conclusão do wizard: quando o wizard é finalizado (dispensado) OU todos os
    // passos clássicos ficam concluídos — o wizard de 4 passos marca apenas
    // wizard_dispensado + passo_empresa_concluido, e isso já é conclusão.
    const concluidoEm =
      todosOk || wizardOk ? existente?.concluido_em || new Date().toISOString() : null

    const payload: Record<string, any> = {
      ...dados,
      concluido_em: concluidoEm,
    }

    if (existente) {
      return await pb.collection(COLLECTION_NAME).update<OnboardingRecord>(existente.id, payload)
    }

    return await pb.collection(COLLECTION_NAME).create<OnboardingRecord>({
      user_id: userId,
      passo_empresa_concluido: false,
      passo_diagnostico_concluido: false,
      passo_calculadora_concluido: false,
      wizard_dispensado: false,
      checklist_recolhido: false,
      concluido_em: null,
      ...payload,
    })
  } catch (err) {
    logPocketBaseError('OnboardingService', err)
    console.warn('[OnboardingService] Erro ao salvar progresso do onboarding:', err)
    throw err
  }
}

/**
 * Verifica no banco se o usuário já possui histórico pré-existente
 * (empresa cadastrada, diagnóstico realizado ou simulação de calculadora).
 * Usuários existentes não devem ver o wizard inicial.
 */
export async function verificarHistoricoExistenteUsuario(
  userId: string,
  userEmail?: string,
): Promise<{
  temEmpresa: boolean
  temDiagnostico: boolean
  temSimulacao: boolean
}> {
  if (!userId) {
    return { temEmpresa: false, temDiagnostico: false, temSimulacao: false }
  }

  let temEmpresa = false
  let temDiagnostico = false
  let temSimulacao = false

  try {
    const empresas = await pb.collection('clientes_empresas').getList(1, 1, {
      filter: `user_id = "${userId}"`,
    })
    temEmpresa = empresas.totalItems > 0
  } catch (e) {
    console.warn('[OnboardingService] Verificação empresa:', e)
  }

  try {
    const filterDiag = userEmail
      ? `user_id = "${userId}" || email = "${userEmail.toLowerCase()}"`
      : `user_id = "${userId}"`
    const diags = await pb.collection('diagnosticos').getList(1, 1, {
      filter: filterDiag,
    })
    temDiagnostico = diags.totalItems > 0
  } catch (e) {
    console.warn('[OnboardingService] Verificação diagnóstico:', e)
  }

  try {
    const sims = await pb.collection('simulacoes_calculadora').getList(1, 1, {
      filter: `user_id = "${userId}"`,
    })
    temSimulacao = sims.totalItems > 0
  } catch (e) {
    console.warn('[OnboardingService] Verificação simulação:', e)
  }

  return { temEmpresa, temDiagnostico, temSimulacao }
}
