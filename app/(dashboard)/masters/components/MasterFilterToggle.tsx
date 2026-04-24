"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function MasterFilterToggle({ defaultShowAll }: { defaultShowAll: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleToggle = (checked: boolean) => {
    const params = new URLSearchParams(searchParams)
    if (checked) {
      params.set("filter", "all")
    } else {
      params.delete("filter")
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center space-x-2 bg-muted/50 p-2 rounded-lg border">
      <Switch 
        id="show-all" 
        checked={defaultShowAll}
        onCheckedChange={handleToggle}
      />
      <Label htmlFor="show-all" className="cursor-pointer text-sm font-medium">
        Show Inactive Masters
      </Label>
    </div>
  )
}
