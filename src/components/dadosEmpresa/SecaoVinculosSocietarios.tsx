import { useState, useMemo } from 'react'
import {
  Users,
  Plus,
  Trash2,
  Building2,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Info,
  Scale,
  Percent,
  DollarSign,
  Briefcase,
  HelpCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Network } from 'lucide-react'
import { PainelGrupoEconomico } from '@/components/dadosEmpresa/PainelGrupoEconomico'
import { VinculoSocietario, PapelClienteNoVinculo, RegimeOutraEmpresa } from '@/types/dadosEmpresa'
import { analisarVinculosSocietarios, TETO_SIMPLES_NACIONAL } from '@/lib/vinculosSocietarios'
import type { RegistroHistoricoVinculo } from '@/lib/historicoVinculos'

interface SecaoVinculosSocietariosProps {
  vinculos: VinculoSocietario[]
  regimeAtual?: string
  faturamentoMensalProprio: number
  /** Identificação da empresa ativa — usada na raiz da árvore do Grupo Econômico */
  empresaNome?: string
  empresaCnpj?: string
  /** Histórico de alterações (auditoria) — bruto do banco (JSON na empresa). */
  historicoVinculos?: RegistroHistoricoVinculo[] | string | null
  onChangeVinculos: (novosVinculos: VinculoSocietario[]) => void
}

const OPCOES_PAPEL: { id: PapelClienteNoVinculo; rotulo: string; descricao: string }[] = [
  {
    id: 'socio_pf',
    rotulo: 'Sócio Pessoa Física da Outra Empresa',
    descricao: 'O cliente é titular/sócio pessoa física no contrato social da outra PJ.',
  },
  {
    id: 'administrador',
    rotulo: 'Administrador / Diretor da Outra Empresa',
    descricao: 'Exerce poder de gestão/administração da outra PJ (mesmo com <10% ou sem cotas).',
  },
  {
    id: 'pj_socia_holding',
    rotulo: 'PJ / Holding como Sócia da Empresa Analisada',
    descricao:
      '🔴 Vedação LC 123 art. 3º, §4º, I — Outra pessoa jurídica detém cotas desta empresa.',
  },
  {
    id: 'empresa_participa_outra',
    rotulo: 'Esta Empresa Participa do Capital de Outra PJ',
    descricao:
      '🔴 Vedação LC 123 art. 3º, §4º, VII — A empresa analisada investe em cotas de outra PJ.',
  },
]

const OPCOES_REGIME: RegimeOutraEmpresa[] = [
  'Simples Nacional',
  'Lucro Presumido',
  'Lucro Real',
  'MEI',
  'Outro',
]

export function SecaoVinculosSocietarios({
  vinculos = [],
  regimeAtual = 'Simples Nacional',
  faturamentoMensalProprio,
  empresaNome,
  empresaCnpj,
  historicoVinculos,
  onChangeVinculos,
}: SecaoVinculosSocietariosProps) {
  const [formAberto, setFormAberto] = useState(false)
  const [painelGeAberto, setPainelGeAberto] = useState(false)

  // Form temporário de novo vínculo
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [papel, setPapel] = useState<PapelClienteNoVinculo>('socio_pf')
  const [participacao, setParticipacao] = useState<number>(50)
  const [administracao, setAdministracao] = useState<boolean>(true)
  const [regime, setRegime] = useState<RegimeOutraEmpresa>('Simples Nacional')
  const [faturamentoAnual, setFaturamentoAnual] = useState<number>(500000)
  const [excecaoLegal, setExcecaoLegal] = useState<boolean>(false)
  const [observacoes, setObservacoes] = useState('')

  const faturamentoAnualProprio = (faturamentoMensalProprio || 0) * 12

  const analise = useMemo(() => {
    return analisarVinculosSocietarios({
      regimeAtual,
      faturamentoAnualProprio,
      vinculos,
    })
  }, [regimeAtual, faturamentoAnualProprio, vinculos])

  const formatarMoeda = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

  // Barreira anti-submit (recidivas v0.0.406/v0.0.411): qualquer clique dentro
  // desta seção jamais borbulha para o <form> da página /dados-empresa.
  const ePrevenirSubmissao = (e: { preventDefault: () => void; stopPropagation: () => void }) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // Sem <form>: o botão é type="button" e chama esta função diretamente. Assim o
  // clique nunca dispara um submit — o formulário de Dados da Empresa não é acionado
  // e a aba ativa não é resetada.
  const handleAdicionar = () => {
    if (!nomeEmpresa.trim() && !cnpj.trim()) return

    const novo: VinculoSocietario = {
      id: `vinc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      nomeEmpresa: nomeEmpresa.trim() || 'Empresa Vinculada',
      cnpj: cnpj.trim(),
      papelCliente: papel,
      percentualParticipacao: Number(participacao) || 0,
      exerceAdministracao: administracao,
      regimeEmpresa: regime,
      faturamentoAnual: Number(faturamentoAnual) || 0,
      excecaoLegal: papel === 'empresa_participa_outra' ? excecaoLegal : false,
      observacoes: observacoes.trim() || undefined,
      dataCadastro: new Date().toISOString(),
    }

    console.log('[VinculosSocietarios] item adicionado no clique de Salvar Vínculo', novo)
    onChangeVinculos([...vinculos, novo])

    // Reset formulário
    setNomeEmpresa('')
    setCnpj('')
    setPapel('socio_pf')
    setParticipacao(50)
    setAdministracao(true)
    setRegime('Simples Nacional')
    setFaturamentoAnual(500000)
    setExcecaoLegal(false)
    setObservacoes('')
    setFormAberto(false)
  }

  const [idPendenteRemocao, setIdPendenteRemocao] = useState<string | null>(null)

  // Remoção em duas etapas (confirmação simples): 1º clique marca o item como
  // "aguardando confirmação" (o botão vira ✓ Confirmar / ✗ Cancelar); 2º clique
  // em Confirmar efetivamente remove. Sem window.confirm — nada bloqueia o
  // navegador e o clique nunca submete o form da página (type="button" +
  // preventDefault/stopPropagation em todos os botões da barra).
  const handlePedirConfirmacao = (id: string) => {
    setIdPendenteRemocao(id)
  }

  const handleConfirmarRemocao = (id: string) => {
    if (idPendenteRemocao === id) {
      onChangeVinculos(vinculos.filter((v) => v.id !== id))
    }
    setIdPendenteRemocao(null)
  }

  const handleCancelarRemocao = (id: string) => {
    if (idPendenteRemocao === id) setIdPendenteRemocao(null)
  }

  return (
    <Card className="border border-slate-200/80 shadow-md rounded-2xl overflow-hidden bg-white">
      <div className="p-6 md:p-8 bg-gradient-to-r from-[#07132B] via-[#0E2442] to-[#14345C] text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#D4AF37] shrink-0 mt-1">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-bold text-lg text-white">
                  Vínculos Societários & Risco de Regime
                </h3>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                  LC 123/2006 • Res. CGSN 140/2018
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Mapeamento de outras empresas em que os sócios participam, holdings sócias ou
                investimentos diretos. Permite apurar o faturamento global e evitar desenquadramento
                involuntário do Simples Nacional ou autuações fiscais retroativas.
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setFormAberto((v) => !v)}
            className="shrink-0 bg-[#2ECC71] hover:bg-[#27AE60] text-[#0A1A13] font-bold text-xs h-9 px-4 rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {formAberto ? 'Fechar Formulário' : 'Adicionar Vínculo'}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setPainelGeAberto((v) => !v)}
            aria-expanded={painelGeAberto}
            className="shrink-0 bg-white/10 hover:bg-white/20 text-white border-[#D4AF37]/50 hover:text-white text-xs font-bold h-9 px-4 rounded-xl"
          >
            <Network className="w-4 h-4 mr-1.5 text-[#D4AF37]" />
            {painelGeAberto ? 'Fechar Grupo Econômico' : 'Grupo Econômico (GE)'}
          </Button>
        </div>
      </div>

      <CardContent className="p-6 md:p-8 space-y-6">
        {/* PAINEL GRUPO ECONÔMICO (GE): árvore + faturamento consolidado vs teto */}
        {painelGeAberto && (
          <PainelGrupoEconomico
            empresaNome={empresaNome}
            empresaCnpj={empresaCnpj}
            regimeAtual={regimeAtual}
            faturamentoMensalProprio={faturamentoMensalProprio}
            vinculos={vinculos}
            historicoVinculos={historicoVinculos}
            onAdicionarEmpresa={() => {
              // Reutiliza o formulário de vínculo existente — nenhum fluxo novo de gravação.
              setPainelGeAberto(false)
              setFormAberto(true)
            }}
          />
        )}

        {/* FORMULÁRIO DE CADASTRO EXPANSÍVEL */}
        {formAberto && (
          <div
            role="group"
            aria-label="Cadastrar outra empresa ou vínculo"
            onKeyDown={(e) => {
              // Enter nos campos não pode submeter o formulário da página
              if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
                e.preventDefault()
              }
            }}
            className="p-5 md:p-6 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#D4AF37]" />
                Cadastrar Outra Empresa / Vínculo
              </span>
              <span className="text-[11px] text-slate-500">
                Campos marcados com * são essenciais para o motor
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="vincNome" className="text-xs font-semibold text-slate-700">
                  Razão Social ou Nome Fantasia da Outra Empresa *
                </Label>
                <Input
                  id="vincNome"
                  required
                  placeholder="Ex: Alfa Logística e Transportes Ltda"
                  value={nomeEmpresa}
                  onChange={(e) => setNomeEmpresa(e.target.value)}
                  className="h-10 text-xs bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vincCnpj" className="text-xs font-semibold text-slate-700">
                  CNPJ da Outra Empresa (opcional)
                </Label>
                <Input
                  id="vincCnpj"
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="h-10 text-xs bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label
                  htmlFor="vincPapel"
                  className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                  Relação / Papel Societário *
                </Label>
                <Select value={papel} onValueChange={(val: PapelClienteNoVinculo) => setPapel(val)}>
                  <SelectTrigger id="vincPapel" className="h-10 text-xs bg-white">
                    <SelectValue placeholder="Selecione o papel" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPCOES_PAPEL.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="text-left py-0.5">
                          <span className="font-semibold block">{p.rotulo}</span>
                          <span className="text-[10px] text-slate-500">{p.descricao}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="vincRegime"
                  className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <Scale className="w-3.5 h-3.5 text-slate-500" />
                  Regime da Outra Empresa *
                </Label>
                <Select value={regime} onValueChange={(val: RegimeOutraEmpresa) => setRegime(val)}>
                  <SelectTrigger id="vincRegime" className="h-10 text-xs bg-white">
                    <SelectValue placeholder="Selecione o regime" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPCOES_REGIME.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="vincParticipacao"
                  className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <Percent className="w-3.5 h-3.5 text-slate-500" />% Participação no Capital
                </Label>
                <Input
                  id="vincParticipacao"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={participacao}
                  onChange={(e) => setParticipacao(Number(e.target.value) || 0)}
                  className="h-10 text-xs bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="vincFaturamento"
                  className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                  Faturamento Bruto Anual (R$) *
                </Label>
                <Input
                  id="vincFaturamento"
                  type="number"
                  min={0}
                  step={1000}
                  value={faturamentoAnual}
                  onChange={(e) => setFaturamentoAnual(Number(e.target.value) || 0)}
                  className="h-10 text-xs bg-white font-mono"
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="vincAdministracao"
                  checked={administracao}
                  onCheckedChange={(checked) => setAdministracao(Boolean(checked))}
                />
                <Label
                  htmlFor="vincAdministracao"
                  className="text-xs text-slate-700 cursor-pointer leading-tight"
                >
                  Exerce cargo de <strong>Administração</strong> na outra PJ
                </Label>
              </div>

              {papel === 'empresa_participa_outra' && (
                <div className="sm:col-span-3 p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vincExcecao"
                      checked={excecaoLegal}
                      onCheckedChange={(checked) => setExcecaoLegal(Boolean(checked))}
                    />
                    <Label
                      htmlFor="vincExcecao"
                      className="text-xs font-bold text-amber-900 cursor-pointer"
                    >
                      Enquadra-se em Exceção Legal expressa (central de compras, cooperativa de
                      crédito, consórcio ou joint venture autorizada)
                    </Label>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    A regra geral do art. 3º, §4º, VII da LC 123 veda que optante do Simples
                    participe do capital de outra PJ. Apenas marque esta opção se houver suporte
                    legal específico.
                  </p>
                </div>
              )}

              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor="vincObs" className="text-xs font-semibold text-slate-700">
                  Anotações / Contexto (opcional)
                </Label>
                <Input
                  id="vincObs"
                  placeholder="Ex: Empresa de serviços de TI do mesmo grupo familiar"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="h-9 text-xs bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFormAberto(false)}
                className="text-xs text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleAdicionar()
                }}
                className="bg-[#07132B] hover:bg-[#0c244c] text-white font-bold text-xs px-5"
              >
                Salvar Vínculo
              </Button>
            </div>
          </div>
        )}

        {/* LISTA DE VÍNCULOS CADASTRADOS */}
        {vinculos.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
            <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">
              Nenhum vínculo societário ou outra empresa cadastrada.
            </p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Se os sócios não possuem participação em outras empresas e não há holding/PJ no
              quadro, o Simples Nacional é avaliado estritamente sobre a receita desta empresa
              isolada.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Empresas Vinculadas ({vinculos.length})
              </span>
              <span className="text-[11px] text-slate-500">
                Receita desta empresa: <strong>{formatarMoeda(faturamentoAnualProprio)}/ano</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {vinculos.map((v) => {
                const papelObj = OPCOES_PAPEL.find((p) => p.id === v.papelCliente)
                const isVedacao =
                  v.papelCliente === 'pj_socia_holding' ||
                  (v.papelCliente === 'empresa_participa_outra' && !v.excecaoLegal)

                return (
                  <div
                    key={v.id}
                    className={`p-4 rounded-xl border transition-all space-y-2 relative ${
                      isVedacao
                        ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <strong className="text-xs font-bold font-heading">
                            {v.nomeEmpresa}
                          </strong>
                          {v.cnpj && (
                            <span className="text-[10px] font-mono text-slate-500">({v.cnpj})</span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-600 font-medium block mt-0.5">
                          {papelObj?.rotulo || v.papelCliente}
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          ePrevenirSubmissao(e)
                          handlePedirConfirmacao(v.id)
                        }}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg shrink-0"
                        title="Remover este vínculo"
                        aria-label={`Remover vínculo ${v.nomeEmpresa}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-[11px]">
                      <div>
                        <span className="text-[9px] uppercase font-semibold text-slate-400 block">
                          Regime
                        </span>
                        <strong className="font-semibold">{v.regimeEmpresa}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-semibold text-slate-400 block">
                          Participação
                        </span>
                        <strong className="font-mono">
                          {v.percentualParticipacao}% {v.exerceAdministracao ? '(Adm)' : ''}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-semibold text-slate-400 block">
                          Receita Anual
                        </span>
                        <strong className="font-mono text-slate-900">
                          {formatarMoeda(v.faturamentoAnual)}
                        </strong>
                      </div>
                    </div>

                    {v.observacoes && (
                      <p className="text-[10px] text-slate-500 italic pt-1">
                        &quot;{v.observacoes}&quot;
                      </p>
                    )}

                    {/* CONFIRMAÇÃO DE REMOÇÃO (barra inline) — nunca submete o form da página */}
                    {idPendenteRemocao === v.id && (
                      <div
                        data-testid={`confirmacao-remocao-${v.id}`}
                        className="pt-2 border-t border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <span className="text-[11px] font-semibold text-rose-800 leading-snug">
                          Remover &quot;{v.nomeEmpresa}&quot; da lista e do grupo econômico?
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            onClick={(e) => {
                              ePrevenirSubmissao(e)
                              handleConfirmarRemocao(v.id)
                            }}
                            data-testid={`confirmar-remocao-${v.id}`}
                            className="h-7 px-3 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
                          >
                            ✓ Confirmar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              ePrevenirSubmissao(e)
                              handleCancelarRemocao(v.id)
                            }}
                            data-testid={`cancelar-remocao-${v.id}`}
                            className="h-7 px-3 text-[11px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                          >
                            ✗ Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* PAINEL DE ANÁLISE DE ACHADOS & RISCOS (MOTOR PURAMENTE INDICATIVO) */}
        {vinculos.length > 0 && (
          <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#07132B]">
                  Parecer Técnico de Risco de Regime (LC 123/2006)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    analise.statusGeral === 'critico'
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : analise.statusGeral === 'atencao'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {analise.statusGeral === 'critico'
                    ? '🔴 Risco Crítico / Vedação'
                    : analise.statusGeral === 'atencao'
                      ? '🟡 Atenção / Monitoramento'
                      : '🟢 Regular / Permitido'}
                </span>
              </div>
            </div>

            {/* CARDS COM MÉTRICAS DE FATURAMENTO GLOBAL */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Receita Própria Anual
                </span>
                <strong className="text-xs font-mono text-slate-900 block">
                  {formatarMoeda(analise.faturamentoProprioAnual)}
                </strong>
                <span className="text-[10px] text-slate-500">
                  {((analise.faturamentoProprioAnual / TETO_SIMPLES_NACIONAL) * 100).toFixed(1)}% do
                  teto R$ 4,8M
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Receita Global do Grupo
                </span>
                <strong
                  className={`text-xs font-mono block ${
                    analise.ultrapassouTolerancia20
                      ? 'text-rose-700 font-bold'
                      : analise.ultrapassouTeto
                        ? 'text-amber-700 font-bold'
                        : 'text-slate-900'
                  }`}
                >
                  {formatarMoeda(
                    Math.max(analise.faturamentoGlobalSimples, analise.faturamentoSomaCondicional),
                  )}
                </strong>
                <span className="text-[10px] text-slate-500">Soma com empresas vinculadas</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Teto Legal Simples
                </span>
                <strong className="text-xs font-mono text-slate-900 block">R$ 4.800.000,00</strong>
                <span className="text-[10px] text-slate-500">Tolerância 20%: R$ 5.760.000,00</span>
              </div>
            </div>

            {/* LISTA DE ACHADOS DETALHADOS COM CITAÇÃO LEGAL */}
            <div className="space-y-2.5 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                Achados do Diagnóstico Societário ({analise.achados.length})
              </span>

              {analise.achados.map((a) => {
                const isCrit = a.severidade === 'critico'
                const isAtenc = a.severidade === 'atencao'

                return (
                  <div
                    key={a.id}
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                      isCrit
                        ? 'bg-rose-50 border-rose-200 text-rose-950'
                        : isAtenc
                          ? 'bg-amber-50 border-amber-200 text-amber-950'
                          : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold">
                        {isCrit ? (
                          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        ) : isAtenc ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        <span>{a.titulo}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/80 border shrink-0">
                        {a.norma}
                      </span>
                    </div>

                    <p className="text-[11px] leading-relaxed opacity-90">{a.descricao}</p>

                    <div className="pt-1 border-t border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px]">
                      <span>
                        <strong>Impacto no regime:</strong> {a.impactoRegime}
                      </span>
                      <span className="italic opacity-80">
                        <strong>Recomendação:</strong> {a.recomendacao}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-100 text-[11px] text-blue-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Importante (Padrão Contabilidade 5.0):</strong> Este módulo atua
                exclusivamente como indicador preventivo de conformidade societária. Ele{' '}
                <strong>não altera alíquotas</strong> nem marca teses de recuperação de créditos
                automaticamente.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
