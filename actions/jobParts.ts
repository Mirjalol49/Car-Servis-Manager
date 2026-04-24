"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"

/**
 * Recalculates the estimated Cost and total Cost for a job order.
 * Since Prisma doesn't have hooks, we call this after any part mutation.
 */
export async function recalculateJobCosts(jobOrderId: string) {
  const job = await prisma.jobOrder.findUnique({
    where: { id: jobOrderId },
    include: { parts: true }
  })

  if (!job) return

  const partsTotal = job.parts.reduce((sum, part) => {
    return sum + (part.quantity * Number(part.unitPrice))
  }, 0)

  const serviceFee = Number(job.serviceFee)
  const newTotal = partsTotal + serviceFee

  await prisma.jobOrder.update({
    where: { id: jobOrderId },
    data: {
      estimatedCost: newTotal,
      totalCost: newTotal // Kept in sync until delivery/invoice
    }
  })
}

export async function addPartToJob(jobOrderId: string, data: { partId: string; quantity: number }) {
  try {
    if (data.quantity <= 0) {
      return { error: "Quantity must be at least 1" }
    }

    // Using interactive transaction to ensure stock consistency
    const result = await prisma.$transaction(async (tx) => {
      const part = await tx.part.findUnique({ where: { id: data.partId } })
      
      if (!part) throw new Error("Part not found")
      
      if (part.stockQty < data.quantity) {
        throw new Error(`Insufficient stock. Only ${part.stockQty} available.`)
      }

      // Check if part is already added to this job
      const existingJobPart = await tx.jobPart.findFirst({
        where: { jobOrderId, partId: data.partId }
      })

      if (existingJobPart) {
        // Increment quantity
        await tx.jobPart.update({
          where: { id: existingJobPart.id },
          data: { quantity: existingJobPart.quantity + data.quantity }
        })
      } else {
        // Create new JobPart with price snapshot
        await tx.jobPart.create({
          data: {
            jobOrderId,
            partId: data.partId,
            quantity: data.quantity,
            unitPrice: part.unitPrice
          }
        })
      }

      // Decrease stock
      const updatedPart = await tx.part.update({
        where: { id: data.partId },
        data: { stockQty: { decrement: data.quantity } }
      })

      return { remainingStock: updatedPart.stockQty, partName: updatedPart.name }
    })

    await recalculateJobCosts(jobOrderId)

    revalidatePath(`/dashboard/jobs/${jobOrderId}`)
    revalidatePath("/dashboard/parts")
    
    return { 
      success: true, 
      warning: result.remainingStock === 0 ? `⚠ This was the last unit of ${result.partName}` : null 
    }
  } catch (error) {
    console.error("Error adding part to job:", error)
    return { error: error instanceof Error ? error.message : "Failed to add part to job" }
  }
}

export async function removePartFromJob(jobPartId: string) {
  try {
    const jobPart = await prisma.jobPart.findUnique({
      where: { id: jobPartId }
    })

    if (!jobPart) return { error: "Job part record not found" }

    await prisma.$transaction(async (tx) => {
      // Delete the JobPart
      await tx.jobPart.delete({
        where: { id: jobPartId }
      })

      // Refund the stock quantity
      await tx.part.update({
        where: { id: jobPart.partId },
        data: { stockQty: { increment: jobPart.quantity } }
      })
    })

    await recalculateJobCosts(jobPart.jobOrderId)

    revalidatePath(`/dashboard/jobs/${jobPart.jobOrderId}`)
    revalidatePath("/dashboard/parts")
    
    return { success: true }
  } catch (error) {
    console.error("Error removing part from job:", error)
    return { error: "Failed to remove part" }
  }
}

export async function approveEstimate(jobOrderId: string) {
  try {
    const job = await prisma.jobOrder.update({
      where: { id: jobOrderId },
      data: {
        approvedByCustomer: true,
        status: "APPROVED" // Auto-transition
      }
    })

    revalidatePath(`/dashboard/jobs/${jobOrderId}`)
    return { success: true, data: job }
  } catch (error) {
    return { error: "Failed to approve estimate" }
  }
}
