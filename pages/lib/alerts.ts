import { DetectionEvent } from "./mock-data"

export interface Alert {
  type: "danger" | "warn" | "ok"
  msg: string
  time: string
}

export function gerarAlertas(events: DetectionEvent[]): Alert[] {
  const alertas: Alert[] = []
  const agora = new Date()
  const hora = agora.getHours().toString().padStart(2, "0") + ":" + agora.getMinutes().toString().padStart(2, "0")

  const ultimosLote = events.slice(0, 5)
  const loteCount: Record<string, number> = {}
  ultimosLote.forEach(e => { loteCount[e.lot] = (loteCount[e.lot] || 0) + 1 })
  Object.entries(loteCount).forEach(([lot, count]) => {
    if (count >= 2) alertas.push({ type: "danger", msg: `${count} rejeições consecutivas no lote ${lot}`, time: `${hora} · Verificar equipamento de corte` })
  })

  const grandes = events.filter(e => e.size_mm >= 2)
  if (grandes.length > 0) alertas.push({ type: "warn", msg: `Fragmento de ${grandes[0].size_mm}mm detectado — acima do limiar`, time: `${grandes[0].timestamp} · Verificar manutenção` })

  const total = events.length
  const taxa = total / 1482
  if (taxa > 0.003) alertas.push({ type: "danger", msg: `Taxa de rejeição em ${(taxa * 100).toFixed(2)}% — acima do limite`, time: `${hora} · Notificação ao supervisor` })

  alertas.push({ type: "ok", msg: "Calibração do detector validada com êxito", time: "07:00 · Início do turno manhã" })

  return alertas.slice(0, 5)
}