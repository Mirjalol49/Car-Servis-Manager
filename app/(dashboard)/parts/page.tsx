import { getParts } from "@/actions/parts"
import { formatCurrency, getCurrencySymbol } from "@/lib/format"
import { Package, AlertTriangle, DollarSign } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import PartSearch from "./components/PartSearch"
import PartActions from "./components/PartActions"
import PartSheetWrapper from "./components/PartSheetWrapper"
import AdjustStockPopover from "./components/AdjustStockPopover"
import { cn } from "@/lib/utils"

export default async function PartsPage({
  searchParams,
}: {
  searchParams: { search?: string }
}) {
  const search = searchParams.search
  const { data, error } = await getParts(search)
  
  const parts = data?.parts || []
  const summary = data?.summary || { totalParts: 0, lowStockCount: 0, totalValue: 0 }
  const currencySymbol = getCurrencySymbol()

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parts Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Manage your auto parts, track stock levels, and update prices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PartSheetWrapper />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Parts Types</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalParts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary.lowStockCount}</div>
            <p className="text-xs text-muted-foreground pt-1">Parts with less than 5 units</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalValue)} {currencySymbol}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center">
        <PartSearch defaultValue={search} />
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
                <TableHead className="w-[300px]">Part Name</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Package className="h-10 w-10 mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-medium">No parts found</p>
                      {search ? (
                        <p className="text-sm mt-1">Try adjusting your search</p>
                      ) : (
                        <p className="text-sm mt-1">Add a new part to get started</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                parts.map((part) => {
                  const isLow = part.stockQty < 5;
                  const isMed = part.stockQty >= 5 && part.stockQty < 10;
                  return (
                    <TableRow key={part.id} className={cn(isLow && "bg-red-50/50 dark:bg-red-950/20")}>
                      <TableCell className="font-medium">
                        {part.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "font-bold",
                              isLow && "border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
                              isMed && "border-yellow-500 text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30",
                              !isLow && !isMed && "border-green-500 text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30"
                            )}
                          >
                            {part.stockQty} in stock
                          </Badge>
                          <AdjustStockPopover partId={part.id} currentStock={part.stockQty} />
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(part.unitPrice.toString())} {currencySymbol}
                      </TableCell>
                      <TableCell className="text-right">
                        <PartActions part={part} />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
