import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "../../lib/supabase"
import { mockHourly, mockShifts } from "../../lib/mock-data"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const today = new Date().toISOString().split("T")[0]

  // Busca eventos de hoje
  const { data: events } = await supabase
    .from("detection_events")
    .select("*")
    .gte("created_at", `${today}T00:00:00`)
    .order("created_at", { ascending: false })

  const allEvents = events ?? []
  const totalRejected = allEvents.filter((e: any) => e.rejected !== false).length
  const contaminadosPassaram = allEvents.filter((e: any) => e.rejected === false).length

  // Produção real: cada evento contaminado representa ~12 produtos normais
  // Taxa de contaminação é 8%, então: total_contaminados / 0.08 = total_produzido
  const totalContaminados = allEvents.length
  const totalProduced = totalContaminados > 0
    ? Math.round(totalContaminados / 0.08)
    : mockHourly.reduce((a, b) => a + b.produced, 0)

  const rejectionRate = totalProduced > 0
    ? ((totalRejected / totalProduced) * 100).toFixed(2)
    : "0.00"

  // Turnos reais
  const shifts = { manha: 0, tarde: 0, noite: 0 }
  allEvents.forEach((e: any) => {
    if (e.shift in shifts) shifts[e.shift as keyof typeof shifts]++
  })
  if (shifts.manha === 0 && shifts.tarde === 0 && shifts.noite === 0) {
    Object.assign(shifts, mockShifts)
  }

  // Hourly real — agrupa eventos por hora
  const hourlyMap: Record<string, { produced: number; rejected: number }> = {}

  // Inicializa todas as 24h zeradas
  Array.from({ length: 24 }, (_, i) => {
    const h = i.toString().padStart(2, "0") + "h"
    hourlyMap[h] = { produced: 0, rejected: 0 }
  })

  // Preenche com dados reais
  allEvents.forEach((e: any) => {
    const raw = e.timestamp?.split(":")[0]
    if (!raw) return
    const h = raw.padStart(2, "0") + "h"
    if (!hourlyMap[h]) hourlyMap[h] = { produced: 0, rejected: 0 }
    // Estima produção por hora baseado nos contaminados
    hourlyMap[h].produced += Math.round(1 / 0.08)
    if (e.rejected !== false) hourlyMap[h].rejected++
  })

  // Se não há dados reais, usa mock para não ficar vazio
  const hasRealData = allEvents.length > 0
  const hourly = Array.from({ length: 24 }, (_, i) => {
    const h = i.toString().padStart(2, "0") + "h"
    if (hasRealData) return { hour: h, ...hourlyMap[h] }
    const mock = mockHourly.find(m => m.hour === h)
    return { hour: h, produced: mock?.produced ?? 0, rejected: mock?.rejected ?? 0 }
  })

  // Status da esteira
  const { data: equipamentos } = await supabase.from("equipamentos").select("*")
  const esteiraAtiva = equipamentos?.find((e: any) => e.nome === "Esteira principal")?.status === "ativo"

  return res.status(200).json({
    totalProduced,
    totalRejected,
    contaminadosPassaram,
    rejectionRate,
    lastEvent: allEvents[0] ?? null,
    hourly,
    shifts,
    ferroso: allEvents.filter((e: any) => e.metal_type === "ferroso").length,
    naoFerroso: allEvents.filter((e: any) => e.metal_type === "nao_ferroso").length,
    esteiraAtiva,
  })
}