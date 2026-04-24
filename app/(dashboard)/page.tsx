import { getDashboardStats } from "@/actions/dashboard"
import { formatCurrency, getCurrencySymbol } from "@/lib/format"
import { getAvatarColor, getInitials, cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { 
  Briefcase, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Info,
  ArrowRight
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import RevenueChart from "./components/RevenueChart"
import StatusChart from "./components/StatusChart"
import AutoRefresh from "./components/AutoRefresh"
import JobStatusBadge from "./jobs/components/JobStatusBadge"

export default async function DashboardPage() {
  const { data: stats, error } = await getDashboardStats()
  
  if (error || !stats) {
    return (
      <div className="p-6 rounded-md bg-destructive/15 text-destructive">
        Failed to load dashboard statistics.
      </div>
    )
  }

  const currencySymbol = getCurrencySymbol()

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      
      {/* ALERTS ROW */}
      <div className="space-y-3">
        {stats.lowStockParts > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3 flex justify-between items-center">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-500 font-medium">
              <AlertTriangle className="h-5 w-5" />
              <span>⚠ {stats.lowStockParts} parts are running low on stock.</span>
            </div>
            <Button variant="link" asChild className="text-amber-800 dark:text-amber-500">
              <Link href="/dashboard/parts">Manage Inventory <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        )}
        
        {stats.activeJobsCount > 10 && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-3 flex items-center gap-2 text-blue-800 dark:text-blue-500 font-medium">
            <Info className="h-5 w-5" />
            <span>ℹ {stats.activeJobsCount} jobs currently active — high load.</span>
          </div>
        )}
      </div>

      {/* ROW 1: KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayJobsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Job orders opened today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Active Jobs</CardTitle>
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.activeJobsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently in service
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(stats.todayRevenue.toString())} <span className="text-lg">{currencySymbol}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From paid invoices today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Month Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.monthRevenue.toString())} <span className="text-lg">{currencySymbol}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ROW 2: CHARTS */}
      <div className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Revenue Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={stats.revenueByDay} />
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Jobs by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusChart data={stats.jobsByStatus as any} />
          </CardContent>
        </Card>
      </div>

      {/* ROW 3: LISTS */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Masters This Month</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topMasters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground italic text-sm">
                No jobs completed this month yet.
              </div>
            ) : (
              <div className="space-y-6">
                {stats.topMasters.map((master, index) => {
                  const avatarColor = getAvatarColor(master.id)
                  const initials = getInitials(master.name)
                  
                  return (
                    <div key={master.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="font-mono text-muted-foreground font-bold w-4 text-right">
                          {index + 1}
                        </div>
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-sm", avatarColor)}>
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold">{master.name}</p>
                          <p className="text-xs text-muted-foreground">{master.specialization || "General Mechanic"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="mb-1">{master.completedCount} jobs</Badge>
                        <p className="text-xs font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(master.revenueGenerated.toString())} {currencySymbol}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Job Orders</CardTitle>
            <Button variant="link" size="sm" asChild>
              <Link href="/dashboard/jobs">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground italic text-sm">
                No recent jobs found.
              </div>
            ) : (
              <div className="space-y-6">
                {stats.recentJobs.map((job) => (
                  <Link 
                    key={job.id} 
                    href={`/dashboard/jobs/${job.id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between group p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="mb-2 sm:mb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">#JO-{job.id.slice(-6).toUpperCase()}</span>
                        <span className="font-bold uppercase tracking-wider">{job.car.plateNumber}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{job.car.customer.name}</p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                      <JobStatusBadge status={job.status} />
                      <div className="flex items-center gap-2 text-xs text-muted-foreground w-24 justify-end">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AutoRefresh />
    </div>
  )
}
