import React from 'react'
import { useCalculadoraIbsCbs } from '@/context/CalculadoraIbsCbsContext'
import { formatarMoeda, formatarPorcentagem } from '@/lib/calculadoraUtils'
import {
  RegimeDiferenciadoTipo,
  AnoTransicaoIbsCbs,
  LISTA_ANOS_TRANSICAO,
  CRONOGRAMA_FASES_TRANSICAO,
  PRESETS_SETORES_LC214,
  obterInfoRegimeOperacao,
} from '@/types/calculadoraIbsCbs'
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
import { Calculator, RotateCcw, Sparkles, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BadgeOrigemPropagada } from '@/components/calculadora/BadgeOrigemPropagada'
import { BotaoRetornarDadosIniciais } from '@/components/common/BotaoRetornarDadosIniciais'
import {
  RegimeEspecialAtual,
  PerfilRetencaoSplit,
  REGIMES_ESPECIAIS_OPCOES,
  PERFIS_RETENCAO_SPLIT_OPCOES,
} from '@/types/dadosEmpresa'

import {
  PainelProximosPassosCalculadora,
  ModuloCalculadoraId,
} from '@/components/calculadora/PainelProximosPassosCalculadora'
import { BarraAcoesSimulacao } from '@/components/calculadora/BarraAcoesSimulacao'
import { ComposicaoCreditoCompras } from '@/components/calculadora/ComposicaoCreditoCompras'
import { obterAliquotasCreditoPorAno } from '@/lib/calculoFornecedores'
import { type AnoBaseSimulacao } from '@/lib/reformaTributaria'

export interface Modulo2CalculadoraSimplesProps {
  onNavegarModulo?: (moduloId: ModuloCalculadoraId) => void
  onSalvarSimulacao?: () => void
  onBaixarPdf?: () => void
  onExportarDados?: () => void
  onImportarFaturamento?: () => void
  gerandoPdf?: boolean
}

export default function Modulo2CalculadoraSimples({
  onNavegarModulo,
  onSalvarSimulacao,
  onBaixarPdf,
  onExportarDados,
  onImportarFaturamento,
  gerandoPdf = false,
}: Modulo2CalculadoraSimplesProps = {}) {
  const {
    valorOperacao,
    setValorOperacao,
    regimeOperacao,
    setRegimeOperacao,
    anoOperacao,
    setAnoOperacao,
    percentualComprasVendasSimples,
    setPercentualComprasVendasSimples,
    resultadoSimples,
    config,
    origemDadosEmpresa,
    restaurarDadosEmpresaNoModulo,
    origensPropagadas,
    percentualComprasSemCredito,
    setPercentualComprasSemCredito,
    saldoCredorAcumulado,
    setSaldoCredorAcumulado,
    percentualVendasInterestaduais,
    setPercentualVendasInterestaduais,
    regimeEspecialAtual,
    setRegimeEspecialAtual,
    perfilRetencaoSplit,
    setPerfilRetencaoSplit,
    percentualRetencaoSplit,
    setPercentualRetencaoSplit,
    editadoLocalmente,
  } = useCalculadoraIbsCbs()

  // Presets divididos pelos grupos legais da LC 214/2025 (mesma estrutura do Módulo 1, sem ícones)
  const presetsPadrao = PRESETS_SETORES_LC214.filter((p) => p.grupo === 'geral')
  const presetsReducao60 = PRESETS_SETORES_LC214.filter(
    (p) => p.grupo === 'reducao_60' && p.id !== 'saude_educacao',
  )
  const presetsReducao30 = PRESETS_SETORES_LC214.filter(
    (p) => p.grupo === 'reducao_30' && p.id !== 'transporte_intelectual',
  )
  const presetsAliquotaZero = PRESETS_SETORES_LC214.filter(
    (p) => p.grupo === 'aliquota_zero' && p.id !== 'cesta_basica',
  )

  const infoRegimeAtual = obterInfoRegimeOperacao(regimeOperacao)

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
              <BotaoRetornarDadosIniciais
                onClick={() => {
                  restaurarDadosEmpresaNoModulo(2)
                  restaurarDadosEmpresaNoModulo(1)
                }}
                rotulo="Restaurar dados da empresa"
                className="h-7 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1"
              />
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
          <BotaoRetornarDadosIniciais
            onClick={() => {
              restaurarDadosEmpresaNoModulo(2)
              restaurarDadosEmpresaNoModulo(1)
            }}
            rotulo="Restaurar"
            className="h-6 px-2 text-xs font-semibold text-slate-700 hover:text-[#07132B] bg-transparent border-slate-300 hover:bg-slate-200"
          />
          <Link
            to="/dados-empresa"
            className="text-xs font-bold text-[#07132B] hover:text-[#D4AF37] underline"
          >
            Editar perfil da empresa →
          </Link>
        </div>
      </div>

      {/* Painel de Entradas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 border border-slate-200/80 p-4 sm:p-6 rounded-2xl shadow-sm">
        {/* Campo 1: Valor da Operação */}
        <div className="min-w-0 w-full space-y-2">
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <Label
              htmlFor="valorOperacao"
              className="text-xs sm:text-sm font-medium break-words leading-snug text-[#07132B]"
            >
              Valor da Operação (R$)
            </Label>
            {origensPropagadas?.modulo2ValorOperacao && (
              <BadgeOrigemPropagada texto="vindo do Módulo 1 — editável aqui" />
            )}
          </div>
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
          <span className="text-[11px] text-slate-500 block break-words">
            Base tributável da operação comercial ou prestação.
          </span>
        </div>

        {/* Campo 2: Ano da Transição (Ano atual + 2026–2033) — SEM ÍCONES */}
        <div className="min-w-0 w-full space-y-2">
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <Label
              htmlFor="anoOperacao"
              className="text-xs sm:text-sm font-medium break-words leading-snug text-[#07132B]"
            >
              Ano da Transição
            </Label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {origensPropagadas?.modulo2AnoOperacao && (
                <BadgeOrigemPropagada texto="vindo do Módulo 1 — editável aqui" />
              )}
              <span className="text-[11px] font-mono font-bold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/50 px-1.5 py-0.5 rounded">
                {anoOperacao === 'atual' ? 'Pré-reforma' : `Fase ${anoOperacao}`}
              </span>
            </div>
          </div>
          <Select
            value={String(anoOperacao)}
            onValueChange={(val) =>
              setAnoOperacao(val === 'atual' ? 'atual' : (Number(val) as AnoTransicaoIbsCbs))
            }
          >
            <SelectTrigger
              id="anoOperacao"
              className="h-12 bg-white border-slate-300 shadow-sm font-medium"
            >
              <SelectValue placeholder="Selecione o ano da transição" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {LISTA_ANOS_TRANSICAO.map((ano) => {
                const dados = CRONOGRAMA_FASES_TRANSICAO[ano]
                const rotulo =
                  ano === 'atual'
                    ? 'Ano atual (sistema atual) • Pré-reforma'
                    : `${ano} • ${dados.fase}`
                return (
                  <SelectItem key={String(ano)} value={String(ano)} className="py-2">
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-slate-900 text-xs">{rotulo}</span>
                      <span className="text-[11px] text-slate-500 leading-tight">
                        {dados.subtitulo}
                      </span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="truncate">
              {anoOperacao === 'atual'
                ? 'Regime atual (0,00% IBS/CBS)'
                : `CBS ${CRONOGRAMA_FASES_TRANSICAO[anoOperacao]?.aliquotaCbs.toFixed(2)}% + IBS ${CRONOGRAMA_FASES_TRANSICAO[anoOperacao]?.aliquotaIbs.toFixed(2)}%`}
            </span>
          </div>
        </div>

        {/* Campo 3: Regime Aplicado (Preset por Setor) — SEM ÍCONES */}
        <div className="min-w-0 w-full space-y-2">
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <Label
              htmlFor="regimeOperacao"
              className="text-xs sm:text-sm font-medium break-words leading-snug text-[#07132B]"
            >
              Regime Aplicado (Preset por Setor)
            </Label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {origensPropagadas?.modulo2RegimeOperacao && (
                <BadgeOrigemPropagada texto="vindo do Módulo 1 — editável aqui" />
              )}
              <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                {formatarPorcentagem(resultadoSimples.aliquotaTotalAplicada)}
              </span>
            </div>
          </div>
          <Select
            value={regimeOperacao}
            onValueChange={(val) => setRegimeOperacao(val as RegimeDiferenciadoTipo)}
          >
            <SelectTrigger
              id="regimeOperacao"
              className="h-12 bg-white border-slate-300 shadow-sm font-medium"
            >
              <SelectValue placeholder="Selecione o regime aplicado (preset por setor)" />
            </SelectTrigger>
            <SelectContent className="max-h-96">
              {/* Alíquota Plena Padrão */}
              {presetsPadrao.map((preset) => (
                <SelectItem key={preset.id} value={preset.id} className="py-2">
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-slate-900 text-xs">{preset.titulo}</span>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      {preset.etiquetaOrigem} · {preset.subtitulo}
                    </span>
                  </div>
                </SelectItem>
              ))}

              {/* SEÇÃO (1): Redução de 60% (arts. 128–134) */}
              <div className="px-2 py-1.5 mt-2 bg-slate-100 text-[11px] font-bold text-slate-800 uppercase tracking-wider rounded">
                (1) Redução de 60% — Arts. 128 a 134 da LC 214/2025
              </div>
              {presetsReducao60.map((preset) => (
                <SelectItem key={preset.id} value={preset.id} className="py-2 pl-3">
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-slate-900 text-xs">{preset.titulo}</span>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      {preset.etiquetaOrigem} · {preset.subtitulo}
                    </span>
                  </div>
                </SelectItem>
              ))}

              {/* SEÇÃO (2): Redução de 30% (art. 132) */}
              <div className="px-2 py-1.5 mt-2 bg-slate-100 text-[11px] font-bold text-slate-800 uppercase tracking-wider rounded">
                (2) Redução de 30% — Profissões Regulamentadas (Art. 132)
              </div>
              {presetsReducao30.map((preset) => (
                <SelectItem key={preset.id} value={preset.id} className="py-2 pl-3">
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-slate-900 text-xs">{preset.titulo}</span>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      {preset.etiquetaOrigem} · {preset.subtitulo}
                    </span>
                  </div>
                </SelectItem>
              ))}

              {/* SEÇÃO (3): Alíquota Zero (arts. 8º, 129 e 146) */}
              <div className="px-2 py-1.5 mt-2 bg-slate-100 text-[11px] font-bold text-slate-800 uppercase tracking-wider rounded">
                (3) Alíquota Zero — Arts. 8º, 129 e 146 da LC 214/2025
              </div>
              {presetsAliquotaZero.map((preset) => (
                <SelectItem key={preset.id} value={preset.id} className="py-2 pl-3">
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-slate-900 text-xs">{preset.titulo}</span>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      {preset.etiquetaOrigem} · {preset.subtitulo}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-col text-[11px] text-slate-500 gap-0.5">
            <span className="truncate">
              Regra:{' '}
              <strong className="text-slate-800 font-semibold">{infoRegimeAtual.titulo}</strong>
            </span>
            <span
              className="font-medium text-emerald-700 truncate"
              title={resultadoSimples.etiquetaLegalExibida}
            >
              {resultadoSimples.etiquetaLegalExibida || infoRegimeAtual.etiquetaOrigem}
            </span>
          </div>
        </div>

        {/* Campo 4: % de Compras sobre Vendas */}
        <div className="min-w-0 w-full space-y-2">
          <div className="flex justify-between items-center gap-1 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Label
                htmlFor="percentualCompras"
                className="text-xs sm:text-sm font-medium break-words leading-snug text-[#07132B]"
              >
                % de Compras sobre Vendas
              </Label>
              {origensPropagadas?.modulo2PercentualCompras && (
                <BadgeOrigemPropagada texto="vindo do Módulo 1 — editável aqui" />
              )}
            </div>
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
          <span className="text-[11px] text-slate-500 block break-words">
            Insumos com crédito amplo apropriado na operação.
          </span>
        </div>
      </div>

      {/* Seção Fase 2: Parâmetros Fiscais Avançados (Override Local da Simulação) */}
      <div className="bg-slate-50 border border-slate-200/80 p-4 sm:p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#07132B] block">
                Parâmetros Fiscais Avançados (Fase 2 • Override Local)
              </span>
              <span className="text-[11px] text-slate-500">
                Ajuste pontual exclusivo desta simulação unitária. Não altera o cadastro global da
                empresa.
              </span>
            </div>
          </div>
          {editadoLocalmente?.fase2Parametros && (
            <BotaoRetornarDadosIniciais
              onClick={() => {
                restaurarDadosEmpresaNoModulo(2)
                restaurarDadosEmpresaNoModulo(1)
              }}
              rotulo="Retornar aos dados iniciais"
              className="h-7 text-xs font-semibold bg-white text-slate-800 border-slate-300 hover:bg-slate-100"
            />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Campo 1: Compras Sem Crédito */}
          <div className="min-w-0 w-full space-y-2">
            <div className="flex justify-between items-center gap-1 flex-wrap">
              <Label
                htmlFor="m2ComprasSemCredito"
                className="text-xs font-medium break-words leading-snug text-[#07132B]"
              >
                Compras s/ Crédito (%)
              </Label>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-200 px-1.5 py-0.2 rounded">
                {percentualComprasSemCredito}%
              </span>
            </div>
            <div className="relative">
              <Input
                id="m2ComprasSemCredito"
                type="number"
                min="0"
                max="100"
                value={percentualComprasSemCredito}
                onChange={(e) => setPercentualComprasSemCredito(Number(e.target.value))}
                className="text-base font-bold font-mono text-[#07132B] bg-white border-slate-300 h-11 shadow-sm pr-8"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
            </div>
            <span className="text-[11px] text-slate-500 block leading-tight break-words">
              Uso, consumo ou isentas.
            </span>
          </div>

          {/* Campo 2: Saldo Credor Acumulado */}
          <div className="min-w-0 w-full space-y-2">
            <Label
              htmlFor="m2SaldoCredor"
              className="text-xs font-medium break-words leading-snug text-[#07132B] block"
            >
              Saldo Credor (R$)
            </Label>
            <Input
              id="m2SaldoCredor"
              type="text"
              value={saldoCredorAcumulado.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '')
                setSaldoCredorAcumulado(Number(raw) / 100)
              }}
              className="text-base font-bold font-mono text-[#07132B] bg-white border-slate-300 h-11 shadow-sm"
            />
            <span className="text-[11px] text-slate-500 block leading-tight break-words">
              Estoque inicial p/ compensação.
            </span>
          </div>

          {/* Campo 3: % Vendas Interestaduais */}
          <div className="min-w-0 w-full space-y-2">
            <div className="flex justify-between items-center gap-1 flex-wrap">
              <Label
                htmlFor="m2VendasInterestaduais"
                className="text-xs font-medium break-words leading-snug text-[#07132B]"
              >
                Vendas Interestaduais (%)
              </Label>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-200 px-1.5 py-0.2 rounded">
                {percentualVendasInterestaduais}%
              </span>
            </div>
            <div className="relative">
              <Input
                id="m2VendasInterestaduais"
                type="number"
                min="0"
                max="100"
                value={percentualVendasInterestaduais}
                onChange={(e) => setPercentualVendasInterestaduais(Number(e.target.value))}
                className="text-base font-bold font-mono text-[#07132B] bg-white border-slate-300 h-11 shadow-sm pr-8"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
            </div>
            <span className="text-[11px] text-slate-500 block leading-tight break-words">
              Operações sujeitas a DIFAL.
            </span>
          </div>

          {/* Campo 4: Regime Especial Atual */}
          <div className="min-w-0 w-full space-y-2">
            <Label
              htmlFor="m2RegimeEspecial"
              className="text-xs font-medium break-words leading-snug text-[#07132B] block"
            >
              Regime Especial
            </Label>
            <Select
              value={regimeEspecialAtual}
              onValueChange={(val) => setRegimeEspecialAtual(val as RegimeEspecialAtual)}
            >
              <SelectTrigger
                id="m2RegimeEspecial"
                className="h-11 bg-white border-slate-300 shadow-sm font-medium text-xs"
              >
                <SelectValue placeholder="Selecione o regime especial" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {REGIMES_ESPECIAIS_OPCOES.map((op) => (
                  <SelectItem key={op.id} value={op.id} className="text-xs">
                    {op.rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-[11px] text-slate-500 block leading-tight break-words">
              Tratamento tributário setorial.
            </span>
          </div>

          {/* Campo 5: Perfil Retenção Split Payment */}
          <div className="min-w-0 w-full space-y-2">
            <div className="flex justify-between items-center gap-1 flex-wrap">
              <Label
                htmlFor="m2PerfilSplit"
                className="text-xs font-medium break-words leading-snug text-[#07132B]"
              >
                Perfil Split Payment
              </Label>
              {perfilRetencaoSplit === 'parcial' && (
                <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                  {percentualRetencaoSplit}%
                </span>
              )}
            </div>
            <Select
              value={perfilRetencaoSplit}
              onValueChange={(val) => setPerfilRetencaoSplit(val as PerfilRetencaoSplit)}
            >
              <SelectTrigger
                id="m2PerfilSplit"
                className="h-11 bg-white border-slate-300 shadow-sm font-medium text-xs"
              >
                <SelectValue placeholder="Selecione o perfil de retenção" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {PERFIS_RETENCAO_SPLIT_OPCOES.map((op) => (
                  <SelectItem key={op.id} value={op.id} className="text-xs">
                    {op.rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {perfilRetencaoSplit === 'parcial' ? (
              <div className="pt-1 space-y-1">
                <div className="relative">
                  <Input
                    id="m2PctRetencaoSplit"
                    type="number"
                    min="0"
                    max="100"
                    value={percentualRetencaoSplit}
                    onChange={(e) => setPercentualRetencaoSplit(Number(e.target.value))}
                    className="text-xs font-bold font-mono text-[#07132B] bg-white border-slate-300 h-8 pr-7"
                    placeholder="% Retenção"
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-bold">
                    %
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-[11px] text-slate-500 block leading-tight break-words">
                Retenção na liquidação bancária.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Resultados em Cards Conforme Especificação — Padrão Diamond Group, sem ícones */}
      {(() => {
        // Formatações dos 7 valores exibidos
        const strDebitoCbs = formatarMoeda(resultadoSimples.debitoCbs)
        const strDebitoIbs = formatarMoeda(resultadoSimples.debitoIbs)
        const strTotalDebito = formatarMoeda(resultadoSimples.totalDebito)
        const strValorCreditos = `- ${formatarMoeda(resultadoSimples.valorCreditos)}`
        const strValorARecolher = formatarMoeda(resultadoSimples.valorARecolher)
        const strAliquotaEfetiva = formatarPorcentagem(resultadoSimples.aliquotaEfetiva)
        const strValorTotalNota = formatarMoeda(resultadoSimples.valorTotalNotaFiscal)

        // Escalas responsivas de tipografia para evitar transbordamento em qualquer resolução
        const obterTamanhoFontePadrao = (texto: string) => {
          const len = texto.length
          if (len >= 20) return 'text-sm sm:text-base'
          if (len >= 16) return 'text-base sm:text-lg'
          if (len >= 13) return 'text-lg sm:text-xl'
          return 'text-xl sm:text-2xl'
        }

        const obterTamanhoFonteDestaque = (texto: string) => {
          const len = texto.length
          if (len >= 20) return 'text-base sm:text-lg lg:text-xl'
          if (len >= 16) return 'text-lg sm:text-xl lg:text-2xl'
          if (len >= 13) return 'text-xl sm:text-2xl lg:text-3xl'
          return 'text-2xl sm:text-3xl'
        }

        // Dados para a Seção de Composição do Crédito de Compras
        const anoNumModulo2: AnoBaseSimulacao =
          typeof anoOperacao === 'number' ? (anoOperacao as AnoBaseSimulacao) : 2033
        const aliquotaSimplesMediaModulo2 =
          obterAliquotasCreditoPorAno(anoNumModulo2).aliquotaSimplesMedia * 100
        const aliquotaCheiaModulo2 =
          typeof anoOperacao === 'number' && CRONOGRAMA_FASES_TRANSICAO[anoOperacao]
            ? CRONOGRAMA_FASES_TRANSICAO[anoOperacao].totalIvaDual
            : config.totalIvaDual

        const pctFornecSimplesModulo2 = Math.min(
          100,
          Math.max(0, config.porcentagemComprasSimplesNacional ?? 0),
        )
        const valorComprasModulo2 =
          Math.max(0, valorOperacao) * (Math.max(0, percentualComprasVendasSimples) / 100)
        const creditoCheioModulo2 = (valorComprasModulo2 * aliquotaCheiaModulo2) / 100
        const creditoPonderadoModulo2 = resultadoSimples.valorCreditos
        const diferencaCreditoModulo2 = Math.max(0, creditoCheioModulo2 - creditoPonderadoModulo2)

        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] inline-block shrink-0" />
                <h3 className="text-lg font-heading font-bold text-[#07132B]">
                  Demonstrativo de Apuração da Nota Fiscal
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Fórmula: Débito = Valor × Alíquota | Créditos = Compras × 26,50% | A Recolher =
                Débito - Créditos
              </span>
            </div>

            {/* Linha 1: 4 Quadros de Débitos e Créditos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Quadro 1: Débito CBS */}
              <Card className="min-w-0 border-slate-200/80 shadow hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
                <CardContent className="p-4 sm:p-5 space-y-2 min-w-0 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between text-xs text-slate-500 gap-1">
                    <span className="font-semibold uppercase tracking-wider truncate">
                      Débito CBS (Federal)
                    </span>
                    <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold shrink-0 text-[11px]">
                      {formatarPorcentagem(resultadoSimples.aliquotaCbsAplicada)}
                    </span>
                  </div>
                  <div className="py-0.5 min-w-0 overflow-hidden">
                    <p
                      className={`${obterTamanhoFontePadrao(strDebitoCbs)} font-mono font-extrabold text-[#07132B] truncate tracking-tight`}
                      title={strDebitoCbs}
                    >
                      {strDebitoCbs}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    Substitui PIS e COFINS com split payment na fonte
                  </p>
                </CardContent>
              </Card>

              {/* Quadro 2: Débito IBS */}
              <Card className="min-w-0 border-slate-200/80 shadow hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
                <CardContent className="p-4 sm:p-5 space-y-2 min-w-0 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between text-xs text-slate-500 gap-1">
                    <span className="font-semibold uppercase tracking-wider truncate">
                      Débito IBS (Estados/Mun.)
                    </span>
                    <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold shrink-0 text-[11px]">
                      {formatarPorcentagem(resultadoSimples.aliquotaIbsAplicada)}
                    </span>
                  </div>
                  <div className="py-0.5 min-w-0 overflow-hidden">
                    <p
                      className={`${obterTamanhoFontePadrao(strDebitoIbs)} font-mono font-extrabold text-[#07132B] truncate tracking-tight`}
                      title={strDebitoIbs}
                    >
                      {strDebitoIbs}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    Substitui ICMS e ISS no Comitê Gestor do IBS
                  </p>
                </CardContent>
              </Card>

              {/* Quadro 3: Total de Débito */}
              <Card className="min-w-0 border-[#D4AF37]/40 bg-gradient-to-br from-amber-50/40 to-white shadow hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
                <CardContent className="p-4 sm:p-5 space-y-2 min-w-0 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between text-xs text-slate-600 gap-1">
                    <span className="font-bold uppercase tracking-wider text-amber-900 truncate">
                      Total de Débito
                    </span>
                    <span className="font-mono text-amber-900 bg-amber-100 px-2 py-0.5 rounded font-bold shrink-0 text-[11px]">
                      {formatarPorcentagem(resultadoSimples.aliquotaTotalAplicada)}
                    </span>
                  </div>
                  <div className="py-0.5 min-w-0 overflow-hidden">
                    <p
                      className={`${obterTamanhoFontePadrao(strTotalDebito)} font-mono font-extrabold text-amber-950 truncate tracking-tight`}
                      title={strTotalDebito}
                    >
                      {strTotalDebito}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    Incidência bruta antes da apropriação dos créditos
                  </p>
                </CardContent>
              </Card>

              {/* Quadro 4: Valor dos Créditos */}
              <Card className="min-w-0 border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 to-white shadow hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
                <CardContent className="p-4 sm:p-5 space-y-2 min-w-0 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between text-xs text-slate-600 gap-1">
                    <span className="font-bold uppercase tracking-wider text-emerald-800 truncate">
                      Valor dos Créditos
                    </span>
                    <span className="font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold shrink-0 text-[11px]">
                      {percentualComprasVendasSimples}% compras
                    </span>
                  </div>
                  <div className="py-0.5 min-w-0 overflow-hidden">
                    <p
                      className={`${obterTamanhoFontePadrao(strValorCreditos)} font-mono font-extrabold text-emerald-700 truncate tracking-tight`}
                      title={strValorCreditos}
                    >
                      {strValorCreditos}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    Crédito financeiro irrestrito sobre insumos adquiridos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Linha 2: 3 Quadros de Síntese e Fechamento da Nota Fiscal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Quadro 5: Valor a Recolher (Líquido) */}
              <Card className="min-w-0 bg-[#07132B] text-white border border-[#D4AF37]/50 shadow-xl overflow-hidden relative flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/20 rounded-full blur-2xl pointer-events-none" />
                <CardContent className="p-5 sm:p-6 space-y-2.5 relative min-w-0 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between text-xs gap-1">
                    <span className="font-bold tracking-wider text-[#D4AF37] uppercase truncate">
                      Valor a Recolher (Líquido)
                    </span>
                    <span className="bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded text-[11px] font-bold shrink-0">
                      Débito − Crédito
                    </span>
                  </div>
                  <div className="py-0.5 min-w-0 overflow-hidden">
                    <p
                      className={`${obterTamanhoFonteDestaque(strValorARecolher)} font-mono font-extrabold text-white truncate tracking-tight`}
                      title={strValorARecolher}
                    >
                      {strValorARecolher}
                    </p>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">
                    Guia final efetiva gerada pelo motor fiscal do IVA Dual.
                  </p>
                </CardContent>
              </Card>

              {/* Quadro 6: Alíquota Efetiva Final */}
              <Card className="min-w-0 border-slate-200 bg-white shadow-md overflow-hidden flex flex-col justify-between">
                <CardContent className="p-5 sm:p-6 space-y-2.5 min-w-0 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between text-xs text-slate-600 gap-1">
                    <span className="font-bold uppercase tracking-wider text-slate-800 truncate">
                      Alíquota Efetiva Final
                    </span>
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-mono font-bold shrink-0">
                      Efetiva
                    </span>
                  </div>
                  <div className="py-0.5 min-w-0 overflow-hidden">
                    <p
                      className={`${obterTamanhoFonteDestaque(strAliquotaEfetiva)} font-mono font-extrabold text-[#07132B] truncate tracking-tight`}
                      title={strAliquotaEfetiva}
                    >
                      {strAliquotaEfetiva}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    Impacto percentual real sobre o faturamento bruto da nota.
                  </p>
                </CardContent>
              </Card>

              {/* Quadro 7: Valor Total da Nota Fiscal */}
              <Card className="min-w-0 border-slate-200 bg-white shadow-md overflow-hidden flex flex-col justify-between">
                <CardContent className="p-5 sm:p-6 space-y-2.5 min-w-0 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between text-xs text-slate-600 gap-1">
                    <span className="font-bold uppercase tracking-wider text-slate-800 truncate">
                      Valor Total da Nota Fiscal
                    </span>
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-mono font-bold shrink-0">
                      Por Fora
                    </span>
                  </div>
                  <div className="py-0.5 min-w-0 overflow-hidden">
                    <p
                      className={`${obterTamanhoFonteDestaque(strValorTotalNota)} font-mono font-extrabold text-[#07132B] truncate tracking-tight`}
                      title={strValorTotalNota}
                    >
                      {strValorTotalNota}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    Valor total faturado (imposto destacado por fora transparente).
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* SEÇÃO COMPOSIÇÃO DO CRÉDITO DE COMPRAS (LC 214/2025 • FORNECEDORES SIMPLES) */}
            <ComposicaoCreditoCompras
              ano={anoOperacao}
              aliquotaCheia={aliquotaCheiaModulo2}
              aliquotaSimplesMedia={aliquotaSimplesMediaModulo2}
              porcentagemSimples={pctFornecSimplesModulo2}
              creditoCheio={creditoCheioModulo2}
              creditoPonderado={creditoPonderadoModulo2}
              diferenca={diferencaCreditoModulo2}
              origemModulo="modulo2"
            />
          </div>
        )
      })()}

      {/* BARRA DE AÇÕES DA SIMULAÇÃO (DUPLICAÇÃO DOS BOTÕES SALVAR, BAIXAR PDF E EXPORTAR DADOS) */}
      {onSalvarSimulacao && onBaixarPdf && (
        <BarraAcoesSimulacao
          onSalvar={onSalvarSimulacao}
          onBaixarPdf={onBaixarPdf}
          onExportarDados={onExportarDados}
          onImportarFaturamento={onImportarFaturamento}
          gerandoPdf={gerandoPdf}
        />
      )}

      {/* PAINEL PRÓXIMOS PASSOS (ORIENTAÇÃO DO NOVO USUÁRIO) */}
      {onNavegarModulo && (
        <PainelProximosPassosCalculadora moduloAtual="modulo2" onNavegarModulo={onNavegarModulo} />
      )}
    </div>
  )
}
