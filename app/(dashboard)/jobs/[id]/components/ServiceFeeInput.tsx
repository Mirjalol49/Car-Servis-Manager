"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { updateServiceFee } from "@/actions/jobs"

interface ServiceFeeInputProps {
  jobId: string
  initialFee: number
  isDisabled: boolean
}

export default function ServiceFeeInput({ jobId, initialFee, isDisabled }: ServiceFeeInputProps) {
  const [fee, setFee] = useState(initialFee.toString())
  const [isSaving, setIsSaving] = useState(false)

  const handleBlur = async () => {
    const parsedFee = parseFloat(fee)
    
    if (isNaN(parsedFee) || parsedFee < 0) {
      setFee(initialFee.toString())
      return
    }

    if (parsedFee === initialFee) return

    setIsSaving(true)
    try {
      const response = await updateServiceFee(jobId, parsedFee)
      if (response.error) {
        toast.error(response.error)
        setFee(initialFee.toString())
      } else {
        toast.success("Service fee updated")
      }
    } catch (error) {
      toast.error("Failed to update service fee")
      setFee(initialFee.toString())
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="relative">
      <Input
        type="number"
        value={fee}
        onChange={(e) => setFee(e.target.value)}
        onBlur={handleBlur}
        disabled={isDisabled || isSaving}
        className="pl-8"
        min="0"
        step="1000"
      />
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
        UZS
      </span>
      {isSaving && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}
    </div>
  )
}
