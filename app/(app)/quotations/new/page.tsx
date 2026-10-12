import { prisma } from "@/lib/prisma";
import QuotationWizard from "./QuotationWizard";

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: { customerId?: string };
}) {
  const [customers, services, addOns, surcharges, discountRules, activeVersion] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: { properties: true },
      take: 200,
    }),
    prisma.service.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.addOn.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.surcharge.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.discountRule.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.pricingRuleSetVersion.findFirst({ where: { isActive: true }, include: { rules: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">New quotation</h1>
        <p className="text-sm text-gray-500">
          Section 9 flow: customer → property → service → quantity → add-ons/surcharges → discount → tax → review.
        </p>
      </div>

      {!activeVersion && (
        <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
          No active pricing version is configured. Ask an Admin/Manager to activate one under Pricing before
          creating quotations.
        </div>
      )}

      <QuotationWizard
        customers={customers.map((c) => ({
          id: c.id,
          name: c.name,
          mobile: c.mobile,
          properties: c.properties.map((p) => ({
            id: p.id,
            serviceAddress: p.serviceAddress,
            areaSqft: p.areaSqft,
            bhkOrRooms: p.bhkOrRooms,
          })),
        }))}
        services={services.map((s) => ({
          id: s.id,
          name: s.name,
          warrantyMonths: s.warrantyMonths,
          hasRule: activeVersion?.rules.some((r) => r.serviceId === s.id) ?? false,
          method: activeVersion?.rules.find((r) => r.serviceId === s.id)?.method ?? null,
        }))}
        addOns={addOns}
        surcharges={surcharges}
        discountRules={discountRules}
        initialCustomerId={searchParams.customerId}
        pricingConfigured={!!activeVersion}
      />
    </div>
  );
}
