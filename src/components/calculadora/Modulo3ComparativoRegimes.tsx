import React from 'react'
import { Link } from 'react-router-dom'
import { useCalculadoraIbsCbs } from '@/context/CalculadoraIbsCbsContext'
import { formatarMoeda, formatarPorcentagem } from '@/lib/calculadoraUtils'
import {
  TipoAtividade,
  RAMOS_PRINCIPAIS_ATIVOS,
  LISTA_UFS_ICMS,
  SUBATIVIDADES_SERVICO,
  SUBATIVIDADES_INDUSTRIA,
  SUBATIVIDADES_COMERCIO,
  SUBATIVIDADES_AGRO,
  SUBATIVIDADES_CONSTRUCAO,
  SUBATIVIDADES_LOCACAO,
  SUBATIVIDADES_FOOD_SERVICE,
  SubatividadeServico,
  SubatividadeIndustria,
  SubatividadeComercio,
  SubatividadeAgro,
  SubatividadeConstrucao,
  SubatividadeLocacao,
  SubatividadeFoodService,
} from '@/types/calculadoraIbsCbs'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Slider } from '@/components/ui/slider'
import {
  Scale,
  Trophy,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  HelpCircle,
  Users,
  LineChart,
  Receipt,
  Globe2,
  MapPin,
  CheckCircle2,
  Info,
  Tag,
  Sparkles,
  Flame,
  ShieldCheck,
  RotateCcw,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FarolLimitesSimples } from '@/components/calculadora/FarolLimitesSimples'
import { BlocoSplitPayment } from '@/components/calculadora/BlocoSplitPayment'

export default function Modulo3ComparativoRegimes() {
  const {
    faturamentoMensal,
    setFaturamentoMensal,
    tipoAtividade,
    setTipoAtividade,
    subatividadeServico,
    setSubatividadeServico,
    subatividadeIndustria,
    setSubatividadeIndustria,
    subatividadeComercio,
    setSubatividadeComercio,
    subatividadeAgro,
    setSubatividadeAgro,
    subatividadeConstrucao,
    setSubatividadeConstrucao,
    subatividadeLocacao,
    setSubatividadeLocacao,
    subatividadeFoodService,
    setSubatividadeFoodService,
    aliquotaImpostoSeletivo,
    setAliquotaImpostoSeletivo,
    proporcaoServicoMisto,
    setProporcaoServicoMisto,
    percentualComprasVendasComparativo,
    setPercentualComprasVendasComparativo,
    folhaPagamentoMensal,
    setFolhaPagamentoMensal,
    margemLucroEstimada,
    setMargemLucroEstimada,
    despesasComCreditosMensais,
    setDespesasComCreditosMensais,
    percentualExportacao,
    setPercentualExportacao,
    ufOrigem,
    setUfOrigem,
    resultadoComparativo,
    alertaLimitesSimples,
    resultadoSplitPayment,
    taxaMensalCapitalGiro,
    setTaxaMensalCapitalGiro,
    diasAntecipacaoSplit,
    setDiasAntecipacaoSplit,
    origemDadosEmpresa,
    restaurarDadosEmpresaNoModulo,
  } = useCalculadoraIbsCbs()

  const handleFaturamentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const valor = Number(raw) / 100
    setFaturamentoMensal(valor)
  }

  const handleFolhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const valor = Number(raw) / 100
    setFolhaPagamentoMensal(valor)
  }

  const handleDespesasCreditoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const valor = Number(raw) / 100
    setDespesasComCreditosMensais(valor)
  }

  const { lucroReal, lucroPresumido, simplesNacional, ibsCbs, dadosAdicionais } =
    resultadoComparativo

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cabeçalho do Módulo */}
      <div className="bg-[#07132B] border border-[#D4AF37]/30 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 tracking-wider uppercase">
              <Scale className="w-3.5 h-3.5" />
              Módulo 3 • Comparativo por Regime
            </div>

            {/* BADGE DE INTEGRAÇÃO COM DADOS DA EMPRESA */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Alimentado pelos Dados da Empresa
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => restaurarDadosEmpresaNoModulo(3)}
                className="h-7 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1"
                title="Restaura faturamento, folha, margem, despesas com créditos, compras e UF a partir do perfil global"
              >
                <RotateCcw className="w-3 h-3" />
                Restaurar dados da empresa
              </Button>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
            Matriz Comparativa dos 4 Regimes
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
            Compare o impacto financeiro lado a lado entre Lucro Real, Lucro Presumido, Simples
            Nacional e o novo IVA Dual (IBS/CBS), identificando o modelo tributário mais eficiente.
          </p>
        </div>
      </div>

      {/* AVISO INFORMATIVO COM ATALHO PARA DADOS DA EMPRESA */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
          <span>
            Os blocos operacionais abaixo carregam diretamente os <strong>Dados da Empresa</strong>.
            Você pode experimentar variações para esta simulação ou restaurar os valores a qualquer
            momento.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => restaurarDadosEmpresaNoModulo(3)}
            className="h-6 px-2 text-xs font-semibold text-slate-700 hover:text-[#07132B]"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Restaurar dados
          </Button>
          <Link
            to="/dados-empresa"
            className="text-xs font-bold text-[#07132B] hover:text-[#D4AF37] underline"
          >
            Editar perfil da empresa →
          </Link>
        </div>
      </div>

      {/* Painel de Filtros e Parâmetros (Linha 1: Dados Básicos da Operação + Linha 2: Variáveis Avançadas) */}
      <div className="space-y-4">
        {/* Bloco 1: Campos Base da Operação */}
        <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#07132B] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
              1. Dados Operacionais da Empresa
            </span>
            <span className="text-xs text-slate-500">Atualização em tempo real</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Campo: Faturamento Mensal */}
            <div className="space-y-2">
              <Label htmlFor="fatMensal" className="text-sm font-bold text-[#07132B]">
                Faturamento Mensal (R$)
              </Label>
              <Input
                id="fatMensal"
                type="text"
                value={faturamentoMensal.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
                onChange={handleFaturamentoChange}
                className="text-lg font-bold font-mono text-[#07132B] bg-white border-slate-300 h-12 shadow-sm"
              />
              <span className="text-[11px] text-slate-500">
                Receita bruta operacional estimada por mês.
              </span>
            </div>

            {/* Campo: O que vende (Ramo Principal) */}
            <div className="space-y-2">
              <Label htmlFor="tipoAtividade" className="text-sm font-bold text-[#07132B]">
                O que Vende (Ramo Principal)
              </Label>
              <Select
                value={tipoAtividade}
                onValueChange={(val) => setTipoAtividade(val as TipoAtividade)}
              >
                <SelectTrigger
                  id="tipoAtividade"
                  className="h-12 bg-white border-slate-300 shadow-sm font-medium"
                >
                  <SelectValue placeholder="Selecione o tipo de atividade" />
                </SelectTrigger>
                <SelectContent className="max-w-xl">
                  {RAMOS_PRINCIPAIS_ATIVOS.map((ramo) => (
                    <SelectItem key={ramo.id} value={ramo.id}>
                      {ramo.label} ({ramo.subtitulo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-[11px] text-slate-500">
                Determina tributos incidentes (ISS, IPI, ICMS, IS), anexo do Simples e tratamento no
                IBS/CBS.
              </span>
            </div>

            {/* Campo: % Compras sobre Vendas */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="pctComprasComp" className="text-sm font-bold text-[#07132B]">
                  % de Compras sobre Vendas
                </Label>
                <span className="text-xs font-mono font-bold text-[#D4AF37] bg-[#07132B] px-2 py-0.5 rounded">
                  {percentualComprasVendasComparativo}%
                </span>
              </div>
              <div className="relative">
                <Input
                  id="pctComprasComp"
                  type="number"
                  min="0"
                  max="100"
                  value={percentualComprasVendasComparativo}
                  onChange={(e) => setPercentualComprasVendasComparativo(Number(e.target.value))}
                  className="text-lg font-bold font-mono text-[#07132B] bg-white border-slate-300 h-12 shadow-sm pr-10"
                />
                <span className="absolute right-4 top-3 text-slate-400 font-bold">%</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Base de compras diretas para apropriação de créditos.
              </span>
            </div>
          </div>

          {/* REQUISITO 1: SELETOR DE SUBATIVIDADE CONFORME O RAMO */}
          <div className="pt-2 border-t border-slate-200">
            {/* 1.1 Seletor Ramo Serviço */}
            {tipoAtividade === 'servico' && (
              <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/50 border border-blue-200/80 p-4 sm:p-5 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <Label
                    htmlFor="subServico"
                    className="text-sm font-bold text-[#07132B] flex items-center gap-2"
                  >
                    <Tag className="w-4 h-4 text-[#D4AF37]" />
                    Subatividade de Serviço (Refina Presunção IRPJ/CSLL e Reduções IBS/CBS)
                  </Label>
                  <span className="text-[11px] text-blue-700 font-semibold bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
                    5 perfis regulatórios disponíveis
                  </span>
                </div>
                <Select
                  value={subatividadeServico}
                  onValueChange={(val) => setSubatividadeServico(val as SubatividadeServico)}
                >
                  <SelectTrigger
                    id="subServico"
                    className="h-12 bg-white border-blue-300 shadow-sm font-medium text-slate-800"
                  >
                    <SelectValue placeholder="Selecione a subatividade de serviço" />
                  </SelectTrigger>
                  <SelectContent className="max-w-xl">
                    {SUBATIVIDADES_SERVICO.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="py-2.5">
                        <div className="text-left">
                          <span className="font-semibold text-slate-900 block">{item.label}</span>
                          <span className="text-xs text-slate-500 block leading-tight mt-0.5">
                            {item.descricao}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 text-xs text-blue-900/80 bg-blue-100/50 p-2.5 rounded-lg">
                  <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>
                    {subatividadeServico === 'tecnologia_software' ||
                    subatividadeServico === 'saude_educacao'
                      ? '✓ Aplica redução de 60% na alíquota padrão do IBS/CBS (regime diferenciado).'
                      : subatividadeServico === 'transporte'
                        ? '✓ Presunção de 16% no Lucro Presumido + redução de 30% no IBS/CBS.'
                        : '✓ Presunção integral de 32% sobre a receita e ISS municipal cheio.'}
                  </span>
                </div>
              </div>
            )}

            {/* 1.2 Seletor Ramo Indústria */}
            {tipoAtividade === 'industria' && (
              <div className="bg-gradient-to-r from-amber-50/70 to-orange-50/50 border border-amber-200/80 p-4 sm:p-5 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <Label
                    htmlFor="subIndustria"
                    className="text-sm font-bold text-[#07132B] flex items-center gap-2"
                  >
                    <Tag className="w-4 h-4 text-[#D4AF37]" />
                    Subatividade Industrial (Ajusta IPI e Imposto Seletivo)
                  </Label>
                  <span className="text-[11px] text-amber-800 font-semibold bg-white px-2.5 py-0.5 rounded-full border border-amber-200">
                    Impacta Lucro Real, Presumido e IVA Dual
                  </span>
                </div>
                <Select
                  value={subatividadeIndustria}
                  onValueChange={(val) => setSubatividadeIndustria(val as SubatividadeIndustria)}
                >
                  <SelectTrigger
                    id="subIndustria"
                    className="h-12 bg-white border-amber-300 shadow-sm font-medium text-slate-800"
                  >
                    <SelectValue placeholder="Selecione a subatividade industrial" />
                  </SelectTrigger>
                  <SelectContent className="max-w-xl">
                    {SUBATIVIDADES_INDUSTRIA.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="py-2.5">
                        <div className="text-left">
                          <span className="font-semibold text-slate-900 block">{item.label}</span>
                          <span className="text-xs text-slate-500 block leading-tight mt-0.5">
                            {item.descricao}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Bloco editável se for produto com Imposto Seletivo */}
                {subatividadeIndustria === 'produto_imposto_seletivo' && (
                  <div className="bg-rose-50/80 border border-rose-200 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-rose-600" />
                        Alíquota de Referência do Imposto Seletivo (IS):
                      </span>
                      <p className="text-[11px] text-rose-700 leading-tight">
                        Incidência monofásica/adicional no novo sistema sobre bens nocivos à
                        saúde/meio ambiente.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-28">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={aliquotaImpostoSeletivo}
                          onChange={(e) => setAliquotaImpostoSeletivo(Number(e.target.value))}
                          className="h-10 bg-white font-mono font-bold text-rose-900 border-rose-300 pr-7 text-right"
                        />
                        <span className="absolute right-2.5 top-2.5 text-xs text-rose-500 font-bold">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-amber-900/80 bg-amber-100/50 p-2.5 rounded-lg">
                  <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>
                    {subatividadeIndustria === 'industria_ipi_alto'
                      ? '✓ IPI elevado em 15% entra como débito e permite crédito nas aquisições produtivas.'
                      : subatividadeIndustria === 'industria_ipi_baixo_zero'
                        ? '✓ IPI zerado (0%) sem impacto de imposto sobre produtos industrializados.'
                        : subatividadeIndustria === 'produto_imposto_seletivo'
                          ? `✓ Aplica ${aliquotaImpostoSeletivo}% de Imposto Seletivo no cenário IBS/CBS mantido no novo sistema.`
                          : '✓ IPI padrão de 5% aplicado no Lucro Real e Presumido.'}
                  </span>
                </div>
              </div>
            )}

            {/* 1.3 Seletor Ramo Comércio */}
            {tipoAtividade === 'comercio' && (
              <div className="bg-gradient-to-r from-emerald-50/70 to-teal-50/50 border border-emerald-200/80 p-4 sm:p-5 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <Label
                    htmlFor="subComercio"
                    className="text-sm font-bold text-[#07132B] flex items-center gap-2"
                  >
                    <Tag className="w-4 h-4 text-[#D4AF37]" />
                    Subatividade de Comércio (ICMS Próprio vs ICMS-ST / Atacado)
                  </Label>
                  <span className="text-[11px] text-emerald-800 font-semibold bg-white px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Ajusta presunção de 8% e alíquotas de saída
                  </span>
                </div>
                <Select
                  value={subatividadeComercio}
                  onValueChange={(val) => setSubatividadeComercio(val as SubatividadeComercio)}
                >
                  <SelectTrigger
                    id="subComercio"
                    className="h-12 bg-white border-emerald-300 shadow-sm font-medium text-slate-800"
                  >
                    <SelectValue placeholder="Selecione a subatividade de comércio" />
                  </SelectTrigger>
                  <SelectContent className="max-w-xl">
                    {SUBATIVIDADES_COMERCIO.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="py-2.5">
                        <div className="text-left">
                          <span className="font-semibold text-slate-900 block">{item.label}</span>
                          <span className="text-xs text-slate-500 block leading-tight mt-0.5">
                            {item.descricao}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 text-xs text-emerald-900/80 bg-emerald-100/50 p-2.5 rounded-lg">
                  <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>
                    {subatividadeComercio === 'com_icms_st'
                      ? '✓ No ICMS-ST, o ICMS próprio da saída cai para ≈ 0% (já recolhido na fábrica). No novo IBS/CBS a ST é extinta em prol do split payment.'
                      : subatividadeComercio === 'atacado_distribuicao'
                        ? '✓ Atacado/distribuição com ICMS reduzido de ~12% (operações interestaduais/benefícios fiscais).'
                        : '✓ Varejo comum com ICMS integral estadual e presunção padrão de 8% no Lucro Presumido.'}
                  </span>
                </div>
              </div>
            )}

            {/* 1.4 Seletor Ramo Agronegócio */}
            {tipoAtividade === 'agronegocio' && (
              <div className="bg-gradient-to-r from-lime-50/70 to-emerald-50/50 border border-lime-200/80 p-4 sm:p-5 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <Label
                    htmlFor="subAgro"
                    className="text-sm font-bold text-[#07132B] flex items-center gap-2"
                  >
                    <Tag className="w-4 h-4 text-[#D4AF37]" />
                    Subatividade Agropecuária (Reduções IBS/CBS e Enquadramento Simples)
                  </Label>
                  <span className="text-[11px] text-lime-900 font-semibold bg-white px-2.5 py-0.5 rounded-full border border-lime-200">
                    4 perfis regulatórios rurais
                  </span>
                </div>
                <Select
                  value={subatividadeAgro}
                  onValueChange={(val) => setSubatividadeAgro(val as SubatividadeAgro)}
                >
                  <SelectTrigger
                    id="subAgro"
                    className="h-12 bg-white border-lime-300 shadow-sm font-medium text-slate-800"
                  >
                    <SelectValue placeholder="Selecione a subatividade do agronegócio" />
                  </SelectTrigger>
                  <SelectContent className="max-w-xl">
                    {SUBATIVIDADES_AGRO.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="py-2.5">
                        <div className="text-left">
                          <span className="font-semibold text-slate-900 block">{item.label}</span>
                          <span className="text-xs text-slate-500 block leading-tight mt-0.5">
                            {item.descricao}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 text-xs text-lime-950 bg-lime-100/60 p-2.5 rounded-lg">
                  <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>
                    {subatividadeAgro === 'hortifruti_cesta_basica'
                      ? '✓ Cesta Básica Nacional / Hortifrúti: alíquota ZERO (isenção de 100%) no IBS e CBS com manutenção de créditos.'
                      : subatividadeAgro === 'agroindustria_processamento'
                        ? '✓ Agroindústria: enquadramento no Anexo II do Simples Nacional (Indústria) e redução de 60% no IBS/CBS.'
                        : '✓ Produtor rural: Anexo I do Simples Nacional com redução de 60% na alíquota padrão do IBS/CBS.'}
                  </span>
                </div>
              </div>
            )}

            {/* 1.5 Seletor Ramo Construção Civil */}
            {tipoAtividade === 'construcao_civil' && (
              <div className="bg-gradient-to-r from-orange-50/70 to-amber-50/50 border border-orange-200/80 p-4 sm:p-5 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <Label
                    htmlFor="subConstrucao"
                    className="text-sm font-bold text-[#07132B] flex items-center gap-2"
                  >
                    <Tag className="w-4 h-4 text-[#D4AF37]" />
                    Subatividade de Construção Civil e Engenharia
                  </Label>
                  <span className="text-[11px] text-orange-900 font-semibold bg-white px-2.5 py-0.5 rounded-full border border-orange-200">
                    Anexo IV vs III (Fator R)
                  </span>
                </div>
                <Select
                  value={subatividadeConstrucao}
                  onValueChange={(val) => setSubatividadeConstrucao(val as SubatividadeConstrucao)}
                >
                  <SelectTrigger
                    id="subConstrucao"
                    className="h-12 bg-white border-orange-300 shadow-sm font-medium text-slate-800"
                  >
                    <SelectValue placeholder="Selecione a subatividade da construção civil" />
                  </SelectTrigger>
                  <SelectContent className="max-w-xl">
                    {SUBATIVIDADES_CONSTRUCAO.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="py-2.5">
                        <div className="text-left">
                          <span className="font-semibold text-slate-900 block">{item.label}</span>
                          <span className="text-xs text-slate-500 block leading-tight mt-0.5">
                            {item.descricao}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 text-xs text-orange-950 bg-orange-100/60 p-2.5 rounded-lg">
                  <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>
                    {subatividadeConstrucao === 'engenharia_projetos'
                      ? '✓ Engenharia e Projetos: sujeitos ao Fator R (LC 123/2006). Folha ≥ 28% qualifica para o Anexo III; se < 28%, cai no Anexo V.'
                      : '✓ Obras e Edificações: Anexo IV do Simples Nacional com CPP patronal (20%) recolhida por fora na folha de pagamento.'}
                  </span>
                </div>
              </div>
            )}

            {/* 1.6 Seletor Ramo Aluguel / Locação de Bens */}
            {tipoAtividade === 'locacao_bens' && (
              <div className="bg-gradient-to-r from-sky-50/70 to-blue-50/50 border border-sky-200/80 p-4 sm:p-5 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <Label
                    htmlFor="subLocacao"
                    className="text-sm font-bold text-[#07132B] flex items-center gap-2"
                  >
                    <Tag className="w-4 h-4 text-[#D4AF37]" />
                    Subatividade de Aluguel e Locação de Bens
                  </Label>
                  <span className="text-[11px] text-sky-900 font-semibold bg-white px-2.5 py-0.5 rounded-full border border-sky-200">
                    Anexo III sem ISS (Súmula 31)
                  </span>
                </div>
                <Select
                  value={subatividadeLocacao}
                  onValueChange={(val) => setSubatividadeLocacao(val as SubatividadeLocacao)}
                >
                  <SelectTrigger
                    id="subLocacao"
                    className="h-12 bg-white border-sky-300 shadow-sm font-medium text-slate-800"
                  >
                    <SelectValue placeholder="Selecione a subatividade de locação" />
                  </SelectTrigger>
                  <SelectContent className="max-w-xl">
                    {SUBATIVIDADES_LOCACAO.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="py-2.5">
                        <div className="text-left">
                          <span className="font-semibold text-slate-900 block">{item.label}</span>
                          <span className="text-xs text-slate-500 block leading-tight mt-0.5">
                            {item.descricao}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 text-xs text-sky-950 bg-sky-100/60 p-2.5 rounded-lg">
                  <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>
                    {subatividadeLocacao === 'coworking_espacos'
                      ? '✓ Coworking mescla locação e serviços administrativos: submete-se à regra do Fator R (Anexo III vs V).'
                      : '✓ Locação pura de bens móveis: não incide ISS (Súmula Vinculante 31 STF) e enquadra-se diretamente no Anexo III.'}
                  </span>
                </div>
              </div>
            )}

            {/* 1.7 Seletor Ramo Bares, Restaurantes e Food Service */}
            {tipoAtividade === 'food_service' && (
              <div className="bg-gradient-to-r from-red-50/70 to-rose-50/50 border border-red-200/80 p-4 sm:p-5 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <Label
                    htmlFor="subFoodService"
                    className="text-sm font-bold text-[#07132B] flex items-center gap-2"
                  >
                    <Tag className="w-4 h-4 text-[#D4AF37]" />
                    Subatividade de Bares, Restaurantes e Food Service
                  </Label>
                  <span className="text-[11px] text-red-900 font-semibold bg-white px-2.5 py-0.5 rounded-full border border-red-200">
                    Anexo I + Imposto Seletivo & Créditos Delivery
                  </span>
                </div>
                <Select
                  value={subatividadeFoodService}
                  onValueChange={(val) =>
                    setSubatividadeFoodService(val as SubatividadeFoodService)
                  }
                >
                  <SelectTrigger
                    id="subFoodService"
                    className="h-12 bg-white border-red-300 shadow-sm font-medium text-slate-800"
                  >
                    <SelectValue placeholder="Selecione o perfil de food service" />
                  </SelectTrigger>
                  <SelectContent className="max-w-xl">
                    {SUBATIVIDADES_FOOD_SERVICE.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="py-2.5">
                        <div className="text-left">
                          <span className="font-semibold text-slate-900 block">{item.label}</span>
                          <span className="text-xs text-slate-500 block leading-tight mt-0.5">
                            {item.descricao}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {subatividadeFoodService === 'bar_balada_bebidas' && (
                  <div className="bg-rose-50/80 border border-rose-200 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-rose-600" />
                        Alíquota do Imposto Seletivo sobre Bebidas Alcoólicas:
                      </span>
                      <p className="text-[11px] text-rose-700 leading-tight">
                        Incidência adicional monofásica no novo sistema sobre bebidas alcoólicas.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-28">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={aliquotaImpostoSeletivo}
                          onChange={(e) => setAliquotaImpostoSeletivo(Number(e.target.value))}
                          className="h-10 bg-white font-mono font-bold text-rose-900 border-rose-300 pr-7 text-right"
                        />
                        <span className="absolute right-2.5 top-2.5 text-xs text-rose-500 font-bold">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-red-950 bg-red-100/60 p-2.5 rounded-lg">
                  <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>
                    {subatividadeFoodService === 'bar_balada_bebidas'
                      ? `✓ Enquadramento no Anexo I com incidência adicional de ${aliquotaImpostoSeletivo}% de Imposto Seletivo sobre bebidas.`
                      : subatividadeFoodService === 'delivery_marmitaria'
                        ? '✓ Enquadramento no Anexo I e geração de 26,5% de crédito de IBS/CBS sobre comissões pagas aos aplicativos de entrega.'
                        : '✓ Enquadramento no Anexo I do Simples Nacional (refeições equiparadas a comércio) e presunção de 8% de IRPJ.'}
                  </span>
                </div>
              </div>
            )}

            {/* 1.8 Seletor Ramo Misto: Proporção + Subatividades das duas partes */}
            {tipoAtividade === 'misto' && (
              <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-bold text-amber-950 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#D4AF37]" />
                    Atividade Mista: Calibração das Duas Partes Proporcionais
                  </Label>
                  <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded">
                    {proporcaoServicoMisto}% Serviço | {100 - proporcaoServicoMisto}% Comércio
                  </span>
                </div>

                <Slider
                  value={[proporcaoServicoMisto]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(val) => setProporcaoServicoMisto(val[0])}
                  className="py-1"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5 bg-white p-3.5 rounded-lg border border-amber-200">
                    <Label className="text-xs font-bold text-slate-800">
                      Subatividade para a parte de Serviço ({proporcaoServicoMisto}%):
                    </Label>
                    <Select
                      value={subatividadeServico}
                      onValueChange={(val) => setSubatividadeServico(val as SubatividadeServico)}
                    >
                      <SelectTrigger className="h-10 bg-slate-50 border-slate-300 text-xs font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBATIVIDADES_SERVICO.map((item) => (
                          <SelectItem key={item.id} value={item.id} className="text-xs">
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 bg-white p-3.5 rounded-lg border border-amber-200">
                    <Label className="text-xs font-bold text-slate-800">
                      Subatividade para a parte de Comércio ({100 - proporcaoServicoMisto}%):
                    </Label>
                    <Select
                      value={subatividadeComercio}
                      onValueChange={(val) => setSubatividadeComercio(val as SubatividadeComercio)}
                    >
                      <SelectTrigger className="h-10 bg-slate-50 border-slate-300 text-xs font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBATIVIDADES_COMERCIO.map((item) => (
                          <SelectItem key={item.id} value={item.id} className="text-xs">
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bloco 2: NOVOS CAMPOS DE ALTA PRECISÃO */}
        <div className="bg-gradient-to-br from-white to-slate-50 border border-[#D4AF37]/30 p-6 rounded-2xl shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#07132B] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#07132B]" />
              2. Parâmetros Específicos para Precisão Tributária
            </span>
            <span className="text-xs font-mono font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Refina Simples (Fator R), Lucro Real, Exportação e ICMS Estadual
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {/* Novo Campo 1: Folha de Pagamento Mensal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="folhaPagamento"
                  className="text-xs font-bold text-[#07132B] flex items-center gap-1"
                >
                  <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Folha Mensal (R$)
                </Label>
                {dadosAdicionais && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      dadosAdicionais.fatorRQualificaAnexoIII
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    R = {dadosAdicionais.fatorRPercent}%
                  </span>
                )}
              </div>
              <Input
                id="folhaPagamento"
                type="text"
                value={folhaPagamentoMensal.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
                onChange={handleFolhaChange}
                className="text-base font-bold font-mono text-[#07132B] bg-white border-slate-300 h-11 shadow-sm"
              />
              <span className="text-[11px] text-slate-500 block leading-tight">
                Salários e pró-labore. Define Fator R (≥28% vai p/ Anexo III).
              </span>
            </div>

            {/* Novo Campo 2: Margem de Lucro Estimada (%) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="margemLucro"
                  className="text-xs font-bold text-[#07132B] flex items-center gap-1"
                >
                  <LineChart className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Margem de Lucro (%)
                </Label>
                <span className="text-xs font-mono font-bold text-[#D4AF37] bg-[#07132B] px-1.5 py-0.2 rounded">
                  {margemLucroEstimada}%
                </span>
              </div>
              <div className="relative">
                <Input
                  id="margemLucro"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={margemLucroEstimada}
                  onChange={(e) => setMargemLucroEstimada(Number(e.target.value))}
                  className="text-base font-bold font-mono text-[#07132B] bg-white border-slate-300 h-11 shadow-sm pr-8"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
              </div>
              <span className="text-[11px] text-slate-500 block leading-tight">
                Base de cálculo do Lucro Real sobre o lucro líquido contábil.
              </span>
            </div>

            {/* Novo Campo 3: Despesas com Créditos Mensais (R$) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="despesasCreditos"
                  className="text-xs font-bold text-[#07132B] flex items-center gap-1"
                >
                  <Receipt className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Despesas c/ Crédito (R$)
                </Label>
              </div>
              <Input
                id="despesasCreditos"
                type="text"
                value={despesasComCreditosMensais.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
                onChange={handleDespesasCreditoChange}
                className="text-base font-bold font-mono text-[#07132B] bg-white border-slate-300 h-11 shadow-sm"
              />
              <span className="text-[11px] text-slate-500 block leading-tight">
                Energia, aluguel, TI: gera crédito no LR e pleno no IBS/CBS.
              </span>
            </div>

            {/* Novo Campo 4: % de Exportação */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="pctExportacao"
                  className="text-xs font-bold text-[#07132B] flex items-center gap-1"
                >
                  <Globe2 className="w-3.5 h-3.5 text-[#D4AF37]" />% de Exportação
                </Label>
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                  {percentualExportacao}%
                </span>
              </div>
              <div className="relative">
                <Input
                  id="pctExportacao"
                  type="number"
                  min="0"
                  max="100"
                  value={percentualExportacao}
                  onChange={(e) => setPercentualExportacao(Number(e.target.value))}
                  className="text-base font-bold font-mono text-[#07132B] bg-white border-slate-300 h-11 shadow-sm pr-8"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
              </div>
              <span className="text-[11px] text-slate-500 block leading-tight">
                Receita de exportação imune nos 4 regimes mantendo créditos.
              </span>
            </div>

            {/* Novo Campo 5: UF de Origem */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="ufOrigem"
                  className="text-xs font-bold text-[#07132B] flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  UF de Origem
                </Label>
                {ufOrigem ? (
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    {dadosAdicionais?.aliquotaIcmsAplicada}%
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Padrão Módulo 1</span>
                )}
              </div>
              <Select
                value={ufOrigem || 'padrao'}
                onValueChange={(val) => setUfOrigem(val === 'padrao' ? '' : val)}
              >
                <SelectTrigger
                  id="ufOrigem"
                  className="h-11 bg-white border-slate-300 shadow-sm font-medium text-xs"
                >
                  <SelectValue placeholder="UF / Alíquota ICMS" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="padrao">
                    Padrão do Módulo 1 ({resultadoComparativo.dadosAdicionais?.aliquotaIcmsAplicada}
                    %)
                  </SelectItem>
                  {LISTA_UFS_ICMS.map((item) => (
                    <SelectItem key={item.uf} value={item.uf}>
                      {item.uf} - {item.nome} ({item.aliquotaInternaPadrao}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-[11px] text-slate-500 block leading-tight">
                Ajusta ICMS estadual conforme tabela padrão de cada UF.
              </span>
            </div>
          </div>

          {/* ETAPA 3: FARÓIS DO SIMPLES NACIONAL (TETO R$ 4,8M E SUBLIMITE R$ 3,6M) */}
          <div className="pt-2">
            <FarolLimitesSimples alerta={alertaLimitesSimples} compacto={false} />
          </div>
        </div>
      </div>

      {/* ETAPA 4: BLOCO IMPACTO DO SPLIT PAYMENT NO FLUXO DE CAIXA */}
      <BlocoSplitPayment
        resultadoSplitPayment={resultadoSplitPayment}
        taxaMensalCapitalGiro={taxaMensalCapitalGiro}
        setTaxaMensalCapitalGiro={setTaxaMensalCapitalGiro}
        diasAntecipacaoSplit={diasAntecipacaoSplit}
        setDiasAntecipacaoSplit={setDiasAntecipacaoSplit}
        regimeAtualNome={
          resultadoComparativo.regimeMaisVantajoso === 'Simples Nacional'
            ? 'Simples Nacional'
            : 'Lucro Presumido / Real'
        }
      />

      {/* Card de Conclusão / Vencedor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-emerald-900 to-[#07132B] text-white border-emerald-500/50 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardContent className="p-6 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Trophy className="w-4 h-4 text-[#D4AF37]" />
                Regime Mais Vantajoso Recomendado
              </span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-bold">
                1º Lugar
              </span>
            </div>
            <p className="text-3xl font-heading font-extrabold text-white">
              {resultadoComparativo.regimeMaisVantajoso}
            </p>
            <p className="text-xs text-slate-300">
              Apresenta a menor alíquota efetiva e o menor desembolso de impostos sobre o consumo.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 text-white border-slate-700 shadow-xl overflow-hidden relative">
          <CardContent className="p-6 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                <TrendingDown className="w-4 h-4 text-[#D4AF37]" />
                Economia versus o Pior Cenário ({resultadoComparativo.piorCenario})
              </span>
              <span className="text-xs bg-amber-400/20 text-[#D4AF37] px-2.5 py-1 rounded-full font-bold">
                -{formatarPorcentagem(resultadoComparativo.economiaPercentual)}
              </span>
            </div>
            <p className="text-3xl font-mono font-extrabold text-[#D4AF37]">
              {formatarMoeda(resultadoComparativo.economiaVersusPior)}
              <span className="text-xs font-normal text-slate-400 ml-1">/mês</span>
            </p>
            <p className="text-xs text-slate-300">
              Economia projetada de{' '}
              <strong className="text-white">
                {formatarMoeda(resultadoComparativo.economiaVersusPior * 12)} ao ano
              </strong>{' '}
              ao adotar o regime correto.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* REQUISITO 3: BADGE / CARD EM DESTAQUE COM A SUBATIVIDADE SELECIONADA PERTO DA TABELA */}
      <div className="bg-gradient-to-r from-slate-900 via-[#07132B] to-slate-900 text-white border border-[#D4AF37]/40 p-4 sm:p-5 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] uppercase tracking-wider font-bold text-[#D4AF37] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Subatividade Ativa no Diagnóstico:
            </span>
            <Badge className="bg-[#D4AF37] text-[#07132B] font-bold hover:bg-[#D4AF37]/90 text-xs px-2.5 py-0.5">
              {dadosAdicionais?.subatividadeAtivaNome || tipoAtividade}
            </Badge>
          </div>
          <p className="text-xs text-slate-300">
            Presunção de IRPJ:{' '}
            <strong className="text-white">{dadosAdicionais?.presuncaoIrpjAplicada}%</strong> |
            CSLL: <strong className="text-white">{dadosAdicionais?.presuncaoCsllAplicada}%</strong>
            {ibsCbs.reducaoAplicadaPercentual > 0 && (
              <>
                {' '}
                • Redução IBS/CBS:{' '}
                <strong className="text-emerald-400">
                  -{ibsCbs.reducaoAplicadaPercentual}% (Regime Diferenciado)
                </strong>
              </>
            )}
            {dadosAdicionais?.sujeitoImpostoSeletivo && (
              <>
                {' '}
                • Imposto Seletivo:{' '}
                <strong className="text-rose-400">
                  +{aliquotaImpostoSeletivo}% (Bens Nocivos)
                </strong>
              </>
            )}
            {dadosAdicionais?.isIcmsSubstituicaoTributaria && (
              <>
                {' '}
                • ICMS-ST:{' '}
                <strong className="text-amber-300">
                  ICMS Próprio ≈ 0% (Retenção pelo Fabricante)
                </strong>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Alíquota Efetiva IBS/CBS
            </span>
            <span className="text-lg font-mono font-extrabold text-[#D4AF37]">
              {formatarPorcentagem(ibsCbs.aliquotaEfetiva)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabela Comparativa com as 4 Colunas Conforme Especificação */}
      <Card className="border-slate-200 shadow-lg overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-heading font-bold text-lg text-[#07132B]">
              Tabela Comparativa de Alíquotas e Desembolso
            </h3>
            <p className="text-xs text-slate-500">
              Detalhamento de débitos, créditos apropriados e alíquota efetiva final em cada modelo.
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-[#07132B] text-white px-3 py-1 rounded-lg self-start sm:self-auto">
            Faturamento: {formatarMoeda(faturamentoMensal)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-100">
              <TableRow className="border-slate-200">
                <TableHead className="font-bold text-slate-700 min-w-[180px]">
                  Métrica / Linha
                </TableHead>
                <TableHead className="font-bold text-slate-800 text-center min-w-[140px] bg-slate-50">
                  Lucro Real
                </TableHead>
                <TableHead className="font-bold text-slate-800 text-center min-w-[140px] bg-slate-100">
                  Lucro Presumido
                </TableHead>
                <TableHead className="font-bold text-slate-800 text-center min-w-[140px] bg-slate-50">
                  Simples Nacional
                </TableHead>
                <TableHead className="font-bold text-[#07132B] text-center min-w-[160px] bg-[#D4AF37]/15 border-x-2 border-[#D4AF37]/40">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                    IBS / CBS (Novo)
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm divide-y divide-slate-100">
              {/* Linha 1: PIS ou CBS */}
              <TableRow className="hover:bg-slate-50/60">
                <TableCell className="font-medium text-slate-700">
                  <div className="font-bold">PIS ou CBS</div>
                  <div className="text-[11px] text-slate-400">Contribuição Federal</div>
                </TableCell>
                <TableCell className="text-center font-mono text-slate-700">
                  {formatarMoeda(lucroReal.pisOuCbs)}
                </TableCell>
                <TableCell className="text-center font-mono text-slate-700 bg-slate-50/50">
                  {formatarMoeda(lucroPresumido.pisOuCbs)}
                </TableCell>
                <TableCell className="text-center font-mono text-slate-700">
                  {formatarMoeda(simplesNacional.pisOuCbs)}
                </TableCell>
                <TableCell className="text-center font-mono font-bold text-blue-900 bg-[#D4AF37]/5 border-x-2 border-[#D4AF37]/40">
                  {formatarMoeda(ibsCbs.pisOuCbs)}
                  <span className="block text-[10px] text-slate-400 font-normal">
                    CBS (Federal)
                  </span>
                </TableCell>
              </TableRow>

              {/* Linha 2: COFINS ou IBS */}
              <TableRow className="hover:bg-slate-50/60">
                <TableCell className="font-medium text-slate-700">
                  <div className="font-bold">COFINS ou IBS</div>
                  <div className="text-[11px] text-slate-400">Seguridade / Subnacional</div>
                </TableCell>
                <TableCell className="text-center font-mono text-slate-700">
                  {formatarMoeda(lucroReal.cofinsOuIbs)}
                </TableCell>
                <TableCell className="text-center font-mono text-slate-700 bg-slate-50/50">
                  {formatarMoeda(lucroPresumido.cofinsOuIbs)}
                </TableCell>
                <TableCell className="text-center font-mono text-slate-700">
                  {formatarMoeda(simplesNacional.cofinsOuIbs)}
                </TableCell>
                <TableCell className="text-center font-mono font-bold text-emerald-900 bg-[#D4AF37]/5 border-x-2 border-[#D4AF37]/40">
                  {formatarMoeda(ibsCbs.cofinsOuIbs)}
                  <span className="block text-[10px] text-slate-400 font-normal">
                    IBS (Estados/Mun.)
                  </span>
                </TableCell>
              </TableRow>

              {/* Linha 3: IPI / ICMS / ISS / Imposto Seletivo */}
              <TableRow className="hover:bg-slate-50/60">
                <TableCell className="font-medium text-slate-700">
                  <div className="font-bold">
                    {dadosAdicionais?.sujeitoImpostoSeletivo
                      ? 'IPI / ICMS / ISS / Imposto Seletivo (IS)'
                      : 'IPI / ICMS / ISS'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {dadosAdicionais?.sujeitoImpostoSeletivo
                      ? 'Antigos extintos no IBS/CBS; IS incidente'
                      : 'Tributos Antigos Extintos no IBS/CBS'}
                  </div>
                </TableCell>
                <TableCell className="text-center font-mono text-slate-700">
                  {formatarMoeda(lucroReal.ipiOuIcmsOuIss)}
                </TableCell>
                <TableCell className="text-center font-mono text-slate-700 bg-slate-50/50">
                  {formatarMoeda(lucroPresumido.ipiOuIcmsOuIss)}
                </TableCell>
                <TableCell className="text-center font-mono text-slate-700">
                  {formatarMoeda(simplesNacional.ipiOuIcmsOuIss)}
                </TableCell>
                <TableCell className="text-center font-mono font-bold bg-[#D4AF37]/5 border-x-2 border-[#D4AF37]/40">
                  {dadosAdicionais?.sujeitoImpostoSeletivo ? (
                    <div>
                      <span className="text-rose-700 font-extrabold">
                        {formatarMoeda(ibsCbs.impostoSeletivo)}
                      </span>
                      <span className="block text-[10px] text-rose-600 font-medium">
                        IS ({aliquotaImpostoSeletivo}%) no Sistema Novo
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-emerald-600">R$ 0,00</span>
                      <span className="block text-[10px] text-emerald-700 font-semibold">
                        100% Extintos
                      </span>
                    </div>
                  )}
                </TableCell>
              </TableRow>

              {/* Linha 4: Total Nominal */}
              <TableRow className="hover:bg-slate-50/60 bg-slate-50/40">
                <TableCell className="font-bold text-slate-900">Total Nominal (Débitos)</TableCell>
                <TableCell className="text-center font-mono font-semibold text-slate-800">
                  {formatarMoeda(lucroReal.totalNominal)}
                </TableCell>
                <TableCell className="text-center font-mono font-semibold text-slate-800 bg-slate-50/50">
                  {formatarMoeda(lucroPresumido.totalNominal)}
                </TableCell>
                <TableCell className="text-center font-mono font-semibold text-slate-800">
                  {formatarMoeda(simplesNacional.totalNominal)}
                </TableCell>
                <TableCell className="text-center font-mono font-extrabold text-[#07132B] bg-[#D4AF37]/10 border-x-2 border-[#D4AF37]/40">
                  {formatarMoeda(ibsCbs.totalNominal)}
                </TableCell>
              </TableRow>

              {/* Linha 5: Créditos */}
              <TableRow className="hover:bg-slate-50/60">
                <TableCell className="font-medium text-slate-700">
                  <div className="font-bold text-emerald-700">(-) Créditos Recuperáveis</div>
                  <div className="text-[11px] text-slate-400">Sobre compras de insumos</div>
                </TableCell>
                <TableCell className="text-center font-mono text-emerald-700 font-medium">
                  - {formatarMoeda(lucroReal.creditos)}
                </TableCell>
                <TableCell className="text-center font-mono text-slate-400 bg-slate-50/50">
                  R$ 0,00 (Cumulativo)
                </TableCell>
                <TableCell className="text-center font-mono text-slate-400">
                  R$ 0,00 (Sem crédito)
                </TableCell>
                <TableCell className="text-center font-mono font-bold text-emerald-700 bg-[#D4AF37]/5 border-x-2 border-[#D4AF37]/40">
                  - {formatarMoeda(ibsCbs.creditos)}
                </TableCell>
              </TableRow>

              {/* Linha 6: Total Efetivo */}
              <TableRow className="bg-slate-100/70 border-t-2 border-slate-300">
                <TableCell className="font-extrabold text-[#07132B]">
                  Total Efetivo a Recolher
                </TableCell>
                <TableCell
                  className={`text-center font-mono font-extrabold text-base ${
                    resultadoComparativo.regimeMaisVantajoso === 'Lucro Real'
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-slate-800'
                  }`}
                >
                  {formatarMoeda(lucroReal.totalEfetivo)}
                </TableCell>
                <TableCell
                  className={`text-center font-mono font-extrabold text-base bg-slate-50/50 ${
                    resultadoComparativo.regimeMaisVantajoso === 'Lucro Presumido'
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-slate-800'
                  }`}
                >
                  {formatarMoeda(lucroPresumido.totalEfetivo)}
                </TableCell>
                <TableCell
                  className={`text-center font-mono font-extrabold text-base ${
                    resultadoComparativo.regimeMaisVantajoso === 'Simples Nacional'
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-slate-800'
                  }`}
                >
                  {formatarMoeda(simplesNacional.totalEfetivo)}
                </TableCell>
                <TableCell
                  className={`text-center font-mono font-extrabold text-lg border-x-2 border-[#D4AF37]/40 ${
                    resultadoComparativo.regimeMaisVantajoso === 'IBS/CBS'
                      ? 'text-emerald-800 bg-emerald-100/70'
                      : 'text-[#07132B] bg-[#D4AF37]/20'
                  }`}
                >
                  {formatarMoeda(ibsCbs.totalEfetivo)}
                </TableCell>
              </TableRow>

              {/* Linha 7: Alíquota Efetiva */}
              <TableRow className="bg-white">
                <TableCell className="font-bold text-slate-900">Alíquota Efetiva Final</TableCell>
                <TableCell className="text-center font-mono font-bold text-slate-800">
                  {formatarPorcentagem(lucroReal.aliquotaEfetiva)}
                </TableCell>
                <TableCell className="text-center font-mono font-bold text-slate-800 bg-slate-50/50">
                  {formatarPorcentagem(lucroPresumido.aliquotaEfetiva)}
                </TableCell>
                <TableCell className="text-center font-mono font-bold text-slate-800">
                  {formatarPorcentagem(simplesNacional.aliquotaEfetiva)}
                </TableCell>
                <TableCell className="text-center font-mono font-extrabold text-[#07132B] bg-[#D4AF37]/20 border-x-2 border-[#D4AF37]/40">
                  {formatarPorcentagem(ibsCbs.aliquotaEfetiva)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Bloco de Transparência Didática Padrão Contabilidade 5.0 */}
      <Card className="border border-slate-200 bg-white shadow-md overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-[#D4AF37]" />
            <h4 className="font-heading font-bold text-sm text-[#07132B]">
              Transparência Didática dos Parâmetros Aplicados no Cálculo
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Entenda como cada campo novo refinou os 4 regimes
          </span>
        </div>
        <CardContent className="p-5 space-y-4">
          {/* REQUISITO 3: Bloco em linguagem simples ("sem juridiquês") explicando o que a subatividade mudou */}
          {dadosAdicionais?.impactosDidaticosSubatividade &&
            dadosAdicionais.impactosDidaticosSubatividade.length > 0 && (
              <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs font-bold uppercase tracking-wide text-amber-950">
                    O que a Subatividade Escolhida Mudou no Seu Cálculo (Sem Juridiquês)
                  </span>
                </div>
                <ul className="space-y-1.5 text-xs text-amber-950">
                  {dadosAdicionais.impactosDidaticosSubatividade.map((impacto, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
                      <span>{impacto}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Item 1: Enquadramento do Simples Nacional & Fator R */}
            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-semibold mb-0.5">
                  1. Enquadramento no Simples Nacional & Fator R:
                </strong>
                <div className="space-y-1 text-slate-600 leading-relaxed">
                  <p>
                    Anexo Aplicado:{' '}
                    <strong className="text-[#07132B] bg-amber-100/60 px-1.5 py-0.5 rounded border border-amber-200">
                      {simplesNacional.anexoUtilizado}
                    </strong>{' '}
                    — {simplesNacional.faixaEncontrada}.
                  </p>
                  {faturamentoMensal > 0 && (
                    <div className="text-[11px] text-slate-500 space-y-1 mt-1">
                      <p>
                        Folha de {formatarMoeda(folhaPagamentoMensal)} sobre receita de{' '}
                        {formatarMoeda(faturamentoMensal)} resulta em{' '}
                        <strong className="text-[#07132B]">
                          Fator R = {dadosAdicionais?.fatorRPercent}%
                        </strong>
                        .
                      </p>
                      {tipoAtividade === 'servico' ||
                      (tipoAtividade === 'construcao_civil' &&
                        subatividadeConstrucao === 'engenharia_projetos') ||
                      (tipoAtividade === 'locacao_bens' &&
                        subatividadeLocacao === 'coworking_espacos') ? (
                        dadosAdicionais?.fatorRQualificaAnexoIII ? (
                          <span className="text-emerald-700 font-semibold block">
                            ✓ Qualificado para o Anexo III (R ≥ 28%: alíquotas a partir de 6%,
                            economizando expressivamente frente aos 15,5% do Anexo V).
                          </span>
                        ) : (
                          <span className="text-amber-700 font-semibold block">
                            ⚠️ Folha inferior a 28% (R &lt; 28%): enquadrado no Anexo V (inicia em
                            15,5%). Caso a folha alcance 28% (R${' '}
                            {formatarMoeda(faturamentoMensal * 0.28)}), a empresa migra para o Anexo
                            III (economia direta).
                          </span>
                        )
                      ) : (
                        <span className="text-slate-700 font-medium block">
                          {tipoAtividade === 'construcao_civil'
                            ? 'Obras civis e edificações são enquadradas no Anexo IV (CPP patronal recolhida por fora na folha).'
                            : tipoAtividade === 'locacao_bens'
                              ? 'Locação de bens móveis enquadrada no Anexo III diretamente, sem incidência de ISS (Súmula Vinculante 31 STF).'
                              : tipoAtividade === 'agronegocio'
                                ? 'Agronegócio enquadrado no Anexo I (produção/venda) ou Anexo II (agroindústria).'
                                : tipoAtividade === 'food_service'
                                  ? 'Bares e restaurantes enquadrados no Anexo I (refeições equiparadas a comércio).'
                                  : `Atividade regida por anexo próprio (${simplesNacional.anexoUtilizado}).`}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Item 2: Margem de Lucro e Presunção no Lucro Real e Presumido */}
            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-semibold mb-0.5">
                  2. Margem de Lucro e Presunção de IRPJ/CSLL:
                </strong>
                <p className="text-slate-600 leading-relaxed">
                  No Lucro Presumido, a base de presunção é de{' '}
                  <strong className="text-[#07132B]">
                    {dadosAdicionais?.presuncaoIrpjAplicada}%
                  </strong>{' '}
                  (conforme a subatividade). Já no Lucro Real, o imposto incide sobre a margem de
                  lucro contábil informada ({margemLucroEstimada}% ={' '}
                  {formatarMoeda((faturamentoMensal * margemLucroEstimada) / 100)}/mês).
                </p>
              </div>
            </div>

            {/* Item 3: Despesas com Crédito */}
            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-semibold mb-0.5">
                  3. Despesas com Créditos Recuperáveis:
                </strong>
                <p className="text-slate-600 leading-relaxed">
                  Despesas operacionais ({formatarMoeda(despesasComCreditosMensais)}) geram{' '}
                  <strong className="text-emerald-700">
                    {formatarMoeda(dadosAdicionais?.creditosDespesasReal || 0)}
                  </strong>{' '}
                  no Lucro Real (PIS/COFINS 9,25%) e{' '}
                  <strong className="text-emerald-700">
                    {formatarMoeda(dadosAdicionais?.creditosDespesasIbsCbs || 0)}
                  </strong>{' '}
                  no IBS/CBS pleno (alíquota total do IVA Dual), desonerando o novo modelo.
                </p>
              </div>
            </div>

            {/* Item 4: % de Exportação & UF de Origem */}
            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-semibold mb-0.5">
                  4. Exportação Imune & Alíquota ICMS por UF:
                </strong>
                <p className="text-slate-600 leading-relaxed">
                  {percentualExportacao > 0 ? (
                    <>
                      {percentualExportacao}% da receita (
                      {formatarMoeda(dadosAdicionais?.receitaExportacaoIsenta || 0)}) foi excluída
                      da base tributável em todos os regimes por imunidade constitucional com
                      manutenção de créditos.
                    </>
                  ) : (
                    'Exportações são 100% imunes em todos os regimes. '
                  )}
                  {ufOrigem ? (
                    <>
                      {' '}
                      ICMS calibrado pela alíquota interna oficial de{' '}
                      <strong className="text-[#07132B]">
                        {ufOrigem} ({dadosAdicionais?.aliquotaIcmsAplicada}%)
                      </strong>
                      .
                    </>
                  ) : (
                    ' ICMS utilizando padrão do Módulo 1 (selecione uma UF para personalizar a alíquota estadual).'
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
