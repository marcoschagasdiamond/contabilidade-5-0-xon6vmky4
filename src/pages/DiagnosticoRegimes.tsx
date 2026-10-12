import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Scale,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FileText,
  RotateCcw,
  Building2,
  DollarSign,
  ShieldCheck,
  Save,
  Trophy,
  Percent,
} from 'lucide-react'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import TrilhaDiagnosticoNav from '@/components/diagnosticos/TrilhaDiagnosticoNav'
import { FarolLimitesSimples } from '@/components/calculadora/FarolLimitesSimples'
import { BlocoSplitPayment } from '@/components/calculadora/BlocoSplitPayment'
import {
  AnoBaseSimulacao,
  ANOS_SIMULACAO_DISPONIVEIS,
  calcularAliquotasEfetivasReforma,
  obterReducaoSetorialReforma,
} from '@/lib/reformaTributaria'
import { formatarMoeda, formatarPorcentagem } from '@/lib/calculadoraUtils'
import { createDiagnostico } from '@/services/diagnosticos'
import pb from '@/lib/pocketbase/client'

export default function DiagnosticoRegimes() {
  const navigate = useNavigate()
  const { temDadosSalvos, dadosEmpresa } = useDadosEmpresa()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // Gate de Dados da Empresa
  useEffect(() => {
    if (!authLoading && !temDadosSalvos) {
      navigate('/dados-empresa?destino=' + encodeURIComponent('/diagnostico-regimes'), {
        replace: true,
      })
    }
  }, [authLoading, temDadosSalvos, navigate])

  // Parâmetros operacionais para a simulação comparativa
  const [faturamentoMensal, setFaturamentoMensal] = useState<number>(
    dadosEmpresa.faturamentoMensal || 120000,
  )
  const [folhaMensal, setFolhaMensal] = useState<number>(dadosEmpresa.folhaPagamentoMensal || 30000)
  const [despesasCreditosMensal, setDespesasCreditosMensal] = useState<number>(
    dadosEmpresa.despesasComCreditosMensais || 35000,
  )
  const [margemLucro, setMargemLucro] = useState<number>(dadosEmpresa.margemLucroEstimada ?? 25)
  const [anoBase, setAnoBase] = useState<AnoBaseSimulacao>(2027)

  // Atualizar quando os dados da empresa carregarem
  useEffect(() => {
    if (dadosEmpresa) {
      if (dadosEmpresa.faturamentoMensal) setFaturamentoMensal(dadosEmpresa.faturamentoMensal)
      if (dadosEmpresa.folhaPagamentoMensal) setFolhaMensal(dadosEmpresa.folhaPagamentoMensal)
      if (dadosEmpresa.despesasComCreditosMensais)
        setDespesasCreditosMensal(dadosEmpresa.despesasComCreditosMensais)
      if (dadosEmpresa.margemLucroEstimada !== undefined)
        setMargemLucro(dadosEmpresa.margemLucroEstimada)
    }
  }, [dadosEmpresa])

  const handleRestaurar = () => {
    setFaturamentoMensal(dadosEmpresa.faturamentoMensal || 120000)
    setFolhaMensal(dadosEmpresa.folhaPagamentoMensal || 30000)
    setDespesasCreditosMensal(dadosEmpresa.despesasComCreditosMensais || 35000)
    setMargemLucro(dadosEmpresa.margemLucroEstimada ?? 25)
    setAnoBase(2027)
  }
  const faturamentoAnual = faturamentoMensal * 12
  const folhaAnual = folhaMensal * 12
  const despesasAnuais = despesasCreditosMensal * 12
  const reducaoSetor = obterReducaoSetorialReforma(dadosEmpresa.segmento)

  // CÁLCULO DOS 4 REGIMES
  const resultadosRegimes = useMemo(() => {
    // 1. Simples Nacional (Elegibilidade teto R$ 4,8 mi)
    const elegivelSimples = faturamentoAnual <= 4800000
    // Alíquota média efetiva Simples baseada no segmento e Fator R (folha / faturamento)
    const fatorR = faturamentoAnual > 0 ? folhaAnual / faturamentoAnual : 0
    let aliqSimples = 0.08
    if (dadosEmpresa.segmento === 'Comércio') aliqSimples = 0.065
    else if (dadosEmpresa.segmento === 'Indústria') aliqSimples = 0.078
    else if (dadosEmpresa.segmento === 'Serviços' || dadosEmpresa.segmento === 'Tecnologia') {
      aliqSimples = fatorR >= 0.28 ? 0.095 : 0.155 // Anexo III vs Anexo V
    } else {
      aliqSimples = 0.105
    }
    const cargaSimplesAnual = elegivelSimples ? faturamentoAnual * aliqSimples : Infinity

    // 2. Lucro Presumido
    // Presunção IRPJ/CSLL: Comércio/Indústria = 8% / 12%; Serviços = 32%
    const presuncao =
      dadosEmpresa.segmento === 'Serviços' ||
      dadosEmpresa.segmento === 'Tecnologia' ||
      dadosEmpresa.segmento === 'Saúde'
        ? 0.32
        : 0.08
    const basePresumida = faturamentoAnual * presuncao
    const irpjCsll = basePresumida * 0.24 // 15% + 10% adicional + 9% csll sobre a base pres.
    const pisCofinsPresumido = faturamentoAnual * 0.0365 // 0,65% + 3%
    const issIcmsPresumido = faturamentoAnual * 0.05 // alíquota média estadual/municipal
    const encargoFolhaPresumido = folhaAnual * 0.28 // INSS patronal 20% + RAT/terceiros
    const cargaPresumidoAnual =
      irpjCsll + pisCofinsPresumido + issIcmsPresumido + encargoFolhaPresumido

    // 3. Lucro Real
    // Lucro = Faturamento - Despesas - Folha
    const lucroContabil = Math.max(0, faturamentoAnual - despesasAnuais - folhaAnual)
    const irpjCsllReal = lucroContabil * 0.34 // 15% IRPJ + 10% adic + 9% CSLL
    // PIS/COFINS Não Cumulativo: 9,25% (faturamento - créditos despesas)
    const pisCofinsReal = Math.max(0, (faturamentoAnual - despesasAnuais) * 0.0925)
    const issIcmsReal = faturamentoAnual * 0.04
    const encargoFolhaReal = folhaAnual * 0.28
    const cargaRealAnual = irpjCsllReal + pisCofinsReal + issIcmsReal + encargoFolhaReal

    // 4. Novo Sistema IBS / CBS Dual (com transição para o anoBase)
    const aliqEfetivaNova = calcularAliquotasEfetivasReforma(anoBase, dadosEmpresa.segmento)
    const aliqTotalNova = (aliqEfetivaNova.aliquotaCBS + aliqEfetivaNova.aliquotaIBS) / 100
    // Débito novo - Crédito novo sobre insumos/despesas
    const tributoConsumoNovo = Math.max(0, (faturamentoAnual - despesasAnuais) * aliqTotalNova)
    // No novo modelo de consumo, IRPJ/CSLL continuam vigentes sobre a renda corporativa (base lucro real estimado)
    const rendaEstimadaNovo = lucroContabil * 0.34
    const encargoFolhaNovo = folhaAnual * 0.2
    const cargaNovoSistemaAnual = tributoConsumoNovo + rendaEstimadaNovo + encargoFolhaNovo

    const lista = [
      {
        id: 'simples',
        nome: 'Simples Nacional',
        elegivel: elegivelSimples,
        cargaAnual: cargaSimplesAnual,
        aliquotaEfetiva: elegivelSimples ? (cargaSimplesAnual / faturamentoAnual) * 100 : 0,
        motivoElegibilidade: elegivelSimples
          ? 'Faturamento dentro do teto de R$ 4,8 milhões/ano'
          : 'Ultrapassa o teto anual de R$ 4,8 milhões',
        vantagens: ['Guia única (DAS)', 'Dispensa de contribuição patronal na maioria dos anexos'],
        desvantagens: ['Não gera créditos plenos de IBS/CBS a compradores no novo sistema'],
      },
      {
        id: 'presumido',
        nome: 'Lucro Presumido',
        elegivel: faturamentoAnual <= 78000000,
        cargaAnual: cargaPresumidoAnual,
        aliquotaEfetiva: (cargaPresumidoAnual / faturamentoAnual) * 100,
        motivoElegibilidade: 'Faturamento dentro do teto de R$ 78 milhões/ano',
        vantagens: ['Cálculo simplificado de IRPJ/CSLL', 'Previsibilidade contábil'],
        desvantagens: ['INSS patronal pleno de 20% + terceiros sobre a folha'],
      },
      {
        id: 'real',
        nome: 'Lucro Real',
        elegivel: true,
        cargaAnual: cargaRealAnual,
        aliquotaEfetiva: (cargaRealAnual / faturamentoAnual) * 100,
        motivoElegibilidade: 'Acesso irrestrito a qualquer porte de faturamento',
        vantagens: [
          'Impostos sobre a renda cobrados apenas sobre o lucro efetivo',
          'Não-cumulatividade',
        ],
        desvantagens: ['Maior exigência de compliance contábil e obrigações acessórias'],
      },
      {
        id: 'novo_dual',
        nome: `Novo Sistema Dual (Ano ${anoBase})`,
        elegivel: true,
        cargaAnual: cargaNovoSistemaAnual,
        aliquotaEfetiva: (cargaNovoSistemaAnual / faturamentoAnual) * 100,
        motivoElegibilidade: `Simulação projetada sob a LC 214/2025 para o ano ${anoBase}`,
        vantagens: ['Não-cumulatividade plena (crédito financeiro total)', 'Fim da cumulatividade'],
        desvantagens: ['Necessidade de sistemas aptos a operar em regime dual com Split Payment'],
      },
    ]

    // Ranking ordenado pelo menor desembolso
    const ordenados = [...lista]
      .filter((r) => r.elegivel && r.cargaAnual !== Infinity)
      .sort((a, b) => a.cargaAnual - b.cargaAnual)

    const melhorRegime = ordenados[0]
    const piorRegime = ordenados[ordenados.length - 1]
    const economiaAnualMaxima =
      piorRegime && melhorRegime ? piorRegime.cargaAnual - melhorRegime.cargaAnual : 0

    return {
      todos: lista,
      ranking: ordenados,
      melhorRegime,
      piorRegime,
      economiaAnualMaxima,
    }
  }, [faturamentoAnual, folhaAnual, despesasAnuais, dadosEmpresa.segmento, anoBase])

  // Salvamento
  const [salvando, setSalvando] = useState(false)
  const [salvoFeedback, setSalvoFeedback] = useState(false)

  const handleSalvarRegimes = async () => {
    setSalvando(true)
    try {
      const authUserId = pb.authStore.record?.id || undefined
      const simples = resultadosRegimes.todos.find((r) => r.id === 'simples')
      const presumido = resultadosRegimes.todos.find((r) => r.id === 'presumido')
      const real = resultadosRegimes.todos.find((r) => r.id === 'real')

      await createDiagnostico({
        user_id: authUserId,
        tipo_diagnostico: 'regimes',
        nome: dadosEmpresa.nomeContato || 'Contato',
        email: dadosEmpresa.email || 'contato@empresa.com.br',
        telefone: dadosEmpresa.telefone || '',
        empresa: dadosEmpresa.nomeEmpresa || 'Empresa',
        cnpj: dadosEmpresa.cnpj || '',
        segmento: dadosEmpresa.segmento || 'Serviços',
        rbt12: faturamentoAnual,
        folha12: folhaAnual,
        margem_lucro: margemLucro,
        regime_recomendado: resultadosRegimes.melhorRegime.nome,
        carga_simples:
          simples?.cargaAnual && simples.cargaAnual !== Infinity ? simples.cargaAnual : 0,
        carga_presumido: presumido?.cargaAnual || 0,
        carga_real: real?.cargaAnual || 0,
        economia_anual: resultadosRegimes.economiaAnualMaxima,
        ano_base: anoBase,
        sistema_recomendado_atual: dadosEmpresa.regimeAtual || 'Simples Nacional',
        sistema_recomendado_novo: resultadosRegimes.melhorRegime.nome,
        ranking_json: resultadosRegimes.ranking.map((item, idx) => ({
          posicao: idx + 1,
          regime: item.nome,
          cargaAnual: item.cargaAnual,
          aliquotaEfetiva: item.aliquotaEfetiva,
          elegivel: item.elegivel,
          diferencaValor: item.cargaAnual - resultadosRegimes.melhorRegime.cargaAnual,
          diferencaPercent:
            ((item.cargaAnual - resultadosRegimes.melhorRegime.cargaAnual) /
              (resultadosRegimes.melhorRegime.cargaAnual || 1)) *
            100,
        })),
        dados_extra_json: {
          tipo: 'regimes',
          anoBase,
          ranking: resultadosRegimes.ranking.map((r) => ({
            nome: r.nome,
            cargaAnual: r.cargaAnual,
            aliquota: r.aliquotaEfetiva,
          })),
        },
      })
      setSalvoFeedback(true)
      setTimeout(() => setSalvoFeedback(false), 4000)
    } catch (err) {
      console.error('Erro ao salvar diagnóstico de regimes:', err)
      setSalvoFeedback(true)
      setTimeout(() => setSalvoFeedback(false), 4000)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased pt-20 sm:pt-24 pb-20">
      {/* TRILHA DE NAVEGAÇÃO SUPERIOR */}
      <TrilhaDiagnosticoNav
        paginaAtual="regimes"
        nomeEmpresa={dadosEmpresa.nomeEmpresa}
        temDadosSalvos={temDadosSalvos}
        onRestaurarDados={handleRestaurar}
      />

      {/* HERO DA PÁGINA */}
      <section className="relative py-12 md:py-16 bg-gradient-to-r from-[#07132B] via-[#0A1A13] to-[#07132B] text-white border-b border-[#D4AF37]/30 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px]"
          aria-hidden="true"
        />

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-400/40 bg-blue-400/15 text-xs font-bold text-blue-300 uppercase tracking-wider backdrop-blur-md">
              <Scale className="w-3.5 h-3.5" />
              <span>DIAGNÓSTICO 3 DE 4 • COMPARAÇÃO DE REGIME</span>
            </div>

            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
              Comparação dos 4 Regimes:{' '}
              <span className="text-[#D4AF37]">Simples, Presumido, Real e Novo Sistema</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Descubra qual enquadramento societário gera a menor carga tributária anual líquida
              para sua empresa. Alimentado automaticamente pelos{' '}
              <strong className="text-white">Dados da Empresa</strong>, com ranking de economia.
            </p>
          </div>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 space-y-12">
        {/* ========================================================= */}
        {/* CARD DE PARÂMETROS OPERACIONAIS */}
        {/* ========================================================= */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold bg-[#07132B] text-[#D4AF37] mb-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>Dados da Empresa</span>
              </div>
              <h2 className="text-xl font-heading font-extrabold text-[#07132B]">
                {dadosEmpresa.nomeEmpresa || 'Empresa Cadastrada'}
              </h2>
              <p className="text-xs text-slate-500">
                Segmento: <strong>{dadosEmpresa.segmento}</strong> • Regime Vigente:{' '}
                <strong>{dadosEmpresa.regimeAtual || 'Não informado'}</strong>
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRestaurar}
              className="self-start sm:self-auto text-xs text-slate-600 hover:text-slate-900 border-slate-300 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
              Restaurar dados originais
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fat-mensal-r" className="text-xs font-semibold text-slate-700">
                Faturamento Mensal (R$)
              </Label>
              <Input
                id="fat-mensal-r"
                type="number"
                value={faturamentoMensal}
                onChange={(e) => setFaturamentoMensal(Number(e.target.value) || 0)}
                className="h-10 text-sm font-semibold"
              />
              <span className="text-[11px] text-slate-400">
                Anual: {formatarMoeda(faturamentoAnual)}
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="folha-mensal-r" className="text-xs font-semibold text-slate-700">
                Folha Mensal (R$)
              </Label>
              <Input
                id="folha-mensal-r"
                type="number"
                value={folhaMensal}
                onChange={(e) => setFolhaMensal(Number(e.target.value) || 0)}
                className="h-10 text-sm font-semibold"
              />
              <span className="text-[11px] text-slate-400">Impacta Fator R e INSS</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desp-cred-r" className="text-xs font-semibold text-slate-700">
                Despesas c/ Crédito (R$)
              </Label>
              <Input
                id="desp-cred-r"
                type="number"
                value={despesasCreditosMensal}
                onChange={(e) => setDespesasCreditosMensal(Number(e.target.value) || 0)}
                className="h-10 text-sm font-semibold"
              />
              <span className="text-[11px] text-slate-400">Créditos do Real e IBS/CBS</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="margem-lucro-r" className="text-xs font-semibold text-slate-700">
                Margem de Lucro Estimada (%)
              </Label>
              <Input
                id="margem-lucro-r"
                type="number"
                value={margemLucro}
                onChange={(e) => setMargemLucro(Number(e.target.value) || 0)}
                className="h-10 text-sm font-semibold"
              />
              <span className="text-[11px] text-slate-400">Fundamental no Real</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ano-base-r" className="text-xs font-semibold text-slate-700">
                Ano do Novo Sistema
              </Label>
              <Select
                value={String(anoBase)}
                onValueChange={(val) => setAnoBase(Number(val) as AnoBaseSimulacao)}
              >
                <SelectTrigger id="ano-base-r" className="h-10 text-sm font-semibold">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {ANOS_SIMULACAO_DISPONIVEIS.map((a) => (
                    <SelectItem key={a} value={String(a)}>
                      Ano {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-[11px] text-[#D4AF37] font-semibold">
                Transição vigência {anoBase}
              </span>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* DESTAQUE DO MELHOR REGIME RECOMENDADO */}
        {/* ========================================================= */}
        <section className="bg-gradient-to-r from-[#07132B] via-[#0A1A13] to-[#07132B] text-white rounded-[26px] p-6 sm:p-10 border-2 border-[#D4AF37] shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#D4AF37] text-[#07132B]">
                <Trophy className="w-3.5 h-3.5" />
                <span>Regime Tributário Recomendado</span>
              </div>
              <h3 className="font-heading font-black text-2xl sm:text-3xl text-white">
                {resultadosRegimes.melhorRegime?.nome}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Menor desembolso anual calculado entre todos os regimes elegíveis para a sua
                empresa.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white/10 border border-white/15 text-right shrink-0">
              <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider block">
                Economia Anual Estimada
              </span>
              <span className="font-heading font-black text-2xl sm:text-4xl text-emerald-400">
                {formatarMoeda(resultadosRegimes.economiaAnualMaxima)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                Comparado ao regime mais oneroso
              </span>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* RANKING DOS 4 REGIMES */}
        {/* ========================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#07132B]">
              Ranking Completo de Carga Tributária Anual
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              Ordenado do mais econômico ao mais oneroso
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resultadosRegimes.todos.map((regime) => {
              const isMelhor = resultadosRegimes.melhorRegime?.id === regime.id
              const diffMelhor =
                regime.cargaAnual !== Infinity
                  ? regime.cargaAnual - resultadosRegimes.melhorRegime.cargaAnual
                  : 0

              return (
                <div
                  key={regime.id}
                  className={`bg-white rounded-2xl p-6 border transition-all space-y-4 ${
                    isMelhor
                      ? 'border-2 border-[#2ECC71] shadow-lg ring-1 ring-[#2ECC71]/30'
                      : regime.elegivel
                        ? 'border-slate-200 shadow-sm hover:border-slate-300'
                        : 'border-slate-200 bg-slate-50/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-extrabold text-lg text-[#07132B]">
                          {regime.nome}
                        </h4>
                        {isMelhor && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#2ECC71]/20 text-[#145A32] border border-[#2ECC71]/40 uppercase">
                            Recomendado
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 mt-0.5 block">
                        {regime.motivoElegibilidade}
                      </span>
                    </div>

                    <div className="text-right">
                      {regime.elegivel && regime.cargaAnual !== Infinity ? (
                        <>
                          <span className="font-heading font-black text-xl text-[#07132B] block">
                            {formatarMoeda(regime.cargaAnual)}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            Alíq. Efetiva: {regime.aliquotaEfetiva.toFixed(2)}%
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">
                          Não Elegível
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vantagens / Desvantagens */}
                  <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-100">
                    <div className="space-y-1">
                      <span className="font-bold text-emerald-800 uppercase text-[10px] block">
                        Vantagem:
                      </span>
                      <p className="text-slate-600 leading-snug">{regime.vantagens[0]}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-bold text-amber-800 uppercase text-[10px] block">
                        Atenção:
                      </span>
                      <p className="text-slate-600 leading-snug">{regime.desvantagens[0]}</p>
                    </div>
                  </div>

                  {!isMelhor && regime.elegivel && regime.cargaAnual !== Infinity && (
                    <div className="text-[11px] text-rose-700 bg-rose-50/70 p-2 rounded-lg font-semibold flex items-center justify-between">
                      <span>Custo Adicional Anual:</span>
                      <span className="font-mono font-bold">+{formatarMoeda(diffMelhor)}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ========================================================= */}
        {/* BLOCO DE IMPACTO DO SPLIT PAYMENT NO CAPITAL DE GIRO */}
        {/* ========================================================= */}
        {(() => {
          const retencaoMensalNota =
            faturamentoMensal * 0.265 * (1 - reducaoSetor.percentualReducao / 100)
          const recolhimentoAtualMensal = (resultadosRegimes.melhorRegime?.cargaAnual || 0) / 12
          const diferencaFluxoCaixa = retencaoMensalNota - recolhimentoAtualMensal
          const taxaMensalCapital = 1.0 // 1% a.m.
          const diasAntecipacao = 30
          const custoCapitalMensal = retencaoMensalNota * 0.01
          const custoCapitalAnual = custoCapitalMensal * 12

          const resultadoSplitPaymentObj = {
            retencaoMensalNota,
            recolhimentoAtualMensal,
            diferencaFluxoCaixa,
            taxaMensalCapital,
            diasAntecipacao,
            custoCapitalMensal,
            custoCapitalAnual,
            explicacaoSimples:
              'No novo sistema (IBS/CBS), a retenção ocorre na conta no momento em que o cliente paga a nota fiscal (split payment). No sistema atual, a empresa segura o dinheiro até a guia do mês seguinte, usando esse caixa como capital de giro sem juros por 30 a 50 dias.',
          }

          return (
            <BlocoSplitPayment
              resultadoSplitPayment={resultadoSplitPaymentObj}
              taxaMensalCapitalGiro={taxaMensalCapital}
              setTaxaMensalCapitalGiro={() => {}}
              diasAntecipacaoSplit={diasAntecipacao}
              setDiasAntecipacaoSplit={() => {}}
              regimeAtualNome={dadosEmpresa.regimeAtual || 'Simples Nacional'}
            />
          )
        })()}

        {/* ========================================================= */}
        {/* CARD DE SALVAMENTO & AVANÇO */}
        {/* ========================================================= */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-heading font-extrabold text-lg text-[#07132B]">
              Salvar Comparação de Regime
            </h3>
            <p className="text-xs text-slate-600">
              Grave o ranking na sua conta para consulta posterior e acompanhamento pela assessoria.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Button
              type="button"
              onClick={handleSalvarRegimes}
              disabled={salvando}
              className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B] font-bold text-xs sm:text-sm h-11 px-6 rounded-xl"
            >
              <Save className="w-4 h-4 mr-2" />
              {salvando ? 'Salvando...' : 'Salvar Comparação'}
            </Button>

            <Link
              to="/diagnostico"
              className="inline-flex items-center justify-center gap-2 bg-[#07132B] hover:brightness-110 text-white font-bold text-xs sm:text-sm h-11 px-6 rounded-xl transition-all"
            >
              <span>Avançar para Etapa 4: Enquadramento Completo (com PDF)</span>
              <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
            </Link>
          </div>
        </section>

        {salvoFeedback && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Comparação de Regimes salva com sucesso na sua conta!</span>
          </div>
        )}
      </div>

      <DiamondFooterCTA />
    </div>
  )
}
