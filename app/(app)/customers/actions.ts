"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { canManageCustomers } from "@/lib/permissions";

const customerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  mobile: z.string().min(6, "Valid mobile number is required"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
});

export async function createCustomer(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !canManageCustomers(session.user.role)) {
    throw new Error("Not authorized");
  }

  const parsed = customerSchema.parse({
    name: formData.get("name"),
    mobile: formData.get("mobile"),
    email: formData.get("email") || "",
    address: formData.get("address") || "",
    gstNumber: formData.get("gstNumber") || "",
  });

  const customer = await prisma.customer.create({
    data: {
      name: parsed.name,
      mobile: parsed.mobile,
      email: parsed.email || null,
      address: parsed.address || null,
      gstNumber: parsed.gstNumber ? parsed.gstNumber.trim().toUpperCase() : null,
    },
  });

  revalidatePath("/customers");
  redirect(`/customers/${customer.id}`);
}

export async function updateCustomer(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !canManageCustomers(session.user.role)) {
    throw new Error("Not authorized");
  }

  const id = String(formData.get("id") || "").trim();
  if (!id) throw new Error("Customer ID is required");

  const parsed = customerSchema.parse({
    name: formData.get("name"),
    mobile: formData.get("mobile"),
    email: formData.get("email") || "",
    address: formData.get("address") || "",
    gstNumber: formData.get("gstNumber") || "",
  });

  await prisma.customer.update({
    where: { id },
    data: {
      name: parsed.name,
      mobile: parsed.mobile,
      email: parsed.email || null,
      address: parsed.address || null,
      gstNumber: parsed.gstNumber ? parsed.gstNumber.trim().toUpperCase() : null,
    },
  });

  revalidatePath(`/customers/${id}`);
  revalidatePath("/customers");
}

export async function softDeleteCustomer(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !canManageCustomers(session.user.role)) {
    throw new Error("Not authorized");
  }

  const id = String(formData.get("id") || "").trim();
  if (!id) throw new Error("Customer ID is required");

  await prisma.customer.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CUSTOMER_SOFT_DELETED",
      detail: `Customer ${id} marked as deleted`,
    },
  });

  revalidatePath("/customers");
  redirect("/customers");
}

export async function restoreCustomer(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !canManageCustomers(session.user.role)) {
    throw new Error("Not authorized");
  }

  const id = String(formData.get("id") || "").trim();
  if (!id) throw new Error("Customer ID is required");

  await prisma.customer.update({
    where: { id },
    data: { deletedAt: null },
  });

  revalidatePath(`/customers/${id}`);
  revalidatePath("/customers");
}

// Section 4: "Search by mobile/name before creating a new record to reduce duplicates."
export async function searchCustomers(query: string) {
  if (!query.trim()) return [];
  return prisma.customer.findMany({
    where: {
      deletedAt: null,
      OR: [
        { mobile: { contains: query } },
        { name: { contains: query } },
      ],
    },
    take: 8,
    orderBy: { createdAt: "desc" },
  });
}
