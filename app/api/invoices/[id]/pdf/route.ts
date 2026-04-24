import React from "react"
import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import prisma from "@/lib/prisma"
import { getCurrencySymbol } from "@/lib/format"
import { InvoiceDocument } from "@/lib/generateInvoicePdf"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        jobOrder: {
          include: {
            car: { include: { customer: true } },
            master: true,
            parts: { include: { part: true } }
          }
        }
      }
    })

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 })
    }

    const count = await prisma.invoice.count({
      where: {
        createdAt: { lte: invoice.createdAt }
      }
    })

    const invoiceWithNumber = { ...invoice, invoiceNumber: count }
    const currencySymbol = getCurrencySymbol()

    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoiceDocument, { invoice: invoiceWithNumber, currencySymbol })
    )

    const invoiceIdFormatted = count.toString().padStart(4, '0')
    const filename = `INV-${invoiceIdFormatted}-${invoice.jobOrder.car.plateNumber}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
