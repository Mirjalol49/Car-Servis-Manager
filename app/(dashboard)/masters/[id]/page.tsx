import { notFound } from "next/navigation"
import { getMasterById, getMasterStats } from "@/actions/masters"
import { AlertCircle, CheckCircle2, Clock, DollarSign, Wrench } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, getCurrencySymbol } from "@/lib/format"
import MasterProfileHeader from "./components/MasterProfileHeader"
import MasterActiveJobs from "./components/MasterActiveJobs"
import MasterHistoryTable from "./components/MasterHistoryTable"

export default async function MasterDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [{ data: master, error }, { data: stats }] = await Promise.all([
    getMasterById(params.id),
    getMasterStats(params.id)
  ])
  
  if (error || !master) {
    notFound()
  }

  const currencySymbol = getCurrencySymbol()

  const activeJobs = master.jobOrders.filter(j => 
    ["WAITING", "DIAGNOSED", "APPROVED", "IN_PROGRESS"].includes(j.status)
  )

  const historyJobs = master.jobOrders.filter(j => 
    ["COMPLETED", "DELIVERED"].includes(j.status)
  )

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      
      {!master.isActive && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-yellow-800 dark:text-yellow-400 font-semibold">Master is Inactive</h4>
            <p className="text-yellow-700 dark:text-yellow-500/80 text-sm mt-1">
              This master is currently inactive and cannot be assigned to new jobs. Existing assignments will still appear here.
            </p>
          </div>
        </div>
      )}

      <MasterProfileHeader master={master} />

      {/* KPI STATS ROW */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalJobs || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime assigned</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Active Jobs</CardTitle>
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats?.activeJobs || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.completedJobs || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Avg {stats?.avgJobDuration || 0} days/job</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue)} {currencySymbol}</div>
            <p className="text-xs text-muted-foreground mt-1">From delivered jobs</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Current Jobs</h2>
          <MasterActiveJobs jobs={activeJobs} />
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Job History</h2>
          <MasterHistoryTable jobs={historyJobs} />
        </div>
      </div>
      
    </div>
  )
}
