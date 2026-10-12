import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { activatePricingVersion, upsertPricingRule } from "../actions";
import ActivateButton from "./ActivateButton";

export default async function PricingVersionPage({ params }: { params: { versionId: string } }) {
  const version = await prisma.pricingRuleSetVersion.findUnique({
    where: { id: params.versionId },
    include: {
      rules: { include: { service: true } },
      _count: { select: { quotations: true } },
    },
  });
  if (!version) notFound();

  const services = await prisma.service.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  const locked = version._count.quotations > 0;
  const ruleByService = new Map<string, (typeof version.rules)[number]>(
    version.rules.map((r) => [r.serviceId, r])
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Version {version.version} {version.label ? `— ${version.label}` : ""}
          </h1>
          <p className="text-sm text-gray-500">
            {locked
              ? "This version has been used by quotations and is locked. Create a new version to change rates."
              : "Set the pricing method, rate and minimum charge for each service."}
          </p>
        </div>
        {!version.isActive && <ActivateButton versionId={version.id} />}
        {version.isActive && <span className="badge bg-green-100 text-green-700">Active</span>}
      </div>

      <div className="card divide-y divide-gray-100">
        {services.map((s) => {
          const rule = ruleByService.get(s.id);
          return (
            <form
              key={s.id}
              action={upsertPricingRule}
              className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-6 sm:items-end"
            >
              <input type="hidden" name="versionId" value={version.id} />
              <input type="hidden" name="serviceId" value={s.id} />
              <div className="sm:col-span-2">
                <div className="text-sm font-medium text-gray-900">{s.name}</div>
                <div className="text-xs text-gray-500">Warranty {s.warrantyMonths} mo</div>
              </div>
              <div>
                <label className="label">Method</label>
                <select className="input" name="method" defaultValue={rule?.method ?? "FIXED"} disabled={locked}>
                  <option value="FIXED">Fixed</option>
                  <option value="BHK">BHK</option>
                  <option value="ROOM">Room</option>
                  <option value="SQFT">Sq.ft</option>
                  <option value="VISIT">Visit</option>
                  <option value="UNIT">Unit</option>
                  <option value="STATION">Station</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="TIERED">Tiered</option>
                </select>
              </div>
              <div>
                <label className="label">Rate (₹)</label>
                <input
                  className="input"
                  name="rate"
                  type="number"
                  step="0.01"
                  defaultValue={rule?.rate ?? ""}
                  disabled={locked}
                  required
                />
              </div>
              <div>
                <label className="label">Minimum charge (₹)</label>
                <input
                  className="input"
                  name="minimumCharge"
                  type="number"
                  step="0.01"
                  defaultValue={rule?.minimumCharge ?? 0}
                  disabled={locked}
                />
              </div>
              <div>
                <label className="label">Tiers JSON (Tiered only)</label>
                <input
                  className="input"
                  name="tiersJson"
                  placeholder='[{"upTo":1000,"rate":8},{"upTo":null,"rate":6}]'
                  defaultValue={rule?.tiersJson ?? ""}
                  disabled={locked}
                />
              </div>
              {!locked && (
                <button type="submit" className="btn-secondary sm:col-span-6 sm:w-fit">
                  Save {s.name} rule
                </button>
              )}
            </form>
          );
        })}
      </div>
    </div>
  );
}
