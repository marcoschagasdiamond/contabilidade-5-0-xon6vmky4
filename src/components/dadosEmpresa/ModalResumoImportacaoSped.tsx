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
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Building2,
  Percent,
  Coins,
  MapPin,
  HelpCircle,
} from 'lucide-react'
import { ResultadoParsingSped, CampoExtracaoComparativo } from '@/lib/parseSpedFiscal'
import { ResultadoParsingLoteNfe } from '@/lib/parseNfeLote'

interface ModalResumoImportacaoSpedProps {
  aberto: boolean
  onFechar: () => void
  resultado: ResultadoParsingSped | null
  itensInformativos?: { rotulo: string; valor: number; descricao: string }[]
  resultadoNfe?: ResultadoParsingLoteNfe | null
  onConfirmar: (chavesSelecionadas?: string[]) => void
  salvando?: boolean
}

export const ModalResumoImportacaoSped: React.FC<ModalResumoImportacaoSpedProps> = ({
  aberto,
  onFechar,
  resultado,
  itensInformativos,
  onConfirmar,
  salvando = false,
}) => {
  if (!resultado || !resultado.valido) return null

  const { metadados, camposComparativo } = resultado
  const informativos = itensInformativos || []
  const agregadosNfe = resultadoNfe?.agregadosNfe

  const getIconeGrupo = (grupo: CampoExtracaoComparativo['grupo']) => {
    switch (grupo) {
      case 'identificacao':
        return <Building2 className="w-4 h-4 text-blue-600" />
      case 'operacional':
        return <Percent className="w-4 h-4 text-emerald-600" />
      case 'fase1':
        return <Sparkles className="w-4 h-4 text-amber-600" />
      case 'fase2':
        return <Coins className="w-4 h-4 text-purple-600" />
      case 'fase3':
        return <MapPin className="w-4 h-4 text-rose-600" />
      default:
        return <FileText className="w-4 h-4 text-slate-600" />
    }
  }

  const getRotuloGrupo = (grupo: CampoExtracaoComparativo['grupo']) => {
    switch (grupo) {
      case 'identificacao':
        return 'Identificação & Cadastro'
      case 'operacional':
        return 'Operacional & Receitas'
      case 'fase1':
        return 'Parâmetros Fiscais & Insumos (Fase 1)'
      case 'fase2':
        return 'Parâmetros Fiscais Avançados (Fase 2)'
      case 'fase3':
        return 'Situação Fiscal & Multi-UF (Fase 3)'
      default:
        return 'Geral'
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && !salvando && onFechar()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border-slate-200">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-[#07132B] via-[#0D1D3A] to-[#07132B] text-white p-6 sm:p-7 border-b border-[#D4AF37]/30">
          <DialogHeader className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40 uppercase text-[10px] tracking-wider font-bold"
              >
                <FileText className="w-3 h-3 mr-1 inline" />
                {metadados.nomeTipo}
              </Badge>
              <Badge
                variant="outline"
                className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-bold"
              >
                <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                {metadados.linhasLidas.toLocaleString('pt-BR')} linhas lidas
              </Badge>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-heading font-extrabold text-white">
              Resumo da Importação Fiscal
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-xs sm:text-sm">
              Revise abaixo os campos identificados no arquivo antes de atualizar a Fonte Mestra.
              Nenhum dado é gravado sem a sua confirmação explícita.
            </DialogDescription>
          </DialogHeader>

          {/* Alertas de arquivos com erro de XML se houver */}
          {agregadosNfe && agregadosNfe.erros.length > 0 && (
            <div className="mt-3 p-3 bg-rose-500/20 border border-rose-400/40 rounded-xl text-xs space-y-1">
              <span className="font-bold text-rose-200 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
                {agregadosNfe.erros.length} arquivo(s) XML inválido(s) ou corrompido(s) ignorados:
              </span>
              <ul className="text-rose-100 text-[11px] list-disc list-inside space-y-0.5 max-h-24 overflow-y-auto">
                {agregadosNfe.erros.map((e, idx) => (
                  <li key={idx}>
                    <strong>{e.nomeArquivo}:</strong> {e.motivo}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Card com Metadados do Arquivo */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-white/10 rounded-xl border border-white/10 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Arquivo</span>
              <span
                className="text-white font-mono font-semibold truncate block"
                title={metadados.nomeArquivo}
              >
                {metadados.nomeArquivo}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                CNPJ Declarado
              </span>
              <span className="text-white font-mono font-semibold">
                {metadados.cnpj || 'Não identificado'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Empresa</span>
              <span
                className="text-white font-semibold truncate block"
                title={metadados.nomeEmpresa}
              >
                {metadados.nomeEmpresa || 'Não identificada'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Período</span>
              <span className="text-white font-mono font-semibold">
                {metadados.periodoInicio && metadados.periodoFim
                  ? `${metadados.periodoInicio} a ${metadados.periodoFim}`
                  : 'Período mensal'}
              </span>
            </div>
          </div>
        </div>

        {/* Corpo: Lista Comparativa Campo a Campo */}
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-[#07132B] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                Campos a serem preenchidos automaticamente ({camposComparativo.length})
              </h4>
              <p className="text-xs text-slate-500">
                Campos sem informação no documento permanecerão com seus valores atuais intactos.
              </p>
            </div>
          </div>

          {camposComparativo.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-sm font-bold text-slate-800">
                Os dados do arquivo já coincidem com a Fonte Mestra
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Todos os parâmetros identificados na escrituração já estão idênticos aos cadastrados
                atualmente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {camposComparativo.map((campo, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#D4AF37]/50 transition-all shadow-sm space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-100">
                        {getIconeGrupo(campo.grupo)}
                      </div>
                      <span className="text-xs font-bold text-[#07132B]">{campo.rotulo}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-semibold text-slate-600 bg-slate-50"
                    >
                      {getRotuloGrupo(campo.grupo)}
                    </Badge>
                  </div>

                  {/* Comparativo Antes vs Depois */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        Valor Atual na Fonte Mestra
                      </span>
                      <span className="font-semibold text-slate-700 break-words">
                        {campo.valorFormatadoAtual || '—'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-950">
                      <span className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-emerald-600" />
                        Novo Valor Extraído do Documento
                      </span>
                      <span className="font-bold text-emerald-900 break-words">
                        {campo.valorFormatadoExtraido}
                      </span>
                    </div>
                  </div>

                  {/* Motivo / Origem */}
                  <div className="flex items-start gap-1.5 text-[11px] text-slate-500 bg-slate-50/50 p-2 rounded-lg">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span>{campo.motivoExtracao}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quadro Especial de NCMs Detectados nas Notas Fiscais */}
          {agregadosNfe && agregadosNfe.ncmsConsolidados.length > 0 && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-purple-600" />
                    NCMs Consolidados das Notas ({agregadosNfe.totalNcmsDistintos} códigos)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Alimentam automaticamente as sugestões com badge &quot;Sugerido via NCM&quot; no
                    Recuperador de Créditos e a composição da Calculadora. Nenhuma tese é marcada.
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-800 border-purple-200 text-[10px] font-bold"
                >
                  Sugestão Automática de Teses
                </Badge>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {agregadosNfe.ncmsConsolidados.slice(0, 10).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white rounded-lg border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#07132B]">{item.ncm}</span>
                        <Badge
                          variant="outline"
                          className="text-[9px] bg-slate-100 text-slate-700 border-slate-200"
                        >
                          {item.categoriaRotulo}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate" title={item.descricao}>
                        {item.descricao}
                      </p>
                      {item.tesesSugeridas.length > 0 && (
                        <p className="text-[10px] text-emerald-700 font-semibold">
                          Teses sugeridas: {item.tesesSugeridas.join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-[#07132B] block">
                        {item.valorTotal.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {item.quantidadeTotal.toLocaleString('pt-BR')} un. • {item.totalItens}{' '}
                        item(ns)
                      </span>
                    </div>
                  </div>
                ))}

                {agregadosNfe.ncmsConsolidados.length > 10 && (
                  <p className="text-[10px] text-center text-slate-500 pt-1">
                    + {agregadosNfe.ncmsConsolidados.length - 10} outros NCMs consolidados no lote.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Agregados Informativos (sem campo direto na fonte mestra) */}
          {informativos.length > 0 && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                Agregados Contábeis Identificados (Apenas Informativos)
              </span>
              <p className="text-[11px] text-slate-500">
                Os itens abaixo foram apurados para sua conferência mas não alteram nenhum campo da
                Fonte Mestra.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                {informativos.map((inf, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-white rounded-lg border border-slate-200/90 space-y-0.5"
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      {inf.rotulo}
                    </span>
                    <span className="font-bold text-[#07132B] block">
                      {inf.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      {inf.descricao}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Avisos orientativos de integridade */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Regra de Segurança Tributária</span>
              <p className="text-amber-800 leading-relaxed text-[11px]">
                A importação preenche exclusivamente os parâmetros cadastrais e fiscais da Fonte
                Mestra.{' '}
                <strong>Nenhuma tese do Recuperador de Créditos é marcada ou desmarcada</strong> — a
                seleção de teses permanece 100% manual e sob critério do profissional tributário.
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <DialogFooter className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onFechar}
            disabled={salvando}
            className="w-full sm:w-auto text-xs font-semibold"
          >
            Cancelar
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              onClick={() => onConfirmar()}
              disabled={salvando}
              className="w-full sm:w-auto bg-[#07132B] hover:bg-[#0D1D3A] text-white font-bold text-xs shadow-md border border-[#D4AF37]/40 flex items-center justify-center gap-2"
            >
              {salvando ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Atualizando Fonte Mestra...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  Confirmar e Preencher Automaticamente
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
