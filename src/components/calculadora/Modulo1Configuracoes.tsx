import React from 'react'
import { useCalculadoraIbsCbs } from '@/context/CalculadoraIbsCbsContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sliders, RotateCcw, Info, CheckCircle2, ShieldCheck, Zap, HelpCircle } from 'lucide-react'
import { BadgeOrigemPropagada } from '@/components/calculadora/BadgeOrigemPropagada'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AnoTransicaoIbsCbs,
  PresetSetorIbsCbs,
  CRONOGRAMA_FASES_TRANSICAO,
  LISTA_ANOS_TRANSICAO,
  obterFaseTransicaoPorAno,
  isAnoPosTransicao,
  PRESETS_SETORES_LC214,
  RAMOS_PRINCIPAIS_ATIVOS,
  SUBATIVIDADES_AGRONEGOCIO,
  SUBATIVIDADES_COMERCIO,
  SUBATIVIDADES_CONSTRUCAO,
  SUBATIVIDADES_FOOD_SERVICE,
  SUBATIVIDADES_INDUSTRIA,
  SUBATIVIDADES_LOCACAO,
  SUBATIVIDADES_SERVICO,
  SubatividadeAgro,
  SubatividadeComercio,
  SubatividadeConstrucao,
  SubatividadeFoodService,
  SubatividadeIndustria,
  SubatividadeLocacao,
  SubatividadeServico,
  TipoAtividade,
} from '@/types/calculadoraIbsCbs'
import { Slider } from '@/components/ui/slider'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import { BannerIdentificacaoEmpresaBloqueada } from '@/components/dadosEmpresa/BannerIdentificacaoEmpresaBloqueada'
import { ModalCliente } from '@/components/clientes/ModalCliente'
import { Badge } from '@/components/ui/badge'
import {
  ModalImportarFaturamento,
  type DadosFaturamentoImportados,
} from '@/components/calculadora/ModalImportarFaturamento'
import { SecaoComposicaoItensNcm } from '@/components/calculadora/SecaoComposicaoItensNcm'

import {
  PainelProximosPassosCalculadora,
  ModuloCalculadoraId,
} from '@/components/calculadora/PainelProximosPassosCalculadora'

export interface Modulo1ConfiguracoesProps {
  onNavegarModulo?: (moduloId: ModuloCalculadoraId) => void
  /** Banner opcional (Notas Fiscais Reais) montado pela página pai. */
  avisoNotasFiscais?: React.ReactNode
}

export default function Modulo1Configuracoes({
  onNavegarModulo,
  avisoNotasFiscais,
}: Modulo1ConfiguracoesProps = {}) {
  const { config, updateConfig, resetConfig, aplicarAnoTransicao, aplicarPresetSetor } =
    useCalculadoraIbsCbs()
  const {
    clienteAtivo,
    clienteAtivoId,
    clientes,
    carregando: carregandoClientes,
    selecionarClienteAtivo,
    recarregarClientes,
  } = useClienteAtivo()
  const { dadosEmpresa } = useDadosEmpresa()
  const [modalNovoClienteAberto, setModalNovoClienteAberto] = React.useState(false)
  const [modalImportarFaturamentoAberto, setModalImportarFaturamentoAberto] = React.useState(false)

  const handleConfirmarImportacaoFaturamento = (dados: DadosFaturamentoImportados) => {
    // Preenche apenas a simulação atual, mantendo valores editáveis
    const atualizacoes: Partial<typeof config> = {
      faturamentoMensal: dados.faturamentoMensal,
    }

    if (dados.comprasMensal !== undefined && dados.faturamentoMensal > 0) {
      // Atualiza percentual de compras correspondente se fornecido
      const pctCalculado = Math.min(
        100,
        Math.round((dados.comprasMensal / dados.faturamentoMensal) * 100),
      )
      atualizacoes.percentualComprasVendas = pctCalculado
    }

    updateConfig(atualizacoes)
  }

  const handleInputChange = (field: keyof typeof config, value: string) => {
    const limpo = value.replace(',', '.')
    const parsed = parseFloat(limpo)
    if (!isNaN(parsed)) {
      updateConfig({ [field]: parsed })
    }
  }

  // Validação dos campos essenciais do Módulo 1:
  // - Faturamento mensal > 0
  // - Ano da transição definido
  // - Regime atual da empresa definido
  const temFaturamento = (config.faturamentoMensal ?? 0) > 0
  const temAnoTransicao = !!config.anoTransicao
  const temRegimeAtual = !!config.regimeAtualEmpresa

  const configuracoesPreenchidas = temFaturamento && temAnoTransicao && temRegimeAtual

  const camposFaltantes: string[] = []
  if (!temFaturamento) {
    camposFaltantes.push('Faturamento Mensal (deve ser maior que zero)')
  }
  if (!temAnoTransicao) {
    camposFaltantes.push('Ano da Transição (selecione o ano ou o sistema atual)')
  }
  if (!temRegimeAtual) {
    camposFaltantes.push('Regime Atual da Empresa (Lucro Real, Presumido ou Simples Nacional)')
  }

  // Ano atual da transição (ou padrão 2033 pleno)
  const anoAtual = config.anoTransicao || 2033
  const presetAtual = config.presetSetor || 'nenhum'

  // Presets divididos pelos 3 grupos legais da LC 214/2025 + Padrão
  const presetsPadrao = PRESETS_SETORES_LC214.filter((p) => p.grupo === 'geral')
  const presetsReducao60 = PRESETS_SETORES_LC214.filter(
    (p) => p.grupo === 'reducao_60' && p.id !== 'saude_educacao',
  )
  const presetsReducao30 = PRESETS_SETORES_LC214.filter(
    (p) => p.grupo === 'reducao_30' && p.id !== 'transporte_intelectual',
  )
  const presetsAliquotaZero = PRESETS_SETORES_LC214.filter(
    (p) => p.grupo === 'aliquota_zero' && p.id !== 'cesta_basica',
  )

  const presetAtivoObj = PRESETS_SETORES_LC214.find((p) => p.id === presetAtual)

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cabeçalho do Módulo */}
      <div className="bg-[#07132B] border border-[#D4AF37]/30 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 tracking-wider uppercase">
              <Sliders className="w-3.5 h-3.5" />
              Módulo 1 • Parâmetros Globais
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
              Configurações Gerais de Alíquotas
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
              Defina os parâmetros centrais do IVA Dual (CBS federal e IBS subnacional) e as taxas
              do sistema antigo. Utilize o preenchimento assistido por ano e preset setorial da LC
              214/2025 ou edite livremente os valores.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={resetConfig}
            className="self-start sm:self-center border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-white bg-transparent"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar Padrões Oficiais
          </Button>
        </div>
      </div>

      {/* BLOCO 3: BANNER DE IDENTIFICAÇÃO BLOQUEADA (SOMENTE LEITURA PARA EMPRESÁRIO COM BOTÃO CORRIGIR DADOS) */}
      <BannerIdentificacaoEmpresaBloqueada
        origemModulo="calculadora"
        dadosAtuais={{
          nomeEmpresa: clienteAtivo?.nome || dadosEmpresa.nomeEmpresa,
          cnpj: clienteAtivo?.cnpj_cpf || dadosEmpresa.cnpj,
          cidade: clienteAtivo?.cidade || dadosEmpresa.cidade,
          uf: clienteAtivo?.uf || dadosEmpresa.ufOrigem,
          email: clienteAtivo?.email || dadosEmpresa.email,
          telefone: clienteAtivo?.telefone || dadosEmpresa.telefone,
          contato: clienteAtivo?.contato_principal || dadosEmpresa.nomeContato,
        }}
      />

      {/* BLOCO DE CONTEXTO CADASTRAL FASE 1 (DADOS DA EMPRESA - FONTE MESTRA) */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
            <span className="text-xs font-bold text-[#07132B] uppercase tracking-wide">
              Parâmetros Fiscais & Insumos (Fase 1 • Fonte Mestra)
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Origem: /dados-empresa</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs pt-1">
          <div className="p-2 rounded bg-white border border-slate-200">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">
              Insumos (Cheia/Mono/Red)
            </span>
            <strong className="text-slate-800 font-mono text-[11px]">
              {dadosEmpresa.perfilInsumosAliquotaCheia ?? 70}% /{' '}
              {dadosEmpresa.perfilInsumosMonofasicos ?? 20}% /{' '}
              {dadosEmpresa.perfilInsumosAliquotaReduzida ?? 10}%
            </strong>
          </div>
          <div className="p-2 rounded bg-white border border-slate-200">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">
              Monofásicos
            </span>
            <strong className="text-slate-800 text-[11px]">
              {dadosEmpresa.presencaMonofasicos ? 'Sim' : 'Não'}
            </strong>
          </div>
          <div className="p-2 rounded bg-white border border-slate-200">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">
              Energéticos
            </span>
            <strong className="text-slate-800 text-[11px]">
              {dadosEmpresa.insumosEnergeticos ? 'Sim' : 'Não'}
            </strong>
          </div>
          <div className="p-2 rounded bg-white border border-slate-200">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">
              Intangíveis
            </span>
            <strong className="text-slate-800 text-[11px]">
              {dadosEmpresa.intangiveisRoyalties ? 'Sim' : 'Não'}
            </strong>
          </div>
          <div className="p-2 rounded bg-white border border-slate-200">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">
              Imobilizado (5a)
            </span>
            <strong className="text-slate-800 font-mono text-[11px]">
              R${' '}
              {Number(dadosEmpresa.imobilizadoUltimos5Anos || 0).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}
            </strong>
          </div>
        </div>

        {/* RESUMO FASE 3: SITUAÇÃO FISCAL & MULTI-UF (INFORMATIVO) */}
        <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-[#07132B]">Situação Fiscal:</span>
            <span
              className={
                dadosEmpresa.autosInfracaoAtivos || dadosEmpresa.dividaAtivaExecucaoFiscal
                  ? 'text-rose-700 font-semibold'
                  : 'text-emerald-700 font-semibold'
              }
            >
              {dadosEmpresa.autosInfracaoAtivos
                ? `${dadosEmpresa.autosInfracaoQuantidade || 1} auto(s)`
                : dadosEmpresa.dividaAtivaExecucaoFiscal
                  ? 'Dívida Ativa'
                  : 'Sem pendências críticas'}
            </span>
            <span>•</span>
            <span>
              Parcelamentos: <strong>{dadosEmpresa.parcelamentosEmCurso ? 'Sim' : 'Não'}</strong>
            </span>
            <span>•</span>
            <span>
              Obrigações:{' '}
              <strong>{dadosEmpresa.obrigacoesAcessoriasAtraso ? 'Pendentes' : 'Regulares'}</strong>
            </span>
            <span>•</span>
            <span>
              Estabelecimentos:{' '}
              <strong>
                {(dadosEmpresa.numeroFiliais ?? 1) > 1
                  ? `${dadosEmpresa.numeroFiliais} (${dadosEmpresa.numeroFiliais - 1} filiais)`
                  : '1 (Matriz)'}
              </strong>
            </span>
            <span>•</span>
            <span>
              UFs:{' '}
              <strong className="font-mono">
                {dadosEmpresa.ufsOperacao && dadosEmpresa.ufsOperacao.length > 0
                  ? `${dadosEmpresa.ufOrigem || 'UF'} + ${dadosEmpresa.ufsOperacao.join(', ')}`
                  : dadosEmpresa.ufOrigem || 'SP'}
              </strong>
            </span>
            {dadosEmpresa.vinculosSocietarios && dadosEmpresa.vinculosSocietarios.length > 0 && (
              <>
                <span>•</span>
                <span>
                  Vínculos:{' '}
                  <strong className="text-amber-800">
                    {dadosEmpresa.vinculosSocietarios.length} empresa(s)
                  </strong>
                </span>
              </>
            )}
          </div>
          <span className="text-[10px] font-mono text-slate-400">Fase 3 • Informativo</span>
        </div>
      </div>

      {/* AVISO NOTAS FISCAIS REAIS (fonte real vs estimada da base de compras) */}
      {avisoNotasFiscais}

      {/* BLOCO DE PREENCHIMENTO ASSISTIDO (LC 214/2025) */}
      <Card className="border border-[#D4AF37]/50 shadow-md bg-gradient-to-br from-white via-slate-50 to-amber-50/20 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#07132B] via-[#0E1F42] to-[#122347] text-white border-b border-[#D4AF37]/30 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 tracking-wider uppercase">
                LC 214/2025 • Assistente Tributário
              </div>
              <CardTitle className="text-lg font-heading text-white">
                Preenchimento Assistido de Alíquotas e Regimes
              </CardTitle>
            </div>
            <span className="text-xs text-slate-300">
              Atalhos automáticos • Todos os campos continuam 100% editáveis
            </span>
          </div>
          <CardDescription className="text-xs text-slate-300 pt-1">
            Selecione o ano da transição e o setor para carregar de uma vez os percentuais legais
            oficiais calculados com base no cronograma constitucional.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 space-y-4">
          {/* CAMPO NOVO: Cliente desta Simulação sincronizado com o topo + Botão de texto Cadastrar Novo Cliente */}
          <div className="p-4 rounded-xl bg-[#07132B] text-white border border-[#D4AF37]/35 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    clienteAtivo ? 'bg-[#D4AF37] animate-pulse' : 'bg-slate-500'
                  }`}
                />
                <Label
                  htmlFor="seletorClienteSimulacaoM1"
                  className="text-xs sm:text-sm font-bold break-words leading-snug text-slate-200 uppercase tracking-wider cursor-pointer"
                >
                  Cliente desta Simulação
                </Label>
                <span className="text-[10px] text-slate-400 font-normal">
                  (sincronizado com o seletor do topo)
                </span>
              </div>

              {/* Botão de texto Cadastrar Novo Cliente — Padrão Diamond Group, sem ícones */}
              <button
                type="button"
                onClick={() => setModalNovoClienteAberto(true)}
                className="self-start sm:self-auto text-xs font-bold text-[#D4AF37] hover:text-[#E5C158] hover:underline bg-white/5 hover:bg-white/10 border border-[#D4AF37]/40 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Cadastrar Novo Cliente
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-3">
              {/* Dropdown nativo estilizado idêntico ao topo */}
              <select
                id="seletorClienteSimulacaoM1"
                value={clienteAtivoId || ''}
                onChange={(e) => selecionarClienteAtivo(e.target.value || null)}
                disabled={carregandoClientes}
                className="w-full md:max-w-md bg-[#0D1D3A] text-white text-xs font-semibold rounded-lg px-3 py-2 border border-[#D4AF37]/40 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] truncate cursor-pointer"
                aria-label="Selecionar cliente desta simulação"
              >
                <option value="">Sem cliente (Modo Teste / Geral)</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} {c.cnpj_cpf ? `• ${c.cnpj_cpf}` : ''} ({c.uf})
                  </option>
                ))}
              </select>

              {/* Badges do cliente ativo selecionado */}
              {clienteAtivo ? (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <Badge className="bg-[#D4AF37] text-[#07132B] hover:bg-[#D4AF37] font-bold text-[10px] px-2 py-0.5">
                    {clienteAtivo.regime_atual}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-white/20 text-slate-300 text-[10px] px-2 py-0.5"
                  >
                    {clienteAtivo.segmento}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-[#D4AF37]/40 text-[#D4AF37] text-[10px] px-1.5 py-0.5"
                  >
                    UF: {clienteAtivo.uf}
                  </Badge>
                  {clienteAtivo.cnpj_cpf && (
                    <span className="text-[11px] font-mono text-slate-300 hidden sm:inline">
                      CNPJ: {clienteAtivo.cnpj_cpf}
                    </span>
                  )}
                </div>
              ) : (
                <Badge
                  variant="outline"
                  className="border-slate-600 text-slate-400 text-[10px] px-2 py-0.5 self-start md:self-auto"
                >
                  Simulação em Modo Teste / Geral (sem vínculo a cliente)
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Seletor 1: Ano da Transição (Ano atual + 2026–2033) — SEM ÍCONES NAS OPÇÕES (REGRA DO PROJETO) */}
            <div className="min-w-0 w-full space-y-2">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <Label
                  htmlFor="seletorAnoTransicao"
                  className="text-xs sm:text-sm font-medium break-words leading-snug text-[#07132B]"
                >
                  Ano da Transição
                </Label>
                <span className="text-[11px] font-medium text-slate-500 break-words">
                  Sistema atual ou transição LC 214
                </span>
              </div>
              <Select
                value={String(anoAtual)}
                onValueChange={(val) =>
                  aplicarAnoTransicao(
                    val === 'atual' ? 'atual' : (Number(val) as AnoTransicaoIbsCbs),
                  )
                }
              >
                <SelectTrigger
                  id="seletorAnoTransicao"
                  className="h-12 bg-white border-slate-300 text-[#07132B] font-semibold shadow-sm"
                >
                  <SelectValue placeholder="Selecione o ano da transição" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {LISTA_ANOS_TRANSICAO.map((ano) => {
                    const dados = obterFaseTransicaoPorAno(ano)
                    if (!dados) return null
                    const rotuloPrincipal =
                      ano === 'atual'
                        ? 'Ano atual (sistema atual) • Pré-reforma (0,00% IBS/CBS)'
                        : `${ano} • ${dados.fase} (${dados.aliquotaCbs.toFixed(2)}% CBS + ${dados.aliquotaIbs.toFixed(2)}% IBS)`
                    return (
                      <SelectItem key={String(ano)} value={String(ano)} className="py-2">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-slate-900 text-xs">
                            {rotuloPrincipal}
                          </span>
                          <span className="text-[11px] text-slate-500 leading-tight">
                            {dados.subtitulo}
                          </span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <span>Fase selecionada: {obterFaseTransicaoPorAno(anoAtual)?.fase}</span>
                {isAnoPosTransicao(anoAtual) && (
                  <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 border-none shadow-sm">
                    Regime definitivo — 100% IBS/CBS
                  </Badge>
                )}
                <span className="font-mono font-bold text-[#07132B]">
                  Total IBS/CBS: {obterFaseTransicaoPorAno(anoAtual)?.totalIvaDual.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Seletor 2: Regime Aplicado (Preset por Setor) — SEM ÍCONES NAS OPÇÕES (REGRA DO PROJETO) */}
            <div className="min-w-0 w-full space-y-2">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <Label
                  htmlFor="seletorPresetSetor"
                  className="text-xs sm:text-sm font-medium break-words leading-snug text-[#07132B]"
                >
                  Regime Aplicado (Preset por Setor)
                </Label>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded shrink-0">
                  Aplica reduções
                </span>
              </div>
              <Select
                value={presetAtual}
                onValueChange={(val) => aplicarPresetSetor(val as PresetSetorIbsCbs)}
              >
                <SelectTrigger
                  id="seletorPresetSetor"
                  className="h-12 bg-white border-slate-300 text-[#07132B] font-semibold shadow-sm"
                >
                  <SelectValue placeholder="Selecione o regime aplicado (preset por setor)" />
                </SelectTrigger>
                <SelectContent className="max-h-96">
                  {/* Opção Padrão / Manual */}
                  <SelectItem value="nenhum" className="py-2">
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-slate-900 text-xs">
                        Manual / Sem Preset Específico
                      </span>
                      <span className="text-[11px] text-slate-500 leading-tight">
                        Manter alíquotas personalizadas editadas manualmente
                      </span>
                    </div>
                  </SelectItem>

                  {/* Alíquota Plena Padrão */}
                  {presetsPadrao.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id} className="py-2">
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-slate-900 text-xs">{preset.titulo}</span>
                        <span className="text-[11px] text-slate-500 leading-tight">
                          {preset.subtitulo}
                        </span>
                      </div>
                    </SelectItem>
                  ))}

                  {/* SEÇÃO (1): Redução de 60% (arts. 128–134) */}
                  <div className="px-2 py-1.5 mt-2 bg-slate-100 text-[11px] font-bold text-slate-800 uppercase tracking-wider rounded">
                    (1) Redução de 60% — Arts. 128 a 134 da LC 214/2025
                  </div>
                  {presetsReducao60.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id} className="py-2 pl-3">
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-slate-900 text-xs">{preset.titulo}</span>
                        <span className="text-[11px] text-slate-500 leading-tight">
                          {preset.subtitulo}
                        </span>
                      </div>
                    </SelectItem>
                  ))}

                  {/* SEÇÃO (2): Redução de 30% (art. 132) */}
                  <div className="px-2 py-1.5 mt-2 bg-slate-100 text-[11px] font-bold text-slate-800 uppercase tracking-wider rounded">
                    (2) Redução de 30% — Profissões Regulamentadas (Art. 132)
                  </div>
                  {presetsReducao30.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id} className="py-2 pl-3">
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-slate-900 text-xs">{preset.titulo}</span>
                        <span className="text-[11px] text-slate-500 leading-tight">
                          {preset.subtitulo}
                        </span>
                      </div>
                    </SelectItem>
                  ))}

                  {/* SEÇÃO (3): Alíquota Zero (arts. 8º, 129 e 146) */}
                  <div className="px-2 py-1.5 mt-2 bg-slate-100 text-[11px] font-bold text-slate-800 uppercase tracking-wider rounded">
                    (3) Alíquota Zero — Arts. 8º, 129 e 146 da LC 214/2025
                  </div>
                  {presetsAliquotaZero.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id} className="py-2 pl-3">
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-slate-900 text-xs">{preset.titulo}</span>
                        <span className="text-[11px] text-slate-500 leading-tight">
                          {preset.subtitulo}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 pt-0.5 gap-1">
                <span className="truncate">
                  Preset ativo:{' '}
                  <strong className="text-slate-800">
                    {presetAtual === 'nenhum'
                      ? 'Nenhum (personalizado)'
                      : presetAtivoObj?.titulo || presetAtual}
                  </strong>
                </span>
                {presetAtual !== 'nenhum' && (
                  <span className="font-semibold text-emerald-700 shrink-0">
                    {presetAtivoObj?.baseLegal || 'Redução legal'}
                  </span>
                )}
              </div>
            </div>

            {/* Seletor 3: O que Vende (Ramo Principal) — SEM ÍCONES NAS OPÇÕES (REGRA DO PROJETO) */}
            <div className="min-w-0 w-full space-y-2">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <Label
                  htmlFor="tipoAtividadeM1"
                  className="text-xs sm:text-sm font-medium break-words leading-snug text-[#07132B]"
                >
                  O que Vende (Ramo Principal)
                </Label>
                {config.etiquetasOrigem?.tipoAtividade ? (
                  <BadgeOrigemPropagada origem="dados-empresa" />
                ) : (
                  <span className="text-[10px] text-slate-500 font-medium break-words">
                    Propaga aos Módulos 3, 5 e Dashboard
                  </span>
                )}
              </div>
              <Select
                value={config.tipoAtividade || 'servico'}
                onValueChange={(val) => updateConfig({ tipoAtividade: val as TipoAtividade })}
              >
                <SelectTrigger
                  id="tipoAtividadeM1"
                  className="h-12 bg-white border-slate-300 text-[#07132B] font-semibold shadow-sm"
                >
                  <SelectValue placeholder="Selecione o ramo principal" />
                </SelectTrigger>
                <SelectContent className="max-w-xl">
                  {RAMOS_PRINCIPAIS_ATIVOS.map((ramo) => (
                    <SelectItem key={ramo.id} value={ramo.id} className="py-2">
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-slate-900 text-xs">{ramo.label}</span>
                        <span className="text-[11px] text-slate-500 leading-tight">
                          {ramo.subtitulo}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <span>Define tributos incidentes e regras setoriais</span>
                <span className="font-mono font-bold text-[#07132B]">8 ramos ativos</span>
              </div>
            </div>
          </div>

          {/* SELETOR CONDICIONAL DE SUBATIVIDADE CORRESPONDENTE AO RAMO NO MÓDULO 1 — SEM ÍCONES */}
          <div className="pt-2">
            {/* 1. Ramo Serviço */}
            {config.tipoAtividade === 'servico' && (
              <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/50 border border-blue-200/80 p-4 sm:p-5 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <Label
                    htmlFor="subServicoM1"
                    className="text-xs sm:text-sm font-medium break-words leading-snug text-[#07132B]"
                  >
                    Subatividade de Serviço (Refina Presunção IRPJ/CSLL e Reduções IBS/CBS)
                  </Label>
                  <span className="text-[11px] text-blue-700 font-semibold bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
                    5 perfis regulatórios disponíveis
                  </span>
                </div>
                <Select
                  value={config.subatividadeServico || 'servico_comum'}
                  onValueChange={(val) =>
                    updateConfig({ subatividadeServico: val as SubatividadeServico })
                  }
                >
                  <SelectTrigger
                    id="subServicoM1"
                    className="h-11 bg-white border-blue-300 shadow-sm font-medium text-slate-800 text-xs"
                  >
                    <SelectValue placeholder="Selecione a subatividade de serviço" />
                  </SelectTrigger>
                  <SelectContent className="max-w-xl">
                    {SUBATIVIDADES_SERVICO.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="py-2">
                        <div className="text-left">
                          <span className="font-semibold text-slate-900 block text-xs">
                            {item.label}
                          </span>
                          <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                            {item.descricao}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-[11px] text-blue-900/90 bg-blue-100/60 p-2.5 rounded-lg leading-snug">
                  {config.subatividadeServico === 'tecnologia_software' ||
                  config.subatividadeServico === 'saude_educacao'
                    ? 'Aplica redução de 60% na alíquota padrão do IBS/CBS (regime diferenciado).'
                    : config.subatividadeServico === 'transporte'
                      ? 'Presunção de 16% no Lucro Presumido + redução de 30% no IBS/CBS.'
                      : 'Presunção integral de 32% sobre a receita e ISS municipal cheio.'}
                </div>
              </div>
            )}

            {/* 2. Ramo Indústria */}
            {config.tipoAtividade === 'industria' && (
              <div className="bg-gradient-to-r from-amber-50/70 to-orange-50/50 border border-amber-200/80 p-4 sm:p-5 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <Label
                    htmlFor="subIndustriaM1"
                    className="text-xs sm:text-sm font-medium break-words leading-snug text-[#07132B]"
                  >
                    Subatividade Industrial (Ajusta IPI e Imposto Seletivo)
                  </Label>
                  <span className="text-[11px] text-amber-800 font-semibold bg-white px-2.5 py-0.5 rounded-full border border-amber-200">
                    Impacta Lucro Real, Presumido e IVA Dual
                  </span>
                </div>
                <Select
                  value={config.subatividadeIndustria || 'industria_comum'}
                  onValueChange={(val) =>
                    updateConfig({ subatividadeIndustria: val as SubatividadeIndustria })
                  }
                >
                  <SelectTrigger
                    id="subIndustriaM1"
                    className="h-11 bg-white border-amber-300 shadow-sm font-medium text-slate-800 text-xs"
                  >
                    <SelectValue placeholder="Selecione a subatividade industrial" />
                  </SelectTrigger>
                  <SelectContent className="max-w-xl">
                    {SUBATIVIDADES_INDUSTRIA.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="py-2">
                        <div className="text-left">
                          <span className="font-semibold text-slate-900 block text-xs">
                            {item.label}
                          </span>
                          <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                            {item.descricao}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {config.subatividadeIndustria === 'produto_imposto_seletivo' && (
                  <div className="bg-rose-50/80 border border-rose-200 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-rose-900 block">
                        Alíquota de Referência do Imposto Seletivo (IS):
                      </span>
                      <p className="text-[11px] text-rose-700 leading-tight">
                        Incidência monofásica/adicional no novo sistema sobre bens nocivos à
                        saúde/meio ambiente.
                      </p>
                    </div>
                    <div className="relative w-28">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={config.aliquotaImpostoSeletivo ?? 10}
                        onChange={(e) =>
                          updateConfig({ aliquotaImpostoSeletivo: Number(e.target.value) })
                        }
                        className="h-9 bg-white font-mono font-bold text-rose-900 border-rose-300 pr-7 text-right text-xs"
                      />
                      <span className="absolute right-2.5 top-2 text-xs text-rose-500 font-bold">
                        %
                      </span>
                    </div>
                  </div>
                )}

                <div className="text-[11px] text-amber-900/90 bg-amber-100/60 p-2.5 rounded-lg leading-snug">
                  {config.subatividadeIndustria === 'industria_ipi_alto'
                    ? 'IPI elevado em 15% entra como débito e permite crédito nas aquisições produtivas.'
                    : config.subatividadeIndustria === 'industria_ipi_baixo_zero'
                      ? 'IPI zerado (0%) sem impacto de imposto sobre produtos industrializados.'
                      : config.subatividadeIndustria === 'produto_imposto_seletivo'
                        ? `Aplica ${config.aliquotaImpostoSeletivo ?? 10}% de Imposto Seletivo no cenário IBS/CBS mantido no novo sistema.`
                        : 'IPI padrão de 5% aplicado no Lucro Real e Presumido.'}
                </div>
              </div>
            )}

            {/* 3. Ramo Comércio */}
            {config.tipoAtividade === 'comercio' && (
              <div className="bg-gradient-to-r from-emerald-50/70 to-teal-50/50 border border-emerald-200/80 p-4 sm:p-5 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <Label
                    htmlFor="subComercioM1"
                    className="text-xs sm:text-sm font-medium break-words leading-snug text-[#07132B]"
                  >
                    Subatividade de Comércio (ICMS Próprio vs ICMS-ST / Atacado)
                  </Label>
                  <span className="text-[11px] text-emerald-800 font-semibold bg-white px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Ajusta presunção de 8% e alíquotas de saída
                  </span>
                </div>
                <Select
                  value={config.subatividadeComercio || 'varejo_comum'}
                  onValueChange={(val) =>
                    updateConfig({ subatividadeComercio: val as SubatividadeComercio })
                  }
                >
                  <SelectTrigger
                    id="subComercioM1"
                    className="h-11 bg-white border-emerald-300 shadow-sm font-medium text-slate-800 text-xs"
                  >
                    <SelectValue placeholder="Selecione a subatividade de comércio" />
                  </SelectTrigger>
                  <SelectContent className="max-w-xl">
                    {SUBATIVIDADES_COMERCIO.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="py-2">
                        <div className="text-left">
                          <span className="font-semibold text-slate-900 block text-xs">
                            {item.label}
                          </span>
                          <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                            {item.descricao}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-[11px] text-emerald-900/90 bg-emerald-100/60 p-2.5 rounded-lg leading-snug">
                  {config.subatividadeComercio === 'com_icms_st'
                    ? 'No ICMS-ST, o ICMS próprio da saída cai para ≈ 0% (já recolhido na fábrica). No novo IBS/CBS a ST é extinta em prol do split payment.'
                    : config.subatividadeComercio === 'atacado_distribuicao'
                      ? 'Atacado/distribuição com ICMS reduzido de ~12% (operações interestaduais/benefícios fiscais).'
                      : 'Varejo comum com ICMS integral estadual e presunção padrão de 8% no Lucro Presumido.'}
                </div>
              </div>
            )}

            {/* 4. Ramo Agronegócio */}
            {config.tipoAtividade === 'agronegocio' && (
              <div className="bg-gradient-to-r from-lime-50/70 to-emerald-50/50 border border-lime-200/80 p-4 sm:p-5 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <Label
                    htmlFor="subAgroM1"
                    className="text-xs sm:text-sm font-medium break-words leading-snug text-[#07132B]"
                  >
                    Subatividade Agropecuária (Reduções IBS/CBS e Enquadramento Simples)
                  </Label>
                  <span className="text-[11px] text-lime-900 font-semibold bg-white px-2.5 py-0.5 rounded-full border border-lime-200">
                    4 perfis regulatórios rurais
                  </span>
                </div>
                <Select
                  value={config.subatividadeAgro || 'producao_agricola_graos'}
                  onValueChange={(val) =>
                    updateConfig({ subatividadeAgro: val as SubatividadeAgro })
                  }
                >
                  <SelectTrigger
                    id="subAgroM1"
                    className="h-11 bg-white border-lime-300 shadow-sm font-medium text-slate-800 text-xs"
                  >
                    <SelectValue placeholder="Selecione a subatividade do agronegócio" />
                  </SelectTrigger>
                  <SelectContent className="max-w-xl">
                    {SUBATIVIDADES_AGRONEGOCIO.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="py-2">
                        <div className="text-left">
                          <span className="font-semibold text-slate-900 block text-xs">
                            {item.label}
                          </span>
                          <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                            {item.descricao}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-[11px] text-lime-950 bg-lime-100/70 p-2.5 rounded-lg leading-snug">
                  {config.subatividadeAgro === 'hortifruti_cesta_basica'
                    ? 'Cesta Básica Nacional / Hortifrúti: alíquota ZERO (isenção de 100%) no IBS e CBS com manutenção de créditos.'
                    : config.subatividadeAgro === 'agroindustria_processamento'
                      ? 'Agroindústria: enquadramento no Anexo II do Simples Nacional (Indústria) e redução de 60% no IBS/CBS.'
                      : 'Produtor rural: Anexo I do Simples Nacional com redução de 60% na alíquota padrão do IBS/CBS.'}
                </div>
              </div>
            )}

            {/* 5. Ramo Construção Civil */}
            {config.tipoAtividade === 'construcao_civil' && (
              <div className="bg-gradient-to-r from-orange-50/70 to-amber-50/50 border border-orange-200/80 p-4 sm:p-5 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <Label
                    htmlFor="subConstrucaoM1"
                    className="text-xs sm:text-sm font-medium break-words leading-snug text-[#07132B]"
                  >
                    Subatividade de Construção Civil e Engenharia
                  </Label>
                  <span className="text-[11px] text-orange-900 font-semibold bg-white px-2.5 py-0.5 rounded-full border border-orange-200">
                    Anexo IV vs III (Fator R)
                  </span>
                </div>
                <Select
                  value={config.subatividadeConstrucao || 'obras_edificacoes_ret'}
                  onValueChange={(val) =>
                    updateConfig({ subatividadeConstrucao: val as SubatividadeConstrucao })
                  }
                >
                  <SelectTrigger
                    id="subConstrucaoM1"
                    className="h-11 bg-white border-orange-300 shadow-sm font-medium text-slate-800 text-xs"
                  >
                    <SelectValue placeholder="Selecione a subatividade da construção civil" />
                  </SelectTrigger>
                  <SelectContent className="max-w-xl">
                    {SUBATIVIDADES_CONSTRUCAO.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="py-2">
                        <div className="text-left">
                          <span className="font-semibold text-slate-900 block text-xs">
                            {item.label}
                          </span>
                          <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                            {item.descricao}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-[11px] text-orange-950 bg-orange-100/70 p-2.5 rounded-lg leading-snug">
                  {config.subatividadeConstrucao === 'engenharia_projetos'
                    ? 'Engenharia e Projetos: sujeitos ao Fator R (LC 123/2006). Folha ≥ 28% qualifica para o Anexo III; se < 28%, cai no Anexo V.'
                    : 'Obras e Edificações: Anexo IV do Simples Nacional com CPP patronal (20%) recolhida por fora na folha de pagamento.'}
                </div>
              </div>
            )}

            {/* 6. Ramo Aluguel / Locação de Bens */}
            {config.tipoAtividade === 'locacao_bens' && (
              <div className="bg-gradient-to-r from-sky-50/70 to-blue-50/50 border border-sky-200/80 p-4 sm:p-5 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <Label
                    htmlFor="subLocacaoM1"
                    className="text-xs sm:text-sm font-medium break-words leading-snug text-[#07132B]"
                  >
                    Subatividade de Aluguel e Locação de Bens
                  </Label>
                  <span className="text-[11px] text-sky-900 font-semibold bg-white px-2.5 py-0.5 rounded-full border border-sky-200">
                    Anexo III sem ISS (Súmula 31)
                  </span>
                </div>
                <Select
                  value={config.subatividadeLocacao || 'locacao_veiculos_maquinas'}
                  onValueChange={(val) =>
                    updateConfig({ subatividadeLocacao: val as SubatividadeLocacao })
                  }
                >
                  <SelectTrigger
                    id="subLocacaoM1"
                    className="h-11 bg-white border-sky-300 shadow-sm font-medium text-slate-800 text-xs"
                  >
                    <SelectValue placeholder="Selecione a subatividade de locação" />
                  </SelectTrigger>
                  <SelectContent className="max-w-xl">
                    {SUBATIVIDADES_LOCACAO.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="py-2">
                        <div className="text-left">
                          <span className="font-semibold text-slate-900 block text-xs">
                            {item.label}
                          </span>
                          <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                            {item.descricao}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-[11px] text-sky-950 bg-sky-100/70 p-2.5 rounded-lg leading-snug">
                  {config.subatividadeLocacao === 'coworking_espacos'
                    ? 'Coworking mescla locação e serviços administrativos: submete-se à regra do Fator R (Anexo III vs V).'
                    : 'Locação pura de bens móveis: não incide ISS (Súmula Vinculante 31 STF) e enquadra-se diretamente no Anexo III.'}
                </div>
              </div>
            )}

            {/* 7. Ramo Bares, Restaurantes e Food Service */}
            {config.tipoAtividade === 'food_service' && (
              <div className="bg-gradient-to-r from-red-50/70 to-rose-50/50 border border-red-200/80 p-4 sm:p-5 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <Label
                    htmlFor="subFoodServiceM1"
                    className="text-xs sm:text-sm font-medium break-words leading-snug text-[#07132B]"
                  >
                    Subatividade de Bares, Restaurantes e Food Service
                  </Label>
                  <span className="text-[11px] text-red-900 font-semibold bg-white px-2.5 py-0.5 rounded-full border border-red-200">
                    Anexo I + Imposto Seletivo & Créditos Delivery
                  </span>
                </div>
                <Select
                  value={config.subatividadeFoodService || 'restaurante_a_la_carte_buffet'}
                  onValueChange={(val) =>
                    updateConfig({ subatividadeFoodService: val as SubatividadeFoodService })
                  }
                >
                  <SelectTrigger
                    id="subFoodServiceM1"
                    className="h-11 bg-white border-red-300 shadow-sm font-medium text-slate-800 text-xs"
                  >
                    <SelectValue placeholder="Selecione o perfil de food service" />
                  </SelectTrigger>
                  <SelectContent className="max-w-xl">
                    {SUBATIVIDADES_FOOD_SERVICE.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="py-2">
                        <div className="text-left">
                          <span className="font-semibold text-slate-900 block text-xs">
                            {item.label}
                          </span>
                          <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                            {item.descricao}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {config.subatividadeFoodService === 'bar_balada_bebidas' && (
                  <div className="bg-rose-50/80 border border-rose-200 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-rose-900 block">
                        Alíquota do Imposto Seletivo sobre Bebidas Alcoólicas:
                      </span>
                      <p className="text-[11px] text-rose-700 leading-tight">
                        Incidência adicional monofásica no novo sistema sobre bebidas alcoólicas.
                      </p>
                    </div>
                    <div className="relative w-28">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={config.aliquotaImpostoSeletivo ?? 10}
                        onChange={(e) =>
                          updateConfig({ aliquotaImpostoSeletivo: Number(e.target.value) })
                        }
                        className="h-9 bg-white font-mono font-bold text-rose-900 border-rose-300 pr-7 text-right text-xs"
                      />
                      <span className="absolute right-2.5 top-2 text-xs text-rose-500 font-bold">
                        %
                      </span>
                    </div>
                  </div>
                )}

                <div className="text-[11px] text-red-950 bg-red-100/70 p-2.5 rounded-lg leading-snug">
                  {config.subatividadeFoodService === 'bar_balada_bebidas'
                    ? `Enquadramento no Anexo I com incidência adicional de ${config.aliquotaImpostoSeletivo ?? 10}% de Imposto Seletivo sobre bebidas.`
                    : config.subatividadeFoodService === 'delivery_marmitaria'
                      ? 'Enquadramento no Anexo I e geração de 26,5% de crédito de IBS/CBS sobre comissões pagas aos aplicativos de entrega.'
                      : 'Enquadramento no Anexo I do Simples Nacional (refeições equiparadas a comércio) e presunção de 8% de IRPJ.'}
                </div>
              </div>
            )}

            {/* 8. Ramo Misto */}
            {config.tipoAtividade === 'misto' && (
              <div className="bg-amber-50/70 border border-amber-200 p-4 sm:p-5 rounded-xl space-y-4">
                <div className="flex justify-between items-center gap-2 flex-wrap">
                  <Label className="text-xs sm:text-sm font-medium break-words leading-snug text-amber-950">
                    Atividade Mista: Calibração das Duas Partes Proporcionais
                  </Label>
                  <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded shrink-0">
                    {config.proporcaoServicoMisto ?? 50}% Serviço |{' '}
                    {100 - (config.proporcaoServicoMisto ?? 50)}% Comércio
                  </span>
                </div>

                <Slider
                  value={[config.proporcaoServicoMisto ?? 50]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(val) => updateConfig({ proporcaoServicoMisto: val[0] })}
                  className="py-1"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="min-w-0 w-full space-y-1.5 bg-white p-3 rounded-lg border border-amber-200">
                    <Label className="text-xs sm:text-sm font-medium break-words leading-snug text-slate-800">
                      Subatividade para a parte de Serviço ({config.proporcaoServicoMisto ?? 50}%):
                    </Label>
                    <Select
                      value={config.subatividadeServico || 'servico_comum'}
                      onValueChange={(val) =>
                        updateConfig({ subatividadeServico: val as SubatividadeServico })
                      }
                    >
                      <SelectTrigger className="h-9 bg-slate-50 border-slate-300 text-xs font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBATIVIDADES_SERVICO.map((item) => (
                          <SelectItem key={item.id} value={item.id} className="text-xs">
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="min-w-0 w-full space-y-1.5 bg-white p-3 rounded-lg border border-amber-200">
                    <Label className="text-xs sm:text-sm font-medium break-words leading-snug text-slate-800">
                      Subatividade para a parte de Comércio (
                      {100 - (config.proporcaoServicoMisto ?? 50)}%):
                    </Label>
                    <Select
                      value={config.subatividadeComercio || 'varejo_comum'}
                      onValueChange={(val) =>
                        updateConfig({ subatividadeComercio: val as SubatividadeComercio })
                      }
                    >
                      <SelectTrigger className="h-9 bg-slate-50 border-slate-300 text-xs font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBATIVIDADES_COMERCIO.map((item) => (
                          <SelectItem key={item.id} value={item.id} className="text-xs">
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Parâmetros Operacionais Base para Propagação Automática aos Módulos 2, 3, 5 e Dashboard */}
          <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Regime Atual da Empresa */}
            <div className="min-w-0 w-full space-y-1.5">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <Label
                  htmlFor="regimeAtualEmpresaM1"
                  className="text-xs sm:text-sm font-medium break-words leading-snug text-[#07132B]"
                >
                  Regime Atual da Empresa
                </Label>
                {config.etiquetasOrigem?.regimeAtualEmpresa ? (
                  <BadgeOrigemPropagada origem="dados-empresa" />
                ) : (
                  <span className="text-[10px] text-slate-500 font-medium break-words">
                    Propaga ao Dashboard e Split
                  </span>
                )}
              </div>
              <Select
                value={config.regimeAtualEmpresa || 'Lucro Presumido'}
                onValueChange={(val: 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional') =>
                  updateConfig({ regimeAtualEmpresa: val })
                }
              >
                <SelectTrigger
                  id="regimeAtualEmpresaM1"
                  className="h-11 bg-white border-slate-300 text-[#07132B] font-semibold shadow-sm"
                >
                  <SelectValue placeholder="Selecione o regime atual" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lucro Real" className="py-2 font-medium">
                    Lucro Real
                  </SelectItem>
                  <SelectItem value="Lucro Presumido" className="py-2 font-medium">
                    Lucro Presumido
                  </SelectItem>
                  <SelectItem value="Simples Nacional" className="py-2 font-medium">
                    Simples Nacional
                  </SelectItem>
                </SelectContent>
              </Select>
              <span className="text-[11px] text-slate-500 block leading-tight">
                Enquadramento tributário vigente da empresa.
              </span>
            </div>

            {/* Faturamento Mensal */}
            <div className="min-w-0 w-full space-y-1.5">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Label
                    htmlFor="fatMensalM1"
                    className="text-xs sm:text-sm font-bold break-words leading-snug text-[#07132B]"
                  >
                    Faturamento Mensal (R$)
                  </Label>
                </div>
                {/* Botão Importar faturamento no cabeçalho do campo — Padrão Diamond Group, sem ícones */}
                <button
                  type="button"
                  onClick={() => setModalImportarFaturamentoAberto(true)}
                  className="text-[11px] font-bold text-[#D4AF37] hover:text-[#b89528] bg-[#07132B] hover:bg-[#0c1e40] px-2 py-0.5 rounded border border-[#D4AF37] transition-all cursor-pointer"
                  title="Importar receita de planilha CSV/XLSX ou Google Sheets"
                >
                  Importar faturamento
                </button>
              </div>
              <Input
                id="fatMensalM1"
                type="text"
                value={(config.faturamentoMensal ?? 0).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '')
                  const v = Number(raw) / 100
                  updateConfig({ faturamentoMensal: v })
                }}
                className="h-11 bg-white border-slate-300 text-[#07132B] font-mono font-bold shadow-sm"
              />
              <span className="text-[11px] text-slate-500 block leading-tight">
                Receita operacional mensal de referência. Propaga aos Módulos 2, 3 e 5.
              </span>
            </div>

            {/* % de Compras sobre Vendas */}
            <div className="min-w-0 w-full space-y-1.5">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <Label
                  htmlFor="pctComprasM1"
                  className="text-xs sm:text-sm font-medium break-words leading-snug text-[#07132B]"
                >
                  {config.tipoAtividade === 'servico'
                    ? '% de Insumos / Serviços s/ Faturamento'
                    : '% de Compras sobre Vendas'}
                </Label>
                <span className="text-[10px] text-slate-500 font-medium break-words">
                  Propaga aos Módulos 2 e 3
                </span>
              </div>
              <div className="relative">
                <Input
                  id="pctComprasM1"
                  type="number"
                  min="0"
                  max="100"
                  value={config.percentualComprasVendas ?? 0}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    updateConfig({ percentualComprasVendas: v })
                  }}
                  className="h-11 bg-white border-slate-300 text-[#07132B] font-mono font-bold shadow-sm pr-9"
                />
                <span className="absolute right-3.5 top-3 text-slate-400 font-bold text-xs">%</span>
              </div>
              <span className="text-[11px] text-slate-500 block leading-tight">
                {config.tipoAtividade === 'servico'
                  ? 'Percentual médio de insumos operacionais, softwares e serviços tomados de terceiros.'
                  : 'Percentual médio de insumos e compras tributáveis.'}
              </span>
            </div>

            {/* % das compras vindas de fornecedores do Simples Nacional */}
            <div className="min-w-0 w-full space-y-1.5">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <Label
                    htmlFor="pctComprasSimplesNacionalM1"
                    className="text-xs sm:text-sm font-medium break-words leading-snug text-[#07132B]"
                  >
                    {config.tipoAtividade === 'servico'
                      ? '% dos insumos/serviços de fornecedores do Simples Nacional'
                      : '% das compras vindas de fornecedores do Simples Nacional'}
                  </Label>
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center w-4 h-4 rounded-full text-slate-400 hover:text-[#D4AF37] bg-slate-100 hover:bg-[#07132B] transition-colors cursor-pointer shrink-0 focus:outline-none"
                          aria-label="Ajuda sobre compras de fornecedores do Simples Nacional"
                          title="Compras de fornecedores optantes do Simples Nacional geram crédito presumido/reduzido de IBS/CBS conforme a LC 214/2025."
                        >
                          <HelpCircle className="w-3 h-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        align="center"
                        className="max-w-xs text-xs p-2.5 bg-[#07132B] text-slate-100 border border-[#D4AF37]/40 shadow-lg rounded-lg"
                      >
                        Compras de fornecedores optantes do Simples Nacional geram crédito
                        presumido/reduzido de IBS/CBS conforme a LC 214/2025.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="text-[10px] text-slate-500 font-medium break-words shrink-0">
                  LC 214/2025
                </span>
              </div>
              <div className="relative">
                <Input
                  id="pctComprasSimplesNacionalM1"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={config.porcentagemComprasSimplesNacional ?? 0}
                  onChange={(e) => {
                    const raw = e.target.value
                    const v = raw === '' ? 0 : Math.min(100, Math.max(0, Number(raw)))
                    updateConfig({ porcentagemComprasSimplesNacional: v })
                  }}
                  className="h-11 bg-white border-slate-300 text-[#07132B] font-mono font-bold shadow-sm pr-9"
                />
                <span className="absolute right-3.5 top-3 text-slate-400 font-bold text-xs">%</span>
              </div>
              <span className="text-[11px] text-slate-500 block leading-tight">
                Parcela de insumos com crédito presumido da LC 214/2025.
              </span>
              {(config.porcentagemComprasSimplesNacional ?? 0) === 0 && (
                <span className="text-[11px] text-amber-700 block leading-tight">
                  assumindo todos os fornecedores no regime regular — ajuste se você compra de
                  optantes do Simples
                </span>
              )}
            </div>
          </div>

          {/* Banner de Ajuda Operacional */}
          <div className="p-3 bg-slate-100/90 border border-slate-200 rounded-xl text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>
                Os seletores e dados acima preenchem automaticamente os Módulos 2, 3 e 4. Em cada
                módulo, os campos mantêm 100% de editabilidade independente com indicação de origem.
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-600 shrink-0">
              Propagação automática ativa
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Composição Detalhada por Itens e Código NCM (Fase 3 - LC 214/2025) */}
      <SecaoComposicaoItensNcm />

      {/* Grid de Configurações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: IVA Dual Padrão */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#D4AF37] tracking-wider uppercase">
                Alíquotas Padrão
              </span>
              <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <CardTitle className="text-lg font-heading text-[#07132B]">
              Novo Sistema (IVA Dual)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Alíquota de referência federal (CBS) e subnacional (IBS) da fase configurada.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {/* Campo CBS Padrão */}
            <div className="min-w-0 w-full">
              <div className="flex justify-between items-center mb-1.5 flex-wrap gap-1">
                <Label
                  htmlFor="cbsPadrao"
                  className="text-xs sm:text-sm font-medium break-words leading-snug text-slate-700"
                >
                  CBS Padrão (Federal)
                </Label>
                <div className="flex items-center gap-1.5">
                  {config.etiquetasOrigem?.cbsPadrao && (
                    <span
                      title="Origem do valor via assistente legal"
                      className="text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded"
                    >
                      {config.etiquetasOrigem.cbsPadrao}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">PIS/COFINS/IPI</span>
                </div>
              </div>
              <div className="relative">
                <Input
                  id="cbsPadrao"
                  type="number"
                  step="0.01"
                  value={config.cbsPadrao}
                  onChange={(e) => handleInputChange('cbsPadrao', e.target.value)}
                  className="pr-8 font-mono font-medium"
                />
                <span className="absolute right-3 top-2.5 text-sm text-slate-400 font-semibold">
                  %
                </span>
              </div>
            </div>

            {/* Campo IBS Padrão */}
            <div className="min-w-0 w-full">
              <div className="flex justify-between items-center mb-1.5 flex-wrap gap-1">
                <Label
                  htmlFor="ibsPadrao"
                  className="text-xs sm:text-sm font-medium break-words leading-snug text-slate-700"
                >
                  IBS Padrão (Estados/Municípios)
                </Label>
                <div className="flex items-center gap-1.5">
                  {config.etiquetasOrigem?.ibsPadrao && (
                    <span
                      title="Origem do valor via assistente legal"
                      className="text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded"
                    >
                      {config.etiquetasOrigem.ibsPadrao}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">ICMS/ISS</span>
                </div>
              </div>
              <div className="relative">
                <Input
                  id="ibsPadrao"
                  type="number"
                  step="0.01"
                  value={config.ibsPadrao}
                  onChange={(e) => handleInputChange('ibsPadrao', e.target.value)}
                  className="pr-8 font-mono font-medium"
                />
                <span className="absolute right-3 top-2.5 text-sm text-slate-400 font-semibold">
                  %
                </span>
              </div>
            </div>

            {/* Campo Total IVA Dual */}
            <div className="pt-2 border-t border-slate-100 min-w-0 w-full">
              <div className="flex justify-between items-center mb-1.5 flex-wrap gap-1">
                <Label
                  htmlFor="totalIvaDual"
                  className="text-xs sm:text-sm font-bold break-words leading-snug text-[#07132B]"
                >
                  Total IVA Dual (CBS + IBS)
                </Label>
                <div className="flex items-center gap-1.5">
                  {config.etiquetasOrigem?.totalIvaDual ? (
                    <span
                      title="Origem do valor via assistente legal"
                      className="text-[10px] font-bold text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/50 px-1.5 py-0.5 rounded"
                    >
                      {config.etiquetasOrigem.totalIvaDual}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-[#D4AF37]">Alíquota Cheia</span>
                  )}
                </div>
              </div>
              <div className="relative">
                <Input
                  id="totalIvaDual"
                  type="number"
                  step="0.01"
                  value={config.totalIvaDual}
                  onChange={(e) => handleInputChange('totalIvaDual', e.target.value)}
                  className="pr-8 font-mono font-bold bg-amber-50/50 border-[#D4AF37]/50 text-[#07132B]"
                />
                <span className="absolute right-3 top-2.5 text-sm text-[#07132B] font-bold">%</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs text-blue-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <Info className="w-3.5 h-3.5 shrink-0" />
                Princípio do Destino
              </div>
              <p>
                A tributação ocorre inteiramente no local de consumo com split payment e
                creditamento irrestrito.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Alíquotas Efetivas por Faixa Legal */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2ECC71] tracking-wider uppercase">
                LC 214/2025 · Faixas Legais
              </span>
              <Zap className="w-5 h-5 text-[#2ECC71]" />
            </div>
            <CardTitle className="text-lg font-heading text-[#07132B]">
              Alíquotas Efetivas por Faixa Legal
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Valores por faixa (−60% · −30% · zero), preenchidos pelo Preset por Setor — todos
              editáveis
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {/* Faixa -60% */}
            <div className="min-w-0 w-full">
              <div className="flex justify-between items-center mb-1.5 flex-wrap gap-1">
                <Label
                  htmlFor="saudeEducacaoAliquota"
                  className="text-xs sm:text-sm font-medium break-words leading-snug text-slate-700"
                >
                  Faixa com Redução de 60%
                </Label>
                <div className="flex items-center gap-1.5">
                  {config.etiquetasOrigem?.saudeEducacaoAliquota ? (
                    <span
                      title="Origem do valor via assistente legal"
                      className="text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded"
                    >
                      {config.etiquetasOrigem.saudeEducacaoAliquota}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      Redução 60%
                    </span>
                  )}
                </div>
              </div>
              <div className="relative">
                <Input
                  id="saudeEducacaoAliquota"
                  type="number"
                  step="0.01"
                  value={config.saudeEducacaoAliquota}
                  onChange={(e) => handleInputChange('saudeEducacaoAliquota', e.target.value)}
                  className="pr-8 font-mono font-medium"
                />
                <span className="absolute right-3 top-2.5 text-sm text-slate-400 font-semibold">
                  %
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Saúde, educação, medicamentos, dispositivos médicos, alimentação humana, insumos
                agropecuários, produções artísticas/culturais/desportivas, segurança nacional (arts.
                128–134).
              </p>
            </div>

            {/* Faixa -30% */}
            <div className="min-w-0 w-full">
              <div className="flex justify-between items-center mb-1.5 flex-wrap gap-1">
                <Label
                  htmlFor="transporteAliquota"
                  className="text-xs sm:text-sm font-medium break-words leading-snug text-slate-700"
                >
                  Faixa com Redução de 30%
                </Label>
                <div className="flex items-center gap-1.5">
                  {config.etiquetasOrigem?.transporteAliquota ? (
                    <span
                      title="Origem do valor via assistente legal"
                      className="text-[10px] font-medium text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded"
                    >
                      {config.etiquetasOrigem.transporteAliquota}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      Redução 30%
                    </span>
                  )}
                </div>
              </div>
              <div className="relative">
                <Input
                  id="transporteAliquota"
                  type="number"
                  step="0.01"
                  value={config.transporteAliquota}
                  onChange={(e) => handleInputChange('transporteAliquota', e.target.value)}
                  className="pr-8 font-mono font-medium"
                />
                <span className="absolute right-3 top-2.5 text-sm text-slate-400 font-semibold">
                  %
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Profissões intelectuais regulamentadas (art. 132).
              </p>
            </div>

            {/* Faixa Alíquota Zero */}
            <div className="min-w-0 w-full">
              <div className="flex justify-between items-center mb-1.5 flex-wrap gap-1">
                <Label
                  htmlFor="cestaBasicaIsencao"
                  className="text-xs sm:text-sm font-medium break-words leading-snug text-slate-700"
                >
                  Faixa com Alíquota Zero (0%)
                </Label>
                <div className="flex items-center gap-1.5">
                  {config.etiquetasOrigem?.cestaBasicaIsencao ? (
                    <span
                      title="Origem do valor via assistente legal"
                      className="text-[10px] font-medium text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded"
                    >
                      {config.etiquetasOrigem.cestaBasicaIsencao}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      Alíquota Zero
                    </span>
                  )}
                </div>
              </div>
              <div className="relative">
                <Input
                  id="cestaBasicaIsencao"
                  type="number"
                  step="0.01"
                  value={config.cestaBasicaIsencao}
                  onChange={(e) => handleInputChange('cestaBasicaIsencao', e.target.value)}
                  className="pr-8 font-mono font-medium bg-emerald-50/50"
                />
                <span className="absolute right-3 top-2.5 text-sm text-slate-400 font-semibold">
                  %
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Cesta Básica Nacional, hortícolas/frutas/ovos, medicamentos essenciais (Anexo XII),
                dispositivos de acessibilidade PcD (arts. 8º, 129 e 146).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Sistema Antigo */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 tracking-wider uppercase">
                Sistema Atual
              </span>
              <CheckCircle2 className="w-5 h-5 text-slate-600" />
            </div>
            <CardTitle className="text-lg font-heading text-[#07132B]">
              Regimes Antigos de Referência
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Taxas nominais de Lucro Real e Lucro Presumido para o comparativo direto.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {/* Lucro Real */}
            <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2.5">
              <span className="text-xs font-bold text-slate-900 block border-b pb-1">
                Lucro Real (Não-cumulativo)
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="min-w-0 w-full">
                  <Label
                    htmlFor="lucroRealPis"
                    className="text-xs sm:text-sm font-medium break-words leading-snug text-slate-600"
                  >
                    PIS:
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="lucroRealPis"
                      type="number"
                      step="0.01"
                      value={config.lucroRealPis}
                      onChange={(e) => handleInputChange('lucroRealPis', e.target.value)}
                      className="h-8 text-xs pr-6 font-mono"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-400">%</span>
                  </div>
                </div>
                <div className="min-w-0 w-full">
                  <Label
                    htmlFor="lucroRealCofins"
                    className="text-xs sm:text-sm font-medium break-words leading-snug text-slate-600"
                  >
                    COFINS:
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="lucroRealCofins"
                      type="number"
                      step="0.01"
                      value={config.lucroRealCofins}
                      onChange={(e) => handleInputChange('lucroRealCofins', e.target.value)}
                      className="h-8 text-xs pr-6 font-mono"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-400">%</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                <div className="min-w-0 w-full">
                  <Label
                    htmlFor="lucroRealIpi"
                    className="text-xs sm:text-sm font-medium break-words leading-snug text-slate-600"
                  >
                    IPI:
                  </Label>
                  <Input
                    id="lucroRealIpi"
                    type="number"
                    step="0.1"
                    value={config.lucroRealIpi}
                    onChange={(e) => handleInputChange('lucroRealIpi', e.target.value)}
                    className="h-7 text-xs font-mono"
                  />
                </div>
                <div className="min-w-0 w-full">
                  <Label
                    htmlFor="lucroRealIcms"
                    className="text-xs sm:text-sm font-medium break-words leading-snug text-slate-600"
                  >
                    ICMS:
                  </Label>
                  <Input
                    id="lucroRealIcms"
                    type="number"
                    step="0.1"
                    value={config.lucroRealIcms}
                    onChange={(e) => handleInputChange('lucroRealIcms', e.target.value)}
                    className="h-7 text-xs font-mono"
                  />
                </div>
                <div className="min-w-0 w-full">
                  <Label
                    htmlFor="lucroRealIss"
                    className="text-xs sm:text-sm font-medium break-words leading-snug text-slate-600"
                  >
                    ISS:
                  </Label>
                  <Input
                    id="lucroRealIss"
                    type="number"
                    step="0.1"
                    value={config.lucroRealIss}
                    onChange={(e) => handleInputChange('lucroRealIss', e.target.value)}
                    className="h-7 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Lucro Presumido */}
            <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2.5">
              <span className="text-xs font-bold text-slate-900 block border-b pb-1">
                Lucro Presumido (Cumulativo)
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="min-w-0 w-full">
                  <Label
                    htmlFor="lucroPresumidoPis"
                    className="text-xs sm:text-sm font-medium break-words leading-snug text-slate-600"
                  >
                    PIS:
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="lucroPresumidoPis"
                      type="number"
                      step="0.01"
                      value={config.lucroPresumidoPis}
                      onChange={(e) => handleInputChange('lucroPresumidoPis', e.target.value)}
                      className="h-8 text-xs pr-6 font-mono"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-400">%</span>
                  </div>
                </div>
                <div className="min-w-0 w-full">
                  <Label
                    htmlFor="lucroPresumidoCofins"
                    className="text-xs sm:text-sm font-medium break-words leading-snug text-slate-600"
                  >
                    COFINS:
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="lucroPresumidoCofins"
                      type="number"
                      step="0.01"
                      value={config.lucroPresumidoCofins}
                      onChange={(e) => handleInputChange('lucroPresumidoCofins', e.target.value)}
                      className="h-8 text-xs pr-6 font-mono"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-400">%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PAINEL PRÓXIMOS PASSOS (ORIENTAÇÃO DO NOVO USUÁRIO) */}
      {onNavegarModulo && (
        <PainelProximosPassosCalculadora
          moduloAtual="modulo1"
          onNavegarModulo={onNavegarModulo}
          configuracoesPreenchidas={configuracoesPreenchidas}
          camposFaltantes={camposFaltantes}
        />
      )}

      {/* Modal de Cadastro de Novo Cliente */}
      <ModalCliente
        open={modalNovoClienteAberto}
        onOpenChange={setModalNovoClienteAberto}
        onSalvoComSucesso={async (novo) => {
          await recarregarClientes()
          selecionarClienteAtivo(novo.id)
        }}
      />

      {/* MODAL IMPORTAR FATURAMENTO EXTERNO (CSV / XLSX / CONECTORES) */}
      <ModalImportarFaturamento
        open={modalImportarFaturamentoAberto}
        onOpenChange={setModalImportarFaturamentoAberto}
        onConfirmarImportacao={handleConfirmarImportacaoFaturamento}
        valoresAtuais={{
          faturamentoMensal: config.faturamentoMensal ?? 0,
          comprasMensal:
            (config.faturamentoMensal ?? 0) * ((config.percentualComprasVendas ?? 0) / 100),
        }}
      />
    </div>
  )
}
