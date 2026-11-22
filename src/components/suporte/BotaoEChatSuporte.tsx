import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { DisplayMessage, AgentCitation } from '@/lib/skipAi'
import {
  enviarMensagemSuporteStream,
  carregarMensagensSuporte,
  listarConversasSuporte,
  type ConversaNativaSuporte,
  type ContextoClienteSuporte,
} from '@/services/suporte'

const STORAGE_KEY_CONVERSA_ID = 'c50_suporte_conversation_id'

/** Evento global para abrir o suporte a partir de uma tela (ex.: card da /carteira). */
export const EVENTO_ABRIR_SUPORTE = 'c50:abrir-suporte'

export interface ContextoSuporteCard extends ContextoClienteSuporte {
  /** Nome de exibição curto (mesmo do card) — usado no banner do chat. */
  rotulo?: string
}

const SUGESTOES_PERGUNTAS = [
  'Como cadastro um fornecedor na Etapa 06?',
  'Onde emito o Relatório Consolidado 360°?',
  'Como funciona o Split Payment na Calculadora?',
  'O que é o Recuperador de Créditos e onde fica?',
  'Como migrar minha conta para Analista?',
  'Qual o contato do atendimento humano?',
]

function criarMensagemBoasVindas(nomeUsuario?: string): DisplayMessage {
  const saudacao = nomeUsuario ? `Olá, ${nomeUsuario}!` : 'Olá!'
  return {
    id: 'welcome',
    role: 'assistant',
    content: `${saudacao} Sou o Assistente de Suporte da Contabilidade 5.0.

Como posso ajudar você hoje? Você pode tirar dúvidas sobre navegação, ferramentas da trilha de diagnósticos (00 a 06), Calculadora IBS/CBS, relatórios ou gestão de clientes.`,
    created: new Date().toISOString(),
  }
}

export function BotaoEChatSuporte() {
  const { isAuthenticated, user, isEmpresario, isAdmin, isMaster } = useAuth()
  const [aberto, setAberto] = useState(false)
  const [conversaId, setConversaId] = useState<string | null>(null)
  const [contextoCliente, setContextoCliente] = useState<ContextoSuporteCard | null>(null)
  const [contextoPendente, setContextoPendente] = useState<ContextoSuporteCard | null>(null)
  const [mensagens, setMensagens] = useState<DisplayMessage[]>([])
  const [inputMensagem, setInputMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [statusAtividade, setStatusAtividade] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [mostrarHistorico, setMostrarHistorico] = useState(false)
  const [conversasAnteriores, setConversasAnteriores] = useState<ConversaNativaSuporte[]>([])
  const [carregandoHistorico, setCarregandoHistorico] = useState(false)
  const [, setCitacoesAtivas] = useState<AgentCitation[] | null>(null)

  const finalMensagensRef = useRef<HTMLDivElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Recupera conversaId armazenada localmente para manter continuidade
  useEffect(() => {
    if (!isAuthenticated) return
    const salvo = localStorage.getItem(STORAGE_KEY_CONVERSA_ID)
    if (salvo && salvo.trim()) {
      setConversaId(salvo.trim())
    }
  }, [isAuthenticated])

  // Aplica o contexto recebido via evento SOMENTE após o histórico ter carregado
  // (statusAtividade de carregamento sai de tela), para nunca disputar o
  // setMensagens da inicialização. O suporte aberto pelo card é a MESMA
  // conversa persistente do suporte normal — nada paralelo é criado.
  useEffect(() => {
    if (!contextoPendente) return
    if (statusAtividade === 'Recuperando histórico da conversa...') return
    setContextoCliente(contextoPendente)
    setContextoPendente(null)
  }, [contextoPendente, statusAtividade])

  // Salva no localStorage quando o conversaId muda
  useEffect(() => {
    if (conversaId) {
      localStorage.setItem(STORAGE_KEY_CONVERSA_ID, conversaId)
    }
  }, [conversaId])

  // Abre o suporte a partir de uma tela externa (ex.: botão "Suporte" do card
  // na /carteira), com contexto opcional do cliente. Usa o MESMO chat, o MESMO
  // agente e o MESMO histórico persistente — nada paralelo é criado.
  useEffect(() => {
    if (!isAuthenticated) return
    const handler = (ev: Event) => {
      const detalhe = (ev as CustomEvent<ContextoSuporteCard | null>).detail ?? null
      setContextoPendente(detalhe && (detalhe.nome || detalhe.cnpj) ? detalhe : null)
      setAberto(true)
    }
    window.addEventListener(EVENTO_ABRIR_SUPORTE, handler)
    return () => window.removeEventListener(EVENTO_ABRIR_SUPORTE, handler)
  }, [isAuthenticated])

  // Inicializa mensagens da conversa atual ou carrega histórico nativo
  useEffect(() => {
    if (!isAuthenticated) return

    let cancelado = false

    async function inicializarChat() {
      const nome = user?.nome || user?.name
      if (conversaId) {
        try {
          setStatusAtividade('Recuperando histórico da conversa...')
          const historico = await carregarMensagensSuporte(conversaId)
          if (!cancelado) {
            if (historico.length > 0) {
              setMensagens(historico)
            } else {
              setMensagens([criarMensagemBoasVindas(nome)])
            }
          }
        } catch (e) {
          console.warn('Não foi possível carregar mensagens da conversa anterior:', e)
          if (!cancelado) {
            setMensagens([criarMensagemBoasVindas(nome)])
          }
        } finally {
          if (!cancelado) setStatusAtividade(null)
        }
      } else {
        setMensagens([criarMensagemBoasVindas(nome)])
      }
    }

    inicializarChat()

    return () => {
      cancelado = true
    }
  }, [isAuthenticated, conversaId, user?.nome, user?.name])

  // Rola até o final das mensagens
  useEffect(() => {
    if (aberto && finalMensagensRef.current) {
      finalMensagensRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [mensagens, aberto, statusAtividade])

  // Carrega lista de conversas quando abre o painel de histórico
  const carregarListaConversas = async () => {
    try {
      setCarregandoHistorico(true)
      const lista = await listarConversasSuporte()
      setConversasAnteriores(lista)
    } catch (e) {
      console.warn('Erro ao carregar lista de conversas de suporte:', e)
    } finally {
      setCarregandoHistorico(false)
    }
  }

  const handleAlternarHistorico = () => {
    const proximo = !mostrarHistorico
    setMostrarHistorico(proximo)
    if (proximo) {
      carregarListaConversas()
    }
  }

  const handleReabrirConversa = (conv: ConversaNativaSuporte) => {
    if (enviando) handleCancelar()
    setConversaId(conv.id)
    setMostrarHistorico(false)
    setErro(null)
  }

  const handleNovaConversa = () => {
    if (enviando) handleCancelar()
    setConversaId(null)
    localStorage.removeItem(STORAGE_KEY_CONVERSA_ID)
    setErro(null)
    setCitacoesAtivas(null)
    setMostrarHistorico(false)
    setContextoCliente(null)
    const nome = user?.nome || user?.name
    setMensagens([criarMensagemBoasVindas(nome)])
  }

  const handleCancelar = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setEnviando(false)
    setStatusAtividade(null)
  }

  const handleEnviar = async (textoDireto?: string) => {
    const texto = (textoDireto || inputMensagem).trim()
    if (!texto || enviando) return

    setErro(null)
    setInputMensagem('')

    const mensagemUsuario: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: texto,
      created: new Date().toISOString(),
    }

    const assistenteTempId = `assistant-${Date.now()}`
    const assistenteTemp: DisplayMessage = {
      id: assistenteTempId,
      role: 'assistant',
      content: '',
      created: new Date().toISOString(),
    }

    setMensagens((prev) => [...prev, mensagemUsuario, assistenteTemp])
    setEnviando(true)
    setStatusAtividade('Consultando manual do sistema e base de suporte...')

    const abort = new AbortController()
    abortControllerRef.current = abort

    try {
      const resultado = await enviarMensagemSuporteStream(
        texto,
        conversaId,
        {
          onChunk: (_delta, full) => {
            setStatusAtividade('Elaborando resposta orientativa...')
            setMensagens((prev) =>
              prev.map((msg) => (msg.id === assistenteTempId ? { ...msg, content: full } : msg)),
            )
          },
          onCitations: (items) => {
            setCitacoesAtivas(items)
          },
          onError: (msg) => {
            setErro(msg)
          },
          signal: abort.signal,
        },
        contextoCliente,
      )

      if (resultado.conversation_id) {
        setConversaId(resultado.conversation_id)
      }

      setMensagens((prev) =>
        prev.map((msg) =>
          msg.id === assistenteTempId
            ? {
                ...msg,
                id: resultado.message_id || msg.id,
                content: resultado.content,
                citations: resultado.citations,
              }
            : msg,
        ),
      )
    } catch (err: unknown) {
      const erroObj = err as { name?: string; message?: string }
      if (erroObj?.name === 'AbortError') {
        setStatusAtividade(null)
        return
      }
      const msgErro = erroObj?.message || 'Falha ao conectar com o Assistente de Suporte.'
      setErro(msgErro)
      setMensagens((prev) =>
        prev.map((msg) =>
          msg.id === assistenteTempId
            ? {
                ...msg,
                content:
                  msg.content ||
                  'Não foi possível concluir o atendimento no momento. Por favor, tente novamente.',
              }
            : msg,
        ),
      )
    } finally {
      setEnviando(false)
      setStatusAtividade(null)
      abortControllerRef.current = null
    }
  }

  // Não renderiza nada se o usuário não estiver logado
  if (!isAuthenticated) {
    return null
  }

  const rotuloPerfil = isMaster
    ? 'Master'
    : isAdmin
      ? 'Admin'
      : isEmpresario
        ? 'Empresário'
        : 'Analista'

  return (
    <>
      {/* Botão Flutuante de Suporte — Canto Inferior Direito (Diamond Group, SEM ÍCONES DE BIBLIOTECA) */}
      <div className="fixed bottom-5 right-5 z-40">
        <Button
          type="button"
          onClick={() => setAberto((prev) => !prev)}
          className="bg-[#07132B] hover:bg-[#0c1f44] text-[#D4AF37] border-2 border-[#D4AF37] font-heading font-extrabold text-xs sm:text-sm h-12 px-4 sm:px-5 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group"
          aria-label="Abrir suporte Contabilidade 5.0"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#2ECC71] animate-pulse" />
          <span>{aberto ? 'Fechar Suporte' : 'Suporte'}</span>
        </Button>
      </div>

      {/* Painel de Chat Flutuante sobreposto à página */}
      {aberto && (
        <div className="fixed inset-x-2 bottom-20 sm:bottom-20 sm:right-5 sm:left-auto sm:w-[460px] md:w-[500px] z-50 animate-fade-in">
          <Card className="bg-[#07132B] text-white border-2 border-[#D4AF37] shadow-2xl rounded-2xl overflow-hidden flex flex-col h-[82vh] sm:h-[620px] max-h-[88vh] relative">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Cabeçalho do Chat — Diamond Group (sem ícones decorativos) */}
            <CardHeader className="p-4 sm:p-5 border-b border-[#D4AF37]/30 bg-slate-900/80 relative shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                      Diamond Group • Atendimento Nativo
                    </span>
                    <Badge
                      variant="outline"
                      className="border-[#2ECC71]/50 text-[#2ECC71] text-[10px] font-bold"
                    >
                      Perfil: {rotuloPerfil}
                    </Badge>
                  </div>
                  <CardTitle className="text-base sm:text-lg font-heading font-extrabold text-white tracking-tight">
                    Suporte Contabilidade 5.0
                  </CardTitle>
                  <p className="text-[11px] sm:text-xs text-slate-300 leading-snug">
                    Tire dúvidas operacionais com base no manual do sistema.
                  </p>
                </div>

                {/* Botão de Fechar discreto */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAberto(false)}
                  className="text-slate-400 hover:text-white hover:bg-white/10 h-8 px-2 text-xs font-bold shrink-0"
                >
                  Fechar [X]
                </Button>
              </div>

              {/* Barra de Ações Rápidas do Cabeçalho */}
              <div className="flex items-center justify-between gap-2 pt-2.5 mt-2 border-t border-white/10 text-xs">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAlternarHistorico}
                    className="text-[11px] h-7 px-2.5 bg-transparent border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-bold"
                  >
                    {mostrarHistorico ? 'Ocultar Histórico' : 'Histórico'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleNovaConversa}
                    className="text-[11px] h-7 px-2.5 bg-transparent border-slate-600 text-slate-300 hover:bg-white/5 font-semibold"
                  >
                    Nova Conversa
                  </Button>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-[#2ECC71]" />
                  <span>Online</span>
                </div>
              </div>

              {/* Banner de contexto do cliente (suporte aberto pelo card da /carteira) */}
              {contextoCliente && (
                <div className="pt-2.5 mt-2 border-t border-white/10">
                  <div className="flex items-start justify-between gap-2 rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-2">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                        Contexto do cliente
                      </div>
                      <div className="text-[11px] text-slate-200 truncate">
                        {[contextoCliente.rotulo || contextoCliente.nome, contextoCliente.cnpj]
                          .filter(Boolean)
                          .join(' • ')}
                        {contextoCliente.regime ? ` • ${contextoCliente.regime}` : ''}
                        {contextoCliente.estagio_funil
                          ? ` • Funil: ${contextoCliente.estagio_funil}`
                          : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setContextoCliente(null)}
                      className="text-[10px] text-slate-400 hover:text-white shrink-0"
                      title="Remover contexto do cliente (o suporte volta a ser geral)"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              )}

              {/* Sugestões Rápidas (quando não há muitas mensagens) */}
              {mensagens.length <= 2 && !mostrarHistorico && (
                <div className="pt-2.5 mt-2 border-t border-white/10">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1.5">
                    Dúvidas Frequentes:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {SUGESTOES_PERGUNTAS.map((sugestao, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={enviando}
                        onClick={() => handleEnviar(sugestao)}
                        className="text-left text-[11px] bg-white/5 hover:bg-[#D4AF37]/20 text-slate-200 hover:text-white border border-[#D4AF37]/30 hover:border-[#D4AF37] px-2.5 py-1 rounded-md transition-all disabled:opacity-50"
                      >
                        {sugestao}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardHeader>

            {/* Painel Retrátil de Histórico de Conversas */}
            {mostrarHistorico && (
              <div className="p-3 sm:p-4 bg-slate-950 border-b border-[#D4AF37]/30 space-y-2 shrink-0 max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between text-xs font-bold text-[#D4AF37]">
                  <span>Conversas Anteriores com o Suporte</span>
                  <button
                    type="button"
                    onClick={() => setMostrarHistorico(false)}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Fechar
                  </button>
                </div>

                {carregandoHistorico ? (
                  <div className="text-center py-4 text-xs text-slate-400">
                    Carregando conversas...
                  </div>
                ) : conversasAnteriores.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400 italic">
                    Nenhuma conversa anterior registrada.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {conversasAnteriores.map((conv) => (
                      <div
                        key={conv.id}
                        className={`p-2 rounded-lg text-xs flex items-center justify-between gap-2 border transition-all ${
                          conv.id === conversaId
                            ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white'
                            : 'bg-slate-900 border-slate-700/60 text-slate-300 hover:border-[#D4AF37]/50'
                        }`}
                      >
                        <span className="truncate font-medium">
                          {conv.title || 'Suporte Contabilidade 5.0'}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleReabrirConversa(conv)}
                          className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B] font-bold text-[10px] h-6 px-2 shrink-0"
                        >
                          Reabrir
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Área de Mensagens (com rolagem) */}
            <CardContent className="p-3 sm:p-4 space-y-3 flex-1 overflow-y-auto scrollbar-thin">
              {mensagens.map((msg) => {
                const isUser = msg.role === 'user'
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 px-1">
                      <span className="font-bold">
                        {isUser ? 'Você' : 'Suporte Contabilidade 5.0'}
                      </span>
                    </div>

                    <div
                      className={`max-w-[92%] rounded-2xl p-3 sm:p-3.5 text-xs leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-[#07132B] font-medium shadow-md rounded-br-none'
                          : 'bg-slate-900 text-slate-100 border border-[#D4AF37]/30 shadow-md rounded-bl-none'
                      }`}
                    >
                      {msg.content || (
                        <span className="italic text-slate-400">Digitando resposta...</span>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Status de Atividade (sem ícones) */}
              {statusAtividade && (
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-[#D4AF37]/30 text-[11px] font-mono text-[#D4AF37] flex items-center justify-between">
                  <span>{statusAtividade}</span>
                  {enviando && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelar}
                      className="text-[10px] text-amber-300 hover:text-amber-100 h-5 px-1.5"
                    >
                      Parar
                    </Button>
                  )}
                </div>
              )}

              {/* Erro */}
              {erro && (
                <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500/60 text-xs text-red-200">
                  <div className="font-bold text-red-100 mb-0.5">Aviso de Suporte:</div>
                  <p>{erro}</p>
                </div>
              )}

              <div ref={finalMensagensRef} />
            </CardContent>

            {/* Rodapé / Formulário de Envio */}
            <div className="p-3 sm:p-4 border-t border-[#D4AF37]/30 bg-slate-900/90 shrink-0 space-y-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleEnviar()
                }}
                className="space-y-2"
              >
                <Textarea
                  value={inputMensagem}
                  onChange={(e) => setInputMensagem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleEnviar()
                    }
                  }}
                  placeholder="Digite sua dúvida sobre o sistema..."
                  rows={2}
                  disabled={enviando}
                  className="bg-slate-950 text-white placeholder:text-slate-400 border border-[#D4AF37]/40 focus-visible:ring-[#D4AF37] resize-none text-xs font-sans"
                />

                <div className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="text-slate-400 truncate">
                    Pressione <strong className="text-slate-200">Enter</strong> para enviar.
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {enviando && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCancelar}
                        className="text-[11px] border-amber-500 text-amber-300 hover:bg-amber-500/10 h-8 px-2.5"
                      >
                        Cancelar
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={enviando || !inputMensagem.trim()}
                      className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B] font-heading font-extrabold text-xs h-8 px-4 rounded-lg shadow-md disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {enviando ? 'Enviando...' : 'Enviar'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}

export default BotaoEChatSuporte
