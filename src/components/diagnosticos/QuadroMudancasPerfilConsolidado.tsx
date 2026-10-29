import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import {
  obterLegislacaoContextual,
  type RespostaLegislacaoContextual,
  type ItemLegislacao,
} from '@/services/radarTributario'

interface QuadroMudancasPerfilConsolidadoProps {
  segmento?: string
  regimeAtual?: string
  perfilNf?: string
  atividadeMista?: boolean
  temDadosSalvos: boolean
}

export function QuadroMudancasPerfilConsolidado({
  segmento,
  regimeAtual,
  perfilNf,
  atividadeMista,
  temDadosSalvos,
}: QuadroMudancasPerfilConsolidadoProps) {
  const [carregando, setCarregando] = useState<boolean>(true)
  const [resposta, setResposta] = useState<RespostaLegislacaoContextual | null>(null)

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      if (!temDadosSalvos) {
        setCarregando(false)
        setResposta(null)
        return
      }

      setCarregando(true)
      try {
        const res = await obterLegislacaoContextual({
          segmento,
          regimeTributario: regimeAtual,
          regimeAtual,
          perfilNf,
          atividadeMista,
        })
        if (!cancelado) {
          setResposta(res)
        }
      } catch (err) {
        console.error('Erro ao buscar legislação contextual para relatório consolidado:', err)
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
  }, [segmento, regimeAtual, perfilNf, atividadeMista, temDadosSalvos])

  if (!temDadosSalvos) {
    return (
      <Card className="rounded-[24px] border-2 border-[#D4AF37]/50 bg-gradient-to-r from-[#07132B] via-[#0B1E45] to-[#07132B] text-white p-6 shadow-xl">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#D4AF37] text-[#07132B]">
              Rasante de Legislação Contextual
            </span>
            <span className="text-xs font-mono text-[#D4AF37]">Sem Perfil Cadastrado</span>
          </div>

          <h3 className="text-lg font-heading font-extrabold text-white">
            Mudanças da Reforma Tributária e Legislação para o seu Perfil
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Preencha os Dados da Empresa nas Configurações para desbloquear o cruzamento automático
            de leis, alertas do Radar Tributário e teses de crédito específicas para o segmento e
            regime do seu negócio.
          </p>

          <div className="pt-2 flex items-center gap-3">
            <Link
              to="/dados-empresa"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#D4AF37] text-[#07132B] hover:bg-[#c29d2f] transition-all"
            >
              Preencher Dados da Empresa →
            </Link>
          </div>
        </div>
      </Card>
    )
  }

  const mudancas = resposta?.mudancasQueImpactam || []
  const alertas = resposta?.alertasRadar || []

  return (
    <Card className="rounded-[24px] border-2 border-[#D4AF37]/60 bg-[#07132B] text-white shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="p-6 border-b border-[#D4AF37]/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded text-xs font-mono font-extrabold uppercase bg-[#D4AF37] text-[#07132B]">
                MUDANÇAS PARA O SEU PERFIL
              </span>
              <Badge
                variant="outline"
                className="border-[#D4AF37]/60 text-[#D4AF37] text-xs font-mono bg-black/40"
              >
                {segmento} • {regimeAtual}
              </Badge>
            </div>
            <CardTitle className="text-xl font-heading font-extrabold text-white">
              Legislação-Chave & Alertas do Radar Aplicáveis à sua Atividade
            </CardTitle>
            <p className="text-xs text-slate-300">
              Cruzamento de normas vigentes, regras da EC 132/2023, LC 214/2025 e jurisprudência
              vinculante com o seu cadastro.
            </p>
          </div>

          <Link
            to="/legislacao"
            className="text-xs font-bold text-[#D4AF37] hover:underline self-start sm:self-auto shrink-0"
          >
            Acessar Radar Completo →
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* BLOCO DE ALERTAS RECENTES DO RADAR */}
        {alertas.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#D4AF37] font-bold uppercase tracking-wider">
                Alertas Recentes do Radar Tributário ({alertas.length})
              </span>
              <span className="text-slate-400">Monitoramento Contínuo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {alertas.map((alerta) => (
                <div
                  key={alerta.id}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-amber-400 text-[11px]">
                      {alerta.tributo || 'IBS/CBS'} • Alerta Ativo
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-amber-500/20 text-amber-300">
                      {alerta.impacto || 'Importante'}
                    </span>
                  </div>
                  <h5 className="font-bold text-white text-xs">{alerta.titulo}</h5>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{alerta.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NORMAS LEGAIS APLICÁVEIS AO PERFIL */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-white font-bold uppercase tracking-wider">
              Normas que Impactam seu Enquadramento ({mudancas.length})
            </span>
            <span className="text-slate-400">Aplicabilidade Direta</span>
          </div>

          {carregando ? (
            <div className="py-6 text-center text-xs text-slate-400 font-mono">
              Cruzando legislação com os parâmetros da empresa...
            </div>
          ) : mudancas.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400">
              Nenhuma norma específica requerida para os dados informados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mudancas.map((item: ItemLegislacao) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-700 hover:border-[#D4AF37]/50 transition-colors flex flex-col justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                      <span className="text-[#D4AF37] font-bold">
                        {item.tipo} • {item.numero}
                      </span>
                      <span className="text-slate-400">
                        {item.tributo} • {item.ano}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-white leading-snug">{item.titulo}</h5>
                    <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed">
                      {item.ementa}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="truncate">{item.orgao}</span>
                    {item.linkOficial && (
                      <a
                        href={item.linkOficial}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#D4AF37] hover:underline font-bold shrink-0 ml-2"
                      >
                        Texto Oficial
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
