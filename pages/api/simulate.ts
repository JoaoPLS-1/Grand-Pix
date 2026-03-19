import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "@/lib/supabase"
import { mockEvents } from "@/lib/mock-data"
import type { DetectionEvent } from "@/lib/mock-data"

export let producaoHoje = {
  totalProduzido: 0,
  totalRejeitado: 0,
  contaminadosPassaram: 0,
  enviadosLaboratorio: 0,
}

// Busca total real de rejeições do banco para não depender de memória
async function getTotalRejeicoesHoje(): Promise<number> {
  const today = new Date().toISOString().split("T")[0]
  const { count } = await supabase
    .from("detection_events")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${today}T00:00:00`)
    .eq("rejected", true)
  return count ?? 0
}

async function getTotalAmostrasHoje(): Promise<number> {
  const today = new Date().toISOString().split("T")[0]
  const { count } = await supabase
    .from("laboratorio_amostras")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${today}T00:00:00`)
  return count ?? 0
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json(producaoHoje)
  }

  if (req.method !== "POST") return res.status(405).end()

  const { pistaoAtivo = true, quantidade = 1 } = req.body

  const tipos = ["ferroso", "nao_ferroso"] as const
  const lotes = ["L024-029", "L024-030", "L024-031"]
  const tamanhos = [0.3, 0.4, 0.5, 0.6, 0.8, 1.2, 2.1]
  const now = new Date()
  const hora = now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0")
  const hora_num = now.getHours()
  const shift = hora_num < 12 ? "manha" : hora_num < 18 ? "tarde" : "noite"

  const resultados = []

  // Busca contadores reais do banco — ignora memória
  const totalRejeicoesAntes = await getTotalRejeicoesHoje()
  const totalAmostrasAntes = await getTotalAmostrasHoje()

  for (let i = 0; i < quantidade; i++) {
    producaoHoje.totalProduzido++
    const contaminado = Math.random() < 0.08
    if (!contaminado) continue

    const rejeitado = pistaoAtivo
    const shiftTyped: "manha" | "tarde" | "noite" = shift

    const evento = {
      timestamp: hora,
      metal_type: tipos[Math.floor(Math.random() * tipos.length)],
      size_mm: tamanhos[Math.floor(Math.random() * tamanhos.length)],
      rejected: rejeitado,
      shift: shiftTyped,
      lot: lotes[Math.floor(Math.random() * lotes.length)],
    }

    if (rejeitado) {
      producaoHoje.totalRejeitado++

      const { data } = await supabase
        .from("detection_events")
        .insert(evento)
        .select()
        .single()

      if (data) {
        resultados.push(data)

        // Usa contador REAL do banco + quantas rejeições fizemos nessa chamada
        const totalRejeicoesAgora = totalRejeicoesAntes + producaoHoje.totalRejeitado
        const amostrasEsperadas = Math.floor(totalRejeicoesAgora / 20)
        const amostrasExistentes = totalAmostrasAntes

        // Se deveria ter mais amostras do que existem, cria uma
        if (amostrasEsperadas > amostrasExistentes) {
          producaoHoje.enviadosLaboratorio++
          await supabase.from("laboratorio_amostras").insert({
            detection_event_id: data.id,
            metal_type: evento.metal_type,
            size_mm: evento.size_mm,
            lot: evento.lot,
            shift: evento.shift,
            status: "em_analise",
          })
          console.log(`[LAB] Amostra enviada — total rejeições: ${totalRejeicoesAgora}`)
        }
      } else {
        const fallback = { id: Date.now().toString(), ...evento } as DetectionEvent
        mockEvents.unshift(fallback)
        resultados.push(fallback)
      }
    } else {
      producaoHoje.contaminadosPassaram++

      const { data } = await supabase
        .from("detection_events")
        .insert({ ...evento, rejected: false })
        .select()
        .single()

      if (data) resultados.push(data)
      else {
        const fallback: DetectionEvent = { id: Date.now().toString(), ...evento }
        mockEvents.unshift(fallback)
        resultados.push(fallback)
      }
    }
  }

  return res.status(200).json({ producaoHoje, novosEventos: resultados })
}