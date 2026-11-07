import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCalculadoraIbsCbs } from '@/context/CalculadoraIbsCbsContext'
import { formatarMoeda, formatarPorcentagem } from '@/lib/calculadoraUtils'
import { TipoAtividade, PRESETS_SETORES_LC214 } from '@/types/calculadoraIbsCbs'
import { BadgeOrigemPropagada } from '@/components/calculadora/BadgeOrigemPropagada'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Clock,
  ShieldAlert,
  RotateCcw,
  Building2,
  Sparkles,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

import {
  PainelProximosPassosCalculadora,
  ModuloCalculadoraId,
} from '@/components/calculadora/PainelProximosPassosCalculadora'
import { BarraAcoesSimulacao } from '@/components/calculadora/BarraAcoesSimulacao'

export interface Modulo5TransicaoCronogramaProps {
  onNavegarModulo?: (moduloId: ModuloCalculadoraId) => void
  onSalvarSimulacao?: () => void
  onBaixarPdf?: () => void
  onExportarDados?: () => void
  gerandoPdf?: boolean
}

export default function Modulo5TransicaoCronograma({
  onNavegarModulo,
  onSalvarSimulacao,
  onBaixarPdf,
  onExportarDados,
  gerandoPdf = false,
}: Modulo5TransicaoCronogramaProps = {}) {
  const {
    faturamentoAnualProjetado,
    setFaturamentoAnualProjetado,
    setorTransicao,
    setSetorTransicao,
    valorEstoqueVirada,
    setValorEstoqueVirada,
    resultadoTransicao,
    resultadoEstoque,
    config,
    origemDadosEmpresa,
    restaurarDadosEmpresaNoModulo,
    origensPropagadas,
  } = useCalculadoraIbsCbs()

  // Sincronizado com o ano selecionado no Módulo 1 (se houver) ou 2027 como padrão
  const [anoSelecionado, setAnoSelecionado] = useState<number | 'atual'>(
    config.anoTransicao !== undefined ? config.anoTransicao : 2027,
  )

  // Atualiza quando o ano no Módulo 1 mudar
  React.useEffect(() => {
    if (config.anoTransicao !== undefined) {
      setAnoSelecionado(config.anoTransicao)
    }
  }, [config.anoTransicao])

  const handleFaturamentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const valor = Number(raw) / 100
    setFaturamentoAnualProjetado(valor)
  }

  const handleEstoqueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const valor = Number(raw) / 100
    setValorEstoqueVirada(valor)
  }

  // Dados para o gráfico Recharts de evolução da alíquota efetiva
  const dadosGrafico = resultadoTransicao.map((item) => ({
    ano: item.ano === 'atual' ? 'Atual' : String(item.ano),
    aliquotaEfetiva: item.aliquotaEfetivaTotal,
    aliquotaCbs: item.aliquotaCbs,
    aliquotaIbs: item.aliquotaIbs,
    impostoEstimado: item.impostoEstimado,
    impostoCenarioAtual: item.impostoCenarioAtual,
  }))

  const anoAtualDetalhe =
    resultadoTransicao.find((item) => item.ano === anoSelecionado) || resultadoTransicao[0]

  // Totais comparativos acumulados no período de transição
  const totalTransicaoAcumulado = resultadoTransicao.reduce(
    (acc, curr) => acc + curr.impostoEstimado,
    0,
  )
  const totalAtualAcumulado = resultadoTransicao.reduce(
    (acc, curr) => acc + curr.impostoCenarioAtual,
    0,
  )
  const diferencaAcumulada = totalTransicaoAcumulado - totalAtualAcumulado

  // Perfil 100% prestador de serviços (mesma convenção adotada nos Módulos 1, 2, 3, 4 e 6)
  const isPerfilServico = setorTransicao === 'servico'

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cabeçalho do Módulo */}
      <div className="bg-[#07132B] border border-[#D4AF37]/30 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 tracking-wider uppercase">
              <Calendar className="w-3.5 h-3.5" />
              Módulo 5 • Cronograma Legal LC 214/2025
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => restaurarDadosEmpresaNoModulo(5)}
              className="h-7 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1"
              title="Restaura faturamento anual projetado (fat. mensal × 12) e setor a partir dos Dados da Empresa"
            >
              <RotateCcw className="w-3 h-3" />
              Restaurar dados da empresa
            </Button>
          </div>

          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
            Transição Tributária 2026 a 2033
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
            {isPerfilServico
              ? 'Acompanhe o cronograma de 8 anos da reforma constitucional para prestadores de serviços. Simule o desembolso ano a ano e monitore a transição do ISS municipal e PIS/COFINS para o modelo IBS e CBS com direito a crédito de insumos operacionais e serviços tomados.'
              : 'Acompanhe o cronograma de 8 anos da reforma constitucional. Simule o desembolso ano a ano e monitore os anos críticos da substituição do ICMS, ISS e PIS/COFINS por IBS e CBS.'}
          </p>
        </div>
      </div>

      {/* AVISO INFORMATIVO COM ATALHO PARA DADOS DA EMPRESA */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
          <span>
            Faturamento anual e setor iniciam calibrados com os <strong>Dados da Empresa</strong>.
            Você pode testar outros cenários de crescimento nesta simulação.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => restaurarDadosEmpresaNoModulo(5)}
            className="h-6 px-2 text-xs font-semibold text-slate-700 hover:text-[#07132B]"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Restaurar
          </Button>
          <Link
            to="/dados-empresa"
            className="text-xs font-bold text-[#07132B] hover:text-[#D4AF37] underline"
          >
            Editar perfil da empresa →
          </Link>
        </div>
      </div>

      {/* Painel de Entradas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 border border-slate-200/80 p-6 rounded-2xl shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <Label htmlFor="fatAnual" className="text-sm font-bold text-[#07132B]">
              Faturamento Anual Projetado (R$)
            </Label>
            {origensPropagadas?.modulo5Faturamento && (
              <BadgeOrigemPropagada texto="vindo do Módulo 1 (×12) — editável aqui" />
            )}
          </div>
          <Input
            id="fatAnual"
            type="text"
            value={faturamentoAnualProjetado.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
            onChange={handleFaturamentoChange}
            className="text-lg font-bold font-mono text-[#07132B] bg-white border-slate-300 h-12 shadow-sm"
          />
          <span className="text-[11px] text-slate-500">
            {isPerfilServico
              ? 'Receita bruta anual de prestação de serviços projetada para cálculo do desembolso tributário.'
              : 'Receita anual projetada para cálculo do desembolso tributário.'}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <Label htmlFor="setorTransicao" className="text-sm font-bold text-[#07132B]">
              Setor Econômico da Empresa
            </Label>
            {origensPropagadas?.modulo5SetorTransicao && (
              <BadgeOrigemPropagada texto="vindo do Módulo 1 — editável aqui" />
            )}
          </div>
          <Select
            value={setorTransicao}
            onValueChange={(val) => setSetorTransicao(val as TipoAtividade)}
          >
            <SelectTrigger
              id="setorTransicao"
              className="h-12 bg-white border-slate-300 shadow-sm font-medium"
            >
              <SelectValue placeholder="Selecione o setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="servico">Serviços em Geral (ISS no antigo)</SelectItem>
              <SelectItem value="comercio">
                Comércio Varejista/Atacadista (ICMS no antigo)
              </SelectItem>
              <SelectItem value="industria">Indústria e Manufatura (IPI/ICMS no antigo)</SelectItem>
              <SelectItem value="agronegocio">
                Agronegócio / Produtor rural (Redução 60% ou Cesta Básica)
              </SelectItem>
              <SelectItem value="construcao_civil">
                Construção civil e engenharia (Anexo IV / Obras)
              </SelectItem>
              <SelectItem value="locacao_bens">
                Aluguel / Locação de bens (Sem ISS Súmula 31)
              </SelectItem>
              <SelectItem value="food_service">
                Bares / Restaurantes e food service (Anexo I / Imposto Seletivo)
              </SelectItem>
              <SelectItem value="misto">Atividade Mista (Serviço + Comércio)</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-[11px] text-slate-500">
            {isPerfilServico
              ? 'Define o perfil de prestação de serviços e a trajetória do ISS municipal para IBS/CBS.'
              : 'Define o regime tributário de partida e os tributos afetados ano a ano.'}
          </span>
        </div>
      </div>

      {/* CARD ORIENTATIVO PARA 100% PRESTADOR DE SERVIÇOS (sem estoque de mercadorias) */}
      {isPerfilServico && (
        <Card className="border border-blue-200/80 shadow-sm bg-gradient-to-br from-blue-50/60 to-white overflow-hidden">
          <CardContent className="p-5 sm:p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
                <h3 className="text-base font-heading font-bold text-[#07132B]">
                  Transição para Prestadores de Serviços • LC 214/2025
                </h3>
              </div>
              <span className="text-[11px] font-bold text-blue-800 bg-blue-100 border border-blue-200 px-2.5 py-0.5 rounded-full">
                Atividade Sem Estoque Físico
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Como empresa 100% prestadora de serviços, não há apuração de estoque presumido de
              mercadorias na virada de 2026 para 2027. O direito a créditos na transição
              concentra-se integralmente sobre{' '}
              <strong>
                insumos operacionais, licenças de software, serviços de terceiros, tecnologia,
                telecomunicações e locações corporativas
              </strong>
              , garantindo a não-cumulatividade plena da CBS e do IBS.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-500 font-semibold block uppercase">
                  Créditos de Transição
                </span>
                <span className="font-bold text-[#07132B] mt-0.5 block">
                  Insumos e Serviços Tomados
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Softwares, nuvem, subcontratações e despesas operacionais da atividade.
                </span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-500 font-semibold block uppercase">
                  Tributo Subnacional
                </span>
                <span className="font-bold text-emerald-800 mt-0.5 block">
                  Transição Gradual do ISS
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  ISS municipal reduzido gradualmente (90% a 60%) entre 2029 e 2032.
                </span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-500 font-semibold block uppercase">
                  Tributo Federal
                </span>
                <span className="font-bold text-blue-900 mt-0.5 block">CBS Plena em 2027</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Extinção do PIS/COFINS e início da CBS (8,80%) com crédito financeiro amplo.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 5: BLOCO DE CRÉDITO PRESUMIDO DE ESTOQUE NA TRANSIÇÃO (apenas para atividades com estoque físico) */}
      {setorTransicao !== 'servico' && (
        <Card className="border border-[#D4AF37]/50 shadow-md bg-white overflow-hidden">
          <div className="bg-gradient-to-r from-[#07132B] to-[#122347] text-white p-5 border-b border-[#D4AF37]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5" />
                Etapa 5 • Crédito de Abertura
              </div>
              <h3 className="text-lg font-heading font-extrabold text-white">
                Crédito Presumido de Estoque na Transição (Virada de 2026 para 2027)
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Evite bitributação: mercadorias em estoque na virada geram direito a crédito de
                abertura da CBS plena (8,80%), abatendo diretamente o imposto do primeiro ano
                (2027).
              </p>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10 shrink-0 text-left sm:text-right">
              <span className="text-[10px] text-slate-300 uppercase tracking-wider block font-semibold">
                Crédito Presumido Total
              </span>
              <span className="text-xl font-mono font-extrabold text-[#D4AF37]">
                {formatarMoeda(resultadoEstoque.creditoTotalEstoque)}
              </span>
            </div>
          </div>

          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Campo Editável: Valor do Estoque na Virada */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <Label htmlFor="valorEstoque" className="text-xs font-bold text-[#07132B] block">
                  Valor de Estoque em Posse na Virada (R$)
                </Label>
                <Input
                  id="valorEstoque"
                  type="text"
                  value={valorEstoqueVirada.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                  onChange={handleEstoqueChange}
                  className="text-base font-bold font-mono text-[#07132B] bg-white border-slate-300 h-11"
                />
                <span className="text-[11px] text-slate-500 block leading-tight">
                  Custo de aquisição do inventário físico apurado no balanço de encerramento de
                  2026.
                </span>
              </div>

              {/* Alíquota de Crédito Presumido Aplicada */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1">
                <span className="text-xs font-bold text-blue-900 block uppercase tracking-wide">
                  Alíquota do Crédito Presumido
                </span>
                <p className="text-2xl font-mono font-bold text-blue-900">
                  {formatarPorcentagem(resultadoEstoque.aliquotaCreditoPresumido)}
                </p>
                <p className="text-[11px] text-blue-700 leading-tight">
                  Baseado na CBS plena incidente na abertura dos novos fatos geradores a partir de
                  2027.
                </p>
              </div>

              {/* Abatimento Direto no Ano 1 */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-1">
                <span className="text-xs font-bold text-emerald-900 block uppercase tracking-wide">
                  Abatimento no 1º Ano (2027)
                </span>
                <p className="text-2xl font-mono font-bold text-emerald-700">
                  - {formatarMoeda(resultadoEstoque.economiaAno1)}
                </p>
                <p className="text-[11px] text-emerald-800 leading-tight">
                  Crédito financeiro direto deduzido da guia de CBS a pagar na curva de transição de
                  2027.
                </p>
              </div>
            </div>

            {/* Explicação sem juridiquês do estoque */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/90 text-xs text-amber-950 space-y-1">
              <strong className="block font-bold">
                Como funciona o crédito de estoque na prática (Sem Juridiquês):
              </strong>
              <p className="leading-relaxed">{resultadoEstoque.explicacaoSimples}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Linha do Tempo Interativa de 2026 a 2033 Conforme Especificação */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-lg text-[#07132B] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#D4AF37]" />
            Linha do Tempo Oficial de Transição
          </h3>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Clique em um ano para inspecionar os detalhes
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
          {resultadoTransicao.map((item) => {
            const isSelected = item.ano === anoSelecionado
            const isCritical = item.ano === 2027 || item.ano === 2033

            return (
              <button
                key={String(item.ano)}
                type="button"
                onClick={() => setAnoSelecionado(item.ano)}
                className={`relative p-2.5 rounded-xl border transition-all text-center flex flex-col items-center justify-between min-h-[95px] ${
                  isSelected
                    ? 'bg-[#07132B] text-white border-[#D4AF37] ring-2 ring-[#D4AF37]/50 shadow-lg scale-105 z-10'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-[#D4AF37]/50 hover:bg-slate-50'
                }`}
              >
                {isCritical && (
                  <span className="absolute -top-2 px-1.5 py-0.2 text-[9px] font-bold uppercase rounded-full bg-amber-500 text-slate-950">
                    Crítico
                  </span>
                )}
                <span
                  className={`text-sm sm:text-base font-extrabold ${isSelected ? 'text-[#D4AF37]' : 'text-slate-900'}`}
                >
                  {item.ano === 'atual' ? 'Atual' : item.ano}
                </span>
                <span className="text-[10px] font-medium leading-tight line-clamp-2 mt-1">
                  {item.ano === 'atual' && 'Pré-reforma'}
                  {item.ano === 2026 && 'Teste 0,1%'}
                  {item.ano === 2027 && 'CBS Plena'}
                  {item.ano === 2028 && 'Consolidação'}
                  {item.ano === 2029 && 'IBS 10%'}
                  {item.ano === 2030 && 'IBS 20%'}
                  {item.ano === 2031 && 'IBS 30%'}
                  {item.ano === 2032 && 'IBS 40%'}
                  {item.ano === 2033 && 'Pleno 100%'}
                </span>
                <span
                  className={`text-xs font-mono font-bold mt-1 ${
                    isSelected ? 'text-emerald-400' : 'text-slate-600'
                  }`}
                >
                  {formatarPorcentagem(item.aliquotaEfetivaTotal, 1)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Card de Destaque do Ano Selecionado com Alertas Críticos */}
      <Card className="border-[#D4AF37]/40 shadow-xl overflow-hidden bg-gradient-to-br from-white to-slate-50">
        <div className="bg-[#07132B] text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4AF37]/30">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 uppercase mb-1">
              Ano Selecionado:{' '}
              {anoAtualDetalhe.ano === 'atual' ? 'Ano atual (sistema atual)' : anoAtualDetalhe.ano}
            </div>
            <h3 className="text-xl font-heading font-extrabold text-white">
              {isPerfilServico
                ? anoAtualDetalhe.fase
                    .replace('do ICMS e ISS', 'do ISS municipal')
                    .replace('ICMS e ISS 100% extintos', 'ISS municipal 100% extinto')
                : anoAtualDetalhe.fase}
            </h3>
          </div>

          <div className="text-right sm:text-right">
            <span className="text-xs text-slate-400 block">
              Imposto Projetado ({anoAtualDetalhe.ano === 'atual' ? 'Atual' : anoAtualDetalhe.ano})
            </span>
            <span className="text-2xl font-mono font-extrabold text-[#D4AF37]">
              {formatarMoeda(anoAtualDetalhe.impostoEstimado)}
            </span>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Alerta de Anos Críticos Conforme Especificação */}
          {anoAtualDetalhe.alertaCritico && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-amber-950">
                  Atenção ao Ano Crítico da Reforma ({anoAtualDetalhe.ano})
                </strong>
                <p className="text-xs mt-0.5 leading-relaxed">
                  {isPerfilServico
                    ? anoAtualDetalhe.ano === 2027
                      ? 'Ano Crítico: Extinção definitiva de PIS/COFINS e início da CBS (8,80%) com crédito amplo sobre insumos operacionais, softwares e serviços de terceiros contratados.'
                      : anoAtualDetalhe.ano === 2033
                        ? 'Ano Crítico: Modelo pleno definitivo. ISS municipal 100% extinto e substituído pelo IBS; apuração e split payment 100% unificados.'
                        : anoAtualDetalhe.alertaCritico
                    : anoAtualDetalhe.alertaCritico}
                </p>
              </div>
            </div>
          )}

          {/* Grid de Status dos 5 Tributos Antigos e dos 2 Novos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="font-semibold text-slate-500 block">CBS (Federal)</span>
              <span className="text-base font-bold text-blue-900 font-mono mt-1 block">
                {formatarPorcentagem(anoAtualDetalhe.aliquotaCbs)}
              </span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="font-semibold text-slate-500 block">IBS (Subnacional)</span>
              <span className="text-base font-bold text-emerald-800 font-mono mt-1 block">
                {formatarPorcentagem(anoAtualDetalhe.aliquotaIbs)}
              </span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="font-semibold text-slate-500 block">Status PIS/COFINS</span>
              <span className="font-semibold text-slate-800 mt-1 block">
                {anoAtualDetalhe.statusPisCofins}
              </span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="font-semibold text-slate-500 block">Status IPI</span>
              <span className="font-semibold text-slate-800 mt-1 block">
                {isPerfilServico ? 'Não aplicável (Serviços)' : anoAtualDetalhe.statusIpi}
              </span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="font-semibold text-slate-500 block">Status ICMS</span>
              <span className="font-semibold text-slate-800 mt-1 block">
                {isPerfilServico ? 'Não aplicável (Serviços)' : anoAtualDetalhe.statusIcms}
              </span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="font-semibold text-slate-500 block">Status ISS</span>
              <span className="font-semibold text-slate-800 mt-1 block">
                {anoAtualDetalhe.statusIss}
              </span>
            </div>
          </div>

          {/* Destaque se o ano selecionado for 2027 com crédito de estoque (desconsiderado para setor de serviço) */}
          {anoAtualDetalhe.ano === 2027 &&
            setorTransicao !== 'servico' &&
            resultadoEstoque.economiaAno1 > 0 && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <strong className="block text-sm font-bold text-emerald-950">
                    Crédito Presumido de Estoque Ativo em 2027:
                  </strong>
                  <p className="text-xs leading-relaxed text-emerald-800">
                    Imposto bruto projetado de {formatarMoeda(anoAtualDetalhe.impostoEstimado)}{' '}
                    reduzido para{' '}
                    <strong className="font-mono text-emerald-950">
                      {formatarMoeda(anoAtualDetalhe.impostoComCreditoEstoque)}
                    </strong>{' '}
                    após abater os {formatarMoeda(resultadoEstoque.economiaAno1)} de crédito de
                    estoque.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-600 text-white rounded-lg shrink-0">
                  Economia: -{formatarMoeda(resultadoEstoque.economiaAno1)}
                </span>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Gráfico de Linha de Evolução da Alíquota Efetiva */}
      <Card className="border-slate-200 shadow-md">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-heading font-bold text-lg text-[#07132B] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
              Evolução da Alíquota Efetiva na Transição (2026–2033)
            </h3>
            <p className="text-xs text-slate-500">
              {isPerfilServico
                ? 'Curva de convergência da tributação sobre serviços ao longo das etapas constitucionais (ISS → IBS/CBS).'
                : 'Curva de convergência da tributação sobre consumo ao longo das etapas constitucionais.'}
              {config.presetSetor && config.presetSetor !== 'nenhum' && (
                <span className="ml-1 font-semibold text-[#07132B]">
                  • Preset:{' '}
                  {PRESETS_SETORES_LC214.find((p) => p.id === config.presetSetor)?.titulo ||
                    config.presetSetor}
                </span>
              )}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            Meta Plena 2033: {formatarPorcentagem(config.totalIvaDual)}
          </span>
        </div>

        <CardContent className="p-6">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dadosGrafico} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="ano" stroke="#64748B" fontSize={12} />
                <YAxis
                  stroke="#64748B"
                  fontSize={12}
                  unit="%"
                  domain={[0, Math.ceil(config.totalIvaDual + 2)]}
                />
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toFixed(2)}%`, 'Alíquota']}
                  labelFormatter={(label) => `Ano ${label}`}
                  contentStyle={{
                    backgroundColor: '#07132B',
                    borderColor: '#D4AF37',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="aliquotaEfetiva"
                  name={
                    isPerfilServico ? 'Alíquota Efetiva Total (Serviços)' : 'Alíquota Efetiva Total'
                  }
                  stroke="#D4AF37"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#D4AF37' }}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="aliquotaCbs"
                  name="CBS (Federal)"
                  stroke="#2563EB"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
                <Line
                  type="monotone"
                  dataKey="aliquotaIbs"
                  name={isPerfilServico ? 'IBS (Substituição do ISS)' : 'IBS (Est./Mun.)'}
                  stroke="#10B981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Comparativo Acumulado: Cenário Atual vs Cenário de Transição Conforme Especificação */}
      <Card className="border-slate-200 bg-slate-50/70 shadow-md">
        <CardContent className="p-6">
          <h4 className="text-base font-heading font-bold text-[#07132B] mb-4">
            Comparativo Acumulado no Período de Transição (8 anos: 2026 a 2033)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <span className="text-xs text-slate-500 font-semibold block">
                Cenário Atual Repetido (8 anos)
              </span>
              <p className="text-2xl font-mono font-extrabold text-slate-700 mt-1">
                {formatarMoeda(totalAtualAcumulado)}
              </p>
              <span className="text-[11px] text-slate-400 block mt-1">
                {isPerfilServico
                  ? 'Carga tributária atual de serviços (PIS/COFINS + ISS) repetida até 2033'
                  : 'Se as regras vigentes permanecessem inalteradas'}
              </span>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <span className="text-xs text-slate-500 font-semibold block">
                Cenário de Transição Reforma (8 anos)
              </span>
              <p className="text-2xl font-mono font-extrabold text-[#07132B] mt-1">
                {formatarMoeda(totalTransicaoAcumulado)}
              </p>
              <span className="text-[11px] text-slate-400 block mt-1">
                {isPerfilServico
                  ? 'Soma real com transição do ISS e tomada de créditos de insumos/serviços'
                  : 'Soma real das alíquotas escalonadas ano a ano'}
              </span>
            </div>
            <div className="p-4 bg-[#07132B] text-white border border-[#D4AF37]/40 rounded-xl">
              <span className="text-xs text-[#D4AF37] font-bold block uppercase">
                Diferença Acumulada no Período
              </span>
              <p className="text-2xl font-mono font-extrabold text-white mt-1">
                {diferencaAcumulada >= 0 ? '+' : '-'} {formatarMoeda(Math.abs(diferencaAcumulada))}
              </p>
              <span className="text-[11px] text-slate-300 block mt-1">
                {diferencaAcumulada <= 0
                  ? isPerfilServico
                    ? 'Economia global de caixa acumulada na transição para serviços'
                    : 'Economia global de caixa acumulada na transição'
                  : isPerfilServico
                    ? 'Ajuste de caixa absorvido pelo crédito amplo sobre insumos e serviços tomados'
                    : 'Ajuste de caixa absorvido pelo crédito irrestrito'}
              </span>
            </div>{' '}
          </div>
        </CardContent>
      </Card>

      {/* BARRA DE AÇÕES DA SIMULAÇÃO (DUPLICAÇÃO DOS BOTÕES SALVAR, BAIXAR PDF E EXPORTAR DADOS) */}
      {onSalvarSimulacao && onBaixarPdf && (
        <BarraAcoesSimulacao
          onSalvar={onSalvarSimulacao}
          onBaixarPdf={onBaixarPdf}
          onExportarDados={onExportarDados}
          gerandoPdf={gerandoPdf}
        />
      )}

      {/* PAINEL PRÓXIMOS PASSOS (ORIENTAÇÃO DO NOVO USUÁRIO) */}
      {onNavegarModulo && (
        <PainelProximosPassosCalculadora moduloAtual="modulo5" onNavegarModulo={onNavegarModulo} />
      )}
    </div>
  )
}
