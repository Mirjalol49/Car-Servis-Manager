"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Car,
  Wrench,
  UserCog,
  Settings,
  PackageSearch,
  LineChart,
} from "lucide-react"

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Customers",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    title: "Cars",
    href: "/dashboard/cars",
    icon: Car,
  },
  {
    title: "Job Orders",
    href: "/dashboard/jobs",
    icon: Wrench,
  },
  {
    title: "Masters",
    href: "/dashboard/masters",
    icon: UserCog,
  },
  {
    title: "Parts",
    href: "/dashboard/parts",
    icon: PackageSearch,
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: LineChart,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isAdmin = session?.user?.role === "ADMIN"

  return (
    <aside className="hidden w-64 flex-col border-r bg-muted/20 md:flex">
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid items-start px-4 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            // Only strictly match "/dashboard" to avoid it lighting up for all routes
            const actuallyActive = item.href === "/dashboard" ? pathname === "/dashboard" : isActive

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:text-primary",
                  actuallyActive
                    ? "bg-muted text-primary font-semibold"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            )
          })}

          {isAdmin && (
            <>
              <div className="my-4 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                Administration
              </div>
              <Link
                href="/dashboard/settings/users"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:text-primary",
                  pathname.startsWith("/dashboard/settings/users")
                    ? "bg-muted text-primary font-semibold"
                    : "text-muted-foreground"
                )}
              >
                <Settings className="h-5 w-5" />
                Users
              </Link>
            </>
          )}
        </nav>
      </div>
    </aside>
  )
}
