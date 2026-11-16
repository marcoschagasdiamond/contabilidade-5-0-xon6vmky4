import { ShieldAlert } from 'lucide-react'
import { VEDACOES_SIMPLES_ART17, BASE_LEGAL_VEDACOES_SIMPLES } from '@/lib/vedacoesSimples'

interface QuadroVedacoesSimplesRegimesProps {
  vedacoesSimplesArt17?: string[]
  vedacaoSimplesArt17Outra?: string
}

/**
 * Quadro de "Vedações legais ao Simples Nacional (art. 17, LC 123/2006)" na seção de
 * regimes do Relatório Consolidado. Apenas orientativo (JSX puro): não altera cálculos.
 */
export function QuadroVedacoesSimplesRegimes({
  vedacoesSimplesArt17 = [],
  vedacaoSimplesArt17Outra = '',
}: QuadroVedacoesSimplesRegimesProps) {
  const incisosComRotulo = VEDACOES_SIMPLES_ART17.filter((item) =>
    vedacoesSimplesArt17.includes(item.id),
  ).map((item) => `${item.inciso} — ${item.rotulo}`)
  const outraTexto = vedacaoSimplesArt17Outra.trim()
  const nenhumaVedacao = incisosComRotulo.length === 0 && !outraTexto

  return (
    <div
      className={`p-4 rounded-xl border text-xs space-y-2 ${
        nenhumaVedacao ? 'bg-slate-50 border-slate-200' : 'bg-red-50/70 border-red-300'
      }`}
    >
      <div className="flex items-center gap-2">
        <ShieldAlert
          className={`w-4 h-4 shrink-0 ${nenhumaVedacao ? 'text-slate-400' : 'text-red-600'}`}
        />
        <strong
          className={`uppercase tracking-wide text-[11px] ${
            nenhumaVedacao ? 'text-slate-500' : 'text-red-900'
          }`}
        >
          Vedações legais ao Simples Nacional (art. 17, LC 123/2006)
        </strong>
      </div>

      {nenhumaVedacao ? (
        <p className="text-slate-600">Nenhuma vedação registrada.</p>
      ) : (
        <ul className="space-y-1">
          {incisosComRotulo.map((texto) => (
            <li key={texto} className="text-red-900 flex items-start gap-1.5">
              <span className="font-bold shrink-0">•</span>
              <span>{texto}</span>
            </li>
          ))}
          {outraTexto && (
            <li className="text-red-900 flex items-start gap-1.5">
              <span className="font-bold shrink-0">•</span>
              <span>Outra (registro livre): {outraTexto}</span>
            </li>
          )}
        </ul>
      )}

      <p className="text-[11px] text-slate-500 leading-relaxed">{BASE_LEGAL_VEDACOES_SIMPLES}</p>
    </div>
  )
}
