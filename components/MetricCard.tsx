interface Props {
  label: string
  value: string | number
  sub: string
  variant?: "ok" | "danger" | "warn" | "default"
}

const variantConfig = {
  ok:      { value: "text-emerald-600", bar: "bg-emerald-500", bg: "bg-emerald-50" },
  danger:  { value: "text-red-600",     bar: "bg-red-500",     bg: "bg-red-50"     },
  warn:    { value: "text-amber-600",   bar: "bg-amber-500",   bg: "bg-amber-50"   },
  default: { value: "text-gray-800",    bar: "bg-gray-300",    bg: "bg-transparent"},
}

export default function MetricCard({ label, value, sub, variant = "default" }: Props) {
  const c = variantConfig[variant]
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${c.bar}`} />
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-2xl font-semibold tracking-tight ${c.value}`}>{value}</p>
      <p className="text-[11px] text-gray-400 mt-1">{sub}</p>
    </div>
  )
}