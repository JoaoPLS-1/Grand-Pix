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

interface AmostraLab {
    id: string
    created_at: string
    metal_type: string
    size_mm: number
    lot: string
    shift: string
    status: "em_analise" | "concluida" | "pendente"
    resultado?: string
    observacoes?: string
}

interface LabData {
    amostras: AmostraLab[]
    totalRejeicoes: number
    amostrasEsperadas: number
    totalAmostras: number
}

export default function Analise() {
    const [periodo, setPeriodo] = useState("7")
    const [data, setData] = useState<HistoricoData | null>(null)
    const [labData, setLabData] = useState<LabData | null>(null)
    const [loading, setLoading] = useState(false)
    const [labLoading, setLabLoading] = useState(false)

    async function fetchHistorico(p: string) {
        setLoading(true)
        const res = await fetch(`/api/historico?periodo=${p}`)
        setData(await res.json())
        setLoading(false)
    }

    async function fetchLab() {
        setLabLoading(true)
        const res = await fetch("/api/laboratorio")
        setLabData(await res.json())
        setLabLoading(false)
    }

    useEffect(() => {
        fetchHistorico(periodo)
        fetchLab()
    }, [periodo])

    const loteData = data
        ? Object.entries(data.porLote).map(([lot, count]) => ({ lot, count }))
        : []

    const amostras = labData?.amostras ?? []
    const consistente = labData
        ? labData.totalAmostras === labData.amostrasEsperadas
        : true

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
                        {/* KPI Cards */}
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

                        {/* Gráfico por lote */}
                        {loteData.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <h2 className="text-sm font-semibold text-gray-800 mb-1">Rejeições por lote</h2>
                                <p className="text-xs text-gray-400 mb-5">Distribuição por lote de produção</p>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={loteData} barCategoryGap="50%" style={{ background: "transparent" }}>
                                        <XAxis dataKey="lot" tick={{ fontSize: 11, fill: "#cc0606" }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: "#cc0606" }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #f0f0f0" }}
                                            formatter={(value: any) => [value, "Rejeições"]}
                                        />
                                        <Bar
                                            dataKey="count"
                                            fill="#cc0606"
                                            stroke="none"
                                            radius={[6, 6, 0, 0]}
                                            name="Rejeições"
                                            isAnimationActive={false}
                                            label={{ position: "top", fontSize: 12, fontWeight: 700, fill: "#cc0606" }}
                                            activeBar={{ fill: "#cc0606", stroke: "none" }}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Amostras laboratoriais */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-800">Amostras enviadas ao laboratório</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        1 amostra a cada 20 rejeições · seleção baseada em rejeições reais · tipos alternados
                                    </p>
                                </div>
                                <button onClick={fetchLab} disabled={labLoading}
                                    className="text-[11px] font-medium px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40">
                                    {labLoading ? "Sincronizando..." : "↻ Sincronizar"}
                                </button>
                            </div>

                            {/* Barra de consistência */}
                            {labData && (
                                <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl mb-4 text-xs font-medium
                  ${consistente ? "bg-emerald-50 border border-emerald-100" : "bg-amber-50 border border-amber-100"}`}>
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${consistente ? "bg-emerald-500" : "bg-amber-500"}`} />
                                    <span className={consistente ? "text-emerald-700" : "text-amber-700"}>
                                        {labData.totalRejeicoes} rejeições registradas →
                                        {labData.amostrasEsperadas} amostras esperadas ·
                                        {labData.totalAmostras} no banco
                                        {consistente ? " · consistente" : " · divergência detectada, clique em sincronizar"}
                                    </span>
                                </div>
                            )}

                            <div className="flex gap-2 text-[11px] mb-4">
                                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg font-medium">
                                    Total: {amostras.length}
                                </span>
                                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg font-medium">
                                    Em análise: {amostras.filter(a => a.status === "em_analise").length}
                                </span>
                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg font-medium">
                                    Concluídas: {amostras.filter(a => a.status === "concluida").length}
                                </span>
                                <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-100 rounded-lg font-medium">
                                    Fe: {amostras.filter(a => a.metal_type === "ferroso").length}
                                </span>
                                <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg font-medium">
                                    NF: {amostras.filter(a => a.metal_type === "nao_ferroso").length}
                                </span>
                            </div>

                            {labLoading ? (
                                <div className="flex items-center justify-center py-10">
                                    <div className="w-6 h-6 border-2 border-[#16c784] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : amostras.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-3">
                                        <span className="text-xl">🔬</span>
                                    </div>
                                    <p className="text-sm text-gray-400 font-medium">Nenhuma amostra ainda</p>
                                    <p className="text-xs text-gray-300 mt-1">
                                        São necessárias 20 rejeições para gerar a primeira amostra
                                        {labData && labData.totalRejeicoes > 0 && ` · faltam ${20 - (labData.totalRejeicoes % 20)} rejeições`}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Resumo */}
                                    <div className="grid grid-cols-3 gap-3 mb-5">
                                        {[
                                            { label: "Ferrosos enviados", value: amostras.filter(a => a.metal_type === "ferroso").length, color: "text-red-600", bg: "bg-red-50 border-red-100" },
                                            { label: "Não ferrosos enviados", value: amostras.filter(a => a.metal_type === "nao_ferroso").length, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
                                            {
                                                label: "Tamanho médio",
                                                value: `${(amostras.reduce((a, b) => a + b.size_mm, 0) / amostras.length).toFixed(2)}mm`,
                                                color: "text-blue-600",
                                                bg: "bg-blue-50 border-blue-100"
                                            },
                                        ].map((card, i) => (
                                            <div key={i} className={`rounded-xl border p-4 ${card.bg}`}>
                                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">{card.label}</p>
                                                <p className={`text-2xl font-semibold ${card.color}`}>{card.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Tabela */}
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-gray-100">
                                                    {["#", "Data/Hora", "Tipo", "Tamanho", "Lote", "Turno", "Status"].map(h => (
                                                        <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest pb-3 px-3">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {amostras.map((a, i) => (
                                                    <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                        <td className="px-3 py-3 text-gray-300 font-mono text-[10px]">{amostras.length - i}</td>
                                                        <td className="px-3 py-3 text-gray-600 font-mono">{new Date(a.created_at).toLocaleString("pt-BR")}</td>
                                                        <td className="px-3 py-3">
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold
                                ${a.metal_type === "ferroso" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                                                {a.metal_type === "ferroso" ? "Ferroso" : "Não ferroso"}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-3 text-gray-500 font-mono">{a.size_mm?.toFixed(1)}mm</td>
                                                        <td className="px-3 py-3 text-gray-400 font-mono">{a.lot}</td>
                                                        <td className="px-3 py-3 text-gray-500">
                                                            {a.shift === "manha" ? "Manhã" : a.shift === "tarde" ? "Tarde" : "Noite"}
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold
                                ${a.status === "em_analise" ? "bg-blue-100 text-blue-700" :
                                                                    a.status === "concluida" ? "bg-emerald-100 text-emerald-700" :
                                                                        "bg-gray-100 text-gray-500"}`}>
                                                                {a.status === "em_analise" ? "Em análise" :
                                                                    a.status === "concluida" ? "Concluída" : "Pendente"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Tabela de eventos */}
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
                                                    <td className="px-3 py-3 text-gray-500">
                                                        {e.shift === "manha" ? "Manhã" : e.shift === "tarde" ? "Tarde" : "Noite"}
                                                    </td>
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