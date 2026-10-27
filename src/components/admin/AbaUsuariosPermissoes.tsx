import React, { useState } from 'react'
import type { UsuarioSistema, NivelAcesso, PermissaoMaster } from '@/types/master'
import { TODAS_PERMISSOES } from '@/types/master'
import { atualizarNivelEPermissoesUsuario } from '@/services/master'
import { ModalExcluirUsuario } from '@/components/admin/ModalExcluirUsuario'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

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
  const [busca, setBusca] = useState('')
  const [filtroNivel, setFiltroNivel] = useState<string>('todos')

  // Estado do Modal de Edição de Nível e Permissões
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<UsuarioSistema | null>(null)
  const [nivelEscolhido, setNivelEscolhido] = useState<NivelAcesso>('analista')
  const [permissoesEscolhidas, setPermissoesEscolhidas] = useState<PermissaoMaster[]>([])
  const [isSalvando, setIsSalvando] = useState(false)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)
  const [mensagemErro, setMensagemErro] = useState<string | null>(null)

  // Estado do Modal de Exclusão de Usuário
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<UsuarioSistema | null>(null)

  const usuariosFiltrados = usuarios.filter((u) => {
    const termo = busca.toLowerCase().trim()
    const matchBusca =
      !termo ||
      u.name?.toLowerCase().includes(termo) ||
      u.email?.toLowerCase().includes(termo) ||
      u.criador_nome?.toLowerCase().includes(termo)

    const matchNivel = filtroNivel === 'todos' || u.nivel_acesso === filtroNivel
    return matchBusca && matchNivel
  })

  const abrirModalEdicao = (u: UsuarioSistema) => {
    setUsuarioEmEdicao(u)
    setNivelEscolhido(u.nivel_acesso)
    setPermissoesEscolhidas([...u.permissoes_json])
    setMensagemSucesso(null)
    setMensagemErro(null)
  }

  const alternarPermissao = (perm: PermissaoMaster) => {
    if (permissoesEscolhidas.includes(perm)) {
      setPermissoesEscolhidas(permissoesEscolhidas.filter((p) => p !== perm))
    } else {
      setPermissoesEscolhidas([...permissoesEscolhidas, perm])
    }
  }

  const handleSalvar = async () => {
    if (!usuarioEmEdicao) return
    setIsSalvando(true)
    setMensagemErro(null)
    try {
      await atualizarNivelEPermissoesUsuario({
        usuarioId: usuarioEmEdicao.id,
        nivel_acesso: nivelEscolhido,
        permissoes_json: permissoesEscolhidas,
        masterUsuarioId: usuarioLogadoId,
      })

      setMensagemSucesso(
        `Funções e permissões de "${usuarioEmEdicao.name}" atualizadas com sucesso.`,
      )
      onAtualizar()
      setTimeout(() => {
        setUsuarioEmEdicao(null)
        setMensagemSucesso(null)
      }, 1500)
    } catch (err: any) {
      console.error('Erro ao atualizar permissões do usuário:', err)
      setMensagemErro(
        err?.message || 'Falha ao salvar permissões. Verifique as credenciais de Master.',
      )
    } finally {
      setIsSalvando(false)
    }
  }

  // Contadores de perfis
  const countMaster = usuarios.filter((u) => u.nivel_acesso === 'master').length
  const countAdmin = usuarios.filter((u) => u.nivel_acesso === 'admin').length
  const countAnalista = usuarios.filter((u) => u.nivel_acesso === 'analista').length
  const countEmpresario = usuarios.filter((u) => u.nivel_acesso === 'empresario').length

  return (
    <div className="space-y-6">
      {/* KPI CARDS - DISTRIBUIÇÃO DE ACESSOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#07132B] text-white p-5 rounded-2xl border border-[#D4AF37]/30 shadow-md">
          <span className="text-[11px] uppercase tracking-wider text-[#D4AF37] font-semibold block">
            Administrador Master
          </span>
          <p className="font-heading font-extrabold text-3xl text-white mt-1">{countMaster}</p>
          <span className="text-[11px] text-slate-300 mt-1 block">Dr. Marco Chagas</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
            Administradores Eleitos
          </span>
          <p className="font-heading font-extrabold text-3xl text-slate-900 mt-1">{countAdmin}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Gestores com delegação</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
            Analistas Cadastrados
          </span>
          <p className="font-heading font-extrabold text-3xl text-[#07132B] mt-1">
            {countAnalista}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Com acesso à Carteira</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
            Empresários / Clientes
          </span>
          <p className="font-heading font-extrabold text-3xl text-slate-900 mt-1">
            {countEmpresario}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Contas diretas no portal</span>
        </div>
      </div>

      {/* AVISO DE SEGURANÇA SOBRE CONTROLE MASTER */}
      <div className="p-4 rounded-2xl bg-[#07132B] text-white border border-[#D4AF37]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37] block">
            Governança & Controle Rigoroso
          </span>
          <p className="text-xs text-slate-200 mt-0.5">
            {isMaster
              ? 'Você está autenticado como Master (Dr. Marco Chagas). Você tem autoridade exclusiva para eleger administradores, rebaixá-los e definir funções operacionais granulares.'
              : 'Visualização administrativa restrita. Somente o Administrador Master pode eleger ou rebaixar outros administradores.'}
          </p>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-96">
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou quem elegeu..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Nível:</span>
            <select
              value={filtroNivel}
              onChange={(e) => setFiltroNivel(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white"
            >
              <option value="todos">Todos os Níveis</option>
              <option value="master">Master</option>
              <option value="admin">Administrador</option>
              <option value="analista">Analista</option>
              <option value="empresario">Empresário</option>
            </select>
          </div>

          <button
            type="button"
            onClick={onAtualizar}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            Atualizar
          </button>
        </div>
      </div>

      {/* TABELA DE USUÁRIOS & PERMISSÕES */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Carregando usuários e permissões do sistema...
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="font-semibold text-slate-700 text-base">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#07132B] text-white font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Usuário</th>
                  <th className="py-3.5 px-5">Nível de Acesso</th>
                  <th className="py-3.5 px-5">Permissões Específicas</th>
                  <th className="py-3.5 px-5">Elegível / Eleito Por</th>
                  <th className="py-3.5 px-5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuariosFiltrados.map((u) => {
                  const ehMarco = u.email?.toLowerCase() === 'marcoschagasdiamond@icloud.com'
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            u.nivel_acesso === 'master'
                              ? 'bg-[#D4AF37] text-[#07132B]'
                              : u.nivel_acesso === 'admin'
                                ? 'bg-[#07132B] text-white'
                                : u.nivel_acesso === 'analista'
                                  ? 'bg-blue-100 text-blue-900'
                                  : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {u.nivel_acesso}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        {u.nivel_acesso === 'master' ? (
                          <span className="text-xs font-bold text-[#D4AF37] bg-[#07132B] px-2.5 py-1 rounded-lg">
                            Acesso Pleno & Irrestrito (Master)
                          </span>
                        ) : u.permissoes_json && u.permissoes_json.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {u.permissoes_json.map((p) => {
                              const permDef = TODAS_PERMISSOES.find((d) => d.id === p)
                              return (
                                <span
                                  key={p}
                                  className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                                >
                                  {permDef?.rotulo || p}
                                </span>
                              )
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Padrão do nível ({u.nivel_acesso})
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-xs text-slate-600">
                        {ehMarco ? (
                          <span className="font-semibold text-[#D4AF37]">Fundador / Master</span>
                        ) : u.criador_nome ? (
                          <div>
                            <span className="font-semibold text-slate-800">{u.criador_nome}</span>
                            {u.criador_email && (
                              <div className="text-[11px] text-slate-400">{u.criador_email}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Cadastro do Portal</span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isMaster && !ehMarco ? (
                            <button
                              type="button"
                              onClick={() => abrirModalEdicao(u)}
                              className="px-3 py-1.5 rounded-lg bg-[#07132B] hover:bg-[#D4AF37] hover:text-[#07132B] text-white text-xs font-bold transition-all"
                            >
                              Editar Funções
                            </button>
                          ) : null}

                          {/* Botão Excluir Usuário: Marco Chagas não pode ser excluído; Apenas Master exclui Admin */}
                          {!ehMarco && (isMaster || u.nivel_acesso !== 'admin') ? (
                            <button
                              type="button"
                              onClick={() => setUsuarioParaExcluir(u)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors"
                              title="Excluir usuário do sistema"
                            >
                              Excluir Usuário
                            </button>
                          ) : ehMarco ? (
                            <span className="text-xs text-slate-400 font-medium px-2">
                              Titular Master
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic px-2">
                              Apenas Master
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DIALOG DE DESIGNAR FUNÇÕES / ELEGER ADMINS (EXCLUSIVO MASTER) */}
      <Dialog
        open={!!usuarioEmEdicao}
        onOpenChange={(open) => {
          if (!open && !isSalvando) setUsuarioEmEdicao(null)
        }}
      >
        <DialogContent className="sm:max-w-xl bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-xl text-[#07132B]">
              Designar Funções & Permissões
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 mt-1">
              Controle Master exclusivo de Dr. Marco Chagas. Altere o nível de acesso e marque as
              funções autorizadas para o usuário.
            </DialogDescription>
          </DialogHeader>

          {usuarioEmEdicao && (
            <div className="space-y-5 my-3">
              {/* DADOS DO USUÁRIO */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                  Usuário Selecionado
                </span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{usuarioEmEdicao.name}</p>
                <p className="text-xs text-slate-600">{usuarioEmEdicao.email}</p>
              </div>

              {/* SELEÇÃO DE NÍVEL DE ACESSO */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                  Nível de Acesso
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNivelEscolhido('admin')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      nivelEscolhido === 'admin'
                        ? 'border-[#07132B] bg-[#07132B] text-white shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-800 bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs">Administrador</div>
                    <div
                      className={`text-[11px] mt-1 ${nivelEscolhido === 'admin' ? 'text-slate-200' : 'text-slate-500'}`}
                    >
                      Acesso aos relatórios e ferramentas de gestão
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNivelEscolhido('analista')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      nivelEscolhido === 'analista'
                        ? 'border-[#07132B] bg-[#07132B] text-white shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-800 bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs">Analista</div>
                    <div
                      className={`text-[11px] mt-1 ${nivelEscolhido === 'analista' ? 'text-slate-200' : 'text-slate-500'}`}
                    >
                      Gestão da própria carteira de clientes
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNivelEscolhido('empresario')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      nivelEscolhido === 'empresario'
                        ? 'border-[#07132B] bg-[#07132B] text-white shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-800 bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs">Empresário</div>
                    <div
                      className={`text-[11px] mt-1 ${nivelEscolhido === 'empresario' ? 'text-slate-200' : 'text-slate-500'}`}
                    >
                      Cliente final (acesso individual à sua empresa)
                    </div>
                  </button>
                </div>
              </div>

              {/* LISTA DE PERMISSÕES GRANULARES */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                  Funções & Permissões Específicas
                </label>
                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-white">
                  {TODAS_PERMISSOES.map((item) => {
                    const isChecked = permissoesEscolhidas.includes(item.id)
                    // gerenciar_admins só pode ser dado se for admin eleito e master desejar
                    return (
                      <label
                        key={item.id}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => alternarPermissao(item.id)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-[#07132B] focus:ring-[#D4AF37]"
                        />
                        <div className="flex-1">
                          <span className="font-bold text-xs text-slate-900 block">
                            {item.rotulo}
                          </span>
                          <span className="text-[11px] text-slate-500 block leading-tight">
                            {item.descricao}
                          </span>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {mensagemSucesso && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                  {mensagemSucesso}
                </div>
              )}

              {mensagemErro && (
                <div className="p-3 rounded-xl bg-red-50 text-red-800 text-xs font-semibold border border-red-200">
                  {mensagemErro}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={isSalvando}
              onClick={() => setUsuarioEmEdicao(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSalvando}
              onClick={handleSalvar}
              className="px-5 py-2 rounded-xl bg-[#07132B] hover:bg-[#07132B]/90 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              {isSalvando ? 'Salvando...' : 'Salvar Funções'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE EXCLUSÃO DE USUÁRIO */}
      <ModalExcluirUsuario
        open={!!usuarioParaExcluir}
        onOpenChange={(open) => {
          if (!open) setUsuarioParaExcluir(null)
        }}
        usuario={usuarioParaExcluir}
        executorNivel={nivelLogado}
        executorEmail={usuarioLogadoEmail}
        masterId={masterId || usuarioLogadoId}
        onSucesso={(msg) => {
          setUsuarioParaExcluir(null)
          onAtualizar()
          if (onFeedback) {
            onFeedback({ tipo: 'sucesso', mensagem: msg })
          }
        }}
        onErro={(msg) => {
          if (onFeedback) {
            onFeedback({ tipo: 'erro', mensagem: msg })
          }
        }}
      />
    </div>
  )
}
