"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Check, ChevronsUpDown } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addPartToJob } from "@/actions/jobParts"
import { formatCurrency, getCurrencySymbol } from "@/lib/format"

const addPartSchema = z.object({
  partId: z.string().min(1, "Part is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
})

type AddPartFormValues = z.infer<typeof addPartSchema>

interface AddPartSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string
  parts: { id: string; name: string; stockQty: number; unitPrice: any }[]
}

export default function AddPartSheet({
  open,
  onOpenChange,
  jobId,
  parts,
}: AddPartSheetProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [openCombobox, setOpenCombobox] = useState(false)
  const currencySymbol = getCurrencySymbol()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddPartFormValues>({
    resolver: zodResolver(addPartSchema),
    defaultValues: {
      partId: "",
      quantity: 1,
    },
  })

  const partId = watch("partId")
  const quantity = watch("quantity")
  const selectedPart = parts.find((p) => p.id === partId)

  useEffect(() => {
    if (open) {
      reset({ partId: "", quantity: 1 })
    }
  }, [open, reset])

  const onSubmit = async (data: AddPartFormValues) => {
    if (!selectedPart) return

    if (data.quantity > selectedPart.stockQty) {
      toast.error(`Only ${selectedPart.stockQty} units available in stock.`)
      return
    }

    setIsLoading(true)

    try {
      const response = await addPartToJob(jobId, data)

      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success("Part added to job")
        if (response.warning) {
          toast.warning(response.warning) // Show the "last unit" warning if applicable
        }
        onOpenChange(false)
      }
    } catch (err) {
      toast.error("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  const lineTotal = selectedPart ? Number(selectedPart.unitPrice) * (quantity || 0) : 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add Part to Job</SheetTitle>
          <SheetDescription>
            Select a part from inventory to add to this job order.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label>Part <span className="text-destructive">*</span></Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className={cn("w-full justify-between h-auto py-3", !partId && "text-muted-foreground")}
                  disabled={isLoading}
                >
                  {selectedPart ? (
                    <div className="flex flex-col items-start">
                      <span>{selectedPart.name}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {formatCurrency(selectedPart.unitPrice.toString())} {currencySymbol}
                      </span>
                    </div>
                  ) : (
                    "Search parts..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Search parts..." />
                  <CommandList>
                    <CommandEmpty>No parts found.</CommandEmpty>
                    <CommandGroup>
                      {parts.map((part) => {
                        const isOutOfStock = part.stockQty <= 0
                        return (
                          <CommandItem
                            key={part.id}
                            value={part.name}
                            disabled={isOutOfStock}
                            onSelect={() => {
                              setValue("partId", part.id, { shouldValidate: true })
                              setOpenCombobox(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 shrink-0",
                                partId === part.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col flex-1">
                              <div className="flex items-center justify-between">
                                <span className={cn("font-medium", isOutOfStock && "text-muted-foreground line-through")}>
                                  {part.name}
                                </span>
                                <span className="text-sm font-semibold">
                                  {formatCurrency(part.unitPrice.toString())} {currencySymbol}
                                </span>
                              </div>
                              <span className={cn(
                                "text-xs",
                                isOutOfStock ? "text-destructive font-bold" : "text-muted-foreground"
                              )}>
                                {isOutOfStock ? "Out of Stock" : `${part.stockQty} in stock`}
                              </span>
                            </div>
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.partId && <p className="text-sm text-destructive">{errors.partId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity <span className="text-destructive">*</span></Label>
            <Input 
              id="quantity" 
              type="number"
              min="1"
              max={selectedPart?.stockQty || 1}
              disabled={isLoading || !selectedPart}
              {...register("quantity")} 
            />
            <div className="flex justify-between items-center text-xs">
              {errors.quantity ? (
                <span className="text-destructive">{errors.quantity.message}</span>
              ) : (
                <span className="text-muted-foreground">
                  Available: {selectedPart ? selectedPart.stockQty : "-"}
                </span>
              )}
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
            <span className="font-semibold">Line Total:</span>
            <span className="font-bold text-lg text-primary">
              {formatCurrency(lineTotal)} {currencySymbol}
            </span>
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
            <Button type="submit" disabled={isLoading || !selectedPart || quantity > (selectedPart?.stockQty || 0)}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add to Job
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
