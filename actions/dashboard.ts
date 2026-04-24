"use server"

import prisma from "@/lib/prisma"
import { JobStatus } from "@prisma/client"
import { startOfDay, startOfMonth, subDays, format } from "date-fns"

export async function getDashboardStats() {
  try {
    const today = new Date()
    const startOfTodayDate = startOfDay(today)
    const startOfThisMonthDate = startOfMonth(today)
    const thirtyDaysAgo = subDays(today, 30)

    const [
      todayJobsCount,
      activeJobsCount,
      totalCustomers,
      lowStockParts,
      todayPaidInvoices,
      monthPaidInvoices,
      jobsByStatusData,
      recentJobs,
      topMastersData,
      last30DaysInvoices
    ] = await Promise.all([
      // 1. Jobs created today
      prisma.jobOrder.count({
        where: { createdAt: { gte: startOfTodayDate } }
      }),
      
      // 2. Active jobs count
      prisma.jobOrder.count({
        where: { status: { in: [JobStatus.WAITING, JobStatus.DIAGNOSED, JobStatus.APPROVED, JobStatus.IN_PROGRESS] } }
      }),
      
      // 3. Total customers
      prisma.customer.count(),
      
      // 4. Low stock parts (< 5)
      prisma.part.count({
        where: { stockQty: { lt: 5 } }
      }),
      
      // 5. Today's revenue (sum of paid invoices today)
      prisma.invoice.findMany({
        where: {
          isPaid: true,
          paidAt: { gte: startOfTodayDate }
        },
        select: { totalAmount: true }
      }),
      
      // 6. Month's revenue (sum of paid invoices this month)
      prisma.invoice.findMany({
        where: {
          isPaid: true,
          paidAt: { gte: startOfThisMonthDate }
        },
        select: { totalAmount: true }
      }),
      
      // 7. Jobs by status
      prisma.jobOrder.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      
      // 8. Recent 5 jobs
      prisma.jobOrder.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          car: { include: { customer: true } }
        }
      }),

      // 9. Top 5 masters by completed jobs THIS month
      prisma.master.findMany({
        include: {
          jobOrders: {
            where: {
              status: { in: [JobStatus.COMPLETED, JobStatus.DELIVERED] },
              updatedAt: { gte: startOfThisMonthDate }
            },
            include: { invoice: true }
          }
        }
      }),

      // 10. Last 30 days invoices for chart
      prisma.invoice.findMany({
        where: {
          isPaid: true,
          paidAt: { gte: thirtyDaysAgo }
        },
        select: { totalAmount: true, paidAt: true },
        orderBy: { paidAt: 'asc' }
      })
    ])

    // Calculate revenue sums
    const todayRevenue = todayPaidInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
    const monthRevenue = monthPaidInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)

    // Process top masters
    const processedMasters = topMastersData
      .map(master => {
        const completedCount = master.jobOrders.length
        const revenueGenerated = master.jobOrders.reduce((sum, job) => {
          if (job.status === JobStatus.DELIVERED && job.invoice?.isPaid) {
            return sum + Number(job.invoice.totalAmount)
          }
          return sum
        }, 0)
        
        return {
          id: master.id,
          name: master.name,
          specialization: master.specialization,
          completedCount,
          revenueGenerated
        }
      })
      .filter(m => m.completedCount > 0)
      .sort((a, b) => b.completedCount - a.completedCount)
      .slice(0, 5)

    // Process revenue chart data (group by date string "MMM dd")
    const revenueMap = new Map<string, number>()
    
    // Initialize last 30 days with 0
    for (let i = 29; i >= 0; i--) {
      const d = subDays(today, i)
      revenueMap.set(format(d, 'MMM dd'), 0)
    }

    // Populate actuals
    last30DaysInvoices.forEach(inv => {
      if (inv.paidAt) {
        const dateKey = format(inv.paidAt, 'MMM dd')
        const current = revenueMap.get(dateKey) || 0
        revenueMap.set(dateKey, current + Number(inv.totalAmount))
      }
    })

    const revenueByDay = Array.from(revenueMap.entries()).map(([date, revenue]) => ({
      date,
      revenue
    }))

    // Process jobs by status
    const jobsByStatus = jobsByStatusData.map(item => ({
      status: item.status,
      count: item._count.id
    }))

    return {
      data: {
        todayJobsCount,
        activeJobsCount,
        todayRevenue,
        monthRevenue,
        totalCustomers,
        lowStockParts,
        jobsByStatus,
        revenueByDay,
        topMasters: processedMasters,
        recentJobs
      }
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return { error: "Failed to fetch dashboard stats" }
  }
}
