"use client"

import { useState } from "react"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatCurrency, getCurrencySymbol } from "@/lib/format"
import { removePartFromJob } from "@/actions/jobParts"
import AddPartSheet from "./AddPartSheet"

interface JobPartsTableProps {
  jobId: string
  jobParts: {
    id: string
    quantity: number
    unitPrice: any
    part: {
      id: string
      name: string
    }
  }[]
  availableParts: {
    id: string
    name: string
    stockQty: number
    unitPrice: any
  }[]
  isLocked: boolean
}

export default function JobPartsTable({ jobId, jobParts, availableParts, isLocked }: JobPartsTableProps) {
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const currencySymbol = getCurrencySymbol()

  const handleRemove = async (jobPartId: string) => {
    if (!confirm("Are you sure you want to remove this part from the job? The stock will be returned to inventory.")) return

    setDeletingId(jobPartId)
    try {
      const response = await removePartFromJob(jobPartId)
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success("Part removed from job")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Required Parts</h3>
        {!isLocked && (
          <Button size="sm" variant="outline" onClick={() => setShowAddSheet(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Parts
          </Button>
        )}
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Part Name</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead className="text-right">Line Total</TableHead>
              {!isLocked && <TableHead className="w-[80px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobParts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isLocked ? 4 : 5} className="h-32 text-center text-muted-foreground">
                  No parts have been added to this job yet.
                </TableCell>
              </TableRow>
            ) : (
              jobParts.map((jp) => {
                const lineTotal = jp.quantity * Number(jp.unitPrice)
                return (
                  <TableRow key={jp.id}>
                    <TableCell className="font-medium">{jp.part.name}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(jp.unitPrice.toString())}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center bg-muted px-2 py-1 rounded text-xs font-bold min-w-[2rem]">
                        {jp.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(lineTotal)}
                    </TableCell>
                    {!isLocked && (
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemove(jp.id)}
                          disabled={deletingId === jp.id}
                        >
                          {deletingId === jp.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AddPartSheet 
        open={showAddSheet} 
        onOpenChange={setShowAddSheet} 
        jobId={jobId} 
        parts={availableParts} 
      />
    </div>
  )
}
