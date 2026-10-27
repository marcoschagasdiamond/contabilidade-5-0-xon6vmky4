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
import { Label } from '@/components/ui/label'
import type { Cliente } from '@/types/cliente'
import { excluirCliente } from '@/services/clientes'
import { excluirDiagnosticoCompletoPorCliente } from '@/services/diagnosticos'
import { excluirSimulacoesCalculadoraPorCliente } from '@/services/simulacoesCalculadora'
import { excluirHistoricoRelatoriosPorCliente } from '@/services/historicoRelatorios'

export interface DetalhesExclusaoCliente {
  totalDiagnosticos?: number
  totalSimulacoes?: number
  totalRelatorios?: number
}

interface ModalExcluirClienteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente: Cliente | null
  detalhes?: DetalhesExclusaoCliente
  onSucesso: (clienteId: string, mensagem: string) => void
  onErro?: (erroMsg: string) => void
}

/**
 * Modal de confirmação para Excluir cliente.
 * Padrão Diamond Group: Navy (#07132B), Dourado (#D4AF37).
 * REGRA RIGOROSA: SEM ÍCONES na UI — apenas tipografia, badges e marcadores de status.
 * Permite excluir o cadastro do cliente e, opcionalmente (ou por padrão), todos os vínculos:
 * - Diagnósticos das 5 etapas (Configurações, Autoavaliação, Transição, Comparação, Enquadramento)
 * - Simulações da Calculadora IBS/CBS
 * - Versões do Relatório Consolidado
 */
export function ModalExcluirCliente({
  open,
  onOpenChange,
  cliente,
  detalhes,
  onSucesso,
  onErro,
}: ModalExcluirClienteProps) {
  const [excluirDadosVinculados, setExcluirDadosVinculados] = useState(true)
  const [processando, setProcessando] = useState(false)

  if (!cliente) return null

  const handleConfirmarExclusao = async () => {
    try {
      setProcessando(true)

      let diagsRemovidos = 0
      let relatsRemovidos = 0
      let simsRemovidas = 0

      // Se optou por excluir dados vinculados, reutiliza os serviços centralizados
      if (excluirDadosVinculados) {
        // 1. Diagnósticos das 5 etapas + histórico de relatórios
        const resDiag = await excluirDiagnosticoCompletoPorCliente({
          clienteId: cliente.id,
          clienteNome: cliente.nome,
        })
        diagsRemovidos = resDiag.totalDiagnosticosExcluidos
        relatsRemovidos = resDiag.totalRelatoriosExcluidos

        // Garante exclusão do histórico caso reste algum com fallback de nome
        const relatsExtra = await excluirHistoricoRelatoriosPorCliente({
          clienteId: cliente.id,
          clienteNome: cliente.nome,
        })
        relatsRemovidos += relatsExtra

        // 2. Simulações da Calculadora IBS/CBS
        simsRemovidas = await excluirSimulacoesCalculadoraPorCliente(cliente.id)
      }

      // 3. Exclui o cadastro do cliente na coleção clientes
      await excluirCliente(cliente.id)

      let msg = `Cliente "${cliente.nome}" foi excluído com sucesso.`
      if (excluirDadosVinculados) {
        const partes: string[] = []
        if (diagsRemovidos > 0) partes.push(`${diagsRemovidos} diagnóstico(s)`)
        if (simsRemovidas > 0) partes.push(`${simsRemovidas} simulação(ões)`)
        if (relatsRemovidos > 0) partes.push(`${relatsRemovidos} relatório(s)`)
        if (partes.length > 0) {
          msg += ` Dados vinculados removidos: ${partes.join(', ')}.`
        } else {
          msg += ' Vínculos e registros associados foram limpos.'
        }
      }

      onSucesso(cliente.id, msg)
      onOpenChange(false)
    } catch (err: any) {
      console.error('Erro ao excluir cliente:', err)
      const msg = err?.message || 'Falha ao excluir o cliente. Verifique suas permissões.'
      if (onErro) {
        onErro(msg)
      }
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
              Ação Irreversível • Perfil Analista
            </span>
          </div>

          <DialogTitle className="text-base font-bold text-[#07132B]">
            Excluir Cliente da Carteira
          </DialogTitle>

          <DialogDescription className="text-xs text-slate-500">
            Atenção: esta ação remove permanentemente o cadastro do cliente da sua carteira.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          {/* Card do Cliente */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Cliente a ser excluído
            </span>
            <div className="font-bold text-sm text-[#07132B] truncate">{cliente.nome}</div>
            <div className="text-[11px] font-mono text-slate-600">
              {cliente.cnpj_cpf} • {cliente.segmento} ({cliente.uf}) • {cliente.regime_atual}
            </div>
          </div>

          {/* Alerta de Irreversibilidade */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2 text-rose-950">
            <div className="font-bold text-[11px] uppercase tracking-wide text-rose-900">
              Consequências da exclusão permanente
            </div>
            <p className="text-[11px] text-rose-900 leading-relaxed">
              O cadastro do cliente será <strong>completamente removido</strong> da base de dados.
              Se ele estiver selecionado como Cliente Ativo, a seleção será desfeita imediatamente.
              Esta operação <strong>não pode ser desfeita</strong>.
            </p>
          </div>

          {/* Opção para excluir dados vinculados */}
          <div className="bg-[#07132B]/5 border border-[#07132B]/15 rounded-xl p-3.5 space-y-3">
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="check-dados-vinculados"
                checked={excluirDadosVinculados}
                onCheckedChange={(val) => setExcluirDadosVinculados(Boolean(val))}
                className="mt-0.5 border-[#07132B] data-[state=checked]:bg-[#07132B] data-[state=checked]:text-[#D4AF37]"
              />
              <div className="space-y-1">
                <Label
                  htmlFor="check-dados-vinculados"
                  className="text-xs font-bold text-[#07132B] cursor-pointer"
                >
                  Excluir também todos os dados e históricos vinculados a este cliente
                </Label>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Recomendado para manter a base limpa. Serão apagados os seguintes dados vinculados
                  por identificador do cliente:
                </p>
              </div>
            </div>

            {/* Lista dos vínculos afetados */}
            <div className="pl-6 space-y-1 text-[11px] text-slate-700">
              <div className="flex items-center justify-between py-0.5 border-b border-slate-200/60">
                <span>
                  • <strong>Diagnósticos das 5 Etapas:</strong> 01 Configurações, 02 Autoavaliação,
                  03 Transição, 04 Comparação de Regimes e 05 Enquadramento
                </span>
                {typeof detalhes?.totalDiagnosticos === 'number' && (
                  <span className="font-mono font-bold text-[#07132B]">
                    {detalhes.totalDiagnosticos} registro(s)
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between py-0.5 border-b border-slate-200/60">
                <span>
                  • <strong>Simulações da Calculadora:</strong> cálculos salvos e projeções da
                  coleção <em>simulacoes_calculadora</em>
                </span>
                {typeof detalhes?.totalSimulacoes === 'number' && (
                  <span className="font-mono font-bold text-[#07132B]">
                    {detalhes.totalSimulacoes} registro(s)
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between py-0.5">
                <span>
                  • <strong>Versões do Relatório Consolidado:</strong> histórico de emissões e
                  snapshots da coleção <em>historico_relatorios_diagnostico</em>
                </span>
                {typeof detalhes?.totalRelatorios === 'number' && (
                  <span className="font-mono font-bold text-[#07132B]">
                    {detalhes.totalRelatorios} versão(ões)
                  </span>
                )}
              </div>
            </div>

            {!excluirDadosVinculados && (
              <p className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                Aviso: desmarcar esta opção manterá os diagnósticos e simulações como órfãos ou
                genéricos, apenas removendo o cadastro do cliente.
              </p>
            )}
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
            onClick={handleConfirmarExclusao}
            disabled={processando}
            className="text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white border border-rose-900 shadow-sm"
          >
            {processando ? 'Excluindo...' : 'Confirmar e Excluir Definitivamente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
