import React, { useState, useEffect, useRef } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  streamAgentChat,
  displayableMessages,
  type DisplayMessage,
  type AgentCitation,
} from '@/lib/skipAi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface QuadroAssistenteAnaliseProps {
  /** Callback opcional quando o usuário fecha o quadro */
  onFechar?: () => void
  /** Se deve renderizar aberto inicialmente */
  abertoInicial?: boolean
}

const SUGESTOES_RAPIDAS = [
  'As minhas simulações salvas estão corretas?',
  'Qual das minhas simulações apresenta o melhor custo tributário?',
  'Qual o impacto da transição 2026–2033 nos meus cenários salvos?',
  'Como o Split Payment afeta o caixa da minha empresa?',
]

export function QuadroAssistenteAnalise({
  onFechar,
  abertoInicial = true,
}: QuadroAssistenteAnaliseProps) {
  const [aberto, setAberto] = useState(abertoInicial)
  const [mensagens, setMensagens] = useState<DisplayMessage[]>([])
  const [conversaId, setConversaId] = useState<string | null>(null)
  const [inputMensagem, setInputMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [statusAtividade, setStatusAtividade] = useState<string | null>(null)
  const [citacoesAtivas, setCitacoesAtivas] = useState<AgentCitation[] | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const finalMensagensRef = useRef<HTMLDivElement>(null)

  // Scroll suave para a última mensagem
  useEffect(() => {
    if (aberto && finalMensagensRef.current) {
      finalMensagensRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [mensagens, statusAtividade, aberto])

  // Cancelar requisição em andamento caso o componente desmonte
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Inicializa conversa com mensagem de boas-vindas executiva (sem ícones)
  useEffect(() => {
    if (mensagens.length === 0) {
      setMensagens([
        {
          id: 'welcome-msg',
          role: 'assistant',
          content:
            'Olá! Sou o Assistente de Análise Tributária da Calculadora IBS/CBS (Diamond Group). Tenho acesso direto às suas simulações salvas e aos parâmetros da Reforma Tributária (LC 214/2025 e EC 132/2023).\n\nPosso auditar suas premissas, comparar cenários salvos, avaliar cargas efetivas e verificar economias projetadas. O que gostaria de analisar hoje?',
          created: new Date().toISOString(),
        },
      ])
    }
  }, [mensagens.length])

  const handleEnviar = async (textoParaEnviar?: string) => {
    const texto = (textoParaEnviar || inputMensagem).trim()
    if (!texto || enviando) return

    setErro(null)
    setInputMensagem('')

    // Verifica autenticação
    if (!pb.authStore.isValid || !pb.authStore.record?.id) {
      setErro('Faça login na sua conta para que o Assistente possa acessar suas simulações salvas.')
      return
    }

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
    setStatusAtividade('Consultando base de conhecimento e simulações...')

    const abort = new AbortController()
    abortControllerRef.current = abort

    try {
      const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
      const res = await fetch(`${baseUrl}/backend/v1/calculadora/assistente-chat-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: pb.authStore.token,
        },
        body: JSON.stringify({
          message: texto,
          conversation_id: conversaId,
        }),
        signal: abort.signal,
      })

      const resultado = await streamAgentChat(res, {
        onChunk: (_delta, full) => {
          setStatusAtividade('Redigindo parecer técnico...')
          setMensagens((prev) =>
            prev.map((msg) => (msg.id === assistenteTempId ? { ...msg, content: full } : msg)),
          )
        },
        onToolCallStart: (info) => {
          if (info.name.includes('simulacoes')) {
            setStatusAtividade('Consultando suas simulações salvas no banco de dados...')
          } else {
            setStatusAtividade(`Executando consulta técnica (${info.name})...`)
          }
        },
        onToolCallDone: () => {
          setStatusAtividade('Processando comparativo tributário...')
        },
        onCitations: (items) => {
          setCitacoesAtivas(items)
        },
        onError: (msg) => {
          setErro(msg)
        },
        signal: abort.signal,
      })

      const novoConvId = res.headers.get('X-Conversation-Id') ?? resultado.conversation_id
      if (novoConvId) {
        setConversaId(novoConvId)
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
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setStatusAtividade(null)
        return
      }
      const msgErro = err?.message || 'Falha ao conectar com o Assistente de Análise.'
      setErro(msgErro)
      setMensagens((prev) =>
        prev.map((msg) =>
          msg.id === assistenteTempId
            ? {
                ...msg,
                content:
                  msg.content ||
                  'Não foi possível concluir a análise no momento. Por favor, tente novamente.',
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

  const handleCancelar = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setEnviando(false)
    setStatusAtividade(null)
  }

  const handleLimparConversa = () => {
    if (enviando) handleCancelar()
    setConversaId(null)
    setErro(null)
    setCitacoesAtivas(null)
    setMensagens([
      {
        id: 'welcome-msg-reset',
        role: 'assistant',
        content:
          'Conversa reiniciada. Pergunte sobre qualquer aspecto das suas simulações salvas ou cenários da LC 214/2025.',
        created: new Date().toISOString(),
      },
    ])
  }

  const handleAlternarAberto = () => {
    const proximo = !aberto
    setAberto(proximo)
    if (!proximo && onFechar) {
      onFechar()
    }
  }

  return (
    <div id="assistente-analise-container" className="space-y-4">
      {/* Botão de texto no padrão Diamond Group (SEM ÍCONES) */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button
          type="button"
          onClick={handleAlternarAberto}
          className="bg-[#07132B] hover:bg-[#0c1f44] text-[#D4AF37] border-2 border-[#D4AF37] font-heading font-bold text-xs sm:text-sm h-11 px-5 rounded-xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          {aberto
            ? 'Ocultar Assistente de Análise — Calculadora IBS/CBS'
            : 'Abrir Assistente de Análise — Calculadora IBS/CBS'}
        </Button>
        {aberto && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLimparConversa}
              className="text-xs text-slate-700 border-slate-300 hover:bg-slate-100 font-semibold"
            >
              Nova Conversa
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAlternarAberto}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Fechar Quadro
            </Button>
          </div>
        )}
      </div>

      {/* Quadro de Chat — fluxo normal da página (respeita sticky do cabeçalho e filtros) */}
      {aberto && (
        <Card className="bg-[#07132B] text-white border-2 border-[#D4AF37] shadow-2xl rounded-2xl overflow-hidden relative animate-fade-in">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Cabeçalho do Quadro — Identidade Diamond Group (sem ícones) */}
          <CardHeader className="p-5 sm:p-6 border-b border-[#D4AF37]/30 bg-slate-900/60 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 mb-1.5">
                  Inteligência Tributária • LC 214/2025 • Diamond Group
                </div>
                <CardTitle className="text-lg sm:text-xl font-heading font-extrabold text-white tracking-tight">
                  Assistente de Análise — Calculadora IBS/CBS
                </CardTitle>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                  Consulte diretamente o agente nativo para comparar suas simulações salvas, auditar
                  cargas tributárias, validar premissas da transição 2026–2033 e conferir se seus
                  números atendem aos critérios legais da Reforma Tributária.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-300">Agente Conectado às Simulações</span>
              </div>
            </div>

            {/* Sugestões Rápidas de Perguntas (sem ícones) */}
            <div className="pt-3 border-t border-white/10 mt-3">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-2">
                Sugestões de Perguntas:
              </span>
              <div className="flex flex-wrap gap-2">
                {SUGESTOES_RAPIDAS.map((sugestao, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={enviando}
                    onClick={() => handleEnviar(sugestao)}
                    className="text-left text-xs bg-white/5 hover:bg-[#D4AF37]/20 text-slate-200 hover:text-white border border-[#D4AF37]/30 hover:border-[#D4AF37] px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                  >
                    {sugestao}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          {/* Área de Mensagens */}
          <CardContent className="p-4 sm:p-6 space-y-4 relative">
            <div className="max-h-[500px] min-h-[280px] overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              {mensagens.map((msg) => {
                const isUser = msg.role === 'user'
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 px-1">
                      <span className="font-bold">
                        {isUser ? 'Sua Pergunta' : 'Assistente Diamond Group'}
                      </span>
                    </div>

                    <div
                      className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-[#07132B] font-medium shadow-md font-sans rounded-br-none'
                          : 'bg-slate-900/90 text-slate-100 border border-[#D4AF37]/30 font-sans shadow-md rounded-bl-none'
                      }`}
                    >
                      {msg.content || (
                        <span className="italic text-slate-400">Gerando resposta...</span>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Status de Atividade (Spinner textual / texto de progresso sem ícones) */}
              {statusAtividade && (
                <div className="p-3 rounded-xl bg-slate-900/70 border border-[#D4AF37]/30 text-xs font-mono text-[#D4AF37] flex items-center justify-between">
                  <span>{statusAtividade}</span>
                  {enviando && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelar}
                      className="text-[11px] text-amber-300 hover:text-amber-100 h-6 px-2"
                    >
                      Interromper
                    </Button>
                  )}
                </div>
              )}

              {/* Erro */}
              {erro && (
                <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/60 text-xs text-red-200">
                  <div className="font-bold text-red-100 mb-0.5">Aviso do Assistente:</div>
                  <p>{erro}</p>
                </div>
              )}

              <div ref={finalMensagensRef} />
            </div>

            {/* Formulário de Envio (sem ícones) */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleEnviar()
              }}
              className="space-y-2 pt-3 border-t border-[#D4AF37]/30"
            >
              <div className="relative">
                <Textarea
                  value={inputMensagem}
                  onChange={(e) => setInputMensagem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleEnviar()
                    }
                  }}
                  placeholder="Ex.: Compare minhas simulações salvas e me diga se o Lucro Presumido continua mais vantajoso que o Simples em 2027..."
                  rows={3}
                  disabled={enviando}
                  className="bg-slate-900/90 text-white placeholder:text-slate-400 border border-[#D4AF37]/40 focus-visible:ring-[#D4AF37] resize-none text-xs sm:text-sm font-sans"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-[11px] text-slate-400">
                  Pressione <strong className="text-slate-200">Enter</strong> para enviar ou{' '}
                  <strong className="text-slate-200">Shift + Enter</strong> para quebra de linha.
                </span>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {enviando && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancelar}
                      className="text-xs border-amber-500 text-amber-300 hover:bg-amber-500/10 h-9 px-3"
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={enviando || !inputMensagem.trim()}
                    className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B] font-heading font-extrabold text-xs h-9 px-5 rounded-lg shadow-md disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {enviando ? 'Analisando...' : 'Enviar Pergunta'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
export default QuadroAssistenteAnalise
