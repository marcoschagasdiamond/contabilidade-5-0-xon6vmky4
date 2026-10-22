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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { salvarSimulacaoRecuperador } from '@/services/simulacoesRecuperador'
import type {
  ParametrosRecuperador,
  ResultadosRecuperador,
  SimulacaoRecuperador,
} from '@/types/recuperadorCreditos'
import { formatarMoeda } from '@/lib/calculadoraUtils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  parametros: ParametrosRecuperador
  resultados: ResultadosRecuperador
  onSalvoComSucesso?: (simulacao: SimulacaoRecuperador) => void
}

export function ModalSalvarRecuperador({
  open,
  onOpenChange,
  parametros,
  resultados,
  onSalvoComSucesso,
}: Props) {
  const { user } = useAuth()
  const { clienteAtivo } = useClienteAtivo()
  const { toast } = useToast()

  const [nome, setNome] = useState('')
  const [salvando, setSalvando] = useState(false)

  React.useEffect(() => {
    if (open) {
      const empresaNome = clienteAtivo?.nome || parametros.configuracoes.empresa || 'Empresa'
      const dataHoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      setNome(`Recuperação 60m - ${empresaNome} (${dataHoje})`)
    }
  }, [open, clienteAtivo, parametros.configuracoes.empresa])

  const handleSalvar = async () => {
    if (!nome.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe um nome descritivo para identificar este cenário.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSalvando(true)
      const empresaFinal = clienteAtivo?.nome || parametros.configuracoes.empresa || ''
      const cnpjFinal = clienteAtivo?.cnpj_cpf || parametros.configuracoes.cnpj || ''

      const salva = await salvarSimulacaoRecuperador({
        nome: nome.trim(),
        parametros,
        resultados,
        empresa: empresaFinal,
        cnpj: cnpjFinal,
        regimeAtual: parametros.configuracoes.regimeAtual,
        userId: user?.id,
        clienteId: clienteAtivo?.id || null,
      })

      toast({
        title: 'Análise salva com sucesso!',
        description: `O diagnóstico de créditos de "${salva.nome}" foi registrado na sua Carteira.`,
      })

      onOpenChange(false)
      if (onSalvoComSucesso) onSalvoComSucesso(salva)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar análise',
        description: err?.message || 'Não foi possível gravar o registro.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white text-slate-800 rounded-2xl border border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-[#07132B]">
            Salvar Análise de Créditos
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Grave este levantamento para consulta na Carteira de Clientes e no histórico da empresa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div>
            <Label className="text-xs font-bold text-slate-700">Nome do Levantamento</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Auditoria Créditos 60m"
              className="mt-1"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Cliente Vinculado:</span>
              <span className="font-bold text-[#07132B]">
                {clienteAtivo?.nome || 'Nenhum cliente selecionado (Geral)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Regime Atual:</span>
              <span className="font-bold text-slate-700">
                {parametros.configuracoes.regimeAtual}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Total Integral c/ SELIC:</span>
              <span className="font-mono font-bold text-emerald-600">
                {formatarMoeda(resultados.totalIntegralCorrigido)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Cenário Conservador:</span>
              <span className="font-mono font-bold text-[#D4AF37]">
                {formatarMoeda(resultados.totalConservadorCorrigido)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSalvar}
            disabled={salvando}
            className="bg-[#D4AF37] text-[#07132B] hover:bg-[#c49f2e] font-bold"
          >
            {salvando ? 'Salvando...' : 'Confirmar e Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
