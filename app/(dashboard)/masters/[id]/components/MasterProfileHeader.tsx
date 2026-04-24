"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { getAvatarColor, getInitials, cn } from "@/lib/utils"
import { formatPhone } from "@/lib/format"
import MasterSheet from "../../components/MasterSheet"

interface MasterProfileHeaderProps {
  master: {
    id: string
    name: string
    phone: string
    specialization: string | null
    isActive: boolean
  }
}

export default function MasterProfileHeader({ master }: MasterProfileHeaderProps) {
  const [showEditSheet, setShowEditSheet] = useState(false)

  const avatarColor = getAvatarColor(master.id)
  const initials = getInitials(master.name)

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className={cn("flex h-20 w-20 items-center justify-center rounded-full text-white text-3xl font-bold shadow-sm", avatarColor)}>
                {initials}
              </div>
              
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">{master.name}</h1>
                  {master.isActive ? (
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Inactive</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-muted-foreground font-medium">
                  <p>{master.specialization || "General Mechanic"}</p>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                  <p>{formatPhone(master.phone)}</p>
                </div>
              </div>
            </div>

            <Button variant="outline" onClick={() => setShowEditSheet(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <MasterSheet
        open={showEditSheet}
        onOpenChange={setShowEditSheet}
        initialData={master}
      />
    </>
  )
}
