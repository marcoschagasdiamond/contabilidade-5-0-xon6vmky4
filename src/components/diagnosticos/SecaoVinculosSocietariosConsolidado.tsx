import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { VinculoSocietario } from '@/types/dadosEmpresa'
import { analisarVinculosSocietarios, AchadoVinculoSocietario } from '@/lib/vinculosSocietarios'
import { formatarMoeda } from '@/lib/calculadoraUtils'

interface SecaoVinculosSocietariosConsolidadoProps {
  vinculos: VinculoSocietario[]
  regimeAtual?: string
  faturamentoProprio?: number
  nomeEmpresa?: string
}

export const SecaoVinculosSocietariosConsolidado: React.FC<
  SecaoVinculosSocietariosConsolidadoProps
> = ({ vinculos, regimeAtual, faturamentoProprio = 0, nomeEmpresa }) => {
  if (!vinculos || vinculos.length === 0) return null

  const analise = analisarVinculosSocietarios({
    regimeAtual,
    faturamentoAnualProprio: faturamentoProprio,
    vinculos,
  })

  return (
    <Card className="border border-slate-200/90 shadow-md bg-white rounded-[24px] overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[#07132B] via-[#0E1F42] to-[#122347] text-white p-6 sm:p-7 border-b border-[#D4AF37]/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                LC 123/2006 • Res. CGSN 140/2018
              </span>
              <span className="text-xs text-slate-300">
                {vinculos.length} vínculo(s) societário(s) mapeado(s)
              </span>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-heading font-extrabold text-white">
              Análise de Vínculos Societários & Risco de Regime
            </CardTitle>
          </div>

          <div className="flex items-center gap-2">
            {analise.temVedacaoCritica ? (
              <Badge className="bg-rose-600 text-white font-bold text-xs uppercase px-3 py-1">
                Vedação Crítica
              </Badge>
            ) : analise.achados.some((a) => a.severidade === 'critico') ? (
              <Badge className="bg-rose-500 text-white font-bold text-xs uppercase px-3 py-1">
                Limite Excedido
              </Badge>
            ) : analise.achados.some((a) => a.severidade === 'atencao') ? (
              <Badge className="bg-amber-500 text-white font-bold text-xs uppercase px-3 py-1">
                Atenção Limite
              </Badge>
            ) : (
              <Badge className="bg-emerald-600 text-white font-bold text-xs uppercase px-3 py-1">
                Conformidade Plena
              </Badge>
            )}
            <Link
              to="/dados-empresa"
              className="text-xs font-bold text-[#D4AF37] hover:underline px-2 py-1"
            >
              Editar em Dados da Empresa →
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-7 space-y-6">
        {/* RESUMO DOS TOTAIS DE FATURAMENTO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Faturamento Empresa Analisada
            </span>
            <span className="text-base font-extrabold text-slate-800 font-mono">
              {formatarMoeda(faturamentoProprio)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
            <span className="text-[10px] uppercase font-bold text-blue-800 block">
              Soma Global Simples (Art. 3º §4º III)
            </span>
            <span
              className={`text-base font-extrabold font-mono ${
                analise.faturamentoGlobalSimples > 4800000 ? 'text-rose-700' : 'text-blue-900'
              }`}
            >
              {formatarMoeda(analise.faturamentoGlobalSimples)}
            </span>
            <span className="text-[10px] text-blue-700 block mt-0.5">
              Limite legal: R$ 4.800.000,00
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
            <span className="text-[10px] uppercase font-bold text-amber-800 block">
              Soma Condicional Não-Optantes (Art. 3º §4º IV)
            </span>
            <span
              className={`text-base font-extrabold font-mono ${
                analise.faturamentoSomaCondicional > 4800000 ? 'text-rose-700' : 'text-amber-900'
              }`}
            >
              {formatarMoeda(analise.faturamentoSomaCondicional)}
            </span>
            <span className="text-[10px] text-amber-700 block mt-0.5">
              Participação &gt;10% ou administração
            </span>
          </div>
        </div>

        {/* LISTA DE ACHADOS */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Apontamentos e Enquadramento Legal ({analise.achados.length})
          </h4>

          {analise.achados.map((achado: AchadoVinculoSocietario) => {
            const cores =
              achado.severidade === 'critico'
                ? {
                    borda: 'border-rose-300 bg-rose-50/80',
                    badge: 'bg-rose-100 text-rose-900 border-rose-300',
                    titulo: 'text-rose-900',
                    texto: 'text-rose-800',
                  }
                : achado.severidade === 'atencao'
                  ? {
                      borda: 'border-amber-300 bg-amber-50/80',
                      badge: 'bg-amber-100 text-amber-900 border-amber-300',
                      titulo: 'text-amber-900',
                      texto: 'text-amber-800',
                    }
                  : {
                      borda: 'border-emerald-300 bg-emerald-50/80',
                      badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                      titulo: 'text-emerald-900',
                      texto: 'text-emerald-800',
                    }

            return (
              <div key={achado.id} className={`p-4 rounded-xl border ${cores.borda} space-y-2`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${cores.badge}`}
                    >
                      {achado.severidade.toUpperCase()}
                    </span>
                    <strong className={`text-sm font-bold ${cores.titulo}`}>{achado.titulo}</strong>
                  </div>
                  <span className="text-[10px] font-mono bg-white/80 border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                    {achado.normaOrigem}
                  </span>
                </div>

                <p className={`text-xs ${cores.texto} leading-relaxed`}>{achado.descricao}</p>

                <div className="pt-1.5 border-t border-slate-200/50 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-600">
                    <strong>Ação Recomendada:</strong> {achado.recomendacao}
                  </span>
                  {achado.linkLegislacao && (
                    <Link
                      to={achado.linkLegislacao}
                      className="text-slate-700 font-semibold hover:text-[#07132B] underline"
                    >
                      Consultar Legislação →
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* TABELA DE EMPRESAS VINCULADAS */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Detalhamento das Empresas e Participações
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Empresa Vinculada</th>
                  <th className="py-2.5 px-3">Papel / Relação</th>
                  <th className="py-2.5 px-3 text-center">% Part.</th>
                  <th className="py-2.5 px-3 text-center">Adm.?</th>
                  <th className="py-2.5 px-3 text-center">Regime</th>
                  <th className="py-2.5 px-3 text-right">Faturamento Anual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vinculos.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {v.razaoSocial}
                      {v.cnpj && (
                        <span className="block text-[10px] font-mono text-slate-500">{v.cnpj}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {v.papelCliente === 'socio_pf'
                        ? 'Sócio PF'
                        : v.papelCliente === 'administrador'
                          ? 'Administrador'
                          : v.papelCliente === 'holding_socia'
                            ? 'Holding/PJ Sócia'
                            : 'Participação em outra PJ'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      {v.percentualParticipacao}%
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold">
                      {v.exerceAdministracao ? (
                        <span className="text-amber-800">Sim</span>
                      ) : (
                        <span className="text-slate-500">Não</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                        {v.regimeTributario === 'simples'
                          ? 'Simples Nacional'
                          : v.regimeTributario === 'lucro_presumido'
                            ? 'Lucro Presumido'
                            : v.regimeTributario === 'lucro_real'
                              ? 'Lucro Real'
                              : 'Outro'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                      {formatarMoeda(v.faturamentoAnual)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PARECER TÉCNICO SUGERIDO */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
          <strong className="text-slate-800 block font-bold uppercase tracking-wide text-[11px]">
            Recomendação do Consultor Tributário
          </strong>
          <p className="leading-relaxed">
            {analise.temVedacaoCritica
              ? `A empresa analisada (${nomeEmpresa || 'empresa'}) possui apontamento de VEDAÇÃO EXPRESSA ao Simples Nacional (LC 123/2006 art. 3º §4º). Recomenda-se saneamento imediato do quadro societário ou planejamento de transição para o Lucro Presumido/Real, evitando exclusão de ofício com efeitos retroativos e autuação fiscal pela RFB.`
              : analise.achados.some((a) => a.severidade === 'critico')
                ? `A soma das receitas brutas das pessoas jurídicas interligadas ultrapassou o teto de R$ 4.800.000,00 da LC 123/2006. O desenquadramento alcança simultaneamente todas as empresas do grupo. Recomenda-se modelagem de segregação de atividades e simulação no Lucro Presumido/Real com o novo sistema IBS/CBS.`
                : analise.achados.some((a) => a.severidade === 'atencao')
                  ? `O faturamento do grupo está acima de R$ 4.000.000,00 ou dentro da margem de tolerância de 20%. Monitore mensalmente as emissões de notas fiscais para planejar a comunicação de desenquadramento tempestiva e escolher o melhor regime sucessor.`
                  : `A estrutura societária e a receita bruta global das empresas vinculadas encontram-se em conformidade com os limites do art. 3º da LC 123/2006. Mantenha o monitoramento anual em caso de novas participações ou expansão de faturamento.`}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
