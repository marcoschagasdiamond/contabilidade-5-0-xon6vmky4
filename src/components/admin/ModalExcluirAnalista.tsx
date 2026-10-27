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
import type { AnalistaMetricasItem } from '@/types/master'
import { excluirAnalista } from '@/services/master'

interface ModalExcluirAnalistaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  analista: AnalistaMetricasItem | null
  todosAnalistas: AnalistaMetricasItem[]
  masterId?: string
  masterNome?: string
  onSucesso: (mensagem: string) => void
  onErro: (mensagem: string) => void
}

/**
 * Modal de confirmação para exclusão de Analista na Aba "Analistas & Parceiros"
 * Padrão Diamond Group: Navy (#07132B), Dourado (#D4AF37), SEM ÍCONES na UI.
 * REGRA ESSENCIAL: NÃO apaga a carteira de clientes. Oferece seletor para escolher
 * para qual analista (ou o Master) os clientes dele serão transferidos antes da exclusão.
 */
export function ModalExcluirAnalista({
  open,
  onOpenChange,
  analista,
  todosAnalistas,
  masterId,
  masterNome = 'Dr. Marco Chagas (Master)',
  onSucesso,
  onErro,
}: ModalExcluirAnalistaProps) {
  // Destinatário padrão: o master ou o primeiro outro analista disponível
  const outrosAnalistas = todosAnalistas.filter((a) => a.id !== analista?.id)
  const defaultDestinoId = masterId || (outrosAnalistas[0]?.id ?? '')

  const [destinoId, setDestinoId] = useState<string>(defaultDestinoId)
  const [processando, setProcessando] = useState(false)

  // Atualiza destinoId quando o modal abrir ou analista mudar
  React.useEffect(() => {
    if (masterId) {
      setDestinoId(masterId)
    } else if (outrosAnalistas.length > 0) {
      setDestinoId(outrosAnalistas[0].id)
    }
  }, [analista?.id, masterId])

  if (!analista) return null

  const ehMarcoChagas =
    analista.email?.toLowerCase() === 'marcoschagasdiamond@icloud.com' ||
    analista.nivel_acesso === 'master'

  const handleConfirmar = async () => {
    if (ehMarcoChagas) {
      onErro('O Administrador Master (Dr. Marco Chagas) é vitalício e não pode ser excluído.')
      return
    }

    if (!destinoId) {
      onErro('Selecione um analista ou o Master para receber a carteira de clientes.')
      return
    }

    try {
      setProcessando(true)

      const res = await excluirAnalista({
        analistaId: analista.id,
        analistaDestinoId: destinoId,
      })

      const destinoNome =
        destinoId === masterId
          ? masterNome
          : todosAnalistas.find((a) => a.id === destinoId)?.name || 'novo responsável'

      const msg = `Analista "${analista.name}" foi excluído. ${res.totalTransferidos} cliente(s) e registros vinculados foram transferidos com sucesso para "${destinoNome}".`
      onSucesso(msg)
      onOpenChange(false)
    } catch (err: any) {
      console.error('Erro ao excluir analista:', err)
      onErro(err?.message || 'Falha ao excluir o analista e transferir sua carteira.')
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
              Ação Irreversível • Gestão de Analistas
            </span>
          </div>

          <DialogTitle className="text-base font-bold text-[#07132B]">
            Excluir Analista & Transferir Carteira
          </DialogTitle>

          <DialogDescription className="text-xs text-slate-500">
            O analista será removido, mas seus clientes e laudos serão preservados e transferidos
            integralmente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          {/* Card do Analista a Excluir */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Analista selecionado para exclusão
            </span>
            <div className="font-bold text-sm text-[#07132B] truncate">{analista.name}</div>
            <div className="text-[11px] font-mono text-slate-600">
              {analista.email} • Nível:{' '}
              <span className="uppercase font-semibold">{analista.nivel_acesso}</span>
            </div>
            <div className="text-[11px] text-slate-700 font-semibold pt-1">
              Carteira vinculada: {analista.total_clientes} cliente(s) •{' '}
              {analista.total_diagnosticos} diagnóstico(s) • {analista.total_simulacoes}{' '}
              simulação(ões)
            </div>
          </div>

          {/* Bloqueio se for o Master */}
          {ehMarcoChagas ? (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-rose-900 space-y-1">
              <span className="font-bold text-xs">Operação Proibida</span>
              <p className="text-[11px]">
                Dr. Marco Chagas é o Administrador Master vitalício da Contabilidade 5.0. Sua conta
                não pode ser excluída do sistema.
              </p>
            </div>
          ) : (
            <>
              {/* Alerta de Preservação da Carteira */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1.5 text-amber-950">
                <div className="font-bold text-[11px] uppercase tracking-wide text-amber-900">
                  Regra de Preservação de Carteira
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  A exclusão do analista <strong>NÃO apaga os clientes nem seus laudos</strong>.
                  Todos os registros vinculados à carteira deste analista serão imediatamente
                  transferidos para o novo responsável selecionado abaixo.
                </p>
              </div>

              {/* Seletor de Destino da Carteira */}
              <div className="bg-[#07132B]/5 border border-[#07132B]/15 rounded-xl p-3.5 space-y-2">
                <Label
                  htmlFor="seletor-destino-analista"
                  className="text-xs font-bold text-[#07132B] block"
                >
                  Transferir clientes e diagnósticos para:
                </Label>
                <select
                  id="seletor-destino-analista"
                  value={destinoId}
                  onChange={(e) => setDestinoId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white font-medium focus:ring-2 focus:ring-[#D4AF37]/50 focus:outline-none"
                >
                  {masterId && (
                    <option value={masterId}>{masterNome} (Administrador Master)</option>
                  )}
                  {outrosAnalistas
                    .filter((a) => a.id !== masterId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.email}) — {a.total_clientes} clientes atuais
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-slate-600">
                  Os {analista.total_clientes} cliente(s) terão seus vínculos (owner/user_id)
                  atualizados imediatamente para o destino escolhido.
                </p>
              </div>
            </>
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

          {!ehMarcoChagas && (
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmar}
              disabled={processando || !destinoId}
              className="text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white border border-rose-900 shadow-sm disabled:opacity-50"
            >
              {processando ? 'Transferindo & Excluindo...' : 'Transferir Carteira e Excluir'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
