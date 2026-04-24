import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { JobStatus, PhotoType } from "@prisma/client"
import { Car, User, UserCircle, Settings, ClipboardList, AlertCircle, Plus } from "lucide-react"

import { getJobOrderById, getMasters } from "@/actions/jobs"
import { getParts } from "@/actions/parts"
import { formatCurrency, formatPhone } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import JobStatusBadge from "../components/JobStatusBadge"
import StatusTransitionMenu from "./components/StatusTransitionMenu"
import DiagnosisForm from "./components/DiagnosisForm"
import PhotoUploadGrid from "./components/PhotoUploadGrid"
import JobPartsTable from "./components/JobPartsTable"
import CostSummaryCard from "./components/CostSummaryCard"

export default async function JobDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { data: job, error } = await getJobOrderById(params.id)
  
  if (error || !job) {
    notFound()
  }

  // Fetch masters for the diagnosis form
  const { data: masters = [] } = await getMasters()
  
  // Fetch parts inventory for the Add Parts sheet
  const { data: partsData } = await getParts()
  const partsInventory = partsData?.parts || []

  const beforePhotos = job.photos.filter(p => p.type === PhotoType.BEFORE)
  const afterPhotos = job.photos.filter(p => p.type === PhotoType.AFTER)
  
  // A job is locked for most edits if it is completed or delivered
  const isLocked = job.status === "COMPLETED" || job.status === "DELIVERED"
  const canShowAfterPhotos = job.status === "IN_PROGRESS" || job.status === "COMPLETED" || job.status === "DELIVERED"
  
  const totalPartsCost = job.parts.reduce((acc, jp) => acc + (jp.quantity * Number(jp.unitPrice)), 0)
  const serviceFeeNum = Number(job.serviceFee)
  const estimatedTotal = totalPartsCost + serviceFeeNum

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black tracking-tight">
              Job #{job.id.slice(-6).toUpperCase()}
            </h1>
            <JobStatusBadge status={job.status} />
          </div>
          <p className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            <ClipboardList className="h-4 w-4" />
            Created on {format(new Date(job.createdAt), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <StatusTransitionMenu jobId={job.id} currentStatus={job.status as JobStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CAR & CUSTOMER LINKS */}
        <Card className="md:col-span-1 border-muted bg-muted/10 shadow-none">
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Vehicle</h3>
              <Link href={`/dashboard/cars/${job.car.id}`} className="group flex items-center gap-3">
                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold uppercase tracking-wider group-hover:underline">{job.car.plateNumber}</p>
                </div>
              </Link>
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Customer</h3>
              <Link href={`/dashboard/customers/${job.car.customer.id}`} className="group flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-secondary transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold group-hover:underline">{job.car.customer.name}</p>
                  <p className="text-sm text-muted-foreground">{formatPhone(job.car.customer.phone)}</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* PROBLEM & DIAGNOSIS */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                Reported Problem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{job.problemDescription}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  Diagnosis & Assignment
                </CardTitle>
                <CardDescription>Master mechanic's findings and repair plan</CardDescription>
              </div>
              
              {job.master && (
                <div className="flex items-center gap-2 bg-muted/50 rounded-full pl-1 pr-3 py-1 border">
                  <UserCircle className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">{job.master.name}</span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {isLocked ? (
                 <div className="p-4 rounded-md bg-muted/30 border border-muted">
                   <p className="text-sm whitespace-pre-wrap">{job.diagnosisNotes || "No diagnosis notes recorded."}</p>
                 </div>
              ) : (
                <DiagnosisForm 
                  jobId={job.id} 
                  initialNotes={job.diagnosisNotes} 
                  initialMasterId={job.masterId} 
                  masters={masters} 
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* PHOTOS SECTION */}
      <div className="space-y-8 pt-6 border-t">
        <PhotoUploadGrid 
          jobId={job.id} 
          type="BEFORE" 
          photos={beforePhotos} 
        />

        {canShowAfterPhotos && (
          <div className="pt-6 border-t border-dashed">
            <PhotoUploadGrid 
              jobId={job.id} 
              type="AFTER" 
              photos={afterPhotos} 
            />
          </div>
        )}
      </div>

      {/* PARTS & COSTS SECTION */}
      <div className="pt-8 border-t">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Parts & Costs Estimate</h2>
        
        <div className="grid md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2">
            <JobPartsTable 
              jobId={job.id} 
              jobParts={job.parts} 
              availableParts={partsInventory} 
              isLocked={isLocked || job.status === "APPROVED"} 
            />
          </div>

          <CostSummaryCard 
            jobId={job.id}
            partsTotal={totalPartsCost}
            serviceFee={serviceFeeNum}
            totalEstimate={estimatedTotal}
            isLocked={isLocked}
            isApproved={job.status !== "WAITING" && job.status !== "DIAGNOSED"}
            jobStatus={job.status}
            hasInvoice={!!job.invoice}
          />
        </div>
      </div>
      
    </div>
  )
}
