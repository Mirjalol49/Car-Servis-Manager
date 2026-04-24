import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { Plus, Car, Phone } from "lucide-react"

import { getCustomerById } from "@/actions/customers"
import { formatPhone, formatCurrency } from "@/lib/format"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import CopyPhoneButton from "./components/CopyPhoneButton"

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { data: customer, error } = await getCustomerById(params.id)

  if (error || !customer) {
    notFound()
  }

  // Flatten job orders from all cars for the history section
  const allJobOrders = customer.cars.flatMap(car => car.jobOrders).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
          <p className="text-muted-foreground mt-1">
            Customer since {format(new Date(customer.createdAt), "MMMM yyyy")}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-2xl font-bold">
              <Phone className="mr-2 h-5 w-5 text-muted-foreground" />
              {formatPhone(customer.phone)}
              <CopyPhoneButton phone={customer.phone} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customer.cars.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Service Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allJobOrders.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Vehicles</h2>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/cars/new?customerId=${customer.id}`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Car
            </Link>
          </Button>
        </div>
        
        {customer.cars.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center">
            <Car className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No vehicles registered yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {customer.cars.map(car => (
              <Card key={car.id} className="overflow-hidden hover:bg-muted/50 transition-colors">
                <Link href={`/dashboard/cars/${car.id}`}>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg uppercase tracking-wider">{car.plateNumber}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-xs text-muted-foreground mt-1">
                      {car._count.jobOrders} service jobs
                    </p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Job History</h2>
        
        {allJobOrders.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">No service history found.</p>
          </div>
        ) : (
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Car Plate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allJobOrders.map(job => (
                  <TableRow key={job.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(job.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium uppercase">
                      {job.car.plateNumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.status}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate text-muted-foreground">
                      {job.problemDescription}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {job.totalCost ? `${formatCurrency(job.totalCost.toString())} UZS` : "TBD"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
