import { useMemo, useState } from 'react'
import { Sparkles, RotateCcw, ArrowRight, HelpCircle, MessageCircleQuestion } from 'lucide-react'

export interface PerguntaQuizServicos {
  id: string
  pergunta: string
  opcoes: {
    valor: string
    rotulo: string
    descricao?: string
    servicoId: string
  }[]
}

export interface OpcoesQuizServicos {
  problema: string
  porte: string
  regime: string
  urgencia?: string
}

interface QualServicoParaMimProps {
  aoRecomendar: (idServico: string) => void
}

/**
 * Bloco orientador "Qual serviço é para mim?" da página /servicos.
 *
 * 4 perguntas rápidas (problema principal, porte, regime tributário e urgência)
 * que apontam, ao final, o serviço recomendado. A indicação é puramente
 * orientativa: o componente não altera cálculos, diagnósticos nem CRM — apenas
 * chama `aoRecomendar(idServico)`, que rola suavemente até a seção do serviço.
 */
export default function QualServicoParaMim({ aoRecomendar }: QualServicoParaMimProps) {
  const [etapa, setEtapa] = useState(0)
  const [respostas, setRespostas] = useState<Partial<OpcoesQuizServicos>>({})

  const perguntas: PerguntaQuizServicos[] = useMemo(
    () => [
      {
        id: 'problema',
        pergunta: 'Qual é o principal desafio da sua empresa hoje?',
        opcoes: [
          {
            valor: 'impostos',
            rotulo: 'Impostos altos / pagar indevidamente',
            descricao: 'Carga tributária pesada ou créditos esquecidos nos últimos anos',
            servicoId: 'assessoria-tributaria',
          },
          {
            valor: 'organizacao',
            rotulo: 'Falta de organização fiscal e contábil',
            descricao: 'Obrigações atrasadas, relatórios fora do prazo, falta de clareza',
            servicoId: 'gestao-fiscal',
          },
          {
            valor: 'caixa',
            rotulo: 'Fluxo de caixa apertado ou dívidas',
            descricao: 'Dificuldade para honrar folha, fornecedores ou renegociar passivos',
            servicoId: 'recuperacao-empresas-dividas',
          },
          {
            valor: 'visao',
            rotulo: 'Falta de visão estratégica do negócio',
            descricao: 'Decisões importantes sem base sólida de dados',
            servicoId: 'diagnostico-360',
          },
        ],
      },
      {
        id: 'porte',
        pergunta: 'Qual é o porte da sua empresa?',
        opcoes: [
          {
            valor: 'pequeno',
            rotulo: 'Pequeno porte',
            descricao: 'Até ~10 colaboradores, operação enxuta',
            servicoId: 'contabilidade-digital',
          },
          {
            valor: 'medio',
            rotulo: 'Médio porte',
            descricao: 'Entre ~10 e 50 colaboradores, rotina mais estruturada',
            servicoId: 'bpo-contabil',
          },
          {
            valor: 'grande',
            rotulo: 'Grande porte / múltiplas empresas',
            descricao: 'Mais de 50 colaboradores ou grupo com várias CNPJs',
            servicoId: 'consultoria-financeira',
          },
        ],
      },
      {
        id: 'regime',
        pergunta: 'Qual é o seu regime tributário atual?',
        opcoes: [
          {
            valor: 'simples',
            rotulo: 'Simples Nacional',
            descricao: 'Atenção a sublimites, Fator R e transição da Reforma',
            servicoId: 'contabilidade-digital',
          },
          {
            valor: 'presumido',
            rotulo: 'Lucro Presumido',
            descricao: 'Bom momento para comparar cenários e planejar a Reforma',
            servicoId: 'consultoria-financeira',
          },
          {
            valor: 'real',
            rotulo: 'Lucro Real',
            descricao: 'Espaço maior para recuperação de créditos e teses fiscais',
            servicoId: 'assessoria-tributaria',
          },
          {
            valor: 'nao-sei',
            rotulo: 'Não sei informar',
            descricao: 'Sem problema — o Diagnóstico 360° mapeia isso por você',
            servicoId: 'diagnostico-360',
          },
        ],
      },
      {
        id: 'urgencia',
        pergunta: 'Quão urgente é resolver isso?',
        opcoes: [
          {
            valor: 'imediata',
            rotulo: 'Urgente — situação crítica',
            descricao: 'Risco de bloqueio, multa ou operação parando',
            servicoId: 'recuperacao-empresas-dividas',
          },
          {
            valor: 'curto-prazo',
            rotulo: 'Nos próximos meses',
            descricao: 'Quero planejar e agir ainda neste semestre',
            servicoId: 'diagnostico-360',
          },
          {
            valor: 'estruturar',
            rotulo: 'Quero me organizar / proteger',
            descricao: 'Foco em estrutura, sucessão e blindagem patrimonial',
            servicoId: 'planejamento-sucessorio-patrimonial',
          },
        ],
      },
    ],
    [],
  )

  const perguntaAtual = perguntas[etapa]
  const totalPerguntas = perguntas.length

  const handleEscolher = (valor: string, servicoId: string) => {
    const novasRespostas = { ...respostas, [perguntaAtual.id]: valor } as OpcoesQuizServicos
    setRespostas(novasRespostas)

    if (etapa < totalPerguntas - 1) {
      setEtapa(etapa + 1)
    } else {
      // Contagem de votos por serviço — o mais citado vence
      const votos: Record<string, number> = {}
      perguntas.forEach((p) => {
        const respostaDada = novasRespostas[p.id]
        if (!respostaDada) return
        const opcaoEscolhida = p.opcoes.find((o) => o.valor === respostaDada)
        if (opcaoEscolhida) {
          votos[opcaoEscolhida.servicoId] = (votos[opcaoEscolhida.servicoId] || 0) + 1
        }
      })
      const servicoVencedor = Object.entries(votos).sort((a, b) => b[1] - a[1])[0]
      if (servicoVencedor) {
        aoRecomendar(servicoVencedor[0])
      }
    }
  }

  const handleReiniciar = () => {
    setEtapa(0)
    setRespostas({})
  }

  return (
    <section
      data-testid="quiz-qual-servico"
      className="py-16 bg-white border-b border-slate-200/80"
      aria-label="Qual serviço é para mim?"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Cabeçalho do bloco orientador */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 border border-emerald-300 mb-3">
              <MessageCircleQuestion className="w-3.5 h-3.5" />
              Quiz Rápido
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Qual serviço é para mim?
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Responda 4 perguntas rápidas e descubra, em menos de um minuto, qual solução da
              Contabilidade 5.0 faz mais sentido para o seu momento.
            </p>
          </div>

          {/* Card interativo do quiz */}
          <div className="rounded-3xl bg-gradient-to-br from-[#07132B] via-[#0E2442] to-[#14345C] text-white p-6 sm:p-10 border border-[#D4AF37]/30 shadow-2xl relative overflow-hidden">
            <div
              className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none"
              aria-hidden="true"
            />

            <div className="relative">
              {/* Progresso */}
              <div className="flex items-center justify-between mb-5">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Pergunta {etapa + 1} de {totalPerguntas}
                </span>
                <button
                  type="button"
                  onClick={handleReiniciar}
                  data-testid="quiz-reiniciar"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Recomeçar
                </button>
              </div>

              {/* Barra de progresso */}
              <div className="h-1.5 w-full rounded-full bg-white/10 mb-8 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#2ECC71] transition-all duration-500"
                  style={{ width: `${((etapa + 1) / totalPerguntas) * 100}%` }}
                />
              </div>

              {/* Pergunta atual */}
              <h3
                key={perguntaAtual.id}
                className="font-heading font-bold text-lg sm:text-xl mb-6 text-white"
              >
                {perguntaAtual.pergunta}
              </h3>

              {/* Opções da pergunta atual */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {perguntaAtual.opcoes.map((opcao) => (
                  <button
                    key={opcao.valor}
                    type="button"
                    data-testid={`quiz-opcao-${perguntaAtual.id}-${opcao.valor}`}
                    onClick={() => handleEscolher(opcao.valor, opcao.servicoId)}
                    className="group text-left p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-[#2ECC71]/60 transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#2ECC71]/50 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="block text-sm font-semibold text-white leading-snug">
                          {opcao.rotulo}
                        </span>
                        {opcao.descricao && (
                          <span className="block text-xs text-slate-300 mt-1 leading-relaxed">
                            {opcao.descricao}
                          </span>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-[#2ECC71] group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Nota orientativa */}
              <p className="mt-6 text-[11px] text-slate-400 leading-relaxed flex items-start gap-1.5">
                <Sparkles className="w-3 h-3 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>
                  Indicação orientativa com base nas suas respostas — a recomendação final vem da
                  conversa com nosso especialista, sem compromisso.
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
