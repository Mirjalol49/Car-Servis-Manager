"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createMaster, updateMaster } from "@/actions/masters"

const masterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^\+998\d{9}$/, "Must be in format +998XXXXXXXXX"),
  specialization: z.string().optional(),
})

type MasterFormValues = z.infer<typeof masterSchema>

interface MasterSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: {
    id: string
    name: string
    phone: string
    specialization: string | null
  } | null
}

const SPECIALIZATIONS = [
  "Engine",
  "Transmission",
  "Electrician",
  "Body & Paint",
  "Tires",
  "Diagnostics",
  "Suspension"
]

export default function MasterSheet({
  open,
  onOpenChange,
  initialData,
}: MasterSheetProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!initialData

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MasterFormValues>({
    resolver: zodResolver(masterSchema),
    defaultValues: {
      name: "",
      phone: "+998",
      specialization: "",
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.name,
          phone: initialData.phone,
          specialization: initialData.specialization || "",
        })
      } else {
        reset({
          name: "",
          phone: "+998",
          specialization: "",
        })
      }
    }
  }, [open, initialData, reset])

  const onSubmit = async (data: MasterFormValues) => {
    setIsLoading(true)

    try {
      const response = isEditing
        ? await updateMaster(initialData.id, data)
        : await createMaster(data)

      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success(
          isEditing
            ? "Master profile updated"
            : "Master created successfully"
        )
        onOpenChange(false)
      }
    } catch (err) {
      toast.error("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Master" : "Add Master"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update the master mechanic's details below."
              : "Register a new master mechanic to your team."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
            <Input 
              id="name" 
              placeholder="e.g. Alisher Rustamov"
              disabled={isLoading} 
              {...register("name")} 
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
            <Input 
              id="phone" 
              placeholder="+998901234567"
              disabled={isLoading} 
              {...register("phone")} 
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization</Label>
            <Input 
              id="specialization" 
              list="specialization-list"
              placeholder="Select or type..."
              disabled={isLoading} 
              {...register("specialization")} 
            />
            <datalist id="specialization-list">
              {SPECIALIZATIONS.map((spec) => (
                <option key={spec} value={spec} />
              ))}
            </datalist>
            {errors.specialization && (
              <p className="text-sm text-destructive">{errors.specialization.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Master"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
