"use client"

import { useState } from "react"
import { JobStatus } from "@prisma/client"
import { Check, ChevronDown, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { updateJobStatus } from "@/actions/jobs"

interface StatusTransitionMenuProps {
  jobId: string
  currentStatus: JobStatus
}

export default function StatusTransitionMenu({ jobId, currentStatus }: StatusTransitionMenuProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Define valid next states based on current state
  let validNextStatuses: { value: JobStatus; label: string; description: string }[] = []

  switch (currentStatus) {
    case "WAITING":
      // Usually transitioned automatically via addDiagnosis, but we can allow manual bump if diagnosisNotes exist
      validNextStatuses = [
        { value: "DIAGNOSED", label: "Mark as Diagnosed", description: "Diagnosis is complete" }
      ]
      break
    case "DIAGNOSED":
      validNextStatuses = [
        { value: "APPROVED", label: "Approve Job", description: "Customer approved the estimate" }
      ]
      break
    case "APPROVED":
      validNextStatuses = [
        { value: "IN_PROGRESS", label: "Start Work", description: "Move to in progress" }
      ]
      break
    case "IN_PROGRESS":
      validNextStatuses = [
        { value: "COMPLETED", label: "Mark Completed", description: "Requires BEFORE and AFTER photos" }
      ]
      break
    case "COMPLETED":
      validNextStatuses = [
        { value: "DELIVERED", label: "Deliver to Customer", description: "Job finished and invoiced" }
      ]
      break
    case "DELIVERED":
      validNextStatuses = [] // Terminal state
      break
  }

  const handleStatusChange = async (newStatus: JobStatus) => {
    setIsLoading(true)
    try {
      const response = await updateJobStatus(jobId, newStatus)
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success(`Job status updated to ${newStatus}`)
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (validNextStatuses.length === 0) {
    return (
      <Button disabled variant="outline">
        <Check className="mr-2 h-4 w-4" />
        Delivered
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Change Status"
          )}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        {validNextStatuses.map((status) => (
          <DropdownMenuItem 
            key={status.value}
            onClick={() => handleStatusChange(status.value)}
            className="flex flex-col items-start cursor-pointer py-2"
          >
            <div className="font-medium">{status.label}</div>
            <div className="text-xs text-muted-foreground">{status.description}</div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
