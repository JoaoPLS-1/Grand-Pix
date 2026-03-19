import Link from "next/link"
import { useRouter } from "next/router"

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/simulacao", label: "Simulação" },
  { href: "/analise", label: "Análise" },
  { href: "/relatorios", label: "Relatórios" },
]

export default function Navbar() {
  const { pathname } = useRouter()
  return (
    <nav className="border-b border-gray-100 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-sm font-medium text-gray-700">Doces Mirahy</span>
      </div>
      <div className="flex gap-1">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors
              ${pathname === l.href ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-400 hover:text-gray-700"}`}>
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}