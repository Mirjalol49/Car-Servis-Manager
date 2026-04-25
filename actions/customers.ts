"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { z } from "zod"

const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^\+998\d{9}$/, "Phone must be in format +998XXXXXXXXX"),
})

export type CustomerFormValues = z.infer<typeof customerSchema>

export async function getCustomers(search?: string) {
  try {
    const customers = await prisma.customer.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ]
      } : undefined,
      include: {
        _count: {
          select: { cars: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return { data: customers }
  } catch (error) {
    console.error("Error fetching customers:", error)
    return { error: "Failed to fetch customers" }
  }
}

export async function getCustomerById(id: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        cars: {
          include: {
            _count: {
              select: { jobOrders: true }
            },
            jobOrders: {
              orderBy: { createdAt: 'desc' },
              include: {
                car: true
              }
            }
          }
        }
      }
    })
    
    if (!customer) {
      return { error: "Customer not found" }
    }
    
    return { data: customer }
  } catch (error) {
    console.error("Error fetching customer details:", error)
    return { error: "Failed to fetch customer details" }
  }
}

export async function createCustomer(data: CustomerFormValues) {
  try {
    const validatedData = customerSchema.parse(data)

    // Check for existing phone
    const existing = await prisma.customer.findUnique({
      where: { phone: validatedData.phone }
    })

    if (existing) {
      return { error: "A customer with this phone number already exists" }
    }

    const customer = await prisma.customer.create({
      data: validatedData
    })

    revalidatePath("/dashboard/customers")
    return { success: true, data: customer }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message }
    }
    console.error("Error creating customer:", error)
    return { error: "Failed to create customer" }
  }
}

export async function updateCustomer(id: string, data: CustomerFormValues) {
  try {
    const validatedData = customerSchema.parse(data)

    // Check phone uniqueness if it's changing
    const existingWithPhone = await prisma.customer.findUnique({
      where: { phone: validatedData.phone }
    })

    if (existingWithPhone && existingWithPhone.id !== id) {
      return { error: "This phone number is already used by another customer" }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: validatedData
    })

    revalidatePath("/dashboard/customers")
    revalidatePath(`/dashboard/customers/${id}`)
    return { success: true, data: customer }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message }
    }
    console.error("Error updating customer:", error)
    return { error: "Failed to update customer" }
  }
}

export async function deleteCustomer(id: string) {
  try {
    // Check if customer has job orders
    const customerWithJobs = await prisma.customer.findUnique({
      where: { id },
      include: {
        cars: {
          include: {
            _count: {
              select: { jobOrders: true }
            }
          }
        }
      }
    })

    if (!customerWithJobs) {
      return { error: "Customer not found" }
    }

    const totalJobs = customerWithJobs.cars.reduce((acc, car) => acc + car._count.jobOrders, 0)

    if (totalJobs > 0) {
      return { error: "Cannot delete customer with existing job orders. Delete or reassign jobs first." }
    }

    await prisma.customer.delete({
      where: { id }
    })

    revalidatePath("/dashboard/customers")
    return { success: true }
  } catch (error) {
    console.error("Error deleting customer:", error)
    return { error: "Failed to delete customer" }
  }
}
