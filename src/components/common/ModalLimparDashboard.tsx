import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export interface ModalLimparDashboardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmar: () => void
  titulo?: string
  descricao?: string
  avisoDestaque?: string
}

/**
 * Modal de confirmação para limpar dashboards no padrão visual Diamond Group
 * Paleta: Navy (#07132B) e Dourado (#D4AF37), tipografia clara, estritamente SEM ÍCONES.
 */
export function ModalLimparDashboard({
  open,
  onOpenChange,
  onConfirmar,
  titulo = 'Limpar Dashboard',
  descricao = 'Isso apagará todos os resultados desta análise. Deseja continuar?',
  avisoDestaque = 'Todos os dados de entrada, parâmetros simulados e projeções calculadas serão zerados, retornando o dashboard ao estado inicial sem análise.',
}: ModalLimparDashboardProps) {
  const handleConfirmar = () => {
    onConfirmar()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border border-[#D4AF37]/40 bg-[#07132B] text-white p-6 shadow-2xl">
        <DialogHeader className="space-y-2 text-left">
          <div className="inline-block self-start px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
            DIAMOND GROUP • AÇÃO DE LIMPEZA
          </div>
          <DialogTitle className="text-lg font-bold text-white tracking-tight">
            {titulo}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-300 leading-relaxed">
            {descricao}
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 leading-relaxed">
          {avisoDestaque}
        </div>

        <DialogFooter className="flex-row justify-end gap-2.5 pt-3 border-t border-white/10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold bg-transparent border-slate-600 text-slate-200 hover:bg-white/10 hover:text-white"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleConfirmar}
            className="text-xs font-bold bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B] border border-[#D4AF37] shadow-md"
          >
            Confirmar Limpeza
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
