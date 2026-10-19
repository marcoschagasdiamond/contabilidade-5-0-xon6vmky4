import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export const LIMITE_SIMULACOES_GRATUITO = 3
export const LIMITE_DIAGNOSTICOS_GRATUITO = 1

export const WHATSAPP_UPGRADE_NUMERO = '551140028922'
export const EMAIL_CONTATO = 'contato@contabilidade5.com.br'

export interface UsuarioFreemium {
  id: string
  name: string
  email: string
  role?: string
  plano?: 'gratuito' | 'premium' | string
  is_premium?: boolean
  simulacoes_usadas?: number
  diagnosticos_usados?: number
  created?: string
  updated?: string
}

/**
 * Gera URL do WhatsApp com mensagem personalizada para solicitação de upgrade para Premium.
 * NOTA: Sem inventar preço — direciona para conversa com consultor.
 */
export function getWhatsAppUpgradeUrl(
  motivo: 'simulacao' | 'diagnostico' | 'pdf' | 'geral' = 'geral',
  usuarioNome?: string,
): string {
  let texto = 'Olá! Gostaria de fazer o upgrade para o Plano Premium da Contabilidade 5.0.'
  if (motivo === 'simulacao') {
    texto =
      'Olá! Atingi o limite de 3 simulações gratuitas na Calculadora IBS/CBS da Contabilidade 5.0 e gostaria de fazer o upgrade para o Plano Premium (simulações ilimitadas).'
  } else if (motivo === 'diagnostico') {
    texto =
      'Olá! Concluí meu diagnóstico tributário gratuito na Contabilidade 5.0 e gostaria de fazer o upgrade para o Plano Premium para ter diagnósticos ilimitados.'
  } else if (motivo === 'pdf') {
    texto =
      'Olá! Gostaria de liberar o download e impressão de relatórios em PDF no Diagnóstico da Contabilidade 5.0 através do Plano Premium.'
  }

  if (usuarioNome) {
    texto += ` Meu nome é ${usuarioNome}.`
  }

  return `https://wa.me/${WHATSAPP_UPGRADE_NUMERO}?text=${encodeURIComponent(texto)}`
}

/**
 * Gera link de email com assunto e corpo configurados para solicitação de upgrade.
 */
export function getEmailUpgradeUrl(
  motivo: 'simulacao' | 'diagnostico' | 'pdf' | 'geral' = 'geral',
  usuarioEmail?: string,
): string {
  const subject = encodeURIComponent('Solicitação de Upgrade — Plano Premium Contabilidade 5.0')
  const body = encodeURIComponent(
    `Olá equipe Contabilidade 5.0,\n\nGostaria de solicitar a ativação do Plano Premium para minha conta (${usuarioEmail || 'informar email'}).\n\nMotivo do contato: ${
      motivo === 'simulacao'
        ? 'Limite de simulações atingido'
        : motivo === 'diagnostico'
          ? 'Limite de diagnósticos atingido'
          : motivo === 'pdf'
            ? 'Liberação de relatórios PDF/Impressão'
            : 'Upgrade geral'
    }.\n\nAguardo orientações para liberação.`,
  )
  return `mailto:${EMAIL_CONTATO}?subject=${subject}&body=${body}`
}

/**
 * Incrementa o contador de simulações usadas no usuário autenticado.
 * Também mantém espelho no localStorage para caso anônimo/offline.
 */
export async function registrarSimulacaoUsada(userId?: string): Promise<{
  simulacoesUsadas: number
  restantes: number
  atingiuLimite: boolean
}> {
  const currentLocal = parseInt(localStorage.getItem('c50_simulacoes_usadas') || '0', 10) + 1
  localStorage.setItem('c50_simulacoes_usadas', currentLocal.toString())

  if (!userId) {
    return {
      simulacoesUsadas: currentLocal,
      restantes: Math.max(0, LIMITE_SIMULACOES_GRATUITO - currentLocal),
      atingiuLimite: currentLocal >= LIMITE_SIMULACOES_GRATUITO,
    }
  }

  try {
    const userRec = await pb.collection('users').getOne(userId)
    const atual = (userRec.simulacoes_usadas as number) || 0
    const novoValor = atual + 1

    await pb.collection('users').update(userId, {
      simulacoes_usadas: novoValor,
    })

    // Atualiza authStore se for o usuário atual
    if (pb.authStore.record?.id === userId) {
      pb.authStore.save(pb.authStore.token, {
        ...pb.authStore.record,
        simulacoes_usadas: novoValor,
      })
    }

    const isPremium =
      userRec.is_premium === true || userRec.plano === 'premium' || userRec.role === 'admin'
    return {
      simulacoesUsadas: novoValor,
      restantes: isPremium ? 999 : Math.max(0, LIMITE_SIMULACOES_GRATUITO - novoValor),
      atingiuLimite: !isPremium && novoValor >= LIMITE_SIMULACOES_GRATUITO,
    }
  } catch (err) {
    console.warn('Erro ao atualizar simulacoes_usadas no backend:', err)
    return {
      simulacoesUsadas: currentLocal,
      restantes: Math.max(0, LIMITE_SIMULACOES_GRATUITO - currentLocal),
      atingiuLimite: currentLocal >= LIMITE_SIMULACOES_GRATUITO,
    }
  }
}

/**
 * Incrementa o contador de diagnósticos usados no usuário autenticado.
 */
export async function registrarDiagnosticoUsado(userId?: string): Promise<{
  diagnosticosUsados: number
  restantes: number
  atingiuLimite: boolean
}> {
  const currentLocal = parseInt(localStorage.getItem('c50_diagnosticos_usados') || '0', 10) + 1
  localStorage.setItem('c50_diagnosticos_usados', currentLocal.toString())

  if (!userId) {
    return {
      diagnosticosUsados: currentLocal,
      restantes: Math.max(0, LIMITE_DIAGNOSTICOS_GRATUITO - currentLocal),
      atingiuLimite: currentLocal >= LIMITE_DIAGNOSTICOS_GRATUITO,
    }
  }

  try {
    const userRec = await pb.collection('users').getOne(userId)
    const atual = (userRec.diagnosticos_usados as number) || 0
    const novoValor = atual + 1

    await pb.collection('users').update(userId, {
      diagnosticos_usados: novoValor,
    })

    if (pb.authStore.record?.id === userId) {
      pb.authStore.save(pb.authStore.token, {
        ...pb.authStore.record,
        diagnosticos_usados: novoValor,
      })
    }

    const isPremium =
      userRec.is_premium === true || userRec.plano === 'premium' || userRec.role === 'admin'
    return {
      diagnosticosUsados: novoValor,
      restantes: isPremium ? 999 : Math.max(0, LIMITE_DIAGNOSTICOS_GRATUITO - novoValor),
      atingiuLimite: !isPremium && novoValor >= LIMITE_DIAGNOSTICOS_GRATUITO,
    }
  } catch (err) {
    console.warn('Erro ao atualizar diagnosticos_usados no backend:', err)
    return {
      diagnosticosUsados: currentLocal,
      restantes: Math.max(0, LIMITE_DIAGNOSTICOS_GRATUITO - currentLocal),
      atingiuLimite: currentLocal >= LIMITE_DIAGNOSTICOS_GRATUITO,
    }
  }
}

/**
 * Lista todos os usuários cadastrados para gestão no painel Admin.
 */
export async function getTodosUsuarios(): Promise<UsuarioFreemium[]> {
  const records = await pb.collection('users').getFullList<RecordModel>({
    sort: '-created',
  })

  return records.map((r) => ({
    id: r.id,
    name: r.name || 'Sem nome',
    email: r.email,
    role: r.role || 'user',
    plano: (r.plano as any) || (r.is_premium ? 'premium' : 'gratuito'),
    is_premium: r.is_premium === true || r.plano === 'premium' || r.role === 'admin',
    simulacoes_usadas: (r.simulacoes_usadas as number) || 0,
    diagnosticos_usados: (r.diagnosticos_usados as number) || 0,
    created: r.created,
    updated: r.updated,
  }))
}

/**
 * Atualiza o status do plano de um usuário pelo Admin (marcar/desmarcar premium manualmente).
 */
export async function atualizarPlanoUsuario(
  userId: string,
  novoPlano: 'gratuito' | 'premium',
): Promise<boolean> {
  try {
    await pb.collection('users').update(userId, {
      plano: novoPlano,
      is_premium: novoPlano === 'premium',
    })
    return true
  } catch (err) {
    console.error('Erro ao atualizar plano do usuário:', err)
    throw err
  }
}

/**
 * Reseta os contadores de uso de um usuário (opcional para o admin se desejar conceder novo ciclo).
 */
export async function resetarContadoresUsuario(userId: string): Promise<boolean> {
  try {
    await pb.collection('users').update(userId, {
      simulacoes_usadas: 0,
      diagnosticos_usados: 0,
    })
    return true
  } catch (err) {
    console.error('Erro ao resetar contadores do usuário:', err)
    throw err
  }
}
