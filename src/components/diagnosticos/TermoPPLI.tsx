import React, { useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export const TEXTO_RESUMO_PPLI =
  'Apólice offshore (1291 Group, Suíça) para alocação patrimonial internacional com diferimento tributário. Garante sucessão privativa sem ITCMD e total domínio sobre a carteira.'

interface TermoPPLIProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Componente que renderiza o termo PPLI com destaque no padrão Diamond Group
 * (negrito, tom verde #2ECC71) e tooltip explicativo aprovado (1291 Group, Suíça),
 * com suporte a hover em desktop e tap/clique em mobile, sem ícones.
 */
export function TermoPPLI({ children = 'PPLI', className = '' }: TermoPPLIProps) {
  const [aberto, setAberto] = useState(false)

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip
        open={aberto}
        onOpenChange={(next) => {
          setAberto(next)
        }}
      >
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setAberto((prev) => !prev)
            }}
            onTouchEnd={(e) => {
              e.stopPropagation()
              setAberto((prev) => !prev)
            }}
            onMouseEnter={() => setAberto(true)}
            onMouseLeave={() => setAberto(false)}
            className={`inline-flex items-baseline font-extrabold text-[#2ECC71] underline decoration-[#2ECC71]/60 underline-offset-2 hover:decoration-[#2ECC71] hover:text-[#27AE60] transition-colors cursor-pointer select-text focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ECC71] rounded-sm px-0.5 ${className}`}
            aria-label="Saiba mais sobre seguros PPLI"
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          sideOffset={6}
          onPointerDownOutside={(e) => {
            e.preventDefault()
            setAberto(false)
          }}
          className="z-50 max-w-[92vw] sm:max-w-lg p-4 sm:p-5 bg-[#0A1A13] text-slate-200 border-2 border-[#145A32] shadow-[0_12px_36px_rgba(10,26,19,0.85)] rounded-2xl animate-in fade-in-0 zoom-in-95 text-left"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 border-b border-[#145A32]/80 pb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#2ECC71]">
                Estruturação Internacional • Diamond Investments
              </span>
              <span className="text-[10px] font-bold text-slate-400 bg-[#0E3520] px-2 py-0.5 rounded-full border border-[#145A32]">
                1291 Group • Suíça
              </span>
            </div>

            <p className="text-xs sm:text-[13px] leading-relaxed text-slate-200">
              <strong className="text-white font-bold">
                PPLI (Private Placement Life Insurance):
              </strong>{' '}
              apólice de seguro de vida offshore (1291 Group, Suíça) para gestão patrimonial
              internacional com diferimento fiscal sobre rendimentos.
            </p>

            <p className="text-xs sm:text-[13px] leading-relaxed text-slate-300">
              <strong className="text-emerald-300 font-semibold">Vantagens:</strong> sucessão
              privativa sem incidência de ITCMD, blindagem de ativos e total controle da carteira
              pelo titular.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Função utilitária para substituir dinamicamente todas as ocorrências de 'PPLI'
 * em um texto por nós React com o componente TermoPPLI integrado.
 */
export function formatarTextoComPPLI(texto: string): React.ReactNode {
  if (!texto || !texto.includes('PPLI')) {
    return texto
  }

  const partes = texto.split(/(PPLI)/g)
  return partes.map((parte, idx) => {
    if (parte === 'PPLI') {
      return <TermoPPLI key={idx} />
    }
    return parte
  })
}
