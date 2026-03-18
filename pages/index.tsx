import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Sector } from "recharts"
import MetricCard from "@/pages/components/MetricCard"
import RejectionList from "@/pages/components/RejectionList"
import { DetectionEvent } from "@/pages/lib/mock-data"

interface Stats {
  totalProduced: number
  totalRejected: number
  rejectionRate: string
  lastEvent: DetectionEvent
  hourly: { hour: string; produced: number; rejected: number }[]
  shifts: { manha: number; tarde: number; noite: number }
  ferroso: number
  naoFerroso: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [events, setEvents] = useState<DetectionEvent[]>([])
  const [simulating, setSimulating] = useState(false)
  const [activeMetalIndex, setActiveMetalIndex] = useState<number | null>(null)
  const [hoveredMetal, setHoveredMetal] = useState<string | null>(null)
  const [hoveredValue, setHoveredValue] = useState<number | null>(null)
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null)

  async function fetchData() {
    const [s, e] = await Promise.all([
      fetch("/api/stats").then(r => r.json()),
      fetch("/api/events").then(r => r.json()),
    ])
    setStats(s)
    setEvents(e)
  }

  useEffect(() => { fetchData() }, [])

  async function simular() {
    setSimulating(true)
    await fetch("/api/simulate", { method: "POST" })
    await fetchData()
    setSimulating(false)
  }

  if (!stats) return (
    <div className="flex items-center justify-center h-screen text-gray-400 text-sm">
      Carregando...
    </div>
  )

  const pieData = [
    { name: "Ferroso", value: stats.ferroso },
    { name: "Não ferroso", value: stats.naoFerroso },
  ]

  return (
    <>
    <div className="max-w-5xl mx-auto p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-medium text-gray-900">Doces Mirahy — Monitoramento de Linha</h1>
          <p className="text-xs text-gray-400 mt-0.5">Esteira de saída · Detecção de metais</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Linha operando
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricCard label="Produção hoje" value={stats.totalProduced.toLocaleString("pt-BR")} sub="unidades aprovadas" variant="ok" />
        <MetricCard label="Rejeições hoje" value={stats.totalRejected} sub="produtos rejeitados" variant="danger" />
        <MetricCard label="Taxa de rejeição" value={`${stats.rejectionRate}%`} sub="limite ANVISA: 0%" variant="warn" />
        <MetricCard label="Última rejeição" value={stats.lastEvent?.timestamp ?? "--"} sub={`${stats.lastEvent?.metal_type === "ferroso" ? "Ferroso" : "Não ferroso"} · ${stats.lastEvent?.size_mm}mm`} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="col-span-2 border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Produção x Rejeições — Últimas 8h</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.hourly} barGap={4}>
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#ef4444" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "0.5px solid #e5e7eb" }} />
              <Bar yAxisId="left" dataKey="produced" fill="#0ccf57" radius={[4,4,0,0]} name="Produção" />
              <Bar yAxisId="right" dataKey="rejected" fill="#ef4444" radius={[4,4,0,0]} name="Rejeições" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Últimas rejeições</p>
          <RejectionList events={events} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Por turno</p>
          {Object.entries(stats.shifts).map(([shift, count]) => {
            const max = Math.max(...Object.values(stats.shifts))
            const pct = max > 0 ? (count / max) * 100 : 0
            const colors: Record<string, string> = { manha: "bg-emerald-400", tarde: "bg-amber-400", noite: "bg-blue-400" }
            const labels: Record<string, string> = { manha: "Manhã", tarde: "Tarde", noite: "Noite" }
            return (
              <div key={shift} className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-400 w-10">{labels[shift]}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${colors[shift]}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-medium text-gray-700 w-4">{count}</span>
              </div>
            )
          })}
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mt-4 mb-3">Tipo de metal</p>
          <div className="relative flex justify-center">
            <PieChart width={140} height={120}>
              <Pie
                data={pieData}
                cx={70}
                cy={60}
                innerRadius={30}
                outerRadius={48}
                dataKey="value"
                strokeWidth={0}
                onMouseEnter={(data: any, index: number) => {
                  setActiveMetalIndex(index)
                  setHoveredMetal(data.name)
                  setHoveredValue(data.value)
                }}
                onMouseLeave={() => {
                  setActiveMetalIndex(null)
                  setHoveredMetal(null)
                  setHoveredValue(null)
                }}
              >
                <Cell fill={activeMetalIndex === 0 ? "#dc2626" : "#ef4444"} />
                <Cell fill={activeMetalIndex === 1 ? "#b45309" : "#f59e0b"} />
              </Pie>
            </PieChart>
            {hoveredMetal && hoveredValue != null && (
              <div className="absolute z-10 -top-6 left-1/2 transform -translate-x-1/2 rounded-md bg-gray-800 px-2 py-1 text-[10px] text-white">
                {hoveredMetal}: {hoveredValue} unidades
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-center mt-1">
            <span className={`flex items-center gap-1 text-xs ${activeMetalIndex === 0 ? "text-gray-900 font-semibold" : "text-gray-400"}`}><span className="w-2 h-2 rounded-sm bg-red-400" />Ferroso</span>
            <span className={`flex items-center gap-1 text-xs ${activeMetalIndex === 1 ? "text-gray-900 font-semibold" : "text-gray-400"}`}><span className="w-2 h-2 rounded-sm bg-amber-400" />Não ferroso</span>
          </div>
        </div>

        <div className="col-span-2 border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Alertas do sistema</p>
          <div className="flex flex-col gap-2">
            {[
              { type: "danger", msg: "Taxa de rejeição acima de 0,3% no turno da manhã", time: "14:32 · Notificação enviada ao supervisor" },
              { type: "warn", msg: "2 rejeições consecutivas no mesmo lote L024-031", time: "13:20 · Verificar equipamento de corte" },
              { type: "warn", msg: "Rejeição de fragmento ferroso 2,1mm detectada", time: "08:51 · Acima do limiar configurado" },
              { type: "ok", msg: "Calibração do detector validada com êxito", time: "07:00 · Início do turno manhã" },
            ].map((a, i) => (
              <div key={i} className={`flex gap-2 px-3 py-2 rounded-lg text-xs
                ${a.type === "danger" ? "bg-red-50" : a.type === "warn" ? "bg-amber-50" : "bg-emerald-50"}`}>
                <span className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0
                  ${a.type === "danger" ? "bg-red-400" : a.type === "warn" ? "bg-amber-400" : "bg-emerald-400"}`} />
                <div>
                  <p className="text-gray-700">{a.msg}</p>
                  <p className="text-gray-400 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rejeições detalhadas */}
      <div className="border border-gray-100 rounded-xl p-4 mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Rejeições completas</p>
            <p className="text-sm font-semibold text-gray-700">Todas as rejeições registradas</p>
          </div>
          <div className="flex gap-2 text-xs text-gray-600">
            <div className="rounded-md bg-gray-100 px-2 py-1">Total rejeições: <span className="font-semibold text-gray-800">{events.length}</span></div>
            <div className="rounded-md bg-red-50 px-2 py-1">Ferroso: <span className="font-semibold text-red-600">{events.filter(e => e.metal_type === "ferroso").length}</span></div>
            <div className="rounded-md bg-amber-50 px-2 py-1">Não ferroso: <span className="font-semibold text-amber-700">{events.filter(e => e.metal_type === "nao_ferroso").length}</span></div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs text-gray-600 border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-2 py-2 border-b border-gray-200">Hora</th>
                <th className="px-2 py-2 border-b border-gray-200">Tipo</th>
                <th className="px-2 py-2 border-b border-gray-200">Tamanho (mm)</th>
                <th className="px-2 py-2 border-b border-gray-200">Turno</th>
                <th className="px-2 py-2 border-b border-gray-200">Lote</th>
                <th className="px-2 py-2 border-b border-gray-200">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-2 py-2">{event.timestamp}</td>
                  <td className="px-2 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${event.metal_type === "ferroso" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {event.metal_type === "ferroso" ? "Ferroso" : "Não ferroso"}
                    </span>
                  </td>
                  <td className="px-2 py-2">{event.size_mm.toFixed(1)} mm</td>
                  <td className="px-2 py-2">{event.shift === "manha" ? "Manhã" : event.shift === "tarde" ? "Tarde" : "Noite"}</td>
                  <td className="px-2 py-2">{event.lot}</td>
                  <td className="px-2 py-2">Rejeição confirmada</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-300">Dados simulados · Sistema ANVISA-ready · Grand Prix SENAI 2024</p>
        <button
          onClick={simular}
          disabled={simulating}
          className="text-xs px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
          {simulating ? "Simulando..." : "Simular detecção"}
        </button>
      </div>

    </div>
    </>
  )
}