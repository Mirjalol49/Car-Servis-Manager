"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Check, ChevronsUpDown, UploadCloud, FileText, X } from "lucide-react"
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
import { createCar, updateCar } from "@/actions/cars"
import { formatPhone } from "@/lib/format"

const carSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  plateNumber: z.string().regex(/^[0-9]{2}[A-Z]{1}[0-9]{3}[A-Z]{2}$/, "Format: 01A234BC"),
})

type CarFormValues = z.infer<typeof carSchema>

interface CarSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: { id: string; name: string; phone: string }[]
  initialData?: {
    id: string
    plateNumber: string
    plateImageUrl: string
    attachmentUrl: string | null
    attachmentType: string | null
    customerId: string
  } | null
}

export default function CarSheet({
  open,
  onOpenChange,
  customers,
  initialData,
}: CarSheetProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [openCombobox, setOpenCombobox] = useState(false)
  
  // File state
  const [plateImageFile, setPlateImageFile] = useState<File | null>(null)
  const [plateImagePreview, setPlateImagePreview] = useState<string | null>(null)
  
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)
  const [attachmentType, setAttachmentType] = useState<"image" | "pdf" | null>(null)
  const [removeAttachment, setRemoveAttachment] = useState(false)

  const plateInputRef = useRef<HTMLInputElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)

  const isEditing = !!initialData

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CarFormValues>({
    resolver: zodResolver(carSchema),
    defaultValues: {
      customerId: "",
      plateNumber: "",
    },
  })

  const customerId = watch("customerId")

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          customerId: initialData.customerId,
          plateNumber: initialData.plateNumber,
        })
        setPlateImagePreview(initialData.plateImageUrl)
        
        if (initialData.attachmentUrl) {
          setAttachmentPreview(initialData.attachmentUrl)
          setAttachmentType(initialData.attachmentType as "image" | "pdf")
        } else {
          setAttachmentPreview(null)
          setAttachmentType(null)
        }
      } else {
        reset({ customerId: "", plateNumber: "" })
        setPlateImagePreview(null)
        setAttachmentPreview(null)
        setAttachmentType(null)
      }
      setPlateImageFile(null)
      setAttachmentFile(null)
      setRemoveAttachment(false)
    }
  }, [open, initialData, reset])

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (plateImagePreview && !plateImagePreview.startsWith("http")) URL.revokeObjectURL(plateImagePreview)
      if (attachmentPreview && !attachmentPreview.startsWith("http")) URL.revokeObjectURL(attachmentPreview)
    }
  }, [plateImagePreview, attachmentPreview])

  const handlePlateImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB")
        return
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast.error("Image must be JPG, PNG, or WEBP")
        return
      }
      setPlateImageFile(file)
      setPlateImagePreview(URL.createObjectURL(file))
    }
  }

  const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const isPdf = file.type === "application/pdf"
      const isImage = ["image/jpeg", "image/png", "image/webp"].includes(file.type)
      
      if (!isPdf && !isImage) {
        toast.error("Attachment must be an Image or PDF")
        return
      }

      const maxSize = isPdf ? 10 * 1024 * 1024 : 5 * 1024 * 1024
      if (file.size > maxSize) {
        toast.error(`File must be less than ${isPdf ? '10MB' : '5MB'}`)
        return
      }

      setAttachmentFile(file)
      setAttachmentType(isPdf ? "pdf" : "image")
      setRemoveAttachment(false)
      
      if (isPdf) {
        setAttachmentPreview(file.name)
      } else {
        setAttachmentPreview(URL.createObjectURL(file))
      }
    }
  }

  const handleClearAttachment = () => {
    setAttachmentFile(null)
    setAttachmentPreview(null)
    setAttachmentType(null)
    setRemoveAttachment(true)
    if (attachmentInputRef.current) attachmentInputRef.current.value = ""
  }

  const onSubmit = async (data: CarFormValues) => {
    if (!isEditing && !plateImageFile) {
      toast.error("Plate image is required")
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("customerId", data.customerId)
      formData.append("plateNumber", data.plateNumber)
      
      if (plateImageFile) formData.append("plateImage", plateImageFile)
      if (attachmentFile) formData.append("attachment", attachmentFile)
      if (removeAttachment) formData.append("removeAttachment", "true")

      const response = isEditing
        ? await updateCar(initialData.id, formData)
        : await createCar(formData)

      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success(isEditing ? "Car updated successfully" : "Car created successfully")
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
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Car" : "Add Car"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update the car details and attachments below."
              : "Register a new car and upload its documents."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-6">
          
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label>Customer</Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className={cn("w-full justify-between", !customerId && "text-muted-foreground")}
                  disabled={isLoading}
                >
                  {customerId
                    ? customers.find((c) => c.id === customerId)?.name
                    : "Select customer..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Search customer name or phone..." />
                  <CommandList>
                    <CommandEmpty>No customer found.</CommandEmpty>
                    <CommandGroup>
                      {customers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={`${customer.name} ${customer.phone}`}
                          onSelect={() => {
                            setValue("customerId", customer.id, { shouldValidate: true })
                            setOpenCombobox(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              customerId === customer.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{customer.name}</span>
                            <span className="text-xs text-muted-foreground">{formatPhone(customer.phone)}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.customerId && <p className="text-sm text-destructive">{errors.customerId.message}</p>}
          </div>

          {/* Plate Number */}
          <div className="space-y-2">
            <Label htmlFor="plateNumber">Plate Number</Label>
            <Input 
              id="plateNumber" 
              placeholder="01A234BC"
              disabled={isLoading}
              {...register("plateNumber")}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase()
                register("plateNumber").onChange(e)
              }}
              className="uppercase"
            />
            {errors.plateNumber && <p className="text-sm text-destructive">{errors.plateNumber.message}</p>}
            <p className="text-xs text-muted-foreground">Format: XX000XX or 01A234BC</p>
          </div>

          {/* Plate Image Upload */}
          <div className="space-y-2">
            <Label>Plate Image <span className="text-destructive">*</span></Label>
            <div 
              className={cn(
                "border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer text-center",
                plateImagePreview ? "bg-muted/50 border-muted" : "border-muted-foreground/25 hover:bg-muted/25"
              )}
              onClick={() => !isLoading && plateInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={plateInputRef}
                className="hidden" 
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePlateImageSelect}
                disabled={isLoading}
              />
              
              {plateImagePreview ? (
                <div className="relative w-full aspect-video rounded overflow-hidden flex items-center justify-center bg-black/5">
                  <img src={plateImagePreview} alt="Plate preview" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                  <UploadCloud className="h-10 w-10 mb-2 opacity-50" />
                  <p className="text-sm font-medium">Click to upload plate image</p>
                  <p className="text-xs opacity-75 mt-1">JPG, PNG or WEBP (max. 5MB)</p>
                </div>
              )}
            </div>
          </div>

          {/* Attachment Upload */}
          <div className="space-y-2">
            <Label>Car Document / Inspection Report (Optional)</Label>
            
            {attachmentPreview ? (
              <div className="relative border rounded-lg p-4 flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-3 overflow-hidden">
                  {attachmentType === "pdf" ? (
                    <FileText className="h-8 w-8 text-blue-500 shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded overflow-hidden shrink-0 bg-black/5 flex items-center justify-center">
                      {attachmentPreview.startsWith("http") ? (
                        <img src={attachmentPreview} alt="Attachment" className="h-full w-full object-cover" />
                      ) : (
                        <img src={attachmentPreview} alt="Attachment" className="h-full w-full object-cover" />
                      )}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-sm font-medium truncate">
                      {attachmentType === "pdf" ? (attachmentFile?.name || "Document.pdf") : "Image attached"}
                    </p>
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleClearAttachment}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer text-center border-muted-foreground/25 hover:bg-muted/25"
                onClick={() => !isLoading && attachmentInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={attachmentInputRef}
                  className="hidden" 
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleAttachmentSelect}
                  disabled={isLoading}
                />
                <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
                  <UploadCloud className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">Click to upload document</p>
                  <p className="text-xs opacity-75 mt-1">PDF or Image (max. 10MB for PDF)</p>
                </div>
              </div>
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
              {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Save Car"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
