import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createPricingVersion } from "./actions";

export default async function PricingPage() {
  const versions = await prisma.pricingRuleSetVersion.findMany({
    orderBy: { version: "desc" },
    include: { _count: { select: { rules: true, quotations: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Pricing management</h1>
        <p className="text-sm text-gray-500">
          Rates are grouped into versions. Only one version is active at a time — new quotations always use
          the active version, and historical quotations keep the version they were created with (Section 11).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 card divide-y divide-gray-100">
          {versions.map((v) => (
            <Link
              key={v.id}
              href={`/pricing/${v.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
            >
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Version {v.version} {v.label ? `— ${v.label}` : ""}
                </div>
                <div className="text-xs text-gray-500">
                  {v._count.rules} rule{v._count.rules === 1 ? "" : "s"} · used by {v._count.quotations}{" "}
                  quotation{v._count.quotations === 1 ? "" : "s"}
                </div>
              </div>
              {v.isActive && <span className="badge bg-green-100 text-green-700">Active</span>}
            </Link>
          ))}
        </div>

        <form action={createPricingVersion} className="card p-5 space-y-3 h-fit">
          <h2 className="font-medium text-gray-900">New rate version</h2>
          <div>
            <label className="label">Label</label>
            <input className="input" name="label" placeholder="e.g. 2026 Q1 rates" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="cloneFromActive" defaultChecked />
            Start from current active rates
          </label>
          <button type="submit" className="btn-primary w-full">
            Create version
          </button>
        </form>
      </div>
    </div>
  );
}
