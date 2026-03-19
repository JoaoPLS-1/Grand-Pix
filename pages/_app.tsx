import "@/styles/globals.css"
import type { AppProps } from "next/app"
import Navbar from "@/components/NavBar"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="flex min-h-screen">
      <Navbar />
      <main style={{ marginLeft: 220 }} className="flex-1 min-h-screen bg-[#f5f6fa]">
        <Component {...pageProps} />
      </main>
    </div>
  )
}