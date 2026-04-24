"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { uploadFile, deleteFile } from "@/lib/upload"
import { z } from "zod"

const BUCKET_NAME = "car-service-files"
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_PDF_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
const ALLOWED_PDF_TYPE = "application/pdf"

export async function getCars(search?: string) {
  try {
    const cars = await prisma.car.findMany({
      where: search ? {
        OR: [
          { plateNumber: { contains: search, mode: 'insensitive' } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
        ]
      } : undefined,
      include: {
        customer: {
          select: { name: true }
        },
        _count: {
          select: { jobOrders: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return { data: cars }
  } catch (error) {
    console.error("Error fetching cars:", error)
    return { error: "Failed to fetch cars" }
  }
}

export async function getCarById(id: string) {
  try {
    const car = await prisma.car.findUnique({
      where: { id },
      include: {
        customer: true,
        jobOrders: {
          orderBy: { createdAt: 'desc' },
          include: {
            car: true
          }
        }
      }
    })
    
    if (!car) {
      return { error: "Car not found" }
    }
    
    return { data: car }
  } catch (error) {
    console.error("Error fetching car details:", error)
    return { error: "Failed to fetch car details" }
  }
}

export async function createCar(formData: FormData) {
  try {
    const plateNumber = formData.get("plateNumber") as string
    const customerId = formData.get("customerId") as string
    const plateImage = formData.get("plateImage") as File | null
    const attachment = formData.get("attachment") as File | null

    if (!plateNumber || !customerId || !plateImage) {
      return { error: "Plate number, customer, and plate image are required" }
    }

    const uppercasePlate = plateNumber.toUpperCase()
    if (!/^[0-9]{2}[A-Z]{1}[0-9]{3}[A-Z]{2}$/.test(uppercasePlate)) {
      return { error: "Invalid plate number format (e.g., 01A234BC)" }
    }

    const existingCar = await prisma.car.findUnique({
      where: { plateNumber: uppercasePlate }
    })

    if (existingCar) {
      return { error: "A car with this plate number already exists" }
    }

    // Validate plate image
    if (!ALLOWED_IMAGE_TYPES.includes(plateImage.type)) {
      return { error: "Plate image must be JPG, PNG, or WEBP" }
    }
    if (plateImage.size > MAX_IMAGE_SIZE) {
      return { error: "Plate image must be less than 5MB" }
    }

    let attachmentUrl = null
    let attachmentType = null

    // Validate optional attachment
    if (attachment && attachment.size > 0) {
      if (!ALLOWED_IMAGE_TYPES.includes(attachment.type) && attachment.type !== ALLOWED_PDF_TYPE) {
        return { error: "Attachment must be an image or PDF" }
      }
      
      const maxSize = attachment.type === ALLOWED_PDF_TYPE ? MAX_PDF_SIZE : MAX_IMAGE_SIZE
      if (attachment.size > maxSize) {
        return { error: `Attachment exceeds maximum size limit` }
      }
      
      attachmentType = attachment.type === ALLOWED_PDF_TYPE ? "pdf" : "image"
    }

    // Upload files
    const plateImageUrl = await uploadFile(plateImage, BUCKET_NAME, "plates")
    
    if (attachment && attachment.size > 0) {
      attachmentUrl = await uploadFile(attachment, BUCKET_NAME, "attachments")
    }

    // Save to DB
    const car = await prisma.car.create({
      data: {
        plateNumber: uppercasePlate,
        plateImageUrl,
        attachmentUrl,
        attachmentType,
        customerId
      }
    })

    revalidatePath("/dashboard/cars")
    revalidatePath(`/dashboard/customers/${customerId}`)
    return { success: true, data: car }
  } catch (error) {
    console.error("Error creating car:", error)
    return { error: error instanceof Error ? error.message : "Failed to create car" }
  }
}

export async function updateCar(id: string, formData: FormData) {
  try {
    const plateNumber = formData.get("plateNumber") as string
    const customerId = formData.get("customerId") as string
    const plateImage = formData.get("plateImage") as File | null
    const attachment = formData.get("attachment") as File | null
    const removeAttachment = formData.get("removeAttachment") === "true"

    if (!plateNumber || !customerId) {
      return { error: "Plate number and customer are required" }
    }

    const uppercasePlate = plateNumber.toUpperCase()
    if (!/^[0-9]{2}[A-Z]{1}[0-9]{3}[A-Z]{2}$/.test(uppercasePlate)) {
      return { error: "Invalid plate number format (e.g., 01A234BC)" }
    }

    const existingCar = await prisma.car.findUnique({
      where: { plateNumber: uppercasePlate }
    })

    if (existingCar && existingCar.id !== id) {
      return { error: "This plate number is already registered to another car" }
    }

    const currentCar = await prisma.car.findUnique({ where: { id } })
    if (!currentCar) return { error: "Car not found" }

    let plateImageUrl = currentCar.plateImageUrl
    let attachmentUrl = currentCar.attachmentUrl
    let attachmentType = currentCar.attachmentType

    // Process new plate image if provided
    if (plateImage && plateImage.size > 0) {
      if (!ALLOWED_IMAGE_TYPES.includes(plateImage.type)) {
        return { error: "Plate image must be JPG, PNG, or WEBP" }
      }
      if (plateImage.size > MAX_IMAGE_SIZE) {
        return { error: "Plate image must be less than 5MB" }
      }
      
      const newUrl = await uploadFile(plateImage, BUCKET_NAME, "plates")
      if (plateImageUrl) await deleteFile(plateImageUrl, BUCKET_NAME)
      plateImageUrl = newUrl
    }

    // Process attachment removal or new attachment
    if (removeAttachment) {
      if (attachmentUrl) await deleteFile(attachmentUrl, BUCKET_NAME)
      attachmentUrl = null
      attachmentType = null
    } else if (attachment && attachment.size > 0) {
      if (!ALLOWED_IMAGE_TYPES.includes(attachment.type) && attachment.type !== ALLOWED_PDF_TYPE) {
        return { error: "Attachment must be an image or PDF" }
      }
      
      const maxSize = attachment.type === ALLOWED_PDF_TYPE ? MAX_PDF_SIZE : MAX_IMAGE_SIZE
      if (attachment.size > maxSize) {
        return { error: `Attachment exceeds maximum size limit` }
      }
      
      const newUrl = await uploadFile(attachment, BUCKET_NAME, "attachments")
      if (attachmentUrl) await deleteFile(attachmentUrl, BUCKET_NAME)
      
      attachmentUrl = newUrl
      attachmentType = attachment.type === ALLOWED_PDF_TYPE ? "pdf" : "image"
    }

    const updatedCar = await prisma.car.update({
      where: { id },
      data: {
        plateNumber: uppercasePlate,
        plateImageUrl,
        attachmentUrl,
        attachmentType,
        customerId
      }
    })

    revalidatePath("/dashboard/cars")
    revalidatePath(`/dashboard/cars/${id}`)
    if (currentCar.customerId !== customerId) {
      revalidatePath(`/dashboard/customers/${currentCar.customerId}`)
      revalidatePath(`/dashboard/customers/${customerId}`)
    }
    
    return { success: true, data: updatedCar }
  } catch (error) {
    console.error("Error updating car:", error)
    return { error: error instanceof Error ? error.message : "Failed to update car" }
  }
}

export async function deleteCar(id: string) {
  try {
    const car = await prisma.car.findUnique({
      where: { id },
      include: {
        _count: {
          select: { jobOrders: true }
        }
      }
    })

    if (!car) {
      return { error: "Car not found" }
    }

    if (car._count.jobOrders > 0) {
      return { error: "Cannot delete car with existing job orders." }
    }

    // Delete files from storage
    if (car.plateImageUrl) {
      await deleteFile(car.plateImageUrl, BUCKET_NAME)
    }
    if (car.attachmentUrl) {
      await deleteFile(car.attachmentUrl, BUCKET_NAME)
    }

    await prisma.car.delete({
      where: { id }
    })

    revalidatePath("/dashboard/cars")
    revalidatePath(`/dashboard/customers/${car.customerId}`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting car:", error)
    return { error: "Failed to delete car" }
  }
}
