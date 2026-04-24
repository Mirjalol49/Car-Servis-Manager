import { format } from "date-fns"
import { getCustomers } from "@/actions/customers"
import { formatPhone } from "@/lib/format"
import { Users as UsersIcon } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import CustomerSearch from "./components/CustomerSearch"
import CustomerActions from "./components/CustomerActions"
import CustomerSheetWrapper from "./components/CustomerSheetWrapper"

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { search?: string }
}) {
  const search = searchParams.search
  const { data: customers = [], error } = await getCustomers(search)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your customer database and view their service history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CustomerSheetWrapper />
        </div>
      </div>

      <div className="flex items-center">
        <CustomerSearch defaultValue={search} />
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
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Cars</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <UsersIcon className="h-10 w-10 mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-medium">No customers found</p>
                      {search ? (
                        <p className="text-sm mt-1">Try adjusting your search criteria</p>
                      ) : (
                        <p className="text-sm mt-1">Add a new customer to get started</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer, index) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{formatPhone(customer.phone)}</TableCell>
                    <TableCell>
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                        {customer._count.cars}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(customer.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <CustomerActions customer={customer} />
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
