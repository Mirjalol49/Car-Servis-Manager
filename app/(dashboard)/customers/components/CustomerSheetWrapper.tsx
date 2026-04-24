"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import CustomerSheet from "./CustomerSheet"

export default function CustomerSheetWrapper() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Customer
      </Button>
      <CustomerSheet open={open} onOpenChange={setOpen} />
    </>
  )
}
