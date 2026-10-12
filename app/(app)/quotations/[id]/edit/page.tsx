import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditQuotationForm from "./EditQuotationForm";

export default async function EditQuotationPage({
  params,
}: {
  params: { id: string };
}) {
  const quotation = await prisma.quotation.findUnique({
    where: {
      id: params.id,
    },
    include: {
      customer: {
        include: {
          properties: true,
        },
      },

      property: true,

      pricingVersion: {
        include: {
          rules: true,
        },
      },

      items: true,

      addOns: true,

      surcharges: true,
    },
  });

  if (!quotation) {
    notFound();
  }

  if (quotation.status !== "DRAFT") {
    redirect(`/quotations/${quotation.id}`);
  }

  const [
    customers,
    services,
    addOns,
    surcharges,
    discountRules,
  ] = await Promise.all([
    prisma.customer.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        properties: true,
      },
      take: 200,
    }),

    prisma.service.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.addOn.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.surcharge.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.discountRule.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Edit quotation
        </h1>

        <p className="text-sm text-gray-500">
          Update the draft quotation and recalculate pricing using the
          original pricing version.
        </p>
      </div>

      <EditQuotationForm
        quotation={{
          id: quotation.id,

          customerId: quotation.customerId,

          propertyId: quotation.propertyId,

          taxRatePercent: quotation.taxRatePercent,

          notes: quotation.notes ?? "",

          validUntil: quotation.validUntil
            ? quotation.validUntil.toISOString().slice(0, 10)
            : "",

          discountRuleId: quotation.discountRuleId,

          items: quotation.items.map((item) => ({
            serviceId: item.serviceId,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
          })),

          addOnIds: quotation.addOns.map(
            (item) => item.addOnId
          ),

          surchargeIds: quotation.surcharges.map(
            (item) => item.surchargeId
          ),
        }}

        customers={customers.map((customer) => ({
          id: customer.id,
          name: customer.name,
          mobile: customer.mobile,

          properties: customer.properties.map((property) => ({
            id: property.id,
            serviceAddress: property.serviceAddress,
            areaSqft: property.areaSqft,
            bhkOrRooms: property.bhkOrRooms,
          })),
        }))}

        services={services.map((service) => {
          const pricingRule =
            quotation.pricingVersion.rules.find(
              (rule) => rule.serviceId === service.id
            );

          return {
            id: service.id,
            name: service.name,
            warrantyMonths: service.warrantyMonths,
            method: pricingRule?.method ?? null,
            hasRule: Boolean(pricingRule),
          };
        })}

        addOns={addOns.map((addOn) => ({
          id: addOn.id,
          name: addOn.name,
          amount: addOn.amount,
        }))}

        surcharges={surcharges.map((surcharge) => ({
          id: surcharge.id,
          name: surcharge.name,
          amount: surcharge.amount,
          requiresApproval: surcharge.requiresApproval,
        }))}

        discountRules={discountRules.map((discount) => ({
          id: discount.id,
          name: discount.name,
          type: discount.type,
          value: discount.value,
          maxRole: discount.maxRole,
        }))}
      />
    </div>
  );
}