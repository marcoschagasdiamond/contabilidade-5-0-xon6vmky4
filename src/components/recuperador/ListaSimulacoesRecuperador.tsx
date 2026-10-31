import React, { useState } from 'react'
import type { SimulacaoRecuperador } from '@/types/recuperadorCreditos'
import { formatarMoeda } from '@/lib/calculadoraUtils'
import {
  excluirSimulacaoRecuperador,
  renomearSimulacaoRecuperador,
} from '@/services/simulacoesRecuperador'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ModalExportarDadosSimulacao } from '@/components/calculadora/ModalExportarDadosSimulacao'
import { converterSimulacaoRecuperadorSalvaParaExportacao } from '@/lib/exportacaoRecuperador'
import { ModalGerarPdf, type ResponsavelTecnicoDados } from '@/components/calculadora/ModalGerarPdf'
import { gerarParecerRecuperadorPDF } from '@/lib/pdfRecuperadorCreditos'

interface Props {
  simulacoes: SimulacaoRecuperador[]
  onCarregarSimulacao: (simulacao: SimulacaoRecuperador) => void
  onSimulacaoAtualizada: () => void
}

export function ListaSimulacoesRecuperador({
  simulacoes,
  onCarregarSimulacao,
  onSimulacaoAtualizada,
}: Props) {
  const { toast } = useToast()

  // Estados dos modais de ação
  const [simulacaoParaExportar, setSimulacaoParaExportar] = useState<SimulacaoRecuperador | null>(
    null,
  )
  const [simulacaoParaPdf, setSimulacaoParaPdf] = useState<SimulacaoRecuperador | null>(null)
  const [simulacaoRenomear, setSimulacaoRenomear] = useState<SimulacaoRecuperador | null>(null)
  const [novoNome, setNovoNome] = useState('')
  const [renomeando, setRenomeando] = useState(false)
  const [simulacaoExcluir, setSimulacaoExcluir] = useState<SimulacaoRecuperador | null>(null)
  const [excluindo, setExcluindo] = useState(false)
  const [gerandoPdf, setGerandoPdf] = useState(false)

  const handleSalvarRenomear = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!simulacaoRenomear || !novoNome.trim()) return

    setRenomeando(true)
    try {
      const ok = await renomearSimulacaoRecuperador(simulacaoRenomear, novoNome.trim())
      if (ok) {
        toast({
          title: 'Análise renomeada',
          description: `O cenário foi atualizado para "${novoNome.trim()}".`,
        })
        setSimulacaoRenomear(null)
        onSimulacaoAtualizada()
      } else {
        throw new Error('Falha ao renomear')
      }
    } catch {
      toast({
        title: 'Erro ao renomear',
        description: 'Não foi possível salvar a alteração.',
        variant: 'destructive',
      })
    } finally {
      setRenomeando(false)
    }
  }

  const handleExcluirConfirmado = async () => {
    if (!simulacaoExcluir) return

    setExcluindo(true)
    try {
      await excluirSimulacaoRecuperador(simulacaoExcluir)
      toast({
        title: 'Análise excluída',
        description: 'O registro foi removido com sucesso.',
      })
      setSimulacaoExcluir(null)
      onSimulacaoAtualizada()
    } catch {
      toast({
        title: 'Erro ao excluir',
        variant: 'destructive',
      })
    } finally {
      setExcluindo(false)
    }
  }

  const handleConfirmarPdfIndividual = (dadosTecnico: ResponsavelTecnicoDados) => {
    if (!simulacaoParaPdf) return
    try {
      setGerandoPdf(true)
      gerarParecerRecuperadorPDF({
        nomeAnalise: simulacaoParaPdf.nome,
        parametros: simulacaoParaPdf.parametros,
        resultados: simulacaoParaPdf.resultados,
        clienteNome: simulacaoParaPdf.empresa || simulacaoParaPdf.parametros.configuracoes.empresa,
        empresa: simulacaoParaPdf.empresa || simulacaoParaPdf.parametros.configuracoes.empresa,
        cnpj: simulacaoParaPdf.cnpj || simulacaoParaPdf.parametros.configuracoes.cnpj,
        dataGeracao: new Date(simulacaoParaPdf.created).toLocaleDateString('pt-BR'),
        responsavelTecnico: dadosTecnico,
        observacoesAnalista: dadosTecnico.observacoes,
      })
      toast({
        title: 'Parecer Técnico PDF gerado!',
        description: `O parecer da análise "${simulacaoParaPdf.nome}" foi baixado.`,
      })
      setSimulacaoParaPdf(null)
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar PDF',
        description: err?.message || 'Falha ao compilar o parecer técnico.',
        variant: 'destructive',
      })
    } finally {
      setGerandoPdf(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs font-bold text-[#07132B] uppercase tracking-wider">
          Análises Salvas ({simulacoes.length})
        </span>
      </div>

      {simulacoes.length === 0 ? (
        <div className="p-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
          Nenhuma análise salva ainda.
        </div>
      ) : (
        <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
          {simulacoes.map((sim) => (
            <div
              key={sim.id}
              onClick={() => onCarregarSimulacao(sim)}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-[#D4AF37] bg-white hover:bg-slate-50 cursor-pointer transition-all group"
            >
              <div className="flex items-start justify-between gap-1">
                <span className="text-xs font-bold text-[#07132B] group-hover:text-[#D4AF37] block truncate flex-1 pt-0.5">
                  {sim.nome}
                </span>

                {/* MENU DE AÇÕES (PADRÃO DIAMOND GROUP / CALCULADORA) */}
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="h-6 w-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-[#07132B] font-bold text-xs transition-colors"
                        title="Mais opções da análise"
                      >
                        •••
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-xs w-52">
                      <DropdownMenuItem
                        onClick={() => setSimulacaoParaExportar(sim)}
                        className="cursor-pointer font-bold text-[#07132B]"
                      >
                        Exportar dados (Planilha / PDF)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSimulacaoParaPdf(sim)}
                        className="cursor-pointer"
                      >
                        Baixar Parecer Técnico PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSimulacaoRenomear(sim)
                          setNovoNome(sim.nome)
                        }}
                        className="cursor-pointer"
                      >
                        Renomear
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSimulacaoExcluir(sim)}
                        className="cursor-pointer text-rose-600 focus:text-rose-700"
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                <span className="font-mono text-emerald-600 font-bold">
                  {formatarMoeda(sim.total_recuperavel_integral)}
                </span>
                <span>{new Date(sim.created).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL EXPORTAR DADOS DA ANÁLISE SALVA (PLANILHA CSV / PDF) */}
      <ModalExportarDadosSimulacao
        open={!!simulacaoParaExportar}
        onOpenChange={(open) => !open && setSimulacaoParaExportar(null)}
        moduloOrigem="recuperador"
        dadosRecuperador={
          simulacaoParaExportar
            ? converterSimulacaoRecuperadorSalvaParaExportacao(simulacaoParaExportar)
            : null
        }
        titulo={
          simulacaoParaExportar
            ? `Exportar Dados: "${simulacaoParaExportar.nome}"`
            : 'Exportar Dados do Recuperador'
        }
        descricao="Baixe a planilha com todos os parâmetros e resultados desta análise ou emita o parecer técnico em PDF."
      />

      {/* MODAL DO RESPONSÁVEL TÉCNICO PARA PDF INDIVIDUAL */}
      <ModalGerarPdf
        open={!!simulacaoParaPdf}
        onOpenChange={(open) => !open && setSimulacaoParaPdf(null)}
        titulo={`Emitir Parecer: "${simulacaoParaPdf?.nome}"`}
        descricao="Preencha os dados do Responsável Técnico para inclusão no cabeçalho e parecer do documento."
        modo="individual"
        onConfirmar={handleConfirmarPdfIndividual}
        gerando={gerandoPdf}
      />

      {/* MODAL RENOMEAR */}
      <Dialog
        open={!!simulacaoRenomear}
        onOpenChange={(open) => !open && setSimulacaoRenomear(null)}
      >
        <DialogContent className="sm:max-w-sm border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-[#07132B]">
              Renomear Análise de Créditos
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSalvarRenomear} className="space-y-4 pt-1">
            <Input
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Novo nome da análise"
              className="text-xs"
              autoFocus
              required
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSimulacaoRenomear(null)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={renomeando || !novoNome.trim()}
                className="text-xs bg-[#07132B] hover:bg-[#0B1E3F] text-[#D4AF37]"
              >
                {renomeando ? 'Salvando...' : 'Salvar Nome'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL CONFIRMAÇÃO DE EXCLUSÃO */}
      <AlertDialog
        open={!!simulacaoExcluir}
        onOpenChange={(open) => !open && setSimulacaoExcluir(null)}
      >
        <AlertDialogContent className="border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold text-[#07132B]">
              Excluir análise &quot;{simulacaoExcluir?.nome}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              Esta ação removerá este cenário de recuperação de créditos permanentemente{' '}
              {simulacaoExcluir?.origem === 'nuvem' ? 'da sua conta na nuvem' : 'do navegador'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo} className="text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluirConfirmado}
              disabled={excluindo}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              {excluindo ? 'Excluindo...' : 'Sim, Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
