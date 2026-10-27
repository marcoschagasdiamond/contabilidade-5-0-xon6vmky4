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
import type { UsuarioSistema } from '@/types/master'
import { excluirClienteGlobal, excluirUsuario } from '@/services/master'

interface ModalExcluirEmpresarioProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario: UsuarioSistema | null
  executorNivel: string
  executorEmail?: string
  masterId?: string
  onSucesso: (mensagem: string) => void
  onErro: (mensagem: string) => void
}

/**
 * Modal de Exclusão de Empresário / Cliente
 * Padrão Diamond Group: Navy #07132B, Dourado #D4AF37, SEM ÍCONES na UI.
 * Avisa que existem dados vinculados (diagnósticos e simulações) e oferece
 * excluir também esses dados vinculados (checkbox marcado por padrão),
 * reutilizando a exclusão centralizada já existente no app (excluirClienteGlobal).
 */
export function ModalExcluirEmpresario({
  open,
  onOpenChange,
  usuario,
  executorNivel,
  executorEmail,
  masterId,
  onSucesso,
  onErro,
}: ModalExcluirEmpresarioProps) {
  const [excluirDadosVinculados, setExcluirDadosVinculados] = useState(true)
  const [processando, setProcessando] = useState(false)

  if (!usuario) return null

  const handleConfirmar = async () => {
    try {
      setProcessando(true)

      let totalDiag = 0
      let totalSim = 0

      // 1. Se marcado para excluir dados vinculados, invoca a exclusão centralizada
      if (excluirDadosVinculados) {
        try {
          const res = await excluirClienteGlobal({
            clienteId: usuario.id,
            clienteNome: usuario.name,
            empresaNome: usuario.name,
            collectionOrigem: 'clientes_empresas',
            excluirDadosVinculados: true,
          })
          totalDiag = res.totalDiagnosticos
          totalSim = res.totalSimulacoes
        } catch (e) {
          console.warn('Tentativa de exclusão global complementar:', e)
        }
      }

      // 2. Remove o registro de autenticação na coleção users
      await excluirUsuario({
        usuarioId: usuario.id,
        executorNivel: executorNivel as any,
        executorEmail,
        masterId,
      })

      const msg = excluirDadosVinculados
        ? `Empresário "${usuario.name}" (${usuario.email}) e todos os seus dados vinculados (${totalDiag} diagnósticos, ${totalSim} simulações) foram excluídos com sucesso.`
        : `Empresário "${usuario.name}" (${usuario.email}) foi removido do sistema com sucesso.`

      onSucesso(msg)
      onOpenChange(false)
    } catch (err: any) {
      console.error('Erro ao excluir empresário:', err)
      onErro(err?.message || 'Falha ao excluir a conta do empresário.')
    } finally {
      setProcessando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl p-6 rounded-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-900 bg-rose-100 px-2.5 py-0.5 rounded">
              Exclusão Permanente de Cliente
            </span>
          </div>
          <DialogTitle className="text-xl font-heading font-bold text-[#07132B]">
            Excluir Conta do Empresário
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            A conta de acesso à plataforma será permanentemente eliminada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 text-xs">
          {/* Card do Usuário */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Empresário Selecionado
            </span>
            <div className="font-bold text-sm text-[#07132B]">{usuario.name}</div>
            <div className="text-[11px] text-slate-600">{usuario.email}</div>
            <div className="text-[11px] text-slate-500 pt-1">
              {usuario.total_diagnosticos || 0} diagnóstico(s) • {usuario.total_simulacoes || 0}{' '}
              simulação(ões) vinculados
            </div>
          </div>

          {/* Aviso sobre dados vinculados */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
              Dados Vinculados Identificados
            </span>
            <p className="text-[11px] leading-relaxed">
              Existem cálculos tributários, simulações na Calculadora IBS/CBS e diagnósticos 360°
              associados a esta empresa.
            </p>

            <label className="flex items-start gap-2.5 pt-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={excluirDadosVinculados}
                onChange={(e) => setExcluirDadosVinculados(e.target.checked)}
                className="mt-0.5 rounded text-[#07132B] focus:ring-[#D4AF37]"
              />
              <span className="text-xs font-bold text-slate-900">
                Excluir também todos os dados vinculados (diagnósticos, pareceres e simulações)
              </span>
            </label>
            <p className="text-[10px] text-slate-500 pl-6">
              Recomendado para limpeza completa. Se desmarcado, os relatórios permanecerão na base
              sob custódia administrativa.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={processando}
            className="text-xs border-slate-300 text-slate-700"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirmar}
            disabled={processando}
            className="text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white shadow-sm"
          >
            {processando ? 'Excluindo...' : 'Confirmar e Excluir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
