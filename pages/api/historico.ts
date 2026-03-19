import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "../lib/supabase"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { periodo = "1" } = req.query
  const dias = parseInt(periodo as string)
  const desde = new Date()
  desde.setDate(desde.getDate() - dias)

  const { data, error } = await supabase
    .from("detection_events")
    .select("*")
    .gte("created_at", desde.toISOString())
    .order("created_at", { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  const total = data?.length || 0
  const ferroso = data?.filter(e => e.metal_type === "ferroso").length || 0
  const naoFerroso = data?.filter(e => e.metal_type === "nao_ferroso").length || 0
  const porLote: Record<string, number> = {}
  data?.forEach(e => { porLote[e.lot] = (porLote[e.lot] || 0) + 1 })

  return res.status(200).json({ total, ferroso, naoFerroso, porLote, eventos: data, periodo: dias })
}