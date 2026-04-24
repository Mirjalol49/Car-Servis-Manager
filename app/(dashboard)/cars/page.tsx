import { format } from "date-fns"
import Link from "next/link"
import { getCars } from "@/actions/cars"
import { getCustomers } from "@/actions/customers"
import { Car as CarIcon, FileText, ImageIcon, CheckCircle2, XCircle } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import CarSearch from "./components/CarSearch"
import CarActions from "./components/CarActions"
import CarSheetWrapper from "./components/CarSheetWrapper"

export default async function CarsPage({
  searchParams,
}: {
  searchParams: { search?: string }
}) {
  const search = searchParams.search
  
  // Fetch cars and customers in parallel
  const [carsResult, customersResult] = await Promise.all([
    getCars(search),
    getCustomers() // Load all for the combobox. If scale increases, we'd need an async combobox.
  ])

  const cars = carsResult.data || []
  const customers = customersResult.data || []
  const error = carsResult.error

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cars</h1>
          <p className="text-muted-foreground mt-1">
            Manage the registered vehicle fleet and view their documentation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CarSheetWrapper customers={customers} />
        </div>
      </div>

      <div className="flex items-center">
        <CarSearch defaultValue={search} />
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
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Plate Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Jobs Count</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <CarIcon className="h-10 w-10 mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-medium">No cars found</p>
                      {search ? (
                        <p className="text-sm mt-1">Try adjusting your search criteria</p>
                      ) : (
                        <p className="text-sm mt-1">Add a new car to get started</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                cars.map((car) => (
                  <TableRow key={car.id}>
                    <TableCell>
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-muted border flex items-center justify-center">
                        {car.plateImageUrl ? (
                          <img 
                            src={car.plateImageUrl} 
                            alt={car.plateNumber}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <CarIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold tracking-wider uppercase">
                      {car.plateNumber}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link 
                        href={`/dashboard/customers/${car.customerId}`}
                        className="hover:underline hover:text-primary transition-colors"
                      >
                        {car.customer.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium">
                        {car._count.jobOrders}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {car.attachmentUrl ? (
                        <div className="flex items-center text-green-600 dark:text-green-400">
                          <CheckCircle2 className="mr-1.5 h-4 w-4" />
                          <span className="text-xs font-medium">Yes</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-muted-foreground">
                          <XCircle className="mr-1.5 h-4 w-4 opacity-50" />
                          <span className="text-xs">No</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(car.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <CarActions car={car} customers={customers} />
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
