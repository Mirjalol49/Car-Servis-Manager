"use client"

import { useState } from "react"
import { Plus, Minus, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { adjustStock } from "@/actions/parts"

interface AdjustStockPopoverProps {
  partId: string
  currentStock: number
}

export default function AdjustStockPopover({ partId, currentStock }: AdjustStockPopoverProps) {
  const [open, setOpen] = useState(false)
  const [delta, setDelta] = useState<string>("1")
  const [isLoading, setIsLoading] = useState(false)

  const handleAdjust = async (isAdding: boolean) => {
    const value = parseInt(delta)
    if (isNaN(value) || value <= 0) {
      toast.error("Please enter a valid positive number")
      return
    }

    const adjustment = isAdding ? value : -value

    if (!isAdding && currentStock + adjustment < 0) {
      toast.error("Cannot reduce stock below 0")
      return
    }

    setIsLoading(true)
    try {
      const response = await adjustStock(partId, adjustment)
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success("Stock adjusted successfully")
        setOpen(false)
        setDelta("1")
      }
    } catch (error) {
      toast.error("Failed to adjust stock")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          Adjust
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" side="bottom" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Adjust Stock Level</h4>
            <p className="text-sm text-muted-foreground">
              Current stock: <strong>{currentStock}</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              className="w-full h-9"
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button 
              variant="destructive" 
              className="w-full h-9"
              onClick={() => handleAdjust(false)}
              disabled={isLoading || currentStock === 0}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Minus className="h-4 w-4 mr-1" />}
              Remove
            </Button>
            <Button 
              className="w-full h-9 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleAdjust(true)}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Add
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
