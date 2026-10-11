import React from 'react'
import { useCalculadoraIbsCbs } from '@/context/CalculadoraIbsCbsContext'
import { formatarMoeda, formatarPorcentagem } from '@/lib/calculadoraUtils'
import { RegimeDiferenciadoTipo } from '@/types/calculadoraIbsCbs'
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
import { Link } from 'react-router-dom'
import {
  Calculator,
  ArrowRight,
  Wallet,
  Receipt,
  Percent,
  FileCheck,
  Layers,
  RotateCcw,
  Sparkles,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Modulo2CalculadoraSimples() {
  const {
    valorOperacao,
    setValorOperacao,
    regimeOperacao,
    setRegimeOperacao,
    percentualComprasVendasSimples,
    setPercentualComprasVendasSimples,
    resultadoSimples,
    config,
    origemDadosEmpresa,
    restaurarDadosEmpresaNoModulo,
  } = useCalculadoraIbsCbs()

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const valor = Number(raw) / 100
    setValorOperacao(valor)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cabeçalho do Módulo */}
      <div className="bg-[#07132B] border border-[#D4AF37]/30 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 tracking-wider uppercase">
              <Calculator className="w-3.5 h-3.5" />
              Módulo 2 • Apuração Unitária da Operação
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
                onClick={() => restaurarDadosEmpresaNoModulo(2)}
                className="h-7 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1"
                title="Restaura valor da operação e % de compras a partir do perfil global"
              >
                <RotateCcw className="w-3 h-3" />
                Restaurar dados da empresa
              </Button>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
            Calculadora Simples da Operação
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
            Simule o débito, créditos da cadeia produtiva e o imposto líquido a recolher para uma
            nota fiscal ou transação individual com base nas alíquotas oficiais configuradas.
          </p>
        </div>
      </div>

      {/* AVISO INFORMATIVO COM ATALHO PARA DADOS DA EMPRESA */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
          <span>
            Os valores abaixo iniciam com os <strong>Dados da Empresa</strong>. Você pode alterá-los
            apenas para esta simulação pontual sem perder seu cadastro.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => restaurarDadosEmpresaNoModulo(2)}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 border border-slate-200/80 p-6 rounded-2xl shadow-sm">
        {/* Campo 1: Valor da Operação */}
        <div className="space-y-2">
          <Label htmlFor="valorOperacao" className="text-sm font-bold text-[#07132B]">
            Valor da Operação (R$)
          </Label>
          <div className="relative">
            <Input
              id="valorOperacao"
              type="text"
              value={valorOperacao.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
              onChange={handleValorChange}
              className="text-lg font-bold font-mono text-[#07132B] bg-white border-slate-300 h-12 shadow-sm"
              placeholder="R$ 0,00"
            />
          </div>
          <span className="text-[11px] text-slate-500">
            Base tributável da operação comercial ou prestação.
          </span>
        </div>

        {/* Campo 2: Regime Aplicado */}
        <div className="space-y-2">
          <Label htmlFor="regimeOperacao" className="text-sm font-bold text-[#07132B]">
            Regime Aplicado
          </Label>
          <Select
            value={regimeOperacao}
            onValueChange={(val) => setRegimeOperacao(val as RegimeDiferenciadoTipo)}
          >
            <SelectTrigger
              id="regimeOperacao"
              className="h-12 bg-white border-slate-300 shadow-sm font-medium"
            >
              <SelectValue placeholder="Selecione o regime" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="padrao">
                Padrão ({formatarPorcentagem(config.totalIvaDual)})
              </SelectItem>
              <SelectItem value="saude_educacao">
                Saúde e Educação ({formatarPorcentagem(config.saudeEducacaoAliquota)})
              </SelectItem>
              <SelectItem value="transporte">
                Transporte ({formatarPorcentagem(config.transporteAliquota)})
              </SelectItem>
              <SelectItem value="cesta_basica">
                Cesta Básica ({formatarPorcentagem(config.cestaBasicaIsencao)})
              </SelectItem>
            </SelectContent>
          </Select>
          <span className="text-[11px] text-slate-500">
            Regra constitucional incidente sobre o produto/serviço.
          </span>
        </div>

        {/* Campo 3: % de Compras sobre Vendas */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="percentualCompras" className="text-sm font-bold text-[#07132B]">
              % de Compras sobre Vendas
            </Label>
            <span className="text-xs font-mono font-bold text-[#D4AF37] bg-[#07132B] px-2 py-0.5 rounded">
              {percentualComprasVendasSimples}%
            </span>
          </div>
          <div className="relative">
            <Input
              id="percentualCompras"
              type="number"
              min="0"
              max="100"
              value={percentualComprasVendasSimples}
              onChange={(e) => setPercentualComprasVendasSimples(Number(e.target.value))}
              className="text-lg font-bold font-mono text-[#07132B] bg-white border-slate-300 h-12 shadow-sm pr-10"
            />
            <span className="absolute right-4 top-3 text-slate-400 font-bold">%</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Insumos com crédito amplo apropriado na operação.
          </span>
        </div>
      </div>

      {/* Resultados em Cards Conforme Especificação */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-heading font-bold text-[#07132B] flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#D4AF37]" />
            Demonstrativo de Apuração da Nota Fiscal
          </h3>
          <span className="text-xs text-slate-500">
            Fórmula: Débito = Valor × Alíquota | Créditos = Compras × 26,50% | A Recolher = Débito -
            Créditos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card: Débito CBS */}
          <Card className="border-slate-200/80 shadow hover:shadow-md transition-all">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider">Débito CBS (Federal)</span>
                <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold">
                  {formatarPorcentagem(resultadoSimples.aliquotaCbsAplicada)}
                </span>
              </div>
              <p className="text-2xl font-mono font-extrabold text-[#07132B]">
                {formatarMoeda(resultadoSimples.debitoCbs)}
              </p>
              <p className="text-[11px] text-slate-400">
                Substitui PIS e COFINS com split payment na fonte
              </p>
            </CardContent>
          </Card>

          {/* Card: Débito IBS */}
          <Card className="border-slate-200/80 shadow hover:shadow-md transition-all">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider">
                  Débito IBS (Estados/Mun.)
                </span>
                <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                  {formatarPorcentagem(resultadoSimples.aliquotaIbsAplicada)}
                </span>
              </div>
              <p className="text-2xl font-mono font-extrabold text-[#07132B]">
                {formatarMoeda(resultadoSimples.debitoIbs)}
              </p>
              <p className="text-[11px] text-slate-400">
                Substitui ICMS e ISS no Comitê Gestor do IBS
              </p>
            </CardContent>
          </Card>

          {/* Card: Total de Débito */}
          <Card className="border-[#D4AF37]/40 bg-gradient-to-br from-amber-50/40 to-white shadow hover:shadow-md transition-all">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold uppercase tracking-wider text-amber-900">
                  Total de Débito
                </span>
                <span className="font-mono text-amber-900 bg-amber-100 px-2 py-0.5 rounded font-bold">
                  {formatarPorcentagem(resultadoSimples.aliquotaTotalAplicada)}
                </span>
              </div>
              <p className="text-2xl font-mono font-extrabold text-amber-950">
                {formatarMoeda(resultadoSimples.totalDebito)}
              </p>
              <p className="text-[11px] text-slate-500">
                Incidência bruta antes da apropriação dos créditos
              </p>
            </CardContent>
          </Card>

          {/* Card: Valor dos Créditos */}
          <Card className="border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 to-white shadow hover:shadow-md transition-all">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold uppercase tracking-wider text-emerald-800">
                  Valor dos Créditos
                </span>
                <span className="font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                  {percentualComprasVendasSimples}% compras
                </span>
              </div>
              <p className="text-2xl font-mono font-extrabold text-emerald-700">
                - {formatarMoeda(resultadoSimples.valorCreditos)}
              </p>
              <p className="text-[11px] text-slate-500">
                Crédito financeiro irrestrito sobre insumos adquiridos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Linha Inferior com Cards de Destaque */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Card: Valor a Recolher */}
          <Card className="bg-[#07132B] text-white border border-[#D4AF37]/50 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/20 rounded-full blur-2xl pointer-events-none" />
            <CardContent className="p-6 space-y-2 relative">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold tracking-wider text-[#D4AF37] uppercase flex items-center gap-1.5">
                  <Wallet className="w-4 h-4" />
                  Valor a Recolher (Líquido)
                </span>
                <span className="bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded text-[11px] font-bold">
                  Débito - Crédito
                </span>
              </div>
              <p className="text-3xl font-mono font-extrabold text-white">
                {formatarMoeda(resultadoSimples.valorARecolher)}
              </p>
              <p className="text-xs text-slate-300">
                Guia final efetiva gerada pelo motor fiscal do IVA Dual.
              </p>
            </CardContent>
          </Card>

          {/* Card: Alíquota Efetiva */}
          <Card className="border-slate-200 bg-white shadow-md">
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-800">
                  <Percent className="w-4 h-4 text-[#D4AF37]" />
                  Alíquota Efetiva Final
                </span>
              </div>
              <p className="text-3xl font-mono font-extrabold text-[#07132B]">
                {formatarPorcentagem(resultadoSimples.aliquotaEfetiva)}
              </p>
              <p className="text-xs text-slate-500">
                Impacto percentual real sobre o faturamento bruto da nota.
              </p>
            </CardContent>
          </Card>

          {/* Card: Valor Total da Nota Fiscal */}
          <Card className="border-slate-200 bg-white shadow-md">
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-800">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  Valor Total da Nota Fiscal
                </span>
              </div>
              <p className="text-3xl font-mono font-extrabold text-[#07132B]">
                {formatarMoeda(resultadoSimples.valorTotalNotaFiscal)}
              </p>
              <p className="text-xs text-slate-500">
                Valor total faturado (imposto destacado por fora transparente).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
