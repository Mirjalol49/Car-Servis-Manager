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
import { createPart, updatePart } from "@/actions/parts"

const partSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  stockQty: z.coerce.number().int().min(0, "Stock cannot be negative"),
  unitPrice: z.coerce.number().min(0, "Price cannot be negative"),
})

type PartFormValues = z.infer<typeof partSchema>

interface PartSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: {
    id: string
    name: string
    stockQty: number
    unitPrice: any // Decimal string or number
  } | null
}

export default function PartSheet({
  open,
  onOpenChange,
  initialData,
}: PartSheetProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!initialData

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PartFormValues>({
    resolver: zodResolver(partSchema),
    defaultValues: {
      name: "",
      stockQty: 0,
      unitPrice: 0,
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.name,
          stockQty: initialData.stockQty,
          unitPrice: Number(initialData.unitPrice),
        })
      } else {
        reset({
          name: "",
          stockQty: 0,
          unitPrice: 0,
        })
      }
    }
  }, [open, initialData, reset])

  const onSubmit = async (data: PartFormValues) => {
    setIsLoading(true)

    try {
      const response = isEditing
        ? await updatePart(initialData.id, data)
        : await createPart(data)

      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success(
          isEditing
            ? "Part updated successfully"
            : "Part added successfully"
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
          <SheetTitle>{isEditing ? "Edit Part" : "Add Part"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update the part details below."
              : "Register a new part to your inventory."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="name">Part Name <span className="text-destructive">*</span></Label>
            <Input 
              id="name" 
              placeholder="e.g. Brake Pads (Front)"
              disabled={isLoading} 
              {...register("name")} 
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stockQty">Initial Stock Qty</Label>
              <Input 
                id="stockQty" 
                type="number"
                disabled={isLoading || isEditing} // Don't allow changing stock qty via edit form ideally, use adjust stock
                {...register("stockQty")} 
              />
              {errors.stockQty && (
                <p className="text-sm text-destructive">{errors.stockQty.message}</p>
              )}
              {isEditing && <p className="text-[10px] text-muted-foreground">Use Adjust Stock button to modify inventory levels.</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price (UZS) <span className="text-destructive">*</span></Label>
              <Input 
                id="unitPrice" 
                type="number"
                step="0.01"
                disabled={isLoading} 
                {...register("unitPrice")} 
              />
              {errors.unitPrice && (
                <p className="text-sm text-destructive">{errors.unitPrice.message}</p>
              )}
            </div>
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
              {isEditing ? "Save Changes" : "Add Part"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
