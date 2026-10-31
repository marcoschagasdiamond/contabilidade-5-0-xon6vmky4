import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { formatarCNPJ, limparCNPJ, validarCNPJ } from '@/lib/cnpj'
import { LISTA_UFS_ICMS } from '@/types/calculadoraIbsCbs'
import {
  CIDADES_ISS_MAPA,
  type SegmentoEmpresa,
  type RegimeAtualEmpresa,
  type PorteFuncionarios,
} from '@/lib/regimes'
import type { AnoBaseSimulacao } from '@/lib/reformaTributaria'
import {
  calcularDiffDadosEmpresa,
  registrarAuditoriaDadosEmpresa,
} from '@/services/historicoDadosEmpresa'
import type { DadosEmpresaPerfil } from '@/types/dadosEmpresa'

interface ModalCorrigirDadosEmpresaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  origemModulo?: 'calculadora' | 'recuperador' | 'diagnostico' | 'geral'
  onDadosAtualizados?: (dados: DadosEmpresaPerfil) => void
}

export function ModalCorrigirDadosEmpresa({
  open,
  onOpenChange,
  origemModulo = 'geral',
  onDadosAtualizados,
}: ModalCorrigirDadosEmpresaProps) {
  const { dadosEmpresa, salvar, isSalvando, empresaVinculadaId } = useDadosEmpresa()
  const { user } = useAuth()
  const { toast } = useToast()

  const [formData, setFormData] = useState<DadosEmpresaPerfil>(dadosEmpresa)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [salvandoLocal, setSalvandoLocal] = useState(false)

  // Sincroniza quando o modal abre
  useEffect(() => {
    if (open) {
      setFormData(dadosEmpresa)
      setErros({})
    }
  }, [open, dadosEmpresa])

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

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 11) val = val.slice(0, 11)
    let formatado = val
    if (val.length > 10) {
      formatado = `+55 (${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`
    } else if (val.length > 6) {
      formatado = `+55 (${val.slice(0, 2)}) ${val.slice(2, 6)}-${val.slice(6)}`
    } else if (val.length > 2) {
      formatado = `+55 (${val.slice(0, 2)}) ${val.slice(2)}`
    } else if (val.length > 0) {
      formatado = `+55 (${val}`
    }
    setFormData((prev) => ({ ...prev, telefone: formatado }))
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()

    const novosErros: Record<string, string> = {}
    if (!formData.nomeEmpresa?.trim()) {
      novosErros.nomeEmpresa = 'Razão Social / Nome da Empresa é obrigatório.'
    }

    if (formData.cnpj && limparCNPJ(formData.cnpj).length > 0) {
      const cnpjLimpo = limparCNPJ(formData.cnpj)
      if (cnpjLimpo.length !== 14 || !validarCNPJ(formData.cnpj)) {
        novosErros.cnpj = 'CNPJ inválido (deve conter 14 dígitos válidos).'
      }
    }

    if (formData.email && !formData.email.includes('@')) {
      novosErros.email = 'E-mail corporativo inválido.'
    }

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros)
      return
    }

    setSalvandoLocal(true)
    try {
      // 1. Calcula o diff de -> para em relação ao estado cadastrado anterior
      const alteracoes = calcularDiffDadosEmpresa(dadosEmpresa, formData)

      // 2. Salva no contexto de Dados da Empresa (local + banco)
      const salvo = await salvar(formData)

      // 3. Se houve alterações reais, registra evento imutável de auditoria
      if (alteracoes.length > 0) {
        await registrarAuditoriaDadosEmpresa({
          empresaId: empresaVinculadaId,
          userId: user?.id,
          origemAjuste: `botao_corrigir_dados_${origemModulo}`,
          nomeEmpresa: salvo.nomeEmpresa,
          cnpj: salvo.cnpj,
          alteracoes,
          snapshotAnterior: dadosEmpresa,
          snapshotNovo: salvo,
          descricao: `Correção cadastral auditada realizada pelo usuário via ${origemModulo} (${alteracoes.length} campo(s) ajustado(s))`,
        })
      }

      toast({
        title: 'Dados da Empresa Atualizados',
        description:
          alteracoes.length > 0
            ? `${alteracoes.length} campo(s) corrigido(s) com rastro de auditoria gravado com sucesso.`
            : 'Nenhuma alteração detectada. Dados mantidos com sucesso.',
      })

      if (onDadosAtualizados) {
        onDadosAtualizados(salvo)
      }

      onOpenChange(false)
    } catch (err: any) {
      console.error('Erro ao corrigir dados da empresa:', err)
      toast({
        title: 'Erro ao salvar correção',
        description: err?.message || 'Não foi possível salvar as correções.',
        variant: 'destructive',
      })
    } finally {
      setSalvandoLocal(false)
    }
  }

  const cidadesFiltradas = CIDADES_ISS_MAPA.filter(
    (c) => c.uf === formData.ufOrigem || c.id === 'outra',
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 text-slate-900 rounded-2xl p-6 sm:p-8">
        <DialogHeader className="space-y-1 text-left pb-3 border-b border-slate-100">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-[#D4AF37] bg-[#07132B] uppercase tracking-wider w-fit">
            Rastreabilidade & Auditoria Cadastral
          </div>
          <DialogTitle className="text-xl font-extrabold text-[#07132B]">
            Corrigir Dados de Identificação da Empresa
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Ajuste as informações cadastrais oficiais da sua empresa. Por conformidade, cada
            alteração é gravada em histórico imutável (de → para, data/hora e autor) visível ao
            responsável técnico.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSalvar} className="space-y-4 pt-2 text-xs">
          {/* AVISO ORIENTATIVO PADRÃO DIAMOND GROUP */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 leading-relaxed">
            <strong className="text-[#07132B] block mb-0.5">
              Caminho Único de Correção Auditado:
            </strong>
            Os relatórios e análises são gerados estritamente com os dados registrados neste
            cadastro, impedindo edições avulsas que descaracterizem a autenticidade técnica dos
            pareceres.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Razão Social / Nome da Empresa */}
            <div className="sm:col-span-2 space-y-1">
              <Label htmlFor="corrigir-nomeEmpresa" className="font-bold text-slate-700">
                Razão Social / Nome da Empresa *
              </Label>
              <Input
                id="corrigir-nomeEmpresa"
                value={formData.nomeEmpresa || ''}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, nomeEmpresa: e.target.value }))
                  if (erros.nomeEmpresa) {
                    setErros((prev) => {
                      const n = { ...prev }
                      delete n.nomeEmpresa
                      return n
                    })
                  }
                }}
                placeholder="Ex: Diamond Consultoria Tributária Ltda"
                className={`h-10 text-xs bg-slate-50 border ${
                  erros.nomeEmpresa ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300'
                }`}
              />
              {erros.nomeEmpresa && (
                <p className="text-[11px] text-rose-600 font-medium">{erros.nomeEmpresa}</p>
              )}
            </div>

            {/* CNPJ */}
            <div className="space-y-1">
              <Label htmlFor="corrigir-cnpj" className="font-bold text-slate-700">
                CNPJ
              </Label>
              <Input
                id="corrigir-cnpj"
                value={formData.cnpj || ''}
                onChange={handleCnpjChange}
                maxLength={18}
                placeholder="00.000.000/0000-00"
                className={`h-10 text-xs font-mono bg-slate-50 border ${
                  erros.cnpj ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300'
                }`}
              />
              {erros.cnpj && <p className="text-[11px] text-rose-600 font-medium">{erros.cnpj}</p>}
            </div>

            {/* Nome do Contato / Responsável */}
            <div className="space-y-1">
              <Label htmlFor="corrigir-nomeContato" className="font-bold text-slate-700">
                Nome do Responsável / Contato
              </Label>
              <Input
                id="corrigir-nomeContato"
                value={formData.nomeContato || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, nomeContato: e.target.value }))}
                placeholder="Ex: Carlos Eduardo Silva"
                className="h-10 text-xs bg-slate-50 border-slate-300"
              />
            </div>

            {/* E-mail Corporativo */}
            <div className="space-y-1">
              <Label htmlFor="corrigir-email" className="font-bold text-slate-700">
                E-mail Corporativo
              </Label>
              <Input
                id="corrigir-email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                  if (erros.email) {
                    setErros((prev) => {
                      const n = { ...prev }
                      delete n.email
                      return n
                    })
                  }
                }}
                placeholder="contato@empresa.com.br"
                className={`h-10 text-xs bg-slate-50 border ${
                  erros.email ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300'
                }`}
              />
              {erros.email && (
                <p className="text-[11px] text-rose-600 font-medium">{erros.email}</p>
              )}
            </div>

            {/* Telefone / WhatsApp */}
            <div className="space-y-1">
              <Label htmlFor="corrigir-telefone" className="font-bold text-slate-700">
                Telefone / WhatsApp
              </Label>
              <Input
                id="corrigir-telefone"
                value={formData.telefone || ''}
                onChange={handleTelefoneChange}
                placeholder="+55 (11) 99999-9999"
                className="h-10 text-xs bg-slate-50 border-slate-300"
              />
            </div>

            {/* UF de Origem */}
            <div className="space-y-1">
              <Label htmlFor="corrigir-uf" className="font-bold text-slate-700">
                UF de Domicílio (ICMS)
              </Label>
              <select
                id="corrigir-uf"
                value={formData.ufOrigem || 'SP'}
                onChange={(e) => {
                  const novaUf = e.target.value
                  setFormData((prev) => {
                    const cidAtual = CIDADES_ISS_MAPA.find((c) => c.id === prev.cidade)
                    const cidValida =
                      cidAtual && (cidAtual.uf === novaUf || cidAtual.id === 'outra')
                    return {
                      ...prev,
                      ufOrigem: novaUf,
                      cidade: cidValida ? prev.cidade : 'outra',
                    }
                  })
                }}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              >
                {LISTA_UFS_ICMS.map((u) => (
                  <option key={u.uf} value={u.uf}>
                    {u.uf} — {u.nome} ({u.aliquotaInternaPadrao}% ICMS)
                  </option>
                ))}
              </select>
            </div>

            {/* Cidade / Município (ISS) */}
            <div className="space-y-1">
              <Label htmlFor="corrigir-cidade" className="font-bold text-slate-700">
                Cidade / Município (ISS)
              </Label>
              <select
                id="corrigir-cidade"
                value={formData.cidade || 'sp-sao-paulo'}
                onChange={(e) => setFormData((prev) => ({ ...prev, cidade: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              >
                {cidadesFiltradas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.descricao || `${c.nome}/${c.uf} (${c.aliquota}%)`}
                  </option>
                ))}
              </select>
            </div>

            {/* Segmento Econômico */}
            <div className="space-y-1">
              <Label htmlFor="corrigir-segmento" className="font-bold text-slate-700">
                Segmento Econômico
              </Label>
              <select
                id="corrigir-segmento"
                value={formData.segmento || 'Serviços'}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    segmento: e.target.value as SegmentoEmpresa,
                  }))
                }
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              >
                {[
                  'Comércio',
                  'Serviços',
                  'Indústria',
                  'Saúde',
                  'Educação',
                  'Agro',
                  'Transporte',
                  'Tecnologia',
                  'Construção Civil',
                  'Bares e Restaurantes',
                ].map((seg) => (
                  <option key={seg} value={seg}>
                    {seg}
                  </option>
                ))}
              </select>
            </div>

            {/* Regime Tributário Atual */}
            <div className="space-y-1">
              <Label htmlFor="corrigir-regime" className="font-bold text-slate-700">
                Regime Tributário Atual
              </Label>
              <select
                id="corrigir-regime"
                value={formData.regimeAtual || 'Simples Nacional'}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    regimeAtual: e.target.value as RegimeAtualEmpresa,
                  }))
                }
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              >
                <option value="Simples Nacional">Simples Nacional</option>
                <option value="Lucro Presumido">Lucro Presumido</option>
                <option value="Lucro Real">Lucro Real</option>
                <option value="MEI (Microempreendedor)">MEI (Microempreendedor)</option>
                <option value="Nova empresa / Ainda não optante">
                  Nova empresa / Ainda não optante
                </option>
              </select>
            </div>

            {/* Quadro de Funcionários */}
            <div className="space-y-1">
              <Label htmlFor="corrigir-funcionarios" className="font-bold text-slate-700">
                Quadro de Funcionários
              </Label>
              <select
                id="corrigir-funcionarios"
                value={formData.funcionarios || '1 a 5 funcionários'}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    funcionarios: e.target.value as PorteFuncionarios,
                  }))
                }
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              >
                <option value="Apenas sócios (sem funcionários)">
                  Apenas sócios (sem funcionários CLT)
                </option>
                <option value="1 a 5 funcionários">1 a 5 funcionários</option>
                <option value="6 a 15 funcionários">6 a 15 funcionários</option>
                <option value="16 a 50 funcionários">16 a 50 funcionários</option>
                <option value="Mais de 50 funcionários">Mais de 50 funcionários</option>
              </select>
            </div>

            {/* Perfil de Emissão de NF */}
            <div className="space-y-1">
              <Label htmlFor="corrigir-emissaoNf" className="font-bold text-slate-700">
                Perfil de Emissão de NF
              </Label>
              <select
                id="corrigir-emissaoNf"
                value={formData.emissaoNf || 'Predominante para Pessoas Jurídicas (B2B)'}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    emissaoNf: e.target.value,
                  }))
                }
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              >
                <option value="Predominante para Pessoas Jurídicas (B2B)">
                  Predominante para Pessoas Jurídicas (B2B)
                </option>
                <option value="Predominante para Consumidores Finais (B2C)">
                  Predominante para Consumidores Finais (B2C)
                </option>
                <option value="Misto equilibrado (50% B2B e 50% B2C)">
                  Misto equilibrado (50% B2B e 50% B2C)
                </option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={salvandoLocal || isSalvando}
              className="w-full sm:w-auto text-xs font-bold border-slate-300 text-slate-700 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={salvandoLocal || isSalvando}
              className="w-full sm:w-auto text-xs font-bold bg-[#07132B] hover:bg-[#0d2249] text-[#D4AF37] px-5 py-2.5 rounded-xl shadow-sm"
            >
              {salvandoLocal || isSalvando
                ? 'Salvando e Auditando...'
                : 'Salvar Alterações e Gravar Rastro'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
