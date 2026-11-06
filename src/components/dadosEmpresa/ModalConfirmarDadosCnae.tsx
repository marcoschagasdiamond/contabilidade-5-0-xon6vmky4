import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle2, Building2, Tag, Layers, ArrowRight, Info } from 'lucide-react'
import type { ItemResultadoCnae } from '@/services/consultaCnae'
import type { SegmentoEmpresa } from '@/lib/regimes'
import { BadgeProvenienciaCnae } from './BadgeProvenienciaCnae'

export interface OpcoesConfirmacaoCnae {
  aplicarCnaeCodigo: boolean
  aplicarCnaeDescricao: boolean
  aplicarSegmento: boolean
  apenasCamposEmBranco: boolean
}

interface ModalConfirmarDadosCnaeProps {
  aberto: boolean
  aoFechar: () => void
  cnae: ItemResultadoCnae | null
  valoresAtuais?: {
    cnaeCodigo?: string
    cnaeDescricao?: string
    segmento?: string
  }
  aoConfirmar: (cnae: ItemResultadoCnae, opcoes: OpcoesConfirmacaoCnae) => void
}

/**
 * Modal de confirmação para aplicação dos dados de CNAE consultados externamente.
 * Segue rigorosamente o padrão do ModalConfirmarDadosCnpj:
 * - Mostra o CNAE formatado, a descrição e a hierarquia oficial (seção/divisão)
 * - Mostra o segmento correspondente sugerido (1 das 10 opções)
 * - Oferece opção de "Preencher apenas campos em branco (não sobrescrever)"
 * - Permite selecionar granularmente o que aplicar antes de confirmar
 */
export const ModalConfirmarDadosCnae: React.FC<ModalConfirmarDadosCnaeProps> = ({
  aberto,
  aoFechar,
  cnae,
  valoresAtuais = {},
  aoConfirmar,
}) => {
  const [apenasEmBranco, setApenasEmBranco] = useState(false)
  const [aplicarCodigo, setAplicarCodigo] = useState(true)
  const [aplicarDescricao, setAplicarDescricao] = useState(true)
  const [aplicarSegmento, setAplicarSegmento] = useState(true)

  if (!cnae) return null

  const handleConfirmar = () => {
    aoConfirmar(cnae, {
      aplicarCnaeCodigo: aplicarCodigo,
      aplicarCnaeDescricao: aplicarDescricao,
      aplicarSegmento: aplicarSegmento,
      apenasCamposEmBranco: apenasEmBranco,
    })
    aoFechar()
  }

  const segmentoAtual = valoresAtuais.segmento
  const cnaeAtual = valoresAtuais.cnaeCodigo

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && aoFechar()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border-slate-200">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-linear-to-r from-emerald-50/60 to-slate-50/40">
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#2ECC71]/20 flex items-center justify-center text-[#145A32]">
                <Building2 className="w-4 h-4" />
              </div>
              <DialogTitle className="text-base font-bold text-slate-800">
                Confirmar Dados do CNAE
              </DialogTitle>
            </div>
            <BadgeProvenienciaCnae
              fonte={cnae.fonte}
              consultadoEm={cnae.consultadoEm}
              tamanho="md"
            />
          </div>
          <DialogDescription className="text-xs text-slate-500">
            A subclasse foi localizada em fonte oficial pública. Escolha os campos que deseja
            aplicar ao cadastro da empresa.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Card com os dados do CNAE */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200/60">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-0.5">
                  Subclasse CNAE
                </span>
                <span className="text-base font-bold font-mono text-slate-800">
                  {cnae.codigoFormatado}
                </span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100/80 text-[#145A32] border border-emerald-200">
                CNAE Ativo
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-0.5">
                Descrição da Atividade
              </span>
              <p className="text-sm font-medium text-slate-800 leading-snug">{cnae.descricao}</p>
            </div>

            {(cnae.secaoDescricao || cnae.divisaoDescricao) && (
              <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600 space-y-1">
                {cnae.secaoDescricao && (
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500">Seção {cnae.secaoCodigo}:</span>
                    <span className="font-medium text-slate-700 truncate">
                      {cnae.secaoDescricao}
                    </span>
                  </div>
                )}
                {cnae.divisaoDescricao && (
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500">Divisão {cnae.divisaoCodigo}:</span>
                    <span className="font-medium text-slate-700 truncate">
                      {cnae.divisaoDescricao}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Destaque do Segmento Sugerido (1 das 10 opções) */}
          <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#2ECC71] text-[#0A1A13] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#145A32] uppercase tracking-wider block">
                  Segmento Correspondente Sugerido
                </span>
                <span className="text-sm font-bold text-slate-900">{cnae.segmentoSugerido}</span>
              </div>
            </div>
            {segmentoAtual && segmentoAtual !== cnae.segmentoSugerido && (
              <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                Atual: {segmentoAtual}
              </span>
            )}
          </div>

          {/* Opções granulares de aplicação */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
              Campos a preencher no formulário:
            </label>

            <div className="grid grid-cols-1 gap-2 text-xs">
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <Checkbox
                  checked={aplicarCodigo}
                  onCheckedChange={(checked) => setAplicarCodigo(!!checked)}
                />
                <span className="text-slate-700 font-medium">
                  Preencher Código do CNAE ({cnae.codigoFormatado})
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <Checkbox
                  checked={aplicarDescricao}
                  onCheckedChange={(checked) => setAplicarDescricao(!!checked)}
                />
                <span className="text-slate-700 font-medium truncate">
                  Preencher Descrição do CNAE ({cnae.descricao.slice(0, 45)}...)
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <Checkbox
                  checked={aplicarSegmento}
                  onCheckedChange={(checked) => setAplicarSegmento(!!checked)}
                />
                <span className="text-slate-700 font-medium">
                  Preencher Segmento da Empresa ({cnae.segmentoSugerido})
                </span>
              </label>
            </div>
          </div>

          {/* Opção: Preencher apenas campos em branco */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 cursor-pointer hover:bg-amber-50 transition-colors">
              <Checkbox
                checked={apenasEmBranco}
                onCheckedChange={(checked) => setApenasEmBranco(!!checked)}
              />
              <div className="text-xs">
                <span className="font-bold text-amber-900 block">
                  Preencher apenas campos em branco (não sobrescrever)
                </span>
                <span className="text-amber-700 block text-[11px] leading-snug">
                  Se ativado, mantém os valores que você já digitou anteriormente e só preenche o
                  que estiver vazio.
                </span>
              </div>
            </label>
          </div>

          <div className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-500">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              A alteração de CNAE e segmento é apenas cadastral e orientativa; cálculos e apurações
              tributárias existentes não são modificados automaticamente sem sua confirmação.
            </span>
          </div>
        </div>

        <DialogFooter className="p-4 px-6 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={aoFechar}
            className="text-xs text-slate-600"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirmar}
            className="text-xs font-semibold bg-[#2ECC71] hover:bg-[#27ae60] text-[#0A1A13] flex items-center gap-1.5 shadow-xs"
          >
            <span>Aplicar ao Cadastro</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
