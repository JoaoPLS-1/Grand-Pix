import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "../../lib/supabase"

async function sincronizarAmostras() {
    // 1. Busca amostras já existentes
    const { data: amostrasExistentes } = await supabase
        .from("laboratorio_amostras")
        .select("detection_event_id, metal_type")

    const existentes = amostrasExistentes ?? []

    // 2. Busca TODAS as rejeições sem filtro de boolean
    //    e filtra em memória para evitar problema de tipo
    const { data: todasRejeicoes, error } = await supabase
        .from("detection_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500)

    if (error) {
        console.error("[LAB] Erro ao buscar rejeições:", error.message)
        return { criadas: 0, total: existentes.length }
    }

    // Filtra rejeições em memória — aceita boolean true ou string "true"
    const rejeicoes = (todasRejeicoes ?? []).filter(
        (r: any) => r.rejected === true || r.rejected === "true"
    )

    console.log(`[LAB] Total rejeições encontradas: ${rejeicoes.length}`)
    console.log(`[LAB] Amostras existentes: ${existentes.length}`)

    const amostrasEsperadas = Math.floor(rejeicoes.length / 20)
    const faltam = amostrasEsperadas - existentes.length

    console.log(`[LAB] Esperadas: ${amostrasEsperadas} | Faltam: ${faltam}`)

    if (faltam <= 0) return { criadas: 0, total: existentes.length }

    // 3. IDs já usados
    const idsUsados = existentes.map((a: any) => a.detection_event_id).filter(Boolean)

    // 4. Disponíveis para amostragem
    const disponiveis = rejeicoes.filter((r: any) => !idsUsados.includes(r.id))

    if (disponiveis.length === 0) return { criadas: 0, total: existentes.length }

    // 5. Tipo alternado
    const ultimoTipo = existentes.length > 0 ? existentes[existentes.length - 1]?.metal_type : null
    let tipoAtual: "ferroso" | "nao_ferroso" = ultimoTipo === "ferroso" ? "nao_ferroso" : "ferroso"

    let criadas = 0

    for (let i = 0; i < faltam; i++) {
        const doTipo = disponiveis.filter((r: any) => r.metal_type === tipoAtual)
        const pool = doTipo.length > 0 ? doTipo : disponiveis
        if (pool.length === 0) break

        const escolhido = pool[Math.floor(Math.random() * pool.length)]

        const { error: insertError } = await supabase
            .from("laboratorio_amostras")
            .insert({
                detection_event_id: escolhido.id,
                metal_type: escolhido.metal_type,
                size_mm: escolhido.size_mm,
                lot: escolhido.lot,
                shift: escolhido.shift,
                status: "em_analise",
            })

        if (!insertError) {
            disponiveis.splice(disponiveis.findIndex((r: any) => r.id === escolhido.id), 1)
            criadas++
            tipoAtual = tipoAtual === "ferroso" ? "nao_ferroso" : "ferroso"
            console.log(`[LAB] ✓ Amostra criada: ${escolhido.metal_type} | ${escolhido.lot}`)
        } else {
            console.error("[LAB] ✗ Erro insert:", insertError.message)
        }
    }

    return { criadas, total: existentes.length + criadas }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    if (req.method === "GET") {
        const sync = await sincronizarAmostras()
        console.log(`[LAB] Sync resultado:`, sync)

        const { data, error } = await supabase
            .from("laboratorio_amostras")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100)

        if (error) return res.status(500).json({ error: error.message })

        const { count: totalRejeicoes } = await supabase
            .from("detection_events")
            .select("*", { count: "exact", head: true })
            .eq("rejected", true)

        const totalR = totalRejeicoes ?? 0

        return res.status(200).json({
            amostras: data ?? [],
            totalRejeicoes: totalR,
            amostrasEsperadas: Math.floor(totalR / 20),
            totalAmostras: data?.length ?? 0,
            syncInfo: sync,
        })
    }

    if (req.method === "PATCH") {
        const { id, status, resultado, observacoes } = req.body
        const { error } = await supabase
            .from("laboratorio_amostras")
            .update({ status, resultado, observacoes })
            .eq("id", id)
        if (error) return res.status(500).json({ error: error.message })
        return res.status(200).json({ ok: true })
    }

    if (req.method === "DELETE") {
        const { error } = await supabase
            .from("laboratorio_amostras")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000")
        if (error) return res.status(500).json({ error: error.message })
        return res.status(200).json({ ok: true })
    }

    res.status(405).end()
}