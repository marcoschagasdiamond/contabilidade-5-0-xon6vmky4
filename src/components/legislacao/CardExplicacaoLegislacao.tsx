import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  ExplicacaoNorma,
  NormaInputParaExplicacao,
  gerarExplicacaoNorma,
  buscarExplicacaoEmCache,
  extrairTresBlocos,
} from '@/services/explicadorLegislacao'

interface CardExplicacaoLegislacaoProps {
  norma: NormaInputParaExplicacao
  /** Estilo compacto para grids menores */
  compacto?: boolean
}

/**
 * Componente de Explicação de Legislação para Leigos
 * Padrão Diamond Group: Navy (#07132B), Dourado (#D4AF37), SEM ÍCONES.
 *
 * Exibe o botão "Gerar Explicação" e, ao clicar, expande inline no card
 * com exatamente 3 blocos:
 * 1) "O que é"
 * 2) "Para quem importa"
 * 3) "Na prática"
 * Seguido pelo link discreto "Falar com um especialista" -> /contato.
 * Mantém cache local e persistido no backend (segundo clique abre instantaneamente).
 */
export function CardExplicacaoLegislacao({
  norma,
  compacto = false,
}: CardExplicacaoLegislacaoProps) {
  const [expandido, setExpandido] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [explicacao, setExplicacao] = useState<ExplicacaoNorma | null>(null)
  const [textoParcial, setTextoParcial] = useState<string>('')
  const [erro, setErro] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Checa se já temos cache conhecido na montagem (silencioso com debounce leve por card)
  useEffect(() => {
    let ativo = true
    const timer = setTimeout(() => {
      if (!ativo || !norma.chave_norma) return
      buscarExplicacaoEmCache(norma.chave_norma)
        .then((res) => {
          if (ativo && res && res.o_que_e) {
            setExplicacao((prev) =>
              prev?.id === res.id && prev?.updated === res.updated ? prev : res,
            )
          }
        })
        .catch(() => {})
    }, 100)

    return () => {
      ativo = false
      clearTimeout(timer)
    }
  }, [norma.chave_norma])

  // Cancelar ao desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const handleAcionarExplicacao = async () => {
    // Se já estiver aberto e visível, apenas recolhe
    if (expandido && !carregando) {
      setExpandido(false)
      return
    }

    setExpandido(true)
    setErro(null)

    // Se já temos a explicação em memória, exibe instantaneamente sem chamar o agente
    if (explicacao && explicacao.o_que_e) {
      return
    }

    // Tenta primeiro buscar no cache do backend (PocketBase)
    setCarregando(true)
    setTextoParcial('')

    try {
      const emCache = await buscarExplicacaoEmCache(norma.chave_norma)
      if (emCache && emCache.o_que_e) {
        setExplicacao(emCache)
        setCarregando(false)
        return
      }

      // Dispara o agente nativo via hook com streaming
      const abort = new AbortController()
      abortControllerRef.current = abort

      const resultado = await gerarExplicacaoNorma({
        norma,
        onChunk: (chunk) => {
          setTextoParcial(chunk)
        },
        signal: abort.signal,
      })

      setExplicacao(resultado)
      setTextoParcial('')
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      console.warn('[Explicador] Falha ao gerar explicação:', err)
      setErro(
        err?.message ||
          'Não foi possível gerar a explicação no momento. Por favor, tente novamente.',
      )
    } finally {
      setCarregando(false)
      abortControllerRef.current = null
    }
  }

  // Se estiver em streaming parcial mas ainda não finalizou a extração
  const blocosParciais = textoParcial ? extrairTresBlocos(textoParcial) : null

  const oQueE = explicacao?.o_que_e || blocosParciais?.o_que_e || ''
  const paraQuem = explicacao?.para_quem_importa || blocosParciais?.para_quem_importa || ''
  const naPratica = explicacao?.na_pratica || blocosParciais?.na_pratica || ''

  return (
    <div className="pt-2">
      {/* Botão de Acionamento — Padrão Diamond Group (SEM ÍCONES) */}
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          onClick={handleAcionarExplicacao}
          disabled={carregando}
          className={`${
            compacto ? 'h-8 px-3 text-[11px]' : 'h-8 sm:h-9 px-3.5 text-xs'
          } rounded-lg font-heading font-bold transition-all ${
            expandido && explicacao
              ? 'bg-slate-100 hover:bg-slate-200 text-[#07132B] border border-slate-300'
              : 'bg-[#07132B] hover:bg-[#0d2249] text-[#D4AF37] border border-[#D4AF37]/40 hover:border-[#D4AF37] shadow-sm'
          } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {carregando
            ? 'Gerando explicação…'
            : expandido && explicacao
              ? 'Ocultar Explicação'
              : explicacao
                ? 'Ver Explicação'
                : 'Gerar Explicação'}
        </Button>

        {explicacao && (
          <span className="text-[10px] font-mono font-semibold text-slate-400">
            Explicação disponível
          </span>
        )}
      </div>

      {/* Bloco Expandido de Conteúdo */}
      {expandido && (
        <div
          className={`mt-3 rounded-xl border border-[#D4AF37]/50 bg-gradient-to-b from-[#07132B] to-[#0a1b3a] text-white ${
            compacto ? 'p-3 text-xs' : 'p-4 sm:p-5 text-xs sm:text-sm'
          } space-y-3.5 shadow-lg animate-fade-in`}
        >
          {/* Cabeçalho do Bloco Executivo (Sem Ícones) */}
          <div className="flex items-center justify-between border-b border-[#D4AF37]/30 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37] bg-[#D4AF37]/15 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                Guia em Linguagem Leiga • Diamond Group
              </span>
            </div>
            {carregando && (
              <span className="text-[10px] font-mono text-[#D4AF37] animate-pulse">
                Processando análise…
              </span>
            )}
          </div>

          {/* Erro */}
          {erro && (
            <div className="p-3 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 text-xs">
              <span className="font-bold block text-red-100 mb-0.5">Aviso:</span>
              <p>{erro}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAcionarExplicacao}
                className="mt-2 h-7 text-[11px] border-red-400 text-red-100 hover:bg-red-900/50"
              >
                Tentar Novamente
              </Button>
            </div>
          )}

          {/* Estado Inicial de Carregamento sem nenhum texto ainda */}
          {carregando && !oQueE && (
            <div className="py-4 text-center font-mono text-xs text-slate-300 space-y-1">
              <p className="text-[#D4AF37] font-bold">Traduzindo juridiquês da norma…</p>
              <p className="text-[11px] text-slate-400">
                Consultando dados oficiais carregados e estruturando os 3 blocos.
              </p>
            </div>
          )}

          {/* OS TRÊS BLOCOS CURTOS OBRIGATÓRIOS */}
          {(oQueE || paraQuem || naPratica) && (
            <div className="space-y-3 pt-1">
              {/* BLOCO 1: O que é */}
              <div className="space-y-1 rounded-lg bg-white/5 p-3 border border-white/10">
                <span className="text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#D4AF37] block">
                  O que é
                </span>
                <p className="text-slate-100 text-xs sm:text-sm leading-relaxed">
                  {oQueE || 'Analisando ementa oficial…'}
                </p>
              </div>

              {/* BLOCO 2: Para quem importa */}
              <div className="space-y-1 rounded-lg bg-white/5 p-3 border border-white/10">
                <span className="text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#D4AF37] block">
                  Para quem importa
                </span>
                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                  {paraQuem || 'Identificando setores e regimes afetados…'}
                </p>
              </div>

              {/* BLOCO 3: Na prática */}
              <div className="space-y-1 rounded-lg bg-white/5 p-3 border border-white/10">
                <span className="text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#D4AF37] block">
                  Na prática
                </span>
                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                  {naPratica || 'Avaliando o efeito prático para o contribuinte…'}
                </p>
              </div>
            </div>
          )}

          {/* RODAPÉ DO BLOCO: Link discreto "Falar com um especialista" para /contato */}
          <div className="pt-2 border-t border-[#D4AF37]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-[11px] text-slate-400">
              Baseado exclusivamente na ementa e dados oficiais do ato normativo.
            </span>
            <Link
              to="/contato"
              className="inline-flex items-center text-xs font-bold text-[#D4AF37] hover:text-[#f3cd58] underline decoration-1 underline-offset-2 transition-colors self-start sm:self-auto"
            >
              Falar com um especialista →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default CardExplicacaoLegislacao
