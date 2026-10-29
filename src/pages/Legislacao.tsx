import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  pesquisarLegislacao,
  ItemLegislacao,
  dispararVarreduraRadar,
} from '@/services/radarTributario'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function Legislacao() {
  const { toast } = useToast()
  const [busca, setBusca] = useState('')
  const [filtroTributo, setFiltroTributo] = useState('TODOS')
  const [filtroAno, setFiltroAno] = useState('TODOS')
  const [filtroTipo, setFiltroTipo] = useState('todos')

  const [itens, setItens] = useState<ItemLegislacao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [sincronizando, setSincronizando] = useState(false)

  const carregarDados = async () => {
    try {
      setCarregando(true)
      const res = await pesquisarLegislacao({
        q: busca,
        tributo: filtroTributo,
        ano: filtroAno,
        tipo: filtroTipo,
      })
      setItens(res.itens || [])
    } catch (err) {
      console.warn('Erro ao carregar legislação:', err)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarDados()
    }, 250)
    return () => clearTimeout(timer)
  }, [busca, filtroTributo, filtroAno, filtroTipo])

  const handleForcarVarredura = async () => {
    try {
      setSincronizando(true)
      const res = await dispararVarreduraRadar()
      if (res.sucesso) {
        toast({
          title: 'Varredura Concluída',
          description: `Fontes oficiais consultadas. ${res.novosEncontrados || 0} novo(s) parâmetro(s) processados.`,
        })
        carregarDados()
      } else {
        toast({
          title: 'Aviso de Sincronização',
          description: 'A varredura foi executada e a base de normas permanece atualizada.',
        })
      }
    } catch (err: any) {
      toast({
        title: 'Erro na varredura',
        description: err?.message || 'Falha ao consultar fontes oficiais remotas.',
        variant: 'destructive',
      })
    } finally {
      setSincronizando(false)
    }
  }

  // Divisão: Legislações Chave da Reforma (Fixas) vs Outras Normas Encontradas
  const normasChave = itens.filter((i) => i.destaque)
  const outrasNormas = itens.filter((i) => !i.destaque)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Banner Hero Superior - Padrão Visual Diamond Group (Navy #07132B, Dourado #D4AF37, SEM ícones) */}
      <section className="bg-[#07132B] text-white pt-24 pb-16 px-4 sm:px-6 relative overflow-hidden border-b-2 border-[#D4AF37]/50 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-[1200px] mx-auto relative space-y-4">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/40 tracking-wider uppercase">
            Radar Tributário • Portal de Legislação Oficial
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-heading font-extrabold tracking-tight text-white max-w-3xl">
            Repositório & Pesquisa de <span className="text-[#D4AF37]">Legislação Tributária</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            Acompanhamento centralizado das normas, acórdãos e resoluções da Reforma Tributária (EC
            132/2023, LC 214/2025, PLN 24/2026 e deliberações TCU/Senado). Busca automatizada
            integrada às APIs abertas do Senado Federal e LexML.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={handleForcarVarredura}
              disabled={sincronizando}
              className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B] font-bold text-xs h-10 px-4 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>
                {sincronizando ? 'Consultando APIs Oficiais...' : 'Atualizar Radar Agora'}
              </span>
            </Button>
            <Link
              to="/calculadora-ibs-cbs"
              className="inline-flex items-center justify-center text-xs font-bold h-10 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/20 transition-all"
            >
              Ir para Calculadora IBS/CBS
            </Link>
          </div>
        </div>
      </section>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 mt-8 space-y-10">
        {/* BARRA DE BUSCA E FILTROS */}
        <Card className="border-slate-200 shadow-md bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-[#07132B]">
              Filtros de Pesquisa Normativa
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Campo de Busca Livre */}
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Termo de Busca (Número, Ementa ou Assunto)
                </label>
                <Input
                  type="text"
                  placeholder="Ex: CBS, 11,3468, LC 214, crédito presumido..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              {/* Filtro: Tributo */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Tributo</label>
                <Select value={filtroTributo} onValueChange={setFiltroTributo}>
                  <SelectTrigger className="h-10 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos os tributos</SelectItem>
                    <SelectItem value="CBS">CBS (Federal)</SelectItem>
                    <SelectItem value="IBS">IBS (Estados e Municípios)</SelectItem>
                    <SelectItem value="GERAL">Geral / Amplo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro: Ano */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Ano da Norma
                </label>
                <Select value={filtroAno} onValueChange={setFiltroAno}>
                  <SelectTrigger className="h-10 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos os anos</SelectItem>
                    <SelectItem value="2027">2027 (Transição CBS)</SelectItem>
                    <SelectItem value="2026">2026 (Fixação e Teste)</SelectItem>
                    <SelectItem value="2025">2025 (LC 214)</SelectItem>
                    <SelectItem value="2023">2023 (EC 132)</SelectItem>
                    <SelectItem value="2011">2011</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtro: Tipo de Ato */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="font-semibold text-slate-500 mr-2">Tipo de Ato:</span>
              {[
                { id: 'todos', label: 'Todos os tipos' },
                { id: 'emenda', label: 'Emenda Constitucional' },
                { id: 'complementar', label: 'Lei Complementar' },
                { id: 'projeto', label: 'Projetos de Lei / PLN' },
                { id: 'resolucao', label: 'Resoluções do Senado' },
                { id: 'acordao', label: 'Acórdão / TCU' },
              ].map((tp) => (
                <button
                  key={tp.id}
                  type="button"
                  onClick={() => setFiltroTipo(tp.id)}
                  className={`px-3 py-1 rounded-full font-medium transition-all ${
                    filtroTipo === tp.id
                      ? 'bg-[#07132B] text-[#D4AF37] font-bold shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tp.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 1: LEGISLAÇÃO-CHAVE DA REFORMA TRIBUTÁRIA (FIXA E OBRIGATÓRIA) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-[#D4AF37]">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#D4AF37]">
                Marco Legal Fundamental
              </span>
              <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#07132B]">
                Legislação-Chave da Reforma Tributária
              </h2>
            </div>
            <span className="text-xs font-mono font-bold bg-[#07132B] text-white px-3 py-1 rounded-lg">
              {normasChave.length} normas fundamentais
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {normasChave.map((norma) => (
              <div
                key={norma.id}
                className="bg-white rounded-2xl border-2 border-slate-200 hover:border-[#D4AF37] shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#07132B] text-[#D4AF37]">
                      {norma.tipo}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {norma.dataPublicacao}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-base text-[#07132B] leading-tight">
                    {norma.titulo}
                  </h3>

                  <p className="text-xs text-slate-500 font-medium">
                    Órgão: <span className="text-slate-700 font-semibold">{norma.orgao}</span>
                  </p>

                  <p className="text-xs text-slate-600 leading-relaxed pt-1">{norma.ementa}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] font-bold text-[#07132B]">
                    Tributo: {norma.tributo}
                  </span>
                  <a
                    href={norma.linkOficial}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#07132B] hover:text-[#D4AF37] underline decoration-1 underline-offset-2 transition-colors"
                  >
                    Acessar Texto Oficial →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SEÇÃO 2: RESULTADOS DE BUSCA / OUTRAS MATÉRIAS ENCONTRADAS */}
        {outrasNormas.length > 0 && (
          <section className="space-y-4 pt-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h2 className="text-lg sm:text-xl font-heading font-bold text-[#07132B]">
                Outras Normas & Proposições Relacionadas
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {outrasNormas.length} resultado(s)
              </span>
            </div>

            <div className="space-y-3">
              {outrasNormas.map((norma) => (
                <div
                  key={norma.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-all space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-bold text-sm text-[#07132B]">{norma.titulo}</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {norma.dataPublicacao}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{norma.ementa}</p>
                  <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-100">
                    <span className="text-slate-500 text-[11px]">
                      {norma.orgao} • {norma.tributo}
                    </span>
                    <a
                      href={norma.linkOficial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#07132B] hover:text-[#D4AF37] underline"
                    >
                      Ver documento
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {carregando && (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            Carregando repositório de legislação...
          </div>
        )}
      </main>
    </div>
  )
}
