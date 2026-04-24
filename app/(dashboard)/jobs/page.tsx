import { format } from "date-fns"
import Link from "next/link"
import { getJobOrders, getMasters } from "@/actions/jobs"
import { getCars } from "@/actions/cars"
import { Wrench, Eye, ArrowRight } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import JobSearch from "./components/JobSearch"
import JobFilters from "./components/JobFilters"
import JobStatusBadge from "./components/JobStatusBadge"
import NewJobSheetWrapper from "./components/NewJobSheetWrapper"

export default async function JobsPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string }
}) {
  const search = searchParams.search
  const status = searchParams.status

  // Parallel fetch
  const [jobsResult, carsResult, mastersResult] = await Promise.all([
    getJobOrders({ search, status }),
    getCars(),
    getMasters()
  ])

  const jobs = jobsResult.data || []
  const cars = carsResult.data || []
  const masters = mastersResult.data || []
  const error = jobsResult.error

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Orders</h1>
          <p className="text-muted-foreground mt-1">
            Track vehicle intake, diagnosis, and service status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* @ts-ignore - The types match but TS complains about deep nested types sometimes */}
          <NewJobSheetWrapper cars={cars} masters={masters} />
        </div>
      </div>

      <div className="space-y-4">
        <JobFilters />
        <JobSearch defaultValue={search} />
      </div>

      {error ? (
        <div className="rounded-md bg-destructive/15 p-4 text-destructive">
          {error}
        </div>
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job ID</TableHead>
                <TableHead>Car Plate</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Master</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Wrench className="h-10 w-10 mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-medium">No job orders found</p>
                      {search || (status && status !== "ALL") ? (
                        <p className="text-sm mt-1">Try adjusting your search or filters</p>
                      ) : (
                        <p className="text-sm mt-1">Create a new job order to get started</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id} className="hover:bg-muted/50 cursor-default">
                    <TableCell className="font-bold">
                      #JO-{job.id.slice(-4).toUpperCase()}
                    </TableCell>
                    <TableCell className="font-bold tracking-wider uppercase">
                      {job.car.plateNumber}
                    </TableCell>
                    <TableCell>
                      {job.car.customer.name}
                    </TableCell>
                    <TableCell>
                      {job.master ? (
                        <span className="font-medium">{job.master.name}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <JobStatusBadge status={job.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {format(new Date(job.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/jobs/${job.id}`}>
                          View <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
