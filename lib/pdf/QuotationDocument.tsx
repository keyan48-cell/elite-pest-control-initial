import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { COMPANY_CONFIG } from "@/lib/company";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#111827" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  brandRow: { flexDirection: "row", alignItems: "center", width: "62%" },
  logo: { width: 58, height: 46, objectFit: "contain", marginRight: 9 },
  companyName: { fontSize: 14, fontWeight: 700, color: "#17324d" },
  tagline: { fontSize: 7.5, color: "#15803d", fontWeight: 700, marginTop: 2, letterSpacing: 0.5 },
  gstText: { fontSize: 8, color: "#17324d", fontWeight: 700, marginTop: 3 },
  small: { fontSize: 8, color: "#6b7280" },
  metaBox: { width: "35%", alignItems: "flex-end" },
  quotationTitle: { fontSize: 13, fontWeight: 700, color: "#15803d" },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 10, fontWeight: 700, marginBottom: 5, color: "#111827", borderBottom: "1 solid #e5e7eb", paddingBottom: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  table: { marginTop: 4 },
  tableHeader: { flexDirection: "row", borderBottom: "1 solid #d1d5db", backgroundColor: "#f9fafb", paddingVertical: 4, marginBottom: 4 },
  tableRow: { flexDirection: "row", paddingVertical: 3, borderBottom: "1 solid #f3f4f6" },
  colService: { width: "38%" },
  colSac: { width: "14%" },
  colMethod: { width: "18%" },
  colQty: { width: "12%", textAlign: "right" },
  colAmount: { width: "18%", textAlign: "right" },
  totalsBox: { marginTop: 10, alignSelf: "flex-end", width: "48%", border: "1 solid #e5e7eb", padding: 8, borderRadius: 4 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalFinal: { flexDirection: "row", justifyContent: "space-between", paddingTop: 5, marginTop: 4, borderTop: "1 solid #111827" },
  footer: { position: "absolute", bottom: 20, left: 32, right: 32, fontSize: 7.5, color: "#6b7280", textAlign: "center", borderTop: "1 solid #e5e7eb", paddingTop: 6 },
});

export interface QuotationPdfData {
  quotationNumber: string;
  status: string;
  createdAt: string;
  validUntil: string | null;
  customer: { name: string; mobile: string; email: string | null; address: string | null };
  property: { serviceAddress: string; propertyType: string; bhkOrRooms: string | null; areaSqft: number | null };
  items: { serviceName: string; method: string; quantity: number; warrantyMonths: number; lineTotal: number }[];
  addOns: { name: string; amount: number }[];
  surcharges: { name: string; amount: number }[];
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxRatePercent: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  logoSrc: string;
  gstin?: string;
}

const fmt = (n: number) => `Rs. ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function QuotationDocument({ data }: { data: QuotationPdfData }) {
  const gstin = data.gstin || COMPANY_CONFIG.gstin;
  const isIntraState = Number(data.taxRatePercent) <= 18;
  const halfTax = Number(data.taxAmount || 0) / 2;
  const halfRate = Number(data.taxRatePercent || 0) / 2;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <Image src={data.logoSrc} style={styles.logo} />
            <View>
              <Text style={styles.companyName}>{COMPANY_CONFIG.legalName}</Text>
              <Text style={styles.tagline}>{COMPANY_CONFIG.tagline}</Text>
              <Text style={styles.gstText}>GSTIN: {gstin}</Text>
              <Text style={styles.small}>State: {COMPANY_CONFIG.state} (Code: {COMPANY_CONFIG.stateCode}) · SAC: {COMPANY_CONFIG.hsnSac}</Text>
            </View>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.quotationTitle}>QUOTATION</Text>
            <Text style={{ fontSize: 9, fontWeight: 700, marginTop: 2 }}>{data.quotationNumber}</Text>
            <Text style={styles.small}>Status: {data.status}</Text>
            <Text style={styles.small}>Date: {data.createdAt}</Text>
            {data.validUntil && <Text style={styles.small}>Valid until: {data.validUntil}</Text>}
          </View>
        </View>

        {/* Customer & Property Row */}
        <View style={{ flexDirection: "row", gap: 16, marginBottom: 12 }}>
          <View style={[styles.section, { width: "50%", marginBottom: 0 }]}>
            <Text style={styles.sectionTitle}>Customer Details</Text>
            <Text style={{ fontWeight: 700 }}>{data.customer.name}</Text>
            <Text style={styles.small}>Mobile: {data.customer.mobile}</Text>
            {data.customer.email && <Text style={styles.small}>Email: {data.customer.email}</Text>}
            {data.customer.address && <Text style={styles.small}>Address: {data.customer.address}</Text>}
          </View>

          <View style={[styles.section, { width: "50%", marginBottom: 0 }]}>
            <Text style={styles.sectionTitle}>Service Property</Text>
            <Text style={{ fontSize: 9 }}>{data.property.serviceAddress}</Text>
            <Text style={styles.small}>
              Type: {data.property.propertyType} {data.property.bhkOrRooms ? `· ${data.property.bhkOrRooms}` : ""}{" "}
              {data.property.areaSqft ? `· ${data.property.areaSqft} sq.ft` : ""}
            </Text>
          </View>
        </View>

        {/* Services Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services & Scope of Work</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colService, { fontWeight: 700 }]}>Service</Text>
              <Text style={[styles.colSac, { fontWeight: 700 }]}>SAC</Text>
              <Text style={[styles.colMethod, { fontWeight: 700 }]}>Method / Warranty</Text>
              <Text style={[styles.colQty, { fontWeight: 700 }]}>Qty</Text>
              <Text style={[styles.colAmount, { fontWeight: 700 }]}>Amount</Text>
            </View>
            {data.items.map((it, i) => (
              <View style={styles.tableRow} key={i}>
                <Text style={styles.colService}>{it.serviceName}</Text>
                <Text style={styles.colSac}>{COMPANY_CONFIG.hsnSac}</Text>
                <Text style={styles.colMethod}>{it.method} · {it.warrantyMonths}mo</Text>
                <Text style={styles.colQty}>{it.quantity}</Text>
                <Text style={styles.colAmount}>{fmt(it.lineTotal)}</Text>
              </View>
            ))}
            {data.addOns.map((a, i) => (
              <View style={styles.tableRow} key={`addon-${i}`}>
                <Text style={styles.colService}>Add-on: {a.name}</Text>
                <Text style={styles.colSac}>{COMPANY_CONFIG.hsnSac}</Text>
                <Text style={styles.colMethod}>—</Text>
                <Text style={styles.colQty}>1</Text>
                <Text style={styles.colAmount}>{fmt(a.amount)}</Text>
              </View>
            ))}
            {data.surcharges.map((s, i) => (
              <View style={styles.tableRow} key={`sur-${i}`}>
                <Text style={styles.colService}>Surcharge: {s.name}</Text>
                <Text style={styles.colSac}>{COMPANY_CONFIG.hsnSac}</Text>
                <Text style={styles.colMethod}>—</Text>
                <Text style={styles.colQty}>1</Text>
                <Text style={styles.colAmount}>{fmt(s.amount)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* GST Totals */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{fmt(data.subtotal)}</Text>
          </View>
          {data.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text>Discount</Text>
              <Text>- {fmt(data.discountAmount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text>Taxable Amount</Text>
            <Text>{fmt(data.taxableAmount)}</Text>
          </View>
          {isIntraState ? (
            <>
              <View style={styles.totalRow}>
                <Text>CGST ({halfRate}%)</Text>
                <Text>{fmt(halfTax)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text>SGST ({halfRate}%)</Text>
                <Text>{fmt(halfTax)}</Text>
              </View>
            </>
          ) : (
            <View style={styles.totalRow}>
              <Text>IGST ({data.taxRatePercent}%)</Text>
              <Text>{fmt(data.taxAmount)}</Text>
            </View>
          )}
          <View style={styles.totalFinal}>
            <Text style={{ fontWeight: 700, fontSize: 11 }}>Total (INR)</Text>
            <Text style={{ fontWeight: 700, fontSize: 11, color: "#15803d" }}>{fmt(data.total)}</Text>
          </View>
        </View>

        {data.notes && (
          <View style={[styles.section, { marginTop: 10 }]}>
            <Text style={styles.sectionTitle}>Notes & Terms</Text>
            <Text style={{ fontSize: 8.5 }}>{data.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          GSTIN: {gstin} · State Code: {COMPANY_CONFIG.stateCode} ({COMPANY_CONFIG.state}) · SAC: {COMPANY_CONFIG.hsnSac} · {COMPANY_CONFIG.name} — {COMPANY_CONFIG.tagline}
        </Text>
      </Page>
    </Document>
  );
}
