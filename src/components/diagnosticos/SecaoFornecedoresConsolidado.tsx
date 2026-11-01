import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { listarFornecedores, type FornecedorDiagnostico } from '@/services/fornecedores'
import {
  calcularResumoCarteiraFornecedores,
  normalizarRegimeComprador,
} from '@/lib/calculoFornecedores'
import { gerarPdfParecerFornecedores } from '@/lib/pdfParecerFornecedores'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'

export interface SecaoFornecedoresConsolidadoProps {
  clienteAtivoId?: string | null
  dadosEmpresa?: any
}

export function SecaoFornecedoresConsolidado({
  clienteAtivoId,
  dadosEmpresa,
}: SecaoFornecedoresConsolidadoProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [fornecedores, setFornecedores] = useState<FornecedorDiagnostico[]>([])
  const [carregando, setCarregando] = useState(true)
  const [gerandoPdf, setGerandoPdf] = useState(false)

  const anoBase = useMemo(() => {
    return Number(dadosEmpresa?.anoBaseTransicao || 2027) as any
  }, [dadosEmpresa?.anoBaseTransicao])

  const regimeComprador = useMemo(() => {
    return normalizarRegimeComprador(dadosEmpresa?.regimeAtual)
  }, [dadosEmpresa?.regimeAtual])

  useEffect(() => {
    let montado = true
    async function carregar() {
      setCarregando(true)
      try {
        const authUserId = pb.authStore.record?.id || user?.id
        const list = await listarFornecedores({
          clienteId: clienteAtivoId,
          userId: authUserId,
        })
        if (montado) setFornecedores(list)
      } catch (err) {
        console.warn('Erro ao carregar fornecedores no consolidado:', err)
      } finally {
        if (montado) setCarregando(false)
      }
    }
    carregar()
    return () => {
      montado = false
    }
  }, [clienteAtivoId, user?.id])

  const resumo = useMemo(() => {
    return calcularResumoCarteiraFornecedores(fornecedores, anoBase, regimeComprador)
  }, [fornecedores, anoBase, regimeComprador])

  const handleBaixarPdf = () => {
    setGerandoPdf(true)
    try {
      gerarPdfParecerFornecedores(resumo, {
        nomeEmpresa: dadosEmpresa?.nomeEmpresa || 'Empresa Cadastrada',
        cnpj: dadosEmpresa?.cnpj,
        cidade: dadosEmpresa?.cidade,
        uf: dadosEmpresa?.ufOrigem,
        segmento: dadosEmpresa?.segmento,
        regimeAtual: dadosEmpresa?.regimeAtual,
      })
      toast({
        title: 'Parecer Gerado!',
        description: 'Download do parecer técnico de fornecedores concluído.',
      })
    } catch (e) {
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Não foi possível gerar o arquivo.',
        variant: 'destructive',
      })
    } finally {
      setGerandoPdf(false)
    }
  }

  if (carregando) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <span className="text-xs text-slate-500 font-medium">
          Carregando dados da carteira de fornecedores...
        </span>
      </div>
    )
  }

  if (fornecedores.length === 0) {
    return (
      <div className="bg-white rounded-[24px] p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold uppercase bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/40 inline-block mb-1">
              RELATÓRIO INDIVIDUAL • ETAPA 06
            </span>
            <h2 className="text-2xl font-heading font-black text-[#07132B]">
              Análise de Fornecedores & Perda de Créditos
            </h2>
          </div>
        </div>

        <div className="p-8 text-center bg-amber-50 rounded-2xl border border-amber-200">
          <strong className="text-amber-900 font-bold block text-base mb-1">
            Etapa 06 Não Iniciada
          </strong>
          <p className="text-amber-700 text-xs max-w-md mx-auto mb-4">
            Cadastre os fornecedores ou importe a planilha de compras na Etapa 06 para apurar o
            custo líquido de aquisição e o crédito perdido por fornecedor sob a LC 214/2025.
          </p>
          <Link
            to="/diagnostico-fornecedores"
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#07132B] text-[#D4AF37] inline-block"
          >
            Acessar Análise de Fornecedores →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[24px] p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6 animate-fade-in">
      {/* HEADER DA ABA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold uppercase bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/40 inline-block mb-1">
            RELATÓRIO INDIVIDUAL • ETAPA 06
          </span>
          <h2 className="text-2xl font-heading font-black text-[#07132B]">
            Análise de Fornecedores & Perda de Créditos
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Impacto da EC 132/2023 e LC 214/2025: comparação entre comprar de Simples, Presumido,
            Real ou Misto.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBaixarPdf}
            disabled={gerandoPdf}
            className="px-5 py-2.5 rounded-xl font-heading font-black text-xs text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-md transition-all disabled:opacity-60 cursor-pointer"
          >
            {gerandoPdf ? 'Gerando Parecer...' : 'Gerar parecer de fornecedores'}
          </button>
          <Link
            to="/diagnostico-fornecedores"
            className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs bg-slate-100 text-[#07132B] hover:bg-slate-200 border border-slate-300 transition-colors"
          >
            Gerenciar Carteira Completa →
          </Link>
        </div>
      </div>

      {/* CARDS COM MÉTRICAS CHAVE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Volume de Compras
          </span>
          <p className="text-lg font-heading font-black text-slate-800 font-mono mt-0.5">
            R$ {resumo.volumeTotalCompras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-500">
            {resumo.totalFornecedores} fornecedores
          </span>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
            Crédito Aproveitável ({resumo.anoSelecionado})
          </span>
          <p className="text-lg font-heading font-black text-emerald-700 font-mono mt-0.5">
            R${' '}
            {resumo.creditoAproveitavelTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-emerald-600">Economia real de entrada</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Custo Líquido
          </span>
          <p className="text-lg font-heading font-black text-[#07132B] font-mono mt-0.5">
            R$ {resumo.custoLiquidoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-500">Volume − Crédito</span>
        </div>

        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
            Crédito Perdido (Gargalo)
          </span>
          <p className="text-lg font-heading font-black text-rose-700 font-mono mt-0.5">
            R$ {resumo.creditoPerdidoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-rose-600">
            {resumo.percentualMedioPerda.toFixed(1)}% do volume total
          </span>
        </div>
      </div>

      {/* TOP GARGALOS */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-heading font-extrabold text-slate-900 uppercase tracking-wide">
          Maiores Gargalos da Carteira (Perda de Crédito vs Regime Regular)
        </h3>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Fornecedor</th>
                <th className="py-2.5 px-3">Regime</th>
                <th className="py-2.5 px-3">Item</th>
                <th className="py-2.5 px-3 text-right">Volume</th>
                <th className="py-2.5 px-3 text-right">Crédito Ganho</th>
                <th className="py-2.5 px-3 text-right">Custo Líquido</th>
                <th className="py-2.5 px-3 text-right">Crédito Perdido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resumo.rankingGargalos.slice(0, 5).map((r, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-400">#{i + 1}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">{r.fornecedor.nome}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {r.fornecedor.regime}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {r.fornecedor.classificacao_credito}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                    R$ {r.volumeCompras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                    R$ {r.creditoAproveitavel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                    R${' '}
                    {r.custoLiquidoAquisicao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-rose-600">
                    R$ {r.creditoPerdido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EVOLUÇÃO 2026-2033 */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <strong className="text-slate-800">
            Evolução do Crédito Perdido ao Longo dos 8 Anos:
          </strong>
          <span className="text-slate-500 font-mono text-[11px]">
            2026: R${' '}
            {(
              resumo.evolucaoAnos.find((e) => e.ano === 2026)?.creditoPerdidoTotal || 0
            ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}{' '}
            → 2033: R${' '}
            {(
              resumo.evolucaoAnos.find((e) => e.ano === 2033)?.creditoPerdidoTotal || 0
            ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Com o aumento gradual do IBS/CBS até 26,5% em 2033, o gap de crédito gerado por compras do
          Simples Nacional sem desconto atinge seu ponto máximo no regime pleno.
        </p>
      </div>
    </div>
  )
}
