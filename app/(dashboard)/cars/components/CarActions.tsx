"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Eye, Pencil, Trash2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
import CarSheet from "./CarSheet"
import { deleteCar } from "@/actions/cars"

interface CarActionsProps {
  car: {
    id: string
    plateNumber: string
    plateImageUrl: string
    attachmentUrl: string | null
    attachmentType: string | null
    customerId: string
  }
  customers: { id: string; name: string; phone: string }[]
}

export default function CarActions({ car, customers }: CarActionsProps) {
  const [showEditSheet, setShowEditSheet] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await deleteCar(car.id)
      
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success("Car deleted successfully")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/dashboard/cars/${car.id}`}>
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">View car details</span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>View details</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowEditSheet(true)}
            >
              <Pencil className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Edit car</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit car</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowDeleteDialog(true)}
              className="hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete car</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete car</TooltipContent>
        </Tooltip>
      </div>

      <CarSheet
        open={showEditSheet}
        onOpenChange={setShowEditSheet}
        customers={customers}
        initialData={car}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete car <strong>{car.plateNumber}</strong> and its associated files.
              This action cannot be undone. Cars with existing job orders cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
