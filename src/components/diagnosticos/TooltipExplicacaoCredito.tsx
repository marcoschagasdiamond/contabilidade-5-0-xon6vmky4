import React, { useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { ClassificacaoCreditoItem } from '@/services/fornecedores'

export interface DetalhesClassificacaoCredito {
  id: ClassificacaoCreditoItem
  titulo: string
  subtitulo: string
  resumoCurto: string
  explicacao: string
  destaqueDecisao?: string
}

export const EXPLICACOES_CLASSIFICACAO_CREDITO: Record<
  ClassificacaoCreditoItem,
  DetalhesClassificacaoCredito
> = {
  integral: {
    id: 'integral',
    titulo: 'Gera Crédito Integral',
    subtitulo: '100% da base tributável',
    resumoCurto: 'Crédito pleno de IBS/CBS',
    explicacao:
      'Permite creditar 100% do IBS/CBS destacado na aquisição de insumos, matérias-primas e revenda. O regime do fornecedor define o custo líquido final.',
    destaqueDecisao:
      'Fornecedores no Lucro Real transferem crédito integral; no Simples, o crédito é reduzido.',
  },
  parcial: {
    id: 'parcial',
    titulo: 'Crédito Parcial',
    subtitulo: '% informado da base',
    resumoCurto: 'Fração do crédito aproveitada',
    explicacao:
      'Aproveita apenas o percentual informado na aquisição; a parcela não creditável vira custo. Ideal para bens de uso misto ou regras setoriais.',
    destaqueDecisao: 'O saldo não creditado compõe o custo de aquisição da sua empresa.',
  },
  nao_gera: {
    id: 'nao_gera',
    titulo: 'Não Gera Crédito',
    subtitulo: 'Item sem direito a crédito',
    resumoCurto: 'Item vedado ou neutro',
    explicacao:
      'Item sem apropriação de crédito por vedação legal, isenção ou consumo final. A escolha do fornecedor recai exclusivamente sobre o preço nominal.',
    destaqueDecisao: 'Comparação puramente comercial, sem efeito tributário na entrada.',
  },
}

interface TooltipExplicacaoCreditoProps {
  tipo: ClassificacaoCreditoItem
  className?: string
  /**
   * Permite renderizar em modo botão ou apenas o gatilho discreto (?)
   */
  variante?: 'gatilho_discreto' | 'texto_sublinhado'
}

/**
 * Tooltip no padrão Diamond Group para explicar as regras de classificação de crédito
 * do insumo/fornecedor (Gera Crédito Integral, Crédito Parcial, Não Gera Crédito).
 *
 * Em conformidade com o padrão "sem ícones" do projeto, usa um indicador textual discreto (?)
 * ou texto com sublinhado pontilhado. Suporta hover em desktop e toque no mobile.
 */
export function TooltipExplicacaoCredito({
  tipo,
  className = '',
  variante = 'gatilho_discreto',
}: TooltipExplicacaoCreditoProps) {
  const [aberto, setAberto] = useState(false)
  const info = EXPLICACOES_CLASSIFICACAO_CREDITO[tipo]

  if (!info) return null

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip open={aberto} onOpenChange={setAberto}>
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
            className={
              variante === 'gatilho_discreto'
                ? `inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-mono font-bold text-slate-500 bg-slate-100 hover:bg-[#07132B] hover:text-[#D4AF37] border border-slate-300 transition-colors cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-[#07132B] ${className}`
                : `inline-flex items-baseline text-xs font-semibold text-slate-600 underline decoration-dotted decoration-slate-400 underline-offset-2 hover:text-[#07132B] hover:decoration-[#07132B] transition-colors cursor-pointer focus:outline-none ${className}`
            }
            aria-label={`Entenda o que significa: ${info.titulo}`}
            title={`Clique ou passe o mouse para entender: ${info.titulo}`}
          >
            {variante === 'gatilho_discreto' ? '?' : info.titulo}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          sideOffset={6}
          onPointerDownOutside={() => setAberto(false)}
          className="z-50 max-w-[280px] sm:max-w-xs p-3.5 bg-[#07132B] text-slate-200 border border-[#D4AF37]/50 shadow-xl rounded-xl animate-in fade-in-0 zoom-in-95 text-left"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-1.5">
              <span className="text-[11px] font-mono font-extrabold uppercase tracking-wide text-[#D4AF37]">
                {info.titulo}
              </span>
              <span className="text-[10px] font-mono text-slate-400">{info.subtitulo}</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">{info.explicacao}</p>
            {info.destaqueDecisao && (
              <p className="text-[11px] font-bold text-emerald-400 pt-1 border-t border-slate-800 leading-snug">
                {info.destaqueDecisao}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
