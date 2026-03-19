import { useEffect, useState, useRef } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import MetricCard from "../pages/components/MetricCard"
import RejectionList from "../pages/components/RejectionList"
import EquipamentoCard from "../pages/components/EquipamentoCard"
import { DetectionEvent } from "../pages/lib/mock-data"
import { gerarAlertas } from "../pages/lib/alerts"

interface Stats {
  totalProduced: number
  totalRejected: number
  contaminadosPassaram: number
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
    const interval = setInterval(() => { if (!pausedRef.current) fetchData() }, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  async function simular() {
    setSimulating(true)
    await fetch("/api/simulate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantidade: 21, pistaoAtivo: true }) })
    await fetchData()
    setSimulating(false)
  }

  async function toggleEquipamento(id: string, status: string) {
    await fetch("/api/equipamentos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) })
    await fetchData()
  }

  const hayFalha = equipamentos.some(e => e.status === "falha")

  if (!stats) return (
    <div className="flex items-center justify-center h-screen bg-[#f5f6fa]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#16c784] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Carregando sistema...</p>
      </div>
    </div>
  )

  const alertas = gerarAlertas(events)
  const pieData = [{ name: "Ferroso", value: stats.ferroso }, { name: "Não ferroso", value: stats.naoFerroso }]
  const hourlyDisplay = showFull ? stats.hourly : stats.hourly.filter(h => h.produced > 0 || h.rejected > 0).slice(-8)

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5">Monitoramento em tempo real · atualiza a cada 5s {paused ? "· pausado" : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            {hayFalha && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Equipamento em falha
              </div>
            )}
            <button onClick={() => setPaused(p => !p)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all
                ${paused ? "border-amber-200 text-amber-700 bg-amber-50" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
              {paused ? "▶ Retomar" : "⏸ Pausar"}
            </button>
            {!paused && (esteiraAtiva
              ? <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Linha operando
              </div>
              : <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Linha parada
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-6 space-y-5">

        {/* KPI Cards */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Produção hoje", value: stats.totalProduced.toLocaleString("pt-BR"), sub: "unidades aprovadas", accent: "#16c784", textColor: "text-emerald-600" },
            { label: "Rejeições", value: stats.totalRejected, sub: "produtos rejeitados", accent: "#ef4444", textColor: "text-red-600" },
            { label: "Taxa de rejeição", value: `${stats.rejectionRate}%`, sub: "limite ANVISA: 0%", accent: "#f59e0b", textColor: "text-amber-600" },
            { label: "Contaminados passaram", value: stats.contaminadosPassaram, sub: "risco à saúde", accent: stats.contaminadosPassaram > 0 ? "#ef4444" : "#e5e7eb", textColor: stats.contaminadosPassaram > 0 ? "text-red-600" : "text-gray-400" },
            { label: "Última rejeição", value: stats.lastEvent?.timestamp ?? "--", sub: `${stats.lastEvent?.metal_type === "ferroso" ? "Ferroso" : "Não ferroso"} · ${stats.lastEvent?.size_mm}mm`, accent: "#e5e7eb", textColor: "text-gray-800" },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: card.accent }} />
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">{card.label}</p>
              <p className={`text-[26px] font-semibold tracking-tight leading-none ${card.textColor}`}>{card.value}</p>
              <p className="text-[11px] text-gray-400 mt-2">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        {/* Charts row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Produção x Rejeições</h2>
                <p className="text-xs text-gray-400 mt-0.5">{showFull ? "Visão completa 24h" : "Últimas 8 horas"}</p>
              </div>
              <button onClick={() => setShowFull(f => !f)}
                className="text-[11px] font-medium px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors">
                {showFull ? "Resumir" : "Ver 24h"}
              </button>
            </div>

            {/* Scroll horizontal apenas no modo 24h */}
            <div className={showFull ? "overflow-x-auto" : ""}>
              <div style={{ minWidth: showFull ? "900px" : "100%", width: "100%" }}>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart
                    data={hourlyDisplay}
                    barGap={2}
                    barCategoryGap={showFull ? "20%" : "35%"}
                    margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: showFull ? 10 : 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#fca5a5" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #f0f0f0", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", padding: "8px 12px" }}
                      cursor={{ fill: "rgba(0,0,0,0.02)" }}
                    />
                    <Bar yAxisId="left" dataKey="produced" fill="#16c784" radius={[5, 5, 0, 0]} name="Produção" />
                    <Bar yAxisId="right" dataKey="rejected" fill="#ef4444" radius={[5, 5, 0, 0]} name="Rejeições" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex gap-4 mt-3 justify-end">
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400"><span className="w-2.5 h-2.5 rounded-sm bg-[#16c784]" />Produção</span>
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400"><span className="w-2.5 h-2.5 rounded-sm bg-red-400" />Rejeições</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-1">Últimas rejeições</h2>
            <p className="text-xs text-gray-400 mb-4">Eventos mais recentes</p>
            <RejectionList events={events} />
          </div>
        </div>

        {/* Third row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Distribuição</h2>

            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Por turno</p>
            {Object.entries(stats.shifts).map(([shift, count]) => {
              const max = Math.max(...Object.values(stats.shifts), 1)
              const pct = (count / max) * 100
              const cfg: Record<string, { color: string; label: string }> = {
                manha: { color: "bg-emerald-400", label: "Manhã" },
                tarde: { color: "bg-amber-400", label: "Tarde" },
                noite: { color: "bg-blue-400", label: "Noite" },
              }
              return (
                <div key={shift} className="mb-3">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[12px] text-gray-500">{cfg[shift].label}</span>
                    <span className="text-[12px] font-semibold text-gray-700">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${cfg[shift].color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}

            <div className="border-t border-gray-100 mt-4 pt-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Tipo de metal</p>
              <div className="flex items-center gap-4">
                <PieChart width={90} height={90}>
                  <Pie data={pieData} cx={45} cy={45} innerRadius={24} outerRadius={38} dataKey="value" strokeWidth={0}
                    onMouseEnter={(_, i) => setActiveMetalIndex(i)}
                    onMouseLeave={() => setActiveMetalIndex(null)}>
                    <Cell fill={activeMetalIndex === 0 ? "#dc2626" : "#ef4444"} />
                    <Cell fill={activeMetalIndex === 1 ? "#d97706" : "#f59e0b"} />
                  </Pie>
                </PieChart>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-red-400 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-gray-500">Ferroso</p>
                      <p className="text-sm font-semibold text-gray-800">{stats.ferroso}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-gray-500">Não ferroso</p>
                      <p className="text-sm font-semibold text-gray-800">{stats.naoFerroso}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-1">Alertas do sistema</h2>
            <p className="text-xs text-gray-400 mb-4">Gerados automaticamente com base nos eventos</p>
            <div className="flex flex-col gap-2">
              {alertas.map((a, i) => (
                <div key={i} className={`flex gap-3 px-4 py-3 rounded-xl text-xs
                  ${a.type === "danger" ? "bg-red-50 border border-red-100" : a.type === "warn" ? "bg-amber-50 border border-amber-100" : "bg-emerald-50 border border-emerald-100"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full mt-0.5 flex-shrink-0 ${a.type === "danger" ? "bg-red-500" : a.type === "warn" ? "bg-amber-500" : "bg-emerald-500"}`} />
                  <div>
                    <p className={`font-medium ${a.type === "danger" ? "text-red-800" : a.type === "warn" ? "text-amber-800" : "text-emerald-800"}`}>{a.msg}</p>
                    <p className="text-gray-400 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Equipamentos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Equipamentos industriais</h2>
              <p className="text-xs text-gray-400 mt-0.5">Status em tempo real</p>
            </div>
            {hayFalha && <span className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-full font-medium">{equipamentos.filter(e => e.status === "falha").length} em falha</span>}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {equipamentos.map(eq => <EquipamentoCard key={eq.id} equipamento={eq} onToggle={toggleEquipamento} />)}
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Todas as rejeições</h2>
              <p className="text-xs text-gray-400 mt-0.5">Registro completo do dia atual</p>
            </div>
            <div className="flex gap-2 text-[11px]">
              <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg font-medium">Total: {events.length}</span>
              <span className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 rounded-lg font-medium">Fe: {events.filter(e => e.metal_type === "ferroso").length}</span>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg font-medium">NF: {events.filter(e => e.metal_type === "nao_ferroso").length}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Hora", "Tipo", "Tamanho", "Turno", "Lote"].map(h => (
                    <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest pb-3 px-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((event, i) => (
                  <tr key={event.id ?? i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                    <td className="px-3 py-3 font-semibold text-gray-700 font-mono">{event.timestamp}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold
                        ${event.metal_type === "ferroso" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                        {event.metal_type === "ferroso" ? "Ferroso" : "Não ferroso"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-500 font-mono">{event.size_mm?.toFixed(1)}mm</td>
                    <td className="px-3 py-3 text-gray-500">{event.shift === "manha" ? "Manhã" : event.shift === "tarde" ? "Tarde" : "Noite"}</td>
                    <td className="px-3 py-3 text-gray-400 font-mono">{event.lot}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <p className="text-[11px] text-gray-300">Sistema ANVISA-ready · Grand Prix SENAI 2025</p>
          <button onClick={simular} disabled={simulating || paused}
            className="text-xs font-medium px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 transition-all shadow-sm">
            {simulating ? "Simulando..." : "Simular detecção"}
          </button>
        </div>
      </div>
    </div>
  )
}