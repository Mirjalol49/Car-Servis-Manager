"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, getCurrencySymbol } from "@/lib/format"

interface MasterHistoryTableProps {
  jobs: {
    id: string
    status: string
    updatedAt: Date
    totalCost: any
    car: {
      plateNumber: string
    }
  }[]
}

const ITEMS_PER_PAGE = 10

export default function MasterHistoryTable({ jobs }: MasterHistoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const currencySymbol = getCurrencySymbol()

  const totalPages = Math.ceil(jobs.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentJobs = jobs.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
        <p className="text-sm">No completed jobs found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job ID</TableHead>
              <TableHead>Car Plate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Completed Date</TableHead>
              <TableHead className="text-right">Total Cost</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentJobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">
                  #JO-{job.id.slice(-6).toUpperCase()}
                </TableCell>
                <TableCell className="font-bold uppercase tracking-wider">
                  {job.car.plateNumber}
                </TableCell>
                <TableCell>
                  <Badge variant={job.status === "DELIVERED" ? "default" : "secondary"}>
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(job.updatedAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {job.totalCost ? `${formatCurrency(job.totalCost.toString())} ${currencySymbol}` : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/jobs/${job.id}`}>
                      <ArrowUpRight className="h-4 w-4" />
                      <span className="sr-only">View Job</span>
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, jobs.length)} of {jobs.length} jobs
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
