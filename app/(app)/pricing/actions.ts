"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { canManagePricing } from "@/lib/permissions";

// Section 7/11: rates are grouped into versions. A new version is created
// (optionally cloning the currently active one) rather than mutating rates
// in place, so historical quotations remain untouched.
export async function createPricingVersion(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !canManagePricing(session.user.role)) throw new Error("Not authorized");

  const label = (formData.get("label") as string) || null;
  const cloneFromActive = formData.get("cloneFromActive") === "on";

  const newVersion = await prisma.pricingRuleSetVersion.create({
    data: { label, isActive: false },
  });

  if (cloneFromActive) {
    const active = await prisma.pricingRuleSetVersion.findFirst({
      where: { isActive: true },
      include: { rules: true },
    });
    if (active) {
      await prisma.pricingRule.createMany({
        data: active.rules.map((r) => ({
          serviceId: r.serviceId,
          versionId: newVersion.id,
          method: r.method,
          rate: r.rate,
          minimumCharge: r.minimumCharge,
          tiersJson: r.tiersJson,
        })),
      });
    }
  }

  revalidatePath("/pricing");
  redirect(`/pricing/${newVersion.id}`);
}

const ruleSchema = z.object({
  versionId: z.string().min(1),
  serviceId: z.string().min(1),
  method: z.enum(["FIXED", "BHK", "ROOM", "SQFT", "VISIT", "UNIT", "STATION", "CONTRACT", "TIERED"]),
  rate: z.coerce.number().min(0),
  minimumCharge: z.coerce.number().min(0).default(0),
  tiersJson: z.string().optional(),
});

export async function upsertPricingRule(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !canManagePricing(session.user.role)) throw new Error("Not authorized");

  const parsed = ruleSchema.parse({
    versionId: formData.get("versionId"),
    serviceId: formData.get("serviceId"),
    method: formData.get("method"),
    rate: formData.get("rate"),
    minimumCharge: formData.get("minimumCharge") || 0,
    tiersJson: formData.get("tiersJson") || undefined,
  });

  const version = await prisma.pricingRuleSetVersion.findUnique({
    where: { id: parsed.versionId },
    include: { _count: { select: { quotations: true } } },
  });
  if (!version) throw new Error("Version not found");
  if (version._count.quotations > 0) {
    throw new Error("This version has already been used by quotations and can no longer be edited. Create a new version.");
  }

  const existing = await prisma.pricingRule.findFirst({
    where: { versionId: parsed.versionId, serviceId: parsed.serviceId },
  });

  if (existing) {
    await prisma.pricingRule.update({
      where: { id: existing.id },
      data: {
        method: parsed.method,
        rate: parsed.rate,
        minimumCharge: parsed.minimumCharge,
        tiersJson: parsed.tiersJson || null,
      },
    });
  } else {
    await prisma.pricingRule.create({
      data: {
        versionId: parsed.versionId,
        serviceId: parsed.serviceId,
        method: parsed.method,
        rate: parsed.rate,
        minimumCharge: parsed.minimumCharge,
        tiersJson: parsed.tiersJson || null,
      },
    });
  }

  revalidatePath(`/pricing/${parsed.versionId}`);
}

export async function activatePricingVersion(versionId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !canManagePricing(session.user.role)) throw new Error("Not authorized");

  await prisma.$transaction([
    prisma.pricingRuleSetVersion.updateMany({ data: { isActive: false }, where: {} }),
    prisma.pricingRuleSetVersion.update({ where: { id: versionId }, data: { isActive: true } }),
  ]);

  revalidatePath("/pricing");
}
