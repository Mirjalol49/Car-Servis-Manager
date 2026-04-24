"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useDebounce } from "use-debounce"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function CustomerSearch({
  defaultValue,
}: {
  defaultValue?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [text, setText] = useState(defaultValue || "")
  const [query] = useDebounce(text, 500)

  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    
    if (query) {
      params.set("search", query)
    } else {
      params.delete("search")
    }

    router.replace(`${pathname}?${params.toString()}`)
  }, [query, router, pathname, searchParams])

  return (
    <div className="relative w-full max-w-sm">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="h-4 w-4 text-muted-foreground" />
      </div>
      <Input
        type="text"
        placeholder="Search by name or phone..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="pl-10"
      />
    </div>
  )
}
