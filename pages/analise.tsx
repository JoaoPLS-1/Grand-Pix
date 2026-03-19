import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const periodos = [
  { label: "1 dia", value: "1" },
  { label: "7 dias", value: "7" },
  { label: "21 dias", value: "21" },
  { label: "30 dias", value: "30" },
]

interface HistoricoData {
  total: number
  ferroso: number
  naoFerroso: number
  porLote: Record<string, number>
  eventos: any[]
  periodo: number
}

export default function Analise() {
  const [periodo, setPeriodo] = useState("7")
  const [data, setData] = useState<HistoricoData | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchHistorico(p: string) {
    setLoading(true)
    const res = await fetch(`/api/historico?periodo=${p}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  useEffect(() => { fetchHistorico(periodo) }, [periodo])

  const loteData = data
    ? Object.entries(data.porLote).map(([lot, count]) => ({ lot, count }))
    : []

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-medium text-gray-900">Análise por período</h1>
          <p className="text-xs text-gray-400 mt-0.5">Histórico de rejeições e contaminações</p>
        </div>
        <div className="flex gap-1">
          {periodos.map(p => (
            <button key={p.value} onClick={() => setPeriodo(p.value)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors
                ${periodo === p.value ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Carregando...</div>
      ) : data ? (
        <>
          {/* Cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Total de rejeições</p>
              <p className="text-2xl font-medium text-gray-900">{data.total}</p>
              <p className="text-xs text-gray-400 mt-1">últimos {data.periodo} dias</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Ferrosos</p>
              <p className="text-2xl font-medium text-red-600">{data.ferroso}</p>
              <p className="text-xs text-gray-400 mt-1">
                {data.total > 0 ? ((data.ferroso / data.total) * 100).toFixed(1) : 0}% do total
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Não ferrosos</p>
              <p className="text-2xl font-medium text-amber-600">{data.naoFerroso}</p>
              <p className="text-xs text-gray-400 mt-1">
                {data.total > 0 ? ((data.naoFerroso / data.total) * 100).toFixed(1) : 0}% do total
              </p>
            </div>
          </div>

          {/* Gráfico por lote */}
          {loteData.length > 0 && (
            <div className="border border-gray-100 rounded-xl p-4 mb-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Rejeições por lote</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={loteData} barGap={4}>
                  <XAxis dataKey="lot" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "0.5px solid #e5e7eb" }} />
                  <Bar dataKey="count" fill="#ef4444" radius={[4,4,0,0]} name="Rejeições" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tabela de eventos */}
          <div className="border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Eventos no período — {data.eventos?.length ?? 0} registros
            </p>
            {data.eventos?.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Nenhuma rejeição neste período</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-gray-600 border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-2 py-2 border-b border-gray-200 text-left">Data/Hora</th>
                      <th className="px-2 py-2 border-b border-gray-200 text-left">Tipo</th>
                      <th className="px-2 py-2 border-b border-gray-200 text-left">Tamanho</th>
                      <th className="px-2 py-2 border-b border-gray-200 text-left">Turno</th>
                      <th className="px-2 py-2 border-b border-gray-200 text-left">Lote</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.eventos.map((e: any) => (
                      <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-2 py-2">{new Date(e.created_at).toLocaleString("pt-BR")}</td>
                        <td className="px-2 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px]
                            ${e.metal_type === "ferroso" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                            {e.metal_type === "ferroso" ? "Ferroso" : "Não ferroso"}
                          </span>
                        </td>
                        <td className="px-2 py-2">{e.size_mm?.toFixed(1)}mm</td>
                        <td className="px-2 py-2">{e.shift === "manha" ? "Manhã" : e.shift === "tarde" ? "Tarde" : "Noite"}</td>
                        <td className="px-2 py-2">{e.lot}</td>
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
  )
}