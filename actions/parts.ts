"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { z } from "zod"

const partSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  stockQty: z.coerce.number().int().min(0, "Stock cannot be negative"),
  unitPrice: z.coerce.number().min(0, "Price cannot be negative"),
})

export type PartFormValues = z.infer<typeof partSchema>

export async function getParts(search?: string) {
  try {
    const parts = await prisma.part.findMany({
      where: search ? {
        name: { contains: search, mode: 'insensitive' }
      } : undefined,
      orderBy: { name: 'asc' }
    })
    
    // Calculate summaries
    const totalParts = parts.length
    const lowStockCount = parts.filter(p => p.stockQty < 5).length
    const totalValue = parts.reduce((acc, p) => acc + (p.stockQty * Number(p.unitPrice)), 0)

    return { 
      data: {
        parts,
        summary: { totalParts, lowStockCount, totalValue }
      } 
    }
  } catch (error) {
    console.error("Error fetching parts:", error)
    return { error: "Failed to fetch parts" }
  }
}

export async function createPart(data: PartFormValues) {
  try {
    const validatedData = partSchema.parse(data)

    const part = await prisma.part.create({
      data: validatedData
    })

    revalidatePath("/dashboard/parts")
    return { success: true, data: part }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    console.error("Error creating part:", error)
    return { error: "Failed to create part" }
  }
}

export async function updatePart(id: string, data: PartFormValues) {
  try {
    const validatedData = partSchema.parse(data)

    const part = await prisma.part.update({
      where: { id },
      data: validatedData
    })

    revalidatePath("/dashboard/parts")
    return { success: true, data: part }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    console.error("Error updating part:", error)
    return { error: "Failed to update part" }
  }
}

export async function deletePart(id: string) {
  try {
    const part = await prisma.part.findUnique({
      where: { id },
      include: {
        _count: {
          select: { jobParts: true }
        }
      }
    })

    if (!part) return { error: "Part not found" }

    if (part._count.jobParts > 0) {
      return { error: "Cannot delete this part because it has been used in previous job orders. Adjust stock to 0 instead." }
    }

    await prisma.part.delete({
      where: { id }
    })

    revalidatePath("/dashboard/parts")
    return { success: true }
  } catch (error) {
    console.error("Error deleting part:", error)
    return { error: "Failed to delete part" }
  }
}

export async function adjustStock(id: string, delta: number) {
  try {
    const part = await prisma.part.findUnique({ where: { id } })
    if (!part) return { error: "Part not found" }

    const newStock = part.stockQty + delta
    if (newStock < 0) {
      return { error: "Adjustment would result in negative stock" }
    }

    const updatedPart = await prisma.part.update({
      where: { id },
      data: { stockQty: newStock }
    })

    revalidatePath("/dashboard/parts")
    return { success: true, data: updatedPart }
  } catch (error) {
    console.error("Error adjusting stock:", error)
    return { error: "Failed to adjust stock" }
  }
}
