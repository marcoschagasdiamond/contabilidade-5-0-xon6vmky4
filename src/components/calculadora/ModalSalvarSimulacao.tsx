import React, { useState } from 'react'
import { Link } from 'react-router-dom'
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
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { salvarSimulacao } from '@/services/simulacoesCalculadora'
import { registrarSimulacaoUsada, LIMITE_SIMULACOES_GRATUITO } from '@/services/freemium'
import { PaywallModal } from '@/components/freemium/PaywallModal'
import type {
  ParametrosSimulacaoCalculadora,
  ResultadosSimulacaoCalculadora,
  SimulacaoCalculadora,
} from '@/types/simulacaoCalculadora'
import {
  BookmarkPlus,
  CheckCircle2,
  Cloud,
  HardDrive,
  LogIn,
  Sparkles,
  Building2,
} from 'lucide-react'

interface ModalSalvarSimulacaoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parametros: ParametrosSimulacaoCalculadora
  resultados: ResultadosSimulacaoCalculadora
  onSalvoComSucesso: (simulacao: SimulacaoCalculadora) => void
}

export function ModalSalvarSimulacao({
  open,
  onOpenChange,
  parametros,
  resultados,
  onSalvoComSucesso,
}: ModalSalvarSimulacaoProps) {
  const { user, isAuthenticated, isPremium, podeSimular, simulacoesUsadas, recarregarUsuario } =
    useAuth()
  const { toast } = useToast()

  const [nome, setNome] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [preferirLocal, setPreferirLocal] = useState(false)
  const [paywallAberto, setPaywallAberto] = useState(false)
  // Preenche sugestão de nome ao abrir
  React.useEffect(() => {
    if (open && !nome) {
      const dataStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      const sugestao = `Cenário ${parametros.tipoAtividade} (${dataStr})`
      setNome(sugestao)
      if (parametros.empresa && !empresa) {
        setEmpresa(parametros.empresa)
      }
    }
  }, [open, parametros.tipoAtividade, parametros.empresa])

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, dê um nome para identificar esta simulação.',
        variant: 'destructive',
      })
      return
    }

    // Regra freemium: se for gratuito e já atingiu o limite de 3 simulações, disparar Paywall
    if (!podeSimular) {
      setPaywallAberto(true)
      return
    }

    try {
      setSalvando(true)
      const simulacao = await salvarSimulacao({
        nome: nome.trim(),
        parametros: {
          ...parametros,
          empresa: empresa.trim() || parametros.empresa,
        },
        resultados,
        empresa: empresa.trim() || parametros.empresa,
        cnpj: parametros.cnpj,
        userId: preferirLocal ? null : user?.id,
      })

      // Registra o uso no backend/localStorage e atualiza contexto
      await registrarSimulacaoUsada(user?.id)
      await recarregarUsuario()

      toast({
        title: 'Simulação salva com sucesso!',
        description:
          simulacao.origem === 'nuvem'
            ? 'Cenário salvo na sua conta com sincronização em nuvem.'
            : 'Cenário salvo localmente no seu navegador.',
      })

      onSalvoComSucesso(simulacao)
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar simulação',
        description: err?.message || 'Ocorreu um erro ao persistir o cenário.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-slate-200">
        <DialogHeader>
          <div className="flex items-center gap-2 text-[#07132B]">
            <div className="w-9 h-9 rounded-xl bg-[#07132B] text-[#D4AF37] flex items-center justify-center shrink-0">
              <BookmarkPlus className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-[#07132B]">
                Salvar Simulação da Calculadora
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Grave os parâmetros completos dos 6 módulos para recarregar ou comparar depois.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSalvar} className="space-y-4 pt-2">
          {/* Identificação do estado de login */}
          {!isAuthenticated && !preferirLocal ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <LogIn className="w-4 h-4 text-amber-600 shrink-0" />
                Deseja vincular este cenário à sua conta?
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Você ainda não está conectado. Crie sua conta ou faça login para acessar suas
                simulações em qualquer dispositivo, ou salve agora neste navegador como fallback.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  type="button"
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs bg-white border-amber-300 text-amber-950 hover:bg-amber-100"
                >
                  <Link to="/login" target="_blank" rel="noopener noreferrer">
                    Fazer Login
                  </Link>
                </Button>
                <Button
                  type="button"
                  asChild
                  size="sm"
                  className="h-7 text-xs bg-[#07132B] text-[#D4AF37] hover:bg-[#0B1E3F]"
                >
                  <Link to="/cadastro" target="_blank" rel="noopener noreferrer">
                    Criar Conta Gratuita
                  </Link>
                </Button>
                <button
                  type="button"
                  onClick={() => setPreferirLocal(true)}
                  className="text-[11px] underline text-amber-800 hover:text-amber-950 ml-auto"
                >
                  Continuar sem login
                </button>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                {isAuthenticated && !preferirLocal ? (
                  <>
                    <Cloud className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Salvando na conta de <strong>{user?.name || user?.email}</strong>
                    </span>
                  </>
                ) : (
                  <>
                    <HardDrive className="w-4 h-4 text-slate-600 shrink-0" />
                    <span className="text-slate-700">Salvando localmente no navegador</span>
                  </>
                )}
              </div>
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => setPreferirLocal(!preferirLocal)}
                  className="text-[10px] text-slate-500 hover:text-slate-800 underline"
                >
                  {preferirLocal ? 'Salvar na nuvem' : 'Salvar local'}
                </button>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="nome-simulacao" className="text-xs font-semibold text-slate-700">
              Nome do Cenário / Simulação *
            </Label>
            <Input
              id="nome-simulacao"
              placeholder="Ex.: Cenário A - Expansão com Lucro Real"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="text-xs"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="empresa-simulacao" className="text-xs font-semibold text-slate-700">
              Empresa (opcional para o relatório)
            </Label>
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <Input
                id="empresa-simulacao"
                placeholder="Ex.: Diamond Soluções Digitais Ltda"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                className="text-xs pl-8"
              />
            </div>
          </div>

          {/* Resumo do que será arquivado */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center gap-1 font-bold text-[#07132B]">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              Resumo do Snapshot
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-1 text-[10px]">
              <div>
                Faturamento:{' '}
                <strong>
                  R${' '}
                  {parametros.faturamentoMensal.toLocaleString('pt-BR', {
                    maximumFractionDigits: 0,
                  })}
                  /mês
                </strong>
              </div>
              <div>
                Recomendado:{' '}
                <strong className="text-emerald-700">
                  {resultados.resultadoDashboard.regimeRecomendado}
                </strong>
              </div>
              <div>
                Fase Transição:{' '}
                <strong>
                  {parametros.config.anoTransicao === 'atual'
                    ? 'Ano atual (sistema atual)'
                    : parametros.config.anoTransicao
                      ? `${parametros.config.anoTransicao}`
                      : '2033 (Pleno)'}
                </strong>
              </div>
              <div>
                Alíq. Efetiva Nova:{' '}
                <strong>{resultados.resultadoDashboard.aliquotaEfetivaNova.toFixed(2)}%</strong>
              </div>
              <div>
                Economia Anual:{' '}
                <strong className="text-emerald-700">
                  R${' '}
                  {resultados.resultadoDashboard.economiaAnualProjetada.toLocaleString('pt-BR', {
                    maximumFractionDigits: 0,
                  })}
                </strong>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={salvando}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={salvando || !nome.trim()}
              className="text-xs bg-[#07132B] hover:bg-[#0B1E3F] text-[#D4AF37] font-semibold flex items-center gap-1.5"
            >
              {salvando ? (
                'Salvando...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Salvar Cenário
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <PaywallModal open={paywallAberto} onOpenChange={setPaywallAberto} motivo="simulacao" />
    </Dialog>
  )
}
