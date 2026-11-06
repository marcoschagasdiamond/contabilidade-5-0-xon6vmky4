import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Building2,
  MapPin,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Users,
  UserCheck,
  Briefcase,
  Layers,
} from 'lucide-react'
import type { DadosCnpjConsulta } from '@/services/consultaCnpj'
import { mapearCnaeParaSegmento, mapearCidadeIss } from '@/services/consultaCnpj'
import { BadgeProvenienciaQsa } from '@/components/dadosEmpresa/BadgeProvenienciaQsa'

export interface CamposAplicacaoCnpj {
  nomeEmpresa: boolean
  segmento: boolean
  ufOrigem: boolean
  cidade: boolean
  email: boolean
  telefone: boolean
  apenasVazios: boolean
  // Opções de QSA
  incluirQsa: boolean
  sociosSelecionadosIds: string[]
  modoQsa: 'vinculos' | 'informativo'
  // Opções de CNAEs Secundários
  incluirCnaesSecundarios: boolean
  cnaesSecundariosSelecionadosCodigos: string[]
}

interface ModalConfirmarDadosCnpjProps {
  aberto: boolean
  aoFechar: () => void
  dados: DadosCnpjConsulta | null
  valoresAtuais: {
    nomeEmpresa?: string
    segmento?: string
    ufOrigem?: string
    cidade?: string
    email?: string
    telefone?: string
  }
  aoConfirmar: (dados: DadosCnpjConsulta, opcoes: CamposAplicacaoCnpj) => void
}

export function ModalConfirmarDadosCnpj({
  aberto,
  aoFechar,
  dados,
  valoresAtuais,
  aoConfirmar,
}: ModalConfirmarDadosCnpjProps) {
  // Estado dos campos que o usuário deseja aplicar (Hook no topo incondicionalmente)
  const [selecao, setSelecao] = useState<CamposAplicacaoCnpj>({
    nomeEmpresa: true,
    segmento: true,
    ufOrigem: true,
    cidade: true,
    email: false,
    telefone: false,
    apenasVazios: false,
    incluirQsa: true,
    sociosSelecionadosIds: [],
    modoQsa: 'vinculos',
    incluirCnaesSecundarios: true,
    cnaesSecundariosSelecionadosCodigos: [],
  })

  // Sincroniza estado inicial sempre que novos dados chegarem
  useEffect(() => {
    if (dados) {
      const qsaList = Array.isArray(dados.qsa) ? dados.qsa : []
      const idsIniciais = qsaList.map((s, idx) => s.id || `qsa_${idx}`)
      const cnaesSecList = Array.isArray(dados.cnaesSecundarios) ? dados.cnaesSecundarios : []
      const codigosCnaesIniciais = cnaesSecList.map((c, idx) => c.codigo || `cnae_${idx}`)
      setSelecao({
        nomeEmpresa: true,
        segmento: true,
        ufOrigem: true,
        cidade: true,
        email: !!dados.email,
        telefone: !!dados.telefone,
        apenasVazios: false,
        incluirQsa: qsaList.length > 0,
        sociosSelecionadosIds: idsIniciais,
        modoQsa: 'vinculos',
        incluirCnaesSecundarios: cnaesSecList.length > 0,
        cnaesSecundariosSelecionadosCodigos: codigosCnaesIniciais,
      })
    }
  }, [dados])

  if (!dados) return null

  const segmentoMapeado = mapearCnaeParaSegmento(
    dados.cnaePrincipalCodigo,
    dados.cnaePrincipalDescricao,
  )
  const cidadeMapeada = mapearCidadeIss(dados.municipio, dados.uf)

  // Formatador de data
  const formatarData = (d?: string) => {
    if (!d) return 'Não informada'
    try {
      const parts = d.split('-')
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
      return d
    } catch {
      return d
    }
  }

  const enderecoCompleto = [
    dados.logradouro,
    dados.numero ? `nº ${dados.numero}` : '',
    dados.complemento,
    dados.bairro ? `Bairro ${dados.bairro}` : '',
    dados.municipio ? `${dados.municipio}/${dados.uf}` : '',
    dados.cep ? `CEP ${dados.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}` : '',
  ]
    .filter(Boolean)
    .join(', ')

  const fonteDescricao =
    dados.fonte === 'brasilapi'
      ? 'Receita Federal via BrasilAPI'
      : dados.fonte === 'receitaws'
        ? 'Receita Federal via ReceitaWS'
        : 'Receita Federal via Proxy Seguro'

  const handleConfirmar = () => {
    aoConfirmar(dados, selecao)
    aoFechar()
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && aoFechar()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-white border-slate-200">
        {/* Cabeçalho */}
        <div className="p-6 bg-gradient-to-br from-[#07132B] to-[#0A2240] text-white border-b border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37]">
              <Sparkles className="w-4 h-4" />
            </span>
            <Badge className="bg-[#145A32] text-emerald-200 border-emerald-500/40 font-mono text-[11px]">
              Dados Oficiais Localizados
            </Badge>
            <Badge variant="outline" className="border-slate-600 text-slate-300 text-[10px]">
              {fonteDescricao}
            </Badge>
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center justify-between">
            <span>{dados.razaoSocial || 'Empresa Localizada'}</span>
          </DialogTitle>

          <DialogDescription className="text-slate-300 text-xs mt-1 font-mono">
            CNPJ: {dados.cnpjFormatado} • Situação Cadastral:{' '}
            <strong
              className={
                dados.situacaoCadastral.toLowerCase().includes('ativa')
                  ? 'text-emerald-400 font-semibold'
                  : 'text-amber-400 font-semibold'
              }
            >
              {dados.situacaoCadastral.toUpperCase()}
            </strong>{' '}
            • Abertura: {formatarData(dados.dataAbertura)}
          </DialogDescription>
        </div>

        {/* Corpo com resumo dos dados e opções de aplicação */}
        <div className="p-6 space-y-5">
          {/* Card com Detalhes da Receita Federal */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
            {dados.nomeFantasia && (
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-[#145A32] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-700 block">Nome Fantasia:</span>
                  <span className="text-slate-900 font-medium">{dados.nomeFantasia}</span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-[#145A32] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700 block">
                  CNAE Principal ({dados.cnaePrincipalCodigo || 'N/D'}):
                </span>
                <span className="text-slate-900 font-medium leading-relaxed">
                  {dados.cnaePrincipalDescricao || 'Atividade principal não informada'}
                </span>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">Segmento sugerido no sistema:</span>
                  <Badge className="bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] py-0">
                    {segmentoMapeado}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#145A32] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700 block">Endereço Cadastrado:</span>
                <span className="text-slate-900 leading-relaxed font-medium">
                  {enderecoCompleto || `${dados.municipio || 'Não informado'} - ${dados.uf || ''}`}
                </span>
              </div>
            </div>

            {(dados.email || dados.telefone) && (
              <div className="pt-2 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {dados.email && (
                  <div>
                    <span className="font-semibold text-slate-600">E-mail Receita: </span>
                    <span className="text-slate-800 font-mono">{dados.email}</span>
                  </div>
                )}
                {dados.telefone && (
                  <div>
                    <span className="font-semibold text-slate-600">Telefone Receita: </span>
                    <span className="text-slate-800 font-mono">{dados.telefone}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Aviso importante: NÃO sobrescrever silenciosamente */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong>Controle de preenchimento:</strong> Escolha abaixo quais campos deseja
              atualizar no formulário. Campos desmarcados manterão os valores já digitados
              anteriormente.
            </div>
          </div>

          {/* Seleção de campos para aplicar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Campos a preencher no formulário
              </span>
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                <Checkbox
                  checked={selecao.apenasVazios}
                  onCheckedChange={(checked) =>
                    setSelecao((prev) => ({ ...prev, apenasVazios: !!checked }))
                  }
                />
                <span className="font-medium text-slate-700">Preencher apenas campos vazios</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {/* Razão Social / Nome da Empresa */}
              <label className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50/70 transition flex items-start gap-2.5 cursor-pointer">
                <Checkbox
                  checked={selecao.nomeEmpresa}
                  onCheckedChange={(checked) =>
                    setSelecao((prev) => ({ ...prev, nomeEmpresa: !!checked }))
                  }
                  className="mt-0.5"
                />
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="font-semibold text-slate-800">Nome da Empresa / Razão Social</div>
                  <div className="text-[11px] text-slate-500 truncate" title={dados.razaoSocial}>
                    {dados.razaoSocial}
                  </div>
                  {valoresAtuais.nomeEmpresa && valoresAtuais.nomeEmpresa !== dados.razaoSocial && (
                    <div className="text-[10px] text-amber-700 font-mono">
                      Atual: "{valoresAtuais.nomeEmpresa}"
                    </div>
                  )}
                </div>
              </label>

              {/* Segmento */}
              <label className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50/70 transition flex items-start gap-2.5 cursor-pointer">
                <Checkbox
                  checked={selecao.segmento}
                  onCheckedChange={(checked) =>
                    setSelecao((prev) => ({ ...prev, segmento: !!checked }))
                  }
                  className="mt-0.5"
                />
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="font-semibold text-slate-800">Segmento de Atuação</div>
                  <div className="text-[11px] text-slate-500">
                    Sugerido: <strong className="text-slate-800">{segmentoMapeado}</strong>
                  </div>
                  {valoresAtuais.segmento && valoresAtuais.segmento !== segmentoMapeado && (
                    <div className="text-[10px] text-amber-700 font-mono">
                      Atual: "{valoresAtuais.segmento}"
                    </div>
                  )}
                </div>
              </label>

              {/* UF de Origem */}
              <label className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50/70 transition flex items-start gap-2.5 cursor-pointer">
                <Checkbox
                  checked={selecao.ufOrigem}
                  onCheckedChange={(checked) =>
                    setSelecao((prev) => ({ ...prev, ufOrigem: !!checked }))
                  }
                  className="mt-0.5"
                />
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="font-semibold text-slate-800">UF de Origem (ICMS)</div>
                  <div className="text-[11px] text-slate-500">
                    Estado: <strong className="text-slate-800">{dados.uf}</strong>
                  </div>
                  {valoresAtuais.ufOrigem && valoresAtuais.ufOrigem !== dados.uf && (
                    <div className="text-[10px] text-amber-700 font-mono">
                      Atual: "{valoresAtuais.ufOrigem}"
                    </div>
                  )}
                </div>
              </label>

              {/* Cidade / ISS */}
              <label className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50/70 transition flex items-start gap-2.5 cursor-pointer">
                <Checkbox
                  checked={selecao.cidade}
                  onCheckedChange={(checked) =>
                    setSelecao((prev) => ({ ...prev, cidade: !!checked }))
                  }
                  className="mt-0.5"
                />
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="font-semibold text-slate-800">Cidade (Alíquota ISS)</div>
                  <div
                    className="text-[11px] text-slate-500 truncate"
                    title={cidadeMapeada.nomeExibicao}
                  >
                    {cidadeMapeada.nomeExibicao}
                  </div>
                </div>
              </label>

              {/* E-mail (se disponível) */}
              {dados.email && (
                <label className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50/70 transition flex items-start gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={selecao.email}
                    onCheckedChange={(checked) =>
                      setSelecao((prev) => ({ ...prev, email: !!checked }))
                    }
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="font-semibold text-slate-800">E-mail Corporativo</div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">
                      {dados.email}
                    </div>
                  </div>
                </label>
              )}

              {/* Telefone (se disponível) */}
              {dados.telefone && (
                <label className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50/70 transition flex items-start gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={selecao.telefone}
                    onCheckedChange={(checked) =>
                      setSelecao((prev) => ({ ...prev, telefone: !!checked }))
                    }
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="font-semibold text-slate-800">Telefone / WhatsApp</div>
                    <div className="text-[11px] text-slate-500 font-mono">{dados.telefone}</div>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Seção Nova: Sócios e Administradores (QSA) */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#07132B] text-[#D4AF37]">
                  <Users className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span>Sócios e Administradores (QSA)</span>
                    {Array.isArray(dados.qsa) && dados.qsa.length > 0 && (
                      <Badge className="bg-slate-100 text-slate-700 text-[10px] py-0 px-1.5 font-mono">
                        {dados.qsa.length}
                      </Badge>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Dados obtidos do registro público da Receita Federal
                  </p>
                </div>
              </div>

              {Array.isArray(dados.qsa) && dados.qsa.length > 0 ? (
                <BadgeProvenienciaQsa
                  consultadoEm={dados.consultadoEm}
                  fonte={dados.qsaFonte || dados.fonte}
                  totalSocios={dados.qsa.length}
                  variante="compacta"
                />
              ) : null}
            </div>

            {/* Quando não há QSA retornado */}
            {!dados.qsa || dados.qsa.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-xs text-slate-600">
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  QSA não disponível nesta fonte pública para este CNPJ (ou empresa de titular único
                  / MEI). A busca cadastral de CNPJ foi concluída normalmente.
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Escolha explícita: Aplicar como Vínculos Societários vs Apenas Quadro de Sócios Informativo */}
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2">
                  <div className="text-xs font-semibold text-blue-950 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-[#07132B]" />
                    <span>Como você deseja registrar os sócios no sistema?</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label
                      className={`p-2.5 rounded-lg border transition cursor-pointer flex items-start gap-2.5 ${
                        selecao.modoQsa === 'vinculos'
                          ? 'bg-white border-[#07132B] shadow-xs'
                          : 'bg-white/50 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="modoQsa"
                        value="vinculos"
                        checked={selecao.modoQsa === 'vinculos'}
                        onChange={() => setSelecao((prev) => ({ ...prev, modoQsa: 'vinculos' }))}
                        className="mt-1 text-[#07132B] focus:ring-[#07132B]"
                      />
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900">
                          Aplicar como Vínculos Societários
                        </div>
                        <p className="text-[11px] text-slate-600 leading-tight">
                          Gera itens na seção Vínculos Societários de /dados-empresa para análise de
                          risco de regime (LC 123/06).
                        </p>
                      </div>
                    </label>

                    <label
                      className={`p-2.5 rounded-lg border transition cursor-pointer flex items-start gap-2.5 ${
                        selecao.modoQsa === 'informativo'
                          ? 'bg-white border-[#07132B] shadow-xs'
                          : 'bg-white/50 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="modoQsa"
                        value="informativo"
                        checked={selecao.modoQsa === 'informativo'}
                        onChange={() => setSelecao((prev) => ({ ...prev, modoQsa: 'informativo' }))}
                        className="mt-1 text-[#07132B] focus:ring-[#07132B]"
                      />
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900">
                          Apenas registrar como Quadro de Sócios
                        </div>
                        <p className="text-[11px] text-slate-600 leading-tight">
                          Mantém os dados salvos no cadastro da empresa como histórico/conferência,
                          sem criar vínculos adicionais.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Lista de Sócios com Checkboxes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                    <span className="font-medium text-slate-700">
                      Selecione os sócios que deseja incluir:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const todosIds = (dados.qsa || []).map((s, idx) => s.id || `qsa_${idx}`)
                        const todosMarcados =
                          selecao.sociosSelecionadosIds.length === todosIds.length
                        setSelecao((prev) => ({
                          ...prev,
                          sociosSelecionadosIds: todosMarcados ? [] : todosIds,
                        }))
                      }}
                      className="text-[11px] text-[#07132B] hover:underline font-semibold"
                    >
                      {selecao.sociosSelecionadosIds.length === (dados.qsa || []).length
                        ? 'Desmarcar todos'
                        : 'Marcar todos'}
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                    {dados.qsa.map((socio, idx) => {
                      const idSocio = socio.id || `qsa_${idx}`
                      const marcado = selecao.sociosSelecionadosIds.includes(idSocio)
                      const ehPJ =
                        socio.tipoPessoa === 'PJ' ||
                        (socio.qualificacao || '').toLowerCase().includes('jurídica') ||
                        (socio.qualificacao || '').toLowerCase().includes('juridica')
                      const ehAdmin =
                        (socio.qualificacao || '').toLowerCase().includes('administrador') ||
                        (socio.qualificacao || '').toLowerCase().includes('gerente') ||
                        (socio.qualificacao || '').toLowerCase().includes('diretor')

                      return (
                        <label
                          key={idSocio}
                          className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 cursor-pointer transition ${
                            marcado
                              ? 'bg-slate-50/90 border-slate-300'
                              : 'bg-white border-slate-200 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <Checkbox
                            checked={marcado}
                            onCheckedChange={(checked) => {
                              setSelecao((prev) => {
                                const novo = checked
                                  ? [...prev.sociosSelecionadosIds, idSocio]
                                  : prev.sociosSelecionadosIds.filter((x) => x !== idSocio)
                                return { ...prev, sociosSelecionadosIds: novo }
                              })
                            }}
                            className="mt-0.5"
                          />

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-slate-800 truncate">
                                {socio.nome}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                {ehPJ && (
                                  <Badge className="bg-purple-100 text-purple-800 text-[10px] py-0 px-1 font-mono">
                                    PJ / Holding
                                  </Badge>
                                )}
                                {ehAdmin && (
                                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px] py-0 px-1">
                                    Administração
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                              <span>
                                Qualificação:{' '}
                                <strong className="text-slate-700">
                                  {socio.qualificacao || 'Sócio'}
                                </strong>
                              </span>

                              {socio.percentualParticipacao !== undefined &&
                                socio.percentualParticipacao !== null && (
                                  <span>
                                    Participação:{' '}
                                    <strong className="text-slate-700">
                                      {socio.percentualParticipacao}%
                                    </strong>
                                  </span>
                                )}

                              {socio.cpfCnpj && (
                                <span className="font-mono text-[10px] text-slate-400">
                                  Doc: {socio.cpfCnpj}
                                </span>
                              )}

                              {socio.dataEntrada && (
                                <span className="text-[10px] text-slate-400">
                                  Entrada: {socio.dataEntrada}
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SEÇÃO 3: ATIVIDADES ECONÔMICAS SECUNDÁRIAS (CNAES SECUNDÁRIOS) */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-[#07132B]/10 text-[#07132B]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 text-xs block">
                      Atividades Econômicas Secundárias (CNAEs Secundários)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {Array.isArray(dados.cnaesSecundarios) && dados.cnaesSecundarios.length > 0
                        ? `${dados.cnaesSecundarios.length} atividade(s) secundária(s) localizada(s) no CNPJ`
                        : 'Nenhuma atividade secundária informada ou disponível nesta fonte'}
                    </span>
                  </div>
                </div>

                {Array.isArray(dados.cnaesSecundarios) && dados.cnaesSecundarios.length > 0 && (
                  <Badge className="bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/30 text-[10px]">
                    {dados.cnaesSecundarios.length} CNAE(s)
                  </Badge>
                )}
              </div>

              {(!Array.isArray(dados.cnaesSecundarios) || dados.cnaesSecundarios.length === 0) && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    CNAEs secundários não disponíveis nesta fonte ou a empresa não possui atividades
                    secundárias registradas.
                  </span>
                </div>
              )}

              {Array.isArray(dados.cnaesSecundarios) && dados.cnaesSecundarios.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                    <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                      <Checkbox
                        checked={selecao.incluirCnaesSecundarios}
                        onCheckedChange={(checked) =>
                          setSelecao((prev) => ({ ...prev, incluirCnaesSecundarios: !!checked }))
                        }
                      />
                      <span>Importar CNAEs secundários selecionados</span>
                    </label>

                    {selecao.incluirCnaesSecundarios && (
                      <button
                        type="button"
                        onClick={() => {
                          const todosCodigos = (dados.cnaesSecundarios || []).map(
                            (c, idx) => c.codigo || `cnae_${idx}`,
                          )
                          const todosMarcados =
                            selecao.cnaesSecundariosSelecionadosCodigos.length ===
                            todosCodigos.length
                          setSelecao((prev) => ({
                            ...prev,
                            cnaesSecundariosSelecionadosCodigos: todosMarcados ? [] : todosCodigos,
                          }))
                        }}
                        className="text-[11px] text-[#07132B] hover:underline font-semibold"
                      >
                        {selecao.cnaesSecundariosSelecionadosCodigos.length ===
                        (dados.cnaesSecundarios || []).length
                          ? 'Desmarcar todos'
                          : 'Marcar todos'}
                      </button>
                    )}
                  </div>

                  {selecao.incluirCnaesSecundarios && (
                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                      {dados.cnaesSecundarios.map((item, idx) => {
                        const codigoId = item.codigo || `cnae_${idx}`
                        const marcado =
                          selecao.cnaesSecundariosSelecionadosCodigos.includes(codigoId)
                        const codigoExibicao =
                          item.codigoFormatado ||
                          (item.codigo && item.codigo.length === 7
                            ? `${item.codigo.slice(0, 4)}-${item.codigo.slice(4, 5)}/${item.codigo.slice(5, 7)}`
                            : item.codigo)
                        const segmentoItem = mapearCnaeParaSegmento(item.codigo, item.descricao)

                        return (
                          <label
                            key={codigoId}
                            className={`p-2 rounded-lg border text-xs flex items-start gap-2.5 cursor-pointer transition ${
                              marcado
                                ? 'bg-white border-slate-300 shadow-xs'
                                : 'bg-slate-100/70 border-slate-200 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <Checkbox
                              checked={marcado}
                              onCheckedChange={(checked) => {
                                setSelecao((prev) => {
                                  const novo = checked
                                    ? [...prev.cnaesSecundariosSelecionadosCodigos, codigoId]
                                    : prev.cnaesSecundariosSelecionadosCodigos.filter(
                                        (x) => x !== codigoId,
                                      )
                                  return { ...prev, cnaesSecundariosSelecionadosCodigos: novo }
                                })
                              }}
                              className="mt-0.5"
                            />

                            <div className="flex-1 min-w-0 space-y-0.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono font-semibold text-slate-800 text-[11px]">
                                  {codigoExibicao}
                                </span>
                                {segmentoItem && (
                                  <Badge className="bg-[#07132B]/10 text-[#07132B] border-none text-[10px] py-0 px-1 font-normal">
                                    {segmentoItem}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-700 leading-snug">
                                {item.descricao}
                              </p>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé com botões de ação */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={aoFechar}
            className="text-xs text-slate-600"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleConfirmar}
            className="text-xs font-semibold bg-[#145A32] hover:bg-[#114b2a] text-white shadow-sm flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>Confirmar e Aplicar no Formulário</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
