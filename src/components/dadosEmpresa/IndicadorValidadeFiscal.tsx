import React from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronRight, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ResultadoValidacaoFiscal } from '@/lib/validacaoDadosFiscais'

interface IndicadorValidadeFiscalProps {
  resultado: ResultadoValidacaoFiscal
  onRolarParaCampo?: (idCampo: string) => void
}

export const IndicadorValidadeFiscal: React.FC<IndicadorValidadeFiscalProps> = ({
  resultado,
  onRolarParaCampo,
}) => {
  const { totalErros, totalAvisos, totalPendencias, avisosCoerencia } = resultado

  if (totalPendencias === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-900 text-sm">
                Dados Fiscais 100% Validados
              </span>
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-[10px] px-2 py-0">
                Coerência OK
              </Badge>
            </div>
            <p className="text-emerald-700 mt-0.5 text-[11px] sm:text-xs">
              Todos os campos essenciais, alíquotas, percentuais e parâmetros fiscais estão
              coerentes e prontos para sincronização.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-xl p-3.5 sm:p-4 border transition-all shadow-sm ${
        totalErros > 0 ? 'bg-rose-50/70 border-rose-200' : 'bg-amber-50/70 border-amber-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
              totalErros > 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {totalErros > 0 ? (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4
                className={`font-heading font-bold text-sm ${
                  totalErros > 0 ? 'text-rose-900' : 'text-amber-900'
                }`}
              >
                Validação Automática de Dados Fiscais
              </h4>
              <Badge
                variant="outline"
                className={`text-[11px] font-mono font-bold px-2 py-0.5 ${
                  totalErros > 0
                    ? 'border-rose-300 bg-rose-100/80 text-rose-800'
                    : 'border-amber-300 bg-amber-100/80 text-amber-800'
                }`}
              >
                {totalPendencias} {totalPendencias === 1 ? 'pendência' : 'pendências'}
              </Badge>
              {totalErros > 0 && (
                <span className="text-[11px] font-semibold text-rose-700">
                  ({totalErros} {totalErros === 1 ? 'campo incorreto' : 'campos incorretos'})
                </span>
              )}
              {totalAvisos > 0 && (
                <span className="text-[11px] font-semibold text-amber-700">
                  ({totalAvisos} {totalAvisos === 1 ? 'aviso de coerência' : 'avisos de coerência'})
                </span>
              )}
            </div>
            <p className={`text-xs mt-1 ${totalErros > 0 ? 'text-rose-700' : 'text-amber-700'}`}>
              {totalErros > 0
                ? 'Corrija os campos indicados em vermelho para garantir a precisão dos cálculos e a sincronização cadastral.'
                : 'Os campos obrigatórios estão preenchidos, mas há apontamentos de coerência fiscal abaixo para sua conferência (o salvamento é permitido).'}
            </p>
          </div>
        </div>

        {totalAvisos > 0 && onRolarParaCampo && (
          <div className="shrink-0 flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => onRolarParaCampo('painelAvisosCoerencia')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1"
            >
              Ver detalhes <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Lista sucinta de avisos se houver */}
      {avisosCoerencia.length > 0 && (
        <div className="mt-3 pt-3 border-t border-amber-200/70 space-y-1.5">
          <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-amber-600" />
            Avisos de coerência fiscal detectados:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {avisosCoerencia.map((av) => (
              <div
                key={av.id}
                className="bg-white/80 rounded-lg p-2 border border-amber-200/60 text-[11px] text-slate-700 flex items-start gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                <div className="min-w-0 flex-1">
                  <strong className="text-amber-900 font-semibold block">{av.titulo}</strong>
                  <span className="text-slate-600 leading-tight block">{av.mensagem}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
