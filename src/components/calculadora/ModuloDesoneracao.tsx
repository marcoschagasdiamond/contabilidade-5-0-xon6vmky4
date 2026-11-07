import React, { useState, useMemo } from 'react'
import { useCalculadoraIbsCbs } from '@/context/CalculadoraIbsCbsContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, TrendingDown, Building2, Calendar, Landmark } from 'lucide-react'
import { formatarMoeda } from '@/lib/calculadoraUtils'
import { type AnoTransicaoIbsCbs } from '@/types/calculadoraIbsCbs'
import { BarraAcoesSimulacao } from '@/components/calculadora/BarraAcoesSimulacao'
import type { ModuloCalculadoraId } from '@/components/calculadora/PainelProximosPassosCalculadora'
import { SecaoDesoneracaoFolha } from './SecaoDesoneracaoFolha'
import { SecaoDesoneracaoExportacao } from './SecaoDesoneracaoExportacao'

interface ModuloDesoneracaoProps {
  onNavegarModulo?: (moduloId: ModuloCalculadoraId) => void
  onSalvarSimulacao?: () => void
  onBaixarPdf?: () => void
  onExportarDados?: () => void
  gerandoPdf?: boolean
}

export default function ModuloDesoneracao({
  onSalvarSimulacao,
  onBaixarPdf,
  onExportarDados,
  gerandoPdf,
}: ModuloDesoneracaoProps) {
  const {
    faturamentoMensal,
    faturamentoAnualProjetado,
    folhaPagamentoMensal,
    setFolhaPagamentoMensal,
    percentualExportacao,
    setPercentualExportacao,
    setorTransicao,
    tipoAtividade,
    anoTransicaoDashboard,
    resultadoTransicao,
  } = useCalculadoraIbsCbs()

  // Toggles mestres de desoneração (default estrito: false/desligados)
  const [desoneracaoFolhaAtiva, setDesoneracaoFolhaAtiva] = useState(false)
  const [desoneracaoExportacaoAtiva, setDesoneracaoExportacaoAtiva] = useState(false)

  // Alíquota CPRB sobre receita bruta (Lei 12.546/2011 - default 4,5% para TI/serviços)
  const [aliquotaCprb, setAliquotaCprb] = useState<number>(4.5)

  // Ano de análise do cronograma da transição (default: anoTransicaoDashboard ou 2027)
  const [anoFocoTransicao, setAnoFocoTransicao] = useState<AnoTransicaoIbsCbs>(
    anoTransicaoDashboard || 2027,
  )

  // Receita anual base
  const receitaBrutaAnual = useMemo(() => {
    if (faturamentoAnualProjetado && faturamentoAnualProjetado > 0) {
      return faturamentoAnualProjetado
    }
    return Math.max(0, faturamentoMensal * 12)
  }, [faturamentoAnualProjetado, faturamentoMensal])

  const folhaAnualEfetiva = useMemo(() => {
    return Math.max(0, folhaPagamentoMensal * 12)
  }, [folhaPagamentoMensal])

  const isPerfilServicos = setorTransicao === 'servico' || tipoAtividade === 'servico'

  // ========================================================
  // 1. CÁLCULO DESONERAÇÃO DA FOLHA (Lei 12.546 / 14.973)
  // ========================================================
  const calculoFolha = useMemo(() => {
    const cppSobreFolhaAnual = folhaAnualEfetiva * 0.2
    const cppSobreFolhaMensal = folhaPagamentoMensal * 0.2

    const aliqCprbDecimal = Math.max(0, aliquotaCprb) / 100
    const cprbSobreReceitaAnual = receitaBrutaAnual * aliqCprbDecimal
    const cprbSobreReceitaMensal = (receitaBrutaAnual / 12) * aliqCprbDecimal

    const economiaAnual = cppSobreFolhaAnual - cprbSobreReceitaAnual
    const economiaMensal = cppSobreFolhaMensal - cprbSobreReceitaMensal
    const percentualReducao =
      cppSobreFolhaAnual > 0 ? (economiaAnual / cppSobreFolhaAnual) * 100 : 0

    const fatorRPct = receitaBrutaAnual > 0 ? (folhaAnualEfetiva / receitaBrutaAnual) * 100 : 0

    return {
      cppSobreFolhaAnual,
      cppSobreFolhaMensal,
      cprbSobreReceitaAnual,
      cprbSobreReceitaMensal,
      economiaAnual,
      economiaMensal,
      percentualReducao,
      fatorRPct,
      vantajoso: economiaAnual > 0,
    }
  }, [folhaAnualEfetiva, folhaPagamentoMensal, receitaBrutaAnual, aliquotaCprb])

  // ========================================================
  // 2. CÁLCULO DESONERAÇÃO DE EXPORTAÇÃO (LC 214/2025 art. 46)
  // ========================================================
  const calculoExportacao = useMemo(() => {
    const pctExp = Math.max(0, Math.min(100, percentualExportacao || 0)) / 100
    const receitaExportadaAnual = receitaBrutaAnual * pctExp
    const receitaMercadoInternoAnual = receitaBrutaAnual - receitaExportadaAnual

    const cronogramaEconomia = resultadoTransicao.map((fase) => {
      const aliqEfetiva = fase.aliquotaEfetivaTotal
      const impostoEconomizadoExportacao = (receitaExportadaAnual * aliqEfetiva) / 100
      const impostoMercadoInterno = (receitaMercadoInternoAnual * aliqEfetiva) / 100

      return {
        ano: fase.ano,
        aliquotaEfetiva: aliqEfetiva,
        impostoEconomizadoExportacao,
        impostoMercadoInterno,
        impostoSemDesoneracao: (receitaBrutaAnual * aliqEfetiva) / 100,
      }
    })

    const dadosAnoFoco =
      cronogramaEconomia.find((c) => c.ano === anoFocoTransicao) || cronogramaEconomia[0]

    const economiaHorizonte2027_2033 = cronogramaEconomia
      .filter((c) => typeof c.ano === 'number' && c.ano >= 2027 && c.ano <= 2033)
      .reduce((acc, c) => acc + c.impostoEconomizadoExportacao, 0)

    return {
      receitaExportadaAnual,
      receitaMercadoInternoAnual,
      cronogramaEconomia,
      dadosAnoFoco,
      economiaHorizonte2027_2033,
      economiaAnualFoco: dadosAnoFoco ? dadosAnoFoco.impostoEconomizadoExportacao : 0,
    }
  }, [percentualExportacao, receitaBrutaAnual, resultadoTransicao, anoFocoTransicao])

  // Economia consolidada anual considerando apenas os toggles ativados
  const economiaConsolidadaAnual = useMemo(() => {
    let total = 0
    if (desoneracaoFolhaAtiva && calculoFolha.economiaAnual > 0) {
      total += calculoFolha.economiaAnual
    }
    if (desoneracaoExportacaoAtiva) {
      total += calculoExportacao.economiaAnualFoco
    }
    return total
  }, [
    desoneracaoFolhaAtiva,
    desoneracaoExportacaoAtiva,
    calculoFolha.economiaAnual,
    calculoExportacao.economiaAnualFoco,
  ])

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#07132B] via-[#0D1E3A] to-[#122B52] text-white shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="flex items-center gap-2">
            <Badge className="bg-[#D4AF37] text-[#07132B] font-bold text-xs uppercase px-2.5 py-0.5 tracking-wider hover:bg-[#D4AF37]">
              Módulo Especial
            </Badge>
            <span className="text-xs text-slate-300 font-mono">
              Análise Especializada BRAVO IT SECURITY
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-white flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-[#D4AF37] shrink-0" />
            Simulação de Desoneração Tributária
          </h1>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            Avalie o impacto financeiro da <strong>
              Desoneração da Folha de Pagamento (CPRB)
            </strong>{' '}
            e da <strong>Imunidade de Exportação de Serviços (LC 214/2025 art. 46)</strong>. Os
            toggles permitem comparar cenários de caixa sem modificar os parâmetros originais dos
            outros módulos.
          </p>
        </div>

        {/* Status dos toggles no cabeçalho */}
        <div className="relative z-10 flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
          <div
            className={`px-4 py-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold ${
              desoneracaoFolhaAtiva
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            <span>Desoneração da Folha:</span>
            <span className="font-bold font-mono">
              {desoneracaoFolhaAtiva ? 'ATIVADA' : 'DESLIGADA'}
            </span>
          </div>
          <div
            className={`px-4 py-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold ${
              desoneracaoExportacaoAtiva
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            <span>Exportação de Serviços:</span>
            <span className="font-bold font-mono">
              {desoneracaoExportacaoAtiva ? 'ATIVADA' : 'DESLIGADA'}
            </span>
          </div>
        </div>
      </div>

      {/* AVISO ORIENTATIVO BRAVO IT SECURITY (PRESTADOR 100% SERVIÇOS) */}
      {isPerfilServicos && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-[#07132B] flex items-start gap-3 shadow-sm">
          <Building2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm">
            <span className="font-bold block text-slate-900">
              Perfil 100% Prestador de Serviços & TI (Referência BRAVO IT SECURITY)
            </span>
            <p className="text-slate-700 leading-relaxed">
              Empresas de tecnologia e segurança da informação possuem alta concentração de custos
              em folha salarial e relevante potencial de faturamento em contratos internacionais. A
              conjugação da CPRB (quando elegível pela Lei 12.546/2011) com a alíquota zero de
              IBS/CBS na exportação de serviços (LC 214/2025 art. 46) representa a principal
              alavanca de desoneração do setor.
            </p>
          </div>
        </div>
      )}

      {/* CARDS RESUMO CONSOLIDADO (CARGA VS ECONOMIA) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1: Faturamento & Base Analisada */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-slate-400" />
              Base da Simulação
            </span>
            <CardTitle className="text-xl sm:text-2xl font-bold font-mono text-[#07132B]">
              {formatarMoeda(receitaBrutaAnual)}
            </CardTitle>
            <CardDescription className="text-xs">
              Receita anual ({formatarMoeda(faturamentoMensal)}/mês)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between py-1 border-t border-slate-100">
              <span>Folha Salarial Anual:</span>
              <strong className="font-mono text-slate-900">
                {formatarMoeda(folhaAnualEfetiva)}
              </strong>
            </div>
            <div className="flex justify-between py-1 border-t border-slate-100">
              <span>Exportação Cadastrada:</span>
              <strong className="font-mono text-slate-900">
                {percentualExportacao}% ({formatarMoeda(calculoExportacao.receitaExportadaAnual)})
              </strong>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Economia Anual Consolidada */}
        <Card
          className={`border shadow-sm transition-all ${
            desoneracaoFolhaAtiva || desoneracaoExportacaoAtiva
              ? 'bg-emerald-50/50 border-emerald-300'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <CardHeader className="pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
              Economia Anual com Desonerações
            </span>
            <CardTitle
              className={`text-xl sm:text-2xl font-bold font-mono ${
                desoneracaoFolhaAtiva || desoneracaoExportacaoAtiva
                  ? 'text-emerald-700'
                  : 'text-slate-400'
              }`}
            >
              {desoneracaoFolhaAtiva || desoneracaoExportacaoAtiva
                ? formatarMoeda(economiaConsolidadaAnual)
                : 'R$ 0,00 (Toggles desligados)'}
            </CardTitle>
            <CardDescription className="text-xs">
              Impacto imediato no fluxo de caixa anual
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between py-1 border-t border-slate-100">
              <span>Economia Folha (CPRB):</span>
              <span className="font-mono font-bold">
                {desoneracaoFolhaAtiva
                  ? calculoFolha.economiaAnual >= 0
                    ? `+ ${formatarMoeda(calculoFolha.economiaAnual)}`
                    : `- ${formatarMoeda(Math.abs(calculoFolha.economiaAnual))}`
                  : 'Desligado'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-t border-slate-100">
              <span>Economia Exportação (em {anoFocoTransicao}):</span>
              <span className="font-mono font-bold">
                {desoneracaoExportacaoAtiva
                  ? `+ ${formatarMoeda(calculoExportacao.economiaAnualFoco)}`
                  : 'Desligado'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Horizonte da Transição (2027–2033) */}
        <Card
          className={`border shadow-sm transition-all ${
            desoneracaoExportacaoAtiva
              ? 'bg-[#07132B] text-white border-[#D4AF37]/50'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <CardHeader className="pb-2">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                desoneracaoExportacaoAtiva ? 'text-[#D4AF37]' : 'text-slate-500'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Economia Acumulada 2027–2033
            </span>
            <CardTitle
              className={`text-xl sm:text-2xl font-bold font-mono ${
                desoneracaoExportacaoAtiva ? 'text-[#D4AF37]' : 'text-slate-400'
              }`}
            >
              {desoneracaoExportacaoAtiva
                ? formatarMoeda(calculoExportacao.economiaHorizonte2027_2033)
                : 'R$ 0,00'}
            </CardTitle>
            <CardDescription
              className={`text-xs ${desoneracaoExportacaoAtiva ? 'text-slate-300' : 'text-slate-500'}`}
            >
              Imunidade acumulada de IBS/CBS na exportação (7 anos)
            </CardDescription>
          </CardHeader>
          <CardContent
            className={`pt-0 text-xs space-y-1 ${
              desoneracaoExportacaoAtiva ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            <div
              className={`flex justify-between py-1 border-t ${
                desoneracaoExportacaoAtiva ? 'border-white/10' : 'border-slate-100'
              }`}
            >
              <span>Base Legal:</span>
              <strong
                className={desoneracaoExportacaoAtiva ? 'text-white font-mono' : 'text-slate-900'}
              >
                LC 214/2025 art. 46
              </strong>
            </div>
            <div
              className={`flex justify-between py-1 border-t ${
                desoneracaoExportacaoAtiva ? 'border-white/10' : 'border-slate-100'
              }`}
            >
              <span>Manutenção de Créditos:</span>
              <strong className="text-emerald-400 font-semibold">100% Assegurada</strong>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO 1: DESONERAÇÃO DA FOLHA (CPRB) */}
      <SecaoDesoneracaoFolha
        desoneracaoFolhaAtiva={desoneracaoFolhaAtiva}
        setDesoneracaoFolhaAtiva={setDesoneracaoFolhaAtiva}
        folhaPagamentoMensal={folhaPagamentoMensal}
        setFolhaPagamentoMensal={setFolhaPagamentoMensal}
        folhaAnualEfetiva={folhaAnualEfetiva}
        aliquotaCprb={aliquotaCprb}
        setAliquotaCprb={setAliquotaCprb}
        receitaBrutaAnual={receitaBrutaAnual}
        calculoFolha={calculoFolha}
      />

      {/* SEÇÃO 2: DESONERAÇÃO DE EXPORTAÇÃO */}
      <SecaoDesoneracaoExportacao
        desoneracaoExportacaoAtiva={desoneracaoExportacaoAtiva}
        setDesoneracaoExportacaoAtiva={setDesoneracaoExportacaoAtiva}
        percentualExportacao={percentualExportacao}
        setPercentualExportacao={setPercentualExportacao}
        anoFocoTransicao={anoFocoTransicao}
        setAnoFocoTransicao={setAnoFocoTransicao}
        calculoExportacao={calculoExportacao}
      />

      {/* BARRA DE AÇÕES DA SIMULAÇÃO */}
      {onSalvarSimulacao && onBaixarPdf && (
        <BarraAcoesSimulacao
          onSalvar={onSalvarSimulacao}
          onBaixarPdf={onBaixarPdf}
          onExportarDados={onExportarDados}
          gerandoPdf={gerandoPdf}
        />
      )}
    </div>
  )
}
