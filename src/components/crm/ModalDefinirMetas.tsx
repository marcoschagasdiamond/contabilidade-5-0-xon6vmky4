import React, { useState, useEffect } from 'react'
import type { CrmMetaRecord, SalvarMetaInput } from '@/types/crmMetas'

interface ModalDefinirMetasProps {
  aberto: boolean
  aoFechar: () => void
  mesAno: string
  mesAnoRotulo: string
  metaAtual: CrmMetaRecord | null
  aoSalvar: (input: SalvarMetaInput) => Promise<void>
  isVisaoConsolidada?: boolean
}

export function ModalDefinirMetas({
  aberto,
  aoFechar,
  mesAno,
  mesAnoRotulo,
  metaAtual,
  aoSalvar,
  isVisaoConsolidada = false,
}: ModalDefinirMetasProps) {
  const [novosClientes, setNovosClientes] = useState<string>('0')
  const [receitaCarteira, setReceitaCarteira] = useState<string>('0')
  const [creditosRecuperados, setCreditosRecuperados] = useState<string>('0')
  const [diagnosticosConcluidos, setDiagnosticosConcluidos] = useState<string>('0')
  const [observacoes, setObservacoes] = useState<string>('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (metaAtual) {
      setNovosClientes(String(metaAtual.meta_novos_clientes || 0))
      setReceitaCarteira(String(metaAtual.meta_receita_carteira || 0))
      setCreditosRecuperados(String(metaAtual.meta_creditos_recuperados || 0))
      setDiagnosticosConcluidos(String(metaAtual.meta_diagnosticos_concluidos || 0))
      setObservacoes(metaAtual.observacoes || '')
    } else {
      setNovosClientes('5')
      setReceitaCarteira('15000')
      setCreditosRecuperados('50000')
      setDiagnosticosConcluidos('8')
      setObservacoes('')
    }
    setErro(null)
  }, [metaAtual, aberto])

  if (!aberto) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setSalvando(true)

    try {
      await aoSalvar({
        mes_ano: mesAno,
        meta_novos_clientes: parseFloat(novosClientes) || 0,
        meta_receita_carteira: parseFloat(receitaCarteira) || 0,
        meta_creditos_recuperados: parseFloat(creditosRecuperados) || 0,
        meta_diagnosticos_concluidos: parseFloat(diagnosticosConcluidos) || 0,
        observacoes: observacoes.trim(),
      })
      aoFechar()
    } catch (err: any) {
      console.error('Erro ao salvar meta mensal:', err)
      setErro(err?.message || 'Erro ao persistir as metas no backend.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#07132B] text-white w-full max-w-xl rounded-2xl border-2 border-[#D4AF37] shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
        {/* Fundo decorativo Diamond */}
        <div
          className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 space-y-2 pb-3 border-b border-white/10">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-mono">
              Fase 4 • Planejamento Comercial
            </span>
            <button
              type="button"
              onClick={aoFechar}
              disabled={salvando}
              className="text-slate-400 hover:text-white text-sm font-bold p-1 rounded-lg hover:bg-white/10"
              aria-label="Fechar modal"
            >
              ✕
            </button>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-white">
            Configurar Metas de {mesAnoRotulo}
          </h2>
          <p className="text-xs text-slate-300">
            {isVisaoConsolidada
              ? 'Defina a meta para o período. Como Master/Admin, você também pode refinar os alvos para sua carteira.'
              : 'Defina suas metas comerciais do mês. O progresso é apurado automaticamente sem digitação manual.'}
          </p>
        </div>

        {erro && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Meta: Novos Clientes (qtd)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={novosClientes}
                onChange={(e) => setNovosClientes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                placeholder="Ex: 5"
              />
              <span className="text-[10px] text-slate-400 block">
                Fichas cadastradas ou ativadas no mês
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Meta: Receita da Carteira (R$/mês)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                required
                value={receitaCarteira}
                onChange={(e) => setReceitaCarteira(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                placeholder="Ex: 15000"
              />
              <span className="text-[10px] text-slate-400 block">
                Soma dos honorários dos clientes ativos
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Meta: Créditos Recuperados (R$)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                required
                value={creditosRecuperados}
                onChange={(e) => setCreditosRecuperados(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                placeholder="Ex: 50000"
              />
              <span className="text-[10px] text-slate-400 block">
                Total apurado no Recuperador no período
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Meta: Diagnósticos Concluídos (qtd)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={diagnosticosConcluidos}
                onChange={(e) => setDiagnosticosConcluidos(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                placeholder="Ex: 8"
              />
              <span className="text-[10px] text-slate-400 block">
                Trilha 360° concluída no período
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Observações Estratégicas (Opcional)
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              placeholder="Ex: Foco em empresas do setor de serviços e recuperação de PIS/Cofins..."
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={aoFechar}
              disabled={salvando}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-6 py-2.5 rounded-xl text-xs font-heading font-black text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-lg transition-all"
            >
              {salvando ? 'Salvando...' : 'Salvar Metas Mensais'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
