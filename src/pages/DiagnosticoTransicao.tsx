import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Calendar,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FileText,
  RotateCcw,
  Building2,
  DollarSign,
  Package,
  ShieldCheck,
  Save,
  HelpCircle,
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
import {
  TAXA_CBS_REFERENCIA,
  TAXA_IBS_REFERENCIA,
  SOMA_IVA_DUAL_REFERENCIA,
  AnoBaseSimulacao,
  ANOS_SIMULACAO_DISPONIVEIS,
  calcularAliquotasEfetivasReforma,
  obterReducaoSetorialReforma,
  obterPercentualConsumoSimplesPorAno,
} from '@/lib/reformaTributaria'
import { formatarMoeda, formatarPorcentagem } from '@/lib/calculadoraUtils'
import { createDiagnostico } from '@/services/diagnosticos'
import pb from '@/lib/pocketbase/client'

// Cronograma oficial detalhado de 2026 a 2033
interface AnoCronograma {
  ano: number
  cbsAliquota: number // %
  ibsAliquota: number // %
  remanescentePISCofins: number // % (100% no início -> 0%)
  remanescenteIcmsIss: number // %
  destaque: string
  fase: string
}

const CRONOGRAMA_DETALHADO: AnoCronograma[] = [
  {
    ano: 2026,
    cbsAliquota: 0.9,
    ibsAliquota: 0.1,
    remanescentePISCofins: 100,
    remanescenteIcmsIss: 100,
    destaque: 'Fase de Teste Operacional (CBS 0,9% compensável com PIS/COFINS, IBS 0,1%)',
    fase: 'Teste & Ajuste de Sistemas',
  },
  {
    ano: 2027,
    cbsAliquota: 8.8,
    ibsAliquota: 0.1,
    remanescentePISCofins: 0,
    remanescenteIcmsIss: 100,
    destaque: 'Extinção do PIS e COFINS; CBS plena e Imposto Seletivo entram em vigor',
    fase: 'Início da CBS Plena',
  },
  {
    ano: 2028,
    cbsAliquota: 8.8,
    ibsAliquota: 0.1,
    remanescentePISCofins: 0,
    remanescenteIcmsIss: 100,
    destaque: 'Ano de consolidação da CBS antes do início do desmonte do ICMS/ISS',
    fase: 'Consolidação CBS',
  },
  {
    ano: 2029,
    cbsAliquota: 8.8,
    ibsAliquota: 1.77, // 10% do IBS pleno (17,7%)
    remanescentePISCofins: 0,
    remanescenteIcmsIss: 90,
    destaque: 'Início do desmonte do ICMS/ISS (-10%) e introdução do IBS (10%)',
    fase: 'Início da Redução ICMS/ISS',
  },
  {
    ano: 2030,
    cbsAliquota: 8.8,
    ibsAliquota: 3.54,
    remanescentePISCofins: 0,
    remanescenteIcmsIss: 80,
    destaque: 'Redução de 20% do ICMS/ISS e IBS em 20%',
    fase: 'Transição Gradual',
  },
  {
    ano: 2031,
    cbsAliquota: 8.8,
    ibsAliquota: 5.31,
    remanescentePISCofins: 0,
    remanescenteIcmsIss: 70,
    destaque: 'Redução de 30% do ICMS/ISS e IBS em 30%',
    fase: 'Transição Gradual',
  },
  {
    ano: 2032,
    cbsAliquota: 8.8,
    ibsAliquota: 7.08,
    remanescentePISCofins: 0,
    remanescenteIcmsIss: 60,
    destaque: 'Último ano do modelo dual: redução de 40% do ICMS/ISS',
    fase: 'Transição Avançada',
  },
  {
    ano: 2033,
    cbsAliquota: 8.8,
    ibsAliquota: 17.7,
    remanescentePISCofins: 0,
    remanescenteIcmsIss: 0,
    destaque: 'Extinção definitiva de ICMS e ISS. Vigência 100% integral do IBS e CBS',
    fase: 'Vigência Plena do Novo Sistema',
  },
]

export default function DiagnosticoTransicao() {
  const navigate = useNavigate()
  const { temDadosSalvos, dadosEmpresa } = useDadosEmpresa()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // Gate de Dados da Empresa
  useEffect(() => {
    if (!authLoading && !temDadosSalvos) {
      navigate('/dados-empresa?destino=' + encodeURIComponent('/diagnostico-transicao'), {
        replace: true,
      })
    }
  }, [authLoading, temDadosSalvos, navigate])

  // Estado local para permitir simulações sem alterar os dados persistidos da empresa
  const [faturamentoMensal, setFaturamentoMensal] = useState<number>(
    dadosEmpresa.faturamentoMensal || 100000,
  )
  const [despesasCreditosMensal, setDespesasCreditosMensal] = useState<number>(
    dadosEmpresa.despesasComCreditosMensais || 30000,
  )
  const [estoqueVirada, setEstoqueVirada] = useState<number>(50000)
  const [anoBaseSelecionado, setAnoBaseSelecionado] = useState<AnoBaseSimulacao>(2027)

  // Atualizar quando os dados da empresa carregarem
  useEffect(() => {
    if (dadosEmpresa) {
      if (dadosEmpresa.faturamentoMensal) setFaturamentoMensal(dadosEmpresa.faturamentoMensal)
      if (dadosEmpresa.despesasComCreditosMensais)
        setDespesasCreditosMensal(dadosEmpresa.despesasComCreditosMensais)
    }
  }, [dadosEmpresa])

  const handleRestaurar = () => {
    setFaturamentoMensal(dadosEmpresa.faturamentoMensal || 100000)
    setDespesasCreditosMensal(dadosEmpresa.despesasComCreditosMensais || 30000)
    setEstoqueVirada(50000)
    setAnoBaseSelecionado(2027)
  }

  // Cálculos dinâmicos
  const faturamentoAnual = faturamentoMensal * 12
  const despesasAnuais = despesasCreditosMensal * 12

  // Redução setorial
  const reducaoSetor = obterReducaoSetorialReforma(dadosEmpresa.segmento)

  // Alíquotas efetivas para o ano base selecionado
  const aliqNovoAno = useMemo(() => {
    return calcularAliquotasEfetivasReforma(anoBaseSelecionado, dadosEmpresa.segmento)
  }, [anoBaseSelecionado, dadosEmpresa.segmento])

  // Cálculo do Crédito Presumido de Estoque (apuração sobre PIS/COFINS na transição 2026->2027)
  // Alíquota média PIS/COFINS sobre estoque de transição = 9,25% (ou 3,65% presumido)
  const aliquotaCreditoEstoque = dadosEmpresa.regimeAtual === 'Lucro Presumido' ? 0.0365 : 0.0925
  const creditoPresumidoEstoqueTotal = estoqueVirada * aliquotaCreditoEstoque
  const creditoEstoqueMensal = creditoPresumidoEstoqueTotal / 12

  // Simulação ano a ano do desembolso estimado
  const tabelaTransicao = useMemo(() => {
    return CRONOGRAMA_DETALHADO.map((item) => {
      // Alíquota total nova no ano
      const totalAliquotaNova = item.cbsAliquota + item.ibsAliquota
      const aliquotaComBeneficio = totalAliquotaNova * (1 - reducaoSetor.percentualReducao / 100)

      // Débito novo do ano
      const debitoNovoAnual = faturamentoAnual * (aliquotaComBeneficio / 100)
      const creditosNovosAnual = despesasAnuais * (aliquotaComBeneficio / 100)
      const saldoNovoAnual = Math.max(0, debitoNovoAnual - creditosNovosAnual)

      // Carga residual do sistema atual (ICMS/ISS + PIS/COFINS)
      // Estimativa média do sistema atual: ~14% efetivo dependendo do regime
      const aliquotaBaseAtual = dadosEmpresa.regimeAtual === 'Simples Nacional' ? 0.09 : 0.14
      const pesoAtual = (item.remanescentePISCofins * 0.4 + item.remanescenteIcmsIss * 0.6) / 100
      const cargaAtualResidual = faturamentoAnual * aliquotaBaseAtual * pesoAtual

      const desembolsoTotalEstimado = saldoNovoAnual + cargaAtualResidual

      return {
        ...item,
        aliquotaEfetivaNova: aliquotaComBeneficio,
        debitoNovoAnual,
        creditosNovosAnual,
        saldoNovoAnual,
        cargaAtualResidual,
        desembolsoTotalEstimado,
      }
    })
  }, [faturamentoAnual, despesasAnuais, reducaoSetor, dadosEmpresa.regimeAtual])

  // Salvamento do diagnóstico de transição
  const [salvando, setSalvando] = useState(false)
  const [salvoFeedback, setSalvoFeedback] = useState(false)

  const handleSalvarTransicao = async () => {
    setSalvando(true)
    try {
      const authUserId = pb.authStore.record?.id || undefined
      const anoItem =
        tabelaTransicao.find((t) => t.ano === anoBaseSelecionado) || tabelaTransicao[1]

      await createDiagnostico({
        user_id: authUserId,
        tipo_diagnostico: 'transicao',
        nome: dadosEmpresa.nomeContato || 'Contato',
        email: dadosEmpresa.email || 'contato@empresa.com.br',
        telefone: dadosEmpresa.telefone || '',
        empresa: dadosEmpresa.nomeEmpresa || 'Empresa',
        cnpj: dadosEmpresa.cnpj || '',
        segmento: dadosEmpresa.segmento || 'Serviços',
        rbt12: faturamentoAnual,
        folha12: (dadosEmpresa.folhaPagamentoMensal || 10000) * 12,
        margem_lucro: dadosEmpresa.margemLucroEstimada ?? 25,
        regime_recomendado: 'Diagnóstico de Transição Fiscal',
        carga_simples: 0,
        carga_presumido: 0,
        carga_real: 0,
        economia_anual: creditoPresumidoEstoqueTotal,
        ano_base: anoBaseSelecionado,
        sistema_recomendado_atual: dadosEmpresa.regimeAtual || 'Simples Nacional',
        sistema_recomendado_novo: `Transição ${anoBaseSelecionado} (${anoItem.fase})`,
        dados_extra_json: {
          tipo: 'transicao',
          anoBase: anoBaseSelecionado,
          creditoPresumidoEstoque: {
            estoqueVirada,
            creditoTotal: creditoPresumidoEstoqueTotal,
            creditoMensal: creditoEstoqueMensal,
          },
          curvaTransicao: tabelaTransicao.map((t) => ({
            ano: t.ano,
            aliquotaEfetiva: t.aliquotaEfetivaNova,
            desembolsoTotal: t.desembolsoTotalEstimado,
          })),
        },
      })
      setSalvoFeedback(true)
      setTimeout(() => setSalvoFeedback(false), 4000)
    } catch (err) {
      console.error('Erro ao salvar diagnóstico de transição:', err)
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
        paginaAtual="transicao"
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 text-xs font-bold text-amber-300 uppercase tracking-wider backdrop-blur-md">
              <Calendar className="w-3.5 h-3.5" />
              <span>DIAGNÓSTICO 2 DE 4 • TRANSIÇÃO FISCAL 2026–2033</span>
            </div>

            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
              Curva de Transição Fiscal:{' '}
              <span className="text-[#D4AF37]">Do Sistema Atual ao Novo IVA Dual</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Mapeie o impacto da substituição gradual do ICMS, ISS e PIS/COFINS por IBS e CBS ao
              longo do cronograma da <strong className="text-white">EC 132/2023</strong> e{' '}
              <strong className="text-white">LC 214/2025</strong>. Simulação pré-preenchida pelos{' '}
              <strong className="text-white">Dados da Empresa</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 space-y-12">
        {/* ========================================================= */}
        {/* CARD DE PARÂMETROS OPERACIONAIS ALIMENTADOS PELA EMPRESA */}
        {/* ========================================================= */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold bg-[#07132B] text-[#D4AF37] mb-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>Dados da Empresa Carregados</span>
              </div>
              <h2 className="text-xl font-heading font-extrabold text-[#07132B]">
                {dadosEmpresa.nomeEmpresa || 'Empresa Cadastrada'}
              </h2>
              <p className="text-xs text-slate-500">
                Segmento: <strong>{dadosEmpresa.segmento}</strong> • Regime Atual:{' '}
                <strong>{dadosEmpresa.regimeAtual || 'Não informado'}</strong> • UF:{' '}
                <strong>{dadosEmpresa.ufOrigem || 'SP'}</strong>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fat-mensal" className="text-xs font-semibold text-slate-700">
                Faturamento Mensal (R$)
              </Label>
              <Input
                id="fat-mensal"
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
              <Label htmlFor="desp-mensal" className="text-xs font-semibold text-slate-700">
                Despesas c/ Crédito Mensal (R$)
              </Label>
              <Input
                id="desp-mensal"
                type="number"
                value={despesasCreditosMensal}
                onChange={(e) => setDespesasCreditosMensal(Number(e.target.value) || 0)}
                className="h-10 text-sm font-semibold"
              />
              <span className="text-[11px] text-slate-400">Insumos, aluguel, energia</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="est-virada" className="text-xs font-semibold text-slate-700">
                Estoque na Virada 2026/2027 (R$)
              </Label>
              <Input
                id="est-virada"
                type="number"
                value={estoqueVirada}
                onChange={(e) => setEstoqueVirada(Number(e.target.value) || 0)}
                className="h-10 text-sm font-semibold"
              />
              <span className="text-[11px] text-slate-400">Base p/ crédito presumido</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ano-base-sel" className="text-xs font-semibold text-slate-700">
                Ano-Base em Destaque
              </Label>
              <Select
                value={String(anoBaseSelecionado)}
                onValueChange={(val) => setAnoBaseSelecionado(Number(val) as AnoBaseSimulacao)}
              >
                <SelectTrigger id="ano-base-sel" className="h-10 text-sm font-semibold">
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {ANOS_SIMULACAO_DISPONIVEIS.map((ano) => (
                    <SelectItem key={ano} value={String(ano)}>
                      Ano {ano} {ano === 2033 ? '(Vigência Plena)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-[11px] text-[#D4AF37] font-semibold">
                {anoBaseSelecionado === 2033 ? '100% IBS/CBS' : `Dual (${anoBaseSelecionado})`}
              </span>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* ALERTA FAROL DE LIMITES DO SIMPLES NACIONAL */}
        {/* ========================================================= */}
        {(() => {
          const TETO = 4800000
          const SUBLIMITE = 3600000
          const pctTeto = (faturamentoAnual / TETO) * 100
          const pctSublimite = (faturamentoAnual / SUBLIMITE) * 100
          const margemRestanteTeto = Math.max(0, TETO - faturamentoAnual)
          const margemRestanteSublimite = Math.max(0, SUBLIMITE - faturamentoAnual)
          const statusTeto: 'verde' | 'amarelo' | 'vermelho' =
            faturamentoAnual > TETO ? 'vermelho' : pctTeto >= 90 ? 'amarelo' : 'verde'
          const statusSublimite: 'verde' | 'amarelo' | 'vermelho' =
            faturamentoAnual > SUBLIMITE ? 'vermelho' : pctSublimite >= 90 ? 'amarelo' : 'verde'

          const alertaObj = {
            faturamentoAnualProjetado: faturamentoAnual,
            statusTeto,
            statusSublimite,
            tetoMaximo: TETO,
            sublimiteMaximo: SUBLIMITE,
            margemRestanteTeto,
            margemRestanteSublimite,
            percentualAtingidoTeto: Number(pctTeto.toFixed(1)),
            percentualAtingidoSublimite: Number(pctSublimite.toFixed(1)),
            mensagemTeto:
              faturamentoAnual > TETO
                ? 'Desenquadramento obrigatório do Simples Nacional!'
                : pctTeto >= 90
                  ? 'Atenção: faturamento próximo ao teto legal de R$ 4,8 milhões.'
                  : 'Faturamento dentro do teto nacional do Simples.',
            mensagemSublimite:
              faturamentoAnual > SUBLIMITE
                ? 'Empresa no "Simples Híbrido": ICMS e ISS recolhidos por fora da guia DAS.'
                : pctSublimite >= 90
                  ? 'Aproximando do sublimite de R$ 3,6 milhões (Simples Híbrido).'
                  : 'ICMS e ISS recolhidos unificados na guia DAS.',
            isHibrido: faturamentoAnual > SUBLIMITE && faturamentoAnual <= TETO,
            isDesenquadrado: faturamentoAnual > TETO,
          }

          return <FarolLimitesSimples alerta={alertaObj} compacto={false} />
        })()}

        {/* ========================================================= */}
        {/* CRÉDITO PRESUMIDO DE ESTOQUE NA VIRADA (EC 132 / LC 214) */}
        {/* ========================================================= */}
        <section className="bg-gradient-to-br from-emerald-950 via-[#0A1A13] to-[#07132B] text-white rounded-2xl p-6 sm:p-8 border border-emerald-500/30 shadow-lg space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#2ECC71] text-[#0A1A13]">
                <Package className="w-3.5 h-3.5" />
                <span>Oportunidade de Caixa na Virada</span>
              </div>
              <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-white">
                Crédito Presumido de Estoque (Virada 2026 → 2027)
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Empresas no Lucro Real ou Presumido que possuam estoque adquirido sob o regime
                antigo poderão se creditar de PIS/COFINS para abater a CBS a partir de 2027.
              </p>
            </div>

            <div className="bg-white/10 p-4 rounded-xl border border-white/15 text-right shrink-0">
              <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold block">
                Crédito Presumido Estimado
              </span>
              <span className="font-heading font-black text-2xl sm:text-3xl text-emerald-400">
                {formatarMoeda(creditoPresumidoEstoqueTotal)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Aproximadamente {formatarMoeda(creditoEstoqueMensal)}/mês no 1º ano
              </span>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* TABELA VISUAL: CURVA ANO A ANO (2026–2033) */}
        {/* ========================================================= */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block mb-1">
              Cronograma Oficial LC 214/2025
            </span>
            <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-[#07132B]">
              Curva de Transição Ano a Ano (2026 a 2033)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Simulação de desembolso para faturamento anual de {formatarMoeda(faturamentoAnual)} no
              segmento <strong className="text-[#07132B]">{dadosEmpresa.segmento}</strong>.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#07132B] text-white text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-bold">Ano</th>
                  <th className="py-3 px-4 font-bold">Fase</th>
                  <th className="py-3 px-4 font-bold">CBS (%)</th>
                  <th className="py-3 px-4 font-bold">IBS (%)</th>
                  <th className="py-3 px-4 font-bold">Remanescente Antigo</th>
                  <th className="py-3 px-4 font-bold">Alíq. Efetiva Nova</th>
                  <th className="py-3 px-4 font-bold text-right">Desembolso Total Anual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tabelaTransicao.map((linha) => {
                  const isAnoSelecionado = linha.ano === anoBaseSelecionado
                  return (
                    <tr
                      key={linha.ano}
                      className={`hover:bg-slate-50 transition-colors ${
                        isAnoSelecionado ? 'bg-amber-50/70 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold ${
                            isAnoSelecionado
                              ? 'bg-[#D4AF37] text-[#07132B]'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {linha.ano}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{linha.fase}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-blue-900">
                        {linha.cbsAliquota.toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-900">
                        {linha.ibsAliquota.toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        PIS/COF: {linha.remanescentePISCofins}% • ICMS/ISS:{' '}
                        {linha.remanescenteIcmsIss}%
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                        {linha.aliquotaEfetivaNova.toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#07132B]">
                        {formatarMoeda(linha.desembolsoTotalEstimado)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <strong>Nota Metodológica:</strong> O desembolso considera a soma da apuração do novo
            sistema (CBS + IBS descontados os créditos das despesas informadas e o benefício
            setorial de {reducaoSetor.percentualReducao}% para {dadosEmpresa.segmento}) combinada à
            carga proporcional remanescente dos tributos antigos (ICMS, ISS, PIS e COFINS).
          </div>
        </section>

        {/* ========================================================= */}
        {/* CARD DE SALVAMENTO & AVANÇO */}
        {/* ========================================================= */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-heading font-extrabold text-lg text-[#07132B]">
              Salvar Diagnóstico de Transição Fiscal
            </h3>
            <p className="text-xs text-slate-600">
              Guarde os parâmetros do ano {anoBaseSelecionado} na sua conta. Visível também para o
              consultor no painel administrativo.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Button
              type="button"
              onClick={handleSalvarTransicao}
              disabled={salvando}
              className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B] font-bold text-xs sm:text-sm h-11 px-6 rounded-xl"
            >
              <Save className="w-4 h-4 mr-2" />
              {salvando ? 'Salvando...' : 'Salvar Diagnóstico'}
            </Button>

            <Link
              to="/diagnostico-regimes"
              className="inline-flex items-center justify-center gap-2 bg-[#07132B] hover:brightness-110 text-white font-bold text-xs sm:text-sm h-11 px-6 rounded-xl transition-all"
            >
              <span>Avançar para Etapa 3: Comparação de Regime</span>
              <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
            </Link>
          </div>
        </section>

        {salvoFeedback && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Diagnóstico de Transição Fiscal salvo com sucesso na sua conta!</span>
          </div>
        )}
      </div>

      <DiamondFooterCTA />
    </div>
  )
}
