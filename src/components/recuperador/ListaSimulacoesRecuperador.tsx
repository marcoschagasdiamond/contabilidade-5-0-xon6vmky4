import React from 'react'
import type { SimulacaoRecuperador } from '@/types/recuperadorCreditos'
import { formatarMoeda } from '@/lib/calculadoraUtils'
import { excluirSimulacaoRecuperador } from '@/services/simulacoesRecuperador'
import { useToast } from '@/hooks/use-toast'

interface Props {
  simulacoes: SimulacaoRecuperador[]
  onCarregarSimulacao: (simulacao: SimulacaoRecuperador) => void
  onSimulacaoAtualizada: () => void
}

export function ListaSimulacoesRecuperador({
  simulacoes,
  onCarregarSimulacao,
  onSimulacaoAtualizada,
}: Props) {
  const { toast } = useToast()

  const handleExcluir = async (e: React.MouseEvent, sim: SimulacaoRecuperador) => {
    e.stopPropagation()
    if (!confirm(`Deseja excluir a análise "${sim.nome}"?`)) return

    try {
      await excluirSimulacaoRecuperador(sim)
      toast({
        title: 'Análise excluída',
        description: 'O registro foi removido com sucesso.',
      })
      onSimulacaoAtualizada()
    } catch {
      toast({
        title: 'Erro ao excluir',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs font-bold text-[#07132B] uppercase tracking-wider">
          Análises Salvas ({simulacoes.length})
        </span>
      </div>

      {simulacoes.length === 0 ? (
        <div className="p-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
          Nenhuma análise salva ainda.
        </div>
      ) : (
        <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
          {simulacoes.map((sim) => (
            <div
              key={sim.id}
              onClick={() => onCarregarSimulacao(sim)}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-[#D4AF37] bg-white hover:bg-slate-50 cursor-pointer transition-all group"
            >
              <div className="flex items-start justify-between gap-1">
                <span className="text-xs font-bold text-[#07132B] group-hover:text-[#D4AF37] block truncate flex-1">
                  {sim.nome}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleExcluir(e, sim)}
                  className="text-[10px] text-slate-300 hover:text-red-500 font-bold px-1"
                  title="Excluir"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                <span className="font-mono text-emerald-600 font-bold">
                  {formatarMoeda(sim.total_recuperavel_integral)}
                </span>
                <span>{new Date(sim.created).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
