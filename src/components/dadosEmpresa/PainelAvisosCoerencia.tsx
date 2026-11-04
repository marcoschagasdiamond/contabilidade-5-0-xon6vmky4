import React from 'react'
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react'
import { ApontamentoFiscal } from '@/lib/validacaoDadosFiscais'

interface PainelAvisosCoerenciaProps {
  avisos: ApontamentoFiscal[]
  onFocarCampo?: (campoId: string) => void
}

export const PainelAvisosCoerencia: React.FC<PainelAvisosCoerenciaProps> = ({
  avisos,
  onFocarCampo,
}) => {
  if (!avisos || avisos.length === 0) return null

  return (
    <div
      id="painelAvisosCoerencia"
      className="p-4 rounded-xl bg-amber-50/80 border border-amber-300/80 shadow-2xs space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold font-heading text-amber-900 uppercase tracking-wide">
              Avisos de Coerência Fiscal ({avisos.length})
            </h5>
            <p className="text-[11px] text-amber-700">
              Estes alertas não bloqueiam o salvamento dos dados, mas apontam divergências fiscais
              que podem afetar o cálculo da Calculadora e o Diagnóstico 360°.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {avisos.map((aviso) => (
          <div
            key={aviso.id}
            className="p-3 rounded-lg bg-white border border-amber-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
          >
            <div className="flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
              <div>
                <span className="font-bold text-slate-800 block text-xs">{aviso.titulo}</span>
                <span className="text-[11px] text-slate-600 leading-relaxed block mt-0.5">
                  {aviso.mensagem}
                </span>
              </div>
            </div>

            {aviso.campo && onFocarCampo && (
              <button
                type="button"
                onClick={() => onFocarCampo(String(aviso.campo))}
                className="shrink-0 text-[11px] font-semibold text-amber-800 hover:text-amber-900 underline underline-offset-2 self-end sm:self-center"
              >
                Ir para o campo
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
