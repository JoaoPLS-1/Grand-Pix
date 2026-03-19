import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "../../lib/supabase"
import { mockEvents } from "../../lib/mock-data"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data, error } = await supabase
    .from("detection_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)

  if (error || !data || data.length === 0) return res.status(200).json(mockEvents)
  return res.status(200).json(data)
}