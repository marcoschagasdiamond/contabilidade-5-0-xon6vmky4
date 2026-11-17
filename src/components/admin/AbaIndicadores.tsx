import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  carregarIndicadoresAdmin,
  type EtapaFunilIndicadores,
  type LeadQuenteIndicadores,
} from '@/services/indicadoresAdmin'
import { extrairScoreLead } from '@/lib/pipelineLeadUtils'

const PREFIXO_TITULO_DIAGNOSTICO_CRM = 'Diagnóstico concluído:'

function fmtData(data?: string) {
  if (!data) return ''
  const d = new Date(data)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function fmtPct(v: number) {
  return `${Math.round(v)}%`
}

/** Card grande com número + tendência simples */
function CardIndicador({
  titulo,
  valor,
  subtitulo,
  tendencia,
}: {
  titulo: string
  valor: string
  subtitulo?: string
  tendencia?: { delta: number; rotulo: string }
}) {
  const positivo = (tendencia?.delta ?? 0) > 0
  const neutro = (tendencia?.delta ?? 0) === 0
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{valor}</div>
        {subtitulo && <p className="mt-1 text-xs text-muted-foreground">{subtitulo}</p>}
        {tendencia && (
          <p
            className={`mt-1 text-xs font-medium ${
              neutro
                ? 'text-muted-foreground'
                : positivo
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
            }`}
          >
            {positivo ? '▲' : neutro ? '—' : '▼'} {tendencia.rotulo}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function SkelGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-28 w-full" />
      ))}
    </div>
  )
}

function FunilVisual({ etapas }: { etapas: EtapaFunilIndicadores[] }) {
  const base = etapas[0]?.quantidade ?? 0
  return (
    <div className="space-y-3">
      {etapas.map((etapa, idx) => {
        const pct = base > 0 ? Math.max(2, (etapa.quantidade / base) * 100) : 0
        const conv =
          idx === 0
            ? null
            : etapas[idx - 1].quantidade > 0
              ? (etapa.quantidade / etapas[idx - 1].quantidade) * 100
              : 0
        return (
          <div key={etapa.chave} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium">
                {idx + 1}. {etapa.rotulo}
              </span>
              <span className="text-sm text-muted-foreground">
                {etapa.quantidade}
                {conv !== null && (
                  <span className="ml-2 text-xs">({fmtPct(conv)} da etapa anterior)</span>
                )}
              </span>
            </div>
            <Progress value={pct} className="h-2.5" />
          </div>
        )
      })}
    </div>
  )
}

export default function AbaIndicadores() {
  const [data, setData] = useState<Awaited<ReturnType<typeof carregarIndicadoresAdmin>> | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let ativo = true
    carregarIndicadoresAdmin()
      .then((d) => {
        if (ativo) setData(d)
      })
      .catch(() => {
        if (ativo) setError(true)
      })
      .finally(() => {
        if (ativo) setIsLoading(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  const leadsQuentes = useMemo<LeadQuenteIndicadores[]>(() => {
    if (!data) return []
    return data.leads
      .map((l) => ({ ...l, scoreCalc: extrairScoreLead(l as any) }))
      .sort((a, b) => b.scoreCalc - a.scoreCalc)
      .slice(0, 8)
      .map((l) => ({
        id: l.id,
        nome: l.nome,
        empresa: l.empresa,
        score: l.scoreCalc,
        estagio_pipeline: l.estagio_pipeline,
        ultima_interacao: l.ultima_interacao,
        temDiagnostico: (l.interacoes_json ?? []).some(
          (i: any) =>
            (i?.tipo === 'sistema' || true) &&
            String(i?.titulo || '').startsWith(PREFIXO_TITULO_DIAGNOSTICO_CRM),
        ),
      }))
  }, [data])

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Não foi possível carregar os indicadores agora. Tente atualizar a página.
        </CardContent>
      </Card>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <SkelGrid />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  const { funil, indicadores } = data

  return (
    <div className="space-y-6">
      {/* ---- Cards de indicadores simples ---- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CardIndicador
          titulo="Leads na semana"
          valor={String(indicadores.leadsSemana)}
          subtitulo="Novos leads nos últimos 7 dias"
          tendencia={indicadores.leadsSemanaAnterior}
        />
        <CardIndicador
          titulo="Diagnósticos na semana"
          valor={String(indicadores.diagnosticosSemana)}
          subtitulo="Concluídos nos últimos 7 dias"
          tendencia={indicadores.diagnosticosSemanaAnterior}
        />
        <CardIndicador
          titulo="Perfis de empresa completos"
          valor={fmtPct(indicadores.percentualPerfisCompletos)}
          subtitulo={`${indicadores.perfisCompletos} de ${indicadores.totalPerfis} perfis`}
        />
        <CardIndicador
          titulo="Fornecedores cadastrados"
          valor={String(indicadores.totalFornecedores)}
          subtitulo="Total na base (Etapa 06)"
        />
      </div>

      {/* ---- Funil de conversão ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Funil de conversão</CardTitle>
          <p className="text-xs text-muted-foreground">
            Leads → Cadastros → Onboarding concluído → Diagnóstico completado (histórico do lead)
          </p>
        </CardHeader>
        <CardContent>
          <FunilVisual etapas={funil} />
        </CardContent>
      </Card>

      {/* ---- Leads quentes ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Leads quentes</CardTitle>
          <p className="text-xs text-muted-foreground">Top leads por score (semana)</p>
        </CardHeader>
        <CardContent>
          {leadsQuentes.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum lead cadastrado ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Lead</th>
                    <th className="py-2 pr-3 font-medium">Empresa</th>
                    <th className="py-2 pr-3 font-medium">Estágio</th>
                    <th className="py-2 pr-3 font-medium">Últ. interação</th>
                    <th className="py-2 pr-3 font-medium">Diagnóstico</th>
                    <th className="py-2 text-right font-medium">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leadsQuentes.map((l) => (
                    <tr key={l.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{l.nome || '—'}</td>
                      <td className="py-2 pr-3">{l.empresa || '—'}</td>
                      <td className="py-2 pr-3">
                        <Badge variant="outline">{l.estagio_pipeline || 'novo'}</Badge>
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {fmtData(l.ultima_interacao) || '—'}
                      </td>
                      <td className="py-2 pr-3">
                        {l.temDiagnostico ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600">Sim</Badge>
                        ) : (
                          <Badge variant="secondary">Não</Badge>
                        )}
                      </td>
                      <td className="py-2 text-right font-bold">{l.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
