import { useEffect, useState, useRef } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import MetricCard from "../pages/components/MetricCard"
import RejectionList from "../pages/components/RejectionList"
import EquipamentoCard from "../pages/components/EquipamentoCard"
import { DetectionEvent } from "../pages/lib/mock-data"
import { gerarAlertas } from "../pages/lib/alerts"

// Atualiza a interface Stats
interface Stats {
  totalProduced: number
  totalRejected: number
  contaminadosPassaram: number  // ← novo
  rejectionRate: string
  lastEvent: DetectionEvent
  hourly: { hour: string; produced: number; rejected: number }[]
  shifts: { manha: number; tarde: number; noite: number }
  ferroso: number
  naoFerroso: number
  esteiraAtiva: boolean
}

interface Equipamento {
  id: string
  nome: string
  status: "ativo" | "falha" | "manutencao"
}

const POLL_INTERVAL = 5000

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [events, setEvents] = useState<DetectionEvent[]>([])
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [simulating, setSimulating] = useState(false)
  const [paused, setPaused] = useState(false)
  const [showFull, setShowFull] = useState(false)
  const [esteiraAtiva, setEsteiraAtiva] = useState(true)
  const [activeMetalIndex, setActiveMetalIndex] = useState<number | null>(null)
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  async function fetchData() {
    const [s, e, eq] = await Promise.all([
      fetch("/api/stats").then(r => r.json()),
      fetch("/api/events").then(r => r.json()),
      fetch("/api/equipamentos").then(r => r.json()),
    ])
    setStats(s)
    setEvents(e)
    setEquipamentos(Array.isArray(eq) ? eq : [])
    setEsteiraAtiva(s.esteiraAtiva ?? true)
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => {
      if (!pausedRef.current) fetchData()
    }, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  async function simular() {
    setSimulating(true)
    await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantidade: 21, contaminationRate: 0.05, pistaoAtivo: true }),
    })
    await fetchData()
    setSimulating(false)
  }

  async function toggleEquipamento(id: string, status: string) {
    await fetch("/api/equipamentos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) })
    await fetchData()
  }

  const hayFalha = equipamentos.some(e => e.status === "falha")

  if (!stats) return <div className="flex items-center justify-center h-screen text-black font-bold text-sm">Carregando...</div>

  const alertas = gerarAlertas(events)
  const pieData = [{ name: "Ferroso", value: stats.ferroso }, { name: "Não ferroso", value: stats.naoFerroso }]
  const hourlyDisplay = showFull
    ? stats.hourly
    : stats.hourly.filter(h => h.produced > 0 || h.rejected > 0).slice(-8)

  return (
    <div className="max-w-5xl mx-auto p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-medium text-gray-900">Dashboard principal</h1>
          <p className="text-xs text-black font-bold mt-0.5">Atualização automática a cada 5s {paused ? "· pausado" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          {hayFalha && (
            <span className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Equipamento em falha
            </span>
          )}
          <button onClick={() => setPaused(p => !p)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors
              ${paused ? "border-amber-300 text-amber-700 bg-amber-50" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
            {paused ? "▶ Retomar" : "⏸ Pausar"}
          </button>
          {!paused && <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
            {esteiraAtiva ? (
              <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Linha operando
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Linha parada
              </span>
            )}
          </span>}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <MetricCard label="Produção hoje" value={stats.totalProduced.toLocaleString("pt-BR")} sub="unidades" variant="ok" />
        <MetricCard label="Rejeições" value={stats.totalRejected} sub="produtos rejeitados" variant="danger" />
        <MetricCard label="Taxa de rejeição" value={`${stats.rejectionRate}%`} sub="limite ANVISA: 0%" variant="warn" />
        <MetricCard
          label="Contaminados passaram"
          value={stats.contaminadosPassaram}
          sub="risco à saúde"
          variant={stats.contaminadosPassaram > 0 ? "danger" : "default"} />
        <MetricCard label="Última rejeição" value={stats.lastEvent?.timestamp ?? "--"} sub={`${stats.lastEvent?.metal_type === "ferroso" ? "Ferroso" : "Não ferroso"} · ${stats.lastEvent?.size_mm}mm`} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="col-span-2 border border-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-black uppercase tracking-wide">
              Produção x Rejeições — {showFull ? "24h" : "Últimas 8h"}
            </p>
            <button onClick={() => setShowFull(f => !f)}
              className="text-[10px] px-2 py-1 bg-gray-100 text-gray-500 rounded-md hover:bg-gray-200 transition-colors">
              {showFull ? "Resumir" : "Expandir 24h"}
            </button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyDisplay} barGap={4}>
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#ef4444" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "0.5px solid #e5e7eb" }} />
              <Bar yAxisId="left" dataKey="produced" fill="#0ccf57" radius={[4, 4, 0, 0]} name="Produção" />
              <Bar yAxisId="right" dataKey="rejected" fill="#ef4444" radius={[4, 4, 0, 0]} name="Rejeições" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-bold text-black uppercase tracking-wide mb-3">Últimas rejeições</p>
          <RejectionList events={events} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-bold text-black uppercase tracking-wide mb-3">Por turno</p>
          {Object.entries(stats.shifts).map(([shift, count]) => {
            const max = Math.max(...Object.values(stats.shifts))
            const pct = max > 0 ? (count / max) * 100 : 0
            const colors: Record<string, string> = { manha: "bg-emerald-400", tarde: "bg-amber-400", noite: "bg-blue-400" }
            const labels: Record<string, string> = { manha: "Manhã", tarde: "Tarde", noite: "Noite" }
            return (
              <div key={shift} className="flex items-center gap-2 mb-2">
                <span className="text-xs text-black font-bold w-10">{labels[shift]}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${colors[shift]}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-medium text-gray-700 w-4">{count}</span>
              </div>
            )
          })}
          <p className="text-xs font-bold text-black uppercase tracking-wide mt-4 mb-3">Tipo de metal</p>
          <div className="flex justify-center">
            <PieChart width={120} height={100}>
              <Pie data={pieData} cx={60} cy={50} innerRadius={30} outerRadius={45} dataKey="value" strokeWidth={0}>
                <Cell fill="#ef4444" /><Cell fill="#f59e0b" />
              </Pie>
              <Tooltip
                formatter={(value: any, name: any) => {
                  const numeric = Number(value ?? 0)
                  return [`${numeric.toLocaleString("pt-BR")} unidades`, String(name ?? "")]
                }}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "0.5px solid #e5e7eb", backgroundColor: "#fff" }}
              />
            </PieChart>
          </div>
          <div className="flex gap-3 justify-center mt-1">
            <span className="flex items-center gap-1 text-xs text-black font-bold"><span className="w-2 h-2 rounded-sm bg-red-400" />Ferroso</span>
            <span className="flex items-center gap-1 text-xs text-black font-bold"><span className="w-2 h-2 rounded-sm bg-amber-400" />Não ferroso</span>
          </div>
        </div>

        <div className="col-span-2 border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-bold text-black uppercase tracking-wide mb-3">Alertas do sistema</p>
          <div className="flex flex-col gap-2">
            {alertas.map((a, i) => (
              <div key={i} className={`flex gap-2 px-3 py-2 rounded-lg text-xs
                ${a.type === "danger" ? "bg-red-50" : a.type === "warn" ? "bg-amber-50" : "bg-emerald-50"}`}>
                <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0
                  ${a.type === "danger" ? "bg-red-400" : a.type === "warn" ? "bg-amber-400" : "bg-emerald-400"}`} />
                <div>
                  <p className="text-gray-700">{a.msg}</p>
                  <p className="text-black font-bold mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Equipamentos */}
      <div className="border border-gray-100 rounded-xl p-4 mb-4">
        <p className="text-xs font-bold text-black uppercase tracking-wide mb-3">Equipamentos industriais</p>
        <div className="grid grid-cols-3 gap-2">
          {equipamentos.map(eq => (
            <EquipamentoCard key={eq.id} equipamento={eq} onToggle={toggleEquipamento} />
          ))}
        </div>
      </div>

      {/* Tabela rejeições */}
      <div className="border border-gray-100 rounded-xl p-4 mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <p className="text-xs font-bold text-black uppercase tracking-wide">Todas as rejeições registradas</p>
          <div className="flex gap-2 text-xs">
            <div className="rounded-md bg-gray-100 px-2 py-1">Total: <span className="font-semibold">{events.length}</span></div>
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
                <th className="px-2 py-2 border-b border-gray-200">Tamanho</th>
                <th className="px-2 py-2 border-b border-gray-200">Turno</th>
                <th className="px-2 py-2 border-b border-gray-200">Lote</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, i) => (
                <tr key={event.id ?? i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-2 py-2">{event.timestamp}</td>
                  <td className="px-2 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${event.metal_type === "ferroso" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {event.metal_type === "ferroso" ? "Ferroso" : "Não ferroso"}
                    </span>
                  </td>
                  <td className="px-2 py-2">{event.size_mm?.toFixed(1)}mm</td>
                  <td className="px-2 py-2">{event.shift === "manha" ? "Manhã" : event.shift === "tarde" ? "Tarde" : "Noite"}</td>
                  <td className="px-2 py-2">{event.lot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-300">Sistema ANVISA-ready · Grand Prix SENAI 2024</p>
        <button onClick={simular} disabled={simulating || paused}
          className="text-xs px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
          {simulating ? "Simulando..." : "Simular detecção"}
        </button>
      </div>
    </div>
  )
}