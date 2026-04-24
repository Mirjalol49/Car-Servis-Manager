"use client"

import { useState, useRef } from "react"
import { PhotoType } from "@prisma/client"
import { Loader2, Plus, Trash2, UploadCloud, X } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { addPhotos, deletePhoto } from "@/actions/jobs"
import { cn } from "@/lib/utils"

interface JobPhoto {
  id: string
  url: string
  createdAt: Date
}

interface PhotoUploadGridProps {
  jobId: string
  type: PhotoType
  photos: JobPhoto[]
}

export default function PhotoUploadGrid({ jobId, type, photos }: PhotoUploadGridProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Validation
    if (photos.length + files.length > 10) {
      toast.error(`You can only upload up to 10 ${type} photos.`)
      return
    }

    const invalidType = files.find(f => !["image/jpeg", "image/png", "image/webp"].includes(f.type))
    if (invalidType) {
      toast.error("All files must be JPG, PNG, or WEBP")
      return
    }

    const tooLarge = files.find(f => f.size > 5 * 1024 * 1024)
    if (tooLarge) {
      toast.error("All files must be less than 5MB")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      files.forEach(file => formData.append("files", file))

      const response = await addPhotos(jobId, type, formData)
      
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success(`Successfully uploaded ${files.length} photo(s)`)
      }
    } catch (error) {
      toast.error("Failed to upload photos")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDelete = async (photoId: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return

    setDeletingId(photoId)
    try {
      const response = await deletePhoto(photoId)
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success("Photo deleted")
      }
    } catch (error) {
      toast.error("Failed to delete photo")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold capitalize">{type.toLowerCase()} Photos</h3>
        <span className="text-sm text-muted-foreground font-medium">
          {photos.length} / 10
        </span>
      </div>

      {photos.length === 0 && !isUploading ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors border-muted-foreground/25 hover:bg-muted/25"
        >
          <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground/50 mb-4" />
          <p className="text-sm font-medium">Click to upload photos</p>
          <p className="text-xs text-muted-foreground mt-1">Up to 10 images (max 5MB each)</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border bg-muted group">
              <img 
                src={photo.url} 
                alt="Job photo" 
                className={cn(
                  "w-full h-full object-cover transition-opacity",
                  deletingId === photo.id && "opacity-50"
                )} 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2">
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => handleDelete(photo.id)}
                  disabled={deletingId === photo.id}
                >
                  {deletingId === photo.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white">
                <p className="text-[10px] font-medium opacity-80">
                  {format(new Date(photo.createdAt), "MMM d, h:mm a")}
                </p>
              </div>
            </div>
          ))}

          {isUploading && (
            <div className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center bg-muted/20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50 mb-2" />
              <p className="text-xs font-medium text-muted-foreground">Uploading...</p>
            </div>
          )}

          {photos.length < 10 && !isUploading && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-8 w-8 mb-1" />
              <p className="text-xs font-medium">Add More</p>
            </div>
          )}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        disabled={isUploading || photos.length >= 10}
      />
    </div>
  )
}
