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
import { Sliders, RotateCcw, Info, CheckCircle2, ShieldCheck, Zap } from 'lucide-react'
import { BadgeOrigemPropagada } from '@/components/calculadora/BadgeOrigemPropagada'
import {
  AnoTransicaoIbsCbs,
  PresetSetorIbsCbs,
  CRONOGRAMA_FASES_TRANSICAO,
  LISTA_ANOS_TRANSICAO,
  PRESETS_SETORES_LC214,
} from '@/types/calculadoraIbsCbs'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { ModalCliente } from '@/components/clientes/ModalCliente'
import { Badge } from '@/components/ui/badge'

export default function Modulo1Configuracoes() {
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
  const [modalNovoClienteAberto, setModalNovoClienteAberto] = React.useState(false)

  const handleInputChange = (field: keyof typeof config, value: string) => {
    const limpo = value.replace(',', '.')
    const parsed = parseFloat(limpo)
    if (!isNaN(parsed)) {
      updateConfig({ [field]: parsed })
    }
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
                  className="text-xs font-bold text-slate-200 uppercase tracking-wider cursor-pointer"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Seletor 1: Ano da Transição (Ano atual + 2026–2033) — SEM ÍCONES NAS OPÇÕES (REGRA DO PROJETO) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="seletorAnoTransicao" className="text-xs font-bold text-[#07132B]">
                  Ano da Transição
                </Label>
                <span className="text-[11px] font-medium text-slate-500">
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
                    const dados = CRONOGRAMA_FASES_TRANSICAO[ano]
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
                <span>Fase selecionada: {CRONOGRAMA_FASES_TRANSICAO[anoAtual]?.fase}</span>
                <span className="font-mono font-bold text-[#07132B]">
                  Total IBS/CBS: {CRONOGRAMA_FASES_TRANSICAO[anoAtual]?.totalIvaDual.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Seletor 2: Regime Aplicado (Preset por Setor) — SEM ÍCONES NAS OPÇÕES (REGRA DO PROJETO) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="seletorPresetSetor" className="text-xs font-bold text-[#07132B]">
                  Regime Aplicado (Preset por Setor)
                </Label>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Aplica reduções de uma vez
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
                    {presetAtivoObj?.baseLegal || 'Redução legal aplicada'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Parâmetros Operacionais Base para Propagação Automática aos Módulos 2, 3, 5 e Dashboard */}
          <div className="pt-2 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Regime Atual da Empresa */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="regimeAtualEmpresaM1" className="text-xs font-bold text-[#07132B]">
                  Regime Atual da Empresa
                </Label>
                {config.etiquetasOrigem?.regimeAtualEmpresa ? (
                  <BadgeOrigemPropagada origem="dados-empresa" />
                ) : (
                  <span className="text-[10px] text-slate-500 font-medium">
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
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="fatMensalM1" className="text-xs font-bold text-[#07132B]">
                  Faturamento Mensal (R$)
                </Label>
                <span className="text-[10px] text-slate-500 font-medium">
                  Propaga aos Módulos 2, 3 e 5
                </span>
              </div>
              <Input
                id="fatMensalM1"
                type="text"
                value={(config.faturamentoMensal ?? 200000).toLocaleString('pt-BR', {
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
                Receita operacional mensal de referência.
              </span>
            </div>

            {/* % de Compras sobre Vendas */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="pctComprasM1" className="text-xs font-bold text-[#07132B]">
                  % de Compras sobre Vendas
                </Label>
                <span className="text-[10px] text-slate-500 font-medium">
                  Propaga aos Módulos 2 e 3
                </span>
              </div>
              <div className="relative">
                <Input
                  id="pctComprasM1"
                  type="number"
                  min="0"
                  max="100"
                  value={config.percentualComprasVendas ?? 40}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    updateConfig({ percentualComprasVendas: v })
                  }}
                  className="h-11 bg-white border-slate-300 text-[#07132B] font-mono font-bold shadow-sm pr-9"
                />
                <span className="absolute right-3.5 top-3 text-slate-400 font-bold text-xs">%</span>
              </div>
              <span className="text-[11px] text-slate-500 block leading-tight">
                Percentual médio de insumos e compras tributáveis.
              </span>
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
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label htmlFor="cbsPadrao" className="text-sm font-semibold text-slate-700">
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
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label htmlFor="ibsPadrao" className="text-sm font-semibold text-slate-700">
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
            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center mb-1.5">
                <Label htmlFor="totalIvaDual" className="text-sm font-bold text-[#07132B]">
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
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label
                  htmlFor="saudeEducacaoAliquota"
                  className="text-sm font-semibold text-slate-700"
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
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label
                  htmlFor="transporteAliquota"
                  className="text-sm font-semibold text-slate-700"
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
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label
                  htmlFor="cestaBasicaIsencao"
                  className="text-sm font-semibold text-slate-700"
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
                <div>
                  <Label htmlFor="lucroRealPis" className="text-[11px] text-slate-600">
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
                <div>
                  <Label htmlFor="lucroRealCofins" className="text-[11px] text-slate-600">
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
                <div>
                  <Label htmlFor="lucroRealIpi" className="text-[10px] text-slate-600">
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
                <div>
                  <Label htmlFor="lucroRealIcms" className="text-[10px] text-slate-600">
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
                <div>
                  <Label htmlFor="lucroRealIss" className="text-[10px] text-slate-600">
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
                <div>
                  <Label htmlFor="lucroPresumidoPis" className="text-[11px] text-slate-600">
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
                <div>
                  <Label htmlFor="lucroPresumidoCofins" className="text-[11px] text-slate-600">
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

      {/* Modal de Cadastro de Novo Cliente */}
      <ModalCliente
        open={modalNovoClienteAberto}
        onOpenChange={setModalNovoClienteAberto}
        onSalvoComSucesso={async (novo) => {
          await recarregarClientes()
          selecionarClienteAtivo(novo.id)
        }}
      />
    </div>
  )
}
