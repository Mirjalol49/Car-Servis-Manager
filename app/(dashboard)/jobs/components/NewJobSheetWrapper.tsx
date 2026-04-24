"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import NewJobSheet from "./NewJobSheet"

interface NewJobSheetWrapperProps {
  cars: { id: string; plateNumber: string; customer: { name: string } }[]
  masters: { id: string; name: string; specialization: string | null }[]
}

export default function NewJobSheetWrapper({ cars, masters }: NewJobSheetWrapperProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Job Order
      </Button>
      <NewJobSheet open={open} onOpenChange={setOpen} cars={cars} masters={masters} />
    </>
  )
}
