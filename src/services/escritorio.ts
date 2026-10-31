import pb from '@/lib/pocketbase/client'
import type { DadosEscritorioAdquirente } from '@/types/escritorio'
import { DADOS_ESCRITORIO_PADRAO } from '@/types/escritorio'

export const STORAGE_ESCRITORIO_KEY = 'contabilidade50_dados_escritorio_v1'
export const STORAGE_GATE_DISPENSADO_KEY = 'contabilidade50_gate_escritorio_dispensado'

/**
 * Lê do localStorage com fallback
 */
export function carregarDadosEscritorioLocal(): DadosEscritorioAdquirente {
  if (typeof window === 'undefined') return { ...DADOS_ESCRITORIO_PADRAO }
  try {
    const raw = localStorage.getItem(STORAGE_ESCRITORIO_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        escritorio_nome: parsed.escritorio_nome || '',
        escritorio_responsavel: parsed.escritorio_responsavel || '',
        escritorio_cnpj: parsed.escritorio_cnpj || '',
        escritorio_email: parsed.escritorio_email || '',
        escritorio_telefone: parsed.escritorio_telefone || '',
        escritorio_uf: parsed.escritorio_uf || 'SP',
        escritorio_cidade: parsed.escritorio_cidade || '',
        escritorio_cadastrado: !!parsed.escritorio_cadastrado,
      }
    }
  } catch {
    /* fallback */
  }
  return { ...DADOS_ESCRITORIO_PADRAO }
}

/**
 * Salva no localStorage
 */
export function salvarDadosEscritorioLocal(dados: DadosEscritorioAdquirente): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_ESCRITORIO_KEY, JSON.stringify(dados))
    window.dispatchEvent(
      new CustomEvent('contabilidade50_dados_escritorio_updated', { detail: dados }),
    )
  } catch {
    /* fallback */
  }
}

/**
 * Verifica se o Analista já preencheu os dados do escritório (ou no authStore ou no localStorage)
 */
export function analistaPossuiEscritorioPreenchido(): boolean {
  const user = pb.authStore.record as any
  if (user) {
    if (user.escritorio_cadastrado === true) return true
    if (user.escritorio_nome && String(user.escritorio_nome).trim().length > 0) return true
  }
  const local = carregarDadosEscritorioLocal()
  return !!(local.escritorio_cadastrado || local.escritorio_nome.trim().length > 0)
}

/**
 * Verifica se o Analista dispensou o gate nesta sessão
 */
export function gateEscritorioDispensado(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return sessionStorage.getItem(STORAGE_GATE_DISPENSADO_KEY) === 'true'
  } catch {
    return false
  }
}

/**
 * Marca que o Analista pulou/dispensou o gate para preencher depois
 */
export function dispensarGateEscritorio(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_GATE_DISPENSADO_KEY, 'true')
  } catch {
    /* fallback */
  }
}

/**
 * Obtém dados consolidados do escritório (prioriza perfil do usuário autenticado, com fallback para localStorage)
 */
export function obterDadosEscritorioAtivo(): DadosEscritorioAdquirente {
  const user = pb.authStore.record as any
  const local = carregarDadosEscritorioLocal()

  const nome = (user?.escritorio_nome || local.escritorio_nome || '').trim()
  const responsavel = (
    user?.escritorio_responsavel ||
    local.escritorio_responsavel ||
    user?.name ||
    ''
  ).trim()
  const cnpj = (user?.escritorio_cnpj || local.escritorio_cnpj || '').trim()
  const email = (user?.escritorio_email || local.escritorio_email || user?.email || '').trim()
  const telefone = (user?.escritorio_telefone || local.escritorio_telefone || '').trim()
  const uf = (user?.escritorio_uf || local.escritorio_uf || 'SP').trim()
  const cidade = (user?.escritorio_cidade || local.escritorio_cidade || '').trim()
  const cadastrado = !!(user?.escritorio_cadastrado || local.escritorio_cadastrado || nome)

  return {
    escritorio_nome: nome,
    escritorio_responsavel: responsavel,
    escritorio_cnpj: cnpj,
    escritorio_email: email,
    escritorio_telefone: telefone,
    escritorio_uf: uf,
    escritorio_cidade: cidade,
    escritorio_cadastrado: cadastrado,
  }
}

/**
 * Salva no perfil do usuário no PocketBase e espelha no localStorage
 */
export async function salvarDadosEscritorioUsuario(
  dados: DadosEscritorioAdquirente,
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      escritorio_nome: dados.escritorio_nome.trim(),
      escritorio_responsavel: dados.escritorio_responsavel.trim(),
      escritorio_cnpj: dados.escritorio_cnpj.trim(),
      escritorio_email: dados.escritorio_email.trim().toLowerCase(),
      escritorio_telefone: dados.escritorio_telefone.trim(),
      escritorio_uf: dados.escritorio_uf.trim().toUpperCase() || 'SP',
      escritorio_cidade: dados.escritorio_cidade.trim(),
      escritorio_cadastrado: true,
    }

    // Salva localmente de imediato
    salvarDadosEscritorioLocal(payload)

    // Se houver usuário autenticado no PocketBase, atualiza o perfil
    const userId = pb.authStore.record?.id
    if (userId) {
      const updated = await pb.collection('users').update(userId, payload)
      pb.authStore.save(pb.authStore.token, updated)
    }

    return { success: true }
  } catch (err: any) {
    console.error('Erro ao salvar dados do escritório no perfil do usuário:', err)
    return {
      success: false,
      error: err?.message || 'Falha ao salvar dados do escritório.',
    }
  }
}
