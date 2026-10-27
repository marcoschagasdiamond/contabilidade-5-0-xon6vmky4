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
import type { UsuarioSistema, NivelAcesso } from '@/types/master'
import { excluirUsuario } from '@/services/master'

interface ModalExcluirUsuarioProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario: UsuarioSistema | null
  executorNivel: NivelAcesso
  executorEmail?: string
  masterId?: string
  onSucesso: (mensagem: string) => void
  onErro: (mensagem: string) => void
}

/**
 * Modal de confirmação para exclusão de Usuário na Aba "Usuários & Permissões"
 * Padrão Diamond Group: Navy (#07132B), Dourado (#D4AF37), SEM ÍCONES na UI.
 * REGRAS RIGOROSAS:
 * 1. O master (Marco Chagas, marcoschagasdiamond@icloud.com, nivel_acesso=master) não pode ser excluído nem por si mesmo.
 * 2. Só o master pode excluir admins.
 * 3. Trata vínculos órfãos reassociando ao Master.
 */
export function ModalExcluirUsuario({
  open,
  onOpenChange,
  usuario,
  executorNivel,
  executorEmail,
  masterId,
  onSucesso,
  onErro,
}: ModalExcluirUsuarioProps) {
  const [processando, setProcessando] = useState(false)

  if (!usuario) return null

  const ehMarcoChagas =
    usuario.email?.toLowerCase() === 'marcoschagasdiamond@icloud.com' ||
    usuario.nivel_acesso === 'master'

  const ehAdminAlvo = usuario.nivel_acesso === 'admin'
  const executorEhMaster =
    executorNivel === 'master' || executorEmail?.toLowerCase() === 'marcoschagasdiamond@icloud.com'

  const bloqueioExclusaoAdmin = ehAdminAlvo && !executorEhMaster

  const handleConfirmar = async () => {
    if (ehMarcoChagas) {
      onErro(
        'O Administrador Master (Dr. Marco Chagas) é o titular vitalício e não pode ser excluído.',
      )
      return
    }

    if (bloqueioExclusaoAdmin) {
      onErro('Apenas o Administrador Master tem autoridade para excluir Administradores.')
      return
    }

    try {
      setProcessando(true)

      await excluirUsuario({
        usuarioId: usuario.id,
        executorNivel,
        executorEmail,
        masterId,
      })

      const msg = `Usuário "${usuario.name}" (${usuario.email}) foi removido do sistema com sucesso.`
      onSucesso(msg)
      onOpenChange(false)
    } catch (err: any) {
      console.error('Erro ao excluir usuário:', err)
      onErro(err?.message || 'Falha ao excluir o usuário.')
    } finally {
      setProcessando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-slate-200 bg-white">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200 bg-rose-950 px-2 py-0.5 rounded">
              Ação Irreversível • Gestão de Acessos
            </span>
          </div>

          <DialogTitle className="text-base font-bold text-[#07132B]">
            Excluir Usuário do Sistema
          </DialogTitle>

          <DialogDescription className="text-xs text-slate-500">
            Atenção: esta ação remove permanentemente a conta de acesso deste usuário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          {/* Card do Usuário */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Usuário a ser excluído
            </span>
            <div className="font-bold text-sm text-[#07132B] truncate">{usuario.name}</div>
            <div className="text-[11px] font-mono text-slate-600">
              {usuario.email} • Nível:{' '}
              <span className="uppercase font-bold text-slate-900">{usuario.nivel_acesso}</span>
            </div>
            {usuario.criador_nome && (
              <div className="text-[11px] text-slate-500">
                Eleito / cadastrado por: {usuario.criador_nome}
              </div>
            )}
          </div>

          {/* Bloqueios de Segurança */}
          {ehMarcoChagas ? (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-rose-900 space-y-1">
              <span className="font-bold text-xs uppercase tracking-wide">Operação Bloqueada</span>
              <p className="text-[11px] leading-relaxed">
                O Administrador Master (Dr. Marco Chagas) é o titular vitalício da plataforma
                Contabilidade 5.0. Esta conta não pode ser excluída por nenhum usuário, nem por si
                mesmo.
              </p>
            </div>
          ) : bloqueioExclusaoAdmin ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-900 space-y-1">
              <span className="font-bold text-xs uppercase tracking-wide">Permissão Restrita</span>
              <p className="text-[11px] leading-relaxed">
                Este usuário possui nível de <strong>Administrador</strong>. Conforme a governança
                de controle Master, apenas o titular Master (Dr. Marco Chagas) pode rebaixar ou
                excluir contas administrativas.
              </p>
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2 text-rose-950">
              <div className="font-bold text-[11px] uppercase tracking-wide text-rose-900">
                Consequências da exclusão permanente
              </div>
              <p className="text-[11px] text-rose-900 leading-relaxed">
                O acesso deste usuário será <strong>imediatamente revogado</strong> e seus registros
                de autenticação serão eliminados. Quaisquer registros vinculados (clientes ou
                diagnósticos) serão transferidos para a custódia do Administrador Master para evitar
                orfandade de dados.
              </p>
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

          {!ehMarcoChagas && !bloqueioExclusaoAdmin && (
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmar}
              disabled={processando}
              className="text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white border border-rose-900 shadow-sm"
            >
              {processando ? 'Excluindo...' : 'Confirmar e Excluir Usuário'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
