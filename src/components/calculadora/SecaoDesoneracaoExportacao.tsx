import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Globe2, ShieldCheck, Calendar, CheckCircle2 } from 'lucide-react'
import { formatarMoeda, formatarPorcentagem } from '@/lib/calculadoraUtils'
import {
  CRONOGRAMA_FASES_TRANSICAO,
  LISTA_ANOS_TRANSICAO,
  type AnoTransicaoIbsCbs,
} from '@/types/calculadoraIbsCbs'

export interface ItemCronogramaExportacao {
  ano: number | 'atual'
  aliquotaEfetiva: number
  impostoEconomizadoExportacao: number
  impostoMercadoInterno: number
  impostoSemDesoneracao: number
}

export interface CalculoExportacaoProps {
  receitaExportadaAnual: number
  receitaMercadoInternoAnual: number
  cronogramaEconomia: ItemCronogramaExportacao[]
  dadosAnoFoco: ItemCronogramaExportacao | undefined
  economiaHorizonte2027_2033: number
  economiaAnualFoco: number
}
interface SecaoDesoneracaoExportacaoProps {
  desoneracaoExportacaoAtiva: boolean
  setDesoneracaoExportacaoAtiva: (ativa: boolean) => void
  percentualExportacao: number
  setPercentualExportacao: (val: number) => void
  anoFocoTransicao: AnoTransicaoIbsCbs
  setAnoFocoTransicao: (ano: AnoTransicaoIbsCbs) => void
  calculoExportacao: CalculoExportacaoProps
}

export function SecaoDesoneracaoExportacao({
  desoneracaoExportacaoAtiva,
  setDesoneracaoExportacaoAtiva,
  percentualExportacao,
  setPercentualExportacao,
  anoFocoTransicao,
  setAnoFocoTransicao,
  calculoExportacao,
}: SecaoDesoneracaoExportacaoProps) {
  return (
    <Card className="border-slate-200 shadow-md overflow-hidden bg-white">
      <CardHeader className="bg-slate-50/80 border-b border-slate-200/80 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-[#07132B]" />
              <CardTitle className="text-lg font-bold text-[#07132B]">
                2. Desoneração de Exportação de Serviços (LC 214/2025 art. 46)
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-600">
              Imunidade constitucional e não incidência plena: IBS e CBS zerados sobre exportações
              de serviços e manutenção integral dos créditos tomados.
            </CardDescription>
          </div>

          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
            <Label
              htmlFor="toggle-desoneracao-exportacao"
              className="text-xs sm:text-sm font-bold text-[#07132B] cursor-pointer"
            >
              {desoneracaoExportacaoAtiva ? 'Exportação ATIVADA' : 'Ativar Imunidade'}
            </Label>
            <Switch
              id="toggle-desoneracao-exportacao"
              checked={desoneracaoExportacaoAtiva}
              onCheckedChange={setDesoneracaoExportacaoAtiva}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Configuração do percentual de exportação */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 p-4 rounded-2xl bg-slate-50/80 border border-slate-200">
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="sliderExportacao" className="text-xs font-bold text-[#07132B]">
                Participação das Exportações na Receita Bruta (%)
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold text-[#07132B] bg-slate-200 px-2 py-0.5 rounded">
                  {percentualExportacao}%
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  ({formatarMoeda(calculoExportacao.receitaExportadaAnual)}/ano)
                </span>
              </div>
            </div>
            <Slider
              id="sliderExportacao"
              value={[percentualExportacao]}
              min={0}
              max={100}
              step={1}
              onValueChange={(val) => setPercentualExportacao(val[0])}
              className="py-2"
            />
            <span className="text-[11px] text-slate-500 block">
              Arraste para ajustar a proporção de clientes/contratos internacionais da empresa.
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="anoTransicaoDesoneracao" className="text-xs font-bold text-[#07132B]">
              Ano de Foco da Transição
            </Label>
            <select
              id="anoTransicaoDesoneracao"
              value={String(anoFocoTransicao)}
              onChange={(e) => {
                const val = e.target.value
                setAnoFocoTransicao(val === 'atual' ? 'atual' : (Number(val) as AnoTransicaoIbsCbs))
              }}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white font-mono text-xs font-bold text-[#07132B] focus:outline-none focus:ring-2 focus:ring-[#07132B]"
            >
              {LISTA_ANOS_TRANSICAO.map((ano) => (
                <option key={ano} value={String(ano)}>
                  {ano === 'atual' ? 'Sistema Atual (2025/2026)' : `Ano ${ano}`} -{' '}
                  {CRONOGRAMA_FASES_TRANSICAO[ano]?.fase}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-500 block">
              Altera o ano para inspecionar as alíquotas efetivas.
            </span>
          </div>
        </div>

        {/* Cards da Parcela Exportada vs Parcela Interna */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Parcela Interna */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Receita Mercado Interno (Tributável)
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {100 - percentualExportacao}%
              </Badge>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-[#07132B]">
                {formatarMoeda(calculoExportacao.receitaMercadoInternoAnual)}
                <span className="text-xs font-normal text-slate-500 font-sans"> /ano</span>
              </p>
              <span className="text-xs text-slate-500 block">
                Tributada integralmente no regime escolhido e no cronograma IBS/CBS.
              </span>
            </div>
          </div>

          {/* Parcela Exportada Imune */}
          <div
            className={`p-5 rounded-2xl border transition-all space-y-3 ${
              desoneracaoExportacaoAtiva
                ? 'border-emerald-400 bg-emerald-50/40 shadow-sm'
                : 'border-slate-200 bg-slate-50/60'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-[#07132B] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Receita Exportada (100% Desonerada)
              </span>
              <Badge
                className={
                  desoneracaoExportacaoAtiva
                    ? 'bg-emerald-600 text-white text-[10px]'
                    : 'bg-slate-200 text-slate-700 text-[10px]'
                }
              >
                {percentualExportacao}% Imune
              </Badge>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-emerald-800">
                {formatarMoeda(calculoExportacao.receitaExportadaAnual)}
                <span className="text-xs font-normal text-slate-500 font-sans"> /ano</span>
              </p>
              <span className="text-xs text-slate-600 block">
                Alíquota 0,00% de IBS e CBS (art. 46 LC 214/2025) e ISS imune (LC 116/2003).
              </span>
            </div>
          </div>
        </div>

        {/* Tabela do Cronograma da Transição da Exportação (2027 a 2033) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#07132B] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#D4AF37]" />
              Evolução da Economia de IBS/CBS por Ano da Transição
            </span>
            <span className="text-xs font-mono text-slate-500">
              Total acumulado 2027–2033:{' '}
              <strong className="text-emerald-700">
                {formatarMoeda(calculoExportacao.economiaHorizonte2027_2033)}
              </strong>
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                  <th className="py-3 px-4">Ano</th>
                  <th className="py-3 px-4">Fase da Reforma</th>
                  <th className="py-3 px-4 text-right">Alíquota Efetiva</th>
                  <th className="py-3 px-4 text-right">Desembolso s/ Imunidade</th>
                  <th className="py-3 px-4 text-right text-emerald-700 font-extrabold">
                    Economia com Desoneração
                  </th>
                  <th className="py-3 px-4 text-right font-mono">Carga com Imunidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {calculoExportacao.cronogramaEconomia.map((item) => {
                  const isFoco = item.ano === anoFocoTransicao
                  return (
                    <tr
                      key={String(item.ano)}
                      className={`transition-colors ${
                        isFoco ? 'bg-amber-50/70 font-semibold' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-bold font-mono text-[#07132B]">
                        {item.ano === 'atual' ? 'Atual' : item.ano}
                        {isFoco && (
                          <span className="ml-2 text-[10px] bg-[#D4AF37] text-[#07132B] px-1.5 py-0.2 rounded font-sans">
                            Foco
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {CRONOGRAMA_FASES_TRANSICAO[item.ano]?.fase}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono">
                        {formatarPorcentagem(item.aliquotaEfetiva)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                        {formatarMoeda(item.impostoSemDesoneracao)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                        +{formatarMoeda(item.impostoEconomizadoExportacao)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[#07132B]">
                        {formatarMoeda(item.impostoMercadoInterno)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Destaque Legal da Exportação */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-2 font-bold text-[#07132B]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            Fundamentação Legal da Imunidade na Reforma Tributária
          </div>
          <p className="leading-relaxed">
            • <strong>IBS e CBS (Art. 46 da LC nº 214/2025):</strong> É imune a exportação de bens e
            serviços para o exterior, sendo vedada qualquer tributação sobre valores recebidos do
            tomador domiciliado fora do país.
          </p>
          <p className="leading-relaxed">
            • <strong>Manutenção Integral de Créditos:</strong> A empresa mantém 100% dos créditos
            de IBS/CBS incidentes sobre as compras e insumos alocados na prestação do serviço
            exportado, podendo utilizá-los para compensação de débitos internos ou solicitar
            ressarcimento em dinheiro no prazo célere da nova lei.
          </p>
          <p className="leading-relaxed">
            • <strong>ISS Municipal (LC nº 116/2003, art. 2º, I):</strong> O ISS não incide sobre as
            exportações de serviços para o exterior, independentemente do local de prestação, desde
            que o resultado se verifique no exterior.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
