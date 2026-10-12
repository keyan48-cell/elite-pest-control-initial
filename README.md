# EPCI Elite Pest Control - Full Business Management System

This version extends the working quotation/pricing application with a real operational workflow backed by local MySQL.

## Database

Database name: `elite_pest_control_initial-db`

`.env` example:

```env
DATABASE_URL="mysql://root@localhost:3306/elite_pest_control_initial-db"
NEXTAUTH_SECRET="change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
PRICING_HMAC_SECRET="change-this-in-production"
```

If MySQL root has a password, use `mysql://root:PASSWORD@localhost:3306/elite_pest_control_initial-db`.

## Install

```powershell
npm install
npx prisma validate
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Open http://localhost:3000.

## Seed logins

- admin@epci.com / Admin123!
- manager@epci.com / Manager123!
- sales@epci.com / Sales123!
- tech@epci.com / Tech123!

Change all seeded passwords before production.

## Modules

Dashboard, Customers, Properties, Enquiries, Follow-ups, Services, Pricing, Quotations, Jobs, Technicians, Invoices, Payments, AMC, Reports, Users, Audit Log.

## Core workflow

Enquiry -> Customer/Property -> Quotation -> Accept -> Convert to Job -> Assign Technician -> Service Visit -> Complete -> Invoice -> Payment -> AMC/Follow-up.

## Important implementation note

The application keeps quotation pricing snapshots so later pricing changes do not rewrite historical quotations. Financial totals are still represented with Float in this inherited schema; before production financial use, migrate monetary fields to Prisma Decimal.
