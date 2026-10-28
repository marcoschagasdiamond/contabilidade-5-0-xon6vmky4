import React from 'react'
import type { ConfiguracoesRecuperador } from '@/types/recuperadorCreditos'
import { formatarMoeda, parseInputMoeda } from '@/lib/calculadoraUtils'
import { LISTA_UFS_ICMS } from '@/types/calculadoraIbsCbs'

interface Props {
  configuracoes: ConfiguracoesRecuperador
  onChange: (novasConfigs: ConfiguracoesRecuperador) => void
}

export const OPCOES_SEGMENTO_RECUPERADOR = [
  {
    id: 'Comércio',
    desc: 'Varejo e atacado de mercadorias (Anexo I / ICMS)',
  },
  {
    id: 'Serviços',
    desc: 'Prestação de serviços e consultoria (ISS / Fator R)',
  },
  {
    id: 'Indústria',
    desc: 'Fabricação e transformação fabril (Anexo II / ICMS)',
  },
  {
    id: 'Saúde',
    desc: 'Clínicas, consultórios e laboratórios (ISS)',
  },
  {
    id: 'Educação',
    desc: 'Escolas, faculdades e cursos livres (ISS)',
  },
  {
    id: 'Agro',
    desc: 'Produção rural e agronegócio (Base 8%)',
  },
  {
    id: 'Transporte',
    desc: 'Cargas e passageiros (Presunção 16% IRPJ)',
  },
  {
    id: 'Tecnologia',
    desc: 'Software, SaaS e TI (ISS / Fator R)',
  },
  {
    id: 'Construção Civil',
    desc: 'Obras, reformas e engenharia civil (ISS)',
  },
  {
    id: 'Bares e Restaurantes',
    desc: 'Alimentação e bebidas (Presunção 8% / ICMS)',
  },
] as const

export default function ModuloConfiguracoesRecuperador({ configuracoes, onChange }: Props) {
  const handleChangeAnoFaturamento = (index: number, valor: number) => {
    const novosAnos = [...configuracoes.anosFaturamento]
    novosAnos[index] = {
      ...novosAnos[index],
      faturamento: valor,
    }
    onChange({
      ...configuracoes,
      anosFaturamento: novosAnos,
    })
  }

  // Permite atualizar o Faturamento Mensal de Referência e automaticamente recalcular a projeção dos 60 meses
  const handleAtualizarFaturamentoMensal = (novoFatMensal: number) => {
    const fatAnual = novoFatMensal > 0 ? novoFatMensal * 12 : 0
    const novosAnos = configuracoes.anosFaturamento.map((item) => ({
      ...item,
      faturamento: fatAnual,
    }))
    onChange({
      ...configuracoes,
      faturamentoMensal: novoFatMensal,
      anosFaturamento: novosAnos,
    })
  }

  const faturamentoTotal60Meses = configuracoes.anosFaturamento.reduce(
    (acc, curr) => acc + (curr.faturamento || 0),
    0,
  )

  return (
    <div className="space-y-6">
      {/* BANNER DISCRETO DE PRÉ-PREENCHIMENTO (PADRÃO DIAMOND GROUP NAVY #07132B + DOURADO #D4AF37, SEM ÍCONES) */}
      {configuracoes.avisoOrigem && (
        <div className="p-3.5 rounded-2xl bg-[#07132B] text-white border border-[#D4AF37]/40 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] shrink-0" />
            <span className="font-semibold text-slate-100">{configuracoes.avisoOrigem}</span>
          </div>
          <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wide bg-[#D4AF37]/10 px-2.5 py-1 rounded-lg border border-[#D4AF37]/20">
            Campos editáveis pelo usuário
          </span>
        </div>
      )}

      {/* CARD 1: PERFIL DO CLIENTE & REGIME ATUAL */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-[#07132B] uppercase tracking-wide">
              Módulo 1 • Dados Comuns & Parâmetros da Empresa
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Defina o regime tributário, localização e bases financeiras para a apuração dos 60
              meses.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/30">
              Regime Atual: {configuracoes.regimeAtual}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Empresa / Razão Social</label>
            <input
              type="text"
              value={configuracoes.empresa}
              onChange={(e) => onChange({ ...configuracoes, empresa: e.target.value })}
              placeholder="Ex: Indústria Aliança S.A."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">CNPJ</label>
            <input
              type="text"
              value={configuracoes.cnpj}
              onChange={(e) => onChange({ ...configuracoes, cnpj: e.target.value })}
              placeholder="00.000.000/0001-00"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Regime Atual da Empresa</label>
            <select
              value={configuracoes.regimeAtual}
              onChange={(e) =>
                onChange({
                  ...configuracoes,
                  regimeAtual: e.target.value as
                    | 'Lucro Real'
                    | 'Lucro Presumido'
                    | 'Simples Nacional',
                  aliquotaPisCofinsPadrao: e.target.value === 'Lucro Real' ? 9.25 : 3.65,
                })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            >
              <option value="Lucro Real">Lucro Real (Não-Cumulativo • PIS/COFINS 9,25%)</option>
              <option value="Lucro Presumido">
                Lucro Presumido (Cumulativo • PIS/COFINS 3,65%)
              </option>
              <option value="Simples Nacional">Simples Nacional (Regime Simplificado)</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">Segmento Econômico</label>
              {configuracoes.segmento && (
                <span className="text-[10px] text-slate-400 font-medium">10 opções</span>
              )}
            </div>
            <select
              value={configuracoes.segmento}
              onChange={(e) => onChange({ ...configuracoes, segmento: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            >
              {configuracoes.segmento &&
                !OPCOES_SEGMENTO_RECUPERADOR.some((opt) => opt.id === configuracoes.segmento) && (
                  <option value={configuracoes.segmento}>
                    {configuracoes.segmento} (Personalizado)
                  </option>
                )}
              {OPCOES_SEGMENTO_RECUPERADOR.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id} — {item.desc}
                </option>
              ))}
            </select>
            {(() => {
              const optSelecionada = OPCOES_SEGMENTO_RECUPERADOR.find(
                (opt) => opt.id === configuracoes.segmento,
              )
              return optSelecionada ? (
                <span className="text-[10px] text-slate-500 mt-1 block leading-snug">
                  {optSelecionada.desc}
                </span>
              ) : null
            })()}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">UF de Domicílio</label>
            <select
              value={configuracoes.uf}
              onChange={(e) => onChange({ ...configuracoes, uf: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            >
              {configuracoes.uf &&
                !LISTA_UFS_ICMS.some(
                  (u) => u.uf.toUpperCase() === configuracoes.uf.toUpperCase(),
                ) && <option value={configuracoes.uf}>{configuracoes.uf} (Personalizado)</option>}
              {LISTA_UFS_ICMS.map((item) => (
                <option key={item.uf} value={item.uf}>
                  {item.uf} — {item.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Alíquota Patronal Composta Estimada (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={configuracoes.aliquotaPatronalComposta}
              onChange={(e) =>
                onChange({
                  ...configuracoes,
                  aliquotaPatronalComposta: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Padrão ~26,8% (20% INSS + 5,8% Terceiros/Sistema S + 1% RAT)
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              % Compras sobre Vendas (Insumos)
            </label>
            <input
              type="number"
              step="1"
              min={0}
              max={100}
              value={configuracoes.percentualComprasVendas ?? 0}
              onChange={(e) =>
                onChange({
                  ...configuracoes,
                  percentualComprasVendas: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Utilizado na correlação de créditos de insumos PIS/COFINS e IBS/CBS.
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Faturamento Mensal de Referência
            </label>
            <input
              type="text"
              value={formatarMoeda(configuracoes.faturamentoMensal ?? 0)}
              onChange={(e) => handleAtualizarFaturamentoMensal(parseInputMoeda(e.target.value))}
              placeholder="R$ 0,00"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Propaga automaticamente para os anos (Faturamento Anual = Mensal × 12).
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Ano da Transição (Calculadora)
            </label>
            <input
              type="text"
              value={configuracoes.anoTransicao ? String(configuracoes.anoTransicao) : '2033'}
              onChange={(e) =>
                onChange({
                  ...configuracoes,
                  anoTransicao: e.target.value,
                })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Mapeado da transição tributária EC 132/2023.
            </span>
          </div>
        </div>
      </div>

      {/* CARD 2: FATURAMENTO ANO A ANO (ÚLTIMOS 60 MESES) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-[#07132B] uppercase tracking-wide">
              Faturamento Declarado por Ano (60 Meses)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Valores anuais derivados dos dados informados (Faturamento Mensal × 12). Você pode
              editar cada ano individualmente. Sem dados anteriores, inicia zerado.
            </p>
          </div>
          <div className="text-right flex items-center gap-4">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-bold block">
                Faturamento Acumulado (5 Anos)
              </span>
              <span className="text-sm font-bold text-[#07132B] font-mono">
                {formatarMoeda(faturamentoTotal60Meses)}
              </span>
            </div>
            {faturamentoTotal60Meses > 0 && (
              <button
                type="button"
                onClick={() => {
                  const zerados = configuracoes.anosFaturamento.map((item) => ({
                    ...item,
                    faturamento: 0,
                  }))
                  onChange({
                    ...configuracoes,
                    faturamentoMensal: 0,
                    anosFaturamento: zerados,
                  })
                }}
                className="text-[11px] text-slate-400 hover:text-rose-600 underline font-semibold transition-colors"
              >
                Zerar Anos
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-5">
          {configuracoes.anosFaturamento.map((item, index) => (
            <div key={item.ano} className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[#07132B]">Ano {item.ano}</span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                  SELIC +{((item.fatorSelicAcumulado - 1) * 100).toFixed(1)}%
                </span>
              </div>
              <label className="text-[10px] text-slate-500 block mb-1">Receita Bruta Anual</label>
              <input
                type="text"
                value={formatarMoeda(item.faturamento)}
                onChange={(e) => handleChangeAnoFaturamento(index, parseInputMoeda(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* CARD 3: MASSA SALARIAL & DADOS DE FOLHA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="pb-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-[#07132B] uppercase tracking-wide">
            Parâmetros de Folha de Pagamento & Rotatividade
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Dados necessários para quantificar verbas rescisórias, coparticipação em saúde,
            salário-maternidade e RAT/FAP.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <label className="block font-bold text-slate-700 mb-1">
              Massa Salarial Mensal (Folha)
            </label>
            <input
              type="text"
              value={formatarMoeda(configuracoes.massaSalarialMensal)}
              onChange={(e) =>
                onChange({
                  ...configuracoes,
                  massaSalarialMensal: parseInputMoeda(e.target.value),
                })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Folha Anual Estimada (13,33 meses):{' '}
              <strong className="text-slate-600 font-mono">
                {formatarMoeda(configuracoes.massaSalarialMensal * 13.33)}
              </strong>
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <label className="block font-bold text-slate-700 mb-1">
              Número Médio de Empregados
            </label>
            <input
              type="number"
              min={1}
              value={configuracoes.numeroMedioEmpregados}
              onChange={(e) =>
                onChange({
                  ...configuracoes,
                  numeroMedioEmpregados: parseInt(e.target.value) || 1,
                })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Ticket Médio Salarial:{' '}
              <strong className="text-slate-600 font-mono">
                {formatarMoeda(
                  configuracoes.massaSalarialMensal / (configuracoes.numeroMedioEmpregados || 1),
                )}
                /colaborador
              </strong>
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <label className="block font-bold text-slate-700 mb-1">
              % de Rotatividade Anual (Turnover)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={configuracoes.percentualRotatividadeAnual}
              onChange={(e) =>
                onChange({
                  ...configuracoes,
                  percentualRotatividadeAnual: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Impacta rescisões indenizatórias, aviso prévio e multa de 40% do FGTS.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
