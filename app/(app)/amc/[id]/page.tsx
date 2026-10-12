import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createAMCVisit, updateAMCStatus } from "../../business-actions";

export default async function AMCDetail({ params }: { params: { id: string } }) {
  const [contract, techs] = await Promise.all([
    prisma.aMCContract.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        property: true,
        service: true,
        visits: { include: { technician: true }, orderBy: { scheduledAt: "asc" } },
      },
    }),
    prisma.technician.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  if (!contract) return notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{contract.contractNumber}</h1>
        <p className="page-subtitle">{contract.customer.name} · {contract.service.name}</p>
      </div>

      <div className="card grid gap-4 p-5 md:grid-cols-3">
        <div>Period<br /><b>{contract.startDate.toLocaleDateString("en-IN")} – {contract.endDate.toLocaleDateString("en-IN")}</b></div>
        <div>Contract value<br /><b>₹{contract.contractValue.toLocaleString("en-IN")}</b></div>
        <div>Status
          <form action={updateAMCStatus} className="mt-1">
            <input type="hidden" name="id" value={contract.id} />
            <select name="status" defaultValue={contract.status} className="input"><option>ACTIVE</option><option>EXPIRED</option><option>CANCELLED</option></select>
            <button className="btn-secondary mt-2">Update</button>
          </form>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="section-title">AMC visits</h2>
        <form action={createAMCVisit} className="mt-3 grid gap-3 md:grid-cols-3">
          <input type="hidden" name="contractId" value={contract.id} />
          <input name="scheduledAt" type="datetime-local" className="input" required />
          <select name="technicianId" className="input"><option value="">Technician</option>{techs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
          <button className="btn-primary">Schedule visit</button>
        </form>
        <div className="mt-4 space-y-2">
          {contract.visits.length === 0 ? <p className="text-sm text-gray-500">No visits scheduled yet.</p> : contract.visits.map((v) => <div className="rounded-lg border p-3 text-sm" key={v.id}>{v.scheduledAt.toLocaleString("en-IN")} · {v.status} · {v.technician?.name ?? "Unassigned"}</div>)}
        </div>
      </div>
    </div>
  );
}
