import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { QuotationStatus } from "@prisma/client";
import StatusBadge from "@/components/StatusBadge";

const allStatuses: QuotationStatus[] = [
  "DRAFT",
  "SENT",
  "VIEWED",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CONVERTED",
  "CANCELLED",
];

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status as QuotationStatus | undefined;

  const quotations = await prisma.quotation.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { customer: true, property: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Quotations</h1>
          <p className="text-sm text-gray-500">Section 10 lifecycle: Draft → Sent → Viewed → Accepted/Rejected.</p>
        </div>
        <Link href="/quotations/new" className="btn-primary">
          + New quotation
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/quotations" className={`badge ${!status ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-600"}`}>
          All
        </Link>
        {allStatuses.map((s) => (
          <Link
            key={s}
            href={`/quotations?status=${s}`}
            className={`badge ${status === s ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-600"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="card divide-y divide-gray-100">
        {quotations.length === 0 && <div className="px-5 py-6 text-sm text-gray-500">No quotations found.</div>}
        {quotations.map((q) => (
          <Link
            key={q.id}
            href={`/quotations/${q.id}`}
            className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
          >
            <div>
              <div className="text-sm font-medium text-gray-900">{q.quotationNumber}</div>
              <div className="text-xs text-gray-500">
                {q.customer.name} · {q.property.serviceAddress}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-gray-900">₹{q.total.toLocaleString("en-IN")}</div>
              <StatusBadge status={q.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
