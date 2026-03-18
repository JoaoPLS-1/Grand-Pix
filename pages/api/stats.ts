import type { NextApiRequest, NextApiResponse } from "next"
import { mockEvents, mockHourly, mockShifts } from "../lib/mock-data"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const totalProduced = mockHourly.reduce((a, b) => a + b.produced, 0)
  const totalRejected = mockEvents.length
  const rejectionRate = ((totalRejected / totalProduced) * 100).toFixed(2)

  res.status(200).json({
    totalProduced,
    totalRejected,
    rejectionRate,
    lastEvent: mockEvents[0],
    hourly: mockHourly,
    shifts: mockShifts,
    ferroso: mockEvents.filter(e => e.metal_type === "ferroso").length,
    naoFerroso: mockEvents.filter(e => e.metal_type === "nao_ferroso").length,
  })
}