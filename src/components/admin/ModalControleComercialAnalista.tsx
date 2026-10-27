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
import { Label } from '@/components/ui/label'
import type { UsuarioSistema } from '@/types/master'
import { atualizarControleComercialAnalista } from '@/services/master'

interface ModalControleComercialAnalistaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  analista: UsuarioSistema | null
  usuarioLogadoId?: string
  onSucesso: (mensagem: string) => void
  onErro: (mensagem: string) => void
}

/**
 * Modal de Controle Comercial do Analista
 * Padrão Diamond Group: Navy #07132B, Dourado #D4AF37, SEM ÍCONES na UI.
 * Permite alterar valor mensal (padrão R$ 347, ou customizado) e autorizar/suspender a operação.
 */
export function ModalControleComercialAnalista({
  open,
  onOpenChange,
  analista,
  usuarioLogadoId,
  onSucesso,
  onErro,
}: ModalControleComercialAnalistaProps) {
  const [valorMensal, setValorMensal] = useState<number | ''>(347)
  const [statusOperacao, setStatusOperacao] = useState<'autorizado' | 'suspenso'>('autorizado')
  const [salvando, setSalvando] = useState(false)

  React.useEffect(() => {
    if (analista) {
      setValorMensal(
        typeof analista.valor_mensal_personalizado === 'number'
          ? analista.valor_mensal_personalizado
          : 347,
      )
      setStatusOperacao(analista.status_operacao || 'autorizado')
    }
  }, [analista, open])

  if (!analista) return null

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSalvando(true)
      await atualizarControleComercialAnalista({
        analistaId: analista.id,
        status_operacao: statusOperacao,
        valor_mensal_personalizado: typeof valorMensal === 'number' ? valorMensal : null,
        autorizadorId: usuarioLogadoId,
      })

      const acaoTexto = statusOperacao === 'autorizado' ? 'autorizada' : 'suspensa'
      onSucesso(
        `Controle comercial de "${analista.name}" atualizado: Operação ${acaoTexto} com mensalidade de R$ ${
          typeof valorMensal === 'number' ? valorMensal.toFixed(2) : '347,00'
        }.`,
      )
      onOpenChange(false)
    } catch (err: any) {
      console.error('Erro ao atualizar controle comercial:', err)
      onErro(err?.message || 'Falha ao salvar parâmetros comerciais do analista.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl p-6 rounded-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] bg-[#07132B] px-2.5 py-0.5 rounded">
              Controle Comercial • Diamond Group
            </span>
          </div>
          <DialogTitle className="text-xl font-heading font-bold text-[#07132B]">
            Comercial & Operação do Analista
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Ajuste a mensalidade negociada e autorize ou suspenda o acesso operacional deste
            parceiro.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSalvar} className="space-y-4 my-2 text-xs">
          {/* Card do Analista */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Analista Selecionado
            </span>
            <div className="font-bold text-sm text-[#07132B]">{analista.name}</div>
            <div className="text-[11px] text-slate-600">{analista.email}</div>
          </div>

          {/* Valor Mensal */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="valor-mensal-input" className="text-xs font-bold text-slate-800">
                Valor Mensal Negociado
              </Label>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Tabela Base: R$ 347,00
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              O administrador pode aplicar uma condição especial reduzindo a mensalidade:
            </p>
            <div className="flex items-center gap-2 w-48">
              <div className="flex items-center rounded-xl border border-slate-300 bg-white overflow-hidden w-full focus-within:ring-2 focus-within:ring-[#D4AF37]">
                <span className="px-3 text-xs font-bold text-slate-500">R$</span>
                <input
                  id="valor-mensal-input"
                  type="number"
                  min="0"
                  step="1"
                  value={valorMensal}
                  onChange={(e) =>
                    setValorMensal(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full py-2 pr-3 text-xs text-slate-900 font-bold focus:outline-none"
                  placeholder="347"
                />
              </div>
            </div>
          </div>

          {/* Status da Operação (Autorizar / Suspender) */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
            <Label className="text-xs font-bold text-slate-800 block">
              Status Operacional no Sistema
            </Label>
            <p className="text-[11px] text-slate-500">
              Analista suspenso fica bloqueado de operar ferramentas, diagnósticos e carteira no
              sistema.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStatusOperacao('autorizado')}
                className={`py-2.5 px-3 rounded-xl border text-center font-bold text-xs transition-all ${
                  statusOperacao === 'autorizado'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                Autorizado
              </button>
              <button
                type="button"
                onClick={() => setStatusOperacao('suspenso')}
                className={`py-2.5 px-3 rounded-xl border text-center font-bold text-xs transition-all ${
                  statusOperacao === 'suspenso'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                Suspender Operação
              </button>
            </div>
          </div>

          {/* Histórico de quem autorizou */}
          {analista.autorizado_por_nome && (
            <div className="p-2.5 rounded-lg bg-slate-50 text-[11px] text-slate-500 border border-slate-200">
              Última autorização por <strong>{analista.autorizado_por_nome}</strong>
              {analista.autorizado_em &&
                ` em ${new Date(analista.autorizado_em).toLocaleDateString('pt-BR')}`}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={salvando}
              className="text-xs border-slate-300 text-slate-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={salvando}
              className="text-xs font-bold bg-[#07132B] hover:bg-[#07132B]/90 text-[#D4AF37] border border-[#D4AF37]/50 shadow-md"
            >
              {salvando ? 'Salvando...' : 'Gravar Parâmetros'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
