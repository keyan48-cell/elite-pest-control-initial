import { prisma } from "@/lib/prisma";
import BusinessTable from "@/components/BusinessTable";
import { createTechnician } from "../business-actions";
import TechnicianRowActions from "@/components/TechnicianRowActions";

export default async function TechniciansPage() {
  const techs = await prisma.technician.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    include: { assignments: true, visits: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Technicians</h1>
        <p className="page-subtitle">Manage field staff, service workload, and active status.</p>
      </div>

      <div className="card p-5">
        <h2 className="section-title mb-3">Add technician</h2>
        <form action={createTechnician} className="grid gap-3 md:grid-cols-5">
          <input name="name" className="input" placeholder="Name *" required />
          <input name="mobile" className="input" placeholder="Mobile *" required />
          <input name="employeeCode" className="input" placeholder="Employee code" />
          <input name="skills" className="input" placeholder="Skills (e.g. Termite, Cockroach)" />
          <button className="btn-primary">Add technician</button>
        </form>
      </div>

      <BusinessTable>
        <thead>
          <tr className="table-head">
            <th>Name</th>
            <th>Mobile</th>
            <th>Code</th>
            <th>Skills</th>
            <th>Jobs</th>
            <th>Visits</th>
            <th className="text-right">Status & Actions</th>
          </tr>
        </thead>
        <tbody>
          {techs.length === 0 && (
            <tr>
              <td colSpan={7} className="p-6 text-center text-sm text-gray-500">
                No technicians configured yet.
              </td>
            </tr>
          )}
          {techs.map((t) => (
            <tr className="table-row" key={t.id}>
              <td className="font-medium text-gray-900">{t.name}</td>
              <td>{t.mobile}</td>
              <td className="font-mono text-xs">{t.employeeCode || "—"}</td>
              <td className="text-xs text-gray-600">{t.skills || "General"}</td>
              <td>{t.assignments.length}</td>
              <td>{t.visits.length}</td>
              <td className="text-right">
                <div className="flex justify-end">
                  <TechnicianRowActions technician={t} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </BusinessTable>
    </div>
  );
}
