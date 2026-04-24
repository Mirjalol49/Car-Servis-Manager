"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const statuses = [
  { value: "ALL", label: "All" },
  { value: "WAITING", label: "Waiting" },
  { value: "DIAGNOSED", label: "Diagnosed" },
  { value: "APPROVED", label: "Approved" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DELIVERED", label: "Delivered" },
]

export default function JobFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const currentStatus = searchParams.get("status") || "ALL"

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value === "ALL") {
      params.delete("status")
    } else {
      params.set("status", value)
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <Tabs value={currentStatus} onValueChange={handleTabChange} className="w-full overflow-x-auto pb-2">
      <TabsList className="w-max">
        {statuses.map((status) => (
          <TabsTrigger key={status.value} value={status.value} className="px-4">
            {status.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
