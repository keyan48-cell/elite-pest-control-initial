"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canCreateQuotation } from "@/lib/permissions";

import {
  calculateLinePrice,
  calculateQuotationTotals,
  signTotals,
} from "@/lib/pricing";

const quotationUpdateSchema = z.object({
  quotationId: z.string().min(1),

  customerId: z.string().min(1),

  propertyId: z.string().min(1),

  items: z
    .array(
      z.object({
        serviceId: z.string().min(1),
        quantity: z.number().positive(),
      })
    )
    .min(1),

  addOnIds: z.array(z.string()).default([]),

  surchargeIds: z.array(z.string()).default([]),

  discountRuleId: z.string().nullable().optional(),

  taxRatePercent: z
    .number()
    .min(0)
    .max(100),

  notes: z.string().optional(),

  validUntil: z.string().nullable().optional(),

  // Proposal-specific fields
  pestTypes: z.string().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  visitFrequency: z.string().optional().nullable(),
  visitCount: z.number().int().min(1).optional().nullable(),
});

export async function updateQuotation(input: unknown) {
  try {
    /*
     * ---------------------------------------
     * AUTHENTICATION
     * ---------------------------------------
     */

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      throw new Error("You are not logged in.");
    }

    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    if (!userId) {
      throw new Error("User session ID is missing.");
    }

    if (!canCreateQuotation(role)) {
      throw new Error(
        "You do not have permission to update quotations."
      );
    }

    /*
     * ---------------------------------------
     * VALIDATE INPUT
     * ---------------------------------------
     */

    const data = quotationUpdateSchema.parse(input);

    /*
     * ---------------------------------------
     * LOAD ORIGINAL QUOTATION
     * ---------------------------------------
     */

    const quotation =
      await prisma.quotation.findUnique({
        where: {
          id: data.quotationId,
        },

        include: {
          pricingVersion: {
            include: {
              rules: true,
            },
          },
        },
      });

    if (!quotation) {
      throw new Error("Quotation not found.");
    }

    /*
     * Only DRAFT quotations can be edited.
     */

    if (quotation.status !== "DRAFT") {
      throw new Error(
        `Quotation ${quotation.quotationNumber} cannot be edited because its status is ${quotation.status}.`
      );
    }

    /*
     * ---------------------------------------
     * CUSTOMER
     * ---------------------------------------
     */

    const customer =
      await prisma.customer.findUnique({
        where: {
          id: data.customerId,
        },
      });

    if (!customer) {
      throw new Error("Selected customer was not found.");
    }

    /*
     * ---------------------------------------
     * PROPERTY
     * ---------------------------------------
     */

    const property =
      await prisma.property.findFirst({
        where: {
          id: data.propertyId,
          customerId: data.customerId,
        },
      });

    if (!property) {
      throw new Error(
        "Selected property does not belong to the selected customer."
      );
    }

    /*
     * ---------------------------------------
     * SERVICE PRICING
     * ---------------------------------------
     *
     * IMPORTANT:
     * We use the quotation's original
     * pricing version.
     */

    const lineItems: {
      serviceId: string;
      methodSnapshot: any;
      rateSnapshot: number;
      minimumChargeSnapshot: number;
      quantity: number;
      lineTotal: number;
    }[] = [];

    for (const item of data.items) {
      const pricingRule =
        quotation.pricingVersion.rules.find(
          (rule) =>
            rule.serviceId === item.serviceId
        );

      if (!pricingRule) {
        throw new Error(
          `No pricing rule found for service ${item.serviceId} in pricing version ${quotation.pricingVersion.version}.`
        );
      }

      if (item.quantity <= 0) {
        throw new Error(
          "Service quantity must be greater than zero."
        );
      }

      const lineTotal = calculateLinePrice(
        pricingRule,
        item.quantity
      );

      lineItems.push({
        serviceId: item.serviceId,

        methodSnapshot: pricingRule.method,

        rateSnapshot: pricingRule.rate,

        minimumChargeSnapshot:
          pricingRule.minimumCharge,

        quantity: item.quantity,

        lineTotal,
      });
    }

    /*
     * ---------------------------------------
     * ADD-ONS
     * ---------------------------------------
     */

    const addOns =
      data.addOnIds.length > 0
        ? await prisma.addOn.findMany({
            where: {
              id: {
                in: data.addOnIds,
              },
              active: true,
            },
          })
        : [];

    if (addOns.length !== data.addOnIds.length) {
      throw new Error(
        "One or more selected add-ons are no longer available."
      );
    }

    /*
     * ---------------------------------------
     * SURCHARGES
     * ---------------------------------------
     */

    const surcharges =
      data.surchargeIds.length > 0
        ? await prisma.surcharge.findMany({
            where: {
              id: {
                in: data.surchargeIds,
              },
              active: true,
            },
          })
        : [];

    if (
      surcharges.length !==
      data.surchargeIds.length
    ) {
      throw new Error(
        "One or more selected surcharges are no longer available."
      );
    }

    /*
     * Approval check
     */

    const roleRank: Record<
      string,
      number
    > = {
      SALES: 1,
      MANAGER: 2,
      ADMIN: 3,
    };

    for (const surcharge of surcharges) {
      if (
        surcharge.requiresApproval &&
        !["ADMIN", "MANAGER"].includes(role)
      ) {
        throw new Error(
          `Surcharge "${surcharge.name}" requires Manager/Admin approval.`
        );
      }
    }

    /*
     * ---------------------------------------
     * DISCOUNT
     * ---------------------------------------
     */

    let discountAmount = 0;

    if (data.discountRuleId) {
      const discountRule =
        await prisma.discountRule.findUnique({
          where: {
            id: data.discountRuleId,
          },
        });

      if (
        !discountRule ||
        !discountRule.active
      ) {
        throw new Error(
          "Selected discount rule is not available."
        );
      }

      const currentRoleRank =
        roleRank[role] ?? 0;

      const requiredRoleRank =
        roleRank[discountRule.maxRole] ?? 0;

      if (
        currentRoleRank <
        requiredRoleRank
      ) {
        throw new Error(
          `Discount "${discountRule.name}" requires ${discountRule.maxRole} approval.`
        );
      }

      const servicesTotal =
        lineItems.reduce(
          (sum, item) =>
            sum + item.lineTotal,
          0
        );

      const addOnsTotal =
        addOns.reduce(
          (sum, item) =>
            sum + item.amount,
          0
        );

      const surchargesTotal =
        surcharges.reduce(
          (sum, item) =>
            sum + item.amount,
          0
        );

      const beforeDiscount =
        servicesTotal +
        addOnsTotal +
        surchargesTotal;

      if (discountRule.type === "PERCENT") {
        discountAmount =
          (beforeDiscount *
            discountRule.value) /
          100;
      } else {
        discountAmount =
          discountRule.value;
      }
    }

    /*
     * ---------------------------------------
     * CALCULATE TOTALS
     * ---------------------------------------
     */

    const totals =
      calculateQuotationTotals({
        lineTotals: lineItems.map(
          (item) => item.lineTotal
        ),

        addOnAmounts: addOns.map(
          (item) => item.amount
        ),

        surchargeAmounts: surcharges.map(
          (item) => item.amount
        ),

        discountAmount,

        taxRatePercent:
          data.taxRatePercent,
      });

    /*
     * ---------------------------------------
     * HMAC SIGNATURE
     * ---------------------------------------
     */

    const signature = signTotals(
      totals,
      quotation.quotationNumber
    );

    /*
     * ---------------------------------------
     * VALID UNTIL
     * ---------------------------------------
     */

    let validUntilDate:
      | Date
      | null = null;

    if (data.validUntil) {
      const parsed =
        new Date(data.validUntil);

      if (
        Number.isNaN(
          parsed.getTime()
        )
      ) {
        throw new Error(
          "Invalid quotation validity date."
        );
      }

      validUntilDate = parsed;
    }

    /*
     * ---------------------------------------
     * DATABASE TRANSACTION
     * ---------------------------------------
     */

    await prisma.$transaction(
      async (tx) => {
        /*
         * Delete existing quotation lines
         */

        await tx.quotationItem.deleteMany({
          where: {
            quotationId:
              quotation.id,
          },
        });

        await tx.quotationAddOn.deleteMany({
          where: {
            quotationId:
              quotation.id,
          },
        });

        await tx.quotationSurcharge.deleteMany({
          where: {
            quotationId:
              quotation.id,
          },
        });

        /*
         * Update quotation itself
         */

        await tx.quotation.update({
          where: {
            id: quotation.id,
          },

          data: {
            customerId:
              data.customerId,

            propertyId:
              data.propertyId,

            subtotal:
              totals.subtotal,

            discountAmount:
              totals.discountAmount,

            taxableAmount:
              totals.taxableAmount,

            taxRatePercent:
              data.taxRatePercent,

            taxAmount:
              totals.taxAmount,

            total:
              totals.total,

            totalsSignature:
              signature,

            discountRuleId:
              data.discountRuleId ||
              null,

            notes:
              data.notes?.trim() ||
              null,

            validUntil:
              validUntilDate,

            pestTypes: data.pestTypes ?? null,
            paymentTerms: data.paymentTerms ?? null,
            visitFrequency: data.visitFrequency ?? null,
            visitCount: data.visitCount ?? null,
          },
        });

        /*
         * Re-create quotation items
         */

        if (lineItems.length > 0) {
          await tx.quotationItem.createMany({
            data: lineItems.map(
              (item) => ({
                quotationId:
                  quotation.id,

                serviceId:
                  item.serviceId,

                methodSnapshot:
                  item.methodSnapshot,

                rateSnapshot:
                  item.rateSnapshot,

                minimumChargeSnapshot:
                  item.minimumChargeSnapshot,

                quantity:
                  item.quantity,

                lineTotal:
                  item.lineTotal,
              })
            ),
          });
        }

        /*
         * Re-create add-ons
         */

        if (addOns.length > 0) {
          await tx.quotationAddOn.createMany({
            data: addOns.map(
              (addOn) => ({
                quotationId:
                  quotation.id,

                addOnId:
                  addOn.id,

                amountSnapshot:
                  addOn.amount,
              })
            ),
          });
        }

        /*
         * Re-create surcharges
         */

        if (surcharges.length > 0) {
          await tx.quotationSurcharge.createMany({
            data: surcharges.map(
              (surcharge) => ({
                quotationId:
                  quotation.id,

                surchargeId:
                  surcharge.id,

                amountSnapshot:
                  surcharge.amount,

                approvedByRole:
                  surcharge.requiresApproval
                    ? role
                    : null,
              })
            ),
          });
        }

        /*
         * Audit log
         */

        await tx.auditLog.create({
          data: {
            userId,

            quotationId:
              quotation.id,

            action:
              "QUOTATION_UPDATED",

            detail:
              `Quotation ${quotation.quotationNumber} updated while in DRAFT status.`,
          },
        });
      }
    );

    /*
     * ---------------------------------------
     * REFRESH
     * ---------------------------------------
     */

    revalidatePath(
      `/quotations/${quotation.id}`
    );

    revalidatePath(
      `/quotations/${quotation.id}/edit`
    );

    revalidatePath("/quotations");

    revalidatePath("/dashboard");

    return {
      success: true,
      id: quotation.id,
    };
  } catch (error: any) {
    console.error(
      "UPDATE QUOTATION ERROR:",
      error
    );

    throw new Error(
      error?.message ||
        "Unable to update quotation."
    );
  }
}