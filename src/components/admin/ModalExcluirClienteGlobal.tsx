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
import type { ClienteGlobalItem } from '@/types/master'
import { excluirClienteGlobal } from '@/services/master'

interface ModalExcluirClienteGlobalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente: ClienteGlobalItem | null
  onSucesso: (mensagem: string) => void
  onErro: (mensagem: string) => void
}

/**
 * Modal de confirmação para exclusão de cliente na Aba "Clientes — Visão Global"
 * Padrão Diamond Group: Navy (#07132B), Dourado (#D4AF37), SEM ÍCONES na UI.
 * Permite apagar o cliente e, com checkbox marcado por padrão, os dados vinculados:
 * - Diagnósticos das 5 etapas
 * - Simulações da Calculadora
 * - Versões do Relatório Consolidado
 */
export function ModalExcluirClienteGlobal({
  open,
  onOpenChange,
  cliente,
  onSucesso,
  onErro,
}: ModalExcluirClienteGlobalProps) {
  const [excluirDadosVinculados, setExcluirDadosVinculados] = useState(true)
  const [processando, setProcessando] = useState(false)

  if (!cliente) return null

  const handleConfirmar = async () => {
    try {
      setProcessando(true)

      const resultado = await excluirClienteGlobal({
        clienteId: cliente.id,
        clienteNome: cliente.nome || cliente.empresa,
        empresaNome: cliente.empresa,
        collectionOrigem: cliente.collection_origem,
        excluirDadosVinculados,
      })

      let msg = `Cliente "${cliente.nome || cliente.empresa}" excluído com sucesso.`
      if (excluirDadosVinculados) {
        const partes: string[] = []
        if (resultado.totalDiagnosticos > 0)
          partes.push(`${resultado.totalDiagnosticos} diagnóstico(s)`)
        if (resultado.totalSimulacoes > 0)
          partes.push(`${resultado.totalSimulacoes} simulação(ões)`)
        if (resultado.totalRelatorios > 0) partes.push(`${resultado.totalRelatorios} relatório(s)`)
        if (partes.length > 0) {
          msg += ` Vínculos removidos: ${partes.join(', ')}.`
        }
      }

      onSucesso(msg)
      onOpenChange(false)
    } catch (err: any) {
      console.error('Erro ao excluir cliente global:', err)
      onErro(
        err?.message || 'Falha ao excluir o cliente. Verifique suas permissões de administrador.',
      )
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
              Ação Irreversível • Controle Master / Admin
            </span>
          </div>

          <DialogTitle className="text-base font-bold text-[#07132B]">
            Excluir Cliente da Base Global
          </DialogTitle>

          <DialogDescription className="text-xs text-slate-500">
            Atenção: esta ação remove permanentemente o cadastro do cliente da visão global do
            sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          {/* Ficha do Cliente */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Cliente a ser excluído
            </span>
            <div className="font-bold text-sm text-[#07132B] truncate">
              {cliente.nome || cliente.empresa}
            </div>
            <div className="text-[11px] font-mono text-slate-600">
              CNPJ/CPF: {cliente.cnpj_cpf || 'Não informado'} • Segmento: {cliente.segmento} (
              {cliente.uf})
            </div>
            <div className="text-[11px] text-slate-600">
              Origem:{' '}
              <strong className="text-[#07132B]">
                {cliente.origem_tipo === 'analista'
                  ? `Analista: ${cliente.analista_nome || 'Parceiro'}`
                  : 'Cadastro Direto (Empresário)'}
              </strong>
            </div>
          </div>

          {/* Alerta de Irreversibilidade */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2 text-rose-950">
            <div className="font-bold text-[11px] uppercase tracking-wide text-rose-900">
              Consequências da exclusão permanente
            </div>
            <p className="text-[11px] text-rose-900 leading-relaxed">
              O cadastro do cliente será <strong>completamente removido</strong> da base de dados.
              Se este cliente estiver selecionado como Cliente Ativo na Calculadora ou nos
              Diagnósticos, a seleção será desfeita imediatamente. Esta operação{' '}
              <strong>não pode ser desfeita</strong>.
            </p>
          </div>

          {/* Checkbox de dados vinculados */}
          <div className="bg-[#07132B]/5 border border-[#07132B]/15 rounded-xl p-3.5 space-y-3">
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="check-dados-vinculados-global"
                checked={excluirDadosVinculados}
                onCheckedChange={(val) => setExcluirDadosVinculados(Boolean(val))}
                className="mt-0.5 border-[#07132B] data-[state=checked]:bg-[#07132B] data-[state=checked]:text-[#D4AF37]"
              />
              <div className="space-y-1">
                <Label
                  htmlFor="check-dados-vinculados-global"
                  className="text-xs font-bold text-[#07132B] cursor-pointer"
                >
                  Excluir também todos os dados e históricos vinculados a este cliente (Recomendado)
                </Label>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Serão apagados os seguintes dados vinculados por identificador do cliente:
                </p>
              </div>
            </div>

            <div className="pl-6 space-y-1 text-[11px] text-slate-700">
              <div className="flex items-center justify-between py-0.5 border-b border-slate-200/60">
                <span>
                  • <strong>Diagnósticos das 5 Etapas:</strong> 01 Configurações, 02 Autoavaliação,
                  03 Transição, 04 Comparação de Regimes e 05 Enquadramento
                </span>
                <span className="font-mono font-bold text-[#07132B]">
                  {cliente.total_diagnosticos} laudo(s)
                </span>
              </div>

              <div className="flex items-center justify-between py-0.5 border-b border-slate-200/60">
                <span>
                  • <strong>Simulações da Calculadora:</strong> cálculos salvos e projeções da
                  coleção <em>simulacoes_calculadora</em>
                </span>
                <span className="font-mono font-bold text-[#07132B]">
                  {cliente.total_simulacoes} cenário(s)
                </span>
              </div>

              <div className="flex items-center justify-between py-0.5">
                <span>
                  • <strong>Versões do Relatório Consolidado:</strong> histórico de emissões e
                  snapshots salvos
                </span>
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
            onClick={handleConfirmar}
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
