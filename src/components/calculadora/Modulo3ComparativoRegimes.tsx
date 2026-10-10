import React from 'react'
import { useCalculadoraIbsCbs } from '@/context/CalculadoraIbsCbsContext'
import { formatarMoeda, formatarPorcentagem } from '@/lib/calculadoraUtils'
import { TipoAtividade, LISTA_UFS_ICMS } from '@/types/calculadoraIbsCbs'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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
} from 'lucide-react'

export default function Modulo3ComparativoRegimes() {
  const {
    faturamentoMensal,
    setFaturamentoMensal,
    tipoAtividade,
    setTipoAtividade,
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
        <div className="relative space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 tracking-wider uppercase">
            <Scale className="w-3.5 h-3.5" />
            Módulo 3 • Comparativo por Regime
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

            {/* Campo: O que vende */}
            <div className="space-y-2">
              <Label htmlFor="tipoAtividade" className="text-sm font-bold text-[#07132B]">
                O que Vende (Atividade)
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
                <SelectContent>
                  <SelectItem value="servico">Serviço (Aplica ISS no antigo)</SelectItem>
                  <SelectItem value="industria">Indústria (Aplica IPI no antigo)</SelectItem>
                  <SelectItem value="comercio">Comércio (Aplica ICMS no antigo)</SelectItem>
                  <SelectItem value="misto">
                    Misto (Proporção configurável Serviço / Comércio)
                  </SelectItem>
                </SelectContent>
              </Select>
              <span className="text-[11px] text-slate-500">
                Determina tributos incidentes (ISS, IPI, ICMS) e anexo do Simples.
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

            {/* Seletor extra se Misto for selecionado */}
            {tipoAtividade === 'misto' && (
              <div className="md:col-span-3 bg-amber-50/70 border border-amber-200 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-bold text-amber-900">
                    Divisão da Receita Mista: {proporcaoServicoMisto}% Serviço |{' '}
                    {100 - proporcaoServicoMisto}% Comércio
                  </Label>
                  <span className="text-xs font-mono text-amber-800 font-semibold">
                    ISS sobre {proporcaoServicoMisto}% / ICMS sobre {100 - proporcaoServicoMisto}%
                  </span>
                </div>
                <Slider
                  value={[proporcaoServicoMisto]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(val) => setProporcaoServicoMisto(val[0])}
                />
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
        </div>
      </div>

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

              {/* Linha 3: IPI / ICMS / ISS */}
              <TableRow className="hover:bg-slate-50/60">
                <TableCell className="font-medium text-slate-700">
                  <div className="font-bold">IPI / ICMS / ISS</div>
                  <div className="text-[11px] text-slate-400">Tributos Antigos Extintos</div>
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
                <TableCell className="text-center font-mono font-bold text-emerald-600 bg-[#D4AF37]/5 border-x-2 border-[#D4AF37]/40">
                  R$ 0,00
                  <span className="block text-[10px] text-emerald-700 font-semibold">
                    100% Extintos
                  </span>
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
        <CardContent className="p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Item 1: Folha & Fator R */}
            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-semibold mb-0.5">
                  1. Folha de Pagamento & Fator R do Simples:
                </strong>
                <p className="text-slate-600 leading-relaxed">
                  {faturamentoMensal > 0 ? (
                    <>
                      Com folha de {formatarMoeda(folhaPagamentoMensal)}, seu Fator R é de{' '}
                      <strong className="text-[#07132B]">{dadosAdicionais?.fatorRPercent}%</strong>.
                      Como está{' '}
                      <strong
                        className={
                          dadosAdicionais?.fatorRQualificaAnexoIII
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }
                      >
                        {dadosAdicionais?.fatorRQualificaAnexoIII
                          ? 'acima do corte de 28%'
                          : 'abaixo do corte de 28%'}
                      </strong>
                      , sua empresa enquadra-se no{' '}
                      <strong className="text-[#07132B]">{simplesNacional.anexoUtilizado}</strong>
                      {dadosAdicionais?.fatorRQualificaAnexoIII
                        ? ' (alíquota mais barata que o Anexo V).'
                        : ' (se sua folha atingir 28%, migra para o Anexo III reduzindo a guia DAS).'}
                    </>
                  ) : (
                    'Folha alta (≥28% do faturamento) habilita o Anexo III do Simples Nacional, consideravelmente mais barato que o Anexo V.'
                  )}
                </p>
              </div>
            </div>

            {/* Item 2: Margem de Lucro no Lucro Real */}
            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-semibold mb-0.5">
                  2. Margem de Lucro Estimada:
                </strong>
                <p className="text-slate-600 leading-relaxed">
                  No Lucro Real, o IRPJ e a CSLL incidem sobre o lucro contábil estimado (
                  {margemLucroEstimada}% de margem ={' '}
                  {formatarMoeda((faturamentoMensal * margemLucroEstimada) / 100)}/mês), e não sobre
                  o faturamento bruto. Margens menores tornam o Lucro Real mais competitivo.
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
