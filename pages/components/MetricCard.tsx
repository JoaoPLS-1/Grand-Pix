interface Props {
  label: string
  value: string | number
  sub: string
  variant?: "ok" | "danger" | "warn" | "default"
}

const colors = {
  ok: "text-emerald-600",
  danger: "text-red-700",
  warn: "text-amber-700",
  default: "text-gray-900",
}

export default function MetricCard({ label, value, sub, variant = "default" }: Props) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-medium ${colors[variant]}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}