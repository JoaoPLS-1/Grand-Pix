import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "../../lib/supabase"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { data, error } = await supabase.from("equipamentos").select("*").order("nome")
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === "PATCH") {
    const { id, status } = req.body
    const { error } = await supabase.from("equipamentos").update({ status, updated_at: new Date().toISOString() }).eq("id", id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}