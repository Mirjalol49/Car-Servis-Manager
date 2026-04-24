"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { JobStatus } from "@prisma/client"

export async function generateInvoice(jobOrderId: string) {
  try {
    // 1. Check if invoice already exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { jobOrderId },
      include: {
        jobOrder: {
          include: {
            car: { include: { customer: true } },
            master: true,
            parts: { include: { part: true } }
          }
        }
      }
    })

    if (existingInvoice) {
      return { success: true, data: existingInvoice }
    }

    // 2. Fetch job and calculate totals
    const job = await prisma.jobOrder.findUnique({
      where: { id: jobOrderId },
      include: { parts: true }
    })

    if (!job) return { error: "Job order not found" }

    const partsTotal = job.parts.reduce((sum, part) => sum + (part.quantity * Number(part.unitPrice)), 0)
    const serviceFee = Number(job.serviceFee)
    const totalAmount = partsTotal + serviceFee

    // 3. Use transaction to create invoice and update job total Cost securely
    const newInvoice = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          jobOrderId,
          partsTotal,
          serviceFee,
          totalAmount,
          isPaid: false
        }
      })

      await tx.jobOrder.update({
        where: { id: jobOrderId },
        data: { totalCost: totalAmount }
      })

      return invoice
    })

    // Fetch the complete graph to return
    const fullInvoice = await prisma.invoice.findUnique({
      where: { id: newInvoice.id },
      include: {
        jobOrder: {
          include: {
            car: { include: { customer: true } },
            master: true,
            parts: { include: { part: true } }
          }
        }
      }
    })

    revalidatePath(`/dashboard/jobs/${jobOrderId}`)
    return { success: true, data: fullInvoice }
  } catch (error) {
    console.error("Error generating invoice:", error)
    return { error: "Failed to generate invoice" }
  }
}

export async function markAsPaid(invoiceId: string, paymentMethod: "CASH" | "CARD" | "TRANSFER") {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
    if (!invoice) return { error: "Invoice not found" }

    const updatedInvoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          isPaid: true,
          paymentMethod,
          paidAt: new Date()
        }
      })

      // Auto-transition job to DELIVERED
      await tx.jobOrder.update({
        where: { id: inv.jobOrderId },
        data: { status: JobStatus.DELIVERED }
      })

      return inv
    })

    revalidatePath(`/dashboard/jobs/${updatedInvoice.jobOrderId}`)
    revalidatePath(`/dashboard/jobs/${updatedInvoice.jobOrderId}/invoice`)
    return { success: true, data: updatedInvoice }
  } catch (error) {
    console.error("Error marking invoice as paid:", error)
    return { error: "Failed to process payment" }
  }
}

export async function getInvoiceByJobId(jobOrderId: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { jobOrderId },
      include: {
        jobOrder: {
          include: {
            car: { include: { customer: true } },
            master: true,
            parts: { include: { part: true } }
          }
        }
      }
    })

    if (!invoice) return { error: "Invoice not found" }
    
    // Dynamically calculate the sequential invoice number (1-indexed)
    const count = await prisma.invoice.count({
      where: {
        createdAt: { lte: invoice.createdAt }
      }
    })

    return { data: { ...invoice, invoiceNumber: count } }
  } catch (error) {
    console.error("Error fetching invoice:", error)
    return { error: "Failed to fetch invoice" }
  }
}
