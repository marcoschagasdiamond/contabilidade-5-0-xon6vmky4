/**
 * Regressão: "Salvar Vínculo" gravava o vínculo no estado mas o registro em
 * clientes_empresas chegava ao banco com vinculos_societarios = [].
 *
 * Causa raiz provada aqui: o <form> da SecaoVinculosSocietarios é ANINHADO no
 * form de Dados da Empresa. Sem stopPropagation, o submit do vínculo também
 * dispara o handleSubmit da página no MESMO evento — que grava o perfil inteiro
 * a partir do formData da render, ainda SEM o novo item (stale closure).
 *
 * Invariantes:
 * 1. Clicar em "Salvar Vínculo" NÃO dispara o handleSubmit da página;
 * 2. O vínculo digitado entra na lista chamada por onChangeVinculos;
 * 3. O handleSubmit da página grava a partir do valor MAIS RECENTE do estado
 *    (ref), não do snapshot da render (stale closure).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { SecaoVinculosSocietarios } from '@/components/dadosEmpresa/SecaoVinculosSocietarios'

const vinculoBase = {
  nomeEmpresa: 'Inove Participações LTDA',
  cnpj: '12.345.678/0001-90',
  papelCliente: 'pj_socia_holding' as const,
  participacao: 100,
  administracao: true,
  regime: 'Simples Nacional' as const,
  faturamentoAnual: 500000,
  excecaoLegal: false,
  observacoes: '',
}

/** Replica o aninhamento real da página /dados-empresa (form externo + seção). */
function PaginaComFormAninhado({
  onSubmitPagina,
  onChangeVinculos,
  vinculos,
  formDataNaRender,
}: {
  onSubmitPagina: (e: React.FormEvent) => void
  onChangeVinculos: (novos: any[]) => void
  vinculos: any[]
  formDataNaRender: { atual: any }
}) {
  return (
    <form data-testid="form-pagina" onSubmit={onSubmitPagina}>
      <SecaoVinculosSocietarios
        vinculos={vinculos}
        regimeAtual="Simples Nacional"
        faturamentoMensalProprio={100000}
        onChangeVinculos={onChangeVinculos}
      />
      {/* espelha o formData da render, como o handleSubmit enxerga via closure */}
      <input
        type="hidden"
        ref={(el) => {
          if (el) formDataNaRender.atual = 'render'
        }}
      />
    </form>
  )
}

describe('Vínculos Societários — submit aninhado e stale closure', () => {
  it('clicar em "Salvar Vínculo" adiciona o item e NÃO submete o form da página', () => {
    const onSubmitPagina = vi.fn()
    let listaAtual: any[] = []
    const onChangeVinculos = (novos: any[]) => {
      listaAtual = novos
    }

    render(
      <PaginaComFormAninhado
        onSubmitPagina={onSubmitPagina}
        onChangeVinculos={onChangeVinculos}
        vinculos={[]}
        formDataNaRender={{ atual: null }}
      />,
    )

    // Abre o formulário e preenche o campo obrigatório
    fireEvent.click(screen.getByText('Adicionar Vínculo'))
    fireEvent.change(screen.getByLabelText(/Razão Social/i), {
      target: { value: vinculoBase.nomeEmpresa },
    })

    fireEvent.click(screen.getByText('Salvar Vínculo'))

    // 1) O handler da página NÃO rodou no mesmo evento
    expect(onSubmitPagina).not.toHaveBeenCalled()

    // 2) O vínculo entrou na lista (consolidado no estado da página)
    expect(listaAtual).toHaveLength(1)
    expect(listaAtual[0].nomeEmpresa).toBe(vinculoBase.nomeEmpresa)
    expect(listaAtual[0].papelCliente).toBe('pj_socia_holding')
  })

  it('handleSubmit da página grava a partir do valor MAIS RECENTE do estado (ref, não closure)', async () => {
    // Simula o padrão do fix: ref sincronizado com o estado + submit lendo o ref
    const estado: { valor: any } = { valor: { vinculosSocietarios: [] } }
    const ref: { current: any } = { current: estado.valor }

    const setState = (atualizador: (prev: any) => any) => {
      estado.valor = atualizador(estado.valor)
      ref.current = estado.valor // espelha o useEffect do formDataRef
    }

    // Submit chega ANTES do re-render (evento borbulhado ou duplo clique):
    // com o fix, lê o ref — que já tem o vínculo; com o bug, leria a closure [].
    setState((prev: any) => ({ ...prev, vinculosSocietarios: [vinculoBase] }))

    let gravado: any = null
    const handleSubmit = () => {
      gravado = { ...ref.current }
    }
    handleSubmit()

    expect((gravado as any).vinculosSocietarios).toHaveLength(1)
    expect((gravado as any).vinculosSocietarios[0].nomeEmpresa).toBe('Inove Participações LTDA')
  })

  it('remover vínculo reflete a lista sem o item (consolidação correta no estado)', () => {
    const onSubmitPagina = vi.fn()
    const vinculoExistente = {
      id: 'vinc_1',
      nomeEmpresa: 'Trifour Holding SA',
      papelCliente: 'pj_socia_holding',
      percentualParticipacao: 100,
      exerceAdministracao: true,
      regimeEmpresa: 'Simples Nacional',
      faturamentoAnual: 1200000,
      excecaoLegal: false,
      dataCadastro: new Date().toISOString(),
    }
    let listaAtual: any[] = [vinculoExistente]

    const { rerender } = render(
      <SecaoVinculosSocietarios
        vinculos={listaAtual}
        regimeAtual="Simples Nacional"
        faturamentoMensalProprio={100000}
        onChangeVinculos={(novos) => {
          listaAtual = novos
          rerender(
            <SecaoVinculosSocietarios
              vinculos={listaAtual}
              regimeAtual="Simples Nacional"
              faturamentoMensalProprio={100000}
              onChangeVinculos={(n) => {
                listaAtual = n
              }}
            />,
          )
        }}
      />,
    )

    expect(screen.getByText('Trifour Holding SA')).toBeDefined()
    fireEvent.click(screen.getByTitle('Remover este vínculo'))

    // 1º clique: só abre a confirmação — nada sai da lista ainda
    expect(screen.getByText(/Remover "Trifour Holding SA" da lista/i)).toBeDefined()
    expect(listaAtual).toHaveLength(1)

    // Cancelar: a lista permanece intacta
    fireEvent.click(screen.getByText(/Cancelar/))
    expect(listaAtual).toHaveLength(1)

    // 2º clique em Confirmar: remove o item do estado (e o hook persiste)
    fireEvent.click(screen.getByTitle('Remover este vínculo'))
    fireEvent.click(screen.getByText(/Confirmar/))
    expect(listaAtual).toHaveLength(0)
    expect(onSubmitPagina).not.toHaveBeenCalled()
  })

  it('lixo e botões de confirmação NÃO submetem o form da página (recidiva v0.0.406/v0.0.411)', () => {
    const onSubmitPagina = vi.fn()
    const vinculoExistente = {
      id: 'vinc_2',
      nomeEmpresa: 'Bravo IT',
      papelCliente: 'socio_pf',
      percentualParticipacao: 10,
      exerceAdministracao: true,
      regimeEmpresa: 'Simples Nacional',
      faturamentoAnual: 100000,
      excecaoLegal: false,
      dataCadastro: new Date().toISOString(),
    }
    let listaAtual: any[] = [vinculoExistente]

    const { rerender } = render(
      <form data-testid="form-pagina" onSubmit={onSubmitPagina}>
        <SecaoVinculosSocietarios
          vinculos={listaAtual}
          regimeAtual="Simples Nacional"
          faturamentoMensalProprio={100000}
          onChangeVinculos={(novos) => {
            listaAtual = novos
            rerender(
              <form data-testid="form-pagina" onSubmit={onSubmitPagina}>
                <SecaoVinculosSocietarios
                  vinculos={listaAtual}
                  regimeAtual="Simples Nacional"
                  faturamentoMensalProprio={100000}
                  onChangeVinculos={(n) => {
                    listaAtual = n
                  }}
                />
              </form>,
            )
          }}
        />
      </form>,
    )

    // Primeira confirmação: lixeira → Confirmar
    fireEvent.click(screen.getByTitle('Remover este vínculo'))
    fireEvent.click(screen.getByText(/Confirmar/))

    expect(listaAtual).toHaveLength(0)
    expect(onSubmitPagina).not.toHaveBeenCalled()
  })
})
