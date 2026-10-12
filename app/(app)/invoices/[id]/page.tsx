import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createPayment } from "../../business-actions";
import { COMPANY_CONFIG } from "@/lib/company";

function money(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function normalizeIndianMobile(mobile: string | null | undefined) {
  if (!mobile) return null;
  const value = mobile.replace(/\D/g, "");
  if (value.length === 10) return `91${value}`;
  if (value.length === 11 && value.startsWith("0")) return `91${value.slice(1)}`;
  if (value.length === 12 && value.startsWith("91")) return value;
  return null;
}

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      job: { include: { property: true, quotation: { include: { items: { include: { service: true } } } } } },
      payments: { orderBy: { paidAt: "desc" }, include: { recordedBy: true } },
    },
  });

  if (!invoice) return notFound();

  const q = invoice.job.quotation;
  const phone = normalizeIndianMobile(invoice.customer.mobile);
  const message = [
    `Hello ${invoice.customer.name},`,
    "",
    "Thank you for choosing Elite Pest Control Initial.",
    "",
    `Tax Invoice No: ${invoice.invoiceNumber}`,
    `Job No: ${invoice.job.jobNumber}`,
    `Total Amount: ${money(invoice.total)}`,
    `GST Amount: ${money(invoice.taxAmount)}`,
    `Paid Amount: ${money(invoice.paidAmount)}`,
    `Balance Amount: ${money(invoice.balanceAmount)}`,
    "",
    `Supplier GSTIN: ${COMPANY_CONFIG.gstin}`,
    `SAC Code: ${COMPANY_CONFIG.hsnSac} · Place of Supply: ${COMPANY_CONFIG.state} (${COMPANY_CONFIG.stateCode})`,
    "",
    "Please find your invoice details in the attached/linked invoice.",
    "",
    "Regards,",
    COMPANY_CONFIG.legalName,
    `${COMPANY_CONFIG.shortName} — ${COMPANY_CONFIG.tagline}`,
  ].join("\n");
  const whatsappUrl = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page-title">{invoice.invoiceNumber}</h1>
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">{invoice.status}</span>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              GSTIN: {COMPANY_CONFIG.gstin}
            </span>
          </div>
          <p className="page-subtitle">{invoice.customer.name} · {invoice.job.jobNumber} · Place of Supply: {COMPANY_CONFIG.state} ({COMPANY_CONFIG.stateCode})</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {q && <Link href={`/jobs/${invoice.job.id}`} className="btn-secondary">View job</Link>}
          <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer" className="btn-secondary">📄 PDF</a>
          {whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">💬 WhatsApp</a> : <span className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-400">WhatsApp unavailable</span>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
            <h2 className="section-title">GST Tax Invoice Summary</h2>
            <div className="text-xs text-gray-500">
              Supplier GSTIN: <strong className="text-gray-900">{COMPANY_CONFIG.gstin}</strong> · SAC <strong className="text-gray-900">{COMPANY_CONFIG.hsnSac}</strong>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><div className="label">Customer</div><div className="font-medium">{invoice.customer.name}</div></div>
            <div><div className="label">Mobile</div><div className="font-medium">{invoice.customer.mobile}</div></div>
            <div><div className="label">Job</div><div className="font-medium">{invoice.job.jobNumber}</div></div>
            <div><div className="label">Service address</div><div className="font-medium">{invoice.job.property.serviceAddress}</div></div>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="table-head"><th>#</th><th>Service</th><th>SAC</th><th>Qty</th><th className="text-right">Amount</th></tr></thead>
              <tbody>
                {q?.items.map((item, idx) => <tr className="table-row" key={item.id}><td>{idx + 1}</td><td>{item.service.name}</td><td>{COMPANY_CONFIG.hsnSac}</td><td>{item.quantity}</td><td className="text-right">{money(item.lineTotal)}</td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="mt-6 ml-auto max-w-sm space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><b>{money(invoice.subtotal)}</b></div>
            {q && q.discountAmount > 0 && <div className="flex justify-between text-gray-600"><span>Discount</span><b>- {money(q.discountAmount)}</b></div>}
            {q && <div className="flex justify-between border-t pt-2"><span>Taxable Amount</span><b>{money(q.taxableAmount)}</b></div>}
            {invoice.taxRatePercent <= 18 ? (
              <>
                <div className="flex justify-between text-gray-600"><span>CGST ({invoice.taxRatePercent / 2}%)</span><b>{money(invoice.taxAmount / 2)}</b></div>
                <div className="flex justify-between text-gray-600"><span>SGST ({invoice.taxRatePercent / 2}%)</span><b>{money(invoice.taxAmount / 2)}</b></div>
              </>
            ) : (
              <div className="flex justify-between"><span>Total GST ({invoice.taxRatePercent}%)</span><b>{money(invoice.taxAmount)}</b></div>
            )}
            <div className="flex justify-between border-t pt-3 text-lg font-bold"><span>Grand Total</span><b className="text-brand-700">{money(invoice.total)}</b></div>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="section-title">Record payment</h2>
          {invoice.balanceAmount > 0.01 ? (
            <form action={createPayment} className="mt-4 grid gap-3">
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <div><label className="label">Amount</label><input name="amount" type="number" min="0.01" step="0.01" max={invoice.balanceAmount} className="input" placeholder="Amount" required /></div>
              <div><label className="label">Payment method</label><select name="method" className="input"><option>UPI</option><option>CASH</option><option>BANK_TRANSFER</option><option>CARD</option><option>CHEQUE</option><option>OTHER</option></select></div>
              <div><label className="label">Reference</label><input name="reference" className="input" placeholder="Transaction / cheque reference" /></div>
              <button className="btn-primary">Save payment</button>
            </form>
          ) : <div className="mt-4 rounded-lg bg-green-50 p-4 font-medium text-green-700">Paid in full</div>}
          <div className="mt-6 space-y-2 border-t pt-4 text-sm"><div className="flex justify-between"><span>Paid</span><b>{money(invoice.paidAmount)}</b></div><div className="flex justify-between"><span>Balance</span><b>{money(invoice.balanceAmount)}</b></div></div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="section-title">Payment history</h2>
        {invoice.payments.length === 0 ? <p className="mt-3 text-sm text-gray-500">No payments recorded.</p> : <div className="mt-3 divide-y">{invoice.payments.map((p) => <div key={p.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between text-sm"><div><b>{p.receiptNumber}</b> · {p.method} · {p.paidAt.toLocaleString("en-IN")}{p.reference && <span className="text-gray-500"> · {p.reference}</span>}</div><b>{money(p.amount)}</b></div>)}</div>}
      </div>
    </div>
  );
}
