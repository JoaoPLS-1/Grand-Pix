import { DetectionEvent } from "@/pages/lib/mock-data"

export default function RejectionList({ events }: { events: DetectionEvent[] }) {
  if (events.length === 0) return (
    <p className="text-xs text-gray-300 text-center py-6">Nenhuma rejeição registrada</p>
  )
  return (
    <div className="flex flex-col gap-1.5">
      {events.slice(0, 5).map(event => (
        <div key={event.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-semibold flex-shrink-0
            ${event.metal_type === "ferroso" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
            {event.metal_type === "ferroso" ? "Fe" : "NF"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-gray-700">{event.timestamp}</p>
            <p className="text-[11px] text-gray-400 truncate">Lote {event.lot}</p>
          </div>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md
            ${event.metal_type === "ferroso" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"}`}>
            {event.size_mm}mm
          </span>
        </div>
      ))}
    </div>
  )
}