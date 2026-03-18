import type { NextApiRequest, NextApiResponse } from "next"
import { DetectionEvent, mockEvents } from "../lib/mock-data"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end()

  const tipos = ["ferroso", "nao_ferroso"] as const
  const lotes = ["L024-029", "L024-030", "L024-031"]
  const tamanhos = [0.3, 0.4, 0.5, 0.6, 0.8, 1.2, 2.1]

  const now = new Date()
  const hora = now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0")

  const newEvent: DetectionEvent = {
    id: Date.now().toString(),
    timestamp: hora,
    metal_type: tipos[Math.floor(Math.random() * tipos.length)],
    size_mm: tamanhos[Math.floor(Math.random() * tamanhos.length)],
    rejected: true,
    shift: "tarde",
    lot: lotes[Math.floor(Math.random() * lotes.length)],
  }

  mockEvents.unshift(newEvent)
  if (mockEvents.length > 20) mockEvents.pop()

  res.status(200).json(newEvent)
}