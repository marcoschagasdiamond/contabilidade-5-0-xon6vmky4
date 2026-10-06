import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  GitCompare,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { DiamondHeader, DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import { PERGUNTAS_COMPARADOR, CENARIOS_COMUNS_COMPARADOR } from '@/data/reformaTributariaData'

export default function SubpageComparador() {
  const [respostas, setRespostas] = useState<Record<number, string>>({})
  const [mostrarResultado, setMostrarResultado] = useState(false)

  const handleSelectOption = (perguntaId: number, valor: string) => {
    setRespostas((prev) => ({
      ...prev,
      [perguntaId]: valor,
    }))
  }

  const todasRespondidas = PERGUNTAS_COMPARADOR.every((p) => respostas[p.id] !== undefined)

  // Cálculo da pontuação
  let scoreSimples = 0
  let scoreHibrido = 0
  let scoreNormal = 0

  PERGUNTAS_COMPARADOR.forEach((p) => {
    const resp = respostas[p.id]
    if (resp) {
      const opcao = p.opcoes.find((o) => o.valor === resp)
      if (opcao) {
        scoreSimples += opcao.peso.simples
        scoreHibrido += opcao.peso.hibrido
        scoreNormal += opcao.peso.normal
      }
    }
  })

  let regimeVencedor = 'Simples Tradicional'
  let justificativa = ''
  let tagColor = 'emerald'

  if (scoreHibrido > scoreSimples && scoreHibrido >= scoreNormal) {
    regimeVencedor = 'Simples Híbrido (IBS e CBS por fora)'
    justificativa =
      'Como sua empresa atende compradores PJ que exigem crédito fiscal e perder vendas doeria no seu caixa, o Simples Híbrido protege sua carteira de clientes transferindo crédito integral de ~26,5%, enquanto mantém sua folha e IRPJ/CSLL protegidos na guia única do DAS.'
    tagColor = 'amber'
  } else if (scoreNormal > scoreSimples && scoreNormal > scoreHibrido) {
    regimeVencedor = 'Regime Normal (Lucro Real ou Lucro Presumido)'
    justificativa =
      'Seu volume de insumos/compras é muito expressivo ou seu faturamento se aproxima do sublimite de R$ 3,6M. No Regime Normal, os créditos gerados em cadeia podem resultar em tributação efetiva mais baixa do que as faixas altas do Simples.'
    tagColor = 'blue'
  } else {
    regimeVencedor = 'Simples Nacional Tradicional'
    justificativa =
      'Seu perfil de faturamento é predominantemente voltado a consumidores finais (B2C) ou compradores que não dependem de crédito financeiro. Manter-se no Simples Tradicional garante menor carga nominal e máxima simplificação contábil.'
    tagColor = 'emerald'
  }

  const reiniciar = () => {
    setRespostas({})
    setMostrarResultado(false)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <DiamondHeader
        badge="MÓDULO 6 • DECISÃO DE REGIME"
        titulo="Comparador de Regime Tributário"
        subtitulo="Simples Tradicional, Simples Híbrido ou Regime Normal? Responda a 4 perguntas e conheça os 3 cenários mais comuns do mercado."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* PARTE 1: FLUXO DE DECISÃO EM 4 PERGUNTAS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/30 uppercase mb-1">
                <GitCompare className="w-3.5 h-3.5" />
                Fluxo de Decisão Interativo
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-[#07132B]">
                Qual o regime ideal para sua operação?
              </h2>
            </div>

            {Object.keys(respostas).length > 0 && (
              <button
                type="button"
                onClick={reiniciar}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reiniciar perguntas
              </button>
            )}
          </div>

          <div className="space-y-8">
            {PERGUNTAS_COMPARADOR.map((p, idx) => (
              <div key={p.id} className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-6 h-6 rounded-full bg-[#07132B] text-[#D4AF37] text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="font-heading font-bold text-sm sm:text-base text-[#07132B]">
                      {p.pergunta}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{p.explicacao}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 pl-0 sm:pl-9">
                  {p.opcoes.map((opcao) => {
                    const isSelected = respostas[p.id] === opcao.valor
                    return (
                      <button
                        key={opcao.valor}
                        type="button"
                        onClick={() => handleSelectOption(p.id, opcao.valor)}
                        className={`p-3 rounded-xl text-left text-xs sm:text-sm font-medium transition-all border ${
                          isSelected
                            ? 'bg-[#07132B] text-white border-[#07132B] shadow-md'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#07132B]" />
                            )}
                          </span>
                          <span>{opcao.texto}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* BOTÃO GERAR VEREDITO */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500">
              {Object.keys(respostas).length} de {PERGUNTAS_COMPARADOR.length} respondidas
            </span>

            <button
              type="button"
              disabled={!todasRespondidas}
              onClick={() => setMostrarResultado(true)}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                todasRespondidas
                  ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-[#07132B] shadow-lg hover:brightness-110 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#07132B]" />
              Ver Regime Recomendado
            </button>
          </div>

          {/* RESULTADO INTERATIVO */}
          {mostrarResultado && (
            <div className="mt-8 p-6 sm:p-8 rounded-2xl bg-[#07132B] text-white border-2 border-[#D4AF37] shadow-xl animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                Resultado da Simulação Preliminar
              </div>
              <h3 className="text-2xl sm:text-3xl font-heading font-black text-white mb-3">
                Regime sugerido: <span className="text-[#D4AF37]">{regimeVencedor}</span>
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed mb-6">{justificativa}</p>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 leading-relaxed mb-6">
                <strong className="text-white block mb-1">
                  Observação do Especialista Diamond:
                </strong>
                A opção pelo Simples Híbrido é anual e deve ser manifestada perante a Receita
                Federal até o último dia útil de setembro de cada ano, para vigorar no ano fiscal
                seguinte.
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/diagnostico"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#F3E5AB] transition-colors"
                >
                  Fazer diagnóstico numérico completo (com CNPJ)
                  <ArrowRight className="w-4 h-4 text-[#07132B]" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* PARTE 2: OS 3 CENÁRIOS MAIS COMUNS DO MERCADO */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-heading font-black text-[#07132B]">
              Os 3 Cenários Práticos Mais Comuns
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Veja como empresas com modelos de negócios reais estão se posicionando:
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {CENARIOS_COMUNS_COMPARADOR.map((cen) => (
              <div
                key={cen.titulo}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-[#D4AF37] transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Estudo de Caso
                  </span>
                  <h3 className="font-heading font-bold text-base text-[#07132B] mt-1 mb-3">
                    {cen.titulo}
                  </h3>

                  <div className="inline-block px-3 py-1 rounded-md text-xs font-extrabold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/30 mb-4">
                    {cen.regimeRecomendado}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{cen.descricao}</p>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed mb-4">
                    <strong className="text-slate-900 block mb-1">Por que esse regime?</strong>
                    {cen.motivo}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 text-[11px] text-[#07132B] font-semibold bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                  <strong className="text-amber-900 block mb-0.5">Dica de Ouro:</strong>
                  {cen.dicaOuro}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DiamondFooterCTA />
    </div>
  )
}
