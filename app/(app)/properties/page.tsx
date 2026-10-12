import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function PropertiesPage() {
  const properties = await prisma.property.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { customer: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Properties</h1>
        <p className="text-sm text-gray-500">
          Type, BHK/rooms and treatment area — used by area-based pricing.
        </p>
      </div>

      <div className="card divide-y divide-gray-100">
        {properties.length === 0 && (
          <div className="px-5 py-6 text-sm text-gray-500">
            No properties yet. Add one from a customer's page.
          </div>
        )}
        {properties.map((p) => (
          <Link
            key={p.id}
            href={`/customers/${p.customerId}`}
            className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
          >
            <div>
              <div className="text-sm font-medium text-gray-900">{p.serviceAddress}</div>
              <div className="text-xs text-gray-500">{p.customer.name} · {p.customer.mobile}</div>
            </div>
            <div className="text-xs text-gray-500">
              {p.propertyType} {p.bhkOrRooms ? `· ${p.bhkOrRooms}` : ""}{" "}
              {p.areaSqft ? `· ${p.areaSqft} sq.ft` : ""}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
