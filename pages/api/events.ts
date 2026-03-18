import type { NextApiRequest, NextApiResponse } from "next"
import { mockEvents } from "../lib/mock-data"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json(mockEvents)
}