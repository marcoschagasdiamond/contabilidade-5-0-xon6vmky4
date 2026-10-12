import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardCheck,
  Clock,
  Sparkles,
  ArrowRight,
  FileText,
  Save,
  CheckCircle2,
  Building2,
  RotateCcw,
} from 'lucide-react'
import { PERGUNTAS_DIAGNOSTICO_40MIN } from '@/data/reformaTributariaData'
import { DadosEmpresaPerfil } from '@/types/dadosEmpresa'
import { Button } from '@/components/ui/button'

export interface Modulo7DiagnosticoReformaProps {
  // Modo de exibição: 'reforma' (página da Reforma Tributária) ou 'trilha' (página /diagnostico-transicao)
  modo?: 'reforma' | 'trilha'
  // Dados da Empresa para auto-preenchimento opcional
  dadosEmpresa?: DadosEmpresaPerfil
  temDadosSalvos?: boolean
  onRestaurarDados?: () => void
  // Callback opcional de salvamento no banco de dados (usado na trilha)
  onSalvarDiagnostico?: (payload: {
    totalScore: number
    farol: 'verde' | 'amarelo' | 'vermelho'
    farolTitulo: string
    servicoRecomendado: string
    respostas: Record<string, string>
  }) => Promise<void>
  salvando?: boolean
  salvoFeedback?: boolean
}

/**
 * Mapeia os Dados da Empresa (segmento, regime, perfil de clientes, exportação)
 * para as respostas padrão das perguntas do Bloco A do Módulo 7.
 */
export function mapearDadosEmpresaParaRespostasModulo7(
  dados?: Partial<DadosEmpresaPerfil>,
): Record<string, string> {
  if (!dados) return {}
  const inicial: Record<string, string> = {}

  // a1_atividade: baseada no segmento da empresa
  const seg = dados.segmento
  if (seg === 'Saúde' || seg === 'Educação') {
    inicial['a1_atividade'] = 'saude_educacao'
  } else if (seg === 'Agro') {
    inicial['a1_atividade'] = 'agro'
  } else if (seg === 'Comércio') {
    inicial['a1_atividade'] = 'comercio'
  } else if (seg === 'Indústria') {
    inicial['a1_atividade'] = 'industria'
  } else if (
    seg === 'Tecnologia' ||
    seg === 'Serviços' ||
    seg === 'Transporte' ||
    seg === 'Construção Civil'
  ) {
    inicial['a1_atividade'] = 'servicos_gerais'
  } else if (seg === 'Bares e Restaurantes') {
    inicial['a1_atividade'] = 'seletivo'
  }

  // a2_regime: baseado no regimeAtual da empresa e faturamento
  const reg = dados.regimeAtual
  const fatAnual = (dados.faturamentoMensal || 100000) * 12
  if (reg === 'Simples Nacional') {
    if (fatAnual > 2500000) {
      inicial['a2_regime'] = 'simples_alto'
    } else {
      inicial['a2_regime'] = 'simples_baixo'
    }
  } else if (reg === 'Lucro Presumido') {
    inicial['a2_regime'] = 'presumido'
  } else if (reg === 'Lucro Real') {
    inicial['a2_regime'] = 'real'
  }

  // a3_clientes: baseado na emissão de nota fiscal (B2B vs B2C)
  const emissao = dados.emissaoNf || ''
  if (emissao.includes('Consumidores Finais (B2C)')) {
    inicial['a3_clientes'] = 'pf'
  } else if (emissao.includes('Mista') || emissao.includes('50%')) {
    inicial['a3_clientes'] = 'misto'
  } else if (emissao.includes('Pessoas Jurídicas (B2B)')) {
    inicial['a3_clientes'] = 'pj_pesado'
  }

  // a4_exportacao: baseado no percentualExportacao
  const pctExp = dados.percentualExportacao || 0
  if (pctExp > 20) {
    inicial['a4_exportacao'] = 'muito'
  } else if (pctExp > 0) {
    inicial['a4_exportacao'] = 'pouco'
  } else {
    inicial['a4_exportacao'] = 'nao'
  }

  return inicial
}

export function ConteudoModulo7Diagnostico({
  modo = 'reforma',
  dadosEmpresa,
  temDadosSalvos,
  onRestaurarDados,
  onSalvarDiagnostico,
  salvando = false,
  salvoFeedback = false,
}: Modulo7DiagnosticoReformaProps) {
  // Inicialização inteligente com dados da empresa se disponíveis
  const respostasPreenchidas = useMemo(() => {
    return dadosEmpresa ? mapearDadosEmpresaParaRespostasModulo7(dadosEmpresa) : {}
  }, [dadosEmpresa])

  const [respostas, setRespostas] = useState<Record<string, string>>(respostasPreenchidas)
  const [laudoGerado, setLaudoGerado] = useState(false)

  // Quando os dados da empresa forem carregados inicialmente, se o usuário não alterou manualmente
  useEffect(() => {
    if (dadosEmpresa && Object.keys(respostasPreenchidas).length > 0) {
      setRespostas((prev) => {
        // Preserva o que já foi respondido e preenche as que estavam vazias
        const mesclado = { ...respostasPreenchidas, ...prev }
        return mesclado
      })
    }
  }, [respostasPreenchidas, dadosEmpresa])

  const handleSelect = (id: string, valor: string) => {
    setRespostas((prev) => ({
      ...prev,
      [id]: valor,
    }))
  }

  const todasRespondidas = PERGUNTAS_DIAGNOSTICO_40MIN.every((p) => respostas[p.id] !== undefined)

  // Cálculo da pontuação de risco
  let totalScore = 0
  PERGUNTAS_DIAGNOSTICO_40MIN.forEach((p) => {
    const val = respostas[p.id]
    if (val && p.opcoes) {
      const opt = p.opcoes.find((o) => o.valor === val)
      if (opt) {
        totalScore += opt.pontuacaoRisco
      }
    }
  })

  // Farol: Verde (<=8), Amarelo (9 a 16), Vermelho (>=17)
  let farol: 'verde' | 'amarelo' | 'vermelho' = 'verde'
  let farolTitulo = 'Risco Baixo — Transição Controlada'
  let farolDescricao =
    'Sua empresa possui estrutura operacional favorável e pouca exposição a perdas de créditos fiscais ou penalidades operacionais.'
  let servicoRecomendado = 'Acompanhamento e Gestão Tributária Contínua'

  if (totalScore >= 17) {
    farol = 'vermelho'
    farolTitulo = 'Risco Alto — Ação Imediata Necessária'
    farolDescricao =
      'Atenção máxima: há vulnerabilidades críticas em sistemas emissores, risco iminente de perda de clientes B2B por ausência de crédito financeiro ou estrangulamento de capital de giro pelo split payment.'
    servicoRecomendado = 'Projeto Completo de Adequação e Transição (Urgência)'
  } else if (totalScore >= 9) {
    farol = 'amarelo'
    farolTitulo = 'Risco Moderado — Pontos de Atenção Críticos'
    farolDescricao =
      'A empresa precisa realizar intervenções pontuais na homologação do ERP e na capacitação comercial para não sofrer atritos durante a transição.'
    servicoRecomendado = 'Diagnóstico Inicial com Workshop de Equipe'
  }

  // 3 prioridades dos próximos 90 dias
  const prioridades90Dias = [
    {
      num: 1,
      titulo: 'Homologação e Testes do ERP com tags IBS e CBS',
      descricao:
        'Contatar o suporte do seu emissor de notas fiscais para garantir que a versão 2026 com os campos específicos de IBS/CBS já esteja disponível no ambiente de teste.',
    },
    {
      num: 2,
      titulo: 'Auditoria de Compradores B2B e Política de Preços',
      descricao:
        'Listar os clientes que representam mais de 80% do faturamento e calcular se a permanência no Simples Tradicional gerará atrito comercial pela cota reduzida de crédito.',
    },
    {
      num: 3,
      titulo: 'Simulação de Fluxo de Caixa frente ao Split Payment',
      descricao:
        'Dimensionar o capital de giro para absorver a retenção automática nos recebíveis bancários e maquininhas de cartão a partir do início da vigência plena.',
    },
  ]

  const reiniciar = () => {
    if (modo === 'trilha' && dadosEmpresa) {
      setRespostas(mapearDadosEmpresaParaRespostasModulo7(dadosEmpresa))
    } else {
      setRespostas({})
    }
    setLaudoGerado(false)
    if (onRestaurarDados) {
      onRestaurarDados()
    }
  }

  const handleSalvar = async () => {
    if (onSalvarDiagnostico) {
      await onSalvarDiagnostico({
        totalScore,
        farol,
        farolTitulo,
        servicoRecomendado,
        respostas,
      })
    }
  }

  const perguntasBlocoA = PERGUNTAS_DIAGNOSTICO_40MIN.filter((p) => p.bloco === 'A')
  const perguntasBlocoB = PERGUNTAS_DIAGNOSTICO_40MIN.filter((p) => p.bloco === 'B')

  return (
    <div className="space-y-8">
      {/* SE FOR NA TRILHA: BADGE E PAINEL DOS DADOS DA EMPRESA */}
      {modo === 'trilha' && dadosEmpresa && (
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold bg-[#07132B] text-[#D4AF37] mb-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#2ECC71]" />
              <span>Alimentado pelos Dados da Empresa</span>
            </div>
            <h2 className="text-xl font-heading font-extrabold text-[#07132B]">
              {dadosEmpresa.nomeEmpresa || 'Empresa Cadastrada'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Segmento: <strong>{dadosEmpresa.segmento}</strong> • Regime:{' '}
              <strong>{dadosEmpresa.regimeAtual || 'Não informado'}</strong> • Clientes:{' '}
              <strong>{dadosEmpresa.emissaoNf || 'B2B'}</strong> • UF:{' '}
              <strong>{dadosEmpresa.ufOrigem || 'SP'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={reiniciar}
              className="text-xs text-slate-700 hover:text-slate-900 border-slate-300 gap-1.5 h-9"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
              Restaurar dados da empresa
            </Button>
          </div>
        </div>
      )}

      {/* APRESENTAÇÃO DO ROTEIRO */}
      <div className="bg-[#07132B] text-white p-6 sm:p-8 rounded-2xl border border-[#D4AF37]/30 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-2">
          <Clock className="w-4 h-4" />
          Metodologia Consultiva Diamond Group • Transição Fiscal da Reforma Tributária
        </div>
        <h2 className="text-xl sm:text-2xl font-heading font-black text-white">
          Como conduzir esta reunião de 40 minutos com o cliente
        </h2>
        <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed max-w-3xl">
          Divida o encontro em 2 etapas de 20 minutos. Primeiro avalie a estratégia de vendas e
          mercado (Bloco A); depois avalie os sistemas, insumos e fluxo financeiro (Bloco B). Ao
          final, emita o laudo com o farol de urgência.
        </p>
      </div>

      {/* FORMULÁRIO DOS DOIS BLOCOS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        {/* BLOCO A */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-6">
            <span className="w-8 h-8 rounded-xl bg-[#07132B] text-[#D4AF37] font-heading font-black text-sm flex items-center justify-center">
              A
            </span>
            <div>
              <h3 className="font-heading font-extrabold text-lg text-[#07132B]">
                Bloco A: Negócio, Regime & Vendas (20 min)
              </h3>
              <p className="text-xs text-slate-500">
                Mapeia enquadramento, atividade, perfil dos compradores e operações com exterior.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {perguntasBlocoA.map((p, idx) => (
              <div key={p.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <h4 className="font-heading font-bold text-sm text-[#07132B] mb-1">
                  {idx + 1}. {p.titulo}
                </h4>
                <p className="text-xs text-slate-500 mb-3">{p.descricao}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {p.opcoes?.map((op) => {
                    const isSel = respostas[p.id] === op.valor
                    return (
                      <button
                        key={op.valor}
                        type="button"
                        onClick={() => handleSelect(p.id, op.valor)}
                        className={`p-2.5 rounded-xl text-left text-xs transition-all border ${
                          isSel
                            ? 'bg-[#07132B] text-white border-[#07132B] font-semibold'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {op.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BLOCO B */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-6">
            <span className="w-8 h-8 rounded-xl bg-[#07132B] text-[#D4AF37] font-heading font-black text-sm flex items-center justify-center">
              B
            </span>
            <div>
              <h3 className="font-heading font-extrabold text-lg text-[#07132B]">
                Bloco B: Operação, Sistema ERP & Caixa (20 min)
              </h3>
              <p className="text-xs text-slate-500">
                Mapeia fornecedores, insumos, conformidade do ERP e preparo para o split payment.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {perguntasBlocoB.map((p, idx) => (
              <div key={p.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <h4 className="font-heading font-bold text-sm text-[#07132B] mb-1">
                  {idx + 1}. {p.titulo}
                </h4>
                <p className="text-xs text-slate-500 mb-3">{p.descricao}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {p.opcoes?.map((op) => {
                    const isSel = respostas[p.id] === op.valor
                    return (
                      <button
                        key={op.valor}
                        type="button"
                        onClick={() => handleSelect(p.id, op.valor)}
                        className={`p-2.5 rounded-xl text-left text-xs transition-all border ${
                          isSel
                            ? 'bg-[#07132B] text-white border-[#07132B] font-semibold'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {op.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AÇÃO: EMITIR LAUDO */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-slate-500">
            {Object.keys(respostas).length} de {PERGUNTAS_DIAGNOSTICO_40MIN.length} itens
            respondidos
          </span>

          <div className="flex gap-2 w-full sm:w-auto">
            {Object.keys(respostas).length > 0 && (
              <button
                type="button"
                onClick={reiniciar}
                className="px-4 py-3 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Limpar
              </button>
            )}
            <button
              type="button"
              disabled={!todasRespondidas}
              onClick={() => setLaudoGerado(true)}
              className={`flex-1 sm:flex-none px-7 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                todasRespondidas
                  ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-[#07132B] shadow-lg hover:brightness-110 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 text-[#07132B]" />
              Gerar Laudo Executivo com Farol
            </button>
          </div>
        </div>

        {/* LAUDO EXECUTIVO COM FAROL */}
        {laudoGerado && (
          <div className="mt-10 p-6 sm:p-8 rounded-2xl bg-white border-2 border-[#07132B] shadow-2xl animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider text-[#D4AF37] bg-[#07132B] mb-2">
                  <FileText className="w-3.5 h-3.5" />
                  Laudo Técnico Emitido • Roteiro 40 Min
                </div>
                <h3 className="text-2xl font-heading font-black text-[#07132B]">
                  Diagnóstico de Transição Fiscal
                </h3>
                {dadosEmpresa?.nomeEmpresa && (
                  <p className="text-xs text-slate-500 mt-1">
                    Empresa: <strong className="text-slate-800">{dadosEmpresa.nomeEmpresa}</strong>{' '}
                    {dadosEmpresa.cnpj ? `(${dadosEmpresa.cnpj})` : ''} • Pontuação de risco:{' '}
                    <strong>{totalScore} pontos</strong>
                  </p>
                )}
              </div>

              {/* FAROL DE URGÊNCIA */}
              <div
                className={`px-4 py-2.5 rounded-xl border flex items-center gap-2.5 ${
                  farol === 'vermelho'
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : farol === 'amarelo'
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full animate-pulse ${
                    farol === 'vermelho'
                      ? 'bg-rose-600'
                      : farol === 'amarelo'
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                  }`}
                />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider block">
                    Farol de Urgência
                  </span>
                  <strong className="text-xs font-bold block">{farolTitulo}</strong>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed mb-8">{farolDescricao}</p>

            {/* 3 PRIORIDADES DOS PRÓXIMOS 90 DIAS */}
            <div className="mb-8">
              <h4 className="font-heading font-extrabold text-base text-[#07132B] mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                As 3 Prioridades Estratégicas para os Próximos 90 Dias:
              </h4>
              <div className="space-y-3">
                {prioridades90Dias.map((item) => (
                  <div
                    key={item.num}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#07132B] text-[#D4AF37] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {item.num}
                    </span>
                    <div>
                      <strong className="text-sm font-bold text-[#07132B] block">
                        {item.titulo}
                      </strong>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {item.descricao}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SERVIÇO RECOMENDADO */}
            <div className="p-5 rounded-xl bg-[#07132B] text-white border border-[#D4AF37]/30 mb-6">
              <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block mb-1">
                Solução Profissional Recomendada:
              </span>
              <h5 className="text-lg font-heading font-black text-white mb-2">
                {servicoRecomendado}
              </h5>
              <p className="text-xs text-slate-300 leading-relaxed">
                Para implementar estas prioridades com garantia jurídica e sem sobrecarregar sua
                equipe interna, a contratação deste escopo entrega conformidade total com a LC
                214/2025.
              </p>
            </div>

            {/* AÇÕES E BOTÕES DE CONTINUAÇÃO */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
              {modo === 'trilha' ? (
                <>
                  <div className="flex items-center gap-2">
                    {onSalvarDiagnostico && (
                      <Button
                        type="button"
                        onClick={handleSalvar}
                        disabled={salvando}
                        className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B] font-bold text-xs sm:text-sm h-11 px-5 rounded-xl"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {salvando ? 'Salvando...' : 'Salvar Diagnóstico na Conta'}
                      </Button>
                    )}
                  </div>

                  <Link
                    to="/diagnostico-regimes"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#07132B] hover:brightness-110 transition-colors"
                  >
                    Avançar para Etapa 3: Comparação de Regime
                    <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                  </Link>
                </>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Link
                    to="/diagnostico"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#F3E5AB] transition-colors"
                  >
                    Prosseguir para o Diagnóstico Tributário com dados fiscais
                    <ArrowRight className="w-4 h-4 text-[#07132B]" />
                  </Link>
                </div>
              )}
            </div>

            {salvoFeedback && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Diagnóstico de Transição Fiscal salvo com sucesso na sua conta!</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
