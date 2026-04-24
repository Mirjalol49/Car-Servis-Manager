"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Check, X, Pencil } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addDiagnosis } from "@/actions/jobs"

const diagnosisSchema = z.object({
  diagnosisNotes: z.string().min(10, "Diagnosis notes must be at least 10 characters"),
  masterId: z.string().optional(),
})

type DiagnosisFormValues = z.infer<typeof diagnosisSchema>

interface DiagnosisFormProps {
  jobId: string
  initialNotes: string | null
  initialMasterId: string | null
  masters: { id: string; name: string; specialization: string | null }[]
}

export default function DiagnosisForm({
  jobId,
  initialNotes,
  initialMasterId,
  masters
}: DiagnosisFormProps) {
  const [isEditing, setIsEditing] = useState(!initialNotes)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DiagnosisFormValues>({
    resolver: zodResolver(diagnosisSchema),
    defaultValues: {
      diagnosisNotes: initialNotes || "",
      masterId: initialMasterId || undefined,
    },
  })

  const masterId = watch("masterId")

  const onSubmit = async (data: DiagnosisFormValues) => {
    setIsLoading(true)

    try {
      const response = await addDiagnosis(jobId, data)
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success("Diagnosis saved successfully")
        setIsEditing(false)
      }
    } catch (err) {
      toast.error("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-md bg-muted/30 border border-muted">
          <p className="text-sm whitespace-pre-wrap">{initialNotes}</p>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Diagnosis
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border rounded-md p-4 bg-card shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="diagnosisNotes">Diagnosis Notes <span className="text-destructive">*</span></Label>
        <Textarea 
          id="diagnosisNotes" 
          placeholder="Describe the findings and required repairs..."
          className="min-h-[120px]"
          disabled={isLoading}
          {...register("diagnosisNotes")}
        />
        {errors.diagnosisNotes && <p className="text-sm text-destructive">{errors.diagnosisNotes.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Assigned Master</Label>
        <Select 
          disabled={isLoading} 
          onValueChange={(val) => setValue("masterId", val === "unassigned" ? undefined : val)}
          value={masterId || "unassigned"}
        >
          <SelectTrigger>
            <SelectValue placeholder="Assign a master" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {masters.map(master => (
              <SelectItem key={master.id} value={master.id}>
                {master.name} {master.specialization ? `(${master.specialization})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        {initialNotes && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsEditing(false)}
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          Save Diagnosis
        </Button>
      </div>
    </form>
  )
}
