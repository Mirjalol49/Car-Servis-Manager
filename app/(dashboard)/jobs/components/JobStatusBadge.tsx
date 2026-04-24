import { Badge } from "@/components/ui/badge"

const statusConfig: Record<string, { label: string; colorClass: string }> = {
  WAITING: { label: "Waiting", colorClass: "bg-slate-500 hover:bg-slate-600" },
  DIAGNOSED: { label: "Diagnosed", colorClass: "bg-blue-500 hover:bg-blue-600" },
  APPROVED: { label: "Approved", colorClass: "bg-yellow-500 hover:bg-yellow-600 text-white" },
  IN_PROGRESS: { label: "In Progress", colorClass: "bg-orange-500 hover:bg-orange-600" },
  COMPLETED: { label: "Completed", colorClass: "bg-green-500 hover:bg-green-600" },
  DELIVERED: { label: "Delivered", colorClass: "bg-purple-500 hover:bg-purple-600" },
}

export default function JobStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, colorClass: "bg-gray-500" }

  return (
    <Badge className={`${config.colorClass} whitespace-nowrap`}>
      {config.label}
    </Badge>
  )
}
