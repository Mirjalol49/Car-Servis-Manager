import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ExternalLink, FileText, Plus, User as UserIcon, Wrench, Download } from "lucide-react"

import { getCarById } from "@/actions/cars"
import { formatCurrency, formatPhone } from "@/lib/format"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function CarDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { data: car, error } = await getCarById(params.id)

  if (error || !car) {
    notFound()
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-widest uppercase">{car.plateNumber}</h1>
          <p className="text-muted-foreground mt-1">
            Registered on {format(new Date(car.createdAt), "MMMM d, yyyy")}
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-12">
        {/* LEFT COLUMN */}
        <div className="md:col-span-4 space-y-6">
          
          {/* Plate Image */}
          <Card className="overflow-hidden">
            <div className="bg-muted aspect-video relative group">
              <img 
                src={car.plateImageUrl} 
                alt={`Plate ${car.plateNumber}`} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="secondary" size="sm" asChild>
                  <a href={car.plateImageUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Original
                  </a>
                </Button>
              </div>
            </div>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-center text-muted-foreground">Verified Plate Image</p>
            </CardContent>
          </Card>

          {/* Attachment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Car Document</CardTitle>
            </CardHeader>
            <CardContent>
              {car.attachmentUrl ? (
                <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/20 text-center">
                  {car.attachmentType === "pdf" ? (
                    <FileText className="h-16 w-16 text-blue-500 mb-4" />
                  ) : (
                    <div className="w-full aspect-video rounded overflow-hidden mb-4 relative group">
                      <img src={car.attachmentUrl} alt="Document" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={car.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-white">
                          <ExternalLink className="h-8 w-8" />
                        </a>
                      </div>
                    </div>
                  )}
                  <p className="font-medium mb-1">
                    {car.attachmentType === "pdf" ? "PDF Document" : "Image Document"}
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <a href={car.attachmentUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border border-dashed rounded-lg">
                  <FileText className="h-10 w-10 mb-2 opacity-50" />
                  <p className="text-sm">No document attached</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Owner Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{car.customer.name}</p>
                  <p className="text-sm text-muted-foreground">{formatPhone(car.customer.phone)}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 pt-4">
              <Button variant="ghost" className="w-full" asChild>
                <Link href={`/dashboard/customers/${car.customerId}`}>
                  View Customer Profile
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="md:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Service History</h2>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Job Order
            </Button>
          </div>

          {car.jobOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center bg-muted/10">
              <Wrench className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">No service history</h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                This vehicle has no recorded service jobs in the system. Click the button above to create the first job order.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {car.jobOrders.map((job) => (
                <Card key={job.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                  <div className="border-l-4 border-l-primary p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-lg">Job #{job.id.slice(-6).toUpperCase()}</h3>
                          <Badge variant={
                            job.status === "COMPLETED" || job.status === "DELIVERED" ? "default" :
                            job.status === "WAITING" ? "secondary" : "outline"
                          }>
                            {job.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">
                          {format(new Date(job.createdAt), "EEEE, MMMM d, yyyy")}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Total Cost</p>
                        <p className="font-bold text-lg">
                          {job.totalCost ? `${formatCurrency(job.totalCost.toString())} UZS` : "Pending"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground font-medium mb-1">Problem Description</p>
                      <p className="text-sm">{job.problemDescription}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
