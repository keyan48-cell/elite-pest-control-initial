"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { canManageCustomers } from "@/lib/permissions";

const propertySchema = z.object({
  customerId: z.string().min(1),
  propertyType: z.enum(["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "OTHER"]),
  bhkOrRooms: z.string().optional(),
  areaSqft: z.coerce.number().optional(),
  serviceAddress: z.string().min(3, "Service address is required"),
});

export async function createProperty(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !canManageCustomers(session.user.role)) {
    throw new Error("Not authorized");
  }

  const parsed = propertySchema.parse({
    customerId: formData.get("customerId"),
    propertyType: formData.get("propertyType"),
    bhkOrRooms: formData.get("bhkOrRooms") || undefined,
    areaSqft: formData.get("areaSqft") || undefined,
    serviceAddress: formData.get("serviceAddress"),
  });

  await prisma.property.create({
    data: parsed,
  });

  revalidatePath(`/customers/${parsed.customerId}`);
  revalidatePath("/properties");
  redirect(`/customers/${parsed.customerId}`);
}

export async function updateProperty(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !canManageCustomers(session.user.role)) {
    throw new Error("Not authorized");
  }

  const id = String(formData.get("id") || "").trim();
  if (!id) throw new Error("Property ID is required");

  const parsed = propertySchema.parse({
    customerId: formData.get("customerId"),
    propertyType: formData.get("propertyType"),
    bhkOrRooms: formData.get("bhkOrRooms") || undefined,
    areaSqft: formData.get("areaSqft") || undefined,
    serviceAddress: formData.get("serviceAddress"),
  });

  await prisma.property.update({
    where: { id },
    data: {
      propertyType: parsed.propertyType,
      bhkOrRooms: parsed.bhkOrRooms || null,
      areaSqft: parsed.areaSqft || null,
      serviceAddress: parsed.serviceAddress,
    },
  });

  revalidatePath(`/customers/${parsed.customerId}`);
  revalidatePath("/properties");
}

export async function softDeleteProperty(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !canManageCustomers(session.user.role)) {
    throw new Error("Not authorized");
  }

  const id = String(formData.get("id") || "").trim();
  const customerId = String(formData.get("customerId") || "").trim();
  if (!id) throw new Error("Property ID is required");

  await prisma.property.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "PROPERTY_SOFT_DELETED",
      detail: `Property ${id} soft deleted`,
    },
  });

  if (customerId) revalidatePath(`/customers/${customerId}`);
  revalidatePath("/properties");
}

export async function restoreProperty(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !canManageCustomers(session.user.role)) {
    throw new Error("Not authorized");
  }

  const id = String(formData.get("id") || "").trim();
  const customerId = String(formData.get("customerId") || "").trim();
  if (!id) throw new Error("Property ID is required");

  await prisma.property.update({
    where: { id },
    data: { deletedAt: null },
  });

  if (customerId) revalidatePath(`/customers/${customerId}`);
  revalidatePath("/properties");
}
