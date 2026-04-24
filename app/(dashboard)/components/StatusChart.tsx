"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { JobStatus } from '@prisma/client'

interface StatusChartProps {
  data: {
    status: JobStatus
    count: number
  }[]
}

const STATUS_COLORS: Record<JobStatus, string> = {
  WAITING: "hsl(var(--muted-foreground))",
  DIAGNOSED: "#3b82f6", // blue-500
  APPROVED: "#eab308",  // yellow-500
  IN_PROGRESS: "#f97316", // orange-500
  COMPLETED: "#22c55e",  // green-500
  DELIVERED: "#a855f7"   // purple-500
}

export default function StatusChart({ data }: StatusChartProps) {
  // Filter out zero counts
  const chartData = data.filter(d => d.count > 0)

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] w-full mt-4 flex items-center justify-center text-muted-foreground italic">
        No jobs found
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm capitalize">{payload[0].name.replace('_', ' ')}</p>
          <p className="font-bold">{payload[0].value} jobs</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="count"
            nameKey="status"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-xs text-muted-foreground capitalize">{value.replace('_', ' ')}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
