import { useState, useMemo } from 'react'
import type {
  UsuarioSistema,
  NivelAcesso,
  PermissaoMaster,
  AnalistaMetricasItem,
} from '@/types/master'
import { TODAS_PERMISSOES } from '@/types/master'
import {
  atualizarNivelEPermissoesUsuario,
  alternarStatusOperacaoUsuario,
  atualizarDadosBasicosUsuario,
} from '@/services/master'
import { ModalExcluirUsuario } from '@/components/admin/ModalExcluirUsuario'
import { ModalExcluirAnalista } from '@/components/admin/ModalExcluirAnalista'
import { ModalExcluirEmpresario } from '@/components/admin/ModalExcluirEmpresario'
import { ModalIncluirUsuarioManual } from '@/components/admin/ModalIncluirUsuarioManual'
import { ModalEnviarConviteNivel } from '@/components/admin/ModalEnviarConviteNivel'
import { ModalControleComercialAnalista } from '@/components/admin/ModalControleComercialAnalista'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface AbaUsuariosPermissoesProps {
  usuarios: UsuarioSistema[]
  isLoading: boolean
  isMaster: boolean
  usuarioLogadoId?: string
  usuarioLogadoEmail?: string
  nivelLogado?: NivelAcesso
  masterId?: string
  onAtualizar: () => void
  onFeedback?: (feedback: { tipo: 'sucesso' | 'erro'; mensagem: string } | null) => void
}

/**
 * Aba "Usuários & Permissões" do painel Admin (/admin)
 * Organizada em TRÊS QUADROS SEPARADOS, no padrão visual Diamond Group
 * (navy #07132B, dourado #D4AF37), SEM ÍCONES na interface:
 *
 * 1) Quadro "Administradores" (somente master e admins)
 * 2) Quadro "Analistas & Parceiros" (100+ analistas, busca, paginação, comercial R$ 347, status operação)
 * 3) Quadro "Empresários/Clientes" (todos os empresários diretos ou convidados, status plano, suspensão, exclusão com dados vinculados)
 *
 * Em todos os 3 quadros:
 * - "Incluir manualmente"
 * - "Enviar convite por e-mail"
 */
export function AbaUsuariosPermissoes({
  usuarios,
  isLoading,
  isMaster,
  usuarioLogadoId,
  usuarioLogadoEmail,
  nivelLogado = 'master',
  masterId,
  onAtualizar,
  onFeedback,
}: AbaUsuariosPermissoesProps) {
  // Banner de feedback local
  const [feedbackLocal, setFeedbackLocal] = useState<{
    tipo: 'sucesso' | 'erro'
    mensagem: string
  } | null>(null)

  const emitirFeedback = (tipo: 'sucesso' | 'erro', mensagem: string) => {
    setFeedbackLocal({ tipo, mensagem })
    if (onFeedback) {
      onFeedback({ tipo, mensagem })
    }
    setTimeout(() => {
      setFeedbackLocal(null)
    }, 6000)
  }

  // =========================================================
  // ESTADOS DOS MODAIS GLOBAIS DE INCLUSÃO E CONVITE
  // =========================================================
  const [modalInclusaoAberto, setModalInclusaoAberto] = useState(false)
  const [nivelInclusaoFixo, setNivelInclusaoFixo] = useState<NivelAcesso>('analista')

  const [modalConviteAberto, setModalConviteAberto] = useState(false)
  const [nivelConviteFixo, setNivelConviteFixo] = useState<NivelAcesso>('analista')

  const abrirInclusao = (nivel: NivelAcesso) => {
    setNivelInclusaoFixo(nivel)
    setModalInclusaoAberto(true)
  }

  const abrirConvite = (nivel: NivelAcesso) => {
    setNivelConviteFixo(nivel)
    setModalConviteAberto(true)
  }

  // =========================================================
  // QUADRO 1: ADMINISTRADORES
  // =========================================================
  const admins = useMemo(() => {
    return usuarios.filter((u) => u.nivel_acesso === 'master' || u.nivel_acesso === 'admin')
  }, [usuarios])

  // Modais específicos de Administradores
  const [adminParaEditarPermissoes, setAdminParaEditarPermissoes] = useState<UsuarioSistema | null>(
    null,
  )
  const [permissoesEditadas, setPermissoesEditadas] = useState<PermissaoMaster[]>([])
  const [salvandoPermissoes, setSalvandoPermissoes] = useState(false)

  const [adminParaRebaixar, setAdminParaRebaixar] = useState<UsuarioSistema | null>(null)
  const [rebaixando, setRebaixando] = useState(false)

  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<UsuarioSistema | null>(null)

  const abrirEdicaoPermissoesAdmin = (admin: UsuarioSistema) => {
    setAdminParaEditarPermissoes(admin)
    setPermissoesEditadas([...(admin.permissoes_json || [])])
  }

  const alternarPermissaoAdmin = (perm: PermissaoMaster) => {
    if (permissoesEditadas.includes(perm)) {
      setPermissoesEditadas(permissoesEditadas.filter((p) => p !== perm))
    } else {
      setPermissoesEditadas([...permissoesEditadas, perm])
    }
  }

  const salvarPermissoesAdmin = async () => {
    if (!adminParaEditarPermissoes) return
    try {
      setSalvandoPermissoes(true)
      await atualizarNivelEPermissoesUsuario({
        usuarioId: adminParaEditarPermissoes.id,
        nivel_acesso: 'admin',
        permissoes_json: permissoesEditadas,
        masterUsuarioId: usuarioLogadoId,
      })
      emitirFeedback(
        'sucesso',
        `Permissões de "${adminParaEditarPermissoes.name}" atualizadas com sucesso.`,
      )
      setAdminParaEditarPermissoes(null)
      onAtualizar()
    } catch (err: any) {
      emitirFeedback('erro', err?.message || 'Falha ao salvar permissões do administrador.')
    } finally {
      setSalvandoPermissoes(false)
    }
  }

  const confirmarRebaixarAdmin = async () => {
    if (!adminParaRebaixar) return
    try {
      setRebaixando(true)
      await atualizarNivelEPermissoesUsuario({
        usuarioId: adminParaRebaixar.id,
        nivel_acesso: 'analista',
        permissoes_json: [],
        masterUsuarioId: usuarioLogadoId,
      })
      emitirFeedback(
        'sucesso',
        `O administrador "${adminParaRebaixar.name}" foi rebaixado para Analista com sucesso.`,
      )
      setAdminParaRebaixar(null)
      onAtualizar()
    } catch (err: any) {
      emitirFeedback('erro', err?.message || 'Falha ao rebaixar administrador.')
    } finally {
      setRebaixando(false)
    }
  }

  // =========================================================
  // QUADRO 2: ANALISTAS & PARCEIROS (PAGINAÇÃO, BUSCA, COMERCIAL)
  // =========================================================
  const analistas = useMemo(() => {
    return usuarios.filter(
      (u) =>
        u.nivel_acesso === 'analista' ||
        (u.perfil === 'contador' && u.nivel_acesso !== 'master' && u.nivel_acesso !== 'admin'),
    )
  }, [usuarios])

  const [buscaAnalista, setBuscaAnalista] = useState('')
  const [filtroStatusAnalista, setFiltroStatusAnalista] = useState<string>('todos')
  const [paginaAnalista, setPaginaAnalista] = useState(1)
  const ITENS_POR_PAGINA_ANALISTA = 10

  const analistasFiltrados = useMemo(() => {
    const termo = buscaAnalista.toLowerCase().trim()
    return analistas.filter((a) => {
      const matchBusca =
        !termo ||
        a.name?.toLowerCase().includes(termo) ||
        a.email?.toLowerCase().includes(termo) ||
        a.criador_nome?.toLowerCase().includes(termo)

      const matchStatus =
        filtroStatusAnalista === 'todos' ||
        (filtroStatusAnalista === 'autorizado'
          ? a.status_operacao !== 'suspenso'
          : a.status_operacao === 'suspenso')

      return matchBusca && matchStatus
    })
  }, [analistas, buscaAnalista, filtroStatusAnalista])

  const totalPaginasAnalista = Math.max(
    1,
    Math.ceil(analistasFiltrados.length / ITENS_POR_PAGINA_ANALISTA),
  )
  const analistasPaginados = useMemo(() => {
    const inicio = (paginaAnalista - 1) * ITENS_POR_PAGINA_ANALISTA
    return analistasFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA_ANALISTA)
  }, [analistasFiltrados, paginaAnalista])

  // Modais de Analista
  const [analistaParaComercial, setAnalistaParaComercial] = useState<UsuarioSistema | null>(null)
  const [analistaParaExcluir, setAnalistaParaExcluir] = useState<AnalistaMetricasItem | null>(null)

  const todosAnalistasMetricas = useMemo<AnalistaMetricasItem[]>(() => {
    return analistas.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      nivel_acesso: a.nivel_acesso,
      total_clientes: a.total_clientes || 0,
      total_diagnosticos: a.total_diagnosticos || 0,
      total_simulacoes: a.total_simulacoes || 0,
      ultimo_acesso_ou_criado: a.updated || a.created || '',
      clientes_carteira: [],
    }))
  }, [analistas])

  const abrirModalExclusaoAnalista = (a: UsuarioSistema) => {
    setAnalistaParaExcluir({
      id: a.id,
      name: a.name,
      email: a.email,
      nivel_acesso: a.nivel_acesso,
      total_clientes: a.total_clientes || 0,
      total_diagnosticos: a.total_diagnosticos || 0,
      total_simulacoes: a.total_simulacoes || 0,
      ultimo_acesso_ou_criado: a.updated || a.created || '',
      clientes_carteira: [],
    })
  }

  // =========================================================
  // QUADRO 3: EMPRESÁRIOS / CLIENTES
  // =========================================================
  const empresarios = useMemo(() => {
    return usuarios.filter(
      (u) =>
        u.nivel_acesso === 'empresario' ||
        (u.perfil === 'empresario' && u.nivel_acesso !== 'master' && u.nivel_acesso !== 'admin'),
    )
  }, [usuarios])

  const [buscaEmpresario, setBuscaEmpresario] = useState('')
  const [paginaEmpresario, setPaginaEmpresario] = useState(1)
  const ITENS_POR_PAGINA_EMPRESARIO = 10

  const empresariosFiltrados = useMemo(() => {
    const termo = buscaEmpresario.toLowerCase().trim()
    return empresarios.filter((e) => {
      return (
        !termo ||
        e.name?.toLowerCase().includes(termo) ||
        e.email?.toLowerCase().includes(termo) ||
        e.criador_nome?.toLowerCase().includes(termo)
      )
    })
  }, [empresarios, buscaEmpresario])

  const totalPaginasEmpresario = Math.max(
    1,
    Math.ceil(empresariosFiltrados.length / ITENS_POR_PAGINA_EMPRESARIO),
  )
  const empresariosPaginados = useMemo(() => {
    const inicio = (paginaEmpresario - 1) * ITENS_POR_PAGINA_EMPRESARIO
    return empresariosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA_EMPRESARIO)
  }, [empresariosFiltrados, paginaEmpresario])

  // Modais de Empresário
  const [empresarioParaEditar, setEmpresarioParaEditar] = useState<UsuarioSistema | null>(null)
  const [nomeEditandoEmpresario, setNomeEditandoEmpresario] = useState('')
  const [salvandoEdicaoEmpresario, setSalvandoEdicaoEmpresario] = useState(false)

  const [empresarioParaExcluir, setEmpresarioParaExcluir] = useState<UsuarioSistema | null>(null)

  const abrirEdicaoEmpresario = (e: UsuarioSistema) => {
    setEmpresarioParaEditar(e)
    setNomeEditandoEmpresario(e.name)
  }

  const salvarEdicaoEmpresario = async () => {
    if (!empresarioParaEditar) return
    try {
      setSalvandoEdicaoEmpresario(true)
      await atualizarDadosBasicosUsuario({
        usuarioId: empresarioParaEditar.id,
        name: nomeEditandoEmpresario.trim() || empresarioParaEditar.name,
      })
      emitirFeedback('sucesso', `Dados de "${nomeEditandoEmpresario}" atualizados com sucesso.`)
      setEmpresarioParaEditar(null)
      onAtualizar()
    } catch (err: any) {
      emitirFeedback('erro', err?.message || 'Falha ao atualizar dados do empresário.')
    } finally {
      setSalvandoEdicaoEmpresario(false)
    }
  }

  const alternarSuspensaoEmpresario = async (emp: UsuarioSistema) => {
    const novoStatus = emp.status_operacao === 'suspenso' ? 'autorizado' : 'suspenso'
    try {
      await alternarStatusOperacaoUsuario({
        usuarioId: emp.id,
        novoStatus,
        autorizadorId: usuarioLogadoId,
      })
      const acao = novoStatus === 'autorizado' ? 'reativado' : 'suspenso'
      emitirFeedback('sucesso', `Acesso do empresário "${emp.name}" foi ${acao} com sucesso.`)
      onAtualizar()
    } catch (err: any) {
      emitirFeedback('erro', err?.message || 'Falha ao alterar status do empresário.')
    }
  }

  return (
    <div className="space-y-8">
      {/* BANNER DE FEEDBACK LOCAL */}
      {feedbackLocal && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between border shadow-sm ${
            feedbackLocal.tipo === 'sucesso'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <span>{feedbackLocal.mensagem}</span>
          <button
            type="button"
            onClick={() => setFeedbackLocal(null)}
            className="text-xs px-2.5 py-1 rounded bg-black/5 hover:bg-black/10 font-bold ml-3"
          >
            Fechar
          </button>
        </div>
      )}

      {/* CABEÇALHO GERAL DE GOVERNANÇA */}
      <div className="p-5 rounded-2xl bg-[#07132B] text-white border border-[#D4AF37]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] block">
            Governança & Controle de Acessos • Diamond Group
          </span>
          <h2 className="text-lg font-heading font-bold text-white mt-0.5">
            Gestão Integrada de Usuários & Permissões
          </h2>
          <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
            Estrutura segregada em 3 quadros estratégicos: Administradores, Analistas & Parceiros e
            Empresários/Clientes, com inclusão direta e disparo formal de convites.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAtualizar}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#D4AF37] text-xs font-bold border border-[#D4AF37]/30 transition-all"
          >
            Atualizar Listagens
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1) QUADRO: ADMINISTRADORES (SOMENTE MASTER E ADMINS) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Topo do Quadro 1 */}
        <div className="p-5 bg-gradient-to-r from-[#07132B] to-[#0d2249] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#D4AF37]/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37] bg-white/10 px-2 py-0.5 rounded">
                Quadro 1 • Alta Governança
              </span>
              <span className="text-xs text-slate-300">
                {admins.length} Administrador(es) no total
              </span>
            </div>
            <h3 className="text-xl font-heading font-extrabold text-white mt-1">
              Administradores do Sistema
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Apenas o Master elege, edita permissões, rebaixa e exclui administradores.
            </p>
          </div>

          {/* DUAS FORMAS DE INCLUSÃO PARA ADMIN */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!isMaster}
              onClick={() => abrirInclusao('admin')}
              className="px-3.5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#c29d2b] text-[#07132B] font-bold text-xs shadow-sm transition-all disabled:opacity-40"
              title={isMaster ? 'Criar administrador' : 'Exclusivo do Titular Master'}
            >
              Incluir Manualmente
            </button>
            <button
              type="button"
              disabled={!isMaster}
              onClick={() => abrirConvite('admin')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all disabled:opacity-40"
              title={isMaster ? 'Enviar convite de administrador' : 'Exclusivo do Titular Master'}
            >
              Enviar Convite por E-mail
            </button>
          </div>
        </div>

        {/* Tabela de Administradores */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#07132B]/5 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-5">Administrador</th>
                <th className="py-3 px-5">Funções & Permissões Designadas</th>
                <th className="py-3 px-5">Data de Eleição</th>
                <th className="py-3 px-5">Eleito Por</th>
                <th className="py-3 px-5 text-right">Ações de Governança</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map((adm) => {
                const ehMarco =
                  adm.email?.toLowerCase() === 'marcoschagasdiamond@icloud.com' ||
                  adm.nivel_acesso === 'master'

                return (
                  <tr
                    key={adm.id}
                    className={`transition-colors ${
                      ehMarco ? 'bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#07132B]">{adm.name}</span>
                        {ehMarco && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]">
                            Titular Master
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 font-mono text-[11px]">{adm.email}</div>
                    </td>

                    <td className="py-4 px-5">
                      {ehMarco ? (
                        <span className="inline-block text-xs font-bold text-[#07132B] bg-[#D4AF37] px-2.5 py-1 rounded-lg">
                          Acesso Pleno & Irrestrito (Master Vitalício)
                        </span>
                      ) : adm.permissoes_json && adm.permissoes_json.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {adm.permissoes_json.map((p) => {
                            const rotulo = TODAS_PERMISSOES.find((d) => d.id === p)?.rotulo || p
                            return (
                              <span
                                key={p}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200"
                              >
                                {rotulo}
                              </span>
                            )
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Padrão da administração</span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-slate-600">
                      {adm.created ? new Date(adm.created).toLocaleDateString('pt-BR') : '—'}
                    </td>

                    <td className="py-4 px-5 text-slate-700">
                      {ehMarco ? (
                        <span className="font-bold text-[#D4AF37]">Fundador Vitalício</span>
                      ) : adm.criador_nome ? (
                        <div>
                          <span className="font-semibold text-slate-900">{adm.criador_nome}</span>
                          {adm.criador_email && (
                            <div className="text-[10px] text-slate-400">{adm.criador_email}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">Dr. Marco Chagas (Master)</span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-right">
                      {ehMarco ? (
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                          Protegido Vitalício
                        </span>
                      ) : isMaster ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => abrirEdicaoPermissoesAdmin(adm)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#07132B] hover:bg-[#D4AF37] hover:text-[#07132B] text-white text-xs font-bold transition-all"
                            title="Editar funções e permissões"
                          >
                            Editar Permissões
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminParaRebaixar(adm)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-200 transition-colors"
                            title="Rebaixar para analista"
                          >
                            Rebaixar para Analista
                          </button>
                          <button
                            type="button"
                            onClick={() => setUsuarioParaExcluir(adm)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors"
                            title="Excluir administrador"
                          >
                            Excluir
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Apenas Master gerencia
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2) QUADRO: ANALISTAS & PARCEIROS (100+ ANALISTAS, BUSCA, PAGINAÇÃO, COMERCIAL) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Topo do Quadro 2 */}
        <div className="p-5 bg-[#07132B] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#D4AF37]/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37] bg-white/10 px-2 py-0.5 rounded">
                Quadro 2 • Rede de Parceiros
              </span>
              <span className="text-xs text-slate-300">
                {analistas.length} Analista(s) cadastrado(s)
              </span>
            </div>
            <h3 className="text-xl font-heading font-extrabold text-white mt-1">
              Analistas & Parceiros Contábeis
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Escalável para 100+ analistas. Gestão de métricas de carteira, mensalidade negociada
              (base R$ 347) e autorização operacional.
            </p>
          </div>

          {/* DUAS FORMAS DE INCLUSÃO PARA ANALISTA */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => abrirInclusao('analista')}
              className="px-3.5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#c29d2b] text-[#07132B] font-bold text-xs shadow-sm transition-all"
            >
              Incluir Manualmente
            </button>
            <button
              type="button"
              onClick={() => abrirConvite('analista')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all"
            >
              Enviar Convite por E-mail
            </button>
          </div>
        </div>

        {/* Barra de Filtros e Busca de Analistas */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou quem cadastrou..."
              value={buscaAnalista}
              onChange={(e) => {
                setBuscaAnalista(e.target.value)
                setPaginaAnalista(1)
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">Status Operação:</span>
              <select
                value={filtroStatusAnalista}
                onChange={(e) => {
                  setFiltroStatusAnalista(e.target.value)
                  setPaginaAnalista(1)
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800"
              >
                <option value="todos">Todos</option>
                <option value="autorizado">Autorizados</option>
                <option value="suspenso">Suspensos</option>
              </select>
            </div>

            <span className="text-xs text-slate-500">
              Total: <strong>{analistasFiltrados.length}</strong>
            </span>
          </div>
        </div>

        {/* Tabela de Analistas */}
        <div className="overflow-x-auto">
          {analistasFiltrados.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhum analista encontrado com os filtros selecionados.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#07132B]/5 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-5">Analista</th>
                  <th className="py-3 px-5 text-center">Clientes</th>
                  <th className="py-3 px-5 text-center">Diagnósticos</th>
                  <th className="py-3 px-5 text-center">Simulações</th>
                  <th className="py-3 px-5">Mensalidade</th>
                  <th className="py-3 px-5">Status Operação</th>
                  <th className="py-3 px-5 text-right">Ações Comerciais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analistasPaginados.map((a) => {
                  const suspenso = a.status_operacao === 'suspenso'
                  const valor =
                    typeof a.valor_mensal_personalizado === 'number'
                      ? a.valor_mensal_personalizado
                      : 347

                  return (
                    <tr
                      key={a.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        suspenso ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-sm text-[#07132B]">{a.name}</div>
                        <div className="text-slate-500 font-mono text-[11px]">{a.email}</div>
                        {a.criador_nome && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Cadastrado por: {a.criador_nome}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-900 border border-blue-200">
                          {a.total_clientes || 0}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
                          {a.total_diagnosticos || 0}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          {a.total_simulacoes || 0}
                        </span>
                      </td>

                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">
                          R$ {valor.toFixed(2).replace('.', ',')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {typeof a.valor_mensal_personalizado === 'number'
                            ? 'Negociado'
                            : 'Tabela Padrão'}
                        </div>
                      </td>

                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            suspenso
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {suspenso ? 'Suspenso' : 'Autorizado'}
                        </span>
                        {a.autorizado_por_nome && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Por: {a.autorizado_por_nome}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setAnalistaParaComercial(a)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#07132B] hover:bg-[#D4AF37] hover:text-[#07132B] text-white text-xs font-bold transition-all"
                            title="Ajustar mensalidade e autorizar/suspender"
                          >
                            Autorizar / Mensalidade
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirModalExclusaoAnalista(a)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors"
                            title="Excluir com transferência da carteira"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginação do Quadro 2 */}
        {totalPaginasAnalista > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Página <strong>{paginaAnalista}</strong> de <strong>{totalPaginasAnalista}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={paginaAnalista === 1}
                onClick={() => setPaginaAnalista((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={paginaAnalista === totalPaginasAnalista}
                onClick={() => setPaginaAnalista((p) => Math.min(totalPaginasAnalista, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3) QUADRO: EMPRESÁRIOS / CLIENTES */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Topo do Quadro 3 */}
        <div className="p-5 bg-gradient-to-r from-[#07132B] to-[#162a52] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#D4AF37]/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37] bg-white/10 px-2 py-0.5 rounded">
                Quadro 3 • Tomadores de Decisão
              </span>
              <span className="text-xs text-slate-300">
                {empresarios.length} Empresário(s) cadastrado(s)
              </span>
            </div>
            <h3 className="text-xl font-heading font-extrabold text-white mt-1">
              Empresários / Clientes Finais
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Usuários cadastrados diretamente no portal ou convidados por analistas.
            </p>
          </div>

          {/* DUAS FORMAS DE INCLUSÃO PARA EMPRESÁRIO */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => abrirInclusao('empresario')}
              className="px-3.5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#c29d2b] text-[#07132B] font-bold text-xs shadow-sm transition-all"
            >
              Incluir Manualmente
            </button>
            <button
              type="button"
              onClick={() => abrirConvite('empresario')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all"
            >
              Enviar Convite por E-mail
            </button>
          </div>
        </div>

        {/* Busca do Quadro 3 */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <input
              type="text"
              placeholder="Buscar por empresário, e-mail ou analista que convidou..."
              value={buscaEmpresario}
              onChange={(e) => {
                setBuscaEmpresario(e.target.value)
                setPaginaEmpresario(1)
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
            />
          </div>

          <span className="text-xs text-slate-500">
            Total: <strong>{empresariosFiltrados.length}</strong>
          </span>
        </div>

        {/* Tabela de Empresários */}
        <div className="overflow-x-auto">
          {empresariosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhum empresário encontrado.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#07132B]/5 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-5">Empresário</th>
                  <th className="py-3 px-5">Origem (Analista / Cadastro)</th>
                  <th className="py-3 px-5">Data de Cadastro</th>
                  <th className="py-3 px-5">Status do Plano</th>
                  <th className="py-3 px-5">Acesso</th>
                  <th className="py-3 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {empresariosPaginados.map((emp) => {
                  const suspenso = emp.status_operacao === 'suspenso'
                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        suspenso ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-sm text-[#07132B]">{emp.name}</div>
                        <div className="text-slate-500 font-mono text-[11px]">{emp.email}</div>
                      </td>

                      <td className="py-3.5 px-5 text-slate-700">
                        {emp.criador_nome ? (
                          <div>
                            <span className="font-semibold text-slate-900">{emp.criador_nome}</span>
                            <div className="text-[10px] text-slate-400">Analista Responsável</div>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-medium">
                            Cadastro Direto no Site
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-slate-600">
                        {emp.created ? new Date(emp.created).toLocaleDateString('pt-BR') : '—'}
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/40">
                          Plano Empresário (Modo Teste Grátis)
                        </span>
                      </td>

                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            suspenso
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {suspenso ? 'Suspenso' : 'Ativo'}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => abrirEdicaoEmpresario(emp)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                            title="Editar dados cadastrais"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => alternarSuspensaoEmpresario(emp)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                              suspenso
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                            }`}
                            title={suspenso ? 'Reativar acesso' : 'Suspender acesso'}
                          >
                            {suspenso ? 'Reativar' : 'Suspender'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEmpresarioParaExcluir(emp)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors"
                            title="Excluir conta com dados vinculados"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginação do Quadro 3 */}
        {totalPaginasEmpresario > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Página <strong>{paginaEmpresario}</strong> de{' '}
              <strong>{totalPaginasEmpresario}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={paginaEmpresario === 1}
                onClick={() => setPaginaEmpresario((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={paginaEmpresario === totalPaginasEmpresario}
                onClick={() => setPaginaEmpresario((p) => Math.min(totalPaginasEmpresario, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAIS COMPONENTIZADOS */}
      {/* ========================================================================= */}

      {/* 1. Modal Incluir Manualmente */}
      <ModalIncluirUsuarioManual
        open={modalInclusaoAberto}
        onOpenChange={setModalInclusaoAberto}
        nivelFixo={nivelInclusaoFixo}
        isMaster={isMaster}
        onSucesso={(msg) => {
          emitirFeedback('sucesso', msg)
          onAtualizar()
        }}
        onErro={(msg) => emitirFeedback('erro', msg)}
      />

      {/* 2. Modal Enviar Convite por E-mail */}
      <ModalEnviarConviteNivel
        open={modalConviteAberto}
        onOpenChange={setModalConviteAberto}
        nivelFixo={nivelConviteFixo}
        isMaster={isMaster}
        onSucesso={(msg) => {
          emitirFeedback('sucesso', msg)
          onAtualizar()
        }}
        onErro={(msg) => emitirFeedback('erro', msg)}
      />

      {/* 3. Modal Controle Comercial do Analista */}
      <ModalControleComercialAnalista
        open={!!analistaParaComercial}
        onOpenChange={(open) => !open && setAnalistaParaComercial(null)}
        analista={analistaParaComercial}
        usuarioLogadoId={usuarioLogadoId}
        onSucesso={(msg) => {
          emitirFeedback('sucesso', msg)
          onAtualizar()
        }}
        onErro={(msg) => emitirFeedback('erro', msg)}
      />

      {/* 4. Modal Excluir Analista com Transferência de Carteira */}
      <ModalExcluirAnalista
        open={!!analistaParaExcluir}
        onOpenChange={(open) => !open && setAnalistaParaExcluir(null)}
        analista={analistaParaExcluir}
        todosAnalistas={todosAnalistasMetricas}
        masterId={masterId || usuarioLogadoId}
        masterNome="Dr. Marco Chagas (Master)"
        onSucesso={(msg) => {
          emitirFeedback('sucesso', msg)
          onAtualizar()
        }}
        onErro={(msg) => emitirFeedback('erro', msg)}
      />

      {/* 5. Modal Excluir Empresário com Limpeza de Dados Vinculados */}
      <ModalExcluirEmpresario
        open={!!empresarioParaExcluir}
        onOpenChange={(open) => !open && setEmpresarioParaExcluir(null)}
        usuario={empresarioParaExcluir}
        executorNivel={nivelLogado}
        executorEmail={usuarioLogadoEmail}
        masterId={masterId || usuarioLogadoId}
        onSucesso={(msg) => {
          emitirFeedback('sucesso', msg)
          onAtualizar()
        }}
        onErro={(msg) => emitirFeedback('erro', msg)}
      />

      {/* 6. Modal Excluir Administrador (Controle Master) */}
      <ModalExcluirUsuario
        open={!!usuarioParaExcluir}
        onOpenChange={(open) => !open && setUsuarioParaExcluir(null)}
        usuario={usuarioParaExcluir}
        executorNivel={nivelLogado}
        executorEmail={usuarioLogadoEmail}
        masterId={masterId || usuarioLogadoId}
        onSucesso={(msg) => {
          setUsuarioParaExcluir(null)
          emitirFeedback('sucesso', msg)
          onAtualizar()
        }}
        onErro={(msg) => emitirFeedback('erro', msg)}
      />

      {/* 7. Modal Editar Permissões do Admin (Exclusivo Master) */}
      {adminParaEditarPermissoes && (
        <Dialog
          open={!!adminParaEditarPermissoes}
          onOpenChange={(open) => !open && setAdminParaEditarPermissoes(null)}
        >
          <DialogContent className="sm:max-w-lg bg-white border border-slate-200 shadow-2xl p-6 rounded-2xl">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-heading font-bold text-[#07132B]">
                Permissões do Administrador
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Designação granular de funções para {adminParaEditarPermissoes.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-3 text-xs">
              {TODAS_PERMISSOES.map((p) => {
                const check = permissoesEditadas.includes(p.id)
                return (
                  <label
                    key={p.id}
                    className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={check}
                      onChange={() => alternarPermissaoAdmin(p.id)}
                      className="mt-0.5 rounded text-[#07132B] focus:ring-[#D4AF37]"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">{p.rotulo}</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">
                        {p.descricao}
                      </span>
                    </div>
                  </label>
                )
              })}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdminParaEditarPermissoes(null)}
                disabled={salvandoPermissoes}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={salvarPermissoesAdmin}
                disabled={salvandoPermissoes}
                className="text-xs font-bold bg-[#07132B] text-[#D4AF37] hover:bg-[#07132B]/90"
              >
                {salvandoPermissoes ? 'Salvando...' : 'Gravar Permissões'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 8. Modal Rebaixar Admin para Analista (Exclusivo Master) */}
      {adminParaRebaixar && (
        <Dialog
          open={!!adminParaRebaixar}
          onOpenChange={(open) => !open && setAdminParaRebaixar(null)}
        >
          <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl p-6 rounded-2xl">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-heading font-bold text-[#07132B]">
                Rebaixar Administrador para Analista
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                A autoridade administrativa será revogada e o usuário passará a operar com perfil de
                Analista comum.
              </DialogDescription>
            </DialogHeader>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1.5 my-2">
              <span className="font-bold block">Confirmação de Rebaixamento</span>
              <p className="leading-relaxed">
                Tem certeza que deseja rebaixar <strong>{adminParaRebaixar.name}</strong> (
                {adminParaRebaixar.email})? Ele perderá acesso ao painel de governança /admin e suas
                permissões administrativas serão resetadas.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdminParaRebaixar(null)}
                disabled={rebaixando}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={confirmarRebaixarAdmin}
                disabled={rebaixando}
                className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
              >
                {rebaixando ? 'Rebaixando...' : 'Confirmar Rebaixamento'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 9. Modal Edição Básica de Empresário */}
      {empresarioParaEditar && (
        <Dialog
          open={!!empresarioParaEditar}
          onOpenChange={(open) => !open && setEmpresarioParaEditar(null)}
        >
          <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl p-6 rounded-2xl">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-heading font-bold text-[#07132B]">
                Editar Nome do Empresário
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Altere o nome cadastral exibido no sistema.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 my-2 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={nomeEditandoEmpresario}
                  onChange={(e) => setNomeEditandoEmpresario(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                />
              </div>
              <div className="text-[11px] text-slate-500">
                E-mail: <strong>{empresarioParaEditar.email}</strong> (imutável)
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEmpresarioParaEditar(null)}
                disabled={salvandoEdicaoEmpresario}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={salvarEdicaoEmpresario}
                disabled={salvandoEdicaoEmpresario}
                className="text-xs font-bold bg-[#07132B] hover:bg-[#07132B]/90 text-white"
              >
                {salvandoEdicaoEmpresario ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
