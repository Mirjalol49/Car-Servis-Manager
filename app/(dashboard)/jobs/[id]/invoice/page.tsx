import { notFound } from "next/navigation"
import { format } from "date-fns"
import { CheckCircle2, Clock } from "lucide-react"

import { getInvoiceByJobId } from "@/actions/invoices"
import { formatCurrency, getCurrencySymbol } from "@/lib/format"
import { formatPhone } from "@/lib/format"

import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import PaymentModal from "./components/PaymentModal"
import InvoiceActions from "./components/InvoiceActions"

export default async function InvoicePage({
  params,
}: {
  params: { id: string }
}) {
  const { data: invoice, error } = await getInvoiceByJobId(params.id)
  
  if (error || !invoice) {
    notFound()
  }

  const { jobOrder } = invoice
  const { car, master, parts } = jobOrder
  const { customer } = car

  const currencySymbol = getCurrencySymbol()
  const invoiceNumberFormatted = `#INV-${invoice.invoiceNumber.toString().padStart(4, '0')}`

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <Card className="p-8 print:shadow-none print:border-none print:p-0">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-12 pb-6 border-b">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
                A
              </div>
              <h1 className="text-2xl font-black tracking-tighter">AutoServis</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              123 Mechanic Street, Auto City
              <br />
              +998 90 123 45 67
              <br />
              info@autoservis.com
            </p>
          </div>
          
          <div className="text-right mt-6 md:mt-0">
            <h2 className="text-3xl font-light tracking-widest text-muted-foreground uppercase mb-2">Invoice</h2>
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground mr-2">Invoice No:</span> <strong className="font-mono">{invoiceNumberFormatted}</strong></p>
              <p><span className="text-muted-foreground mr-2">Date:</span> <strong>{format(new Date(invoice.createdAt), "MMM dd, yyyy")}</strong></p>
              <p><span className="text-muted-foreground mr-2">Job Order:</span> <strong className="font-mono">#JO-{jobOrder.id.slice(-6).toUpperCase()}</strong></p>
            </div>
          </div>
        </div>

        {/* CUSTOMER & CAR INFO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Billed To</h3>
            <p className="font-bold text-lg">{customer.name}</p>
            <p className="text-muted-foreground">{formatPhone(customer.phone)}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Vehicle Details</h3>
            <p className="font-bold text-lg uppercase">{car.plateNumber}</p>
            <p className="text-muted-foreground">Assigned Master: {master ? master.name : "Unassigned"}</p>
          </div>
        </div>

        {/* PARTS TABLE */}
        <div className="mb-8">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground italic">
                    Service only (no parts required)
                  </TableCell>
                </TableRow>
              ) : (
                parts.map((jp, index) => (
                  <TableRow key={jp.id}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">{jp.part.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(jp.unitPrice.toString())}</TableCell>
                    <TableCell className="text-center">{jp.quantity}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency((Number(jp.unitPrice) * jp.quantity).toString())}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* TOTALS & PAYMENT STATUS */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 pt-4">
          
          <div className="w-full md:w-1/2 print:break-inside-avoid">
            {invoice.isPaid ? (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-6 max-w-sm">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-500 font-bold text-xl mb-2">
                  <CheckCircle2 className="h-6 w-6" />
                  PAID IN FULL
                </div>
                <div className="space-y-1 text-sm text-green-800 dark:text-green-600/80">
                  <p>Method: <strong>{invoice.paymentMethod}</strong></p>
                  <p>Date: {invoice.paidAt ? format(new Date(invoice.paidAt), "MMM dd, yyyy HH:mm") : "-"}</p>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-6 max-w-sm print:hidden">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-500 font-bold text-xl mb-4">
                  <Clock className="h-6 w-6" />
                  UNPAID
                </div>
                <PaymentModal 
                  invoiceId={invoice.id} 
                  totalAmount={`${formatCurrency(invoice.totalAmount.toString())} ${currencySymbol}`}
                >
                  <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
                    Mark as Paid
                  </Button>
                </PaymentModal>
              </div>
            )}
            {!invoice.isPaid && <div className="hidden print:block text-2xl font-bold text-muted-foreground uppercase border-4 border-muted-foreground p-2 text-center w-48 rotate-[-10deg] opacity-40">Unpaid</div>}
          </div>

          <div className="w-full md:w-1/3 space-y-3 print:w-1/2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Parts Subtotal:</span>
              <span className="font-medium">{formatCurrency(invoice.partsTotal.toString())} {currencySymbol}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service Fee:</span>
              <span className="font-medium">{formatCurrency(invoice.serviceFee.toString())} {currencySymbol}</span>
            </div>
            <div className="border-t-2 border-foreground pt-3 flex justify-between items-center">
              <span className="font-bold text-lg">TOTAL:</span>
              <span className="font-bold text-2xl">{formatCurrency(invoice.totalAmount.toString())} {currencySymbol}</span>
            </div>
          </div>

        </div>
      </Card>

      <InvoiceActions jobId={params.id} invoiceId={invoice.id} />
    </div>
  )
}
