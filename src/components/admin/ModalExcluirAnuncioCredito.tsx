import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { AnuncioCredito } from '@/types/creditos'
import { excluirAnuncioCredito } from '@/services/creditos'
import { formatarMoeda, formatarPorcentagem } from '@/lib/calculadoraUtils'

export interface ModalExcluirAnuncioCreditoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  anuncio: AnuncioCredito | null
  onSucesso: (mensagem: string, anuncioId: string) => void
  onErro: (mensagem: string) => void
}

/**
 * Modal de confirmação para exclusão de anúncio do Mercado de Créditos
 * Padrão visual Diamond Group: Navy (#07132B), Dourado (#D4AF37), sem ícones.
 */
export function ModalExcluirAnuncioCredito({
  open,
  onOpenChange,
  anuncio,
  onSucesso,
  onErro,
}: ModalExcluirAnuncioCreditoProps) {
  const [processando, setProcessando] = useState(false)

  if (!anuncio) return null

  const handleConfirmar = async () => {
    try {
      setProcessando(true)
      await excluirAnuncioCredito(anuncio.id)
      const tituloAnuncio =
        anuncio.operacao === 'venda'
          ? anuncio.tipo_credito || 'Crédito Tributário'
          : `Interesse de Compra (${anuncio.finalidade || 'Geral'})`

      onSucesso(
        `O anúncio "${tituloAnuncio}" foi excluído com sucesso e removido da listagem pública.`,
        anuncio.id,
      )
      onOpenChange(false)
    } catch (err: any) {
      console.error('Erro ao excluir anúncio do Mercado de Créditos:', err)
      onErro(
        err?.message ||
          'Falha ao excluir o anúncio do Mercado de Créditos. Verifique suas permissões administrativas.',
      )
    } finally {
      setProcessando(false)
    }
  }

  const ehVenda = anuncio.operacao === 'venda'
  const rotuloOperacao = ehVenda ? 'Oferta de Venda' : 'Demanda de Compra'
  const tituloAnuncio = ehVenda
    ? anuncio.tipo_credito || 'Crédito Tributário / Precatório'
    : 'Interesse de Compra / Compensação'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-slate-200 bg-white">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200 bg-rose-950 px-2 py-0.5 rounded">
              Ação Irreversível • Mesa de Créditos
            </span>
          </div>

          <DialogTitle className="text-base font-bold text-[#07132B]">
            Excluir Anúncio do Mercado de Créditos
          </DialogTitle>

          <DialogDescription className="text-xs text-slate-500">
            Atenção: esta ação remove permanentemente este anúncio da mesa de negócios e da listagem
            pública.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          {/* Card de resumo do anúncio a ser excluído */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Anúncio a ser removido
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                  ehVenda ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                }`}
              >
                {rotuloOperacao}
              </span>
            </div>

            <div className="font-bold text-sm text-[#07132B]">{tituloAnuncio}</div>

            <div className="text-[11px] text-slate-600 font-medium">
              Esfera: <span className="capitalize">{anuncio.esfera}</span>
              {anuncio.uf ? ` • UF: ${anuncio.uf}` : ''}
              {anuncio.municipio ? ` • Município: ${anuncio.municipio}` : ''}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 text-[11px]">
              <span className="text-slate-600">
                Valor:{' '}
                <strong className="text-slate-900 font-bold">
                  {formatarMoeda(anuncio.valor_nominal)}
                </strong>
              </span>
              <span className="text-slate-600">
                Deságio:{' '}
                <strong className="text-[#07132B] font-bold">
                  {formatarPorcentagem(anuncio.desagio_percentual)}
                </strong>
              </span>
            </div>

            {anuncio.contato_nome && (
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                Anunciante: <strong className="text-slate-700">{anuncio.contato_nome}</strong>
                {anuncio.contato_email ? ` (${anuncio.contato_email})` : ''}
              </div>
            )}
          </div>

          {/* Alerta de Irreversibilidade */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2 text-rose-950">
            <div className="font-bold text-[11px] uppercase tracking-wide text-rose-900">
              Consequências da exclusão
            </div>
            <p className="text-[11px] text-rose-900 leading-relaxed">
              O anúncio deixará de ser exibido na{' '}
              <strong>vitrine pública do Mercado de Créditos</strong> imediatamente. Usuários que
              tentarem visualizar ou intermediar este anúncio não o encontrarão mais. Esta ação{' '}
              <strong>não pode ser revertida</strong>.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={processando}
            className="text-xs border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleConfirmar}
            disabled={processando}
            className="text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white border border-rose-900 shadow-sm"
          >
            {processando ? 'Excluindo...' : 'Confirmar e Excluir Anúncio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
