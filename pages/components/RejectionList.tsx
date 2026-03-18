import { DetectionEvent } from "@/pages/lib/mock-data"

export default function RejectionList({ events }: { events: DetectionEvent[] }) {
  return (
    <div className="flex flex-col gap-2">
      {events.slice(0, 5).map(event => (
        <div key={event.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
          <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium flex-shrink-0
            ${event.metal_type === "ferroso"
              ? "bg-red-100 text-red-700"
              : "bg-amber-100 text-amber-700"}`}>
            {event.metal_type === "ferroso" ? "Fe" : "NF"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800">{event.timestamp}</p>
            <p className="text-xs text-gray-400 truncate">
              {event.metal_type === "ferroso" ? "Ferroso" : "Não ferroso"} · Lote {event.lot}
            </p>
          </div>
          <span className="text-xs text-gray-500 font-medium">{event.size_mm}mm</span>
        </div>
      ))}
    </div>
  )
}