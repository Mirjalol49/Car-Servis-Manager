"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Banknote, CreditCard, ArrowRightLeft } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { markAsPaid } from "@/actions/invoices"

interface PaymentModalProps {
  invoiceId: string
  totalAmount: string
  children: React.ReactNode
}

export default function PaymentModal({ invoiceId, totalAmount, children }: PaymentModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CARD")
  const router = useRouter()

  const handlePayment = async () => {
    setIsLoading(true)
    try {
      const response = await markAsPaid(invoiceId, paymentMethod)
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success("Payment recorded successfully")
        setOpen(false)
        router.refresh()
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Confirm receipt of {totalAmount} to mark this invoice as paid.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <RadioGroup 
            defaultValue="CARD" 
            onValueChange={(v) => setPaymentMethod(v as any)}
            className="grid grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem value="CASH" id="cash" className="peer sr-only" />
              <Label
                htmlFor="cash"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <Banknote className="mb-3 h-6 w-6" />
                Cash
              </Label>
            </div>
            <div>
              <RadioGroupItem value="CARD" id="card" className="peer sr-only" />
              <Label
                htmlFor="card"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <CreditCard className="mb-3 h-6 w-6" />
                Card
              </Label>
            </div>
            <div>
              <RadioGroupItem value="TRANSFER" id="transfer" className="peer sr-only" />
              <Label
                htmlFor="transfer"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <ArrowRightLeft className="mb-3 h-6 w-6" />
                Transfer
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Confirm Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
