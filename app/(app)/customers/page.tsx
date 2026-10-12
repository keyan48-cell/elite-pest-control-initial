import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  const q = searchParams.q?.trim() ?? "";
  const isArchived = searchParams.status === "archived";

  const [customers, activeCount, archivedCount] = await Promise.all([
    prisma.customer.findMany({
      where: {
        deletedAt: isArchived ? { not: null } : null,
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { mobile: { contains: q } },
                { gstNumber: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { _count: { select: { properties: true, quotations: true } } },
    }),
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.customer.count({ where: { deletedAt: { not: null } } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">Search by mobile or name before creating a new record.</p>
        </div>
        <Link href="/customers/new" className="btn-primary">
          + New customer
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form className="max-w-md flex-1">
          <input type="hidden" name="status" value={isArchived ? "archived" : "active"} />
          <input
            className="input"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by name, mobile, or GSTIN…"
          />
        </form>

        <div className="flex rounded-lg border bg-white p-1 text-xs font-semibold">
          <Link
            href={`/customers?status=active${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded-md px-3 py-1.5 ${
              !isArchived ? "bg-brand-50 text-brand-700" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Active ({activeCount})
          </Link>
          <Link
            href={`/customers?status=archived${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded-md px-3 py-1.5 ${
              isArchived ? "bg-red-50 text-red-700" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Archived ({archivedCount})
          </Link>
        </div>
      </div>

      <div className="card divide-y divide-gray-100">
        {customers.length === 0 && (
          <div className="px-5 py-6 text-sm text-gray-500">
            No {isArchived ? "archived " : ""}customers found{q ? ` for "${q}"` : ""}.
          </div>
        )}
        {customers.map((c) => (
          <Link
            key={c.id}
            href={`/customers/${c.id}`}
            className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{c.name}</span>
                {c.gstNumber && (
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-mono text-blue-700">
                    {c.gstNumber}
                  </span>
                )}
                {c.deletedAt && (
                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                    Deleted
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {c.mobile} {c.email ? `· ${c.email}` : ""}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {c._count.properties} propert{c._count.properties === 1 ? "y" : "ies"} ·{" "}
              {c._count.quotations} quotation{c._count.quotations === 1 ? "" : "s"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
