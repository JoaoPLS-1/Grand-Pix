import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "../lib/supabase"
import { mockEvents } from "../lib/mock-data"

// Estado em memória da produção atual
export let producaoHoje = {
  totalProduzido: 0,
  totalRejeitado: 0,
  contaminadosPassaram: 0,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json(producaoHoje)
  }

  if (req.method !== "POST") return res.status(405).end()

  const { pistaoAtivo = true, quantidade = 1, contaminationRate = 0.08 } = req.body

  const tipos = ["ferroso", "nao_ferroso"] as const
  const lotes = ["L024-029", "L024-030", "L024-031"]
  const tamanhos = [0.3, 0.4, 0.5, 0.6, 0.8, 1.2, 2.1]
  const now = new Date()
  const hora = now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0")
  const hora_num = now.getHours()
  const shift = hora_num < 12 ? "manha" : hora_num < 18 ? "tarde" : "noite"

  const resultados = []

  for (let i = 0; i < quantidade; i++) {
    producaoHoje.totalProduzido++
    const contaminado = Math.random() < contaminationRate

    if (contaminado) {
      const rejeitado = pistaoAtivo

      if (rejeitado) {
        producaoHoje.totalRejeitado++
      } else {
        producaoHoje.contaminadosPassaram++
      }

      const evento = {
        timestamp: hora,
        metal_type: tipos[Math.floor(Math.random() * tipos.length)],
        size_mm: tamanhos[Math.floor(Math.random() * tamanhos.length)],
        rejected: rejeitado,
        shift,
        lot: lotes[Math.floor(Math.random() * lotes.length)],
      }

      const { data } = await supabase.from("detection_events").insert(evento).select().single()
      if (data) resultados.push(data)
      else {
        mockEvents.unshift({ id: Date.now().toString(), ...evento })
        resultados.push({ id: Date.now().toString(), ...evento })
      }
    }
  }

  return res.status(200).json({ producaoHoje, novosEventos: resultados })
}