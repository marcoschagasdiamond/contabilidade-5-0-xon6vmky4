import React, { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { formatarMoeda, formatarPorcentagem } from '@/lib/calculadoraUtils'
import { Scale, Info, TrendingDown, ShieldCheck, Layers, Percent } from 'lucide-react'

export interface ComposicaoCreditoComprasProps {
  ano: number | string
  aliquotaCheia: number
  aliquotaSimplesMedia: number
  porcentagemSimples: number
  creditoCheio: number
  creditoPonderado: number
  diferenca: number
  origemModulo?: 'modulo2' | 'modulo4'
  className?: string
  isServico?: boolean
}

function ComposicaoCreditoComprasComponent({
  ano,
  aliquotaCheia,
  aliquotaSimplesMedia,
  porcentagemSimples,
  creditoCheio,
  creditoPonderado,
  diferenca,
  origemModulo = 'modulo2',
  className = '',
  isServico = false,
}: ComposicaoCreditoComprasProps) {
  const strCreditoCheio = formatarMoeda(creditoCheio)
  const strCreditoPonderado = formatarMoeda(creditoPonderado)
  const strDiferenca = diferenca > 0.005 ? `− ${formatarMoeda(diferenca)}` : 'R$ 0,00'

  const obterClasseTamanhoFonte = (texto: string) => {
    const len = texto.length
    if (len >= 20) return 'text-sm sm:text-base'
    if (len >= 16) return 'text-base sm:text-lg'
    if (len >= 13) return 'text-lg sm:text-xl'
    return 'text-xl sm:text-2xl'
  }

  const anoRotulo = ano === 'atual' ? 'Ano Atual' : `Ano ${ano}`
  const temDiferenca = porcentagemSimples > 0 && diferenca > 0.005

  // Alíquota média ponderada decorrente da composição
  const aliqPonderadaEfetiva =
    porcentagemSimples > 0
      ? (1 - porcentagemSimples / 100) * aliquotaCheia +
        (porcentagemSimples / 100) * aliquotaSimplesMedia
      : aliquotaCheia

  return (
    <div
      className={`bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 ${className}`}
    >
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] shrink-0" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#07132B]">
                {isServico
                  ? 'Composição do Crédito de Insumos / Serviços • LC 214/2025'
                  : 'Composição do Crédito de Compras • LC 214/2025'}
              </span>
              <span className="text-[10px] font-bold text-amber-900 bg-amber-100/90 border border-amber-300/80 px-2 py-0.5 rounded-full">
                % compras do Simples Nacional configurado: {porcentagemSimples}%
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block">
              {isServico
                ? `Ponderação entre aquisições/serviços do regime regular e compras de optantes do Simples Nacional (${anoRotulo}).`
                : `Ponderação entre aquisições do regime regular e compras de optantes do Simples Nacional (${anoRotulo}).`}
            </span>
          </div>
        </div>

        {/* Badges de Alíquotas Usadas na Ponderação */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div
            className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 shadow-2xs"
            title={`Alíquota cheia do IVA Dual para ${anoRotulo}`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-[11px] text-slate-500">IVA Dual Cheio ({anoRotulo}):</span>
            <span className="font-mono font-bold text-[#07132B]">
              {formatarPorcentagem(aliquotaCheia)}
            </span>
          </div>

          <div
            className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 text-amber-900 shadow-2xs"
            title={`Alíquota média de crédito presumido do Simples Nacional da LC 214/2025 para ${anoRotulo}`}
          >
            <Percent className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="text-[11px] text-amber-800">Simples Médio LC 214 ({anoRotulo}):</span>
            <span className="font-mono font-bold text-amber-950">
              {formatarPorcentagem(aliquotaSimplesMedia)}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Comparativo Lado a Lado dos Cenários em R$ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Cenário Cheio (100% Regime Regular) */}
        <Card className="min-w-0 border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
          <CardContent className="p-4 sm:p-5 space-y-2 min-w-0 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-xs text-slate-500 gap-1">
              <span className="font-semibold uppercase tracking-wider truncate">
                Cenário Cheio (100% Regular)
              </span>
              <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold shrink-0 text-[11px]">
                {formatarPorcentagem(aliquotaCheia)}
              </span>
            </div>

            <div className="py-0.5 min-w-0 overflow-hidden">
              <p
                className={`${obterClasseTamanhoFonte(strCreditoCheio)} font-mono font-extrabold text-[#07132B] truncate tracking-tight`}
                title={strCreditoCheio}
              >
                {strCreditoCheio}
              </p>
            </div>

            <p className="text-[11px] text-slate-500 line-clamp-2">
              {isServico
                ? 'Crédito caso 100% dos fornecedores/prestadores fossem do regime regular (não-cumulatividade plena).'
                : 'Crédito caso 100% dos fornecedores fossem do regime regular (não-cumulatividade plena).'}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Cenário Ponderado (% Simples Nacional) */}
        <Card className="min-w-0 border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 to-white shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
          <CardContent className="p-4 sm:p-5 space-y-2 min-w-0 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-xs text-slate-600 gap-1">
              <span className="font-bold uppercase tracking-wider text-emerald-800 truncate">
                Cenário Ponderado ({porcentagemSimples}% SN)
              </span>
              <span className="font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold shrink-0 text-[11px]">
                {formatarPorcentagem(aliqPonderadaEfetiva)}
              </span>
            </div>

            <div className="py-0.5 min-w-0 overflow-hidden">
              <p
                className={`${obterClasseTamanhoFonte(strCreditoPonderado)} font-mono font-extrabold text-emerald-700 truncate tracking-tight`}
                title={strCreditoPonderado}
              >
                {strCreditoPonderado}
              </p>
            </div>

            <p className="text-[11px] text-slate-500 line-clamp-2">
              {isServico
                ? `Crédito com ${porcentagemSimples}% dos insumos/serviços tributados pelo crédito presumido LC 214/2025.`
                : `Crédito com ${porcentagemSimples}% das compras tributadas pelo crédito presumido LC 214/2025.`}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Diferença / Variação Destacada */}
        <Card
          className={`min-w-0 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between ${
            temDiferenca
              ? 'border-amber-300/80 bg-gradient-to-br from-amber-50/50 to-white'
              : 'border-slate-200/80 bg-slate-50/60'
          }`}
        >
          <CardContent className="p-4 sm:p-5 space-y-2 min-w-0 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-xs gap-1">
              <span
                className={`font-bold uppercase tracking-wider truncate ${
                  temDiferenca ? 'text-amber-900' : 'text-slate-600'
                }`}
              >
                Diferença de Crédito
              </span>
              <span
                className={`px-2 py-0.5 rounded font-bold shrink-0 text-[11px] font-mono ${
                  temDiferenca ? 'text-amber-900 bg-amber-100' : 'text-slate-600 bg-slate-200'
                }`}
              >
                {temDiferenca ? 'Menor Apropriação' : 'Paridade Total'}
              </span>
            </div>

            <div className="py-0.5 min-w-0 overflow-hidden">
              <p
                className={`${obterClasseTamanhoFonte(strDiferenca)} font-mono font-extrabold truncate tracking-tight ${
                  temDiferenca ? 'text-amber-900' : 'text-slate-700'
                }`}
                title={strDiferenca}
              >
                {strDiferenca}
              </p>
            </div>

            <p className="text-[11px] text-slate-500 line-clamp-2">
              {temDiferenca
                ? isServico
                  ? `Redução mensal de crédito decorrente de ${porcentagemSimples}% dos insumos/serviços adquiridos no Simples Nacional.`
                  : `Redução mensal de crédito decorrente de ${porcentagemSimples}% das compras no Simples Nacional.`
                : isServico
                  ? 'Com 0% de fornecedores no Simples Nacional, os cenários cheio e ponderado são 100% coincidentes.'
                  : 'Com 0% de compras no Simples Nacional, os cenários cheio e ponderado são 100% coincidentes.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Nota Informativa de Rodapé */}
      <div className="p-2.5 bg-slate-100/80 border border-slate-200/70 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
        <span>
          <strong>Regra LC 214/2025:</strong>{' '}
          {isServico
            ? 'As aquisições de fornecedores e prestadores'
            : 'As aquisições de fornecedores'}{' '}
          do Simples Nacional geram crédito presumido equivalente à alíquota média recolhida no DAS
          ({formatarPorcentagem(aliquotaSimplesMedia)} em {anoRotulo}), em vez da alíquota cheia (
          {formatarPorcentagem(aliquotaCheia)}). O percentual pode ser ajustado no Módulo 1
          (Configurações Gerais).
        </span>
      </div>
    </div>
  )
}

export const ComposicaoCreditoCompras = memo(ComposicaoCreditoComprasComponent)
