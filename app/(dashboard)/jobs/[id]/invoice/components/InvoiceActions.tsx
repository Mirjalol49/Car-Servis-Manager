"use client"

import { Download, Printer, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface InvoiceActionsProps {
  jobId: string
  invoiceId: string
}

export default function InvoiceActions({ jobId, invoiceId }: InvoiceActionsProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t print:hidden">
      <Button variant="outline" asChild>
        <Link href={`/dashboard/jobs/${jobId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Job
        </Link>
      </Button>
      
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button variant="outline" onClick={handlePrint} className="w-full sm:w-auto">
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button asChild className="w-full sm:w-auto">
          <a href={`/api/invoices/${invoiceId}/pdf`} download target="_blank" rel="noopener noreferrer">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </a>
        </Button>
      </div>
    </div>
  )
}
