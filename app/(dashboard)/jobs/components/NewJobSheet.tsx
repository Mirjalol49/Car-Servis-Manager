"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Check, ChevronsUpDown } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createJobOrder } from "@/actions/jobs"

const jobSchema = z.object({
  carId: z.string().min(1, "Please select a vehicle"),
  problemDescription: z.string().min(10, "Description must be at least 10 characters"),
  masterId: z.string().optional(),
})

type JobFormValues = z.infer<typeof jobSchema>

interface NewJobSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cars: { id: string; plateNumber: string; customer: { name: string } }[]
  masters: { id: string; name: string; specialization: string | null }[]
}

export default function NewJobSheet({
  open,
  onOpenChange,
  cars,
  masters,
}: NewJobSheetProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [openCombobox, setOpenCombobox] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      carId: "",
      problemDescription: "",
      masterId: undefined,
    },
  })

  const carId = watch("carId")
  const masterId = watch("masterId")

  useEffect(() => {
    if (open) {
      reset({ carId: "", problemDescription: "", masterId: undefined })
    }
  }, [open, reset])

  const onSubmit = async (data: JobFormValues) => {
    setIsLoading(true)

    try {
      const response = await createJobOrder(data)

      if (response.error || !response.data) {
        toast.error(response.error || "Failed to create job")
      } else {
        toast.success("Job order created successfully")
        onOpenChange(false)
        router.push(`/dashboard/jobs/${response.data.id}`)
      }
    } catch (err) {
      toast.error("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Job Order</SheetTitle>
          <SheetDescription>
            Register a new vehicle intake and describe the reported problem.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-6">
          
          {/* Car Selection */}
          <div className="space-y-2">
            <Label>Vehicle <span className="text-destructive">*</span></Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className={cn("w-full justify-between", !carId && "text-muted-foreground")}
                  disabled={isLoading}
                >
                  {carId
                    ? cars.find((c) => c.id === carId)?.plateNumber
                    : "Search plate number..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Search plate number..." className="uppercase" />
                  <CommandList>
                    <CommandEmpty>No vehicle found. Add car first.</CommandEmpty>
                    <CommandGroup>
                      {cars.map((car) => (
                        <CommandItem
                          key={car.id}
                          value={car.plateNumber}
                          onSelect={() => {
                            setValue("carId", car.id, { shouldValidate: true })
                            setOpenCombobox(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              carId === car.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-bold uppercase tracking-wider">{car.plateNumber}</span>
                            <span className="text-xs text-muted-foreground">{car.customer.name}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.carId && <p className="text-sm text-destructive">{errors.carId.message}</p>}
          </div>

          {/* Problem Description */}
          <div className="space-y-2">
            <Label htmlFor="problemDescription">Reported Problem <span className="text-destructive">*</span></Label>
            <Textarea 
              id="problemDescription" 
              placeholder="Client states that the engine makes a rattling noise on cold start..."
              className="min-h-[120px]"
              disabled={isLoading}
              {...register("problemDescription")}
            />
            {errors.problemDescription && <p className="text-sm text-destructive">{errors.problemDescription.message}</p>}
          </div>

          {/* Master Selection */}
          <div className="space-y-2">
            <Label>Assign Master (Optional)</Label>
            <Select 
              disabled={isLoading} 
              onValueChange={(val) => setValue("masterId", val === "unassigned" ? undefined : val)}
              value={masterId || "unassigned"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a master" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Leave Unassigned</SelectItem>
                {masters.map(master => (
                  <SelectItem key={master.id} value={master.id}>
                    {master.name} {master.specialization ? `(${master.specialization})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">You can assign a master later during diagnosis.</p>
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
              Create Job Order
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
