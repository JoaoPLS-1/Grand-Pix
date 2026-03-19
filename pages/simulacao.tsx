import { useEffect, useState, useRef } from "react"

interface Equipamento {
    id: string
    nome: string
    status: "ativo" | "falha"
}

interface Produto {
    id: number
    x: number
    contaminado: boolean
    detectado: boolean
    contado: boolean
    passouSemRejeitar: boolean
    destino?: "descarte" | "reprocesso" | "laboratorio"
}

interface ProdutoDescartado {
    id: number
    destino: "descarte" | "reprocesso" | "laboratorio"
    tamanho: string
    timestamp: string
}

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
        await fetch("/api/equipamentos", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status }),
        })
        await fetchEquipamentos()
    }

    useEffect(() => {
        fetchEquipamentos()
        const interval = setInterval(fetchEquipamentos, 3000)
        return () => clearInterval(interval)
    }, [])

    const getStatus = (nome: string) =>
        equipsRef.current.find(e => e.nome === nome)?.status === "ativo"

    useEffect(() => {
        velocidadeRef.current = velocidade
    }, [velocidade])

    // // Spawn de produtos
const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)

useEffect(() => {
  if (spawnRef.current) clearInterval(spawnRef.current)
  
  spawnRef.current = setInterval(() => {
    if (pausedRef.current) return
    if (!getStatus("Esteira principal")) return
    if (!getStatus("Sensor de presença")) return

    idRef.current++
    const contaminado = Math.random() < 0.08
    setProdutos(prev => [...prev, {
      id: idRef.current,
      x: 0,
      contaminado,
      detectado: false,
      contado: false,
      passouSemRejeitar: false,
    }])
  }, SPAWN_INTERVAL[velocidadeRef.current])

  return () => {
    if (spawnRef.current) clearInterval(spawnRef.current)
  }
}, [])

// Movimento
const moveRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
          if (pistaoOk) {
            setPistaoVisu(true)
            setTimeout(() => setPistaoVisu(false), 400)
          }
        }

        if (p.contaminado && novoDetectado && pistaoOk && newX >= 64) {
          atualizado.push({ ...p, x: newX, detectado: novoDetectado, contado: true })
          setTotalRejeitados(r => r + 1)
          const rand = Math.random()
          const destino: "descarte" | "reprocesso" | "laboratorio" =
            rand < 0.7 ? "descarte" : rand < 0.9 ? "reprocesso" : "laboratorio"
          const tamanhos = ["0.3mm", "0.4mm", "0.5mm", "0.8mm", "1.2mm"]
          setDescartados(d => [{
            id: p.id,
            destino,
            tamanho: tamanhos[Math.floor(Math.random() * tamanhos.length)],
            timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          }, ...d].slice(0, 10))
          continue
        }

        if (newX >= 100) {
          if (!p.contaminado) {
            setTotalAprovados(a => a + 1)
          } else {
            setContaminadosPassaram(c => c + 1)
          }
          continue
        }

        atualizado.push({
          ...p,
          x: newX,
          detectado: novoDetectado,
          contado: false,
          passouSemRejeitar: p.passouSemRejeitar,
        })
      }

      return atualizado
    })
  }, 50)

  return () => {
    if (moveRef.current) clearInterval(moveRef.current)
  }
}, [])



    const esteiraAtiva = equipamentos.find(e => e.nome === "Esteira principal")?.status === "ativo"
    const detectorAtivo = equipamentos.find(e => e.nome === "Detector de metais")?.status === "ativo"
    const pistaoAtivo = equipamentos.find(e => e.nome === "Pistão de rejeição")?.status === "ativo"
    const hayFalha = equipamentos.some(e => e.status === "falha")

    const destinoConfig = {
        descarte: { label: "Descarte", color: "bg-red-100 text-red-700" },
        reprocesso: { label: "Reprocesso", color: "bg-amber-100 text-amber-700" },
        laboratorio: { label: "Laboratório", color: "bg-blue-100 text-blue-700" },
    }

    return (
        <div className="max-w-5xl mx-auto p-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-base font-medium text-gray-900">Simulação da linha de produção</h1>
                    <p className="text-xs text-gray-400 mt-0.5">
                        ~{velocidade === "lento" ? "13" : velocidade === "normal" ? "21" : "35"} doces/min ·
                        Velocidade: {velocidade}
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    {hayFalha && (
                        <span className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Falha detectada
                        </span>
                    )}
                    <button onClick={() => setPaused(p => !p)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors
              ${paused ? "border-amber-300 text-amber-700 bg-amber-50" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                        {paused ? "▶ Retomar" : "⏸ Pausar"}
                    </button>
                </div>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Aprovados</p>
                    <p className="text-2xl font-medium text-emerald-600">{totalAprovados}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Rejeitados</p>
                    <p className="text-2xl font-medium text-red-600">{totalRejeitados}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Contaminados que passaram</p>
                    <p className={`text-2xl font-medium ${contaminadosPassaram > 0 ? "text-red-700" : "text-gray-400"}`}>
                        {contaminadosPassaram}
                    </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Taxa de rejeição</p>
                    <p className="text-2xl font-medium text-amber-600">
                        {totalAprovados + totalRejeitados + contaminadosPassaram > 0
                            ? (((totalRejeitados + contaminadosPassaram) /
                                (totalAprovados + totalRejeitados + contaminadosPassaram)) * 100).toFixed(1)
                            : "0.0"}%
                    </p>
                </div>
            </div>

            {/* Controle de velocidade */}
            <div className="border border-gray-100 rounded-xl p-4 mb-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Velocidade da esteira</p>
                <div className="flex gap-2">
                    {(["lento", "normal", "rapido"] as const).map(v => (
                        <button key={v} onClick={() => setVelocidade(v)}
                            className={`text-xs px-4 py-2 rounded-lg border transition-colors capitalize
                ${velocidade === v ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                            {v === "lento" ? "Lento (~13/min)" : v === "normal" ? "Normal (~21/min)" : "Rápido (~35/min)"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Esteira visual */}
            <div className={`border rounded-xl p-5 mb-4 relative
        ${!esteiraAtiva ? "border-red-200 bg-red-50" : "border-gray-100"}`}>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-6">Linha de produção</p>

                {!esteiraAtiva && (
                    <div className="absolute inset-0 bg-red-50 bg-opacity-90 flex items-center justify-center z-10 rounded-xl">
                        <p className="text-red-600 font-medium text-sm">Esteira parada</p>
                    </div>
                )}

                {/* Labels acima */}
                <div className="relative mb-1" style={{ height: "16px" }}>
                    <span className="absolute left-0 text-[9px] text-gray-400 uppercase tracking-wide">Entrada</span>
                    <span className="absolute text-[9px] uppercase tracking-wide"
                        style={{ left: "54%", color: detectorAtivo ? "#93c5fd" : "#9ca3af" }}>
                        Detector{!detectorAtivo ? " (off)" : ""}
                    </span>
                    <span className="absolute text-[9px] text-gray-400 uppercase tracking-wide" style={{ left: "65%" }}>
                        Pistão{!pistaoAtivo ? " (falha)" : ""}
                    </span>
                    <span className="absolute right-0 text-[9px] text-gray-400 uppercase tracking-wide">Saída</span>
                </div>

                {/* Trilho */}
                <div className="relative h-16 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">

                    {/* Zona detector */}
                    <div className={`absolute top-0 bottom-0 w-6 transition-colors
            ${detectorAtivo ? "bg-blue-100 border-x border-blue-200" : "bg-gray-200 border-x border-gray-300"}`}
                        style={{ left: "55%" }} />

                    {/* Pistão visual */}
                    <div className={`absolute top-0 bottom-0 transition-all duration-200
            ${pistaoVisu && pistaoAtivo ? "w-3 bg-red-400" : "w-0.5 bg-gray-300"}`}
                        style={{ left: "66%" }} />

                    {/* Caixa de descarte */}
                    <div className={`absolute right-2 top-1 bottom-1 w-8 rounded border flex items-center justify-center
            ${totalRejeitados > 0 ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
                        <span className="text-[8px] text-gray-400 text-center leading-tight">caixa<br />descarte</span>
                    </div>

                    {/* Produtos */}
                    {produtos.map(p => {
                        const isRejeitandoAgora = p.contaminado && p.detectado && pistaoAtivo
                        const isContaminadoPassando = p.contaminado && (!detectorAtivo || !pistaoAtivo)
                        return (
                            <div key={p.id}
                                className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center text-[8px] font-bold
                  ${isRejeitandoAgora ? "bg-red-500 text-white" :
                                        isContaminadoPassando ? "bg-orange-400 text-white" :
                                            p.contaminado ? "bg-amber-300 text-white" :
                                                "bg-emerald-400 text-white"}`}
                                style={{ left: `calc(${p.x}% - 12px)`, transition: "left 0.05s linear" }}>
                                {p.contaminado ? "✕" : "✓"}
                            </div>
                        )
                    })}

                    {/* Trilho base */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-300" />
                </div>

                {/* Legenda */}
                <div className="flex flex-wrap gap-3 mt-4">
                    <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-3 h-3 rounded bg-emerald-400" />Aprovado</span>
                    <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-3 h-3 rounded bg-amber-300" />Contaminado (detector inativo)</span>
                    <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-3 h-3 rounded bg-orange-400" />Contaminado passando (pistão em falha)</span>
                    <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-3 h-3 rounded bg-red-500" />Sendo rejeitado</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">

                {/* Descartados */}
                <div className="border border-gray-100 rounded-xl p-4">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                        Produtos rejeitados — destino
                    </p>
                    {descartados.length === 0 ? (
                        <p className="text-xs text-gray-300 text-center py-4">Nenhum produto rejeitado ainda</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {descartados.map((d, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${destinoConfig[d.destino].color}`}>
                                            {destinoConfig[d.destino].label}
                                        </span>
                                        <span className="text-gray-500">{d.tamanho}</span>
                                    </div>
                                    <span className="text-gray-300">{d.timestamp}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex gap-3 text-xs text-gray-400">
                        <span>Descarte: <strong className="text-red-600">{descartados.filter(d => d.destino === "descarte").length}</strong></span>
                        <span>Reprocesso: <strong className="text-amber-600">{descartados.filter(d => d.destino === "reprocesso").length}</strong></span>
                        <span>Lab: <strong className="text-blue-600">{descartados.filter(d => d.destino === "laboratorio").length}</strong></span>
                    </div>
                </div>

                {/* Contaminados que passaram */}
                <div className={`border rounded-xl p-4 ${contaminadosPassaram > 0 ? "border-red-200 bg-red-50" : "border-gray-100"}`}>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                        Contaminados que passaram
                    </p>
                    {contaminadosPassaram === 0 ? (
                        <div className="flex items-center justify-center h-16">
                            <p className="text-xs text-gray-300">Nenhum contaminado passou</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-16 gap-1">
                            <p className="text-4xl font-medium text-red-600">{contaminadosPassaram}</p>
                            <p className="text-xs text-red-400">produto(s) contaminado(s) na saída</p>
                        </div>
                    )}
                    {!pistaoAtivo && (
                        <div className="mt-3 pt-3 border-t border-red-200">
                            <p className="text-[10px] text-red-500">Pistão em falha — produtos contaminados estão passando sem rejeição</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Equipamentos */}
            <div className="border border-gray-100 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                    Equipamentos — clique para alternar
                </p>
                <div className="grid grid-cols-3 gap-2">
                    {equipamentos.map(eq => (
                        <button key={eq.id}
                            onClick={() => toggleEquipamento(eq.id, eq.status === "ativo" ? "falha" : "ativo")}
                            className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all
                ${eq.status === "ativo"
                                    ? "border-gray-100 hover:border-red-200 hover:bg-red-50"
                                    : "border-red-200 bg-red-50 hover:border-emerald-200 hover:bg-emerald-50"}`}>
                            <span className={`w-2 h-2 rounded-full flex-shrink-0
                ${eq.status === "ativo" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                            <div>
                                <p className="text-xs font-medium text-gray-700">{eq.nome}</p>
                                <p className={`text-[10px] ${eq.status === "ativo" ? "text-emerald-600" : "text-red-600"}`}>
                                    {eq.status === "ativo" ? "Ativo" : "Falha"}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}