import { prisma } from "@/lib/prisma";
import BusinessTable from "@/components/BusinessTable";
import { createFollowUp } from "../business-actions";
import FollowUpRowActions from "@/components/FollowUpRowActions";

export default async function FollowUpsPage() {
  const [items, enquiries, customers, users] = await Promise.all([
    prisma.followUp.findMany({
      where: { deletedAt: null },
      orderBy: { dueAt: "asc" },
      include: { enquiry: true, customer: true, assignedTo: true },
    }),
    prisma.enquiry.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.customer.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      take: 200,
    }),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Follow-ups</h1>
        <p className="page-subtitle">Track callbacks, quotation follow-ups, and customer commitments.</p>
      </div>

      <div className="card p-5">
        <h2 className="section-title mb-3">Add follow-up</h2>
        <form action={createFollowUp} className="grid gap-3 md:grid-cols-5">
          <select name="enquiryId" className="input">
            <option value="">Link enquiry (optional)</option>
            {enquiries.map((e) => (
              <option key={e.id} value={e.id}>
                {e.enquiryNumber} · {e.contactName}
              </option>
            ))}
          </select>
          <select name="customerId" className="input">
            <option value="">Link customer (optional)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input type="datetime-local" name="dueAt" className="input" required />
          <select name="assignedToId" className="input">
            <option value="">Assign user</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <input name="note" className="input" placeholder="Follow-up note *" required />
          <button className="btn-primary">Add follow-up</button>
        </form>
      </div>

      <BusinessTable>
        <thead>
          <tr className="table-head">
            <th>Due Date & Time</th>
            <th>Contact / Customer</th>
            <th>Note</th>
            <th>Assigned</th>
            <th className="text-right">Status & Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="p-6 text-center text-sm text-gray-500">
                No active follow-ups found.
              </td>
            </tr>
          )}
          {items.map((f) => (
            <tr className="table-row" key={f.id}>
              <td className="font-medium">{f.dueAt.toLocaleString("en-IN")}</td>
              <td>{f.customer?.name ?? f.enquiry?.contactName ?? "—"}</td>
              <td className="text-sm">{f.note}</td>
              <td className="text-xs text-gray-600">{f.assignedTo?.name ?? "Unassigned"}</td>
              <td className="text-right">
                <div className="flex justify-end">
                  <FollowUpRowActions followUp={f} users={users} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </BusinessTable>
    </div>
  );
}
