"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { canManageServices } from "@/lib/permissions";

const serviceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  warrantyMonths: z.coerce.number().int().min(0).default(0),
});

export async function createService(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !canManageServices(session.user.role)) throw new Error("Not authorized");

  const parsed = serviceSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    warrantyMonths: formData.get("warrantyMonths") || 0,
  });

  await prisma.service.create({ data: parsed });
  revalidatePath("/services");
}

export async function updateService(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !canManageServices(session.user.role)) throw new Error("Not authorized");

  const id = String(formData.get("id") || "").trim();
  if (!id) throw new Error("Service ID is required");

  const parsed = serviceSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    warrantyMonths: formData.get("warrantyMonths") || 0,
  });

  await prisma.service.update({
    where: { id },
    data: {
      name: parsed.name,
      description: parsed.description || null,
      warrantyMonths: parsed.warrantyMonths,
    },
  });
  revalidatePath("/services");
}

export async function toggleServiceActive(serviceId: string, active: boolean) {
  const session = await getServerSession(authOptions);
  if (!session || !canManageServices(session.user.role)) throw new Error("Not authorized");

  await prisma.service.update({ where: { id: serviceId }, data: { active } });
  revalidatePath("/services");
}

export async function softDeleteService(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !canManageServices(session.user.role)) throw new Error("Not authorized");

  const id = String(formData.get("id") || "").trim();
  await prisma.service.update({
    where: { id },
    data: { deletedAt: new Date(), active: false },
  });
  revalidatePath("/services");
}
