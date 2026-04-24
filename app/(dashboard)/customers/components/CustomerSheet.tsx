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
import { createCustomer, updateCustomer } from "@/actions/customers"

const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^\+998\d{9}$/, "Format: +998XXXXXXXXX"),
})

type CustomerFormValues = z.infer<typeof customerSchema>

interface CustomerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: {
    id: string
    name: string
    phone: string
  } | null
}

export default function CustomerSheet({
  open,
  onOpenChange,
  initialData,
}: CustomerSheetProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!initialData

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "+998",
    },
  })

  // Reset form when opened with new data or closed
  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.name,
          phone: initialData.phone,
        })
      } else {
        reset({
          name: "",
          phone: "+998",
        })
      }
    }
  }, [open, initialData, reset])

  const onSubmit = async (data: CustomerFormValues) => {
    setIsLoading(true)

    try {
      const response = isEditing
        ? await updateCustomer(initialData.id, data)
        : await createCustomer(data)

      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success(
          isEditing
            ? "Customer updated successfully"
            : "Customer saved successfully"
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
          <SheetTitle>{isEditing ? "Edit Customer" : "Add Customer"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update the customer's contact details below."
              : "Enter the customer's contact details to register them in the system."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              placeholder="e.g. Alisher Navoiy"
              disabled={isLoading} 
              {...register("name")} 
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              placeholder="+998901234567"
              disabled={isLoading} 
              {...register("phone")} 
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
            <p className="text-xs text-muted-foreground">Must be in format +998XXXXXXXXX</p>
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
              {isEditing ? "Save Changes" : "Save Customer"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
