export type MetalType = "ferroso" | "nao_ferroso"

export interface DetectionEvent {
  id: string
  timestamp: string
  metal_type: MetalType
  size_mm: number
  rejected: boolean
  shift: "manha" | "tarde" | "noite"
  lot: string
}

export interface HourlyData {
  hour: string
  produced: number
  rejected: number
}

export const mockEvents: DetectionEvent[] = [
  { id: "1", timestamp: "14:32", metal_type: "nao_ferroso", size_mm: 0.8, rejected: true, shift: "tarde", lot: "L024-031" },
  { id: "2", timestamp: "13:17", metal_type: "nao_ferroso", size_mm: 1.2, rejected: true, shift: "tarde", lot: "L024-031" },
  { id: "3", timestamp: "11:45", metal_type: "nao_ferroso", size_mm: 0.5, rejected: true, shift: "manha", lot: "L024-030" },
  { id: "4", timestamp: "10:08", metal_type: "nao_ferroso", size_mm: 0.4, rejected: true, shift: "manha", lot: "L024-030" },
  { id: "5", timestamp: "08:51", metal_type: "ferroso", size_mm: 2.1, rejected: true, shift: "manha", lot: "L024-029" },
]

export const mockHourly: HourlyData[] = [
  { hour: "07h", produced: 180, rejected: 1 },
  { hour: "08h", produced: 195, rejected: 1 },
  { hour: "09h", produced: 210, rejected: 0 },
  { hour: "10h", produced: 188, rejected: 1 },
  { hour: "11h", produced: 202, rejected: 0 },
  { hour: "12h", produced: 175, rejected: 1 },
  { hour: "13h", produced: 195, rejected: 1 },
  { hour: "14h", produced: 137, rejected: 2 },
]

export const mockShifts = {
  manha: 4,
  tarde: 2,
  noite: 1,
}