"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "MANAGER", "SALES", "TECHNICIAN"]),
});

export async function createUser(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !canManageUsers(session.user.role)) throw new Error("Not authorized");

  const parsed = userSchema.parse({
    name: formData.get("name"),
    email: (formData.get("email") as string)?.toLowerCase(),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  const passwordHash = await bcrypt.hash(parsed.password, 10);

  await prisma.user.create({
    data: { name: parsed.name, email: parsed.email, passwordHash, role: parsed.role },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "USER_CREATED", detail: `${parsed.email} (${parsed.role})` },
  });

  revalidatePath("/users");
}

export async function toggleUserActive(userId: string, active: boolean) {
  const session = await getServerSession(authOptions);
  if (!session || !canManageUsers(session.user.role)) throw new Error("Not authorized");
  if (session.user.id === userId && !active) throw new Error("You cannot deactivate your own account");

  await prisma.user.update({ where: { id: userId }, data: { active } });
  await prisma.auditLog.create({
    data: { userId: session.user.id, action: active ? "USER_ACTIVATED" : "USER_DEACTIVATED", detail: userId },
  });

  revalidatePath("/users");
}
