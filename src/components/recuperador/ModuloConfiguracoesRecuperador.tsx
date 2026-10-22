import React from 'react'
import type { ConfiguracoesRecuperador } from '@/types/recuperadorCreditos'
import { formatarMoeda, parseInputMoeda } from '@/lib/calculadoraUtils'

interface Props {
  configuracoes: ConfiguracoesRecuperador
  onChange: (novasConfigs: ConfiguracoesRecuperador) => void
}

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

  const faturamentoTotal60Meses = configuracoes.anosFaturamento.reduce(
    (acc, curr) => acc + (curr.faturamento || 0),
    0,
  )

  return (
    <div className="space-y-6">
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
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/30">
            Regime Atual: {configuracoes.regimeAtual}
          </span>
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
            <label className="block font-bold text-slate-700 mb-1">Segmento Econômico</label>
            <input
              type="text"
              value={configuracoes.segmento}
              onChange={(e) => onChange({ ...configuracoes, segmento: e.target.value })}
              placeholder="Ex: Indústria Metalúrgica"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">UF de Domicílio</label>
            <input
              type="text"
              value={configuracoes.uf}
              onChange={(e) => onChange({ ...configuracoes, uf: e.target.value.toUpperCase() })}
              maxLength={2}
              placeholder="SP"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
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
              Valores anuais que compõem a base tributável para teses de PIS e COFINS com correção
              SELIC.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 uppercase font-bold block">
              Faturamento Acumulado (5 Anos)
            </span>
            <span className="text-sm font-bold text-[#07132B] font-mono">
              {formatarMoeda(faturamentoTotal60Meses)}
            </span>
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
