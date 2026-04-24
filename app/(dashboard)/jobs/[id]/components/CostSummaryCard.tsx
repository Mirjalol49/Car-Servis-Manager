"use client"

import { useState } from "react"
import { Loader2, Send } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { formatCurrency, getCurrencySymbol } from "@/lib/format"
import ServiceFeeInput from "./ServiceFeeInput"
import { approveEstimate } from "@/actions/jobParts"
import { generateInvoice } from "@/actions/invoices"
import { useRouter } from "next/navigation"
import { FileText } from "lucide-react"

interface CostSummaryCardProps {
  jobId: string
  partsTotal: number
  serviceFee: number
  totalEstimate: number
  isLocked: boolean
  isApproved: boolean
  jobStatus: string
  hasInvoice: boolean
}

export default function CostSummaryCard({
  jobId,
  partsTotal,
  serviceFee,
  totalEstimate,
  isLocked,
  isApproved,
  jobStatus,
  hasInvoice
}: CostSummaryCardProps) {
  const [isApproving, setIsApproving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const currencySymbol = getCurrencySymbol()
  const router = useRouter()

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      const response = await approveEstimate(jobId)
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success("Estimate approved successfully")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsApproving(false)
    }
  }

  const handleGenerateInvoice = async () => {
    setIsGenerating(true)
    try {
      const response = await generateInvoice(jobId)
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success("Invoice generated")
        router.push(`/dashboard/jobs/${jobId}/invoice`)
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleViewInvoice = () => {
    router.push(`/dashboard/jobs/${jobId}/invoice`)
  }

  return (
    <Card className="bg-muted/10 sticky top-6">
      <CardHeader>
        <CardTitle>Cost Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Parts Subtotal</span>
            <span className="font-medium">{formatCurrency(partsTotal)} {currencySymbol}</span>
          </div>
          
          <div className="space-y-1.5 pt-2 border-t">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Service Fee</span>
            </div>
            <ServiceFeeInput 
              jobId={jobId} 
              initialFee={serviceFee} 
              isDisabled={isLocked} 
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t mt-4">
            <span className="font-bold text-lg">Total Estimate</span>
            <span className="font-bold text-xl text-primary">{formatCurrency(totalEstimate)} {currencySymbol}</span>
          </div>
        </div>

        {!isApproved && !isLocked && (
          <div className="pt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full" disabled={isApproving}>
                  {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send Estimate
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Send Estimate to Customer?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark the job estimate of <strong>{formatCurrency(totalEstimate)} {currencySymbol}</strong> as approved by the customer and transition the job status to <strong>APPROVED</strong>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isApproving}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={(e) => { e.preventDefault(); handleApprove(); }} disabled={isApproving}>
                    {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm Approval"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {(jobStatus === "COMPLETED" || jobStatus === "DELIVERED") && (
          <div className="pt-2 border-t">
            {hasInvoice ? (
              <Button onClick={handleViewInvoice} className="w-full" variant="default">
                <FileText className="mr-2 h-4 w-4" />
                View Invoice
              </Button>
            ) : (
              <Button onClick={handleGenerateInvoice} disabled={isGenerating} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Generate Invoice
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
