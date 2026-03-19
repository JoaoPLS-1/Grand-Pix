import { useEffect, useState } from "react"

interface Relatorio {
  total: number
  totalAnterior: number
  tendencia: "aumento" | "queda" | "estável"
  variacaoPct: string
  ferroso: number
  naoFerroso: number
  tamanhoMedio: string
  lotesCriticos: { lot: string; count: number }[]
  porTurno: Record<string, number>
  equipamentosEmFalha: string[]
  insights: string[]
  geradoEm: string
}

const tendenciaConfig = {
  aumento: { label: "Aumento", color: "text-red-600", bg: "bg-red-50" },
  queda:   { label: "Queda",   color: "text-emerald-600", bg: "bg-emerald-50" },
  estável: { label: "Estável", color: "text-amber-600", bg: "bg-amber-50" },
}

export default function Relatorios() {
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchRelatorio() {
    setLoading(true)
    const res = await fetch("/api/relatorio")
    const json = await res.json()
    setRelatorio(json)
    setLoading(false)
  }

  useEffect(() => { fetchRelatorio() }, [])

  const turnoLabels: Record<string, string> = { manha: "Manhã", tarde: "Tarde", noite: "Noite" }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-medium text-gray-900">Relatórios automáticos</h1>
          <p className="text-xs text-gray-400 mt-0.5">Análise dos últimos 7 dias com comparativo da semana anterior</p>
        </div>
        <button onClick={fetchRelatorio} disabled={loading}
          className="text-xs px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
          {loading ? "Gerando..." : "Gerar novo relatório"}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Gerando relatório...</div>
      ) : relatorio ? (
        <>
          {/* Cards principais */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Total rejeições</p>
              <p className="text-2xl font-medium text-gray-900">{relatorio.total}</p>
              <p className="text-xs text-gray-400 mt-1">últimos 7 dias</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Semana anterior</p>
              <p className="text-2xl font-medium text-gray-500">{relatorio.totalAnterior}</p>
              <p className="text-xs text-gray-400 mt-1">para comparação</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Tendência</p>
              <p className={`text-2xl font-medium ${tendenciaConfig[relatorio.tendencia].color}`}>
                {relatorio.tendencia === "aumento" ? "▲" : relatorio.tendencia === "queda" ? "▼" : "—"} {relatorio.variacaoPct}%
              </p>
              <p className="text-xs text-gray-400 mt-1">vs semana anterior</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Tamanho médio</p>
              <p className="text-2xl font-medium text-gray-900">{relatorio.tamanhoMedio}mm</p>
              <p className="text-xs text-gray-400 mt-1">dos fragmentos</p>
            </div>
          </div>

          {/* Distribuição */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Por tipo */}
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Por tipo de metal</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Ferroso", value: relatorio.ferroso, color: "bg-red-400" },
                  { label: "Não ferroso", value: relatorio.naoFerroso, color: "bg-amber-400" },
                ].map(item => {
                  const pct = relatorio.total > 0 ? (item.value / relatorio.total) * 100 : 0
                  return (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-20">{item.label}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-700 w-8 text-right">{item.value}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Por turno */}
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Por turno</p>
              <div className="flex flex-col gap-2">
                {Object.entries(relatorio.porTurno).map(([turno, count]) => {
                  const max = Math.max(...Object.values(relatorio.porTurno))
                  const pct = max > 0 ? (count / max) * 100 : 0
                  const colors: Record<string, string> = { manha: "bg-emerald-400", tarde: "bg-amber-400", noite: "bg-blue-400" }
                  return (
                    <div key={turno} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-12">{turnoLabels[turno]}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${colors[turno]}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-700 w-4 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Lotes críticos */}
          {relatorio.lotesCriticos.length > 0 && (
            <div className="border border-red-100 rounded-xl p-4 mb-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Lotes críticos</p>
              <div className="flex flex-wrap gap-2">
                {relatorio.lotesCriticos.map(({ lot, count }) => (
                  <span key={lot} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-full border border-red-100 flex items-center gap-1">
                    {lot} <span className="font-semibold">· {count}x</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Equipamentos em falha */}
          {relatorio.equipamentosEmFalha.length > 0 && (
            <div className="border border-red-200 bg-red-50 rounded-xl p-4 mb-4">
              <p className="text-xs font-medium text-red-400 uppercase tracking-wide mb-2">Equipamentos em falha ativa</p>
              <div className="flex flex-wrap gap-2">
                {relatorio.equipamentosEmFalha.map(eq => (
                  <span key={eq} className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full">{eq}</span>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          <div className="border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Insights e recomendações</p>
            <div className="flex flex-col gap-3">
              {relatorio.insights.map((insight, i) => (
                <div key={i} className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-400 font-medium text-xs flex-shrink-0 mt-0.5">{i + 1}.</span>
                  <p className="text-xs text-gray-700 leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-300 mt-4 text-right">
              Gerado em {new Date(relatorio.geradoEm).toLocaleString("pt-BR")}
            </p>
          </div>
        </>
      ) : null}
    </div>
  )
}