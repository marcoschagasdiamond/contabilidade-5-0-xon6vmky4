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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export interface ResponsavelTecnicoDados {
  nome: string
  crc: string
  email: string
  telefone: string
  observacoes?: string
}

export const STORAGE_RESPONSAVEL_TECNICO_KEY = 'contabilidade50_responsavel_tecnico'

export function carregarResponsavelTecnicoSalvo(): ResponsavelTecnicoDados {
  try {
    const raw = localStorage.getItem(STORAGE_RESPONSAVEL_TECNICO_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        nome: parsed.nome || '',
        crc: parsed.crc || '',
        email: parsed.email || '',
        telefone: parsed.telefone || '',
        observacoes: parsed.observacoes || '',
      }
    }
  } catch {
    // Silently fallback
  }
  return {
    nome: '',
    crc: '',
    email: '',
    telefone: '',
    observacoes: '',
  }
}

export function salvarResponsavelTecnico(dados: ResponsavelTecnicoDados): void {
  try {
    localStorage.setItem(STORAGE_RESPONSAVEL_TECNICO_KEY, JSON.stringify(dados))
  } catch {
    // Silently fallback
  }
}

interface ModalGerarPdfProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  titulo?: string
  descricao?: string
  modo?: 'individual' | 'comparativo' | 'escolha'
  quantidadeSimulacoesComparar?: number
  onConfirmar: (dados: ResponsavelTecnicoDados, escolha?: 'atual' | 'comparativo') => void
  gerando?: boolean
}

export function ModalGerarPdf({
  open,
  onOpenChange,
  titulo = 'Emitir Relatório Técnico em PDF',
  descricao = 'Informe os dados do Responsável Técnico contábil para inclusão no cabeçalho e encerramento do documento.',
  modo = 'individual',
  quantidadeSimulacoesComparar = 0,
  onConfirmar,
  gerando = false,
}: ModalGerarPdfProps) {
  const [nome, setNome] = useState('')
  const [crc, setCrc] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [escolhaTipo, setEscolhaTipo] = useState<'atual' | 'comparativo'>(
    modo === 'comparativo' ? 'comparativo' : 'atual',
  )

  useEffect(() => {
    if (open) {
      const salvo = carregarResponsavelTecnicoSalvo()
      setNome(salvo.nome)
      setCrc(salvo.crc)
      setEmail(salvo.email)
      setTelefone(salvo.telefone)
      setObservacoes(salvo.observacoes || '')
      setEscolhaTipo(modo === 'comparativo' ? 'comparativo' : 'atual')
    }
  }, [open, modo])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dados: ResponsavelTecnicoDados = {
      nome: nome.trim(),
      crc: crc.trim(),
      email: email.trim(),
      telefone: telefone.trim(),
      observacoes: observacoes.trim(),
    }
    salvarResponsavelTecnico(dados)
    onConfirmar(dados, modo === 'escolha' ? escolhaTipo : undefined)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-[#0A1A13]">{titulo}</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">{descricao}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* SELETOR QUANDO O MODO FOR 'escolha' (Dashboard com simulações marcadas) */}
          {modo === 'escolha' && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <Label className="text-xs font-bold text-[#0A1A13]">
                Qual relatório deseja emitir?
              </Label>
              <RadioGroup
                value={escolhaTipo}
                onValueChange={(val) => setEscolhaTipo(val as 'atual' | 'comparativo')}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="atual" id="opt-atual" />
                  <Label htmlFor="opt-atual" className="text-xs font-medium cursor-pointer">
                    Simulação Atual (cenário ativo no dashboard)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="comparativo" id="opt-comparativo" />
                  <Label htmlFor="opt-comparativo" className="text-xs font-medium cursor-pointer">
                    Comparativo Lado a Lado ({quantidadeSimulacoesComparar} cenários marcados)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* DADOS DO RESPONSÁVEL TÉCNICO */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#0A1A13] uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center justify-between">
              <span>Responsável Técnico Contábil</span>
              <span className="text-[10px] text-slate-400 font-normal lowercase">
                (salvo automaticamente)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="resp-nome" className="text-xs text-slate-700">
                  Nome Completo
                </Label>
                <Input
                  id="resp-nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex.: Carlos Mendes"
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="resp-crc" className="text-xs text-slate-700">
                  CRC (Registro Profissional)
                </Label>
                <Input
                  id="resp-crc"
                  value={crc}
                  onChange={(e) => setCrc(e.target.value)}
                  placeholder="Ex.: CRC-SP 123456/O-7"
                  className="text-xs h-9"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="resp-email" className="text-xs text-slate-700">
                  E-mail Profissional
                </Label>
                <Input
                  id="resp-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analista@empresa.com.br"
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="resp-tel" className="text-xs text-slate-700">
                  Telefone / WhatsApp
                </Label>
                <Input
                  id="resp-tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="resp-obs" className="text-xs text-slate-700 flex justify-between">
                <span>Observações do Analista (opcional)</span>
                <span className="text-[10px] text-slate-400">Incluído na página final</span>
              </Label>
              <Textarea
                id="resp-obs"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex.: Empresa possui saldo de créditos acumulados sob análise judicial; transição recomendada a partir de 2027 com a extinção definitiva de PIS/COFINS."
                className="text-xs min-h-[64px] max-h-32"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={gerando}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={gerando || !nome.trim() || !crc.trim() || !email.trim()}
              className="text-xs bg-[#0A1A13] hover:bg-[#142820] text-[#D4AF37] font-bold"
            >
              {gerando ? 'Gerando Relatório...' : 'Gerar e Baixar PDF'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
