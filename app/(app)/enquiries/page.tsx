import { prisma } from "@/lib/prisma";
import BusinessTable from "@/components/BusinessTable";
import { createEnquiry } from "../business-actions";
import EnquiryRowActions from "@/components/EnquiryRowActions";

export default async function EnquiriesPage() {
  const [enquiries, customers] = await Promise.all([
    prisma.enquiry.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    }),
    prisma.customer.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Enquiries</h1>
        <p className="page-subtitle">Capture leads, edit details, and move or archive opportunities.</p>
      </div>

      <div className="card p-5">
        <h2 className="section-title mb-3">New enquiry</h2>
        <form action={createEnquiry} className="grid gap-3 md:grid-cols-4">
          <input className="input" name="contactName" placeholder="Contact name *" required />
          <input className="input" name="mobile" placeholder="Mobile / WhatsApp *" required />
          <select className="input" name="source" defaultValue="PHONE">
            <option value="PHONE">PHONE</option>
            <option value="WHATSAPP">WHATSAPP</option>
            <option value="WEBSITE">WEBSITE</option>
            <option value="WALK_IN">WALK_IN</option>
            <option value="REFERRAL">REFERRAL</option>
            <option value="OTHER">OTHER</option>
          </select>
          <input className="input" name="requirement" placeholder="Requirement (e.g. Termite inspection) *" required />
          <select className="input" name="customerId">
            <option value="">Link existing customer (optional)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.mobile}
              </option>
            ))}
          </select>
          <input className="input md:col-span-2" name="notes" placeholder="Notes (address, timing preference...)" />
          <button className="btn-primary">Create enquiry</button>
        </form>
      </div>

      <BusinessTable>
        <thead>
          <tr className="table-head">
            <th>Enquiry</th>
            <th>Contact / Customer</th>
            <th>Requirement</th>
            <th>Source</th>
            <th>Status & Actions</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {enquiries.length === 0 && (
            <tr>
              <td colSpan={6} className="p-6 text-center text-sm text-gray-500">
                No active enquiries found.
              </td>
            </tr>
          )}
          {enquiries.map((e) => (
            <tr className="table-row" key={e.id}>
              <td className="font-medium text-gray-900">{e.enquiryNumber}</td>
              <td>
                <div className="font-medium">{e.customer?.name ?? e.contactName}</div>
                <div className="text-xs text-gray-500">{e.mobile}</div>
              </td>
              <td>
                <div className="text-sm">{e.requirement}</div>
                {e.notes && <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{e.notes}</div>}
              </td>
              <td>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{e.source}</span>
              </td>
              <td>
                <EnquiryRowActions enquiry={e} />
              </td>
              <td className="text-xs text-gray-500">{e.createdAt.toLocaleDateString("en-IN")}</td>
            </tr>
          ))}
        </tbody>
      </BusinessTable>
    </div>
  );
}
