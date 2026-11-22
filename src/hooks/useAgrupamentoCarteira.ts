import { useEffect, useMemo, useState } from 'react'
import pb from '@/lib/pocketbase/client'

export type ModoVisualizacao = 'por_tecnico' | 'todos'
export type TipoTecnico = 'todos' | string

export const TIPO_TODOS = 'todos'
export const MODOS_ORDEM: { id: ModoVisualizacao; label: string }[] = [
  { id: 'por_tecnico', label: 'Por técnico' },
  { id: 'todos', label: 'Todos' },
]
export const TIPOS_TECNICOS: { id: 'todos'; label: string }[] = [
  { id: 'todos', label: 'Todos os técnicos' },
]

export function rotuloModo(id: ModoVisualizacao): string {
  return MODOS_ORDEM.find((m) => m.id === id)?.label ?? id
}

const FALLBACK_NOME = 'Técnico sem nome'

function iniciaisDe(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '??'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

export function iniciaisTecnico(nome: string | undefined): string {
  return iniciaisDe(nome ?? FALLBACK_NOME)
}

export function rotuloTecnico(id: string, nome: string | undefined): string {
  if (id === TIPO_TODOS) return 'Todos os técnicos'
  return nome && nome.trim().length > 0 ? nome : FALLBACK_NOME
}

/**
 * Estado do seletor de visualização da carteira:
 * - modo: 'por_tecnico' (padrão) | 'todos'
 * - tipoTecnico: filtro por dono do registro (user_id) — 'todos' = sem filtro
 * - tecnicos: mapa user_id -> nome resolvido na coleção de usuários (fallback: e-mail)
 */
export function useModoVisualizacaoCarteira(idsDonos: string[]) {
  const [modo, setModo] = useState<ModoVisualizacao>('por_tecnico')
  const [tipoTecnico, setTipoTecnico] = useState<TipoTecnico>(TIPO_TODOS)
  const [nomes, setNomes] = useState<Record<string, string>>({})

  const chaveIds = useMemo(() => {
    const unicos = Array.from(new Set(idsDonos.filter(Boolean))).sort()
    return unicos.join(',')
  }, [idsDonos])

  useEffect(() => {
    const ids = chaveIds ? chaveIds.split(',') : []
    if (ids.length === 0) {
      setNomes({})
      return
    }
    let cancelado = false
    void (async () => {
      const mapa: Record<string, string> = {}
      await Promise.all(
        ids.map(async (id) => {
          try {
            const u = await pb.collection('users').getOne(id, { fields: 'id,name,email' })
            mapa[id] = (u as { name?: string; email?: string }).name?.trim()
              ? (u as { name?: string }).name!.trim()
              : (u as { email?: string }).email || FALLBACK_NOME
          } catch {
            // registro inacessível ou inexistente — mantém fallback
          }
        }),
      )
      if (!cancelado) setNomes(mapa)
    })()
    return () => {
      cancelado = true
    }
  }, [chaveIds])

  const tecnicos: Record<string, string> = useMemo(() => {
    const out: Record<string, string> = {}
    for (const id of chaveIds ? chaveIds.split(',') : []) {
      out[id] = nomes[id] ?? FALLBACK_NOME
    }
    return out
  }, [chaveIds, nomes])

  return { modo, setModo, tipoTecnico, setTipoTecnico, tecnicos }
}
