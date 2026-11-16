import { useState } from 'react'
import { ShieldAlert, Scale } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  VEDACOES_SIMPLES_ART17,
  BASE_LEGAL_VEDACOES_SIMPLES,
  type IdVedacaoSimples,
} from '@/lib/vedacoesSimples'

interface BlocoVedacoesSimplesProps {
  regimeAtual?: string
  vedacoesMarcadas: string[]
  vedacaoOutra: string
  onToggleVedacao: (id: IdVedacaoSimples, marcado: boolean) => void
  onChangeOutra: (texto: string) => void
}

/**
 * Bloco "Vedações legais ao Simples Nacional" em /dados-empresa.
 * Apenas orientativo (JSX puro): não altera campos nem cálculos.
 */
export function BlocoVedacoesSimples({
  regimeAtual,
  vedacoesMarcadas,
  vedacaoOutra,
  onToggleVedacao,
  onChangeOutra,
}: BlocoVedacoesSimplesProps) {
  const [aberto, setAberto] = useState(false)

  const isOptanteSimples = regimeAtual === 'Simples Nacional'
  const temAlguma = vedacoesMarcadas.length > 0 || vedacaoOutra.trim().length > 0

  return (
    <div className="pt-6 border-t-2 border-slate-200/80 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-slate-50 via-red-50/40 to-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <h4 className="text-sm font-heading font-bold uppercase tracking-wider text-[#07132B]">
              Vedações Legais ao Simples Nacional
            </h4>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Informe, se for o caso, alguma vedação legal à opção pelo Simples Nacional (art. 17 da
            LC 123/2006). Afeta apenas a análise de regimes — nenhum cálculo é alterado.
          </p>
        </div>
        <span
          className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full shrink-0 self-start sm:self-auto ${
            temAlguma ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'
          }`}
        >
          {temAlguma
            ? `${vedacoesMarcadas.length + (vedacaoOutra.trim() ? 1 : 0)} VEDAÇÃO(ÕES)`
            : 'NENHUMA'}
        </span>
      </div>

      {/* Pergunta principal */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <p className="text-sm font-bold text-[#07132B]">
          Existe alguma vedação legal à opção pelo Simples Nacional?
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {VEDACOES_SIMPLES_ART17.map((item) => {
            const checked = vedacoesMarcadas.includes(item.id)
            return (
              <div
                key={item.id}
                className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                  checked ? 'border-red-300 bg-red-50/60' : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <Checkbox
                  id={`vedacao-${item.id}`}
                  checked={checked}
                  onCheckedChange={(v) => onToggleVedacao(item.id, v === true)}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <Label
                    htmlFor={`vedacao-${item.id}`}
                    className="text-xs font-bold text-[#07132B] leading-snug cursor-pointer"
                  >
                    {item.inciso} — {item.rotulo}
                  </Label>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{item.descricao}</p>
                </div>
              </div>
            )
          })}

          {/* Campo livre "Outra (descrever)" */}
          <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <Checkbox
              id="vedacao-outra"
              checked={vedacaoOutra.trim().length > 0}
              onCheckedChange={(v) => onChangeOutra(v === true ? ' ' : '')}
              className="mt-0.5"
            />
            <div className="flex-1 space-y-2">
              <Label
                htmlFor="vedacao-outra"
                className="text-xs font-bold text-[#07132B] leading-snug cursor-pointer"
              >
                Outra (descrever)
              </Label>
              <Input
                id="vedacao-outra-texto"
                placeholder="Descreva a vedação (opcional, caso não esteja na lista)"
                value={vedacaoOutra}
                onChange={(e) => onChangeOutra(e.target.value)}
                className="text-xs bg-white"
              />
            </div>
          </div>
        </div>

        {/* Base legal no rodapé do bloco */}
        <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
          <Scale className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
          {BASE_LEGAL_VEDACOES_SIMPLES}
        </p>
      </div>

      {/* Alerta orientativo quando optante do Simples marca vedação */}
      {isOptanteSimples && temAlguma && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-slate-700">
            <strong className="text-amber-800">Atenção:</strong> a empresa é optante do Simples
            Nacional, mas há vedação legal do art. 17 marcada. Se a vedação se confirmar, a opção
            torna-se <strong>indevida desde o início</strong> (exclusão de ofício). Avalie com o
            especialista a regularização ou o desenquadramento.
          </div>
        </div>
      )}
    </div>
  )
}
