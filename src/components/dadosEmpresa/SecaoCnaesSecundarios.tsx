import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Layers,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import type { ItemCnaeSecundarioSalvo } from '@/types/dadosEmpresa'
import { SegmentoEmpresa } from '@/lib/regimes'
import { mapearCnaeParaSegmentoOpcional } from '@/services/consultaCnpj'

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
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false)
  const [segmentoPendente, setSegmentoPendente] = useState<{
    segmento: SegmentoEmpresa
    cnaeCodigo: string
    cnaeDescricao: string
  } | null>(null)

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

  const handleAcionarSugestao = (
    segmentoSugerido: SegmentoEmpresa,
    cnaeCodigo: string,
    cnaeDescricao: string,
  ) => {
    if (!onSugerirSegmento) return

    // Se NÃO há segmento atual definido no formulário, aplica direto por clique
    if (!segmentoAtual) {
      onSugerirSegmento(segmentoSugerido)
      return
    }

    // Se já é o mesmo segmento, não precisa alterar
    if (segmentoAtual === segmentoSugerido) {
      return
    }

    // Se já há segmento preenchido e é diferente, solicita confirmação para não sobrescrever acidentalmente
    setSegmentoPendente({
      segmento: segmentoSugerido,
      cnaeCodigo,
      cnaeDescricao,
    })
    setModalConfirmacaoAberto(true)
  }

  const handleConfirmarTroca = () => {
    if (segmentoPendente && onSugerirSegmento) {
      onSugerirSegmento(segmentoPendente.segmento)
    }
    setModalConfirmacaoAberto(false)
    setSegmentoPendente(null)
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

          // Resolve o segmento de forma opcional (usando campo salvo ou mapeamento semântico dinâmico)
          const segmentoSugeridoResolvido =
            (item.segmentoSugerido as SegmentoEmpresa) ||
            mapearCnaeParaSegmentoOpcional(item.codigo, item.descricao)

          const ehMesmoSegmento =
            segmentoSugeridoResolvido &&
            segmentoAtual &&
            segmentoSugeridoResolvido === segmentoAtual

          const ehSegmentoDiferente =
            segmentoSugeridoResolvido &&
            (!segmentoAtual || segmentoSugeridoResolvido !== segmentoAtual)

          return (
            <div
              key={item.codigo}
              className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between gap-2.5 text-xs hover:border-slate-300 transition"
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

              {/* Sugestão de segmento contextual de CNAE secundário */}
              {segmentoSugeridoResolvido ? (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 text-[10px]">Sugestão de segmento:</span>
                    <Badge className="bg-[#07132B]/10 hover:bg-[#07132B]/15 text-[#07132B] border-none text-[10px] font-semibold py-0.5 px-2">
                      {segmentoSugeridoResolvido}
                    </Badge>
                    {ehMesmoSegmento && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        Atual
                      </span>
                    )}
                  </div>

                  {ehSegmentoDiferente && onSugerirSegmento && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleAcionarSugestao(segmentoSugeridoResolvido, codigoFmt, item.descricao)
                      }
                      className="h-7 px-2.5 text-[11px] font-medium text-[#145A32] border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 hover:border-emerald-300 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-[#2ECC71] shrink-0" />
                      {segmentoAtual
                        ? `Trocar para ${segmentoSugeridoResolvido}`
                        : `Sugerir segmento ${segmentoSugeridoResolvido}`}
                    </Button>
                  )}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Modal de confirmação ao trocar um segmento já preenchido */}
      <Dialog
        open={modalConfirmacaoAberto}
        onOpenChange={(aberto) => {
          if (!aberto) {
            setModalConfirmacaoAberto(false)
            setSegmentoPendente(null)
          }
        }}
      >
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <DialogTitle className="text-sm font-bold text-slate-800">
                Confirmar Alteração de Segmento Principal
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed pt-1">
              O formulário já possui um segmento principal definido. A alteração de segmento
              ajustará as alíquotas e anexos sugeridos no Diagnóstico Tributário.
            </DialogDescription>
          </DialogHeader>

          {segmentoPendente && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Segmento atual:</span>
                <span className="font-semibold text-slate-700">{segmentoAtual}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Novo segmento sugerido:</span>
                <span className="font-bold text-[#145A32] flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-[#2ECC71]" />
                  {segmentoPendente.segmento}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 pt-1">
                Origem: CNAE Secundário {segmentoPendente.cnaeCodigo} —{' '}
                {segmentoPendente.cnaeDescricao}
              </div>
            </div>
          )}

          <div className="p-2.5 rounded-md bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-900 flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
            <span>
              A troca é sempre uma decisão sua. Seus dados de faturamento, colaboradores e vínculos
              societários serão preservados.
            </span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setModalConfirmacaoAberto(false)
                setSegmentoPendente(null)
              }}
              className="text-xs text-slate-600"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmarTroca}
              className="text-xs font-semibold bg-[#145A32] hover:bg-[#114b2a] text-white"
            >
              Confirmar e Aplicar {segmentoPendente?.segmento}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
