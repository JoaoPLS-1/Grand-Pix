import Link from "next/link"
import { useRouter } from "next/router"

const links = [
  { href: "/", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/simulacao", label: "Simulação", icon: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" },
  { href: "/analise", label: "Análise", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { href: "/relatorios", label: "Relatórios", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
]

export default function Navbar() {
  const { pathname } = useRouter()
  return (
    <aside style={{ width: 220 }} className="fixed top-0 left-0 h-screen bg-[#0f1117] border-r border-white/[0.06] flex flex-col z-50">

      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: '#16c784' }}>
          <svg className="w-4 h-4" fill="none" stroke="#0f1117" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
          </svg>
        </div>
        <p className="text-[13px] font-semibold text-white tracking-tight">Doces Mirahy</p>
        <p className="text-[11px] text-white/30 mt-0.5">Sistema de monitoramento</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest px-2 mb-2">Menu</p>
        {links.map(l => {
          const active = pathname === l.href
          return (
            <Link key={l.href} href={l.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-150
                ${active
                  ? "bg-[#16c784]/10 text-[#16c784] font-medium"
                  : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"}`}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d={l.icon} />
              </svg>
              {l.label}
              {active && <span className="ml-auto w-1 h-1 rounded-full bg-[#16c784]" />}
            </Link>
          )
        })}
      </nav>

      {/* Status */}
      <div className="px-5 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16c784] animate-pulse" />
          <span className="text-[11px] text-white/30">Sistema online</span>
        </div>
        <p className="text-[10px] text-white/15 mt-1">Grand Prix SENAI 2025</p>
      </div>
    </aside>
  )
}