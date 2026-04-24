"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import PartSheet from "./PartSheet"

export default function PartSheetWrapper() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Part
      </Button>
      <PartSheet open={open} onOpenChange={setOpen} />
    </>
  )
}
