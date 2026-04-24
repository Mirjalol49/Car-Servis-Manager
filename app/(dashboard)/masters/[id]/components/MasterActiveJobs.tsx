"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ArrowUpRight } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import JobStatusBadge from "../../../jobs/components/JobStatusBadge"

interface MasterActiveJobsProps {
  jobs: {
    id: string
    status: string
    createdAt: Date
    car: {
      plateNumber: string
      customer: {
        name: string
      }
    }
  }[]
}

export default function MasterActiveJobs({ jobs }: MasterActiveJobsProps) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
        <p className="text-sm">No active jobs assigned.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Car Plate</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Time Open</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-bold uppercase tracking-wider">
                {job.car.plateNumber}
              </TableCell>
              <TableCell>
                {job.car.customer.name}
              </TableCell>
              <TableCell>
                <JobStatusBadge status={job.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground font-medium">
                {formatDistanceToNow(new Date(job.createdAt))}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/jobs/${job.id}`}>
                    Manage <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
