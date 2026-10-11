import React from 'react'
import { useCalculadoraIbsCbs } from '@/context/CalculadoraIbsCbsContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Sliders, RotateCcw, Info, CheckCircle2, ShieldCheck, Zap } from 'lucide-react'
import { FarolLimitesSimples } from '@/components/calculadora/FarolLimitesSimples'

export default function Modulo1Configuracoes() {
  const { config, updateConfig, resetConfig, alertaLimitesSimples } = useCalculadoraIbsCbs()

  const handleInputChange = (field: keyof typeof config, value: string) => {
    const limpo = value.replace(',', '.')
    const parsed = parseFloat(limpo)
    if (!isNaN(parsed)) {
      updateConfig({ [field]: parsed })
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cabeçalho do Módulo */}
      <div className="bg-[#07132B] border border-[#D4AF37]/30 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 tracking-wider uppercase">
              <Sliders className="w-3.5 h-3.5" />
              Módulo 1 • Parâmetros Globais
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
              Configurações Gerais de Alíquotas
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
              Defina os parâmetros centrais do IVA Dual (CBS federal e IBS subnacional) e as taxas
              do sistema antigo. Todos os outros 5 módulos consom essas diretrizes em tempo real.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={resetConfig}
            className="self-start sm:self-center border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-white bg-transparent"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar Padrões Oficiais
          </Button>
        </div>
      </div>

      {/* ETAPA 3: FARÓIS DE LIMITES DO SIMPLES NACIONAL NO MÓDULO 1 */}
      <FarolLimitesSimples alerta={alertaLimitesSimples} compacto={false} />

      {/* Grid de Configurações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: IVA Dual Padrão */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#D4AF37] tracking-wider uppercase">
                Alíquotas Padrão
              </span>
              <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <CardTitle className="text-lg font-heading text-[#07132B]">
              Novo Sistema (IVA Dual)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Trava de referência de 26,50% prevista pelo Ministério da Fazenda e LC 214/2025.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label htmlFor="cbsPadrao" className="text-sm font-semibold text-slate-700">
                  CBS Padrão (Federal)
                </Label>
                <span className="text-xs text-slate-400">PIS/COFINS/IPI</span>
              </div>
              <div className="relative">
                <Input
                  id="cbsPadrao"
                  type="number"
                  step="0.01"
                  value={config.cbsPadrao}
                  onChange={(e) => handleInputChange('cbsPadrao', e.target.value)}
                  className="pr-8 font-mono font-medium"
                />
                <span className="absolute right-3 top-2.5 text-sm text-slate-400 font-semibold">
                  %
                </span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label htmlFor="ibsPadrao" className="text-sm font-semibold text-slate-700">
                  IBS Padrão (Estados/Municípios)
                </Label>
                <span className="text-xs text-slate-400">ICMS/ISS</span>
              </div>
              <div className="relative">
                <Input
                  id="ibsPadrao"
                  type="number"
                  step="0.01"
                  value={config.ibsPadrao}
                  onChange={(e) => handleInputChange('ibsPadrao', e.target.value)}
                  className="pr-8 font-mono font-medium"
                />
                <span className="absolute right-3 top-2.5 text-sm text-slate-400 font-semibold">
                  %
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center mb-1.5">
                <Label htmlFor="totalIvaDual" className="text-sm font-bold text-[#07132B]">
                  Total IVA Dual (CBS + IBS)
                </Label>
                <span className="text-xs font-bold text-[#D4AF37]">Alíquota Cheia</span>
              </div>
              <div className="relative">
                <Input
                  id="totalIvaDual"
                  type="number"
                  step="0.01"
                  value={config.totalIvaDual}
                  onChange={(e) => handleInputChange('totalIvaDual', e.target.value)}
                  className="pr-8 font-mono font-bold bg-amber-50/50 border-[#D4AF37]/50 text-[#07132B]"
                />
                <span className="absolute right-3 top-2.5 text-sm text-[#07132B] font-bold">%</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs text-blue-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <Info className="w-3.5 h-3.5 shrink-0" />
                Princípio do Destino
              </div>
              <p>
                A tributação ocorre inteiramente no local de consumo com split payment e
                creditamento irrestrito.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Regimes Diferenciados */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2ECC71] tracking-wider uppercase">
                LC 214/2025 Art. 130
              </span>
              <Zap className="w-5 h-5 text-[#2ECC71]" />
            </div>
            <CardTitle className="text-lg font-heading text-[#07132B]">
              Regimes Diferenciados
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Reduções constitucionais de 60%, 30% e isenção integral da cesta básica.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label
                  htmlFor="saudeEducacaoAliquota"
                  className="text-sm font-semibold text-slate-700"
                >
                  Saúde e Educação (-60%)
                </Label>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Redução 60%
                </span>
              </div>
              <div className="relative">
                <Input
                  id="saudeEducacaoAliquota"
                  type="number"
                  step="0.01"
                  value={config.saudeEducacaoAliquota}
                  onChange={(e) => handleInputChange('saudeEducacaoAliquota', e.target.value)}
                  className="pr-8 font-mono font-medium"
                />
                <span className="absolute right-3 top-2.5 text-sm text-slate-400 font-semibold">
                  %
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Serviços de saúde humana e ensino fundamental/superior (resulta em 10,60%).
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label
                  htmlFor="transporteAliquota"
                  className="text-sm font-semibold text-slate-700"
                >
                  Transporte Coletivo (-30%)
                </Label>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  Redução 30%
                </span>
              </div>
              <div className="relative">
                <Input
                  id="transporteAliquota"
                  type="number"
                  step="0.01"
                  value={config.transporteAliquota}
                  onChange={(e) => handleInputChange('transporteAliquota', e.target.value)}
                  className="pr-8 font-mono font-medium"
                />
                <span className="absolute right-3 top-2.5 text-sm text-slate-400 font-semibold">
                  %
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Transporte de passageiros e profissões intelectuais (resulta em 18,55%).
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label
                  htmlFor="cestaBasicaIsencao"
                  className="text-sm font-semibold text-slate-700"
                >
                  Cesta Básica Nacional
                </Label>
                <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  Alíquota Zero
                </span>
              </div>
              <div className="relative">
                <Input
                  id="cestaBasicaIsencao"
                  type="number"
                  step="0.01"
                  value={config.cestaBasicaIsencao}
                  onChange={(e) => handleInputChange('cestaBasicaIsencao', e.target.value)}
                  className="pr-8 font-mono font-medium bg-emerald-50/50"
                />
                <span className="absolute right-3 top-2.5 text-sm text-slate-400 font-semibold">
                  %
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Isenção total com direito a manutenção de créditos para insumos essenciais.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Sistema Antigo */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 tracking-wider uppercase">
                Sistema Atual
              </span>
              <CheckCircle2 className="w-5 h-5 text-slate-600" />
            </div>
            <CardTitle className="text-lg font-heading text-[#07132B]">
              Regimes Antigos de Referência
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Taxas nominais de Lucro Real e Lucro Presumido para o comparativo direto.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {/* Lucro Real */}
            <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2.5">
              <span className="text-xs font-bold text-slate-900 block border-b pb-1">
                Lucro Real (Não-cumulativo)
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <Label htmlFor="lucroRealPis" className="text-[11px] text-slate-600">
                    PIS:
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="lucroRealPis"
                      type="number"
                      step="0.01"
                      value={config.lucroRealPis}
                      onChange={(e) => handleInputChange('lucroRealPis', e.target.value)}
                      className="h-8 text-xs pr-6 font-mono"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-400">%</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="lucroRealCofins" className="text-[11px] text-slate-600">
                    COFINS:
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="lucroRealCofins"
                      type="number"
                      step="0.01"
                      value={config.lucroRealCofins}
                      onChange={(e) => handleInputChange('lucroRealCofins', e.target.value)}
                      className="h-8 text-xs pr-6 font-mono"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-400">%</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                <div>
                  <Label htmlFor="lucroRealIpi" className="text-[10px] text-slate-600">
                    IPI:
                  </Label>
                  <Input
                    id="lucroRealIpi"
                    type="number"
                    step="0.1"
                    value={config.lucroRealIpi}
                    onChange={(e) => handleInputChange('lucroRealIpi', e.target.value)}
                    className="h-7 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="lucroRealIcms" className="text-[10px] text-slate-600">
                    ICMS:
                  </Label>
                  <Input
                    id="lucroRealIcms"
                    type="number"
                    step="0.1"
                    value={config.lucroRealIcms}
                    onChange={(e) => handleInputChange('lucroRealIcms', e.target.value)}
                    className="h-7 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="lucroRealIss" className="text-[10px] text-slate-600">
                    ISS:
                  </Label>
                  <Input
                    id="lucroRealIss"
                    type="number"
                    step="0.1"
                    value={config.lucroRealIss}
                    onChange={(e) => handleInputChange('lucroRealIss', e.target.value)}
                    className="h-7 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Lucro Presumido */}
            <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2.5">
              <span className="text-xs font-bold text-slate-900 block border-b pb-1">
                Lucro Presumido (Cumulativo)
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <Label htmlFor="lucroPresumidoPis" className="text-[11px] text-slate-600">
                    PIS:
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="lucroPresumidoPis"
                      type="number"
                      step="0.01"
                      value={config.lucroPresumidoPis}
                      onChange={(e) => handleInputChange('lucroPresumidoPis', e.target.value)}
                      className="h-8 text-xs pr-6 font-mono"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-400">%</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="lucroPresumidoCofins" className="text-[11px] text-slate-600">
                    COFINS:
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="lucroPresumidoCofins"
                      type="number"
                      step="0.01"
                      value={config.lucroPresumidoCofins}
                      onChange={(e) => handleInputChange('lucroPresumidoCofins', e.target.value)}
                      className="h-8 text-xs pr-6 font-mono"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-400">%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
