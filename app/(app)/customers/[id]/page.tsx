import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import { createProperty } from "../../properties/actions";
import CustomerHeaderActions from "./CustomerHeaderActions";
import PropertyItemActions from "./PropertyItemActions";

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      properties: { orderBy: { createdAt: "desc" } },
      quotations: { orderBy: { createdAt: "desc" }, include: { property: true } },
    },
  });
  if (!customer) notFound();

  return (
    <div className="space-y-8">
      {customer.deletedAt && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center justify-between">
          <div>
            <strong>Archived Customer:</strong> This customer was soft-deleted on {new Date(customer.deletedAt).toLocaleDateString("en-IN")}. Past records are preserved.
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">{customer.name}</h1>
            {customer.deletedAt && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                Deleted
              </span>
            )}
            {customer.gstNumber && (
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-mono font-semibold text-blue-700">
                GSTIN: {customer.gstNumber}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {customer.mobile} {customer.email ? `· ${customer.email}` : ""}
          </p>
          {customer.address && <p className="text-sm text-gray-500">{customer.address}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CustomerHeaderActions customer={customer} />
          {!customer.deletedAt && (
            <Link
              href={`/quotations/new?customerId=${customer.id}`}
              className="btn-primary"
            >
              + New quotation
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="border-b border-gray-100 px-5 py-4 font-medium text-gray-900">Properties</div>
          <div className="divide-y divide-gray-100">
            {customer.properties.length === 0 && (
              <div className="px-5 py-4 text-sm text-gray-500">No properties yet.</div>
            )}
            {customer.properties.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{p.serviceAddress}</span>
                    {p.deletedAt && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                        Deleted
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {p.propertyType} {p.bhkOrRooms ? `· ${p.bhkOrRooms}` : ""}{" "}
                    {p.areaSqft ? `· ${p.areaSqft} sq.ft` : ""}
                  </div>
                </div>
                <PropertyItemActions property={p} />
              </div>
            ))}
          </div>
          <details className="px-5 py-4 border-t border-gray-100">
            <summary className="cursor-pointer text-sm font-medium text-brand-600">
              + Add property
            </summary>
            <form action={createProperty} className="mt-4 space-y-3">
              <input type="hidden" name="customerId" value={customer.id} />
              <div>
                <label className="label">Property type</label>
                <select className="input" name="propertyType" defaultValue="RESIDENTIAL">
                  <option value="RESIDENTIAL">Residential</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="INDUSTRIAL">Industrial</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="label">BHK / Rooms</label>
                <input className="input" name="bhkOrRooms" placeholder="e.g. 2BHK" />
              </div>
              <div>
                <label className="label">Area (sq.ft)</label>
                <input className="input" name="areaSqft" type="number" step="0.01" />
              </div>
              <div>
                <label className="label">Service address *</label>
                <textarea className="input" name="serviceAddress" rows={2} required />
              </div>
              <button type="submit" className="btn-secondary w-full">
                Save property
              </button>
            </form>
          </details>
        </div>

        <div className="card">
          <div className="border-b border-gray-100 px-5 py-4 font-medium text-gray-900">Quotations</div>
          <div className="divide-y divide-gray-100">
            {customer.quotations.length === 0 && (
              <div className="px-5 py-4 text-sm text-gray-500">No quotations yet.</div>
            )}
            {customer.quotations.map((q) => (
              <Link
                key={q.id}
                href={`/quotations/${q.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">{q.quotationNumber}</div>
                  <div className="text-xs text-gray-500">{q.property.serviceAddress}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium">₹{q.total.toLocaleString("en-IN")}</div>
                  <StatusBadge status={q.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
