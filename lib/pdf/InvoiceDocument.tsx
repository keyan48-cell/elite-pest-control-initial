import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { COMPANY_CONFIG } from "@/lib/company";

const green = "#15803d";
const dark = "#17324d";
const muted = "#64748b";
const line = "#d1d5db";

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 8.5, fontFamily: "Helvetica", color: "#111827", backgroundColor: "#ffffff" },
  topLine: { height: 3, backgroundColor: dark, marginBottom: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  brandRow: { flexDirection: "row", alignItems: "center", width: "65%" },
  logo: { width: 56, height: 44, objectFit: "contain", marginRight: 9 },
  companyName: { fontSize: 14, fontWeight: 700, color: dark },
  tagline: { fontSize: 7, color: green, fontWeight: 700, marginTop: 2, letterSpacing: 0.5 },
  gstinText: { fontSize: 8, color: dark, fontWeight: 700, marginTop: 2 },
  office: { fontSize: 6.5, color: muted, marginTop: 1 },
  invoiceBox: { width: "30%", alignItems: "flex-end" },
  invoiceTitle: { fontSize: 14, fontWeight: 700, color: green },
  invoiceNo: { fontSize: 8.5, fontWeight: 700, color: dark, marginTop: 3 },
  label: { fontSize: 7, color: muted, marginBottom: 1 },
  title: { textAlign: "center", fontSize: 11, fontWeight: 700, color: dark, marginBottom: 10, letterSpacing: 1 },
  section: { marginBottom: 10 },
  sectionTitle: { fontSize: 8.5, fontWeight: 700, color: dark, borderBottom: `1 solid ${green}`, paddingBottom: 3, marginBottom: 6 },
  twoCol: { flexDirection: "row", gap: 16 },
  col: { width: "50%" },
  value: { fontSize: 8, color: "#111827", marginBottom: 4 },
  table: { border: `1 solid ${line}` },
  tableHead: { flexDirection: "row", backgroundColor: "#f8fafc", borderBottom: `1 solid ${line}`, paddingVertical: 4 },
  tableRow: { flexDirection: "row", borderBottom: `1 solid ${line}`, paddingVertical: 4 },
  c1: { width: "5%", paddingHorizontal: 4 },
  c2: { width: "32%", paddingHorizontal: 4 },
  c3: { width: "11%", paddingHorizontal: 4 },
  c4: { width: "10%", paddingHorizontal: 4, textAlign: "right" },
  c5: { width: "13%", paddingHorizontal: 4, textAlign: "right" },
  c6: { width: "14%", paddingHorizontal: 4, textAlign: "right" },
  c7: { width: "15%", paddingHorizontal: 4, textAlign: "right" },
  headText: { fontSize: 6.5, fontWeight: 700, color: dark },
  cellText: { fontSize: 7.5 },
  totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8 },
  totals: { width: "48%", border: `1 solid ${line}` },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, paddingHorizontal: 6, borderBottom: `1 solid ${line}` },
  grand: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, paddingHorizontal: 6, backgroundColor: "#f0fdf4" },
  grandText: { fontSize: 10, fontWeight: 700, color: green },
  paymentBox: { border: `1 solid ${line}`, padding: 7, borderRadius: 2 },
  footer: { position: "absolute", bottom: 16, left: 28, right: 28, borderTop: `1 solid ${line}`, paddingTop: 5, fontSize: 6.5, color: muted, textAlign: "center" },
});

export interface InvoicePdfData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  status: string;
  customer: { name: string; mobile: string; email: string | null; address: string | null };
  property: { serviceAddress: string } | null;
  jobNumber: string;
  quotationNumber: string | null;
  items: { serviceName: string; hsnSac: string; quantity: number; rate: number; taxable: number; cgst: number; sgst: number; igst: number; total: number }[];
  subtotal: number;
  discount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  balanceAmount: number;
  notes: string | null;
  paymentStatus: string;
  logoSrc: string;
  companyGstin?: string;
}

const money = (n: number) => `Rs. ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  const gstin = data.companyGstin || COMPANY_CONFIG.gstin;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topLine} />

        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image src={data.logoSrc} style={styles.logo} />
            <View>
              <Text style={styles.companyName}>{COMPANY_CONFIG.legalName}</Text>
              <Text style={styles.tagline}>{COMPANY_CONFIG.tagline}</Text>
              <Text style={styles.gstinText}>GSTIN: {gstin}</Text>
              <Text style={styles.office}>State: {COMPANY_CONFIG.state} · State Code: {COMPANY_CONFIG.stateCode} · SAC: {COMPANY_CONFIG.hsnSac}</Text>
            </View>
          </View>
          <View style={styles.invoiceBox}>
            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
            <Text style={styles.invoiceNo}>{data.invoiceNumber}</Text>
            <Text style={styles.label}>Status: {data.status}</Text>
          </View>
        </View>

        <Text style={styles.title}>GST TAX INVOICE</Text>

        {/* Invoice & Customer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INVOICE & CUSTOMER DETAILS</Text>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.label}>Invoice No.</Text><Text style={styles.value}>{data.invoiceNumber}</Text>
              <Text style={styles.label}>Invoice Date</Text><Text style={styles.value}>{data.invoiceDate}</Text>
              {data.dueDate && <><Text style={styles.label}>Due Date</Text><Text style={styles.value}>{data.dueDate}</Text></>}
              <Text style={styles.label}>Job No.</Text><Text style={styles.value}>{data.jobNumber}</Text>
              <Text style={styles.label}>Place of Supply</Text><Text style={styles.value}>{COMPANY_CONFIG.state} ({COMPANY_CONFIG.stateCode})</Text>
              <Text style={styles.label}>Supplier GSTIN</Text><Text style={[styles.value, { fontWeight: 700 }]}>{gstin}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Customer Name</Text><Text style={[styles.value, { fontWeight: 700 }]}>{data.customer.name}</Text>
              <Text style={styles.label}>Mobile No.</Text><Text style={styles.value}>{data.customer.mobile}</Text>
              {data.customer.email && <><Text style={styles.label}>Email</Text><Text style={styles.value}>{data.customer.email}</Text></>}
              {data.customer.address && <><Text style={styles.label}>Customer Address</Text><Text style={styles.value}>{data.customer.address}</Text></>}
              {data.quotationNumber && <><Text style={styles.label}>Ref. Quotation No.</Text><Text style={styles.value}>{data.quotationNumber}</Text></>}
            </View>
          </View>
        </View>

        {data.property && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SERVICE PROPERTY ADDRESS</Text>
            <Text style={styles.value}>{data.property.serviceAddress}</Text>
          </View>
        )}

        {/* Services & SAC Line Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SERVICE DETAILS (SAC {COMPANY_CONFIG.hsnSac})</Text>
          <View style={styles.table}>
            <View style={styles.tableHead}>
              <Text style={[styles.c1, styles.headText]}>#</Text>
              <Text style={[styles.c2, styles.headText]}>SERVICE / DESCRIPTION</Text>
              <Text style={[styles.c3, styles.headText]}>HSN/SAC</Text>
              <Text style={[styles.c4, styles.headText]}>QTY</Text>
              <Text style={[styles.c5, styles.headText]}>RATE</Text>
              <Text style={[styles.c6, styles.headText]}>TAXABLE</Text>
              <Text style={[styles.c7, styles.headText]}>TOTAL</Text>
            </View>
            {data.items.map((item, index) => (
              <View style={styles.tableRow} key={index} wrap={false}>
                <Text style={[styles.c1, styles.cellText]}>{index + 1}</Text>
                <Text style={[styles.c2, styles.cellText]}>{item.serviceName}</Text>
                <Text style={[styles.c3, styles.cellText]}>{item.hsnSac || COMPANY_CONFIG.hsnSac}</Text>
                <Text style={[styles.c4, styles.cellText]}>{item.quantity}</Text>
                <Text style={[styles.c5, styles.cellText]}>{money(item.rate)}</Text>
                <Text style={[styles.c6, styles.cellText]}>{money(item.taxable)}</Text>
                <Text style={[styles.c7, styles.cellText]}>{money(item.total)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tax Totals Breakdown */}
        <View style={styles.totalsWrap}>
          <View style={styles.totals}>
            <View style={styles.totalRow}><Text>Subtotal</Text><Text>{money(data.subtotal)}</Text></View>
            {data.discount > 0 && <View style={styles.totalRow}><Text>Discount</Text><Text>- {money(data.discount)}</Text></View>}
            <View style={styles.totalRow}><Text>Taxable Amount</Text><Text>{money(data.taxableAmount)}</Text></View>
            {data.cgstAmount > 0 && <View style={styles.totalRow}><Text>CGST (9%)</Text><Text>{money(data.cgstAmount)}</Text></View>}
            {data.sgstAmount > 0 && <View style={styles.totalRow}><Text>SGST (9%)</Text><Text>{money(data.sgstAmount)}</Text></View>}
            {data.igstAmount > 0 && <View style={styles.totalRow}><Text>IGST (18%)</Text><Text>{money(data.igstAmount)}</Text></View>}
            <View style={styles.totalRow}><Text>Total GST</Text><Text>{money(data.taxAmount)}</Text></View>
            <View style={styles.grand}><Text style={styles.grandText}>GRAND TOTAL</Text><Text style={styles.grandText}>{money(data.total)}</Text></View>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAYMENT DETAILS</Text>
          <View style={styles.paymentBox}>
            <Text style={{ fontWeight: 700 }}>Payment Status: {data.paymentStatus}</Text>
            <Text style={{ marginTop: 2 }}>Paid Amount: {money(data.paidAmount)}</Text>
            <Text style={{ marginTop: 2, fontWeight: 700, color: data.balanceAmount > 0.01 ? "#b91c1c" : green }}>
              Balance Amount: {money(data.balanceAmount)}
            </Text>
          </View>
        </View>

        {data.notes && <View style={styles.section}><Text style={styles.sectionTitle}>NOTES / TERMS</Text><Text>{data.notes}</Text></View>}

        <Text style={styles.footer}>
          Thank you for choosing Elite Pest Control Initial · GSTIN: {gstin} · SAC: {COMPANY_CONFIG.hsnSac} · State Code: {COMPANY_CONFIG.stateCode} · EPCI Business Management System
        </Text>
      </Page>
    </Document>
  );
}
