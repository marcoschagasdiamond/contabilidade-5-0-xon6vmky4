import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import {
  obterLegislacaoContextual,
  type ItemLegislacao,
  type RespostaLegislacaoContextual,
} from '@/services/radarTributario'

interface QuadroTesesContextuaisRecuperadorProps {
  segmentoSelecionado?: string
  regimeSelecionado?: string
  onSelecionarTese?: (teseId: string) => void
}

export function QuadroTesesContextuaisRecuperador({
  segmentoSelecionado,
  regimeSelecionado,
  onSelecionarTese,
}: QuadroTesesContextuaisRecuperadorProps) {
  const { dadosEmpresa, temDadosSalvos } = useDadosEmpresa()
  const [carregando, setCarregando] = useState<boolean>(true)
  const [resposta, setResposta] = useState<RespostaLegislacaoContextual | null>(null)

  const segmento = segmentoSelecionado || dadosEmpresa.segmento || ''
  const regime = regimeSelecionado || dadosEmpresa.regimeAtual || ''
  const perfilNf = dadosEmpresa.emissaoNf || ''
  const atividadeMista = dadosEmpresa.atividadeMista || false

  const temPerfil =
    temDadosSalvos || Boolean((segmento && segmento.trim()) || (regime && regime.trim()))

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
        })
        if (!cancelado) {
          setResposta(res)
        }
      } catch (err) {
        console.error('Erro ao buscar teses contextuais:', err)
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
  }, [segmento, regime, perfilNf, atividadeMista, temPerfil])

  if (!temPerfil) {
    return (
      <Card className="rounded-2xl border border-[#D4AF37]/50 bg-gradient-to-r from-[#07132B] via-[#0B1E45] to-[#07132B] text-white p-5 shadow-lg">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#D4AF37] text-[#07132B]">
              Teses Aplicáveis por Perfil
            </span>
            <span className="text-[11px] font-mono text-[#D4AF37]">Sem Perfil Definido</span>
          </div>
          <h4 className="text-sm font-bold text-white">
            Preencha os Dados da Empresa para ver teses exclusivas do seu perfil
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Ao definir o segmento (serviços, indústria, comércio) e regime tributário (Lucro Real ou
            Presumido), o sistema exibe apenas as teses judiciais com repercussão geral aplicáveis à
            sua atividade (ex.: serviços → RE 592.616; indústria → Tema 77).
          </p>
          <div className="pt-2">
            <a
              href="/dados-empresa"
              className="inline-flex items-center justify-center text-xs font-bold px-3.5 py-1.5 rounded-lg bg-[#D4AF37] text-[#07132B] hover:bg-[#c29d2f] transition-all"
            >
              Preencher Dados da Empresa
            </a>
          </div>
        </div>
      </Card>
    )
  }

  const tesesAplicaveis = resposta?.direitoRecuperacaoCredito || []

  return (
    <Card className="rounded-2xl border-2 border-[#D4AF37]/60 bg-[#07132B] text-white shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />

      <CardHeader className="p-4 sm:p-5 border-b border-[#D4AF37]/30">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#D4AF37] text-[#07132B]">
                Jurisprudência Vinculante
              </span>
              <Badge
                variant="outline"
                className="border-[#D4AF37]/60 text-[#D4AF37] text-[10px] font-mono bg-black/30"
              >
                {segmento} • {regime}
              </Badge>
            </div>
            <CardTitle className="text-sm sm:text-base font-bold text-white">
              Teses Judiciais de Recuperação de Crédito do seu Perfil
            </CardTitle>
          </div>
          <span className="text-[11px] font-mono text-slate-300">
            {tesesAplicaveis.length}{' '}
            {tesesAplicaveis.length === 1 ? 'tese aplicável' : 'teses aplicáveis'}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-3">
        {carregando ? (
          <div className="py-4 text-center text-xs text-slate-400 font-mono">
            Filtrando teses jurisprudenciais aplicáveis...
          </div>
        ) : tesesAplicaveis.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">
            Nenhuma tese vinculante encontrada para a combinação de segmento e regime atual.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tesesAplicaveis.map((tese: ItemLegislacao) => (
              <div
                key={tese.id}
                className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-[#D4AF37]/60 transition-colors flex flex-col justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                    <span className="text-[#D4AF37] font-bold">
                      {tese.tipo} • {tese.numero}
                    </span>
                    <span className="text-slate-400">{tese.tributo}</span>
                  </div>
                  <h5 className="text-xs font-bold text-white leading-snug">{tese.titulo}</h5>
                  <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed">
                    {tese.ementa}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Julgado: {tese.dataJulgamento || tese.ano}
                  </span>
                  <div className="flex items-center gap-2">
                    {tese.teseRecuperadorId && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelecionarTese && tese.teseRecuperadorId) {
                            onSelecionarTese(tese.teseRecuperadorId)
                          }
                        }}
                        className="text-[11px] font-extrabold text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                      >
                        Recuperar este crédito
                      </button>
                    )}
                    {tese.linkOficial && (
                      <a
                        href={tese.linkOficial}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-[#D4AF37] hover:underline underline-offset-2"
                      >
                        Fonte Oficial
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
