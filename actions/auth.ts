"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { Role } from "@prisma/client"
import { revalidatePath } from "next/cache"

const createUserSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.nativeEnum(Role),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export async function createUser(data: CreateUserInput) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return { error: "Unauthorized. Only admins can create users." }
    }

    const validatedData = createUserSchema.parse(data)

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return { error: "User with this email already exists." }
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
      },
    })

    revalidatePath("/dashboard/settings/users")

    return { success: true, user: { id: user.id, email: user.email } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Invalid data provided." }
    }
    console.error("Error creating user:", error)
    return { error: "Failed to create user. Please try again." }
  }
}
