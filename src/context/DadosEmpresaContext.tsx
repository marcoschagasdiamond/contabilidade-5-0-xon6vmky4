import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  DadosEmpresaPerfil,
  DADOS_EMPRESA_PADRAO,
  carregarDadosEmpresa,
  salvarDadosEmpresa as salvarNoStorage,
  limparDadosEmpresa as limparDoStorage,
  existeDadosEmpresaSalvos,
  STORAGE_EVENT,
} from '@/types/dadosEmpresa'
import { useAuth } from './AuthContext'
import {
  getClienteEmpresaPorUsuario,
  getClienteEmpresaPorId,
  getClienteEmpresaPorCnpj,
  salvarClienteEmpresaNoBanco,
  salvarClienteEmpresaPorId,
  recordToPerfil,
  ClienteEmpresaRecord,
} from '@/services/clientesEmpresas'
import { useClienteAtivo } from './ClienteAtivoContext'
import { notificarFonteMestraAtualizada } from '@/lib/fonteMestra'

interface DadosEmpresaContextType {
  dadosEmpresa: DadosEmpresaPerfil
  temDadosSalvos: boolean
  salvoNoBanco: boolean
  isSalvando: boolean
  empresaVinculadaId: string | null
  salvar: (novos: Partial<DadosEmpresaPerfil>) => Promise<DadosEmpresaPerfil>
  restaurarPadrao: () => void
  limpar: () => void
}

const DadosEmpresaContext = createContext<DadosEmpresaContextType | undefined>(undefined)

export function DadosEmpresaProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const { clienteAtivo, clienteAtivoId } = useClienteAtivo()

  const [dadosEmpresa, setDadosEmpresa] = useState<DadosEmpresaPerfil>(() =>
    isAuthenticated ? carregarDadosEmpresa() : DADOS_EMPRESA_PADRAO,
  )
  const [temDadosSalvos, setTemDadosSalvos] = useState<boolean>(() =>
    isAuthenticated ? existeDadosEmpresaSalvos() : false,
  )
  const [salvoNoBanco, setSalvoNoBanco] = useState(false)
  const [isSalvando, setIsSalvando] = useState(false)
  const [empresaVinculadaId, setEmpresaVinculadaId] = useState<string | null>(null)

  const sincronizar = useCallback(() => {
    if (!isAuthenticated) {
      setDadosEmpresa(DADOS_EMPRESA_PADRAO)
      setTemDadosSalvos(false)
      setSalvoNoBanco(false)
      return
    }
    setDadosEmpresa(carregarDadosEmpresa())
    setTemDadosSalvos(existeDadosEmpresaSalvos())
  }, [isAuthenticated])

  // SINCRONIZAÇÃO BASEADA NO CLIENTE ATIVO (BLOCO 1 REESTRUTURAÇÃO)
  // Ao selecionar um cliente no CRM:
  // 1. Busca os dados permanentes salvos na coleção clientes_empresas
  // 2. Carrega no contexto compartilhado sem apagar os dados do cliente anterior no banco
  // 3. Atualiza o cache do storage
  useEffect(() => {
    let cancelado = false

    async function carregarDadosDoClienteAtivo() {
      if (!clienteAtivoId || !clienteAtivo) {
        setEmpresaVinculadaId(null)
        // Sem cliente ativo selecionado: carrega o cadastro do usuário (ou storage avulso)
        if (isAuthenticated && user?.id) {
          try {
            const registroBanco = await getClienteEmpresaPorUsuario(user.id)
            if (cancelado) return
            if (registroBanco) {
              const perfil = recordToPerfil(registroBanco)
              salvarNoStorage(perfil)
              setDadosEmpresa(perfil)
              setTemDadosSalvos(true)
              setSalvoNoBanco(true)
              setEmpresaVinculadaId(registroBanco.id)
            } else {
              const local = carregarDadosEmpresa()
              setDadosEmpresa(local)
              setTemDadosSalvos(existeDadosEmpresaSalvos())
            }
          } catch (e) {
            console.warn('Erro ao carregar dados do usuário:', e)
          }
        }
        return
      }

      try {
        // Tenta achar o registro na coleção clientes_empresas:
        // Prioridade 1: se o cliente ativo já tem empresa_id
        // Prioridade 2: busca por ID se o cliente.id for de clientes_empresas
        // Prioridade 3: busca por CNPJ do cliente
        let registro: ClienteEmpresaRecord | null = null

        if (clienteAtivo.empresa_id) {
          registro = await getClienteEmpresaPorId(clienteAtivo.empresa_id)
        }

        if (!registro && clienteAtivo.id) {
          registro = await getClienteEmpresaPorId(clienteAtivo.id)
        }

        if (!registro && clienteAtivo.cnpj_cpf) {
          registro = await getClienteEmpresaPorCnpj(clienteAtivo.cnpj_cpf)
        }

        if (cancelado) return

        if (registro) {
          const perfil = recordToPerfil(registro)
          salvarNoStorage(perfil)
          setDadosEmpresa(perfil)
          setTemDadosSalvos(true)
          setSalvoNoBanco(true)
          setEmpresaVinculadaId(registro.id)
        } else {
          // Empresa ainda não tem registro específico em clientes_empresas,
          // cria ou carrega preenchido a partir dos dados do cliente da carteira
          const dadosBase: Partial<DadosEmpresaPerfil> = {
            nomeEmpresa: clienteAtivo.nome || '',
            nomeContato: clienteAtivo.nome || '',
            cnpj: clienteAtivo.cnpj_cpf || '',
            ufOrigem: clienteAtivo.uf || 'SP',
            segmento: (clienteAtivo.segmento as any) || 'Serviços',
            regimeAtual: clienteAtivo.regime_atual || 'Simples Nacional',
            email: clienteAtivo.email || '',
            telefone: clienteAtivo.telefone || '',
          }
          const novoPerfil: DadosEmpresaPerfil = {
            ...DADOS_EMPRESA_PADRAO,
            ...dadosBase,
          }
          salvarNoStorage(novoPerfil)
          setDadosEmpresa(novoPerfil)
          setTemDadosSalvos(true)
          setSalvoNoBanco(false)
          setEmpresaVinculadaId(null)
        }
      } catch (err) {
        console.warn('Erro ao sincronizar dados do cliente ativo com o banco:', err)
      }
    }

    carregarDadosDoClienteAtivo()

    return () => {
      cancelado = true
    }
  }, [clienteAtivoId, clienteAtivo, isAuthenticated, user?.id])

  useEffect(() => {
    sincronizar()
    const handleCustomEvent = () => sincronizar()
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'contabilidade5_dados_empresa') {
        sincronizar()
      }
    }

    window.addEventListener(STORAGE_EVENT, handleCustomEvent)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(STORAGE_EVENT, handleCustomEvent)
      window.removeEventListener('storage', handleStorage)
    }
  }, [sincronizar])

  const salvar = useCallback(
    async (novos: Partial<DadosEmpresaPerfil>): Promise<DadosEmpresaPerfil> => {
      setIsSalvando(true)
      // 1. Salva imediatamente no localStorage (cache/offline rápido)
      const atualizado = salvarNoStorage(novos)
      setDadosEmpresa(atualizado)
      setTemDadosSalvos(true)

      // 2. Se há cliente ativo ou empresa vinculada selecionada, persiste no registro daquela empresa
      const empIdParaSalvar =
        empresaVinculadaId ||
        clienteAtivo?.empresa_id ||
        (clienteAtivo?.origem_fonte === 'clientes_empresas' ? clienteAtivo.id : null)

      if (empIdParaSalvar) {
        try {
          const rec = await salvarClienteEmpresaPorId(empIdParaSalvar, atualizado)
          const perfilPersistido = recordToPerfil(rec)
          setDadosEmpresa(perfilPersistido)
          salvarNoStorage(perfilPersistido)
          setSalvoNoBanco(true)
          setEmpresaVinculadaId(rec.id)
          setIsSalvando(false)
          notificarFonteMestraAtualizada()
          return perfilPersistido
        } catch (err) {
          console.error('Erro ao salvar empresa vinculada por ID:', err)
        }
      }

      // 3. Caso não haja ID específico de empresa ainda, mas há cliente ativo, cria a empresa vinculada
      if (clienteAtivo && user?.id) {
        try {
          const payloadEmpresa = {
            ...atualizado,
            nomeEmpresa: atualizado.nomeEmpresa || clienteAtivo.nome,
            cnpj: atualizado.cnpj || clienteAtivo.cnpj_cpf,
            ufOrigem: atualizado.ufOrigem || clienteAtivo.uf,
            segmento: atualizado.segmento || (clienteAtivo.segmento as any),
            regimeAtual: atualizado.regimeAtual || clienteAtivo.regime_atual,
          }
          const rec = await salvarClienteEmpresaNoBanco(payloadEmpresa, user.id)
          const perfilPersistido = recordToPerfil(rec)
          setDadosEmpresa(perfilPersistido)
          salvarNoStorage(perfilPersistido)
          setSalvoNoBanco(true)
          setEmpresaVinculadaId(rec.id)
          setIsSalvando(false)
          notificarFonteMestraAtualizada()
          return perfilPersistido
        } catch (err) {
          console.error('Erro ao criar/atualizar empresa para o cliente ativo:', err)
        }
      }

      // 4. Se não há cliente ativo e o usuário está autenticado, salva no registro do usuário (análise da sua própria empresa)
      if (user?.id) {
        try {
          const rec = await salvarClienteEmpresaNoBanco(atualizado, user.id)
          const perfilPersistido = recordToPerfil(rec)
          setDadosEmpresa(perfilPersistido)
          salvarNoStorage(perfilPersistido)
          setSalvoNoBanco(true)
          setEmpresaVinculadaId(rec.id)
          setIsSalvando(false)
          notificarFonteMestraAtualizada()
          return perfilPersistido
        } catch (err) {
          console.error('Erro ao salvar no banco:', err)
          setIsSalvando(false)
          notificarFonteMestraAtualizada()
          return atualizado
        }
      }

      setIsSalvando(false)
      notificarFonteMestraAtualizada()
      return atualizado
    },
    [user?.id, clienteAtivo, empresaVinculadaId],
  )

  const restaurarPadrao = useCallback(() => {
    const padrao = salvarNoStorage(DADOS_EMPRESA_PADRAO)
    setDadosEmpresa(padrao)
    setTemDadosSalvos(true)
    if (empresaVinculadaId) {
      salvarClienteEmpresaPorId(empresaVinculadaId, padrao).catch((err) =>
        console.warn('Falha ao restaurar padrão no banco para empresa vinculada:', err),
      )
    } else if (user?.id) {
      salvarClienteEmpresaNoBanco(padrao, user.id).catch((err) =>
        console.warn('Falha ao restaurar padrão no banco:', err),
      )
    }
    notificarFonteMestraAtualizada()
  }, [user?.id, empresaVinculadaId])

  const limpar = useCallback(() => {
    limparDoStorage()
    setDadosEmpresa(DADOS_EMPRESA_PADRAO)
    setTemDadosSalvos(false)
    setEmpresaVinculadaId(null)
    notificarFonteMestraAtualizada()
  }, [])

  return (
    <DadosEmpresaContext.Provider
      value={{
        dadosEmpresa,
        temDadosSalvos,
        salvoNoBanco,
        isSalvando,
        empresaVinculadaId,
        salvar,
        restaurarPadrao,
        limpar,
      }}
    >
      {children}
    </DadosEmpresaContext.Provider>
  )
}

export function useDadosEmpresa() {
  const context = useContext(DadosEmpresaContext)
  if (!context) {
    const dados = carregarDadosEmpresa()
    return {
      dadosEmpresa: dados,
      temDadosSalvos: existeDadosEmpresaSalvos(),
      salvoNoBanco: false,
      isSalvando: false,
      empresaVinculadaId: null,
      salvar: async (novos: Partial<DadosEmpresaPerfil>) => salvarNoStorage(novos),
      restaurarPadrao: () => salvarNoStorage(DADOS_EMPRESA_PADRAO),
      limpar: limparDoStorage,
    }
  }
  return context
}
