import { useEffect, useState } from "react"

interface Relatorio {
  total: number; totalAnterior: number; tendencia: "aumento" | "queda" | "estável"
  variacaoPct: string; ferroso: number; naoFerroso: number; tamanhoMedio: string
  lotesCriticos: { lot: string; count: number }[]; porTurno: Record<string, number>
  equipamentosEmFalha: string[]; insights: string[]; geradoEm: string
}

export default function Relatorios() {
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchRelatorio() {
    setLoading(true)
    const res = await fetch("/api/relatorio")
    setRelatorio(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchRelatorio() }, [])

  const tendenciaConfig = {
    aumento: { icon: "▲", color: "text-red-600", accent: "#ef4444", bg: "bg-red-50 border-red-100" },
    queda:   { icon: "▼", color: "text-emerald-600", accent: "#16c784", bg: "bg-emerald-50 border-emerald-100" },
    estável: { icon: "—", color: "text-amber-600", accent: "#f59e0b", bg: "bg-amber-50 border-amber-100" },
  }

  const turnoLabels: Record<string, string> = { manha: "Manhã", tarde: "Tarde", noite: "Noite" }
  const turnoColors: Record<string, string> = { manha: "#16c784", tarde: "#f59e0b", noite: "#60a5fa" }

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Relatórios automáticos</h1>
            <p className="text-xs text-gray-400 mt-0.5">Análise dos últimos 7 dias com comparativo da semana anterior</p>
          </div>
          <button onClick={fetchRelatorio} disabled={loading}
            className="text-xs font-medium px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 transition-all shadow-sm">
            {loading ? "Gerando..." : "↻ Gerar novo relatório"}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-6 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-[#16c784] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : relatorio ? (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total rejeições", value: relatorio.total, sub: "últimos 7 dias", accent: "#6b7280", textColor: "text-gray-900" },
                { label: "Semana anterior", value: relatorio.totalAnterior, sub: "para comparação", accent: "#d1d5db", textColor: "text-gray-500" },
                { label: "Tendência", value: `${tendenciaConfig[relatorio.tendencia].icon} ${relatorio.variacaoPct}%`, sub: "vs semana anterior", accent: tendenciaConfig[relatorio.tendencia].accent, textColor: tendenciaConfig[relatorio.tendencia].color },
                { label: "Tamanho médio", value: `${relatorio.tamanhoMedio}mm`, sub: "dos fragmentos", accent: "#60a5fa", textColor: "text-gray-900" },
              ].map((card, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: card.accent }} />
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">{card.label}</p>
                  <p className={`text-2xl font-semibold tracking-tight ${card.textColor}`}>{card.value}</p>
                  <p className="text-[11px] text-gray-400 mt-2">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Distribuição */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  title: "Por tipo de metal",
                  items: [
                    { label: "Ferroso", value: relatorio.ferroso, color: "#ef4444", bg: "bg-red-400" },
                    { label: "Não ferroso", value: relatorio.naoFerroso, color: "#f59e0b", bg: "bg-amber-400" },
                  ]
                },
                {
                  title: "Por turno",
                  items: Object.entries(relatorio.porTurno).map(([k, v]) => ({ label: turnoLabels[k], value: v, color: turnoColors[k], bg: "" }))
                }
              ].map((section, si) => (
                <div key={si} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-sm font-semibold text-gray-800 mb-4">{section.title}</h2>
                  <div className="flex flex-col gap-4">
                    {section.items.map(item => {
                      const max = Math.max(...section.items.map(i => i.value), 1)
                      const pct = (item.value / (si === 0 ? relatorio.total || 1 : max)) * 100
                      return (
                        <div key={item.label}>
                          <div className="flex justify-between mb-2">
                            <span className="text-[12px] text-gray-600 font-medium">{item.label}</span>
                            <span className="text-[12px] font-semibold text-gray-800">{item.value}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: item.color }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Lotes críticos */}
            {relatorio.lotesCriticos.length > 0 && (
              <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-800 mb-1">Lotes críticos</h2>
                <p className="text-xs text-gray-400 mb-4">Lotes com maior incidência de contaminação</p>
                <div className="flex flex-wrap gap-2">
                  {relatorio.lotesCriticos.map(({ lot, count }) => (
                    <div key={lot} className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-xl">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-xs font-semibold text-red-700">{lot}</span>
                      <span className="text-xs text-red-400">{count}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Equipamentos em falha */}
            {relatorio.equipamentosEmFalha.length > 0 && (
              <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
                <h2 className="text-sm font-semibold text-red-700 mb-3">⚠ Equipamentos em falha ativa</h2>
                <div className="flex flex-wrap gap-2">
                  {relatorio.equipamentosEmFalha.map(eq => (
                    <span key={eq} className="text-xs font-medium px-3 py-1.5 bg-red-100 text-red-700 rounded-full border border-red-200">{eq}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-1">Insights e recomendações</h2>
              <p className="text-xs text-gray-400 mb-5">Gerados automaticamente com base nos dados do período</p>
              <div className="flex flex-col gap-3">
                {relatorio.insights.map((insight, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-blue-600">{i + 1}</span>
                    </div>
                    <p className="text-[12px] text-gray-700 leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-300 mt-5 text-right">
                Gerado em {new Date(relatorio.geradoEm).toLocaleString("pt-BR")}
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}