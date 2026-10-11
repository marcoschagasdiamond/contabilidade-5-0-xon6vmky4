import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import { DadosEmpresaPerfil, DADOS_EMPRESA_PADRAO } from '@/types/dadosEmpresa'
import {
  TipoAtividade,
  SubatividadeServico,
  SubatividadeIndustria,
  SubatividadeComercio,
  SUBATIVIDADES_SERVICO,
  SUBATIVIDADES_INDUSTRIA,
  SUBATIVIDADES_COMERCIO,
  LISTA_UFS_ICMS,
} from '@/types/calculadoraIbsCbs'
import {
  SegmentoEmpresa,
  LISTA_SEGMENTOS,
  CIDADES_ISS_MAPA,
  RegimeAtualEmpresa,
  obterAliquotaISS,
  obterAliquotaIcmsUf,
} from '@/lib/regimes'
import { ANOS_SIMULACAO_DISPONIVEIS, AnoBaseSimulacao } from '@/lib/reformaTributaria'
import { formatarCNPJ, limparCNPJ } from '@/lib/cnpj'
import { formatarMoeda, formatarPorcentagem } from '@/lib/calculadoraUtils'
import { DiamondHeader, DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Building2,
  Save,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Calculator,
  Scale,
  Coins,
  Calendar,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  Percent,
  Receipt,
  Users,
  LineChart,
  Globe2,
  MapPin,
  Tag,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'

export default function DadosEmpresa() {
  const navigate = useNavigate()
  const { dadosEmpresa, temDadosSalvos, salvar, restaurarPadrao } = useDadosEmpresa()

  // Estado local do formulário
  const [formData, setFormData] = useState<DadosEmpresaPerfil>(dadosEmpresa)
  const [salvoComSucesso, setSalvoComSucesso] = useState(false)

  // Sincroniza quando os dados do contexto mudarem
  useEffect(() => {
    setFormData(dadosEmpresa)
  }, [dadosEmpresa])

  // Handlers monetários
  const handleFaturamentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const valor = Number(raw) / 100
    setFormData((prev) => ({ ...prev, faturamentoMensal: valor }))
  }

  const handleFolhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const valor = Number(raw) / 100
    setFormData((prev) => ({ ...prev, folhaPagamentoMensal: valor }))
  }

  const handleDespesasCreditosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const valor = Number(raw) / 100
    setFormData((prev) => ({ ...prev, despesasComCreditosMensais: valor }))
  }

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatarCNPJ(e.target.value)
    setFormData((prev) => ({ ...prev, cnpj: formatted }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    salvar(formData)
    setSalvoComSucesso(true)
    setTimeout(() => setSalvoComSucesso(false), 4000)
  }

  const handleRestaurar = () => {
    if (window.confirm('Deseja restaurar os valores padrão sugeridos pela Contabilidade 5.0?')) {
      restaurarPadrao()
      setFormData(DADOS_EMPRESA_PADRAO)
      setSalvoComSucesso(true)
      setTimeout(() => setSalvoComSucesso(false), 3000)
    }
  }

  // Cálculos rápidos informativos
  const faturamentoAnual = formData.faturamentoMensal * 12
  const folhaAnual = formData.folhaPagamentoMensal * 12
  const fatorR =
    formData.faturamentoMensal > 0
      ? (formData.folhaPagamentoMensal / formData.faturamentoMensal) * 100
      : 0
  const aliqIcmsUf = obterAliquotaIcmsUf(formData.ufOrigem)
  const infoCidade = obterAliquotaISS(formData.cidade)

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* HEADER DIAMOND GROUP */}
      <DiamondHeader
        badge="DIAMOND GROUP • CADASTRO OPERACIONAL ÚNICO"
        titulo="Dados da Empresa"
        subtitulo="Preencha uma única vez os dados operacionais e parâmetros fiscais da sua empresa. Eles alimentam instantaneamente o Diagnóstico Tributário, a Calculadora Simples, o Comparativo de Regimes, o Simulador de Créditos e a Transição 2026–2033."
        mostrarVoltar={true}
        mostrarDiagnosticoBtn={true}
      />

      {/* BARRA SUPERIOR DE KPI RÁPIDO */}
      <div className="bg-[#0A140F] text-white border-b border-[#D4AF37]/30 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2ECC71] animate-pulse" />
            <span className="font-bold text-slate-200">Perfil Global:</span>
            <span className="text-[#D4AF37] font-semibold">
              {temDadosSalvos
                ? 'Ativo e sincronizado com os 5 módulos'
                : 'Utilizando parâmetros padrão da plataforma'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <span>
              Faturamento Anual:{' '}
              <strong className="text-white font-mono">{formatarMoeda(faturamentoAnual)}</strong>
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline">
              Fator R Estimado:{' '}
              <strong
                className={`font-mono ${fatorR >= 28 ? 'text-emerald-400' : 'text-amber-400'}`}
              >
                {fatorR.toFixed(1)}% ({fatorR >= 28 ? 'Anexo III' : 'Anexo V'})
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* FEEDBACK DE SUCESSO FLUTUANTE / FIXO */}
      {salvoComSucesso && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-lg border border-emerald-400 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-white shrink-0" />
              <div>
                <strong className="block text-sm font-bold">
                  Dados da Empresa salvos com sucesso!
                </strong>
                <span className="text-xs text-emerald-100">
                  Diagnóstico Tributário, Calculadora Simples, Comparativo de Regimes, Créditos e
                  Transição já foram atualizados com seus valores.
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/calculadora-ibs-cbs')}
              className="bg-white text-emerald-800 hover:bg-emerald-50 border-white shrink-0 font-bold"
            >
              Ir para Calculadora
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* BANNER EXPLICATIVO / HUB DE MÓDULOS ALIMENTADOS */}
          <div className="bg-gradient-to-r from-[#07132B] via-[#0D1D3A] to-[#07132B] rounded-2xl p-6 sm:p-8 text-white border border-[#D4AF37]/40 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  Alimentação Automática Multi-Módulos
                </div>
                {formData.atualizadoEm && (
                  <span className="text-xs text-slate-400">
                    Última sincronização: {new Date(formData.atualizadoEm).toLocaleString('pt-BR')}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-white">
                  Um único formulário. Cinco motores alimentados.
                </h2>
                <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
                  Evite digitar os mesmos dados repetidas vezes. Ao salvar o perfil abaixo, todos os
                  módulos a seguir iniciarão automaticamente com os dados da sua empresa:
                </p>
              </div>

              {/* Badges dos 5 módulos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
                {[
                  {
                    titulo: 'Diagnóstico Tributário',
                    rota: '/diagnostico',
                    icon: FileSpreadsheet,
                    desc: 'Wizard & Relatório PDF',
                  },
                  {
                    titulo: 'Calculadora Simples',
                    rota: '/calculadora-ibs-cbs',
                    icon: Calculator,
                    desc: 'Operação Unitária',
                  },
                  {
                    titulo: 'Comparativo de Regimes',
                    rota: '/calculadora-ibs-cbs',
                    icon: Scale,
                    desc: 'Matriz 4 Cenários',
                  },
                  {
                    titulo: 'Simulador de Créditos',
                    rota: '/calculadora-ibs-cbs',
                    icon: Coins,
                    desc: 'Não-Cumulatividade 26,5%',
                  },
                  {
                    titulo: 'Transição 2026–2033',
                    rota: '/calculadora-ibs-cbs',
                    icon: Calendar,
                    desc: 'Cronograma 8 Anos',
                  },
                ].map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={idx}
                      className="bg-white/10 border border-white/10 rounded-xl p-3 flex flex-col justify-between hover:bg-white/15 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-xs font-bold text-white truncate">{item.titulo}</span>
                      </div>
                      <span className="text-[11px] text-slate-300">{item.desc}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BLOCO 1: DADOS OPERACIONAIS DA EMPRESA */}
          {/* ========================================================================= */}
          <Card className="border border-slate-200/90 shadow-md overflow-hidden bg-white rounded-2xl">
            <div className="bg-slate-50 border-b border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#07132B]" />
                  Bloco Obrigatório
                </span>
                <h3 className="text-xl font-heading font-extrabold text-[#07132B]">
                  1. Dados operacionais da empresa
                </h3>
                <p className="text-xs text-slate-500">
                  Base comercial, faturamento bruto mensal, cadeia de compras, setor e localidade.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                Faturamento: {formatarMoeda(formData.faturamentoMensal)}/mês
              </span>
            </div>

            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Linha 0: Identificação opcional da empresa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-2">
                  <Label htmlFor="nomeEmpresa" className="text-sm font-bold text-[#07132B]">
                    Nome / Razão Social da Empresa (opcional)
                  </Label>
                  <Input
                    id="nomeEmpresa"
                    type="text"
                    value={formData.nomeEmpresa || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, nomeEmpresa: e.target.value }))
                    }
                    placeholder="Ex: Grupo Alpha Comércio & Tecnologia Ltda"
                    className="h-12 bg-white border-slate-300 font-medium"
                  />
                  <span className="text-[11px] text-slate-500">
                    Utilizado para personalizar seu diagnóstico e relatórios.
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cnpjEmpresa" className="text-sm font-bold text-[#07132B]">
                      CNPJ (opcional)
                    </Label>
                    <span className="text-[11px] text-slate-400">14 dígitos</span>
                  </div>
                  <Input
                    id="cnpjEmpresa"
                    type="text"
                    value={formData.cnpj || ''}
                    onChange={handleCnpjChange}
                    maxLength={18}
                    placeholder="00.000.000/0000-00"
                    className="h-12 bg-white border-slate-300 font-mono font-medium"
                  />
                  <span className="text-[11px] text-slate-500">
                    Facilita o preenchimento automático no Diagnóstico Tributário.
                  </span>
                </div>
              </div>

              {/* Linha 1: Faturamento, % de Compras sobre Vendas e O Que Vende (Ramo) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Campo 1.1: Faturamento Mensal */}
                <div className="space-y-2">
                  <Label htmlFor="fatMensal" className="text-sm font-bold text-[#07132B]">
                    Faturamento Mensal (R$) *
                  </Label>
                  <Input
                    id="fatMensal"
                    type="text"
                    value={formData.faturamentoMensal.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                    onChange={handleFaturamentoChange}
                    className="text-lg font-bold font-mono text-[#07132B] bg-white border-slate-300 h-12 shadow-sm"
                  />
                  <span className="text-[11px] text-slate-500 block">
                    Receita bruta mensal. RBT12 calculada:{' '}
                    <strong>{formatarMoeda(faturamentoAnual)}</strong>.
                  </span>
                </div>

                {/* Campo 1.2: % de Compras sobre Vendas */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="pctCompras" className="text-sm font-bold text-[#07132B]">
                      % de Compras sobre Vendas *
                    </Label>
                    <span className="text-xs font-mono font-bold text-[#D4AF37] bg-[#07132B] px-2 py-0.5 rounded">
                      {formData.percentualComprasVendas}%
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      id="pctCompras"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.percentualComprasVendas}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          percentualComprasVendas: Number(e.target.value),
                        }))
                      }
                      className="text-lg font-bold font-mono text-[#07132B] bg-white border-slate-300 h-12 shadow-sm pr-10"
                    />
                    <span className="absolute right-4 top-3 text-slate-400 font-bold">%</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    Insumos e mercadorias que geram crédito no IVA Dual e Lucro Real.
                  </span>
                </div>

                {/* Campo 1.3: O que vende (Ramo) */}
                <div className="space-y-2">
                  <Label htmlFor="tipoAtividade" className="text-sm font-bold text-[#07132B]">
                    O Que Vende (Ramo) *
                  </Label>
                  <Select
                    value={formData.tipoAtividade}
                    onValueChange={(val) =>
                      setFormData((prev) => ({ ...prev, tipoAtividade: val as TipoAtividade }))
                    }
                  >
                    <SelectTrigger
                      id="tipoAtividade"
                      className="h-12 bg-white border-slate-300 shadow-sm font-medium text-slate-800"
                    >
                      <SelectValue placeholder="Selecione o ramo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="servico">Serviço (ISS / Presunção 32% ou 16%)</SelectItem>
                      <SelectItem value="comercio">
                        Comércio (ICMS / ICMS-ST / Presunção 8%)
                      </SelectItem>
                      <SelectItem value="industria">
                        Indústria (IPI / Imposto Seletivo / Presunção 8%)
                      </SelectItem>
                      <SelectItem value="misto">
                        Misto (Serviço + Comércio com proporção customizada)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-[11px] text-slate-500 block">
                    Define regras incidentes (ISS, IPI, ICMS) e o Anexo do Simples.
                  </span>
                </div>
              </div>

              {/* SELETOR DE SUBATIVIDADE CONFORME O RAMO ESCOLHIDO */}
              <div className="p-4 sm:p-5 rounded-2xl border bg-slate-50/70 border-slate-200">
                {formData.tipoAtividade === 'servico' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="subServico"
                        className="text-sm font-bold text-[#07132B] flex items-center gap-2"
                      >
                        <Tag className="w-4 h-4 text-[#D4AF37]" />
                        Subatividade de Serviço (Presunção IRPJ/CSLL & Reduções IBS/CBS) *
                      </Label>
                      <span className="text-xs text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full font-semibold border border-blue-200">
                        5 perfis regulatórios
                      </span>
                    </div>
                    <Select
                      value={formData.subatividadeServico}
                      onValueChange={(val) =>
                        setFormData((prev) => ({
                          ...prev,
                          subatividadeServico: val as SubatividadeServico,
                        }))
                      }
                    >
                      <SelectTrigger
                        id="subServico"
                        className="h-12 bg-white border-blue-300 font-medium"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBATIVIDADES_SERVICO.map((item) => (
                          <SelectItem key={item.id} value={item.id} className="py-2">
                            <div>
                              <span className="font-bold text-slate-900 block">{item.label}</span>
                              <span className="text-xs text-slate-500 block">{item.descricao}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.tipoAtividade === 'industria' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="subIndustria"
                        className="text-sm font-bold text-[#07132B] flex items-center gap-2"
                      >
                        <Tag className="w-4 h-4 text-[#D4AF37]" />
                        Subatividade Industrial (IPI & Imposto Seletivo) *
                      </Label>
                      <span className="text-xs text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full font-semibold border border-amber-200">
                        Ajusta alíquotas industriais
                      </span>
                    </div>
                    <Select
                      value={formData.subatividadeIndustria}
                      onValueChange={(val) =>
                        setFormData((prev) => ({
                          ...prev,
                          subatividadeIndustria: val as SubatividadeIndustria,
                        }))
                      }
                    >
                      <SelectTrigger
                        id="subIndustria"
                        className="h-12 bg-white border-amber-300 font-medium"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBATIVIDADES_INDUSTRIA.map((item) => (
                          <SelectItem key={item.id} value={item.id} className="py-2">
                            <div>
                              <span className="font-bold text-slate-900 block">{item.label}</span>
                              <span className="text-xs text-slate-500 block">{item.descricao}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.tipoAtividade === 'comercio' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="subComercio"
                        className="text-sm font-bold text-[#07132B] flex items-center gap-2"
                      >
                        <Tag className="w-4 h-4 text-[#D4AF37]" />
                        Subatividade de Comércio (ICMS Próprio vs ICMS-ST / Atacado) *
                      </Label>
                      <span className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
                        Presunção de 8%
                      </span>
                    </div>
                    <Select
                      value={formData.subatividadeComercio}
                      onValueChange={(val) =>
                        setFormData((prev) => ({
                          ...prev,
                          subatividadeComercio: val as SubatividadeComercio,
                        }))
                      }
                    >
                      <SelectTrigger
                        id="subComercio"
                        className="h-12 bg-white border-emerald-300 font-medium"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBATIVIDADES_COMERCIO.map((item) => (
                          <SelectItem key={item.id} value={item.id} className="py-2">
                            <div>
                              <span className="font-bold text-slate-900 block">{item.label}</span>
                              <span className="text-xs text-slate-500 block">{item.descricao}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.tipoAtividade === 'misto' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-bold text-[#07132B] flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#D4AF37]" />
                        Proporção no Ramo Misto:
                      </Label>
                      <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded">
                        {formData.proporcaoServicoMisto}% Serviço |{' '}
                        {100 - formData.proporcaoServicoMisto}% Comércio
                      </span>
                    </div>
                    <Slider
                      value={[formData.proporcaoServicoMisto]}
                      min={0}
                      max={100}
                      step={5}
                      onValueChange={(val) =>
                        setFormData((prev) => ({ ...prev, proporcaoServicoMisto: val[0] }))
                      }
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200">
                        <Label className="text-xs font-bold text-slate-800">
                          Subatividade da parte de Serviço:
                        </Label>
                        <Select
                          value={formData.subatividadeServico}
                          onValueChange={(val) =>
                            setFormData((prev) => ({
                              ...prev,
                              subatividadeServico: val as SubatividadeServico,
                            }))
                          }
                        >
                          <SelectTrigger className="h-10 text-xs font-medium">
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

                      <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200">
                        <Label className="text-xs font-bold text-slate-800">
                          Subatividade da parte de Comércio:
                        </Label>
                        <Select
                          value={formData.subatividadeComercio}
                          onValueChange={(val) =>
                            setFormData((prev) => ({
                              ...prev,
                              subatividadeComercio: val as SubatividadeComercio,
                            }))
                          }
                        >
                          <SelectTrigger className="h-10 text-xs font-medium">
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

              {/* Linha 2: Localidade (UF de Origem + Cidade para ISS) e Segmento */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                {/* Campo 1.4: UF de Origem */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="ufOrigem"
                      className="text-sm font-bold text-[#07132B] flex items-center gap-1.5"
                    >
                      <MapPin className="w-4 h-4 text-[#D4AF37]" />
                      UF de Origem *
                    </Label>
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ICMS: {aliqIcmsUf.toFixed(1)}%
                    </span>
                  </div>
                  <Select
                    value={formData.ufOrigem}
                    onValueChange={(val) => setFormData((prev) => ({ ...prev, ufOrigem: val }))}
                  >
                    <SelectTrigger
                      id="ufOrigem"
                      className="h-12 bg-white border-slate-300 font-medium text-slate-800"
                    >
                      <SelectValue placeholder="Selecione a UF" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {LISTA_UFS_ICMS.map((item) => (
                        <SelectItem key={item.uf} value={item.uf}>
                          {item.uf} — {item.nome} ({item.aliquotaInternaPadrao.toFixed(1)}% ICMS)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-[11px] text-slate-500 block">
                    Define a alíquota interna oficial de ICMS estadual.
                  </span>
                </div>

                {/* Campo 1.5: Cidade (se aplicável ao ISS) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="cidadeIss"
                      className="text-sm font-bold text-[#07132B] flex items-center gap-1.5"
                    >
                      <Building2 className="w-4 h-4 text-[#D4AF37]" />
                      Cidade (ISS Municipal) *
                    </Label>
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ISS: {infoCidade.aliquota.toFixed(1)}%
                    </span>
                  </div>
                  <Select
                    value={formData.cidade}
                    onValueChange={(val) => setFormData((prev) => ({ ...prev, cidade: val }))}
                  >
                    <SelectTrigger
                      id="cidadeIss"
                      className="h-12 bg-white border-slate-300 font-medium text-slate-800"
                    >
                      <SelectValue placeholder="Selecione a cidade" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {CIDADES_ISS_MAPA.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.descricao ||
                            `${item.nome}/${item.uf} (${item.aliquota.toFixed(1)}%)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-[11px] text-slate-500 block">
                    Alíquota municipal de ISS para serviços e transporte.
                  </span>
                </div>

                {/* Campo 1.6: Segmento */}
                <div className="space-y-2">
                  <Label htmlFor="segmento" className="text-sm font-bold text-[#07132B]">
                    Segmento de Atuação *
                  </Label>
                  <Select
                    value={formData.segmento}
                    onValueChange={(val) =>
                      setFormData((prev) => ({ ...prev, segmento: val as SegmentoEmpresa }))
                    }
                  >
                    <SelectTrigger
                      id="segmento"
                      className="h-12 bg-white border-slate-300 font-medium text-slate-800"
                    >
                      <SelectValue placeholder="Selecione o segmento" />
                    </SelectTrigger>
                    <SelectContent>
                      {LISTA_SEGMENTOS.map((seg) => (
                        <SelectItem key={seg} value={seg}>
                          {seg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-[11px] text-slate-500 block">
                    Segmento econômico aplicado ao Diagnóstico Tributário.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ========================================================================= */}
          {/* BLOCO 2: PARÂMETROS DE ALTA PRECISÃO TRIBUTÁRIA */}
          {/* ========================================================================= */}
          <Card className="border border-slate-200/90 shadow-md overflow-hidden bg-white rounded-2xl">
            <div className="bg-slate-50 border-b border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#07132B] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                  Bloco de Alta Precisão
                </span>
                <h3 className="text-xl font-heading font-extrabold text-[#07132B]">
                  2. Parâmetros de alta precisão tributária
                </h3>
                <p className="text-xs text-slate-500">
                  Variáveis que refinam o Fator R (Simples), o Lucro Real contábil, créditos
                  operacionais e a cronologia da Reforma.
                </p>
              </div>
              <span className="text-xs font-mono font-medium text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 self-start sm:self-auto">
                Ano-base: {formData.anoBaseTransicao}
              </span>
            </div>

            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Campo 2.1: Folha de Pagamento Mensal */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="folhaMensal"
                      className="text-sm font-bold text-[#07132B] flex items-center gap-1.5"
                    >
                      <Users className="w-4 h-4 text-[#D4AF37]" />
                      Folha Mensal (com Pró-labore) *
                    </Label>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        fatorR >= 28
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      R = {fatorR.toFixed(1)}%
                    </span>
                  </div>
                  <Input
                    id="folhaMensal"
                    type="text"
                    value={formData.folhaPagamentoMensal.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                    onChange={handleFolhaChange}
                    className="text-lg font-bold font-mono text-[#07132B] bg-white border-slate-300 h-12 shadow-sm"
                  />
                  <span className="text-[11px] text-slate-500 block">
                    Folha 12m: <strong>{formatarMoeda(folhaAnual)}</strong>. Se ≥ 28%, garante Anexo
                    III.
                  </span>
                </div>

                {/* Campo 2.2: Margem de Lucro Estimada (%) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="margemLucro"
                      className="text-sm font-bold text-[#07132B] flex items-center gap-1.5"
                    >
                      <LineChart className="w-4 h-4 text-[#D4AF37]" />
                      Margem de Lucro Estimada (%) *
                    </Label>
                    <span className="text-xs font-mono font-bold text-[#D4AF37] bg-[#07132B] px-2 py-0.5 rounded">
                      {formData.margemLucroEstimada}%
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      id="margemLucro"
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={formData.margemLucroEstimada}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          margemLucroEstimada: Number(e.target.value),
                        }))
                      }
                      className="text-lg font-bold font-mono text-[#07132B] bg-white border-slate-300 h-12 shadow-sm pr-10"
                    />
                    <span className="absolute right-4 top-3 text-slate-400 font-bold">%</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    Lucro líquido contábil mensal estimado:{' '}
                    <strong>
                      {formatarMoeda(
                        (formData.faturamentoMensal * formData.margemLucroEstimada) / 100,
                      )}
                    </strong>
                    .
                  </span>
                </div>

                {/* Campo 2.3: Despesas Mensais com Créditos */}
                <div className="space-y-2">
                  <Label
                    htmlFor="despesasCreditos"
                    className="text-sm font-bold text-[#07132B] flex items-center gap-1.5"
                  >
                    <Receipt className="w-4 h-4 text-[#D4AF37]" />
                    Despesas Mensais com Créditos (R$) *
                  </Label>
                  <Input
                    id="despesasCreditos"
                    type="text"
                    value={formData.despesasComCreditosMensais.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                    onChange={handleDespesasCreditosChange}
                    className="text-lg font-bold font-mono text-[#07132B] bg-white border-slate-300 h-12 shadow-sm"
                  />
                  <span className="text-[11px] text-slate-500 block">
                    Aluguel, energia, telecom e TI (gera crédito integral no IVA Dual).
                  </span>
                </div>

                {/* Campo 2.4: % de Exportação */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="pctExportacao"
                      className="text-sm font-bold text-[#07132B] flex items-center gap-1.5"
                    >
                      <Globe2 className="w-4 h-4 text-[#D4AF37]" />% de Exportação *
                    </Label>
                    <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {formData.percentualExportacao}%
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      id="pctExportacao"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.percentualExportacao}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          percentualExportacao: Number(e.target.value),
                        }))
                      }
                      className="text-lg font-bold font-mono text-[#07132B] bg-white border-slate-300 h-12 shadow-sm pr-10"
                    />
                    <span className="absolute right-4 top-3 text-slate-400 font-bold">%</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    Receita desonerada de IBS/CBS, PIS/COFINS e ICMS com créditos mantidos.
                  </span>
                </div>

                {/* Campo 2.5: Regime Atual */}
                <div className="space-y-2">
                  <Label htmlFor="regimeAtual" className="text-sm font-bold text-[#07132B]">
                    Regime Tributário Atual *
                  </Label>
                  <Select
                    value={formData.regimeAtual}
                    onValueChange={(val) => setFormData((prev) => ({ ...prev, regimeAtual: val }))}
                  >
                    <SelectTrigger
                      id="regimeAtual"
                      className="h-12 bg-white border-slate-300 font-medium text-slate-800"
                    >
                      <SelectValue placeholder="Selecione o regime atual" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                      <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                      <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                      <SelectItem value="MEI (Microempreendedor)">
                        MEI (Microempreendedor)
                      </SelectItem>
                      <SelectItem value="Nova empresa / Ainda não optante">
                        Nova empresa / Ainda não optante
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-[11px] text-slate-500 block">
                    Base de comparação para demonstrar economia frente ao modelo atual.
                  </span>
                </div>

                {/* Campo 2.6: Ano-base da Transição (2026–2033) */}
                <div className="space-y-2">
                  <Label htmlFor="anoBase" className="text-sm font-bold text-[#07132B]">
                    Ano-base da Transição (2026–2033) *
                  </Label>
                  <Select
                    value={String(formData.anoBaseTransicao)}
                    onValueChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        anoBaseTransicao: Number(val) as AnoBaseSimulacao,
                      }))
                    }
                  >
                    <SelectTrigger
                      id="anoBase"
                      className="h-12 bg-white border-slate-300 font-medium text-slate-800"
                    >
                      <SelectValue placeholder="Selecione o ano-base" />
                    </SelectTrigger>
                    <SelectContent>
                      {ANOS_SIMULACAO_DISPONIVEIS.map((ano) => (
                        <SelectItem key={ano} value={String(ano)}>
                          {ano}{' '}
                          {ano === 2026
                            ? '— Teste Operacional 0,1%'
                            : ano === 2027
                              ? '— CBS Plena + Fim PIS/COFINS'
                              : ano === 2028
                                ? '— Consolidação CBS'
                                : ano === 2033
                                  ? '— Sistema Pleno 100%'
                                  : `— IBS ${(ano - 2028) * 10}% / ICMS ${100 - (ano - 2028) * 10}%`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-[11px] text-slate-500 block">
                    Calibra a transição federativa no Diagnóstico e no Módulo 5.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BOTÕES DE AÇÃO: SALVAR / RESTAURAR */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleRestaurar}
                className="border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold h-12"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restaurar Padrões da Plataforma
              </Button>
              {temDadosSalvos && (
                <span className="text-xs text-slate-500 hidden md:inline">
                  (Seus dados personalizados estão gravados no navegador)
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="submit"
                className="w-full sm:w-auto h-12 px-8 rounded-xl font-heading font-semibold text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_4px_14px_rgba(46,204,113,0.35)] hover:shadow-[0_6px_20px_rgba(46,204,113,0.5)] transition-all duration-200 hover:-translate-y-0.5 btn-press flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5 stroke-[2.5]" />
                <span>Salvar Dados da Empresa</span>
              </Button>
            </div>
          </div>
        </form>

        {/* ACESSO DIRETO AOS MÓDULOS DEPOIS DE SALVAR */}
        <div className="mt-12 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-heading font-bold text-lg text-[#07132B]">
              Navegar diretamente para simulação com estes dados
            </h4>
            <span className="text-xs text-slate-500">
              Todos os campos estarão pré-preenchidos automaticamente
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/diagnostico"
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#2ECC71] hover:shadow-lg transition-all group flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#145A32] group-hover:bg-[#2ECC71] group-hover:text-[#0A1A13] flex items-center justify-center shrink-0 transition-colors">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-slate-900 group-hover:text-[#145A32] transition-colors">
                    Diagnóstico Tributário Completo
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#145A32] group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Enquadramento entre Simples, Presumido e Real, relatório executivo e exportação em
                  PDF com sua folha, faturamento e créditos.
                </p>
              </div>
            </Link>

            <Link
              to="/calculadora-ibs-cbs"
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#D4AF37] hover:shadow-lg transition-all group flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-900 group-hover:bg-[#07132B] group-hover:text-[#D4AF37] flex items-center justify-center shrink-0 transition-colors">
                <Scale className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-slate-900 group-hover:text-[#07132B] transition-colors">
                    Calculadora IBS / CBS Integrada
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#07132B] group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Acesse os 6 módulos interligados (alíquotas oficiais, apuração unitária, matriz
                  dos 4 regimes, simulador de 10 créditos e transição).
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* FOOTER CTA DIAMOND */}
      <DiamondFooterCTA
        titulo="Dúvidas sobre o preenchimento ou parametrização tributária?"
        subtitulo="Nossa equipe de contadores e tributaristas pode realizar um diagnóstico assistido para identificar créditos ocultos e o melhor regime para o seu negócio."
      />
    </div>
  )
}
