import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const periodos = [
  { label: "1 dia", value: "1" },
  { label: "7 dias", value: "7" },
  { label: "21 dias", value: "21" },
  { label: "30 dias", value: "30" },
]

interface HistoricoData {
  total: number; ferroso: number; naoFerroso: number
  porLote: Record<string, number>; eventos: any[]; periodo: number
}

export default function Analise() {
  const [periodo, setPeriodo] = useState("7")
  const [data, setData] = useState<HistoricoData | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchHistorico(p: string) {
    setLoading(true)
    const res = await fetch(`/api/historico?periodo=${p}`)
    setData(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchHistorico(periodo) }, [periodo])

  const loteData = data ? Object.entries(data.porLote).map(([lot, count]) => ({ lot, count })) : []

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Análise por período</h1>
            <p className="text-xs text-gray-400 mt-0.5">Histórico de rejeições e contaminações</p>
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {periodos.map(p => (
              <button key={p.value} onClick={() => setPeriodo(p.value)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all
                  ${periodo === p.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-6 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-[#16c784] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total de rejeições", value: data.total, sub: `últimos ${data.periodo} dias`, accent: "#6b7280", textColor: "text-gray-900" },
                { label: "Ferrosos", value: data.ferroso, sub: `${data.total > 0 ? ((data.ferroso / data.total) * 100).toFixed(1) : 0}% do total`, accent: "#ef4444", textColor: "text-red-600" },
                { label: "Não ferrosos", value: data.naoFerroso, sub: `${data.total > 0 ? ((data.naoFerroso / data.total) * 100).toFixed(1) : 0}% do total`, accent: "#f59e0b", textColor: "text-amber-600" },
              ].map((card, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: card.accent }} />
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">{card.label}</p>
                  <p className={`text-4xl font-semibold tracking-tight ${card.textColor}`}>{card.value}</p>
                  <p className="text-[11px] text-gray-400 mt-2">{card.sub}</p>
                </div>
              ))}
            </div>

            {loteData.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-800 mb-1">Rejeições por lote</h2>
                <p className="text-xs text-gray-400 mb-5">Distribuição por lote de produção</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={loteData} barCategoryGap="50%">
                    <XAxis dataKey="lot" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #f0f0f0", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }} />
                    <Bar dataKey="count" fill="#ef4444" radius={[6,6,0,0]} name="Rejeições" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">Registro de eventos</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{data.eventos?.length ?? 0} registros no período</p>
                </div>
              </div>
              {data.eventos?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-sm text-gray-300">Nenhuma rejeição neste período</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {["Data/Hora", "Tipo", "Tamanho", "Turno", "Lote"].map(h => (
                          <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest pb-3 px-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.eventos.map((e: any) => (
                        <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-3 text-gray-600 font-mono">{new Date(e.created_at).toLocaleString("pt-BR")}</td>
                          <td className="px-3 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold
                              ${e.metal_type === "ferroso" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                              {e.metal_type === "ferroso" ? "Ferroso" : "Não ferroso"}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-gray-500 font-mono">{e.size_mm?.toFixed(1)}mm</td>
                          <td className="px-3 py-3 text-gray-500">{e.shift === "manha" ? "Manhã" : e.shift === "tarde" ? "Tarde" : "Noite"}</td>
                          <td className="px-3 py-3 text-gray-400 font-mono">{e.lot}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}