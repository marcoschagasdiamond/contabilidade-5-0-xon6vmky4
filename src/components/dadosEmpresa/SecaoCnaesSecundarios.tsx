import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Layers, Trash2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'
import type { ItemCnaeSecundarioSalvo } from '@/types/dadosEmpresa'
import { SegmentoEmpresa } from '@/lib/regimes'

interface SecaoCnaesSecundariosProps {
  cnaes: ItemCnaeSecundarioSalvo[]
  segmentoAtual?: SegmentoEmpresa
  onRemoverItem: (codigo: string) => void
  onSugerirSegmento?: (segmento: SegmentoEmpresa) => void
}

export function SecaoCnaesSecundarios({
  cnaes,
  segmentoAtual,
  onRemoverItem,
  onSugerirSegmento,
}: SecaoCnaesSecundariosProps) {
  if (!Array.isArray(cnaes) || cnaes.length === 0) {
    return null
  }

  const formatarData = (iso?: string) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      if (isNaN(d.getTime())) return iso
      return d.toLocaleDateString('pt-BR')
    } catch {
      return iso
    }
  }

  return (
    <div className="pt-4 border-t border-slate-200/80 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-[#07132B]/10 text-[#07132B]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-800 text-xs block">
              Atividades Econômicas Secundárias (CNAEs Secundários)
            </span>
            <span className="text-[11px] text-slate-500">
              {cnaes.length} atividade(s) secundária(s) registrada(s) na empresa
            </span>
          </div>
        </div>

        <Badge className="bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/30 text-[10px]">
          {cnaes.length} registrado(s)
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {cnaes.map((item) => {
          const codigoFmt =
            item.codigoFormatado ||
            (item.codigo && item.codigo.length === 7
              ? `${item.codigo.slice(0, 4)}-${item.codigo.slice(4, 5)}/${item.codigo.slice(5, 7)}`
              : item.codigo)

          const ehSegmentoDiferente =
            item.segmentoSugerido && segmentoAtual && item.segmentoSugerido !== segmentoAtual

          const ehMesmoSegmento =
            item.segmentoSugerido && segmentoAtual && item.segmentoSugerido === segmentoAtual

          return (
            <div
              key={item.codigo}
              className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between gap-2 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-slate-800 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                    {codigoFmt}
                  </span>

                  <div className="flex items-center gap-1">
                    {item.fonte && (
                      <Badge
                        variant="outline"
                        className="text-[9px] py-0 px-1.5 font-normal text-slate-500 border-slate-300"
                        title={
                          item.consultadoEm
                            ? `Consultado em fonte oficial em ${formatarData(item.consultadoEm)}`
                            : 'Consultado em fonte oficial pública'
                        }
                      >
                        Oficial • {item.fonte}
                        {item.consultadoEm && ` (${formatarData(item.consultadoEm)})`}
                      </Badge>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemoverItem(item.codigo)}
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Remover este CNAE secundário do cadastro"
                      aria-label="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-slate-700 leading-snug text-[11px]">{item.descricao}</p>
              </div>

              {/* Sugestão de segmento contextual */}
              {item.segmentoSugerido && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-1.5 text-[10px]">
                  <div className="flex items-center gap-1 text-slate-500">
                    <span>Segmento mapeado:</span>
                    <strong className="text-slate-700">{item.segmentoSugerido}</strong>
                    {ehMesmoSegmento && (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    )}
                  </div>

                  {ehSegmentoDiferente && onSugerirSegmento && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onSugerirSegmento(item.segmentoSugerido as SegmentoEmpresa)}
                      className="h-6 px-2 text-[10px] text-[#145A32] hover:bg-emerald-50 font-medium"
                    >
                      <Sparkles className="w-3 h-3 mr-1 text-emerald-600" />
                      Usar como segmento principal
                    </Button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
