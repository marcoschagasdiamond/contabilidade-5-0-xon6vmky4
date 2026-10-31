import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { formatarMoeda } from '@/lib/calculadoraUtils'
import { ModalGerarPdf, type ResponsavelTecnicoDados } from '@/components/calculadora/ModalGerarPdf'
import { ModalExportarDadosSimulacao } from '@/components/calculadora/ModalExportarDadosSimulacao'
import { ModalHistoricoSimulacao } from '@/components/calculadora/ModalHistoricoSimulacao'
import { converterSimulacaoSalvaParaExportacao } from '@/lib/exportacaoCalculadora'
import { gerarRelatorioSimulacaoPDF } from '@/lib/pdfSimulacaoCalculadora'
import { excluirSimulacao, renomearSimulacao } from '@/services/simulacoesCalculadora'
import type { SimulacaoCalculadora } from '@/types/simulacaoCalculadora'
import {
  FolderOpen,
  Cloud,
  HardDrive,
  MoreVertical,
  Pencil,
  Trash2,
  FileDown,
  RotateCcw,
  Scale,
  Calendar,
  Building2,
  CheckCircle2,
} from 'lucide-react'

interface ListaSimulacoesProps {
  simulacoes: SimulacaoCalculadora[]
  onCarregarSimulacao: (simulacao: SimulacaoCalculadora) => void
  onSimulacaoAtualizada: () => void
  selecionadasParaComparar: string[]
  onToggleSelecionada: (id: string) => void
  onAbrirComparador: () => void
  onAbrirPdfComparativo?: () => void
}

export function ListaSimulacoes({
  simulacoes,
  onCarregarSimulacao,
  onSimulacaoAtualizada,
  selecionadasParaComparar,
  onToggleSelecionada,
  onAbrirComparador,
  onAbrirPdfComparativo,
}: ListaSimulacoesProps) {
  const { toast } = useToast()
  const { clienteAtivo, clientes } = useClienteAtivo()

  // Estado para exclusão
  const [simulacaoExcluir, setSimulacaoExcluir] = useState<SimulacaoCalculadora | null>(null)
  const [excluindo, setExcluindo] = useState(false)
  const [simulacaoHistorico, setSimulacaoHistorico] = useState<SimulacaoCalculadora | null>(null)

  // Estado para renomear
  const [simulacaoRenomear, setSimulacaoRenomear] = useState<SimulacaoCalculadora | null>(null)
  const [novoNome, setNovoNome] = useState('')
  const [renomeando, setRenomeando] = useState(false)

  // Estado para gerar PDF Individual com Modal de Responsável Técnico
  const [simulacaoParaPdf, setSimulacaoParaPdf] = useState<SimulacaoCalculadora | null>(null)
  const [gerandoPdf, setGerandoPdf] = useState(false)

  // Estado para Exportar Dados da Simulação Salva (Planilha CSV + Relatório PDF)
  const [simulacaoParaExportar, setSimulacaoParaExportar] = useState<SimulacaoCalculadora | null>(
    null,
  )

  const handleExcluir = async () => {
    if (!simulacaoExcluir) return
    try {
      setExcluindo(true)
      const ok = await excluirSimulacao(simulacaoExcluir)
      if (ok) {
        toast({
          title: 'Simulação excluída',
          description: `O cenário "${simulacaoExcluir.nome}" foi removido.`,
        })
        onSimulacaoAtualizada()
      } else {
        toast({
          title: 'Erro ao excluir',
          description: 'Não foi possível remover a simulação.',
          variant: 'destructive',
        })
      }
    } finally {
      setExcluindo(false)
      setSimulacaoExcluir(null)
    }
  }

  const handleSalvarRenomear = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!simulacaoRenomear || !novoNome.trim()) return
    try {
      setRenomeando(true)
      const ok = await renomearSimulacao(simulacaoRenomear, novoNome.trim())
      if (ok) {
        toast({
          title: 'Simulação renomeada',
          description: 'O nome do cenário foi atualizado com sucesso.',
        })
        onSimulacaoAtualizada()
        setSimulacaoRenomear(null)
      } else {
        toast({
          title: 'Erro ao renomear',
          description: 'Não foi possível atualizar o nome.',
          variant: 'destructive',
        })
      }
    } finally {
      setRenomeando(false)
    }
  }

  const handleAbrirModalPdfIndividual = (sim: SimulacaoCalculadora) => {
    setSimulacaoParaPdf(sim)
  }

  const handleConfirmarPdfIndividual = (dadosTecnico: ResponsavelTecnicoDados) => {
    if (!simulacaoParaPdf) return
    try {
      setGerandoPdf(true)
      // Se a simulação tem cliente_id, buscar nome do cliente
      const clienteDaSimulacao = simulacaoParaPdf.cliente_id
        ? clientes.find((c) => c.id === simulacaoParaPdf.cliente_id)
        : clienteAtivo
      const nomeClienteFinal = clienteDaSimulacao?.nome

      gerarRelatorioSimulacaoPDF({
        nomeSimulacao: simulacaoParaPdf.nome,
        parametros: simulacaoParaPdf.parametros,
        resultados: simulacaoParaPdf.resultados,
        empresa: nomeClienteFinal || simulacaoParaPdf.empresa,
        clienteNome: nomeClienteFinal,
        cnpj: clienteDaSimulacao?.cnpj_cpf || simulacaoParaPdf.cnpj,
        dataGeracao: new Date(simulacaoParaPdf.created).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        responsavelTecnico: dadosTecnico,
        observacoesContador: dadosTecnico.observacoes,
      })
      toast({
        title: 'Relatório PDF gerado!',
        description: `O arquivo da simulação "${simulacaoParaPdf.nome}" foi baixado.`,
      })
      setSimulacaoParaPdf(null)
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar PDF',
        description: err?.message || 'Falha na renderização do PDF.',
        variant: 'destructive',
      })
    } finally {
      setGerandoPdf(false)
    }
  }

  if (simulacoes.length === 0) {
    return (
      <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
        <FolderOpen className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
        <span className="text-xs font-semibold text-slate-700 block">Nenhuma simulação salva</span>
        <span className="text-[11px] text-slate-500 block mt-0.5">
          Clique em &quot;Salvar Simulação&quot; no topo para registrar seu primeiro cenário.
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Barra de ação do comparador se houver simulações selecionadas */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="text-xs font-bold text-[#07132B] flex items-center gap-1.5">
          <span>Minhas Simulações</span>
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-mono">
            {simulacoes.length}
          </Badge>
        </div>

        {selecionadasParaComparar.length >= 2 && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="sm"
              onClick={onAbrirComparador}
              className="h-7 text-xs bg-[#07132B] hover:bg-[#0B1E3F] text-[#D4AF37] font-bold"
            >
              Comparar ({selecionadasParaComparar.length})
            </Button>
            {onAbrirPdfComparativo && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onAbrirPdfComparativo}
                className="h-7 text-[11px] border-[#D4AF37] text-[#0A1A13] hover:bg-[#D4AF37]/10 font-bold"
                title="Baixar PDF Comparativo dos cenários marcados"
              >
                PDF Comparativo
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {simulacoes.map((sim) => {
          const isSelecionada = selecionadasParaComparar.includes(sim.id)

          return (
            <div
              key={sim.id}
              className={`p-2.5 rounded-xl border transition-all text-xs bg-white ${
                isSelecionada
                  ? 'border-[#D4AF37] bg-[#D4AF37]/5 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <div className="pt-0.5">
                    <Checkbox
                      id={`chk-${sim.id}`}
                      checked={isSelecionada}
                      onCheckedChange={() => onToggleSelecionada(sim.id)}
                      className="data-[state=checked]:bg-[#07132B] data-[state=checked]:border-[#07132B]"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#07132B] truncate block">{sim.nome}</span>
                      {sim.origem === 'nuvem' ? (
                        <span title="Salva na nuvem">
                          <Cloud className="w-3 h-3 text-sky-600 shrink-0" />
                        </span>
                      ) : (
                        <span title="Salva local">
                          <HardDrive className="w-3 h-3 text-slate-400 shrink-0" />
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                      <span>Fat: {formatarMoeda(sim.parametros.faturamentoMensal)}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold">
                        Rec: {sim.resultados.resultadoDashboard.regimeRecomendado}
                      </span>
                      {sim.parametros.config?.presetSetor &&
                        sim.parametros.config.presetSetor !== 'nenhum' && (
                          <>
                            <span>•</span>
                            <span className="text-amber-800 font-medium">Preset LC 214</span>
                          </>
                        )}
                    </div>

                    <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(sim.created).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                      {sim.empresa && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[110px]">{sim.empresa}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu de Ações da Simulação */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => onCarregarSimulacao(sim)}
                    title="Restaurar parâmetros deste cenário na tela"
                    className="h-7 px-2 text-[11px] text-[#07132B] hover:bg-slate-100 font-semibold"
                  >
                    <RotateCcw className="w-3 h-3 mr-1 text-[#D4AF37]" />
                    Carregar
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-xs">
                      <DropdownMenuItem
                        onClick={() => setSimulacaoParaExportar(sim)}
                        className="cursor-pointer font-bold text-[#07132B]"
                      >
                        Exportar dados (Planilha / PDF)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleAbrirModalPdfIndividual(sim)}
                        className="cursor-pointer"
                      >
                        Baixar Relatório PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSimulacaoHistorico(sim)}
                        className="cursor-pointer"
                      >
                        Histórico de Alterações
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
                        className="cursor-pointer gap-2 text-rose-600 focus:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* MODAL RENOMEAR */}
      <Dialog
        open={!!simulacaoRenomear}
        onOpenChange={(open) => !open && setSimulacaoRenomear(null)}
      >
        <DialogContent className="sm:max-w-sm border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-[#07132B]">
              Renomear Simulação
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSalvarRenomear} className="space-y-4 pt-1">
            <Input
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Novo nome do cenário"
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

      {/* MODAL DO RESPONSÁVEL TÉCNICO PARA PDF INDIVIDUAL */}
      <ModalGerarPdf
        open={!!simulacaoParaPdf}
        onOpenChange={(open) => !open && setSimulacaoParaPdf(null)}
        titulo={`Emitir Relatório: "${simulacaoParaPdf?.nome}"`}
        descricao="Preencha os dados do Responsável Técnico para inclusão no cabeçalho e parecer do documento."
        modo="individual"
        onConfirmar={handleConfirmarPdfIndividual}
        gerando={gerandoPdf}
      />

      {/* MODAL EXPORTAR DADOS DA SIMULAÇÃO SELECIONADA NO HISTÓRICO */}
      <ModalExportarDadosSimulacao
        open={!!simulacaoParaExportar}
        onOpenChange={(open) => !open && setSimulacaoParaExportar(null)}
        dadosSimulacao={
          simulacaoParaExportar
            ? converterSimulacaoSalvaParaExportacao(simulacaoParaExportar)
            : null
        }
        titulo={
          simulacaoParaExportar
            ? `Exportar Dados: "${simulacaoParaExportar.nome}"`
            : 'Exportar Dados'
        }
        descricao="Baixe a planilha com todos os parâmetros e resultados deste cenário ou emita o relatório técnico em PDF."
      />

      {/* MODAL HISTÓRICO DE ALTERAÇÕES */}
      <ModalHistoricoSimulacao
        open={!!simulacaoHistorico}
        onOpenChange={(open) => !open && setSimulacaoHistorico(null)}
        simulacaoId={simulacaoHistorico?.id || null}
        simulacaoNome={simulacaoHistorico?.nome}
        empresa={simulacaoHistorico?.empresa}
        tipoSimulacao="calculadora"
      />

      {/* MODAL CONFIRMAÇÃO DE EXCLUSÃO */}
      <AlertDialog
        open={!!simulacaoExcluir}
        onOpenChange={(open) => !open && setSimulacaoExcluir(null)}
      >
        <AlertDialogContent className="border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold text-[#07132B]">
              Excluir simulação &quot;{simulacaoExcluir?.nome}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              Esta ação removerá este cenário permanentemente{' '}
              {simulacaoExcluir?.origem === 'nuvem' ? 'da sua conta na nuvem' : 'do navegador'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo} className="text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluir}
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
