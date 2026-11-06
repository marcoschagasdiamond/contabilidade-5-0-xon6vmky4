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
} from 'lucide-react'
import type { DadosCnpjConsulta } from '@/services/consultaCnpj'
import { mapearCnaeParaSegmento, mapearCidadeIss } from '@/services/consultaCnpj'

export interface CamposAplicacaoCnpj {
  nomeEmpresa: boolean
  segmento: boolean
  ufOrigem: boolean
  cidade: boolean
  email: boolean
  telefone: boolean
  apenasVazios: boolean
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
  })

  // Sincroniza estado inicial sempre que novos dados chegarem
  useEffect(() => {
    if (dados) {
      setSelecao({
        nomeEmpresa: true,
        segmento: true,
        ufOrigem: true,
        cidade: true,
        email: !!dados.email,
        telefone: !!dados.telefone,
        apenasVazios: false,
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
