import Navbar from "@/components/shared/Navbar"
import Sidebar from "@/components/shared/Sidebar"
import AuthProvider from "@/components/providers/session-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <TooltipProvider>
        <div className="flex min-h-screen flex-col bg-background">
          <Navbar />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
        <Toaster position="top-right" />
      </TooltipProvider>
    </AuthProvider>
  )
}
