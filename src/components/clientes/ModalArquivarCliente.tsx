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
import type { Cliente } from '@/types/cliente'
import { arquivarCliente, desarquivarCliente } from '@/services/clientes'

interface ModalArquivarClienteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente: Cliente | null
  modo: 'arquivar' | 'desarquivar'
  onSucesso: (clienteAtualizado: Cliente, mensagem: string) => void
  onErro?: (erroMsg: string) => void
}

/**
 * Modal de confirmação para Arquivar ou Desarquivar cliente.
 * Padrão Diamond Group: Navy (#07132B), Dourado (#D4AF37).
 * REGRA RIGOROSA: SEM ÍCONES na UI — apenas tipografia, badges e marcadores de status.
 */
export function ModalArquivarCliente({
  open,
  onOpenChange,
  cliente,
  modo,
  onSucesso,
  onErro,
}: ModalArquivarClienteProps) {
  const [processando, setProcessando] = useState(false)

  if (!cliente) return null

  const isArquivar = modo === 'arquivar'

  const handleConfirmar = async () => {
    try {
      setProcessando(true)
      let atualizado: Cliente
      if (isArquivar) {
        atualizado = await arquivarCliente(cliente.id)
        onSucesso(
          atualizado,
          `Cliente "${cliente.nome}" foi arquivado com sucesso. Ele foi movido para a aba de Clientes Arquivados.`,
        )
      } else {
        atualizado = await desarquivarCliente(cliente.id)
        onSucesso(
          atualizado,
          `Cliente "${cliente.nome}" foi desarquivado e retornou para a listagem ativa da carteira.`,
        )
      }
      onOpenChange(false)
    } catch (err: any) {
      console.error(`Erro ao ${modo} cliente:`, err)
      const msg = err?.message || `Não foi possível ${modo} o cliente. Tente novamente.`
      if (onErro) {
        onErro(msg)
      }
    } finally {
      setProcessando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-slate-200 bg-white">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] bg-[#07132B] px-2 py-0.5 rounded">
              {isArquivar ? 'Ação Reversível' : 'Reversão de Arquivamento'}
            </span>
          </div>

          <DialogTitle className="text-base font-bold text-[#07132B]">
            {isArquivar ? 'Arquivar Cliente da Carteira' : 'Desarquivar Cliente'}
          </DialogTitle>

          <DialogDescription className="text-xs text-slate-500">
            {isArquivar
              ? 'Confirme para ocultar o cliente da listagem ativa da carteira.'
              : 'Confirme para restaurar o cliente à listagem ativa principal da carteira.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          {/* Card de identificação do cliente */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Cliente selecionado
            </span>
            <div className="font-bold text-sm text-[#07132B] truncate">{cliente.nome}</div>
            <div className="text-[11px] font-mono text-slate-600">
              {cliente.cnpj_cpf} • {cliente.segmento} ({cliente.uf})
            </div>
          </div>

          {/* Explicação das consequências */}
          {isArquivar ? (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2 text-amber-950">
              <div className="font-bold text-[11px] uppercase tracking-wide text-amber-900">
                O que acontece ao arquivar?
              </div>
              <ul className="space-y-1 list-disc list-inside text-[11px] text-amber-900 leading-relaxed">
                <li>O cliente sairá da listagem ativa padrão da carteira.</li>
                <li>
                  <strong>Nenhum dado é apagado:</strong> todo o histórico de diagnósticos (360°,
                  Transição, Regimes, Enquadramento), simulações da Calculadora IBS/CBS e relatórios
                  permanecem intactos.
                </li>
                <li>
                  Esta ação é <strong>totalmente reversível</strong> a qualquer momento através do
                  botão &quot;Desarquivar&quot; na aba de clientes arquivados.
                </li>
              </ul>
            </div>
          ) : (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2 text-emerald-950">
              <div className="font-bold text-[11px] uppercase tracking-wide text-emerald-900">
                O que acontece ao desarquivar?
              </div>
              <ul className="space-y-1 list-disc list-inside text-[11px] text-emerald-900 leading-relaxed">
                <li>O cliente volta a aparecer na listagem ativa principal da carteira.</li>
                <li>Pode ser selecionado como Cliente Ativo para novos cálculos e simulações.</li>
                <li>Todo o histórico prévio segue vinculado normalmente.</li>
              </ul>
            </div>
          )}
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
            className={`text-xs font-bold ${
              isArquivar
                ? 'bg-[#07132B] hover:bg-[#0B1E3F] text-[#D4AF37] border border-[#D4AF37]/40'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
            }`}
          >
            {processando
              ? 'Processando...'
              : isArquivar
                ? 'Confirmar Arquivamento'
                : 'Confirmar Desarquivamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
