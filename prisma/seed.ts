import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
})

async function main() {
  const adminEmail = "admin@autoservis.com"
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (existingAdmin) {
    console.log("Admin user already exists. Skipping seed.")
    return
  }

  const hashedPassword = await bcrypt.hash("password123", 10)

  const admin = await prisma.user.create({
    data: {
      name: "System Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
    },
  })

  console.log(`Created admin user: ${admin.email} (Password: password123)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
