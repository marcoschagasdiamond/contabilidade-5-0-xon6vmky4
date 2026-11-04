import React from 'react'

export interface BotaoRetornarDadosIniciaisProps {
  /** Se o botão/aviso deve ser exibido (padrão true se omitido) */
  visivel?: boolean
  /** Callback para restaurar os dados */
  onRestaurar?: () => void
  /** Alias aceito em chamadas que usam onClick */
  onClick?: () => void
  /** Rótulo do botão (padrão: "Retornar aos dados iniciais") */
  rotulo?: string
  /** Classes CSS extras para o botão */
  className?: string
  /** Nome do módulo para o texto do aviso (ex.: "Recuperador de Créditos") */
  textoModulo?: string
}

/**
 * Aviso + botão exibidos quando o usuário alterou manualmente dados que vêm
 * do cadastro do cliente (Dados da Empresa). O override vale SOMENTE para o
 * módulo atual; o botão restaura os dados do cadastro naquele módulo.
 *
 * Suporta tanto a assinatura:
 * `<BotaoRetornarDadosIniciais visivel={temDivergencia} onRestaurar={fn} />`
 * quanto:
 * `<BotaoRetornarDadosIniciais onClick={fn} rotulo="..." className="..." />`
 */
export function BotaoRetornarDadosIniciais({
  visivel = true,
  onRestaurar,
  onClick,
  rotulo = 'Retornar aos dados iniciais',
  className,
  textoModulo,
}: BotaoRetornarDadosIniciaisProps) {
  if (!visivel) return null

  const handleAcao = onRestaurar || onClick

  // Se className foi passado, renderiza apenas o botão estilizado (uso inline em headers/barras)
  if (className) {
    return (
      <button
        type="button"
        onClick={handleAcao}
        className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${className}`}
      >
        {rotulo}
      </button>
    )
  }

  // Renderização padrão: banner informativo completo com botão de ação
  return (
    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300/60 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
      <div className="flex items-start gap-2.5">
        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
        <span className="font-semibold text-amber-900 leading-snug">
          Dados alterados manualmente neste módulo{textoModulo ? ` (${textoModulo})` : ''}. Os
          demais módulos continuam com os dados do cadastro do cliente. Ao concluir a análise, os
          dados usados voltam aos do cadastro.
        </span>
      </div>
      <button
        type="button"
        onClick={handleAcao}
        className="px-3 py-1.5 rounded-lg bg-[#07132B] text-white text-xs font-bold border border-[#D4AF37]/50 hover:bg-[#0c224c] transition-colors shrink-0 shadow-sm cursor-pointer"
      >
        {rotulo}
      </button>
    </div>
  )
}

export default BotaoRetornarDadosIniciais
