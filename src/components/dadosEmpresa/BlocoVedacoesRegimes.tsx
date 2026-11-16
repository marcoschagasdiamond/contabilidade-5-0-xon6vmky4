import { useState } from 'react'
import { ShieldAlert, Scale } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  VEDACOES_PRESUMIDO,
  BASE_LEGAL_VEDACOES_PRESUMIDO,
  type IdVedacaoPresumido,
} from '@/lib/vedacoesRegimes'
import { VEDACOES_MEI, BASE_LEGAL_VEDACOES_MEI, type IdVedacaoMei } from '@/lib/vedacoesRegimes'

interface BlocoVedacoesRegimesProps {
  regimeAtual?: string
  vedacoesPresumidoMarcadas: string[]
  vedacaoPresumidoOutra: string
  vedacoesMeiMarcadas: string[]
  vedacaoMeiOutra: string
  onToggleVedacaoPresumido: (id: IdVedacaoPresumido, marcado: boolean) => void
  onChangeVedacaoPresumidoOutra: (texto: string) => void
  onToggleVedacaoMei: (id: IdVedacaoMei, marcado: boolean) => void
  onChangeVedacaoMeiOutra: (texto: string) => void
}

/**
 * Bloco "Vedações legais por regime" em /dados-empresa, sensível ao Regime Tributário Atual.
 * Presumido/MEI têm blocos próprios com base legal no rodapé; o Simples tem o bloco dedicado
 * (BlocoVedacoesSimples). Apenas orientativo (JSX puro): não altera campos nem cálculos.
 */
export function BlocoVedacoesRegimes({
  regimeAtual,
  vedacoesPresumidoMarcadas,
  vedacaoPresumidoOutra,
  vedacoesMeiMarcadas,
  vedacaoMeiOutra,
  onToggleVedacaoPresumido,
  onChangeVedacaoPresumidoOutra,
  onToggleVedacaoMei,
  onChangeVedacaoMeiOutra,
}: BlocoVedacoesRegimesProps) {
  const [aberto, setAberto] = useState(false)

  const isPresumido = regimeAtual === 'Lucro Presumido'
  const isMei = regimeAtual === 'MEI'

  const temVedacaoPresumidoAlguma =
    vedacoesPresumidoMarcadas.length > 0 || vedacaoPresumidoOutra.trim().length > 0
  const temVedacaoMeiAlguma = vedacoesMeiMarcadas.length > 0 || vedacaoMeiOutra.trim().length > 0

  if (!isPresumido && !isMei) return null

  return (
    <div className="pt-6 border-t-2 border-slate-200/80 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-slate-50 via-red-50/40 to-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <h4 className="text-sm font-heading font-bold uppercase tracking-wider text-[#07132B]">
              Vedações Legais ao {isPresumido ? 'Lucro Presumido' : 'MEI'}
            </h4>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Informe, se for o caso, alguma vedação legal à opção pelo{' '}
            {isPresumido ? 'Lucro Presumido (Lei 9.718/98)' : 'MEI (Resolução CGSN 140/2018)'}.
            Afeta apenas a análise de regimes — nenhum cálculo é alterado.
          </p>
        </div>
        <span
          className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full shrink-0 self-start sm:self-auto ${
            isPresumido && temVedacaoPresumidoAlguma
              ? 'bg-red-600 text-white'
              : isMei && temVedacaoMeiAlguma
                ? 'bg-red-600 text-white'
                : 'bg-slate-200 text-slate-600'
          }`}
        >
          {isPresumido
            ? temVedacaoPresumidoAlguma
              ? `${vedacoesPresumidoMarcadas.length + (vedacaoPresumidoOutra.trim() ? 1 : 0)} VEDAÇÃO(ÕES)`
              : 'NENHUMA'
            : temVedacaoMeiAlguma
              ? `${vedacoesMeiMarcadas.length + (vedacaoMeiOutra.trim() ? 1 : 0)} VEDAÇÃO(ÕES)`
              : 'NENHUMA'}
        </span>
      </div>

      {/* BLOCO LUCRO PRESUMIDO */}
      {isPresumido && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <p className="text-sm font-bold text-[#07132B]">
            Existe alguma vedação legal à opção pelo Lucro Presumido?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {VEDACOES_PRESUMIDO.map((item) => {
              const checked = vedacoesPresumidoMarcadas.includes(item.id)
              return (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                    checked ? 'border-red-300 bg-red-50/60' : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <Checkbox
                    id={`vedacao-presumido-${item.id}`}
                    checked={checked}
                    onCheckedChange={(v) => onToggleVedacaoPresumido(item.id, v === true)}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor={`vedacao-presumido-${item.id}`}
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
                id="vedacao-presumido-outra"
                checked={vedacaoPresumidoOutra.trim().length > 0}
                onCheckedChange={(v) => onChangeVedacaoPresumidoOutra(v === true ? ' ' : '')}
                className="mt-0.5"
              />
              <div className="flex-1 space-y-2">
                <Label
                  htmlFor="vedacao-presumido-outra"
                  className="text-xs font-bold text-[#07132B] leading-snug cursor-pointer"
                >
                  Outra (descrever)
                </Label>
                <Input
                  id="vedacao-presumido-outra-texto"
                  placeholder="Descreva a vedação (opcional, caso não esteja na lista)"
                  value={vedacaoPresumidoOutra}
                  onChange={(e) => onChangeVedacaoPresumidoOutra(e.target.value)}
                  className="text-xs bg-white"
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
            <Scale className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
            {BASE_LEGAL_VEDACOES_PRESUMIDO}
          </p>
        </div>
      )}

      {/* BLOCO MEI */}
      {isMei && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <p className="text-sm font-bold text-[#07132B]">
            Existe alguma vedação legal à opção pelo MEI?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {VEDACOES_MEI.map((item) => {
              const checked = vedacoesMeiMarcadas.includes(item.id)
              return (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                    checked ? 'border-red-300 bg-red-50/60' : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <Checkbox
                    id={`vedacao-mei-${item.id}`}
                    checked={checked}
                    onCheckedChange={(v) => onToggleVedacaoMei(item.id, v === true)}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor={`vedacao-mei-${item.id}`}
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
                id="vedacao-mei-outra"
                checked={vedacaoMeiOutra.trim().length > 0}
                onCheckedChange={(v) => onChangeVedacaoMeiOutra(v === true ? ' ' : '')}
                className="mt-0.5"
              />
              <div className="flex-1 space-y-2">
                <Label
                  htmlFor="vedacao-mei-outra"
                  className="text-xs font-bold text-[#07132B] leading-snug cursor-pointer"
                >
                  Outra (descrever)
                </Label>
                <Input
                  id="vedacao-mei-outra-texto"
                  placeholder="Descreva a vedação (opcional, caso não esteja na lista)"
                  value={vedacaoMeiOutra}
                  onChange={(e) => onChangeVedacaoMeiOutra(e.target.value)}
                  className="text-xs bg-white"
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
            <Scale className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
            {BASE_LEGAL_VEDACOES_MEI}
          </p>
        </div>
      )}

      {/* Alertas orientativos quando o regime atual marca vedação própria */}
      {isPresumido && temVedacaoPresumidoAlguma && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-slate-700">
            <strong className="text-amber-800">Atenção:</strong> a empresa está no Lucro Presumido,
            mas há vedação legal marcada (Lei 9.718/98). Se a vedação se confirmar, a opção torna-se{' '}
            <strong>indevida desde o início</strong>. Avalie com o especialista a regularização ou a
            mudança de regime.
          </div>
        </div>
      )}

      {isMei && temVedacaoMeiAlguma && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-slate-700">
            <strong className="text-amber-800">Atenção:</strong> a empresa está no MEI, mas há
            vedação legal marcada (Resolução CGSN 140/2018, art. 3º). Se a vedação se confirmar, a
            condição de MEI torna-se <strong>indevida desde o início</strong> (exclusão de ofício).
            Avalie com o especialista a regularização ou o desenquadramento.
          </div>
        </div>
      )}
    </div>
  )
}
