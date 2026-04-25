"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { z } from "zod"

const masterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^\+998\d{9}$/, "Must be in format +998XXXXXXXXX"),
  specialization: z.string().optional(),
})

export type MasterFormValues = z.infer<typeof masterSchema>

export async function getMasters(includeInactive: boolean = false) {
  try {
    const masters = await prisma.master.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: {
        _count: {
          select: {
            jobOrders: {
              where: { status: { in: ["WAITING", "DIAGNOSED", "APPROVED", "IN_PROGRESS"] } }
            }
          }
        },
        jobOrders: {
          where: { status: { in: ["COMPLETED", "DELIVERED"] } },
          select: { id: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    const formattedMasters = masters.map(master => ({
      ...master,
      activeJobsCount: master._count.jobOrders,
      completedJobsCount: master.jobOrders.length
    }))

    return { data: formattedMasters }
  } catch (error) {
    console.error("Error fetching masters:", error)
    return { error: "Failed to fetch masters" }
  }
}

export async function getMasterById(id: string) {
  try {
    const master = await prisma.master.findUnique({
      where: { id },
      include: {
        jobOrders: {
          include: { car: { include: { customer: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!master) return { error: "Master not found" }
    return { data: master }
  } catch (error) {
    console.error("Error fetching master details:", error)
    return { error: "Failed to fetch master details" }
  }
}

export async function createMaster(data: MasterFormValues) {
  try {
    const validatedData = masterSchema.parse(data)

    const existing = await prisma.master.findFirst({
      where: { phone: validatedData.phone }
    })

    if (existing) {
      return { error: "A master with this phone number already exists" }
    }

    const master = await prisma.master.create({
      data: validatedData
    })

    revalidatePath("/dashboard/masters")
    return { success: true, data: master }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message }
    }
    console.error("Error creating master:", error)
    return { error: "Failed to create master" }
  }
}

export async function updateMaster(id: string, data: MasterFormValues) {
  try {
    const validatedData = masterSchema.parse(data)

    const existing = await prisma.master.findFirst({
      where: { 
        phone: validatedData.phone,
        id: { not: id }
      }
    })

    if (existing) {
      return { error: "A master with this phone number already exists" }
    }

    const master = await prisma.master.update({
      where: { id },
      data: validatedData
    })

    revalidatePath("/dashboard/masters")
    revalidatePath(`/dashboard/masters/${id}`)
    return { success: true, data: master }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message }
    }
    console.error("Error updating master:", error)
    return { error: "Failed to update master" }
  }
}

export async function toggleMasterActive(id: string) {
  try {
    const master = await prisma.master.findUnique({ where: { id } })
    if (!master) return { error: "Master not found" }

    const updated = await prisma.master.update({
      where: { id },
      data: { isActive: !master.isActive }
    })

    revalidatePath("/dashboard/masters")
    revalidatePath(`/dashboard/masters/${id}`)
    return { success: true, data: updated }
  } catch (error) {
    console.error("Error toggling master status:", error)
    return { error: "Failed to toggle master status" }
  }
}

export async function getMasterStats(id: string) {
  try {
    const jobs = await prisma.jobOrder.findMany({
      where: { masterId: id },
      select: {
        status: true,
        totalCost: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    let activeJobs = 0
    let completedJobs = 0
    let totalRevenue = 0
    let totalDurationDays = 0
    let durationCount = 0

    for (const job of jobs) {
      if (["WAITING", "DIAGNOSED", "APPROVED", "IN_PROGRESS"].includes(job.status)) {
        activeJobs++
      }
      if (["COMPLETED", "DELIVERED"].includes(job.status)) {
        completedJobs++
        if (job.status === "DELIVERED" && job.totalCost) {
          totalRevenue += Number(job.totalCost)
        }
        
        // Calculate duration in days (min 1)
        const duration = Math.ceil((job.updatedAt.getTime() - job.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        totalDurationDays += Math.max(1, duration)
        durationCount++
      }
    }

    const avgJobDuration = durationCount > 0 ? Math.round(totalDurationDays / durationCount) : 0

    return {
      data: {
        totalJobs: jobs.length,
        activeJobs,
        completedJobs,
        totalRevenue,
        avgJobDuration
      }
    }
  } catch (error) {
    console.error("Error fetching master stats:", error)
    return { error: "Failed to fetch master stats" }
  }
}
