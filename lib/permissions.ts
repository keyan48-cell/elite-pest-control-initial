import { Role } from "@prisma/client";

/**
 * Section 2 — User Roles:
 * Admin: full access incl. users, services, pricing, settings, audit.
 * Manager: operations, quotations, approved pricing/discount activities.
 * Sales: customers, properties, quotations. Master pricing stays protected.
 * Technician: assigned jobs/service reports (future module).
 */

export const canManagePricing = (role: Role) => role === "ADMIN" || role === "MANAGER";
export const canManageServices = (role: Role) => role === "ADMIN";
export const canManageUsers = (role: Role) => role === "ADMIN";
export const canApproveSurcharge = (role: Role) => role === "ADMIN" || role === "MANAGER";
export const canApplyDiscountBeyondDefault = (role: Role) => role === "ADMIN" || role === "MANAGER";
export const canViewAuditLog = (role: Role) => role === "ADMIN";
export const canCreateQuotation = (role: Role) =>
  role === "ADMIN" || role === "MANAGER" || role === "SALES";
export const canManageCustomers = (role: Role) =>
  role === "ADMIN" || role === "MANAGER" || role === "SALES";

export const roleLabel: Record<Role, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  SALES: "Sales",
  TECHNICIAN: "Technician",
};
