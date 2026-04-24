"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import MasterSheet from "./MasterSheet"

export default function MasterSheetWrapper() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Master
      </Button>
      <MasterSheet open={open} onOpenChange={setOpen} />
    </>
  )
}
