import React from 'react'
import type {
  TeseRecuperacaoDefinicao,
  TeseSelecaoUsuario,
  FarolRisco,
  ResultadoTese,
} from '@/types/recuperadorCreditos'
import { formatarMoeda } from '@/lib/calculadoraUtils'

interface Props {
  tesesDefinicoes: TeseRecuperacaoDefinicao[]
  tesesSelecionadas: Record<string, TeseSelecaoUsuario>
  resultadosTeses: ResultadoTese[]
  segmento?: string
  onChangeTese: (teseId: string, atualizacao: Partial<TeseSelecaoUsuario>) => void
}

export default function BlocoFolhaPrevidenciarioRecuperador({
  tesesDefinicoes,
  tesesSelecionadas,
  resultadosTeses,
  segmento,
  onChangeTese,
}: Props) {
  const tesesFolha = tesesDefinicoes.filter((t) => t.modulo === 'folha')

  const mapaResultados = React.useMemo(() => {
    const map: Record<string, ResultadoTese> = {}
    resultadosTeses.forEach((r) => {
      map[r.teseId] = r
    })
    return map
  }, [resultadosTeses])

  const totalModuloCorrigido = tesesFolha.reduce((acc, t) => {
    const res = mapaResultados[t.id]
    return acc + (res?.ativa ? res.totalCorrigido : 0)
  }, 0)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-[#07132B] uppercase tracking-wide">
              Bloco 3 • Teses de Folha & Previdenciário (Com Farol de Risco)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Checklist filtrado para o setor{' '}
              <strong className="text-[#07132B]">{segmento || 'Geral'}</strong> ({tesesFolha.length}{' '}
              {tesesFolha.length === 1 ? 'tese aplicável' : 'teses aplicáveis'}).
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Total Recuperável Folha/INSS (60 Meses c/ SELIC)
            </span>
            <span className="text-base font-bold text-emerald-600 font-mono">
              {formatarMoeda(totalModuloCorrigido)}
            </span>
          </div>
        </div>

        <div className="space-y-4 pt-5">
          {tesesFolha.map((tese) => {
            const selecao = tesesSelecionadas[tese.id] || {
              teseId: tese.id,
              ativa: true,
              farol: tese.riscoPadrao,
              percentualBaseCustomizado: tese.percentualEstimadoPadrao,
            }
            const res = mapaResultados[tese.id]
            const ativa = selecao.ativa
            const farol = selecao.farol

            return (
              <div
                key={tese.id}
                className={`p-4 rounded-xl border transition-all ${
                  ativa
                    ? 'bg-white border-slate-300 shadow-sm'
                    : 'bg-slate-50/70 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* LADO ESQUERDO: CHECKBOX, CÓDIGO, TÍTULO E DESCRIÇÃO */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={ativa}
                      onChange={(e) => onChangeTese(tese.id, { ativa: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded border-slate-300 text-[#07132B] focus:ring-[#D4AF37]"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-[#07132B] text-[#D4AF37]">
                          {tese.codigo}
                        </span>
                        {selecao.origem === 'ncm_sugerido' && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/40 shadow-xs">
                            Sugerido via NCM{' '}
                            {selecao.ncmReferencia ? `(${selecao.ncmReferencia})` : ''}
                          </span>
                        )}
                        <h4 className="text-xs font-bold text-[#07132B]">{tese.titulo}</h4>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded inline-block mb-1.5 border border-emerald-200">
                        {tese.fundamento}
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed mb-2">
                        {tese.descricao}
                      </p>
                      <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <strong className="text-slate-700">Justificativa técnica:</strong>{' '}
                        {tese.justificativaRisco}
                      </div>
                    </div>
                  </div>

                  {/* LADO DIREITO: SELETOR DE FAROL, PERCENTUAL & VALOR APURADO */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-end gap-3 shrink-0 pt-2 md:pt-0">
                    {/* Farol de risco */}
                    <div className="w-full sm:w-auto">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        Farol de Risco
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onChangeTese(tese.id, { farol: 'verde' })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                            farol === 'verde'
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          Verde (Pacífico)
                        </button>
                        <button
                          type="button"
                          onClick={() => onChangeTese(tese.id, { farol: 'amarelo' })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                            farol === 'amarelo'
                              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          Amarelo (Moderado)
                        </button>
                        <button
                          type="button"
                          onClick={() => onChangeTese(tese.id, { farol: 'vermelho' })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                            farol === 'vermelho'
                              ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                              : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          Vermelho (Alto)
                        </button>
                      </div>
                    </div>

                    {/* % sobre base e valor apurado */}
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5 text-right">
                          % Estimado
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.05"
                            value={
                              selecao.percentualBaseCustomizado !== undefined
                                ? selecao.percentualBaseCustomizado
                                : tese.percentualEstimadoPadrao
                            }
                            onChange={(e) =>
                              onChangeTese(tese.id, {
                                percentualBaseCustomizado: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-16 px-2 py-1 text-xs font-bold text-right rounded-lg border border-slate-200 bg-white"
                          />
                          <span className="text-xs text-slate-500">%</span>
                        </div>
                      </div>

                      <div className="text-right pl-3 border-l border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Total c/ SELIC
                        </span>
                        <span className="text-sm font-bold text-slate-800 font-mono">
                          {formatarMoeda(res?.totalCorrigido || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
