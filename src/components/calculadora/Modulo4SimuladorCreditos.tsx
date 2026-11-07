import React from 'react'
import { Link } from 'react-router-dom'
import { useCalculadoraIbsCbs } from '@/context/CalculadoraIbsCbsContext'
import { formatarMoeda, formatarPorcentagem } from '@/lib/calculadoraUtils'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Coins,
  Sparkles,
  TrendingUp,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Building2,
  Info,
} from 'lucide-react'
import { obterInfoRegimeOperacao } from '@/types/calculadoraIbsCbs'
import { BadgeOrigemPropagada } from '@/components/calculadora/BadgeOrigemPropagada'

import {
  PainelProximosPassosCalculadora,
  ModuloCalculadoraId,
} from '@/components/calculadora/PainelProximosPassosCalculadora'
import { BarraAcoesSimulacao } from '@/components/calculadora/BarraAcoesSimulacao'
import { ComposicaoCreditoCompras } from '@/components/calculadora/ComposicaoCreditoCompras'
import { obterAliquotasCreditoPorAno } from '@/lib/calculoFornecedores'
import { type AnoBaseSimulacao } from '@/lib/reformaTributaria'

export interface Modulo4SimuladorCreditosProps {
  onNavegarModulo?: (moduloId: ModuloCalculadoraId) => void
  onSalvarSimulacao?: () => void
  onBaixarPdf?: () => void
  onExportarDados?: () => void
  gerandoPdf?: boolean
}

export default function Modulo4SimuladorCreditos({
  onNavegarModulo,
  onSalvarSimulacao,
  onBaixarPdf,
  onExportarDados,
  gerandoPdf = false,
}: Modulo4SimuladorCreditosProps = {}) {
  const {
    despesasCreditos,
    updateDespesaCredito,
    resetDespesasCreditos,
    resultadoCreditos,
    config,
    anoOperacao,
    origemDadosEmpresa,
    restaurarDadosEmpresaNoModulo,
    origensPropagadas,
    tipoAtividade,
  } = useCalculadoraIbsCbs()

  const isPerfilServico = (config.tipoAtividade || tipoAtividade) === 'servico'

  const handleValorChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const valor = Number(raw) / 100
    updateDespesaCredito(id, { valorMensal: valor })
  }

  const {
    totalAntigo,
    totalNovo,
    adicionalGanho,
    aumentoPercentual,
    economiaAnual,
    anoOperacao: anoEfetivoCreditos,
    aliquotaReferencia: aliqRefCreditos,
    regimeOperacao: regimeOperacaoCreditos,
    isAliquotaZero,
  } = resultadoCreditos

  const anoModulo1 = config.anoTransicao || 2033
  const anoModulo2 = anoOperacao || anoModulo1
  const haDivergenciaAnos = String(anoModulo1) !== String(anoModulo2)

  const infoRegime = obterInfoRegimeOperacao(regimeOperacaoCreditos)

  const rotuloAnoEfetivo =
    anoEfetivoCreditos === 'atual'
      ? 'Ano atual (sistema atual) • Pré-reforma'
      : `fase ${anoEfetivoCreditos}`

  // Formatações dos 5 valores dos cards de resumo
  const strTotalAntigo = formatarMoeda(totalAntigo)
  const strTotalNovo = formatarMoeda(totalNovo)
  const strAdicionalGanho =
    adicionalGanho < 0
      ? `− ${formatarMoeda(Math.abs(adicionalGanho))}`
      : `+ ${formatarMoeda(adicionalGanho)}`
  const strAumentoPercentual =
    aumentoPercentual < 0
      ? `− ${formatarPorcentagem(Math.abs(aumentoPercentual), 1)}`
      : `+ ${formatarPorcentagem(aumentoPercentual, 1)}`
  const strEconomiaAnual = formatarMoeda(economiaAnual)

  // Dados para a Seção de Composição do Crédito de Compras (LC 214/2025 • Fornecedores Simples Nacional)
  const anoNumModulo4: AnoBaseSimulacao =
    typeof anoEfetivoCreditos === 'number' ? (anoEfetivoCreditos as AnoBaseSimulacao) : 2033
  const aliquotaSimplesMediaModulo4 =
    obterAliquotasCreditoPorAno(anoNumModulo4).aliquotaSimplesMedia * 100
  const aliquotaCheiaModulo4 = isAliquotaZero ? 0 : aliqRefCreditos

  const pctFornecSimplesModulo4 = Math.min(
    100,
    Math.max(0, config.porcentagemComprasSimplesNacional ?? 0),
  )

  // As categorias de compras diretas/suprimentos (mercadorias_revenda, mercadoria_revenda, materia_prima, embalagens)
  // Para empresas de serviços, também abrange insumos diretos da atividade (TI, softwares, terceirizados)
  const idsCategoriasCompras = isPerfilServico
    ? new Set([
        'mercadorias_revenda',
        'mercadoria_revenda',
        'materia_prima',
        'embalagens',
        'servicos_ti',
        'consultorias',
        'telefonia_internet',
      ])
    : new Set(['mercadorias_revenda', 'mercadoria_revenda', 'materia_prima', 'embalagens'])
  const despesasCompras = despesasCreditos.filter((d) => idsCategoriasCompras.has(d.id))
  const valorTotalComprasModulo4 = despesasCompras.reduce((acc, d) => acc + (d.valorMensal || 0), 0)

  // Crédito do cenário cheio (100% regime regular) sobre as compras
  const creditoCheioModulo4 = (valorTotalComprasModulo4 * aliquotaCheiaModulo4) / 100

  // Crédito ponderado considerando o % de compras do Simples Nacional da LC 214/2025
  const aliqPonderadaComprasModulo4 =
    pctFornecSimplesModulo4 > 0
      ? (1 - pctFornecSimplesModulo4 / 100) * aliquotaCheiaModulo4 +
        (pctFornecSimplesModulo4 / 100) * aliquotaSimplesMediaModulo4
      : aliquotaCheiaModulo4
  const creditoPonderadoModulo4 = (valorTotalComprasModulo4 * aliqPonderadaComprasModulo4) / 100
  const diferencaCreditoModulo4 = Math.max(0, creditoCheioModulo4 - creditoPonderadoModulo4)

  // Escala responsiva da fonte com base na quantidade de caracteres para evitar estouro em cards compactos
  const obterClasseTamanhoFonte = (texto: string) => {
    const len = texto.length
    if (len >= 18) {
      return 'text-xs'
    }
    if (len >= 14) {
      return 'text-xs sm:text-sm lg:text-xs xl:text-sm'
    }
    if (len >= 11) {
      return 'text-sm sm:text-base lg:text-sm xl:text-base'
    }
    return 'text-base'
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cabeçalho do Módulo */}
      <div className="bg-[#07132B] border border-[#D4AF37]/30 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 tracking-wider uppercase">
              <Coins className="w-3.5 h-3.5" />
              Módulo 4 • Não-Cumulatividade Plena
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
              Simulador de Créditos: Antes versus Depois
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
              Avalie como a substituição das vedações do sistema antigo pelo crédito financeiro
              amplo do IVA Dual ({formatarPorcentagem(aliqRefCreditos)} • {rotuloAnoEfetivo}) gera
              {isAliquotaZero ? ' impacto na cadeia de insumos' : ' economia direta'} em 18
              categorias essenciais de custos operacionais, CAPEX e suprimentos.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => restaurarDadosEmpresaNoModulo(4)}
              className="border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/20 bg-emerald-500/10 text-xs font-semibold gap-1.5"
              title="Recalcula as categorias de crédito com base nas despesas com créditos dos Dados da Empresa"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar dados da empresa
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetDespesasCreditos}
              className="border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-white bg-transparent text-xs"
            >
              Padrão da Tabela
            </Button>
          </div>
        </div>
      </div>

      {/* BANNER NOTA EXPLICATIVA: REGIME DE ALÍQUOTA ZERO SELECIONADO NO MÓDULO 2 */}
      {isAliquotaZero && (
        <div className="bg-amber-50/95 border-2 border-amber-400/80 rounded-2xl p-5 text-amber-950 shadow-md animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200/80 text-amber-900 border border-amber-400">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Alíquota Zero Selecionada no Módulo 2: Créditos Zerados na Cadeia</span>
              </div>
              <h3 className="font-heading font-bold text-base sm:text-lg text-amber-950">
                Regime: {infoRegime.titulo} ({infoRegime.baseLegal})
              </h3>
              <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed max-w-4xl">
                O regime aplicado à operação selecionado no Módulo 2 pertence ao grupo de{' '}
                <strong>Alíquota Zero (arts. 8º, 129 e 146 da LC 214/2025)</strong>. Sob esta
                disciplina legal, a saída é desonerada com alíquota zero sem direito a apropriação
                de créditos sobre as despesas e aquisições da cadeia (o crédito &ldquo;morre&rdquo;
                na operação). Consequentemente, os créditos novos de todas as 18 categorias foram{' '}
                <strong>zerados</strong>, e a coluna &ldquo;Ganho Adicional&rdquo; reflete o valor
                real (crédito novo = 0, gerando variação negativa equivalente à perda dos créditos
                antigos que eram usufruídos no sistema anterior).
              </p>
              <div className="text-xs text-amber-900/80 pt-1 border-t border-amber-300/60 flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  <strong>Tarifas bancárias (arts. 164–165):</strong> Já possuem regime próprio e
                  restrito (0% em 2026 e na alíquota zero permanece 0%).
                </span>
                <span>
                  <strong>Demais regimes:</strong> Para Redução de 60% (arts. 128–134) ou 30% (art.
                  132), a manutenção dos créditos sobre compras é integral.
                </span>
              </div>
            </div>
            <Link
              to="#modulo2"
              onClick={(e) => {
                e.preventDefault()
                const el = document.getElementById('modulo2')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
              className="text-xs font-bold text-amber-950 underline hover:text-amber-800 shrink-0 self-start sm:self-center"
            >
              Alterar regime no Módulo 2 →
            </Link>
          </div>
        </div>
      )}

      {/* AVISO INFORMATIVO COM ATALHO PARA DADOS DA EMPRESA */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
          <span>
            Os valores abaixo são calibrados a partir das despesas mensais com créditos informadas
            nos <strong>Dados da Empresa</strong>. Você pode editar individualmente cada categoria
            para esta simulação.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => restaurarDadosEmpresaNoModulo(4)}
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

      {/* AVISO DISCRETO CASO O ANO DO MÓDULO 1 DIVERJA DO MÓDULO 2 */}
      {haDivergenciaAnos && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3 px-4 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              O cálculo dos créditos segue o Ano da Transição definido no Módulo 2 (Simulador de
              Nota). Para alterar, ajuste lá.
            </span>
          </div>
          <span className="text-[11px] text-amber-800/90 shrink-0">
            Módulo 1: {config.anoTransicao || 2033} • Módulo 2:{' '}
            {anoModulo2 === 'atual' ? 'Ano atual' : anoModulo2}
          </span>
        </div>
      )}

      {/* SEÇÃO COMPOSIÇÃO DO CRÉDITO DE COMPRAS (LC 214/2025 • FORNECEDORES SIMPLES) */}
      <ComposicaoCreditoCompras
        ano={anoEfetivoCreditos}
        aliquotaCheia={aliquotaCheiaModulo4}
        aliquotaSimplesMedia={aliquotaSimplesMediaModulo4}
        porcentagemSimples={pctFornecSimplesModulo4}
        creditoCheio={creditoCheioModulo4}
        creditoPonderado={creditoPonderadoModulo4}
        diferenca={diferencaCreditoModulo4}
        origemModulo="modulo4"
        isServico={isPerfilServico}
      />

      {/* Cards de Resumo e Métricas Conforme Especificação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Crédito Antigo */}
        <Card className="min-w-0 border-slate-200/80 shadow hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
          <CardContent className="p-4 sm:p-5 space-y-1.5 min-w-0 flex flex-col justify-between h-full">
            <div className="space-y-1.5">
              <span
                className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block leading-tight min-h-[2rem] flex items-center break-words"
                title="Crédito Antigo"
              >
                Crédito Antigo
              </span>
              <p
                className={`${obterClasseTamanhoFonte(strTotalAntigo)} font-mono font-extrabold text-slate-700 tracking-tight break-words min-w-0`}
                title={strTotalAntigo}
              >
                {strTotalAntigo}
              </p>
            </div>
            <span className="text-[11px] text-slate-400 block leading-tight pt-1">
              Regras restritivas (insumos diretos e PIS/COFINS)
            </span>
          </CardContent>
        </Card>

        {/* Card 2: Total Crédito Novo */}
        <Card className="min-w-0 border-[#D4AF37]/40 bg-gradient-to-br from-amber-50/30 to-white shadow hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
          <CardContent className="p-4 sm:p-5 space-y-1.5 min-w-0 flex flex-col justify-between h-full">
            <div className="space-y-1.5">
              <span
                className="text-[11px] sm:text-xs font-bold text-amber-900 uppercase tracking-wider block leading-tight min-h-[2rem] flex items-center break-words"
                title={`Crédito Novo (${formatarPorcentagem(aliqRefCreditos)})`}
              >
                Crédito Novo ({isAliquotaZero ? '0,00%' : formatarPorcentagem(aliqRefCreditos)})
              </span>
              <p
                className={`${obterClasseTamanhoFonte(strTotalNovo)} font-mono font-extrabold text-amber-950 tracking-tight break-words min-w-0`}
                title={strTotalNovo}
              >
                {strTotalNovo}
              </p>
            </div>
            <span className="text-[11px] text-amber-800/80 block leading-tight pt-1">
              {isAliquotaZero
                ? 'Créditos zerados (alíquota zero sem direito a crédito na cadeia - arts. 8º, 129 e 146)'
                : `Crédito sobre 100% dos bens e serviços adquiridos (${rotuloAnoEfetivo})`}
            </span>
          </CardContent>
        </Card>

        {/* Card 3: Crédito Adicional Ganho */}
        <Card
          className={`min-w-0 shadow hover:shadow-md transition-all overflow-hidden flex flex-col justify-between ${
            adicionalGanho < 0
              ? 'border-red-200/80 bg-gradient-to-br from-red-50/40 to-white'
              : 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 to-white'
          }`}
        >
          <CardContent className="p-4 sm:p-5 space-y-1.5 min-w-0 flex flex-col justify-between h-full">
            <div className="space-y-1.5">
              <span
                className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider block leading-tight min-h-[2rem] flex items-center break-words ${
                  adicionalGanho < 0 ? 'text-red-800' : 'text-emerald-800'
                }`}
                title="Crédito Adicional Ganho"
              >
                Crédito Adicional Ganho
              </span>
              <p
                className={`${obterClasseTamanhoFonte(strAdicionalGanho)} font-mono font-extrabold ${
                  adicionalGanho < 0 ? 'text-red-600' : 'text-emerald-700'
                } tracking-tight break-words min-w-0`}
                title={strAdicionalGanho}
              >
                {strAdicionalGanho}
              </p>
            </div>
            <span
              className={`text-[11px] font-medium block leading-tight pt-1 ${
                adicionalGanho < 0 ? 'text-red-600' : 'text-emerald-600'
              }`}
            >
              Ganho líquido mensal de crédito
            </span>
          </CardContent>
        </Card>

        {/* Card 4: Aumento Percentual */}
        <Card
          className={`min-w-0 shadow hover:shadow-md transition-all overflow-hidden flex flex-col justify-between ${
            aumentoPercentual < 0
              ? 'border-red-200/80 bg-gradient-to-br from-red-50/20 to-white'
              : 'border-slate-200'
          }`}
        >
          <CardContent className="p-4 sm:p-5 space-y-1.5 min-w-0 flex flex-col justify-between h-full">
            <div className="space-y-1.5">
              <span
                className={`text-[11px] sm:text-xs uppercase tracking-wider block leading-tight min-h-[2rem] flex items-center break-words ${
                  aumentoPercentual < 0 ? 'font-bold text-red-800' : 'font-semibold text-slate-500'
                }`}
                title="Aumento Percentual"
              >
                Aumento Percentual
              </span>
              <p
                className={`${obterClasseTamanhoFonte(strAumentoPercentual)} font-mono font-extrabold ${
                  aumentoPercentual < 0 ? 'text-red-600' : 'text-[#07132B]'
                } tracking-tight break-words min-w-0`}
                title={strAumentoPercentual}
              >
                {strAumentoPercentual}
              </p>
            </div>
            <span
              className={`text-[11px] block leading-tight pt-1 ${
                aumentoPercentual < 0 ? 'text-red-600 font-medium' : 'text-slate-400'
              }`}
            >
              Crescimento relativo na carteira de créditos
            </span>
          </CardContent>
        </Card>

        {/* Card 5: Economia Anual */}
        <Card className="min-w-0 bg-[#07132B] text-white border border-[#D4AF37]/50 shadow-xl overflow-hidden relative sm:col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/20 rounded-full blur-xl pointer-events-none" />
          <CardContent className="p-4 sm:p-5 space-y-1.5 relative min-w-0 flex flex-col justify-between h-full">
            <div className="space-y-1.5">
              <span
                className="text-[11px] sm:text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1 leading-tight min-h-[2rem] break-words"
                title="Economia Anual"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Economia Anual</span>
              </span>
              <p
                className={`${obterClasseTamanhoFonte(strEconomiaAnual)} font-mono font-extrabold text-white tracking-tight break-words min-w-0`}
                title={strEconomiaAnual}
              >
                {strEconomiaAnual}
              </p>
            </div>
            <span className="text-[11px] text-slate-300 block leading-tight pt-1">
              Fluxo financeiro preservado ao ano
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Linha explicativa quando o ganho total for negativo */}
      {adicionalGanho < 0 && (
        <div className="bg-red-50/90 border border-red-200/90 rounded-xl p-3 px-4 text-xs text-red-900 flex items-center gap-2 shadow-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>
            {isAliquotaZero
              ? 'Crédito menor que o atual: a operação enquadrada em alíquota zero (arts. 8º, 129 e 146 da LC 214/2025) veda a tomada de créditos na cadeia, extinguindo o crédito que existia no regime antigo.'
              : 'Crédito menor que o atual: na fase selecionada a alíquota IBS/CBS ainda não supera a carga de créditos do sistema antigo.'}
          </span>
        </div>
      )}

      {/* Tabela Interativa de 18 Categorias Conforme Especificação */}
      <Card className="border-slate-200 shadow-lg overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-heading font-bold text-lg text-[#07132B]">
              Tabela das 18 Categorias de Despesas Corporativas e Insumos
            </h3>
            <p className="text-xs text-slate-500">
              Edite o valor mensal de cada despesa da sua empresa para recalcular os créditos em
              tempo real.
            </p>
          </div>
          <span className="text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex flex-wrap items-center gap-1.5">
            <span>Taxa Referência IVA Dual:</span>
            <strong className="text-[#07132B] font-mono font-bold">
              {isAliquotaZero ? '0,00% (zerada)' : formatarPorcentagem(aliqRefCreditos)}
            </strong>
            <span className="text-slate-400">•</span>
            <span className="text-slate-700 font-medium">
              {isAliquotaZero
                ? `${infoRegime.titulo} — arts. 8º, 129 e 146 LC 214/2025`
                : anoEfetivoCreditos === 'atual'
                  ? 'Ano atual (0%) — vinda da calculadora simples'
                  : `fase ${anoEfetivoCreditos} — vinda da calculadora simples`}
            </span>
            {origensPropagadas?.modulo2AnoOperacao && (
              <BadgeOrigemPropagada
                texto="ano original do Módulo 1"
                title="O ano da operação no Módulo 2 foi mantido a partir do Módulo 1."
              />
            )}
          </span>
        </div>

        {/* NOTA EXPLICATIVA VISÍVEL NA TABELA CASO O REGIME SEJA ALÍQUOTA ZERO */}
        {isAliquotaZero && (
          <div className="bg-amber-100/90 border-b border-amber-300 p-3 px-4 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <strong className="font-bold">Aviso legal da tabela (LC 214/2025):</strong> O regime
              de <strong>{infoRegime.titulo}</strong> ({infoRegime.baseLegal}) selecionado no Módulo
              2 aplica alíquota zero nas saídas sem manutenção do direito ao creditamento sobre as
              despesas operacionais da cadeia (o crédito &ldquo;morre&rdquo; na cadeia), conforme os
              arts. 8º, 129 e 146 da LC 214/2025. Todas as 18 categorias abaixo têm crédito novo
              zerado (0,00%).
            </div>
            <div className="text-[11px] text-amber-800 shrink-0 font-medium">
              Tarifas bancárias: 0,00% (arts. 164–165 mantido regime próprio)
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-100">
              <TableRow className="border-slate-200">
                <TableHead className="font-bold text-slate-700 min-w-[240px]">
                  Categoria de Despesa
                </TableHead>
                <TableHead className="font-bold text-slate-800 text-center min-w-[170px]">
                  Valor Mensal (R$)
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-center min-w-[150px]">
                  Crédito Antigo
                </TableHead>
                <TableHead className="font-bold text-[#07132B] text-center min-w-[160px] bg-amber-50/60">
                  Crédito Novo (IBS/CBS)
                </TableHead>
                <TableHead className="font-bold text-emerald-800 text-center min-w-[150px] bg-emerald-50/60">
                  Ganho Adicional
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm divide-y divide-slate-100">
              {despesasCreditos.map((item) => {
                // Adaptação de rótulo para empresas 100% prestadoras de serviços
                const nomeExibicao =
                  isPerfilServico &&
                  (item.id === 'mercadorias_revenda' || item.id === 'mercadoria_revenda')
                    ? 'Insumos materiais e peças de reposição (serviços)'
                    : item.nome

                const descricaoAntigaExibicao =
                  isPerfilServico &&
                  (item.id === 'mercadorias_revenda' || item.id === 'mercadoria_revenda')
                    ? 'Insumos físicos e peças aplicadas na prestação de serviços (sem crédito amplo no sistema anterior)'
                    : item.descricaoAntigo

                const cAntigo = (item.valorMensal * item.aliquotaAntiga) / 100
                const aliqNova = isAliquotaZero
                  ? 0
                  : item.aliquotaNova !== undefined
                    ? item.aliquotaNova
                    : aliqRefCreditos
                const cNovo = (item.valorMensal * aliqNova) / 100
                const ganho = cNovo - cAntigo

                return (
                  <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-medium text-slate-800 py-3">
                      <div className="font-bold text-slate-900">{nomeExibicao}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {descricaoAntigaExibicao}
                      </div>
                      {item.notaEspecial && (
                        <div className="mt-1 text-[11px] font-medium text-amber-800 bg-amber-50/80 border border-amber-200/70 rounded-md p-1.5 leading-snug">
                          {item.notaEspecial}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center py-3">
                      <Input
                        type="text"
                        value={item.valorMensal.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                        onChange={(e) => handleValorChange(item.id, e)}
                        className="h-10 text-center font-mono font-bold text-slate-900 bg-white border-slate-300 w-full max-w-[160px] mx-auto shadow-sm"
                      />
                    </TableCell>
                    <TableCell className="text-center font-mono text-slate-700 py-3">
                      <div className="font-semibold">{formatarMoeda(cAntigo)}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        ({formatarPorcentagem(item.aliquotaAntiga, 1)})
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold text-amber-950 bg-amber-50/40 py-3">
                      <div>{formatarMoeda(cNovo)}</div>
                      <div className="text-[10px] text-amber-700 font-normal">
                        ({formatarPorcentagem(aliqNova, 1)})
                      </div>
                    </TableCell>
                    <TableCell
                      className={`text-center font-mono font-bold py-3 ${
                        ganho < 0
                          ? 'text-red-600 bg-red-50/40'
                          : 'text-emerald-700 bg-emerald-50/40'
                      }`}
                    >
                      {ganho < 0
                        ? `− ${formatarMoeda(Math.abs(ganho))}`
                        : `+ ${formatarMoeda(ganho)}`}
                    </TableCell>
                  </TableRow>
                )
              })}

              {/* Linha de Totalização Conforme Especificação */}
              <TableRow className="bg-slate-900 text-white font-extrabold text-base hover:bg-slate-900 border-t-2 border-[#D4AF37]">
                <TableCell className="text-white">TOTALIZAÇÃO CONSOLIDADA</TableCell>
                <TableCell className="text-center font-mono text-white">
                  {formatarMoeda(despesasCreditos.reduce((acc, curr) => acc + curr.valorMensal, 0))}
                </TableCell>
                <TableCell className="text-center font-mono text-slate-300">
                  {formatarMoeda(totalAntigo)}
                </TableCell>
                <TableCell className="text-center font-mono text-[#D4AF37] bg-slate-800">
                  {formatarMoeda(totalNovo)}
                </TableCell>
                <TableCell
                  className={`text-center font-mono ${
                    adicionalGanho < 0
                      ? 'text-red-400 bg-red-950/40'
                      : 'text-emerald-400 bg-emerald-950/40'
                  }`}
                >
                  {adicionalGanho < 0
                    ? `− ${formatarMoeda(Math.abs(adicionalGanho))}`
                    : `+ ${formatarMoeda(adicionalGanho)}`}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Premissas Legais Documentadas na Tela Conforme Especificação */}
      <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-5 text-xs text-blue-900 space-y-3">
        <div className="flex items-center gap-2 font-bold text-blue-950 text-sm">
          <AlertCircle className="w-4 h-4 text-blue-700 shrink-0" />
          Premissas Técnicas e Doutrinárias da Simulação de Créditos
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed">
          <ul className="space-y-1.5 list-disc pl-4 text-slate-700">
            <li>
              <strong>Sistema Novo (IVA Dual - Art. 156-A da CF):</strong> Não-cumulatividade
              financeira ampla. Toda aquisição de bem ou serviço vinculada à atividade econômica
              gera crédito imediato, salvo quando a operação for contemplada com regime de alíquota
              zero sem manutenção de crédito.
            </li>
            <li>
              <strong>Regime de Alíquota Zero (Arts. 8º, 129 e 146 da LC 214/2025):</strong>{' '}
              Operações com alíquota zero (Cesta Básica Nacional, hortícolas/frutas/ovos,
              medicamentos essenciais e dispositivos PcD) não geram direito a crédito sobre as
              aquisições da cadeia (o crédito &ldquo;morre&rdquo; na operação), zerando os créditos
              das 18 categorias. Para regimes com redução de 60% (arts. 128–134) ou 30% (art. 132),
              a manutenção dos créditos de entrada permanece integral.
            </li>
            <li>
              <strong>Itens com Crédito Zero no Passado:</strong> Aluguel e materiais para empresas
              no Lucro Presumido/Simples geravam zero crédito. Serviços com ISS (TI, consultoria,
              advocacia) não geravam crédito para nenhum regime.
            </li>
          </ul>
          <ul className="space-y-1.5 list-disc pl-4 text-slate-700">
            <li>
              <strong>Alíquotas de Matéria-Prima e Mercadorias no Passado:</strong> Calculada
              considerando o aproveitamento conjunto de PIS (1,65%), COFINS (7,60%) e ICMS
              interestadual/interno médio (18,00%) no Lucro Real.
            </li>
            <li>
              <strong>
                Regime Especial de Serviços Financeiros e Tarifas (Arts. 164–165 / LC 214/2025):
              </strong>{' '}
              Crédito restrito e apenas a partir de 2027. Tarifas bancárias e intermediações não
              adotam alíquota imediata de 26,50%.
            </li>
            <li>
              <strong>Condição de Pagamento (Split Payment):</strong> No novo modelo, o
              aproveitamento do crédito é condicionado à liquidação financeira ou recolhimento na
              nota fiscal eletrônica.
            </li>
          </ul>
        </div>
      </div>

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
        <PainelProximosPassosCalculadora moduloAtual="modulo4" onNavegarModulo={onNavegarModulo} />
      )}
    </div>
  )
}
