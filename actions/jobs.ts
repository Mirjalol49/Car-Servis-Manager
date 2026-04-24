"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { uploadFile, deleteFile } from "@/lib/upload"
import { JobStatus, PhotoType } from "@prisma/client"
import { z } from "zod"

const BUCKET_NAME = "car-service-files"
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

// ---- Fetching Actions ----

export async function getJobOrders(filters?: { status?: string, search?: string }) {
  try {
    const whereClause: any = {}

    if (filters?.status && filters.status !== "ALL") {
      whereClause.status = filters.status as JobStatus
    }

    if (filters?.search) {
      whereClause.OR = [
        { id: { contains: filters.search, mode: 'insensitive' } },
        { car: { plateNumber: { contains: filters.search, mode: 'insensitive' } } },
      ]
    }

    const jobs = await prisma.jobOrder.findMany({
      where: whereClause,
      include: {
        car: {
          include: { customer: true }
        },
        master: true,
        _count: {
          select: { parts: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return { data: jobs }
  } catch (error) {
    console.error("Error fetching job orders:", error)
    return { error: "Failed to fetch job orders" }
  }
}

export async function getJobOrderById(id: string) {
  try {
    const job = await prisma.jobOrder.findUnique({
      where: { id },
      include: {
        car: {
          include: { customer: true }
        },
        master: true,
        photos: {
          orderBy: { createdAt: 'asc' }
        },
        parts: {
          include: { part: true }
        },
        invoice: true
      }
    })
    
    if (!job) return { error: "Job order not found" }
    return { data: job }
  } catch (error) {
    console.error("Error fetching job order details:", error)
    return { error: "Failed to fetch job order details" }
  }
}

export async function getMasters() {
  try {
    const masters = await prisma.master.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
    return { data: masters }
  } catch (error) {
    return { error: "Failed to fetch masters" }
  }
}

// ---- Mutation Actions ----

export async function createJobOrder(data: { carId: string, problemDescription: string, masterId?: string }) {
  try {
    if (!data.carId || !data.problemDescription || data.problemDescription.length < 10) {
      return { error: "Valid car and problem description (min 10 chars) are required" }
    }

    const job = await prisma.jobOrder.create({
      data: {
        carId: data.carId,
        problemDescription: data.problemDescription,
        masterId: data.masterId || null,
        status: JobStatus.WAITING,
      }
    })

    revalidatePath("/dashboard/jobs")
    return { success: true, data: job }
  } catch (error) {
    console.error("Error creating job order:", error)
    return { error: "Failed to create job order" }
  }
}

export async function updateJobStatus(id: string, status: JobStatus) {
  try {
    const job = await prisma.jobOrder.findUnique({ 
      where: { id },
      include: { photos: true } 
    })
    
    if (!job) return { error: "Job not found" }

    // Enforce transition rules
    if (status === JobStatus.DIAGNOSED && !job.diagnosisNotes) {
      return { error: "Cannot mark as diagnosed without diagnosis notes" }
    }
    
    if (status === JobStatus.IN_PROGRESS && !job.approvedByCustomer) {
      // Auto-approve if they jump to in-progress directly? No, force approval.
      // Wait, we can auto-approve it if status is moved to APPROVED.
      // Let's just update approvedByCustomer if status is >= APPROVED
    }

    if (status === JobStatus.COMPLETED) {
      const hasAfterPhotos = job.photos.some(p => p.type === PhotoType.AFTER)
      if (!hasAfterPhotos) {
        return { error: "Cannot complete job without AFTER photos" }
      }
    }

    const dataToUpdate: any = { status }

    if (status === JobStatus.APPROVED || status === JobStatus.IN_PROGRESS || status === JobStatus.COMPLETED || status === JobStatus.DELIVERED) {
      dataToUpdate.approvedByCustomer = true
    }

    // Auto-generate invoice if DELIVERED and doesn't exist (Placeholder logic)
    if (status === JobStatus.DELIVERED) {
      const existingInvoice = await prisma.invoice.findUnique({ where: { jobOrderId: id } })
      if (!existingInvoice) {
        // Will be implemented properly later, just a placeholder
      }
    }

    await prisma.jobOrder.update({
      where: { id },
      data: dataToUpdate
    })

    revalidatePath("/dashboard/jobs")
    revalidatePath(`/dashboard/jobs/${id}`)
    return { success: true }
  } catch (error) {
    console.error("Error updating job status:", error)
    return { error: "Failed to update job status" }
  }
}

export async function addDiagnosis(id: string, data: { diagnosisNotes: string, masterId?: string }) {
  try {
    if (!data.diagnosisNotes || data.diagnosisNotes.trim().length === 0) {
      return { error: "Diagnosis notes are required" }
    }

    const job = await prisma.jobOrder.update({
      where: { id },
      data: {
        diagnosisNotes: data.diagnosisNotes,
        masterId: data.masterId || null,
        status: JobStatus.DIAGNOSED // Auto-bump status
      }
    })

    revalidatePath("/dashboard/jobs")
    revalidatePath(`/dashboard/jobs/${id}`)
    return { success: true, data: job }
  } catch (error) {
    console.error("Error adding diagnosis:", error)
    return { error: "Failed to add diagnosis" }
  }
}

import { recalculateJobCosts } from "./jobParts"

export async function updateServiceFee(id: string, fee: number) {
  try {
    await prisma.jobOrder.update({
      where: { id },
      data: { serviceFee: fee }
    })
    
    // Recalculate totals
    await recalculateJobCosts(id)

    revalidatePath(`/dashboard/jobs/${id}`)
    return { success: true }
  } catch (error) {
    return { error: "Failed to update service fee" }
  }
}

// ---- Photo Actions ----

export async function addPhotos(id: string, type: "BEFORE" | "AFTER", formData: FormData) {
  try {
    const files = formData.getAll("files") as File[]
    
    if (!files || files.length === 0) {
      return { error: "No files provided" }
    }

    const job = await prisma.jobOrder.findUnique({ where: { id }, include: { photos: true } })
    if (!job) return { error: "Job not found" }

    const currentPhotosCount = job.photos.filter(p => p.type === type).length
    if (currentPhotosCount + files.length > 10) {
      return { error: `Maximum 10 ${type} photos allowed` }
    }

    const uploadPromises = files.map(async (file) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error("Invalid file type")
      if (file.size > MAX_IMAGE_SIZE) throw new Error("File too large (>5MB)")
      
      const folder = `jobs/${id}/${type.toLowerCase()}`
      const url = await uploadFile(file, BUCKET_NAME, folder)
      
      return prisma.jobPhoto.create({
        data: {
          jobOrderId: id,
          url,
          type: type as PhotoType
        }
      })
    })

    await Promise.all(uploadPromises)

    revalidatePath(`/dashboard/jobs/${id}`)
    return { success: true }
  } catch (error) {
    console.error("Error adding photos:", error)
    return { error: error instanceof Error ? error.message : "Failed to add photos" }
  }
}

export async function deletePhoto(photoId: string) {
  try {
    const photo = await prisma.jobPhoto.findUnique({ where: { id: photoId } })
    if (!photo) return { error: "Photo not found" }

    // Delete from Supabase
    await deleteFile(photo.url, BUCKET_NAME)

    // Delete from DB
    await prisma.jobPhoto.delete({ where: { id: photoId } })

    revalidatePath(`/dashboard/jobs/${photo.jobOrderId}`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting photo:", error)
    return { error: "Failed to delete photo" }
  }
}
