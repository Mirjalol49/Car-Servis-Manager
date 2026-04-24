"use client"

import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CarFront, LogOut, UserCircle } from "lucide-react"

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b bg-background px-6 shadow-sm">
      <div className="flex items-center gap-2">
        <CarFront className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold tracking-tight">AutoServis</span>
      </div>

      <div className="flex items-center gap-4">
        {session?.user && (
          <div className="flex items-center gap-3">
            <div className="hidden flex-col items-end sm:flex">
              <span className="text-sm font-medium leading-none">
                {session.user.name}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                {session.user.email}
              </span>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex uppercase">
              {session.user.role}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <UserCircle className="h-6 w-6" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 sm:hidden">
                  <p className="text-sm font-medium">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground">{session.user.email}</p>
                  <Badge variant="outline" className="mt-2 uppercase text-[10px]">
                    {session.user.role}
                  </Badge>
                </div>
                <DropdownMenuSeparator className="sm:hidden" />
                <DropdownMenuItem
                  className="text-destructive cursor-pointer"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  )
}
