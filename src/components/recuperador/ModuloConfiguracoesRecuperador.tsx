import React from 'react'
import type { ConfiguracoesRecuperador } from '@/types/recuperadorCreditos'
import { formatarMoeda, parseInputMoeda } from '@/lib/calculadoraUtils'
import { LISTA_UFS_ICMS } from '@/types/calculadoraIbsCbs'
import { useAuth } from '@/context/AuthContext'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import { BannerIdentificacaoEmpresaBloqueada } from '@/components/dadosEmpresa/BannerIdentificacaoEmpresaBloqueada'
import { BotaoRetornarDadosIniciais } from '@/components/common/BotaoRetornarDadosIniciais'
import { CampoNcmAutocomplete } from '@/components/diagnosticos/CampoNcmAutocomplete'
import { buscarNcmPorCodigo, formatarCodigoNcm, type ItemNcmCurado } from '@/data/tabelaNcmLc214'
import { sugerirTesesPorItemNcm, type SugestaoNcmRecuperador } from '@/lib/ncmRecuperadorCreditos'

interface Props {
  configuracoes: ConfiguracoesRecuperador
  onChange: (novasConfigs: ConfiguracoesRecuperador) => void
  onNcmSugerido?: (sugestao: SugestaoNcmRecuperador) => void
  onAbrirImportacaoPlanilha?: () => void
  temDivergenciaMestre?: boolean
  onRestaurarDadosMestres?: () => void
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

export default function ModuloConfiguracoesRecuperador({
  configuracoes,
  onChange,
  onNcmSugerido,
  onAbrirImportacaoPlanilha,
  temDivergenciaMestre,
  onRestaurarDadosMestres,
}: Props) {
  const { isEmpresario } = useAuth()
  const { dadosEmpresa } = useDadosEmpresa()

  const itemNcmCurado = React.useMemo(() => {
    return configuracoes.ncm ? buscarNcmPorCodigo(configuracoes.ncm) : null
  }, [configuracoes.ncm])

  const handleNcmSelecionado = (item: ItemNcmCurado) => {
    const sug = sugerirTesesPorItemNcm(item)
    onChange({
      ...configuracoes,
      ncm: item.codigo,
      ncmDescricao: item.descricao,
      ncmCategoriaRotulo: item.categoriaRotulo,
      ncmOrigemSugerida: true,
    })
    if (onNcmSugerido) {
      onNcmSugerido(sug)
    }
  }

  const handleChangeNcm = (codigo: string) => {
    if (!codigo) {
      onChange({
        ...configuracoes,
        ncm: '',
        ncmDescricao: '',
        ncmCategoriaRotulo: '',
        ncmOrigemSugerida: false,
      })
      return
    }

    const item = buscarNcmPorCodigo(codigo)
    if (item) {
      const sug = sugerirTesesPorItemNcm(item)
      onChange({
        ...configuracoes,
        ncm: item.codigo,
        ncmDescricao: item.descricao,
        ncmCategoriaRotulo: item.categoriaRotulo,
        ncmOrigemSugerida: true,
      })
      if (onNcmSugerido) {
        onNcmSugerido(sug)
      }
    } else {
      onChange({
        ...configuracoes,
        ncm: codigo,
        ncmDescricao: '',
        ncmCategoriaRotulo: '',
        ncmOrigemSugerida: false,
      })
    }
  }

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
      {/* BOTÃO / AVISO DE RETORNO AOS DADOS INICIAIS QUANDO HOUVER ALTERAÇÃO MANUAL */}
      {temDivergenciaMestre && onRestaurarDadosMestres && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="font-medium text-slate-700">
              Dados alterados manualmente apenas neste módulo. Deseja restaurar os dados originais
              do cadastro do cliente?
            </span>
          </div>
          <BotaoRetornarDadosIniciais
            onClick={onRestaurarDadosMestres}
            rotulo="Retornar aos dados iniciais"
            className="h-8 text-xs font-semibold bg-white text-slate-800 border-amber-300 hover:bg-amber-50 shadow-xs"
          />
        </div>
      )}

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

      {/* BANNER DE TRAVA IDENTIFICAÇÃO CADASTRAL PARA EMPRESÁRIO COM BOTÃO CORRIGIR DADOS */}
      <BannerIdentificacaoEmpresaBloqueada
        origemModulo="recuperador"
        dadosAtuais={{
          nomeEmpresa: configuracoes.empresa,
          cnpj: configuracoes.cnpj,
          uf: configuracoes.uf,
        }}
        onDadosAtualizados={(dadosNovos) => {
          onChange({
            ...configuracoes,
            empresa: dadosNovos.nomeEmpresa || configuracoes.empresa,
            cnpj: dadosNovos.cnpj || configuracoes.cnpj,
            uf: dadosNovos.ufOrigem || configuracoes.uf,
            segmento: dadosNovos.segmento || configuracoes.segmento,
            regimeAtual:
              dadosNovos.regimeAtual === 'Lucro Real' ||
              dadosNovos.regimeAtual === 'Lucro Presumido' ||
              dadosNovos.regimeAtual === 'Simples Nacional'
                ? dadosNovos.regimeAtual
                : configuracoes.regimeAtual,
          })
        }}
      />

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

        {/* SEÇÃO NCM DO PRODUTO / INSUMO PRINCIPAL COM AUTOCOMPLETE DA LC 214/2025 */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-[#07132B] uppercase tracking-wide block">
                Classificação NCM do Produto / Insumo (LC 214/2025)
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Informe o NCM para sugerir automaticamente as teses aplicáveis (monofásicos, insumos
                agropecuários, cesta básica e reduções 60%/30%). A seleção manual permanece possível
                com override irrestrito.
              </p>
            </div>
            {onAbrirImportacaoPlanilha && (
              <button
                type="button"
                onClick={onAbrirImportacaoPlanilha}
                className="px-3 py-1.5 rounded-lg bg-[#07132B] text-white border border-[#D4AF37]/50 text-xs font-bold hover:bg-[#0c224c] transition-colors shrink-0 shadow-sm"
              >
                Importar Planilha com NCM
              </button>
            )}
          </div>

          <CampoNcmAutocomplete
            ncmValor={configuracoes.ncm || ''}
            onChangeNcm={handleChangeNcm}
            onNcmSelecionado={handleNcmSelecionado}
            itemNcmAtual={itemNcmCurado}
          />

          {configuracoes.ncm && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-700">
                  NCM Atual: <strong>{formatarCodigoNcm(configuracoes.ncm)}</strong>
                </span>
                {configuracoes.ncmOrigemSugerida ? (
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-[#07132B] text-[#D4AF37]">
                    Sugerido via NCM
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 text-slate-700 font-semibold">
                    Manual (Fora da Base Curada)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...configuracoes,
                    ncm: '',
                    ncmDescricao: '',
                    ncmCategoriaRotulo: '',
                    ncmOrigemSugerida: false,
                  })
                }
                className="text-[11px] text-slate-400 hover:text-rose-600 underline font-semibold transition-colors"
              >
                Remover NCM (Manter Manual)
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-5 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">Empresa / Razão Social</label>
              {isEmpresario && (
                <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                  Somente Leitura
                </span>
              )}
            </div>
            <input
              type="text"
              value={configuracoes.empresa}
              onChange={(e) => onChange({ ...configuracoes, empresa: e.target.value })}
              placeholder="Ex: Indústria Aliança S.A."
              disabled={isEmpresario}
              readOnly={isEmpresario}
              className={`w-full px-3 py-2 rounded-xl border border-slate-200 font-medium ${
                isEmpresario
                  ? 'bg-slate-100/90 text-slate-700 cursor-not-allowed select-none'
                  : 'bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]'
              }`}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">CNPJ</label>
              {isEmpresario && (
                <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                  Somente Leitura
                </span>
              )}
            </div>
            <input
              type="text"
              value={configuracoes.cnpj}
              onChange={(e) => onChange({ ...configuracoes, cnpj: e.target.value })}
              placeholder="00.000.000/0001-00"
              disabled={isEmpresario}
              readOnly={isEmpresario}
              className={`w-full px-3 py-2 rounded-xl border border-slate-200 font-medium font-mono ${
                isEmpresario
                  ? 'bg-slate-100/90 text-slate-700 cursor-not-allowed select-none'
                  : 'bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]'
              }`}
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
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">UF de Domicílio</label>
              {isEmpresario && (
                <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                  Somente Leitura
                </span>
              )}
            </div>
            <select
              value={configuracoes.uf}
              onChange={(e) => onChange({ ...configuracoes, uf: e.target.value })}
              disabled={isEmpresario}
              className={`w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold ${
                isEmpresario
                  ? 'bg-slate-100/90 text-slate-700 cursor-not-allowed select-none'
                  : 'bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]'
              }`}
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

      {/* CARD 4: PARÂMETROS FISCAIS & INSUMOS (FASE 1 - PROPAGADOS DA FONTE MESTRA) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
              <h3 className="text-sm font-bold text-[#07132B] uppercase tracking-wide">
                Módulo 4 • Parâmetros Fiscais & Insumos (Fase 1 • Fonte Mestra)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Dados propagados de Dados da Empresa (/dados-empresa). Você pode ajustar localmente
              com override ou restaurar aos valores mestres a qualquer momento.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold bg-[#07132B] text-[#D4AF37] px-2.5 py-1 rounded-full">
            CONTEXTO C5.0
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {/* Perfil de Insumos */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
            <span className="text-xs font-bold text-[#07132B] block">1. Perfil de Insumos (%)</span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Cheia</span>
                <strong className="text-slate-800 font-mono">
                  {configuracoes.perfilInsumosAliquotaCheia ?? 70}%
                </strong>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Monofásico</span>
                <strong className="text-[#D4AF37] font-mono">
                  {configuracoes.perfilInsumosMonofasicos ?? 20}%
                </strong>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Reduzida</span>
                <strong className="text-slate-800 font-mono">
                  {configuracoes.perfilInsumosAliquotaReduzida ?? 10}%
                </strong>
              </div>
            </div>
          </div>

          {/* Monofásicos & Categorias */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5">
            <span className="text-xs font-bold text-[#07132B] block">
              2. Presença de Monofásicos
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  configuracoes.presencaMonofasicos
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {configuracoes.presencaMonofasicos ? 'Sim (Detectado)' : 'Não indicado'}
              </span>
            </div>
            {configuracoes.presencaMonofasicos && (
              <span className="text-[11px] text-slate-600 block truncate">
                Categorias:{' '}
                <strong>
                  {(configuracoes.categoriasMonofasicos || []).join(', ') || 'Não especificadas'}
                </strong>
              </span>
            )}
          </div>

          {/* Insumos Energéticos */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5">
            <span className="text-xs font-bold text-[#07132B] block">3. Insumos Energéticos</span>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  configuracoes.insumosEnergeticos
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {configuracoes.insumosEnergeticos ? 'Sim (Uso intensivo)' : 'Não indicado'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block">
              Energia contratada / vapor para indústria
            </span>
          </div>

          {/* Intangíveis & Royalties */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5">
            <span className="text-xs font-bold text-[#07132B] block">
              4. Intangíveis & Royalties
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  configuracoes.intangiveisRoyalties
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {configuracoes.intangiveisRoyalties ? 'Sim (Software/marcas)' : 'Não indicado'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block">
              Software, licenças e remessas de marcas
            </span>
          </div>

          {/* Imobilizado 5 Anos */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5 col-span-1 md:col-span-2">
            <span className="text-xs font-bold text-[#07132B] block">
              5. Investimento em Ativo Imobilizado (Últimos 5 Anos)
            </span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold font-mono text-[#07132B]">
                {formatarMoeda(configuracoes.imobilizadoUltimos5Anos || 0)}
              </span>
              <span className="text-xs text-slate-500">
                (Base para créditos de PIS/COFINS e CIAP/ICMS)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 5: PARÂMETROS FISCAIS AVANÇADOS (FASE 2 • FONTE MESTRA • MERAMENTE INFORMATIVO) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
              <h3 className="text-sm font-bold text-[#07132B] uppercase tracking-wide">
                Módulo 5 • Parâmetros Fiscais Avançados (Fase 2 • Fonte Mestra)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Parâmetros refinados propagados de Dados da Empresa (/dados-empresa). Exibição
              estritamente indicativa de contexto; a apuração e seleção de teses do Recuperador
              permanecem 100% manuais.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold bg-[#07132B] text-[#D4AF37] px-2.5 py-1 rounded-full">
            CONTEXTO C5.0 • INFORMATIVO
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {/* 1. Compras Sem Direito a Crédito */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5">
            <span className="text-xs font-bold text-[#07132B] block">
              1. Compras sem Direito a Crédito
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold text-slate-800">
                {configuracoes.percentualComprasSemCredito ?? 0}%
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block">
              Uso e consumo, não tributadas ou isentas
            </span>
          </div>

          {/* 2. Saldo Credor Acumulado */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5">
            <span className="text-xs font-bold text-[#07132B] block">
              2. Saldo Credor Acumulado / Estoque
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold text-[#07132B]">
                {formatarMoeda(configuracoes.saldoCredorAcumulado ?? 0)}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block">
              Estoque inicial de créditos escriturais passíveis de compensação
            </span>
          </div>

          {/* 3. Vendas Interestaduais */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5">
            <span className="text-xs font-bold text-[#07132B] block">3. Vendas Interestaduais</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold text-slate-800">
                {configuracoes.percentualVendasInterestaduais ?? 0}%
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block">
              Operações sujeitas a alíquotas interestaduais e partilha DIFAL
            </span>
          </div>

          {/* 4. Regime Especial Atual */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5">
            <span className="text-xs font-bold text-[#07132B] block">4. Regime Especial Atual</span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#07132B] text-[#D4AF37]">
                {configuracoes.regimeEspecialAtual === 'monofasico'
                  ? 'Monofásico (PIS/COFINS)'
                  : configuracoes.regimeEspecialAtual === 'substituicao_tributaria'
                    ? 'Substituição Tributária (ICMS-ST)'
                    : configuracoes.regimeEspecialAtual === 'zona_franca_manaus'
                      ? 'Zona Franca de Manaus (ZFM/ALC)'
                      : configuracoes.regimeEspecialAtual === 'ret_permuta'
                        ? 'RET / Permuta Imobiliária'
                        : 'Nenhum / Padrão'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block">
              Regime setorial específico cadastrado
            </span>
          </div>

          {/* 5. Perfil de Retenção Split Payment */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5 col-span-1 md:col-span-2">
            <span className="text-xs font-bold text-[#07132B] block">
              5. Perfil de Retenção / Split Payment
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-800">
                {configuracoes.perfilRetencaoSplit === 'sim_todos'
                  ? 'Sim, todos (Retenção integral)'
                  : configuracoes.perfilRetencaoSplit === 'parcial'
                    ? `Parcial (${configuracoes.percentualRetencaoSplit ?? 0}%)`
                    : 'Não retêm (Recolhimento padrão pós-faturamento)'}
              </span>
              {configuracoes.perfilRetencaoSplit === 'parcial' && (
                <span className="text-xs text-slate-600 font-mono font-bold">
                  Retenção estimada: {configuracoes.percentualRetencaoSplit ?? 0}%
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 block">
              Comportamento dos clientes na liquidação das notas fiscais
            </span>
          </div>
        </div>

        {/* PARÂMETROS FASE 3 (SITUAÇÃO FISCAL & OPERAÇÃO MULTI-UF • INFORMATIVO) */}
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#07132B]">
                Situação Fiscal & Operação Multi-UF (Fase 3 • Informativo)
              </span>
            </div>
            <span className="text-[10px] font-mono font-semibold text-slate-500">
              Não altera cálculos ou teses de recuperação
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                Autos de Infração
              </span>
              <strong
                className={
                  dadosEmpresa.autosInfracaoAtivos
                    ? 'text-rose-700 text-[11px]'
                    : 'text-slate-800 text-[11px]'
                }
              >
                {dadosEmpresa.autosInfracaoAtivos
                  ? `Sim (${dadosEmpresa.autosInfracaoQuantidade || 0} auto(s))`
                  : 'Nenhum'}
              </strong>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                Parcelamentos
              </span>
              <strong className="text-slate-800 text-[11px]">
                {dadosEmpresa.parcelamentosEmCurso
                  ? `Sim (${dadosEmpresa.parcelamentosQuantidade || 1})`
                  : 'Nenhum'}
              </strong>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                Dívida Ativa
              </span>
              <strong
                className={
                  dadosEmpresa.dividaAtivaExecucaoFiscal
                    ? 'text-rose-700 text-[11px]'
                    : 'text-slate-800 text-[11px]'
                }
              >
                {dadosEmpresa.dividaAtivaExecucaoFiscal ? 'Ativa / Execução' : 'Regular'}
              </strong>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                Obrigações Acessórias
              </span>
              <strong
                className={
                  dadosEmpresa.obrigacoesAcessoriasAtraso
                    ? 'text-amber-700 text-[11px]'
                    : 'text-slate-800 text-[11px]'
                }
              >
                {dadosEmpresa.obrigacoesAcessoriasAtraso ? 'Pendentes' : 'Em dia'}
              </strong>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                Estabelecimentos
              </span>
              <strong className="text-slate-800 font-mono text-[11px]">
                {(dadosEmpresa.numeroFiliais ?? 1) > 1
                  ? `${dadosEmpresa.numeroFiliais} unidades`
                  : '1 (Matriz)'}
              </strong>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                UFs Operação
              </span>
              <strong
                className="text-slate-800 font-mono text-[11px] truncate block"
                title={dadosEmpresa.ufsOperacao?.join(', ') || dadosEmpresa.ufOrigem}
              >
                {dadosEmpresa.ufsOperacao && dadosEmpresa.ufsOperacao.length > 0
                  ? `${dadosEmpresa.ufOrigem || 'UF'} + ${dadosEmpresa.ufsOperacao.length} UF(s)`
                  : `${dadosEmpresa.ufOrigem || 'UF'} (Única)`}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
