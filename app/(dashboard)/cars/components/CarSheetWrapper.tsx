"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import CarSheet from "./CarSheet"

interface CarSheetWrapperProps {
  customers: { id: string; name: string; phone: string }[]
}

export default function CarSheetWrapper({ customers }: CarSheetWrapperProps) {
  const [open, setOpen] = useState(false)
  const searchParams = useSearchParams()

  // Open automatically if ?customerId=X is passed
  useEffect(() => {
    if (searchParams.get("customerId")) {
      setOpen(true)
    }
  }, [searchParams])

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Car
      </Button>
      <CarSheet 
        open={open} 
        onOpenChange={setOpen} 
        customers={customers} 
      />
    </>
  )
}
