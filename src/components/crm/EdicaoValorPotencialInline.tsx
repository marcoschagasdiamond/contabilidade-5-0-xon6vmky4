import React, { useState, useRef, useEffect } from 'react'
import { formatarValorCompacto } from '@/lib/pipelineLeadUtils'
import { Check, X, Pencil, Loader2 } from 'lucide-react'

interface EdicaoValorPotencialProps {
  leadId: string
  valorAtual: number
  onSalvar: (leadId: string, novoValor: number) => Promise<void>
}

/**
 * Converte string digitada pelo usuário em número.
 * Aceita:
 * - "500000" -> 500000
 * - "500.000" -> 500000
 * - "500.000,00" -> 500000
 * - "R$ 1.500.000" -> 1500000
 * - "1.5m" ou "1,5 mi" -> 1500000
 * - "350k" ou "350 mil" -> 350000
 * - "0" ou "" -> 0
 */
export function parseValorDigitado(texto: string): number {
  const limpo = texto.trim()
  if (!limpo) return 0

  // Padrão com "mi" ou "milhão"
  const matchMi = limpo.match(/^R?\$?\s*(\d+[.,]?\d*)\s*(?:mi|milh[aãõ]o|milh[õo]es|m)$/i)
  if (matchMi && matchMi[1]) {
    const num = parseFloat(matchMi[1].replace(',', '.'))
    return isNaN(num) ? 0 : Math.round(num * 1_000_000)
  }

  // Padrão com "mil" ou "k"
  const matchMil = limpo.match(/^R?\$?\s*(\d+[.,]?\d*)\s*(?:mil|k)$/i)
  if (matchMil && matchMil[1]) {
    const num = parseFloat(matchMil[1].replace(',', '.'))
    return isNaN(num) ? 0 : Math.round(num * 1_000)
  }

  // Padrão moeda pt-BR: tira R$, espaços, pontos de milhar, e se tiver vírgula converte decimal
  let s = limpo.replace(/[R$\s]/gi, '')
  if (s.includes(',') && s.includes('.')) {
    // Ex: 1.500.000,00 -> remove pontos e troca vírgula
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (s.includes(',')) {
    // Ex: 150000,00 ou 1,5 -> se tiver 2 dígitos após vírgula é centavos
    const partes = s.split(',')
    if (partes[1]?.length === 2) {
      s = partes[0] + '.' + partes[1]
    } else {
      s = partes[0] + '.' + (partes[1] || '')
    }
  } else if (s.includes('.')) {
    // Ex: 150.000 (milhar) vs 1.5 (decimal)
    const partes = s.split('.')
    if (partes.length > 2 || (partes.length === 2 && partes[1].length === 3)) {
      // É separador de milhar: 150.000 ou 1.500.000
      s = s.replace(/\./g, '')
    }
  }

  const num = parseFloat(s)
  if (isNaN(num) || num < 0) return 0
  return Math.round(num)
}

export function EdicaoValorPotencialInline({
  leadId,
  valorAtual,
  onSalvar,
}: EdicaoValorPotencialProps) {
  const [editando, setEditando] = useState(false)
  const [valorTexto, setValorTexto] = useState('')
  const [salvando, setSalvando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editando) {
      // Pré-preenche o input com o valor puro ou formatado
      setValorTexto(valorAtual > 0 ? valorAtual.toString() : '')
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 30)
    }
  }, [editando, valorAtual])

  const handleIniciarEdicao = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    setEditando(true)
  }

  const handleCancelar = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditando(false)
    setValorTexto('')
  }

  const handleConfirmar = async (e?: React.MouseEvent | React.FormEvent) => {
    e?.stopPropagation()
    const novoValorNumerico = parseValorDigitado(valorTexto)

    // Se não mudou, apenas fecha sem requisição
    if (novoValorNumerico === valorAtual) {
      setEditando(false)
      return
    }

    setSalvando(true)
    try {
      await onSalvar(leadId, novoValorNumerico)
      setEditando(false)
    } catch {
      // O toast de erro é disparado pelo caller
    } finally {
      setSalvando(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      handleConfirmar()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      handleCancelar()
    }
  }

  if (editando) {
    return (
      <div
        className="flex items-center gap-1 w-full max-w-[170px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            placeholder="Ex: 350 mil"
            value={valorTexto}
            onChange={(e) => setValorTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              // Se não estiver clicando nos botões de ação e não estiver salvando
              if (!salvando) {
                handleConfirmar()
              }
            }}
            disabled={salvando}
            className="w-full h-6 px-1.5 py-0.5 text-xs font-bold text-slate-800 bg-white border border-[#D4AF37] rounded-md shadow-xs focus:outline-hidden focus:ring-1 focus:ring-[#D4AF37]"
          />
        </div>

        <button
          type="button"
          title="Salvar valor (Enter)"
          disabled={salvando}
          onMouseDown={(e) => e.preventDefault()} // evita perder foco antes do click
          onClick={handleConfirmar}
          className="h-6 w-6 flex items-center justify-center rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shrink-0"
        >
          {salvando ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          type="button"
          title="Cancelar (Esc)"
          disabled={salvando}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleCancelar}
          className="h-6 w-6 flex items-center justify-center rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  const temValor = valorAtual > 0

  return (
    <button
      type="button"
      onClick={handleIniciarEdicao}
      title="Clique para editar o valor potencial deste lead"
      className={`group/val inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-extrabold transition-all cursor-pointer select-none ${
        temValor
          ? 'text-slate-800 bg-slate-100 hover:bg-amber-50 border-slate-200/80 hover:border-[#D4AF37]'
          : 'text-slate-400 bg-slate-50 hover:bg-amber-50 border-dashed border-slate-300 hover:border-[#D4AF37] hover:text-amber-900'
      }`}
    >
      <span>{temValor ? formatarValorCompacto(valorAtual) : '—'}</span>
      <Pencil className="w-2.5 h-2.5 opacity-40 group-hover/val:opacity-100 text-slate-500 group-hover/val:text-[#D4AF37] transition-opacity" />
    </button>
  )
}
