"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"

export default function AutoRefresh() {
  const router = useRouter()
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
      setLastUpdated(new Date())
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border shadow-sm">
      <RefreshCw className="h-3 w-3 animate-spin-slow" />
      Last updated: {lastUpdated.toLocaleTimeString()}
    </div>
  )
}
