import { useState, useEffect } from 'react'
import {
  obterConfiguracaoDestinatariosRadar,
  salvarConfiguracaoDestinatariosRadar,
  dispararVarreduraRadar,
  type ConfiguracaoRadarDestinatarios,
} from '@/services/radarTributario'

interface AbaRadarTributarioAdminProps {
  onFeedback: (fb: { tipo: 'sucesso' | 'erro'; mensagem: string } | null) => void
}

export function AbaRadarTributarioAdmin({ onFeedback }: AbaRadarTributarioAdminProps) {
  const [config, setConfig] = useState<ConfiguracaoRadarDestinatarios | null>(null)
  const [destinatarios, setDestinatarios] = useState<string[]>([])
  const [novoEmail, setNovoEmail] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [observacoes, setObservacoes] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [ultimoResultadoSync, setUltimoResultadoSync] = useState<{
    novosEncontrados?: number
    emailsEnviados?: number
    mensagem?: string
    timestamp: string
  } | null>(null)

  const carregarConfiguracao = async () => {
    setIsLoading(true)
    try {
      const dados = await obterConfiguracaoDestinatariosRadar()
      setConfig(dados)
      setDestinatarios(dados.destinatarios || [])
      setAtivo(dados.ativo !== false)
      setObservacoes(dados.observacoes || '')
    } catch (err) {
      console.error('Erro ao carregar configuração de destinatários do Radar:', err)
      onFeedback({
        tipo: 'erro',
        mensagem: 'Não foi possível carregar a lista de destinatários do Radar.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    carregarConfiguracao()
  }, [])

  const handleAdicionarEmail = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const emailLimpo = novoEmail.trim().toLowerCase()

    if (!emailLimpo) return

    // Validação básica de formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailLimpo)) {
      onFeedback({
        tipo: 'erro',
        mensagem: 'Endereço de e-mail inválido. Verifique a digitação.',
      })
      return
    }

    if (destinatarios.includes(emailLimpo)) {
      onFeedback({
        tipo: 'erro',
        mensagem: 'Este e-mail já está presente na lista de destinatários.',
      })
      return
    }

    setDestinatarios((prev) => [...prev, emailLimpo])
    setNovoEmail('')
    onFeedback({
      tipo: 'sucesso',
      mensagem: `E-mail ${emailLimpo} adicionado à lista. Clique em "Salvar Alterações" para confirmar.`,
    })
  }

  const handleRemoverEmail = (emailParaRemover: string) => {
    setDestinatarios((prev) => prev.filter((em) => em !== emailParaRemover))
    onFeedback({
      tipo: 'sucesso',
      mensagem: `E-mail ${emailParaRemover} removido. Clique em "Salvar Alterações" para aplicar.`,
    })
  }

  const handleSalvarConfiguracao = async () => {
    setIsSaving(true)
    try {
      const atualizado = await salvarConfiguracaoDestinatariosRadar({
        destinatarios,
        ativo,
        observacoes,
      })
      setConfig(atualizado)
      setDestinatarios(atualizado.destinatarios)
      setAtivo(atualizado.ativo)
      onFeedback({
        tipo: 'sucesso',
        mensagem:
          'Configurações de destinatários do Radar Tributário salvas com sucesso no backend!',
      })
    } catch (err) {
      console.error('Erro ao salvar destinatários do Radar:', err)
      onFeedback({
        tipo: 'erro',
        mensagem: 'Falha ao salvar as configurações no servidor. Tente novamente.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDispararVarreduraManual = async () => {
    setIsSyncing(true)
    try {
      const res = await dispararVarreduraRadar()
      if (res.sucesso) {
        setUltimoResultadoSync({
          novosEncontrados: res.novosEncontrados ?? 0,
          emailsEnviados: res.emailsEnviados ?? 0,
          mensagem: res.mensagem || 'Varredura e disparo executados.',
          timestamp: new Date().toLocaleTimeString('pt-BR'),
        })
        onFeedback({
          tipo: 'sucesso',
          mensagem: `Varredura executada! ${res.novosEncontrados ?? 0} novos itens encontrados e ${res.emailsEnviados ?? 0} e-mails disparados aos destinatários.`,
        })
      } else {
        throw new Error('Falha retornada pelo backend.')
      }
    } catch (err) {
      console.error('Erro ao acionar sincronização manual:', err)
      onFeedback({
        tipo: 'erro',
        mensagem: 'Não foi possível executar a varredura manual do Radar.',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-sm">
        <div className="inline-block w-8 h-8 border-4 border-[#07132B] border-t-[#D4AF37] rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600">
          Carregando configurações do Radar Tributário...
        </p>
      </div>
    )
  }

  const isUsandoFallback = !config?.id

  return (
    <div className="space-y-6">
      {/* CABEÇALHO PADRÃO DIAMOND GROUP (SEM ÍCONES) */}
      <div className="bg-gradient-to-r from-[#07132B] to-[#0d2249] p-6 sm:p-8 rounded-2xl border-2 border-[#D4AF37]/40 shadow-sm text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-block bg-[#D4AF37] text-[#07132B] font-extrabold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              Gestão Corporativa Diamond Group
            </div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              Destinatários do Radar Tributário
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Configure os e-mails corporativos que recebem o resumo semanal autônomo com novidades
              de legislação, alíquotas oficiais da reforma tributária e teses vinculantes (STF/STJ).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDispararVarreduraManual}
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-white/20 transition-all disabled:opacity-50"
            >
              {isSyncing ? 'Sincronizando...' : 'Testar Varredura & Disparo'}
            </button>
            <button
              type="button"
              onClick={handleSalvarConfiguracao}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2f] text-[#07132B] text-xs sm:text-sm font-extrabold shadow-sm transition-all disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        {/* ÚLTIMO DISPARO INFORMATIVO */}
        {ultimoResultadoSync && (
          <div className="mt-4 pt-4 border-t border-white/10 text-xs text-slate-300 flex items-center gap-4 flex-wrap">
            <span>
              Última execução manual às <strong>{ultimoResultadoSync.timestamp}</strong>
            </span>
            <span className="text-[#D4AF37]">
              {ultimoResultadoSync.novosEncontrados} novo(s) parâmetro(s)
            </span>
            <span className="text-emerald-400">
              {ultimoResultadoSync.emailsEnviados} e-mail(s) enviado(s)
            </span>
          </div>
        )}
      </div>

      {/* AVISO DE ESTADO ATUAL / FALLBACK */}
      {isUsandoFallback ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs sm:text-sm text-amber-900 leading-relaxed">
          <p className="font-bold mb-1">
            Modo Fallback Ativo: Nenhuma lista configurada manualmente ainda.
          </p>
          <p>
            Enquanto nenhuma lista específica for salva, o job semanal envia o resumo para todos os
            Analistas, Administradores e Master cadastrados no portal Contabilidade 5.0. Adicione os
            e-mails desejados abaixo e salve para definir a lista exclusiva de envio.
          </p>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-bold text-slate-800">Lista personalizada configurada:</span> O job
            semanal envia <strong>apenas</strong> para os {destinatarios.length} endereço(s)
            definidos abaixo.
            {destinatarios.length === 0 && (
              <span className="text-rose-600 font-bold ml-1">
                (Lista vazia: o job roda normalmente e o envio fica suspenso sem erros).
              </span>
            )}
          </div>
          {config?.updated && (
            <span className="text-slate-400">
              Última atualização: {new Date(config.updated).toLocaleString('pt-BR')}
            </span>
          )}
        </div>
      )}

      {/* FORMULÁRIO PARA ADICIONAR E-MAIL */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="font-heading font-extrabold text-lg text-slate-900 mb-1">
          Adicionar Novo Destinatário
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Digite o endereço corporativo de e-mail que deve receber o resumo do Radar Tributário toda
          segunda-feira.
        </p>

        <form onSubmit={handleAdicionarEmail} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={novoEmail}
            onChange={(e) => setNovoEmail(e.target.value)}
            placeholder="exemplo: socio@diamondgroup.com.br"
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#07132B] focus:border-transparent"
          />
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#07132B] text-[#D4AF37] font-heading font-bold text-sm hover:bg-[#0d2249] transition-all"
          >
            Adicionar à Lista
          </button>
        </form>
      </div>

      {/* LISTAGEM DOS DESTINATÁRIOS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-heading font-extrabold text-lg text-slate-900">
              Destinatários Cadastrados ({destinatarios.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Endereços autorizados a receber as atualizações do Radar Tributário Diamond Group
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
                className="w-4 h-4 rounded text-[#07132B] focus:ring-[#D4AF37]"
              />
              <span>Disparos Semanais Ativos</span>
            </label>
          </div>
        </div>

        {destinatarios.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <p className="font-bold text-slate-700 mb-1">Nenhum destinatário na lista.</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Se você salvar esta lista vazia, o job semanal do Radar rodará sem enviar e-mails e
              sem apresentar erros. Caso queira voltar ao envio para todos os Analistas, apague a
              configuração ou adicione os e-mails individualmente acima.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {destinatarios.map((email, idx) => (
              <div
                key={email}
                className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#07132B] text-[#D4AF37] text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-sm text-slate-900">{email}</span>
                    <span className="ml-3 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Ativo
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoverEmail(email)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OBSERVAÇÕES E NOTAS INTERNAS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <label className="block font-heading font-extrabold text-sm text-slate-900 mb-1">
          Observações / Notas Internas de Governança
        </label>
        <p className="text-xs text-slate-500 mb-3">
          Registro interno para os administradores Diamond Group sobre a política de destinatários
          do Radar.
        </p>
        <textarea
          rows={3}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Ex: Lista restrita aos sócios e líderes da consultoria tributária Diamond Group..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#07132B] focus:border-transparent"
        />

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSalvarConfiguracao}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-[#07132B] hover:bg-[#0d2249] text-[#D4AF37] font-heading font-extrabold text-sm shadow-sm transition-all disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}
