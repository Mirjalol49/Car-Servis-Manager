import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { format } from "date-fns"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 20,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  companyDetails: {
    color: '#666',
    lineHeight: 1.5,
  },
  invoiceTitle: {
    fontSize: 28,
    color: '#999',
    letterSpacing: 2,
    marginBottom: 10,
    textAlign: 'right',
  },
  invoiceDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
  },
  invoiceDetailsLabel: {
    color: '#666',
    marginRight: 10,
    width: 60,
    textAlign: 'right',
  },
  invoiceDetailsValue: {
    fontWeight: 'bold',
  },
  infoSection: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 9,
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  infoValueMain: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  infoValueSub: {
    color: '#666',
  },
  table: {
    width: 'auto',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  colIndex: { width: '5%' },
  colDesc: { width: '50%' },
  colPrice: { width: '20%', textAlign: 'right' },
  colQty: { width: '10%', textAlign: 'center' },
  colTotal: { width: '15%', textAlign: 'right' },
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  paymentStatusBox: {
    width: '40%',
    padding: 15,
    borderWidth: 1,
    borderRadius: 4,
  },
  paidBox: {
    borderColor: '#c3e6cb',
    backgroundColor: '#d4edda',
  },
  unpaidBox: {
    borderColor: '#ffeeba',
    backgroundColor: '#fff3cd',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  paidText: { color: '#155724' },
  unpaidText: { color: '#856404' },
  statusSubText: {
    fontSize: 9,
  },
  totalsBox: {
    width: '40%',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalsLabel: {
    color: '#666',
  },
  totalsDivider: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    marginVertical: 8,
  },
  totalAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
})

interface InvoiceDocumentProps {
  invoice: any
  currencySymbol: string
}

export function InvoiceDocument({ invoice, currencySymbol }: InvoiceDocumentProps) {
  const { jobOrder } = invoice
  const { car, master, parts } = jobOrder
  const { customer } = car

  const formatMoney = (val: any) => {
    const num = Number(val)
    return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}`
  }

  const invoiceNumberFormatted = `#INV-${invoice.invoiceNumber.toString().padStart(4, '0')}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>AutoServis</Text>
            <Text style={styles.companyDetails}>123 Mechanic Street, Auto City</Text>
            <Text style={styles.companyDetails}>+998 90 123 45 67</Text>
            <Text style={styles.companyDetails}>info@autoservis.com</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.invoiceDetailsRow}>
              <Text style={styles.invoiceDetailsLabel}>Invoice No:</Text>
              <Text style={styles.invoiceDetailsValue}>{invoiceNumberFormatted}</Text>
            </View>
            <View style={styles.invoiceDetailsRow}>
              <Text style={styles.invoiceDetailsLabel}>Date:</Text>
              <Text style={styles.invoiceDetailsValue}>{format(new Date(invoice.createdAt), "MMM dd, yyyy")}</Text>
            </View>
            <View style={styles.invoiceDetailsRow}>
              <Text style={styles.invoiceDetailsLabel}>Job Order:</Text>
              <Text style={styles.invoiceDetailsValue}>#JO-{jobOrder.id.slice(-6).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Customer & Car Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Billed To</Text>
            <Text style={styles.infoValueMain}>{customer.name}</Text>
            <Text style={styles.infoValueSub}>{customer.phone}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Vehicle Details</Text>
            <Text style={styles.infoValueMain}>{car.plateNumber}</Text>
            <Text style={styles.infoValueSub}>Master: {master ? master.name : "Unassigned"}</Text>
          </View>
        </View>

        {/* Parts Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colIndex}>#</Text>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colPrice}>Unit Price</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          
          {parts.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={{ width: '100%', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                Service only (no parts required)
              </Text>
            </View>
          ) : (
            parts.map((jp: any, index: number) => (
              <View style={styles.tableRow} key={jp.id}>
                <Text style={styles.colIndex}>{index + 1}</Text>
                <Text style={styles.colDesc}>{jp.part.name}</Text>
                <Text style={styles.colPrice}>{formatMoney(jp.unitPrice)}</Text>
                <Text style={styles.colQty}>{jp.quantity}</Text>
                <Text style={styles.colTotal}>{formatMoney(Number(jp.unitPrice) * jp.quantity)}</Text>
              </View>
            ))
          )}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={[styles.paymentStatusBox, invoice.isPaid ? styles.paidBox : styles.unpaidBox]}>
            <Text style={[styles.statusText, invoice.isPaid ? styles.paidText : styles.unpaidText]}>
              {invoice.isPaid ? "PAID IN FULL" : "UNPAID"}
            </Text>
            {invoice.isPaid && (
              <>
                <Text style={[styles.statusSubText, styles.paidText]}>Method: {invoice.paymentMethod}</Text>
                <Text style={[styles.statusSubText, styles.paidText]}>Date: {format(new Date(invoice.paidAt), "MMM dd, yyyy HH:mm")}</Text>
              </>
            )}
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Parts Subtotal:</Text>
              <Text>{formatMoney(invoice.partsTotal)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Service Fee:</Text>
              <Text>{formatMoney(invoice.serviceFee)}</Text>
            </View>
            <View style={styles.totalsDivider} />
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>TOTAL:</Text>
              <Text style={styles.totalAmountText}>{formatMoney(invoice.totalAmount)}</Text>
            </View>
          </View>
        </View>

      </Page>
    </Document>
  )
}
