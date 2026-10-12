import { PrismaClient, PricingMethod, DiscountType, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ---- Users (Section 2) ----
  const users: { name: string; email: string; password: string; role: Role }[] = [
    { name: "Admin User", email: "admin@epci.com", password: "Admin123!", role: "ADMIN" },
    { name: "Ops Manager", email: "manager@epci.com", password: "Manager123!", role: "MANAGER" },
    { name: "Sales Rep", email: "sales@epci.com", password: "Sales123!", role: "SALES" },
    { name: "Field Technician", email: "tech@epci.com", password: "Tech123!", role: "TECHNICIAN" },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, passwordHash, role: u.role },
    });
  }
  console.log("Seeded users.");

  // ---- Services (Section 6) ----
  const serviceDefs = [
    { name: "Cockroach Control", warrantyMonths: 6, method: "SQFT" as PricingMethod, rate: 5, min: 800 },
    { name: "Termite Treatment", warrantyMonths: 60, method: "SQFT" as PricingMethod, rate: 8, min: 2500 },
    { name: "Bed Bug Treatment", warrantyMonths: 3, method: "ROOM" as PricingMethod, rate: 1500, min: 1500 },
    { name: "Rodent Control", warrantyMonths: 3, method: "STATION" as PricingMethod, rate: 600, min: 1200 },
    { name: "Mosquito Control", warrantyMonths: 1, method: "VISIT" as PricingMethod, rate: 1000, min: 1000 },
    { name: "General Pest AMC", warrantyMonths: 12, method: "CONTRACT" as PricingMethod, rate: 6000, min: 6000 },
  ];

  const services = [];
  for (const s of serviceDefs) {
    const service = await prisma.service.upsert({
      where: { name: s.name },
      update: {},
      create: { name: s.name, warrantyMonths: s.warrantyMonths },
    });
    services.push({ service, method: s.method, rate: s.rate, min: s.min });
  }
  console.log("Seeded services.");

  // ---- Pricing version + rules (Section 7, illustrative rates only) ----
  const existingActive = await prisma.pricingRuleSetVersion.findFirst({ where: { isActive: true } });
  if (!existingActive) {
    const version = await prisma.pricingRuleSetVersion.create({
      data: { label: "Initial seeded rates (illustrative)", isActive: true },
    });

    for (const s of services) {
      await prisma.pricingRule.create({
        data: {
          serviceId: s.service.id,
          versionId: version.id,
          method: s.method,
          rate: s.rate,
          minimumCharge: s.min,
        },
      });
    }
    console.log("Seeded active pricing version with illustrative rates.");
  } else {
    console.log("Active pricing version already exists, skipping.");
  }

  // ---- Add-ons (Section 8) ----
  const addOns = [
    { name: "Kitchen Deep Treatment", amount: 500 },
    { name: "Additional Room", amount: 400 },
    { name: "Emergency Same-Day Service", amount: 800 },
  ];
  for (const a of addOns) {
    const existing = await prisma.addOn.findFirst({ where: { name: a.name } });
    if (!existing) await prisma.addOn.create({ data: a });
  }
  console.log("Seeded add-ons.");

  // ---- Surcharges (Section 8) ----
  const surcharges = [
    { name: "Difficult Access Surcharge", amount: 500, requiresApproval: true },
    { name: "Multi-Storey Surcharge", amount: 300, requiresApproval: false },
  ];
  for (const s of surcharges) {
    const existing = await prisma.surcharge.findFirst({ where: { name: s.name } });
    if (!existing) await prisma.surcharge.create({ data: s });
  }
  console.log("Seeded surcharges.");

  // ---- Discount rules (Section 8, role-based limits) ----
  const discounts: { name: string; type: DiscountType; value: number; maxRole: Role }[] = [
    { name: "Loyalty 5%", type: "PERCENT", value: 5, maxRole: "SALES" },
    { name: "Manager 10%", type: "PERCENT", value: 10, maxRole: "MANAGER" },
    { name: "Admin Override 20%", type: "PERCENT", value: 20, maxRole: "ADMIN" },
  ];
  for (const d of discounts) {
    const existing = await prisma.discountRule.findFirst({ where: { name: d.name } });
    if (!existing) await prisma.discountRule.create({ data: d });
  }
  console.log("Seeded discount rules.");
  // ---- Technicians ----
  const technicians = [
    { name: "Ramesh Kumar", mobile: "9000000001", employeeCode: "TECH-001", skills: "General Pest, Cockroach, Termite" },
    { name: "Suresh Babu", mobile: "9000000002", employeeCode: "TECH-002", skills: "Bed Bug, Rodent, Mosquito" },
  ];
  for (const t of technicians) {
    const existing = await prisma.technician.findFirst({ where: { employeeCode: t.employeeCode } });
    if (!existing) await prisma.technician.create({ data: t });
  }
  console.log("Seeded technicians.");


  console.log("\nSeed complete. Login with:");
  users.forEach((u) => console.log(`  ${u.role.padEnd(10)} ${u.email} / ${u.password}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
