import { prisma } from "@/lib/prisma";

export default async function AuditLogPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: true, quotation: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Audit log</h1>
        <p className="text-sm text-gray-500">
          Price, discount, surcharge and quotation-status changes (Section 16).
        </p>
      </div>

      <div className="card divide-y divide-gray-100">
        {logs.length === 0 && <div className="px-5 py-6 text-sm text-gray-500">No audit entries yet.</div>}
        {logs.map((log) => (
          <div key={log.id} className="px-5 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{log.action}</span>
              <span className="text-xs text-gray-400">{log.createdAt.toLocaleString()}</span>
            </div>
            <div className="text-xs text-gray-500">
              {log.user.name} {log.quotation ? `· ${log.quotation.quotationNumber}` : ""} — {log.detail}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
