"use client"

import { useState } from "react"
import Link from "next/link"
import { MoreHorizontal, Pencil, Power, PowerOff, User, AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { getAvatarColor, getInitials, cn } from "@/lib/utils"
import { formatPhone } from "@/lib/format"
import { toggleMasterActive } from "@/actions/masters"
import MasterSheet from "./MasterSheet"

interface MasterCardProps {
  master: {
    id: string
    name: string
    phone: string
    specialization: string | null
    isActive: boolean
    activeJobsCount: number
    completedJobsCount: number
  }
}

export default function MasterCard({ master }: MasterCardProps) {
  const [showEditSheet, setShowEditSheet] = useState(false)
  const [showToggleDialog, setShowToggleDialog] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const avatarColor = getAvatarColor(master.id)
  const initials = getInitials(master.name)

  const handleToggleActive = async () => {
    setIsToggling(true)
    try {
      const response = await toggleMasterActive(master.id)
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success(master.isActive ? "Master deactivated" : "Master activated")
      }
    } catch (error) {
      toast.error("Failed to toggle status")
    } finally {
      setIsToggling(false)
      setShowToggleDialog(false)
    }
  }

  const handleToggleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (master.isActive && master.activeJobsCount > 0) {
      setShowToggleDialog(true)
    } else {
      handleToggleActive()
    }
  }

  return (
    <>
      <Card className={cn("overflow-hidden transition-all hover:shadow-md", !master.isActive && "opacity-75 grayscale-[0.2]")}>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className={cn("flex h-16 w-16 items-center justify-center rounded-full text-white text-xl font-bold shadow-sm", avatarColor)}>
              {initials}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="-mr-2 -mt-2">
                  <MoreHorizontal className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/masters/${master.id}`} className="cursor-pointer flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    View Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowEditSheet(true)} className="cursor-pointer flex items-center">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleToggleClick} 
                  disabled={isToggling}
                  className={cn("cursor-pointer flex items-center font-medium", master.isActive ? "text-destructive" : "text-green-600")}
                >
                  {master.isActive ? (
                    <><PowerOff className="mr-2 h-4 w-4" /> Deactivate</>
                  ) : (
                    <><Power className="mr-2 h-4 w-4" /> Activate</>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-1 mb-6">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg truncate" title={master.name}>{master.name}</h3>
              {master.isActive ? (
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Active</Badge>
              ) : (
                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Inactive</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate" title={master.specialization || "General Mechanic"}>
              {master.specialization || "General Mechanic"}
            </p>
            <p className="text-sm font-medium pt-1">
              {formatPhone(master.phone)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm border-t pt-4">
            <div className="flex flex-col">
              <span className="text-muted-foreground">Active Jobs</span>
              <span className="font-semibold">{master.activeJobsCount}</span>
            </div>
            <div className="flex flex-col border-l pl-4">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-semibold">{master.completedJobsCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <MasterSheet
        open={showEditSheet}
        onOpenChange={setShowEditSheet}
        initialData={master}
      />

      <AlertDialog open={showToggleDialog} onOpenChange={setShowToggleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Active Jobs Warning
            </AlertDialogTitle>
            <AlertDialogDescription>
              This master currently has <strong>{master.activeJobsCount} active job(s)</strong> assigned to them. 
              Deactivating will <strong>not</strong> unassign them from these jobs automatically, but they will be hidden from assignment lists for new jobs.
              <br /><br />
              Are you sure you want to deactivate {master.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isToggling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleToggleActive()
              }}
              disabled={isToggling}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {isToggling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Deactivate Master"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
