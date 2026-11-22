import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import type { Cliente } from '@/types/cliente'
import {
  iniciaisTecnico,
  rotuloTecnico,
  TIPO_TODOS,
  type ModoVisualizacao,
  type TipoTecnico,
} from '@/hooks/useAgrupamentoCarteira'

interface AgrupamentoPorTecnicoProps {
  modo: ModoVisualizacao
  tipoTecnico: TipoTecnico
  tecnicos: Record<string, string>
  clientesFiltrados: Cliente[]
  renderCard: (cliente: Cliente) => React.ReactNode
}

interface BlocoTecnico {
  id: string
  nome: string
  clientes: Cliente[]
}

export function AgrupamentoPorTecnico({
  modo,
  tipoTecnico,
  tecnicos,
  clientesFiltrados,
  renderCard,
}: AgrupamentoPorTecnicoProps) {
  const blocos = useMemo<BlocoTecnico[]>(() => {
    if (tipoTecnico !== TIPO_TODOS) {
      const doTecnico = clientesFiltrados.filter((c) => c.user_id === tipoTecnico)
      if (doTecnico.length === 0) return []
      return [
        {
          id: tipoTecnico,
          nome: rotuloTecnico(tipoTecnico, tecnicos[tipoTecnico]),
          clientes: doTecnico,
        },
      ]
    }

    const mapa = new Map<string, Cliente[]>()
    for (const c of clientesFiltrados) {
      const id = c.user_id ?? TIPO_TODOS
      const atual = mapa.get(id) ?? []
      atual.push(c)
      mapa.set(id, atual)
    }
    return Array.from(mapa.entries())
      .map(([id, lista]) => ({
        id,
        nome: rotuloTecnico(id, tecnicos[id]),
        clientes: lista,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [clientesFiltrados, tecnicos, tipoTecnico])

  if (modo === 'todos') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {clientesFiltrados.map((cliente) => renderCard(cliente))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {blocos.map((bloco) => (
        <section key={bloco.id} aria-label={`Clientes de ${bloco.nome}`} className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <span
              aria-hidden="true"
              className="w-9 h-9 rounded-full bg-[#07132B] text-[#D4AF37] flex items-center justify-center text-xs font-bold shrink-0"
            >
              {iniciaisTecnico(bloco.id === TIPO_TODOS ? undefined : tecnicos[bloco.id])}
            </span>
            <h2 className="font-heading font-extrabold text-base text-[#07132B] leading-snug truncate">
              {bloco.id === TIPO_TODOS ? 'Sem técnico definido' : bloco.nome}
            </h2>
            <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 text-[10px] font-bold px-2 py-0.5 shrink-0 border border-slate-200">
              {bloco.clientes.length} {bloco.clientes.length === 1 ? 'empresa' : 'empresas'}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {bloco.clientes.map((cliente) => renderCard(cliente))}
          </div>
        </section>
      ))}
    </div>
  )
}
