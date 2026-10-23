import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  SlidersHorizontal,
  Save,
  RotateCcw,
  Building2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import { useAuth } from '@/context/AuthContext'
import { useClienteAtivo } from '@/context/ClienteAtivoContext'
import { SeletorClienteAtivo } from '@/components/clientes/SeletorClienteAtivo'
import { BadgeOrigemPropagada } from '@/components/calculadora/BadgeOrigemPropagada'
import { DiamondFooterCTA } from '@/components/reforma/DiamondLayout'
import TrilhaDiagnosticoNav from '@/components/diagnosticos/TrilhaDiagnosticoNav'
import {
  LISTA_SEGMENTOS,
  SegmentoEmpresa,
  PorteFuncionarios,
  EmissaoNotaFiscal,
  RegimeAtualEmpresa,
  CIDADES_ISS_MAPA,
  obterAliquotaISS,
  obterAliquotaIcmsUf,
  LISTA_UFS_ICMS,
} from '@/lib/regimes'
import { formatarCNPJ, limparCNPJ, validarCNPJ } from '@/lib/cnpj'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  TipoAtividade,
  SubatividadeServico,
  SubatividadeComercio,
  SubatividadeIndustria,
} from '@/types/calculadoraIbsCbs'
import { AnoBaseSimulacao } from '@/lib/reformaTributaria'
import { salvarDadosEmpresa, carregarDadosEmpresa } from '@/types/dadosEmpresa'
import { atualizarCliente } from '@/services/clientes'
import pb from '@/lib/pocketbase/client'

export default function DiagnosticoConfiguracoes() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { dadosEmpresa, salvar: salvarDadosContext, temDadosSalvos } = useDadosEmpresa()
  const { clienteAtivo, clienteAtivoId, recarregarClientes } = useClienteAtivo()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // Estado local do formulário espelhando o Módulo 1 da Calculadora e Passo 1 do Diagnóstico
  const [formData, setFormData] = useState({
    nomeContato: dadosEmpresa.nomeContato || '',
    nomeEmpresa: dadosEmpresa.nomeEmpresa || '',
    cnpj: dadosEmpresa.cnpj ? formatarCNPJ(dadosEmpresa.cnpj) : '',
    ufOrigem: dadosEmpresa.ufOrigem || 'SP',
    cidade: dadosEmpresa.cidade || 'sp-sao-paulo',
    segmento: (dadosEmpresa.segmento || 'Serviços') as SegmentoEmpresa,
    regimeAtual: (dadosEmpresa.regimeAtual || 'Simples Nacional') as RegimeAtualEmpresa | string,
    funcionarios: (dadosEmpresa.funcionarios || '1 a 5 funcionários') as PorteFuncionarios | string,
    emissaoNf: (dadosEmpresa.emissaoNf || 'Predominante para Pessoas Jurídicas (B2B)') as
      | EmissaoNotaFiscal
      | string,
    atividadeMista: dadosEmpresa.atividadeMista ?? false,
    proporcaoServicoMisto: dadosEmpresa.proporcaoServicoMisto ?? 50,
    subatividadeServico: (dadosEmpresa.subatividadeServico ||
      'servico_comum') as SubatividadeServico,
    subatividadeComercio: (dadosEmpresa.subatividadeComercio ||
      'varejo_comum') as SubatividadeComercio,
    anoBaseTransicao: (dadosEmpresa.anoBaseTransicao || 2026) as AnoBaseSimulacao,
  })

  const [salvando, setSalvando] = useState(false)
  const [salvoSucesso, setSalvoSucesso] = useState(false)
  const [erros, setErros] = useState<Record<string, string>>({})

  // Sincroniza com Cliente Ativo se selecionado na Carteira
  useEffect(() => {
    if (clienteAtivo) {
      setFormData((prev) => ({
        ...prev,
        nomeContato: clienteAtivo.nome || prev.nomeContato,
        nomeEmpresa: clienteAtivo.nome || prev.nomeEmpresa,
        cnpj: clienteAtivo.cnpj_cpf ? formatarCNPJ(clienteAtivo.cnpj_cpf) : prev.cnpj,
        ufOrigem: clienteAtivo.uf || prev.ufOrigem,
        segmento: (clienteAtivo.segmento as SegmentoEmpresa) || prev.segmento,
        regimeAtual: clienteAtivo.regime_atual || prev.regimeAtual,
      }))
    }
  }, [clienteAtivo])

  // Também sincroniza com dadosEmpresa caso mude externamente
  useEffect(() => {
    if (!clienteAtivo && temDadosSalvos) {
      setFormData((prev) => ({
        ...prev,
        nomeContato: dadosEmpresa.nomeContato || prev.nomeContato,
        nomeEmpresa: dadosEmpresa.nomeEmpresa || prev.nomeEmpresa,
        cnpj: dadosEmpresa.cnpj ? formatarCNPJ(dadosEmpresa.cnpj) : prev.cnpj,
        ufOrigem: dadosEmpresa.ufOrigem || prev.ufOrigem,
        cidade: dadosEmpresa.cidade || prev.cidade,
        segmento: dadosEmpresa.segmento || prev.segmento,
        regimeAtual: dadosEmpresa.regimeAtual || prev.regimeAtual,
        funcionarios: dadosEmpresa.funcionarios || prev.funcionarios,
        emissaoNf: dadosEmpresa.emissaoNf || prev.emissaoNf,
        atividadeMista: dadosEmpresa.atividadeMista ?? prev.atividadeMista,
        proporcaoServicoMisto: dadosEmpresa.proporcaoServicoMisto ?? prev.proporcaoServicoMisto,
        anoBaseTransicao: dadosEmpresa.anoBaseTransicao || prev.anoBaseTransicao,
      }))
    }
  }, [dadosEmpresa, temDadosSalvos, clienteAtivo])

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatado = formatarCNPJ(e.target.value)
    setFormData((prev) => ({ ...prev, cnpj: formatado }))
    if (erros.cnpj) {
      setErros((prev) => {
        const n = { ...prev }
        delete n.cnpj
        return n
      })
    }
  }

  const validarFormulario = () => {
    const novosErros: Record<string, string> = {}
    if (!formData.nomeEmpresa.trim()) {
      novosErros.nomeEmpresa = 'Informe a razão social ou nome da empresa.'
    }
    if (formData.cnpj && limparCNPJ(formData.cnpj).length > 0) {
      if (!validarCNPJ(formData.cnpj)) {
        novosErros.cnpj = 'CNPJ inválido (verifique os dígitos verificadores).'
      }
    }
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  const handleSalvar = async () => {
    if (!validarFormulario()) {
      toast({
        title: 'Verifique os campos obrigatórios',
        description: 'Por favor, corrija os erros apontados no formulário.',
        variant: 'destructive',
      })
      return
    }

    setSalvando(true)
    try {
      // 1. Atualizar contexto e localStorage Dados da Empresa (reaproveitamento bidirecional com Calculadora)
      const payloadAtualizacao = {
        nomeContato: formData.nomeContato,
        nomeEmpresa: formData.nomeEmpresa,
        cnpj: formData.cnpj,
        ufOrigem: formData.ufOrigem,
        cidade: formData.cidade,
        segmento: formData.segmento,
        regimeAtual: formData.regimeAtual,
        funcionarios: formData.funcionarios,
        emissaoNf: formData.emissaoNf,
        atividadeMista: formData.atividadeMista,
        proporcaoServicoMisto: formData.proporcaoServicoMisto,
        tipoAtividade: (formData.atividadeMista
          ? 'misto'
          : formData.segmento === 'Comércio'
            ? 'comercio'
            : formData.segmento === 'Indústria'
              ? 'industria'
              : 'servico') as TipoAtividade,
        subatividadeServico: formData.subatividadeServico,
        subatividadeComercio: formData.subatividadeComercio,
        anoBaseTransicao: formData.anoBaseTransicao,
      }

      salvarDadosEmpresa(payloadAtualizacao)
      await salvarDadosContext(payloadAtualizacao)

      // 2. Se houver cliente ativo no PocketBase, atualizar seu registro
      if (clienteAtivoId) {
        try {
          await atualizarCliente(clienteAtivoId, {
            nome: formData.nomeEmpresa,
            cnpj_cpf: limparCNPJ(formData.cnpj),
            segmento: formData.segmento,
            regime_atual: formData.regimeAtual,
            uf: formData.ufOrigem,
          })
          if (recarregarClientes) {
            await recarregarClientes()
          }
        } catch (pbErr) {
          console.warn('Aviso ao sincronizar cliente no PocketBase:', pbErr)
        }
      }

      // 3. Atualizar diagnósticos existentes do cliente ou criar/salvar snapshot de configurações
      try {
        const configSnapshot = {
          regime_atual: formData.regimeAtual,
          segmento: formData.segmento,
          atividade_mista: formData.atividadeMista,
          proporcao_servico_misto: formData.proporcaoServicoMisto,
          ano_base_transicao: formData.anoBaseTransicao,
          uf_origem: formData.ufOrigem,
          cidade: formData.cidade,
          funcionarios: formData.funcionarios,
          emissao_nf: formData.emissaoNf,
          cnpj: formData.cnpj,
          razao_social: formData.nomeEmpresa,
          nome_contato: formData.nomeContato,
        }

        // Se houver cliente ativo, atualiza o campo configuracoes_diagnostico_json nos diagnósticos vinculados
        if (clienteAtivoId) {
          const diags = await pb.collection('diagnosticos').getList(1, 10, {
            filter: `cliente_id = "${clienteAtivoId}"`,
          })
          for (const d of diags.items) {
            await pb.collection('diagnosticos').update(d.id, {
              configuracoes_diagnostico_json: configSnapshot,
            })
          }
        }
      } catch (diagErr) {
        console.warn('Aviso ao atualizar configuracoes_diagnostico_json no PocketBase:', diagErr)
      }

      setSalvoSucesso(true)
      toast({
        title: 'Configurações salvas com sucesso!',
        description:
          'Os parâmetros foram atualizados e sincronizados com a Calculadora IBS/CBS e as 4 páginas de diagnóstico.',
      })

      setTimeout(() => setSalvoSucesso(false), 4000)
    } catch (err: any) {
      console.error('Erro ao salvar configurações do diagnóstico:', err)
      toast({
        title: 'Erro ao salvar configurações',
        description: err?.message || 'Ocorreu um erro ao salvar os parâmetros.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleRestaurarPadrao = () => {
    const padrao = carregarDadosEmpresa()
    setFormData({
      nomeContato: padrao.nomeContato || '',
      nomeEmpresa: padrao.nomeEmpresa || '',
      cnpj: padrao.cnpj ? formatarCNPJ(padrao.cnpj) : '',
      ufOrigem: padrao.ufOrigem || 'SP',
      cidade: padrao.cidade || 'sp-sao-paulo',
      segmento: padrao.segmento || 'Serviços',
      regimeAtual: padrao.regimeAtual || 'Simples Nacional',
      funcionarios: padrao.funcionarios || '1 a 5 funcionários',
      emissaoNf: padrao.emissaoNf || 'Predominante para Pessoas Jurídicas (B2B)',
      atividadeMista: padrao.atividadeMista ?? false,
      proporcaoServicoMisto: padrao.proporcaoServicoMisto ?? 50,
      subatividadeServico: padrao.subatividadeServico || 'servico_comum',
      subatividadeComercio: padrao.subatividadeComercio || 'varejo_comum',
      anoBaseTransicao: padrao.anoBaseTransicao || 2026,
    })
    toast({
      title: 'Valores restaurados',
      description: 'O formulário foi restaurado com o cadastro salvo da empresa.',
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased pt-20 sm:pt-24 pb-20">
      {/* SELETOR CLIENTE ATIVO NO TOPO (MESMO DA CALCULADORA) */}
      <div className="bg-[#07132B] border-b border-[#D4AF37]/20 py-2.5 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <SeletorClienteAtivo labelCustomizado="Carteira • Cliente Ativo no Diagnóstico:" />
        </div>
      </div>

      {/* TRILHA DE NAVEGAÇÃO SUPERIOR */}
      <TrilhaDiagnosticoNav
        paginaAtual="configuracoes"
        nomeEmpresa={formData.nomeEmpresa || dadosEmpresa.nomeEmpresa}
        temDadosSalvos={temDadosSalvos}
        onRestaurarDados={handleRestaurarPadrao}
      />

      {/* HERO DA PÁGINA CONFIGURAÇÕES */}
      <section className="relative py-12 md:py-16 bg-gradient-to-r from-[#07132B] via-[#0A140F] to-[#07132B] text-white border-b border-[#D4AF37]/30 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px]"
          aria-hidden="true"
        />
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#2ECC71]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-xs font-bold text-[#D4AF37] uppercase tracking-wider backdrop-blur-md">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>CENTRAL DE CONFIGURAÇÕES • HUB DE DIAGNÓSTICOS</span>
              </div>
              <BadgeOrigemPropagada origem="configuracoes" />
            </div>

            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
              Configurações dos <span className="text-[#D4AF37]">Diagnósticos Tributários</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Defina os parâmetros centrais da empresa. Estes dados{' '}
              <strong className="text-white">propagará automaticamente</strong> para as 4 páginas de
              diagnóstico e são sincronizados bidirecionalmente com o{' '}
              <strong className="text-white">Módulo 1 da Calculadora IBS/CBS</strong> e a Carteira
              de Clientes.
            </p>
          </div>
        </div>
      </section>

      {/* CONTAINER DO FORMULÁRIO */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="bg-white rounded-[26px] p-6 sm:p-10 border border-slate-200 shadow-xl space-y-8">
          {/* SEÇÃO 1: IDENTIFICAÇÃO E CADASTRO */}
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#07132B] text-[#D4AF37] flex items-center justify-center font-bold text-xs">
                  01
                </div>
                <div>
                  <h2 className="font-heading font-extrabold text-xl text-[#07132B]">
                    Dados da Empresa & Localização
                  </h2>
                  <p className="text-xs text-slate-500">
                    Sincronizados com o cadastro do cliente ativo selecionado na Carteira.
                  </p>
                </div>
              </div>
              {clienteAtivo && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-300/60">
                  <Building2 className="w-3.5 h-3.5 text-[#2ECC71]" />
                  Cliente: {clienteAtivo.nome}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nome da Empresa */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Razão Social / Nome da Empresa *
                </label>
                <input
                  type="text"
                  value={formData.nomeEmpresa}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nomeEmpresa: e.target.value }))
                  }
                  placeholder="Ex: Diamond Tech Soluções Ltda"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
                {erros.nomeEmpresa && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{erros.nomeEmpresa}</p>
                )}
              </div>

              {/* CNPJ */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  CNPJ (com máscara)
                </label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={handleCnpjChange}
                  maxLength={18}
                  placeholder="00.000.000/0000-00"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37] font-mono"
                />
                {erros.cnpj && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{erros.cnpj}</p>
                )}
              </div>

              {/* Nome do Contato / Sócio */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contato / Responsável
                </label>
                <input
                  type="text"
                  value={formData.nomeContato}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nomeContato: e.target.value }))
                  }
                  placeholder="Ex: Carlos Eduardo Silva"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              {/* UF & Cidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    UF de Origem (ICMS: {obterAliquotaIcmsUf(formData.ufOrigem).toFixed(1)}%)
                  </label>
                  <select
                    value={formData.ufOrigem}
                    onChange={(e) => {
                      const novaUf = e.target.value
                      setFormData((prev) => {
                        const cidadeAtual = CIDADES_ISS_MAPA.find((c) => c.id === prev.cidade)
                        const cidadeValida =
                          cidadeAtual && (cidadeAtual.uf === novaUf || cidadeAtual.id === 'outra')
                        return {
                          ...prev,
                          ufOrigem: novaUf,
                          cidade: cidadeValida ? prev.cidade : 'outra',
                        }
                      })
                    }}
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  >
                    {LISTA_UFS_ICMS.map((ufItem) => (
                      <option key={ufItem.uf} value={ufItem.uf}>
                        {ufItem.uf} — {ufItem.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Cidade / ISS ({obterAliquotaISS(formData.cidade).aliquota.toFixed(1)}%)
                  </label>
                  <select
                    value={formData.cidade}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cidade: e.target.value }))}
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  >
                    {CIDADES_ISS_MAPA.filter(
                      (c) => c.uf === formData.ufOrigem || c.id === 'outra',
                    ).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.descricao || `${c.nome}/${c.uf}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: SEGMENTO & ENQUADRAMENTO TRIBUTÁRIO */}
          <div className="space-y-6 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-[#07132B] text-[#D4AF37] flex items-center justify-center font-bold text-xs">
                02
              </div>
              <div>
                <h2 className="font-heading font-extrabold text-xl text-[#07132B]">
                  Segmento, Regime Atual & Quadro Operacional
                </h2>
                <p className="text-xs text-slate-500">
                  As 10 opções homologadas de LISTA_SEGMENTOS e equivalências com a Calculadora.
                </p>
              </div>
            </div>

            {/* SEGMENTO DE ATUAÇÃO (10 OPÇÕES) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Segmento Principal de Atividade (LISTA_SEGMENTOS)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {LISTA_SEGMENTOS.map((seg) => {
                  const isSel = formData.segmento === seg
                  return (
                    <button
                      key={seg}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, segmento: seg }))}
                      className={`p-3 rounded-xl text-center text-xs font-bold transition-all border ${
                        isSel
                          ? 'bg-[#07132B] text-[#D4AF37] border-[#D4AF37] shadow-md ring-1 ring-[#D4AF37]'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      {seg}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {/* REGIME ATUAL DA EMPRESA */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Regime Atual da Empresa
                </label>
                <select
                  value={formData.regimeAtual}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, regimeAtual: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <option value="Simples Nacional">Simples Nacional</option>
                  <option value="Lucro Presumido">Lucro Presumido</option>
                  <option value="Lucro Real">Lucro Real</option>
                  <option value="MEI (Microempreendedor)">MEI (Microempreendedor)</option>
                  <option value="Nova empresa / Ainda não optante">
                    Nova empresa / Ainda não optante
                  </option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Espelhado com Módulo 1 da Calculadora, Comparador e Split Payment.
                </p>
              </div>

              {/* NÚMERO DE COLABORADORES */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Número de Colaboradores
                </label>
                <select
                  value={formData.funcionarios}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, funcionarios: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <option value="Apenas sócios (sem funcionários)">
                    Apenas sócios (sem funcionários CLT)
                  </option>
                  <option value="1 a 5 funcionários">1 a 5 funcionários</option>
                  <option value="6 a 15 funcionários">6 a 15 funcionários</option>
                  <option value="16 a 50 funcionários">16 a 50 funcionários</option>
                  <option value="Mais de 50 funcionários">Mais de 50 funcionários</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Afeta peso previdenciário e Fator R nos diagnósticos.
                </p>
              </div>

              {/* PERFIL DE NOTAS FISCAIS */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Perfil de Notas Fiscais (Clientes)
                </label>
                <select
                  value={formData.emissaoNf}
                  onChange={(e) => setFormData((prev) => ({ ...prev, emissaoNf: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <option value="Predominante para Pessoas Jurídicas (B2B)">
                    Predominante para Pessoas Jurídicas (B2B)
                  </option>
                  <option value="Predominante para Consumidor Final / PF (B2C)">
                    Predominante para Consumidor Final / PF (B2C)
                  </option>
                  <option value="Equilibrado (PF e PJ)">Equilibrado (PF e PJ) - Misto</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Determina a sensibilidade ao crédito do IVA Dual e Split Payment.
                </p>
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: ATIVIDADE MISTA & ANO DA TRANSIÇÃO */}
          <div className="space-y-6 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-[#07132B] text-[#D4AF37] flex items-center justify-center font-bold text-xs">
                03
              </div>
              <div>
                <h2 className="font-heading font-extrabold text-xl text-[#07132B]">
                  Atividade Mista & Ano da Transição
                </h2>
                <p className="text-xs text-slate-500">
                  Calibração precisa da proporção Serviço × Comércio e linha do tempo 2026–2033.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ANO DA TRANSIÇÃO (2026-2033) */}
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#07132B] uppercase tracking-wider block">
                    Ano da Transição (2026–2033)
                  </label>
                  <span className="text-xs font-mono font-bold text-[#D4AF37] bg-[#07132B] px-3 py-1 rounded-md">
                    Ano: {formData.anoBaseTransicao}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Espelhado com o Módulo 1 da Calculadora IBS/CBS ("Ano da transição" = "Ano da
                  Operação" no Módulo 2).
                </p>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033].map((ano) => {
                    const isSel = formData.anoBaseTransicao === ano
                    return (
                      <button
                        key={ano}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            anoBaseTransicao: ano as AnoBaseSimulacao,
                          }))
                        }
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                          isSel
                            ? 'bg-[#07132B] text-[#D4AF37] border-[#D4AF37] shadow-sm'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {ano}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* TOGGLE & SLIDER DE ATIVIDADE MISTA */}
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-[#07132B] uppercase tracking-wider block">
                      Atividade Mista (Serviço × Comércio)
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Operação integrada com faturamento duplo.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, atividadeMista: !prev.atividadeMista }))
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      formData.atividadeMista
                        ? 'bg-[#2ECC71] text-[#0A140F] border-[#2ECC71] shadow-sm'
                        : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    {formData.atividadeMista ? 'Ativado' : 'Desativado'}
                  </button>
                </div>

                {formData.atividadeMista && (
                  <div className="space-y-3 pt-2 border-t border-slate-200 animate-fade-in">
                    <div className="flex justify-between items-center text-xs font-bold text-[#07132B]">
                      <span>Serviço: {formData.proporcaoServicoMisto}%</span>
                      <span>Comércio: {100 - formData.proporcaoServicoMisto}%</span>
                    </div>

                    <Slider
                      value={[formData.proporcaoServicoMisto]}
                      min={0}
                      max={100}
                      step={5}
                      onValueChange={(val) =>
                        setFormData((prev) => ({ ...prev, proporcaoServicoMisto: val[0] }))
                      }
                      className="py-1 cursor-pointer"
                    />

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                      <div>
                        Ramo Serviço:{' '}
                        <select
                          value={formData.subatividadeServico}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              subatividadeServico: e.target.value as SubatividadeServico,
                            }))
                          }
                          className="w-full mt-1 p-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                        >
                          <option value="servico_comum">Serviço Geral</option>
                          <option value="saude_educacao">Saúde / Educação (-60%)</option>
                          <option value="transporte">Transporte (-30%)</option>
                        </select>
                      </div>
                      <div>
                        Ramo Comércio:{' '}
                        <select
                          value={formData.subatividadeComercio}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              subatividadeComercio: e.target.value as SubatividadeComercio,
                            }))
                          }
                          className="w-full mt-1 p-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                        >
                          <option value="varejo_comum">Varejo Comum</option>
                          <option value="alimentos_basicos">Cesta Básica (Alíq. Zero)</option>
                          <option value="veiculos_autopecas">Veículos & Autopeças</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FEEDBACK DE SALVAMENTO */}
          {salvoSucesso && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0" />
              <span>
                <strong>Configurações salvas e propagadas!</strong> As 4 páginas de diagnóstico e a
                Calculadora IBS/CBS agora refletem estes parâmetros automaticamente.
              </span>
            </div>
          )}

          {/* BOTÕES DE AÇÃO (SEM ÍCONES EM BOTÕES DE AÇÃO) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleRestaurarPadrao}
              className="w-full sm:w-auto h-11 px-6 rounded-xl border-slate-300 text-slate-700 font-bold text-xs sm:text-sm"
            >
              Restaurar Valores Salvos
            </Button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                onClick={handleSalvar}
                disabled={salvando}
                className="w-full sm:w-auto h-11 px-8 rounded-xl bg-[#07132B] hover:bg-[#0A140F] text-[#D4AF37] font-bold text-xs sm:text-sm shadow-md border border-[#D4AF37]/50"
              >
                {salvando ? 'Salvando Configurações...' : 'Salvar e Propagar para Diagnósticos'}
              </Button>

              <Link
                to="/diagnosticos"
                className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition-all"
              >
                Ir para o Hub de Diagnósticos
              </Link>
            </div>
          </div>
        </div>

        {/* BOX INFORMATIVO DA PROPAGAÇÃO PARA AS 4 PÁGINAS */}
        <div className="bg-[#07132B] text-white rounded-2xl p-6 sm:p-8 border border-[#D4AF37]/30 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#2ECC71]" />
            Mapeamento de Propagação Automática
          </div>
          <h3 className="text-lg sm:text-xl font-heading font-extrabold text-white">
            Como os parâmetros alimentam os 4 diagnósticos:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-slate-300 pt-2">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="font-bold text-white block">1. Diagnóstico 360°</span>
              <p>
                Alimenta porte, razão social, segmento e regime para o laudo executivo e dossiê dos
                7 riscos.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="font-bold text-white block">2. Transição Fiscal</span>
              <p>
                Pré-preenche Bloco A (atividade, regime atual, perfil NF, atividade mista) com badge
                sem pular perguntas.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="font-bold text-white block">3. Comparação de Regime</span>
              <p>
                Alimenta as 4 perguntas consultivas, a matriz matemática e o ano da transição sob o
                IVA Dual.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="font-bold text-white block">4. Enquadramento</span>
              <p>
                Alimenta o Passo 1 inteiro (identificação, segmento, regime e UF) gerando o
                relatório e PDF.
              </p>
            </div>
          </div>
        </div>
      </div>

      <DiamondFooterCTA />
    </div>
  )
}
