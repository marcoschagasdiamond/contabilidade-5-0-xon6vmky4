import React from 'react'
import type { ResultadosRecuperador } from '@/types/recuperadorCreditos'
import { formatarMoeda } from '@/lib/calculadoraUtils'

interface Props {
  resultados: ResultadosRecuperador
  segmento?: string
}

export default function ModuloApuracaoSelicRecuperador({ resultados, segmento }: Props) {
  const [teseSelecionadaId, setTeseSelecionadaId] = React.useState<string>('todas')

  const tesesAtivas = resultados.resultadosTeses.filter((t) => t.ativa)

  const teseFiltro =
    teseSelecionadaId === 'todas'
      ? null
      : resultados.resultadosTeses.find((t) => t.teseId === teseSelecionadaId)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-[#07132B] uppercase tracking-wide">
              Módulo 4 • Apuração Ano a Ano com Correção SELIC
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Demonstrativo das competências de 60 meses com atualização monetária oficial pela taxa
              SELIC acumulada para o setor{' '}
              <strong className="text-[#07132B]">{segmento || 'Geral'}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">Filtrar Tese:</label>
            <select
              value={teseSelecionadaId}
              onChange={(e) => setTeseSelecionadaId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            >
              <option value="todas">Consolidado Geral (Todas as Teses Ativas)</option>
              {tesesAtivas.map((t) => (
                <option key={t.teseId} value={t.teseId}>
                  {t.titulo.slice(0, 50)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TABELA CONSOLIDADA OU POR TESE */}
        <div className="overflow-x-auto pt-5">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-[#07132B] text-white">
                <th className="py-2.5 px-3 rounded-l-lg font-bold">Ano / Competência</th>
                <th className="py-2.5 px-3 font-bold text-right">Crédito Original</th>
                <th className="py-2.5 px-3 font-bold text-center">Fator SELIC Acumulado</th>
                <th className="py-2.5 px-3 font-bold text-right">Correção SELIC</th>
                <th className="py-2.5 px-3 rounded-r-lg font-bold text-right text-[#D4AF37]">
                  Total Recuperável
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teseFiltro
                ? // Exibe apuração da tese selecionada
                  teseFiltro.apuracaoPorAno.map((item) => (
                    <tr key={item.ano} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-800">
                        Ano-Calendário {item.ano}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {formatarMoeda(item.valorOriginal)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                          +{((item.fatorSelic - 1) * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-700 font-semibold">
                        +{formatarMoeda(item.correcaoSelic)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatarMoeda(item.valorTotalCorrigido)}
                      </td>
                    </tr>
                  ))
                : // Exibe apuração consolidada geral
                  resultados.totaisPorAno.map((item) => {
                    const fatorMedio =
                      item.valorOriginal > 0 ? item.totalCorrigido / item.valorOriginal : 1
                    return (
                      <tr key={item.ano} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-bold text-slate-800">
                          Ano-Calendário {item.ano}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {formatarMoeda(item.valorOriginal)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                            +{((fatorMedio - 1) * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-700 font-semibold">
                          +{formatarMoeda(item.correcaoSelic)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {formatarMoeda(item.totalCorrigido)}
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
                <td className="py-3 px-3">Total Consolidado (60 Meses)</td>
                <td className="py-3 px-3 text-right font-mono">
                  {formatarMoeda(
                    teseFiltro ? teseFiltro.valorOriginalTotal : resultados.totalIntegralOriginal,
                  )}
                </td>
                <td className="py-3 px-3 text-center text-slate-500 font-normal text-[11px]">
                  Atualização SELIC
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-700">
                  +
                  {formatarMoeda(
                    teseFiltro ? teseFiltro.correcaoSelicTotal : resultados.totalIntegralSelic,
                  )}
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-800 text-sm">
                  {formatarMoeda(
                    teseFiltro ? teseFiltro.totalCorrigido : resultados.totalIntegralCorrigido,
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
