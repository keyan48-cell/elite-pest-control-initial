import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  assignTechnician,
  completeJobVisit,
  createInvoiceForJob,
  createJobVisit,
  updateJobStatus,
} from "../../business-actions";

const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default async function JobPage({ params }: { params: { id: string } }) {
  const [job, techs] = await Promise.all([
    prisma.job.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        property: true,
        quotation: { include: { items: { include: { service: true } } } },
        assignments: { include: { technician: true } },
        visits: { include: { technician: true }, orderBy: { scheduledAt: "desc" } },
        invoice: true,
      },
    }),
    prisma.technician.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  if (!job) return notFound();

  const completedVisits = job.visits.filter((v) => v.status === "COMPLETED").length;
  const canInvoice = job.status === "COMPLETED" && Boolean(job.quotation) && !job.invoice;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page-title">{job.jobNumber}</h1>
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">{job.status}</span>
          </div>
          <p className="page-subtitle">{job.customer.name} · {job.property.serviceAddress}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {job.quotation && <Link href={`/quotations/${job.quotation.id}`} className="btn-secondary">View quotation</Link>}
          {job.invoice && <Link href={`/invoices/${job.invoice.id}`} className="btn-primary">View invoice</Link>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5 space-y-5">
          <div>
            <h2 className="section-title">Job control</h2>
            <p className="mt-1 text-sm text-gray-500">Move the job through the service lifecycle.</p>
          </div>
          <form action={updateJobStatus} className="flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="id" value={job.id} />
            <select name="status" defaultValue={job.status} className="input">
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <button className="btn-secondary">Update status</button>
          </form>

          <form action={assignTechnician} className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input type="hidden" name="jobId" value={job.id} />
            <select name="technicianId" className="input" required>
              <option value="">Assign technician</option>
              {techs.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.mobile}</option>)}
            </select>
            <button className="btn-primary">Assign</button>
          </form>

          <div className="rounded-lg bg-gray-50 p-4 text-sm">
            <div className="font-medium text-gray-900">Assigned technician(s)</div>
            <div className="mt-1 text-gray-600">{job.assignments.map((a) => a.technician.name).join(", ") || "None"}</div>
          </div>
        </div>

        <div className="card p-5 space-y-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="section-title">Service visits</h2>
              <p className="mt-1 text-sm text-gray-500">Schedule and complete technician visits.</p>
            </div>
            <div className="text-right text-sm"><div className="font-semibold">{completedVisits}/{job.visits.length}</div><div className="text-gray-500">completed</div></div>
          </div>

          <form action={createJobVisit} className="grid gap-2">
            <input type="hidden" name="jobId" value={job.id} />
            <select name="technicianId" className="input">
              <option value="">Technician</option>
              {techs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <input type="datetime-local" name="scheduledAt" className="input" required />
            <button className="btn-primary">Schedule visit</button>
          </form>

          <div className="space-y-3">
            {job.visits.length === 0 && <div className="rounded-lg border border-dashed p-4 text-sm text-gray-500">No service visits scheduled yet.</div>}
            {job.visits.map((v) => (
              <div key={v.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{v.scheduledAt.toLocaleString("en-IN")}</div>
                    <div className="text-sm text-gray-500">{v.technician?.name || "Technician not assigned"}</div>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold">{v.status}</span>
                </div>
                {v.status !== "COMPLETED" && (
                  <form action={completeJobVisit} className="mt-3 grid gap-2">
                    <input type="hidden" name="id" value={v.id} />
                    <input name="chemicalUsed" className="input" placeholder="Chemical / product used" />
                    <textarea name="notes" className="input min-h-20" placeholder="Service report / technician notes" />
                    <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" name="customerSigned" /> Customer confirmed service</label>
                    <button className="btn-secondary">Complete visit</button>
                  </form>
                )}
                {v.status === "COMPLETED" && (
                  <div className="mt-3 grid gap-1 rounded-lg bg-green-50 p-3 text-sm text-green-800">
                    <div>Completed: {v.completedAt?.toLocaleString("en-IN") || "-"}</div>
                    <div>Chemical: {v.chemicalUsed || "-"}</div>
                    <div>Customer confirmation: {v.customerSigned ? "Yes" : "No"}</div>
                    {v.notes && <div>Notes: {v.notes}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="section-title">Commercial & billing</h2>
            {job.quotation ? (
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <div>Quotation: <Link className="font-medium text-brand-700" href={`/quotations/${job.quotation.id}`}>{job.quotation.quotationNumber}</Link></div>
                <div>Quotation total: <strong className="text-gray-900">{money(job.quotation.total)}</strong></div>
                <div>Job status: <strong className="text-gray-900">{job.status}</strong></div>
              </div>
            ) : <p className="mt-2 text-sm text-gray-500">This job is not linked to a quotation.</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            {job.invoice ? (
              <>
                <Link href={`/invoices/${job.invoice.id}`} className="btn-primary">Open invoice</Link>
                <a href={`/api/invoices/${job.invoice.id}/pdf`} target="_blank" rel="noopener noreferrer" className="btn-secondary">Invoice PDF</a>
              </>
            ) : (
              <form action={createInvoiceForJob}>
                <input type="hidden" name="jobId" value={job.id} />
                <button className="btn-primary" disabled={!canInvoice}>{job.status === "COMPLETED" ? "Create invoice" : "Complete job to invoice"}</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
