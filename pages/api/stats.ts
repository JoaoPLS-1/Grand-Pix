import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "../lib/supabase"
import { mockEvents, mockHourly, mockShifts } from "../lib/mock-data"
import { producaoHoje } from "./simulate"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const today = new Date().toISOString().split("T")[0]

  const { data: events } = await supabase
    .from("detection_events")
    .select("*")
    .gte("created_at", `${today}T00:00:00`)
    .order("created_at", { ascending: false })

  const allEvents = events && events.length > 0 ? events : mockEvents

  const totalProduced = producaoHoje.totalProduzido > 0
    ? producaoHoje.totalProduzido
    : mockHourly.reduce((a, b) => a + b.produced, 0)

  const totalRejected = allEvents.filter((e: any) => e.rejected !== false).length
  const contaminadosPassaram = producaoHoje.contaminadosPassaram +
    (allEvents.filter((e: any) => e.rejected === false).length)

  const rejectionRate = totalProduced > 0
    ? ((totalRejected / totalProduced) * 100).toFixed(2)
    : "0.00"

  const shifts = { manha: 0, tarde: 0, noite: 0 }
  allEvents.forEach((e: any) => {
    if (e.shift in shifts) shifts[e.shift as keyof typeof shifts]++
  })
  if (shifts.manha === 0 && shifts.tarde === 0 && shifts.noite === 0) {
    Object.assign(shifts, mockShifts)
  }

  const hourlyMap: Record<string, { produced: number; rejected: number }> = {}
  mockHourly.forEach(h => { hourlyMap[h.hour] = { produced: h.produced, rejected: 0 } })
  allEvents.forEach((e: any) => {
    const raw = e.timestamp?.split(":")[0]
    if (!raw) return
    const h = raw.padStart(2, "0") + "h"
    if (!hourlyMap[h]) hourlyMap[h] = { produced: 0, rejected: 0 }
    if (e.rejected !== false) hourlyMap[h].rejected++
  })

  const allHours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0") + "h")
  const hourly = allHours.map(h => ({
    hour: h,
    produced: hourlyMap[h]?.produced ?? 0,
    rejected: hourlyMap[h]?.rejected ?? 0,
  }))

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