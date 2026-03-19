import { useEffect, useState, useRef } from "react"

interface Equipamento { id: string; nome: string; status: "ativo" | "falha" }
interface Produto { id: number; x: number; contaminado: boolean; detectado: boolean; contado: boolean; passouSemRejeitar: boolean }
interface ProdutoDescartado { id: number; destino: "descarte" | "reprocesso" | "laboratorio"; tamanho: string; timestamp: string }

const VELOCIDADES = { lento: 0.7, normal: 1.4, rapido: 2.4 }
const SPAWN_INTERVAL = { lento: 4000, normal: 2200, rapido: 1200 }

export default function Simulacao() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [pistaoVisu, setPistaoVisu] = useState(false)
  const [totalAprovados, setTotalAprovados] = useState(0)
  const [totalRejeitados, setTotalRejeitados] = useState(0)
  const [contaminadosPassaram, setContaminadosPassaram] = useState(0)
  const [descartados, setDescartados] = useState<ProdutoDescartado[]>([])
  const [paused, setPaused] = useState(false)
  const [velocidade, setVelocidade] = useState<"lento" | "normal" | "rapido">("normal")
  const pausedRef = useRef(paused)
  const velocidadeRef = useRef(velocidade)
  const equipsRef = useRef<Equipamento[]>([])
  const idRef = useRef(0)
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const moveRef = useRef<ReturnType<typeof setInterval> | null>(null)
  pausedRef.current = paused
  velocidadeRef.current = velocidade

  async function fetchEquipamentos() {
    const res = await fetch("/api/equipamentos")
    const data = await res.json()
    const list = Array.isArray(data) ? data : []
    setEquipamentos(list)
    equipsRef.current = list
  }

  async function toggleEquipamento(id: string, status: string) {
    await fetch("/api/equipamentos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) })
    await fetchEquipamentos()
  }

  useEffect(() => {
    fetchEquipamentos()
    const interval = setInterval(fetchEquipamentos, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => { velocidadeRef.current = velocidade }, [velocidade])

  const getStatus = (nome: string) => equipsRef.current.find(e => e.nome === nome)?.status === "ativo"

  useEffect(() => {
    if (spawnRef.current) clearInterval(spawnRef.current)
    spawnRef.current = setInterval(() => {
      if (pausedRef.current || !getStatus("Esteira principal") || !getStatus("Sensor de presença")) return
      idRef.current++
      setProdutos(prev => [...prev, { id: idRef.current, x: 0, contaminado: Math.random() < 0.08, detectado: false, contado: false, passouSemRejeitar: false }])
    }, SPAWN_INTERVAL[velocidadeRef.current])
    return () => { if (spawnRef.current) clearInterval(spawnRef.current) }
  }, [equipamentos, velocidade])

  useEffect(() => {
    if (moveRef.current) clearInterval(moveRef.current)
    moveRef.current = setInterval(() => {
      if (pausedRef.current) return
      const vel = VELOCIDADES[velocidadeRef.current] * (getStatus("Sensor de velocidade") ? 1 : 0.6)
      const pistaoOk = getStatus("Pistão de rejeição")
      const detectorOk = getStatus("Detector de metais")
      setProdutos(prev => {
        const atualizado: Produto[] = []
        for (const p of prev) {
          if (p.contado) continue
          const newX = p.x + vel
          let novoDetectado = p.detectado
          if (detectorOk && newX >= 54 && newX < 60 && p.contaminado && !p.detectado) {
            novoDetectado = true
            if (pistaoOk) { setPistaoVisu(true); setTimeout(() => setPistaoVisu(false), 400) }
          }
          if (p.contaminado && novoDetectado && pistaoOk && newX >= 64) {
            atualizado.push({ ...p, x: newX, detectado: novoDetectado, contado: true })
            setTotalRejeitados(r => r + 1)
            const rand = Math.random()
            const destino: "descarte" | "reprocesso" | "laboratorio" = rand < 0.7 ? "descarte" : rand < 0.9 ? "reprocesso" : "laboratorio"
            const tamanhos = ["0.3mm", "0.4mm", "0.5mm", "0.8mm", "1.2mm"]
            setDescartados(d => [{ id: p.id, destino, tamanho: tamanhos[Math.floor(Math.random() * tamanhos.length)], timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }, ...d].slice(0, 10))
            continue
          }
          if (newX >= 100) {
            if (!p.contaminado) setTotalAprovados(a => a + 1)
            else setContaminadosPassaram(c => c + 1)
            continue
          }
          atualizado.push({ ...p, x: newX, detectado: novoDetectado, contado: false, passouSemRejeitar: p.passouSemRejeitar })
        }
        return atualizado
      })
    }, 50)
    return () => { if (moveRef.current) clearInterval(moveRef.current) }
  }, [])

  const esteiraAtiva = equipamentos.find(e => e.nome === "Esteira principal")?.status === "ativo"
  const detectorAtivo = equipamentos.find(e => e.nome === "Detector de metais")?.status === "ativo"
  const pistaoAtivo = equipamentos.find(e => e.nome === "Pistão de rejeição")?.status === "ativo"
  const hayFalha = equipamentos.some(e => e.status === "falha")

  const destinoConfig = {
    descarte: { label: "Descarte", color: "bg-red-100 text-red-700 border-red-200" },
    reprocesso: { label: "Reprocesso", color: "bg-amber-100 text-amber-700 border-amber-200" },
    laboratorio: { label: "Laboratório", color: "bg-blue-100 text-blue-700 border-blue-200" },
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Simulação da linha</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              ~{velocidade === "lento" ? "13" : velocidade === "normal" ? "21" : "35"} doces/min · velocidade {velocidade}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hayFalha && <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Falha detectada</div>}
            <button onClick={() => setPaused(p => !p)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all
                ${paused ? "border-amber-200 text-amber-700 bg-amber-50" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
              {paused ? "▶ Retomar" : "⏸ Pausar"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-6 space-y-5">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Aprovados", value: totalAprovados, color: "text-emerald-600", accent: "#16c784" },
            { label: "Rejeitados", value: totalRejeitados, color: "text-red-600", accent: "#ef4444" },
            { label: "Contaminados passaram", value: contaminadosPassaram, color: contaminadosPassaram > 0 ? "text-red-700" : "text-gray-400", accent: contaminadosPassaram > 0 ? "#ef4444" : "#e5e7eb" },
            { label: "Taxa de rejeição", value: `${totalAprovados + totalRejeitados + contaminadosPassaram > 0 ? (((totalRejeitados + contaminadosPassaram) / (totalAprovados + totalRejeitados + contaminadosPassaram)) * 100).toFixed(1) : "0.0"}%`, color: "text-amber-600", accent: "#f59e0b" },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: card.accent }} />
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">{card.label}</p>
              <p className={`text-3xl font-semibold tracking-tight ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Velocidade */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Velocidade da esteira</h2>
          <div className="flex gap-2">
            {(["lento", "normal", "rapido"] as const).map(v => (
              <button key={v} onClick={() => setVelocidade(v)}
                className={`text-xs font-medium px-4 py-2.5 rounded-xl border transition-all
                  ${velocidade === v ? "bg-gray-900 text-white border-gray-900 shadow-sm" : "border-gray-200 text-gray-500 hover:bg-gray-50 bg-white"}`}>
                {v === "lento" ? "Lento · ~13/min" : v === "normal" ? "Normal · ~21/min" : "Rápido · ~35/min"}
              </button>
            ))}
          </div>
        </div>

        {/* Esteira */}
        <div className={`bg-white rounded-2xl border shadow-sm p-6 relative ${!esteiraAtiva ? "border-red-200" : "border-gray-100"}`}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Linha de produção</h2>
              <p className="text-xs text-gray-400 mt-0.5">Visualização em tempo real</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium ${detectorAtivo ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-gray-100 text-gray-400"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${detectorAtivo ? "bg-blue-500 animate-pulse" : "bg-gray-400"}`} /> Detector
              </span>
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium ${pistaoAtivo ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${pistaoAtivo ? "bg-emerald-500" : "bg-red-500"}`} /> Pistão
              </span>
            </div>
          </div>

          {!esteiraAtiva && (
            <div className="absolute inset-0 bg-red-50/90 flex items-center justify-center z-10 rounded-2xl">
              <div className="text-center">
                <p className="text-red-600 font-semibold">Esteira parada</p>
                <p className="text-red-400 text-xs mt-1">Equipamento em falha — verifique os equipamentos</p>
              </div>
            </div>
          )}

          {/* Labels */}
          <div className="flex justify-between text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">
            <span>Entrada</span>
            <span style={{ marginLeft: "45%" }}>Detector</span>
            <span>Saída</span>
          </div>

          {/* Trilho */}
          <div className="relative h-20 rounded-xl overflow-hidden border border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100">
            {/* Linhas de grade */}
            {[20, 40, 60, 80].map(p => (
              <div key={p} className="absolute top-0 bottom-0 w-px bg-gray-200/60" style={{ left: `${p}%` }} />
            ))}

            {/* Zona detector */}
            <div className={`absolute top-0 bottom-0 w-7 transition-all ${detectorAtivo ? "bg-blue-200/50 border-x border-blue-300/50" : "bg-gray-200/50 border-x border-gray-300/50"}`}
              style={{ left: "55%" }} />

            {/* Pistão */}
            <div className={`absolute top-0 bottom-0 transition-all duration-200 ${pistaoVisu && pistaoAtivo ? "w-4 bg-red-400/80" : "w-0.5 bg-gray-300/60"}`}
              style={{ left: "66%" }} />

            {/* Caixa descarte */}
            <div className={`absolute right-3 top-2 bottom-2 w-10 rounded-lg border flex items-center justify-center transition-all
              ${totalRejeitados > 0 ? "border-red-300 bg-red-50" : "border-gray-200 bg-white/60"}`}>
              <span className="text-[8px] text-gray-400 text-center leading-tight font-medium">Caixa<br/>descarte</span>
            </div>

            {/* Produtos */}
            {produtos.map(p => {
              const isRejeitando = p.contaminado && p.detectado && pistaoAtivo
              const isPassando = p.contaminado && (!detectorAtivo || !pistaoAtivo)
              return (
                <div key={p.id}
                  className={`absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold shadow-sm
                    ${isRejeitando ? "bg-red-500 text-white" : isPassando ? "bg-orange-400 text-white" : p.contaminado ? "bg-amber-300 text-white" : "bg-[#16c784] text-white"}`}
                  style={{ left: `calc(${p.x}% - 14px)`, transition: "left 0.05s linear" }}>
                  {p.contaminado ? "✕" : "✓"}
                </div>
              )
            })}

            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-300/60" />
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-4 mt-4">
            {[
              { color: "bg-[#16c784]", label: "Aprovado" },
              { color: "bg-amber-300", label: "Contaminado (detector off)" },
              { color: "bg-orange-400", label: "Passando (pistão em falha)" },
              { color: "bg-red-500", label: "Sendo rejeitado" },
            ].map(item => (
              <span key={item.label} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className={`w-3 h-3 rounded-md ${item.color}`} />{item.label}
              </span>
            ))}
          </div>
        </div>

        {/* Destino + Contaminados */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-1">Produtos rejeitados</h2>
            <p className="text-xs text-gray-400 mb-4">Destino após rejeição</p>
            {descartados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                <p className="text-xs">Nenhum produto rejeitado ainda</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {descartados.map((d, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${destinoConfig[d.destino].color}`}>
                        {destinoConfig[d.destino].label}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">{d.tamanho}</span>
                    </div>
                    <span className="text-[11px] text-gray-300">{d.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-gray-100 flex gap-4 text-[11px]">
              <span className="text-gray-400">Descarte: <strong className="text-red-600">{descartados.filter(d => d.destino === "descarte").length}</strong></span>
              <span className="text-gray-400">Reprocesso: <strong className="text-amber-600">{descartados.filter(d => d.destino === "reprocesso").length}</strong></span>
              <span className="text-gray-400">Lab: <strong className="text-blue-600">{descartados.filter(d => d.destino === "laboratorio").length}</strong></span>
            </div>
          </div>

          <div className={`rounded-2xl border shadow-sm p-6 ${contaminadosPassaram > 0 ? "bg-red-50 border-red-200" : "bg-white border-gray-100"}`}>
            <h2 className="text-sm font-semibold text-gray-800 mb-1">Contaminados que passaram</h2>
            <p className="text-xs text-gray-400 mb-4">Produtos com metal que chegaram à saída</p>
            <div className="flex flex-col items-center justify-center py-4">
              <p className={`text-5xl font-bold tracking-tight ${contaminadosPassaram > 0 ? "text-red-600" : "text-gray-200"}`}>
                {contaminadosPassaram}
              </p>
              {contaminadosPassaram > 0
                ? <p className="text-xs text-red-500 mt-2 font-medium">produto(s) contaminado(s) na saída</p>
                : <p className="text-xs text-gray-300 mt-2">Nenhum contaminado passou</p>
              }
            </div>
            {!pistaoAtivo && (
              <div className="mt-3 pt-3 border-t border-red-200">
                <p className="text-[11px] text-red-500 font-medium">⚠ Pistão em falha — rejeição desativada</p>
              </div>
            )}
          </div>
        </div>

        {/* Equipamentos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">Equipamentos</h2>
          <p className="text-xs text-gray-400 mb-4">Clique para alternar o status</p>
          <div className="grid grid-cols-3 gap-3">
            {equipamentos.map(eq => (
              <button key={eq.id} onClick={() => toggleEquipamento(eq.id, eq.status === "ativo" ? "falha" : "ativo")}
                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all
                  ${eq.status === "ativo" ? "bg-white border-gray-100 hover:border-red-200 hover:bg-red-50" : "bg-red-50 border-red-200 hover:border-emerald-200 hover:bg-emerald-50"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${eq.status === "ativo" ? "bg-emerald-50" : "bg-red-100"}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${eq.status === "ativo" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-gray-700">{eq.nome}</p>
                  <p className={`text-[10px] font-medium ${eq.status === "ativo" ? "text-emerald-600" : "text-red-600"}`}>
                    {eq.status === "ativo" ? "Ativo" : "Falha"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}