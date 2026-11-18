import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import {
  obterLegislacaoContextual,
  type RespostaLegislacaoContextual,
  type ItemLegislacao,
} from '@/services/radarTributario'
import { obterCClasTribPorRegime } from '@/data/cClassTribCatalogo'

interface QuadroLegislacaoContextualCalculadoraProps {
  segmentoSimulado?: string
  regimeSimulado?: string
  ramoSimulado?: string
  faturamentoMensalSimulado?: number
  /** RegimeOperacao (preset LC 214/2025) da simulação — habilita a citação cClassTrib do catálogo curado */
  regimeOperacaoSimulado?: string
}

export function QuadroLegislacaoContextualCalculadora({
  segmentoSimulado,
  regimeSimulado,
  ramoSimulado,
  faturamentoMensalSimulado,
  regimeOperacaoSimulado,
}: QuadroLegislacaoContextualCalculadoraProps) {
  const { dadosEmpresa, temDadosSalvos } = useDadosEmpresa()
  const [carregando, setCarregando] = useState<boolean>(true)
  const [abaAtiva, setAbaAtiva] = useState<'mudancas' | 'recuperacao'>('mudancas')
  const [resposta, setResposta] = useState<RespostaLegislacaoContextual | null>(null)

  // Segmento, regime e ramo: se regimeSimulado for informado (ex: Simples Nacional selecionado no Módulo 1), ele tem precedência
  const regime = regimeSimulado || dadosEmpresa.regimeAtual || ''
  const segmento = segmentoSimulado || dadosEmpresa.segmento || ''
  const ramo = ramoSimulado || ''
  const perfilNf = dadosEmpresa.emissaoNf || ''
  const atividadeMista = dadosEmpresa.atividadeMista || false

  const temPerfil =
    temDadosSalvos ||
    Boolean((segmento && segmento.trim()) || (regime && regime.trim()) || (ramo && ramo.trim()))

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      if (!temPerfil) {
        setCarregando(false)
        setResposta(null)
        return
      }

      setCarregando(true)
      try {
        const res = await obterLegislacaoContextual({
          segmento,
          regimeTributario: regime,
          regimeAtual: regime,
          perfilNf,
          atividadeMista,
          ramo,
          tipoAtividade: ramo,
          faturamentoMensal: faturamentoMensalSimulado || 0,
        })
        if (!cancelado) {
          setResposta(res)
        }
      } catch (err) {
        console.error('Erro ao buscar legislação contextual:', err)
      } finally {
        if (!cancelado) {
          setCarregando(false)
        }
      }
    }

    carregar()

    return () => {
      cancelado = true
    }
  }, [segmento, regime, ramo, perfilNf, atividadeMista, faturamentoMensalSimulado, temPerfil])

  // Se não há perfil preenchido, exibir convite para preencher os Dados da Empresa
  if (!temPerfil) {
    return (
      <Card className="rounded-xl border border-[#D4AF37]/50 bg-gradient-to-r from-[#07132B] via-[#0B1E45] to-[#07132B] text-white shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-full bg-[#D4AF37]/10 blur-2xl pointer-events-none" />
        <CardContent className="p-6 relative space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#D4AF37] text-[#07132B]">
              Rasante de Legislação Contextual
            </span>
            <span className="text-xs font-mono text-[#D4AF37]">Filtro Automático por Perfil</span>
          </div>

          <h3 className="text-lg font-heading font-extrabold text-white">
            Visualize as leis e teses específicas para o perfil da sua empresa
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            Preencha os Dados da Empresa (segmento, regime tributário e perfil de operação) para que
            o sistema filtre automaticamente apenas as normas da Reforma Tributária, leis
            complementares e teses jurisprudenciais de recuperação de créditos que se aplicam ao seu
            negócio.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <a
              href="/dados-empresa"
              className="inline-flex items-center justify-center text-xs font-extrabold px-4 py-2.5 rounded-lg bg-[#D4AF37] hover:bg-[#c29d2f] text-[#07132B] shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Preencher Dados da Empresa
            </a>
            <a
              href="/legislacao"
              className="inline-flex items-center justify-center text-xs font-bold px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 border border-white/20 transition-colors"
            >
              Consultar Legislação Geral
            </a>
          </div>
        </CardContent>
      </Card>
    )
  }

  const mudancas = resposta?.mudancasQueImpactam || []
  const recuperacao = resposta?.direitoRecuperacaoCredito || []
  const itensAtivos = abaAtiva === 'mudancas' ? mudancas : recuperacao
  const entradaCClasTribQuadro = obterCClasTribPorRegime(regimeOperacaoSimulado)

  return (
    <Card className="rounded-xl border-2 border-[#D4AF37]/60 bg-[#07132B] text-white shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="p-5 sm:p-6 border-b border-[#D4AF37]/30 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#D4AF37] text-[#07132B]">
                Rasante de Legislação Contextual
              </span>
              <Badge
                variant="outline"
                className="border-[#D4AF37]/60 text-[#D4AF37] text-[10px] font-mono bg-black/30"
              >
                Perfil: {segmento || 'Geral'} • {regime || 'Geral'}
              </Badge>
            </div>
            <CardTitle className="text-base sm:text-lg font-heading font-extrabold text-white">
              Legislação e Teses Aplicáveis ao seu Enquadramento
            </CardTitle>
            <p className="text-xs text-slate-300">
              Normas e decisões judiciais filtradas especificamente para o segmento e regime da sua
              empresa.
            </p>
            {entradaCClasTribQuadro && (
              <span
                className="text-[11px] font-mono font-bold text-[#D4AF37] bg-black/30 border border-[#D4AF37]/50 px-1.5 py-0.5 rounded w-fit max-w-full truncate"
                title={`Classificação tributária oficial do catálogo: cClassTrib ${entradaCClasTribQuadro.codigo} — ${entradaCClasTribQuadro.descricao}. Fundamentação legal: ${entradaCClasTribQuadro.fundamentacaoLegal}`}
              >
                cClassTrib {entradaCClasTribQuadro.codigo} —{' '}
                {entradaCClasTribQuadro.fundamentacaoLegal}
              </span>
            )}
          </div>

          {/* Abas Alternadoras */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-lg border border-[#D4AF37]/40 shrink-0">
            <button
              type="button"
              onClick={() => setAbaAtiva('mudancas')}
              className={`text-xs font-bold px-3 py-1.5 rounded transition-all ${
                abaAtiva === 'mudancas'
                  ? 'bg-[#D4AF37] text-[#07132B] shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Mudanças que Impactam ({mudancas.length})
            </button>
            <button
              type="button"
              onClick={() => setAbaAtiva('recuperacao')}
              className={`text-xs font-bold px-3 py-1.5 rounded transition-all ${
                abaAtiva === 'recuperacao'
                  ? 'bg-[#D4AF37] text-[#07132B] shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Direito de Recuperação ({recuperacao.length})
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-4 relative">
        {carregando ? (
          <div className="py-8 text-center text-xs text-slate-400 font-mono">
            Carregando normas aplicáveis ao perfil...
          </div>
        ) : itensAtivos.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Nenhuma norma específica cadastrada nesta categoria para o perfil selecionado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {itensAtivos.map((item: ItemLegislacao) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-[#D4AF37]/60 transition-colors flex flex-col justify-between gap-2.5"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                    <span className="font-mono text-[#D4AF37] font-bold">
                      {item.tipo} • {item.numero}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {item.alertaVencimento && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium tracking-wide bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                          {item.alertaVencimento}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.tributo} • {item.ano}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                    {item.titulo}
                  </h4>

                  <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed">
                    {item.ementa}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-slate-400 truncate">
                    {item.orgao}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.categoria === 'jurisprudencia' && item.teseRecuperadorId && (
                      <a
                        href={`/recuperador-creditos?tese=${item.teseRecuperadorId}`}
                        className="text-[10px] font-extrabold text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                      >
                        Calcular Tese
                      </a>
                    )}
                    {item.linkOficial && (
                      <a
                        href={item.linkOficial}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-[#D4AF37] hover:underline underline-offset-2"
                      >
                        Texto Oficial
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 border-t border-[#D4AF37]/20">
          <span>Fonte: LexML, Senado Federal e Catálogo de Legislação Contabilidade 5.0</span>
          <a href="/legislacao" className="text-[#D4AF37] hover:underline font-bold">
            Acessar Radar Completo de Legislação
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
