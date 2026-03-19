interface Equipamento {
  id: string
  nome: string
  status: "ativo" | "falha" | "manutencao"
}

interface Props {
  equipamento: Equipamento
  onToggle: (id: string, status: string) => void
}

export default function EquipamentoCard({ equipamento, onToggle }: Props) {
  const isAtivo = equipamento.status === "ativo"
  return (
    <div className={`rounded-xl p-3 border flex items-center justify-between transition-all
      ${isAtivo ? "bg-white border-gray-100 shadow-sm" : "bg-red-50 border-red-200"}`}>
      <div className="flex items-center gap-2.5">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0
          ${isAtivo ? "bg-emerald-50" : "bg-red-100"}`}>
          <span className={`w-2 h-2 rounded-full ${isAtivo ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
        </div>
        <span className="text-[12px] font-medium text-gray-700">{equipamento.nome}</span>
      </div>
      <button
        onClick={() => onToggle(equipamento.id, isAtivo ? "falha" : "ativo")}
        className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-colors
          ${isAtivo
            ? "bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600"
            : "bg-red-100 text-red-600 hover:bg-emerald-100 hover:text-emerald-600"}`}>
        {isAtivo ? "ativo" : "falha"}
      </button>
    </div>
  )
}