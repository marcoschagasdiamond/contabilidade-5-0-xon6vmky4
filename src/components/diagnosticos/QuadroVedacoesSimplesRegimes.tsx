import { ShieldAlert } from 'lucide-react'
import { VEDACOES_SIMPLES_ART17, BASE_LEGAL_VEDACOES_SIMPLES } from '@/lib/vedacoesSimples'
import {
  VEDACOES_PRESUMIDO,
  BASE_LEGAL_VEDACOES_PRESUMIDO,
  VEDACOES_MEI,
  BASE_LEGAL_VEDACOES_MEI,
} from '@/lib/vedacoesRegimes'

interface QuadroVedacoesSimplesRegimesProps {
  vedacoesSimplesArt17?: string[]
  vedacaoSimplesArt17Outra?: string
  vedacoesPresumido?: string[]
  vedacaoPresumidoOutra?: string
  vedacoesMei?: string[]
  vedacaoMeiOutra?: string
}

interface LinhaRegime {
  regime: string
  itens: string[]
  outra: string
  baseLegal: string
}

/**
 * Quadro de "Vedações legais por regime" na seção de regimes do Relatório Consolidado.
 * Reflete a matriz completa (Simples, Presumido e MEI) marcada em Dados da Empresa.
 * Apenas orientativo (JSX puro): não altera cálculos.
 */
export function QuadroVedacoesSimplesRegimes({
  vedacoesSimplesArt17 = [],
  vedacaoSimplesArt17Outra = '',
  vedacoesPresumido = [],
  vedacaoPresumidoOutra = '',
  vedacoesMei = [],
  vedacaoMeiOutra = '',
}: QuadroVedacoesSimplesRegimesProps) {
  const linhas: LinhaRegime[] = [
    {
      regime: 'Simples Nacional (art. 17, LC 123/2006)',
      itens: VEDACOES_SIMPLES_ART17.filter((item) => vedacoesSimplesArt17.includes(item.id)).map(
        (item) => `${item.inciso} — ${item.rotulo}`,
      ),
      outra: vedacaoSimplesArt17Outra.trim(),
      baseLegal: BASE_LEGAL_VEDACOES_SIMPLES,
    },
    {
      regime: 'Lucro Presumido (Lei 9.718/98, c/ LC 214/2025)',
      itens: VEDACOES_PRESUMIDO.filter((item) => vedacoesPresumido.includes(item.id)).map(
        (item) => `${item.inciso} — ${item.rotulo}`,
      ),
      outra: vedacaoPresumidoOutra.trim(),
      baseLegal: BASE_LEGAL_VEDACOES_PRESUMIDO,
    },
    {
      regime: 'MEI (Resolução CGSN 140/2018)',
      itens: VEDACOES_MEI.filter((item) => vedacoesMei.includes(item.id)).map(
        (item) => `${item.inciso} — ${item.rotulo}`,
      ),
      outra: vedacaoMeiOutra.trim(),
      baseLegal: BASE_LEGAL_VEDACOES_MEI,
    },
  ]

  const nenhumaVedacaoGlobal = linhas.every((l) => l.itens.length === 0 && !l.outra)

  return (
    <div
      className={`p-4 rounded-xl border text-xs space-y-3 ${
        nenhumaVedacaoGlobal ? 'bg-slate-50 border-slate-200' : 'bg-red-50/70 border-red-300'
      }`}
    >
      <div className="flex items-center gap-2">
        <ShieldAlert
          className={`w-4 h-4 shrink-0 ${nenhumaVedacaoGlobal ? 'text-slate-400' : 'text-red-600'}`}
        />
        <strong
          className={`uppercase tracking-wide text-[11px] ${
            nenhumaVedacaoGlobal ? 'text-slate-500' : 'text-red-900'
          }`}
        >
          Vedações legais por regime — matriz de disponibilidade (Simples, Presumido e MEI)
        </strong>
      </div>

      {nenhumaVedacaoGlobal ? (
        <p className="text-slate-600">
          Nenhuma vedação registrada — Simples Nacional, Lucro Presumido e MEI seguem disponíveis
          para comparação (Lucro Real sempre disponível).
        </p>
      ) : (
        <div className="space-y-2">
          {linhas.map((linha) => {
            const semVedacao = linha.itens.length === 0 && !linha.outra
            return (
              <div
                key={linha.regime}
                className={`rounded-lg border p-2.5 space-y-1 ${
                  semVedacao ? 'border-slate-200 bg-white/60' : 'border-red-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <strong className={semVedacao ? 'text-slate-700' : 'text-red-900'}>
                    {linha.regime}:
                  </strong>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      semVedacao ? 'bg-emerald-100 text-emerald-800' : 'bg-red-600 text-white'
                    }`}
                  >
                    {semVedacao ? 'DISPONÍVEL' : 'INDISPONÍVEL — VEDAÇÃO LEGAL'}
                  </span>
                </div>
                {!semVedacao && (
                  <ul className="space-y-0.5">
                    {linha.itens.map((texto) => (
                      <li key={texto} className="text-red-900 flex items-start gap-1.5">
                        <span className="font-bold shrink-0">•</span>
                        <span>{texto}</span>
                      </li>
                    ))}
                    {linha.outra && (
                      <li className="text-red-900 flex items-start gap-1.5">
                        <span className="font-bold shrink-0">•</span>
                        <span>Outra (registro livre): {linha.outra}</span>
                      </li>
                    )}
                  </ul>
                )}
                <p className="text-[10px] text-slate-500 leading-relaxed">{linha.baseLegal}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
