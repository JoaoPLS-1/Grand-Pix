import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "@/lib/supabase"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const desde7 = new Date(); desde7.setDate(desde7.getDate() - 7)
  const desde14 = new Date(); desde14.setDate(desde14.getDate() - 14)

  const { data: eventos7 } = await supabase
    .from("detection_events").select("*").gte("created_at", desde7.toISOString())
  const { data: eventos14 } = await supabase
    .from("detection_events").select("*")
    .gte("created_at", desde14.toISOString())
    .lt("created_at", desde7.toISOString())
  const { data: equipamentos } = await supabase.from("equipamentos").select("*")

  const total = eventos7?.length ?? 0
  const totalAnterior = eventos14?.length ?? 0
  const ferroso = eventos7?.filter(e => e.metal_type === "ferroso").length ?? 0
  const naoFerroso = eventos7?.filter(e => e.metal_type === "nao_ferroso").length ?? 0

  // Tendência
  const tendencia = total > totalAnterior ? "aumento" : total < totalAnterior ? "queda" : "estável"
  const variacaoPct = totalAnterior > 0
    ? (((total - totalAnterior) / totalAnterior) * 100).toFixed(1)
    : "0"

  // Lotes críticos
  const porLote: Record<string, number> = {}
  eventos7?.forEach(e => { porLote[e.lot] = (porLote[e.lot] || 0) + 1 })
  const lotesCriticos = Object.entries(porLote)
    .filter(([, v]) => v >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([lot, count]) => ({ lot, count }))

  // Por turno
  const porTurno: Record<string, number> = { manha: 0, tarde: 0, noite: 0 }
  eventos7?.forEach(e => { if (e.shift in porTurno) porTurno[e.shift]++ })
  const turnoMaisCritico = Object.entries(porTurno).sort((a, b) => b[1] - a[1])[0]

  // Tamanho médio
  const tamanhoMedio = total > 0
    ? (eventos7!.reduce((a, e) => a + e.size_mm, 0) / total).toFixed(2)
    : "0"

  // Equipamentos em falha
  const equipamentosEmFalha = equipamentos?.filter((e: any) => e.status === "falha").map((e: any) => e.nome) ?? []

  // Insights automáticos
  const insights: string[] = []

  if (tendencia === "aumento")
    insights.push(`Rejeições aumentaram ${variacaoPct}% em relação à semana anterior (${totalAnterior} → ${total}). Recomenda-se inspeção imediata dos equipamentos.`)
  else if (tendencia === "queda")
    insights.push(`Rejeições reduziram ${variacaoPct}% em relação à semana anterior (${totalAnterior} → ${total}). Manter as boas práticas atuais.`)
  else
    insights.push(`Rejeições estáveis em relação à semana anterior. Monitoramento contínuo recomendado.`)

  if (ferroso > naoFerroso)
    insights.push(`${ferroso} rejeições ferrosas (${((ferroso/total)*100).toFixed(0)}% do total) — verificar desgaste de facas, grades e componentes metálicos da linha.`)
  else if (naoFerroso > 0)
    insights.push(`${naoFerroso} rejeições não ferrosas (${((naoFerroso/total)*100).toFixed(0)}% do total) — verificar embalagens de alumínio e utensílios de cobre na linha.`)

  if (lotesCriticos.length > 0)
    insights.push(`Lote ${lotesCriticos[0].lot} concentra ${lotesCriticos[0].count} rejeições. Rastrear qual equipamento estava ativo nesse período.`)

  if (turnoMaisCritico && turnoMaisCritico[1] > 0) {
    const nomes: Record<string, string> = { manha: "manhã", tarde: "tarde", noite: "noite" }
    insights.push(`Turno da ${nomes[turnoMaisCritico[0]]} concentra ${turnoMaisCritico[1]} rejeições. Avaliar troca de operadores ou manutenção preventiva nesse horário.`)
  }

  if (parseFloat(tamanhoMedio) >= 1.0)
    insights.push(`Tamanho médio dos fragmentos: ${tamanhoMedio}mm — fragmentos grandes indicam desgaste acelerado. Antecipar manutenção.`)
  else
    insights.push(`Tamanho médio dos fragmentos: ${tamanhoMedio}mm — fragmentos pequenos indicam desgaste inicial. Monitorar evolução.`)

  if (equipamentosEmFalha.length > 0)
    insights.push(`Equipamentos em falha ativa: ${equipamentosEmFalha.join(", ")}. Correlação com rejeições recentes é provável — verificar imediatamente.`)

  insights.push(`Recomendação geral: limpar imãs de neodímio a cada turno e realizar calibração do detector semanalmente para manter sensibilidade mínima de 0,3mm.`)

  return res.status(200).json({
    total,
    totalAnterior,
    tendencia,
    variacaoPct,
    ferroso,
    naoFerroso,
    tamanhoMedio,
    lotesCriticos,
    porTurno,
    equipamentosEmFalha,
    insights,
    geradoEm: new Date().toISOString(),
  })
}