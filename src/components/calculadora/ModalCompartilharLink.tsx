import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  Share2,
  Copy,
  Check,
  Send,
  Sparkles,
  Link as LinkIcon,
  Smartphone,
  ExternalLink,
} from 'lucide-react'
import type { ParametrosSimulacaoCalculadora } from '@/types/simulacaoCalculadora'

interface ModalCompartilharLinkProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parametros: ParametrosSimulacaoCalculadora
}

/**
 * Codifica o objeto de parâmetros em base64 seguro para URL (sem quebras de linha e caracteres incompatíveis)
 */
export function codificarParametrosEmUrl(params: ParametrosSimulacaoCalculadora): string {
  try {
    const jsonStr = JSON.stringify(params)
    // UTF-8 seguro em browser base64
    const encoded = btoa(encodeURIComponent(jsonStr))
    return encoded
  } catch (err) {
    console.error('Falha ao codificar parâmetros:', err)
    return ''
  }
}

/**
 * Decodifica uma string base64 segura para o objeto de parâmetros
 */
export function decodificarParametrosDaUrl(hash: string): ParametrosSimulacaoCalculadora | null {
  try {
    const jsonStr = decodeURIComponent(atob(hash))
    const parsed = JSON.parse(jsonStr)
    return parsed as ParametrosSimulacaoCalculadora
  } catch (err) {
    console.error('Falha ao decodificar parâmetros da URL:', err)
    return null
  }
}

export function ModalCompartilharLink({
  open,
  onOpenChange,
  parametros,
}: ModalCompartilharLinkProps) {
  const { toast } = useToast()
  const [copiado, setCopiado] = useState(false)

  // Monta a URL completa com o hash base64
  const urlCompartilhamento = React.useMemo(() => {
    if (typeof window === 'undefined') return ''
    const hash = codificarParametrosEmUrl(parametros)
    const baseUrl = `${window.location.origin}/calculadora-ibs-cbs`
    return `${baseUrl}?simulacao=${encodeURIComponent(hash)}`
  }, [parametros, open])

  const handleCopiarLink = async () => {
    try {
      await navigator.clipboard.writeText(urlCompartilhamento)
      setCopiado(true)
      toast({
        title: 'Link copiado com sucesso!',
        description:
          'Qualquer pessoa que abrir este link terá a simulação com seus parâmetros restaurada na tela, sem exigir login.',
      })
      setTimeout(() => setCopiado(false), 3000)
    } catch (err) {
      toast({
        title: 'Não foi possível copiar',
        description: 'Selecione o link manualmente.',
        variant: 'destructive',
      })
    }
  }

  const handleCompartilharNativo = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Simulação Reforma Tributária IBS/CBS — Contabilidade 5.0',
          text: `Confira a simulação de impacto do novo IVA Dual (IBS/CBS) para ${parametros.empresa || 'nossa empresa'}.`,
          url: urlCompartilhamento,
        })
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          handleCopiarLink()
        }
      }
    } else {
      handleCopiarLink()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white text-[#07132B] border border-slate-200">
        <DialogHeader>
          <div className="w-10 h-10 rounded-full bg-[#07132B] text-[#D4AF37] flex items-center justify-center mb-2 font-bold shadow-sm">
            <Share2 className="w-5 h-5" />
          </div>
          <DialogTitle className="text-xl font-heading font-extrabold text-[#07132B]">
            Compartilhar Simulação via Link
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Gera um link exclusivo com todos os parâmetros da simulação codificados na URL. Quem
            abrir poderá ver os mesmos dados imediatamente, mesmo sem cadastro ou login.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Resumo do Cenário Compartilhado */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
            <div className="flex justify-between items-center text-slate-500 font-semibold">
              <span>Empresa / Cenário:</span>
              <strong className="text-slate-900 font-bold">
                {parametros.empresa || 'Simulação Personalizada'}
              </strong>
            </div>
            <div className="flex justify-between items-center text-slate-500 font-semibold">
              <span>Faturamento Mensal:</span>
              <strong className="text-[#07132B] font-mono font-bold">
                R${' '}
                {parametros.faturamentoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <div className="flex justify-between items-center text-slate-500 font-semibold">
              <span>Atividade:</span>
              <strong className="text-slate-900 font-bold uppercase text-[11px]">
                {parametros.tipoAtividade === 'agronegocio'
                  ? 'Agronegócio / Rural'
                  : parametros.tipoAtividade === 'construcao_civil'
                    ? 'Construção Civil'
                    : parametros.tipoAtividade === 'locacao_bens'
                      ? 'Locação de Bens'
                      : parametros.tipoAtividade === 'food_service'
                        ? 'Bares / Food Service'
                        : parametros.tipoAtividade}
              </strong>
            </div>
          </div>

          {/* Campo com Link e Botão Copiar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
                Link da Simulação
              </label>
              <span className="text-[10px] text-slate-400">Codificado e seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={urlCompartilhamento}
                className="h-10 text-xs font-mono bg-slate-50 border-slate-300 text-slate-700 selection:bg-[#D4AF37] selection:text-[#07132B]"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                type="button"
                onClick={handleCopiarLink}
                className={`h-10 px-4 shrink-0 font-bold text-xs gap-1.5 transition-all ${
                  copiado
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-[#D4AF37] hover:bg-[#E5C158] text-[#07132B]'
                }`}
              >
                {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
              </Button>
            </div>
          </div>

          {/* Botão Compartilhar Nativo (Mobile / WhatsApp / etc.) */}
          <div className="pt-2 flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCompartilharNativo}
              className="w-full border-slate-300 text-slate-800 hover:bg-slate-100 font-bold text-xs h-10 gap-2"
            >
              <Smartphone className="w-4 h-4 text-[#D4AF37]" />
              <span>Compartilhar (WhatsApp, E-mail ou Redes)</span>
            </Button>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              Restauro Automático
            </div>
            <p className="text-[11px] leading-relaxed">
              O destinatário verá um banner discreto informando que a simulação foi carregada por
              link, podendo fazer ajustes e salvá-la em sua própria conta se desejar.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
