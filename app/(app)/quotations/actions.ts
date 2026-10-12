"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { QuotationStatus } from "@prisma/client";

const allowedTransitions: Record<
  QuotationStatus,
  QuotationStatus[]
> = {
  DRAFT: [
    "SENT",
    "CANCELLED",
  ],

  SENT: [
    "VIEWED",
    "ACCEPTED",
    "REJECTED",
    "EXPIRED",
    "CANCELLED",
  ],

  VIEWED: [
    "ACCEPTED",
    "REJECTED",
    "EXPIRED",
    "CANCELLED",
  ],

  ACCEPTED: [
    "CONVERTED",
    "CANCELLED",
  ],

  REJECTED: [],
  EXPIRED: [],
  CONVERTED: [],
  CANCELLED: [],
};

export async function updateQuotationStatus(
  quotationId: string,
  nextStatus: QuotationStatus
) {
  console.log(
    "[Quotation Status] START",
    {
      quotationId,
      nextStatus,
    }
  );

  /*
   * ----------------------------------------
   * AUTH
   * ----------------------------------------
   */

  const session =
    await getServerSession(authOptions);

  if (!session?.user) {
    console.error(
      "[Quotation Status] No session"
    );

    throw new Error(
      "Your login session has expired. Please sign in again."
    );
  }

  const userId = session.user.id;
  const role = session.user.role;

  console.log(
    "[Quotation Status] User:",
    {
      userId,
      role,
    }
  );

  if (!userId) {
    throw new Error(
      "User ID is missing from the login session."
    );
  }

  /*
   * ----------------------------------------
   * LOAD QUOTATION
   * ----------------------------------------
   */

  const quotation =
    await prisma.quotation.findUnique({
      where: {
        id: quotationId,
      },
    });

  if (!quotation) {
    throw new Error(
      "Quotation was not found."
    );
  }

  console.log(
    "[Quotation Status] Current:",
    quotation.status
  );

  /*
   * ----------------------------------------
   * VALIDATE TRANSITION
   * ----------------------------------------
   */

  const allowed =
    allowedTransitions[
      quotation.status
    ] || [];

  if (!allowed.includes(nextStatus)) {
    throw new Error(
      `Cannot change quotation from ${quotation.status} to ${nextStatus}.`
    );
  }

  /*
   * ----------------------------------------
   * CONVERT ACCEPTED → JOB
   * ----------------------------------------
   */

  if (nextStatus === "CONVERTED") {
    const existingJob =
      await prisma.job.findUnique({
        where: {
          quotationId,
        },
      });

    if (existingJob) {
      throw new Error(
        `This quotation is already converted to Job ${existingJob.jobNumber}.`
      );
    }

    const jobCount =
      await prisma.job.count();

    const jobNumber =
      `JOB-${new Date()
        .toISOString()
        .slice(0, 10)
        .replaceAll("-", "")}-${String(
        jobCount + 1
      ).padStart(4, "0")}`;

    console.log(
      "[Quotation Status] Creating Job:",
      jobNumber
    );

    await prisma.$transaction(
      async (tx) => {
        await tx.job.create({
          data: {
            jobNumber,

            quotationId,

            customerId:
              quotation.customerId,

            propertyId:
              quotation.propertyId,

            status: "SCHEDULED",

            notes:
              quotation.notes,

            createdById:
              userId,
          },
        });

        await tx.quotation.update({
          where: {
            id: quotationId,
          },

          data: {
            status:
              "CONVERTED",
          },
        });

        await tx.auditLog.create({
          data: {
            userId,

            quotationId,

            action:
              "CONVERT_TO_JOB",

            detail:
              `Quotation ${quotation.quotationNumber} converted to Job ${jobNumber}`,
          },
        });
      }
    );

    console.log(
      "[Quotation Status] Job created successfully"
    );
  } else {
    /*
     * ----------------------------------------
     * NORMAL STATUS CHANGE
     * ----------------------------------------
     */

    await prisma.$transaction(
      async (tx) => {
        await tx.quotation.update({
          where: {
            id: quotationId,
          },

          data: {
            status:
              nextStatus,
          },
        });

        await tx.auditLog.create({
          data: {
            userId,

            quotationId,

            action:
              "STATUS_CHANGE",

            detail:
              `${quotation.status} -> ${nextStatus}`,
          },
        });
      }
    );
  }

  /*
   * ----------------------------------------
   * REFRESH
   * ----------------------------------------
   */

  revalidatePath(
    `/quotations/${quotationId}`
  );

  revalidatePath(
    "/quotations"
  );

  revalidatePath(
    "/dashboard"
  );

  revalidatePath(
    "/jobs"
  );

  console.log(
    "[Quotation Status] SUCCESS"
  );

  return {
    success: true,

    quotationId,

    status:
      nextStatus,
  };
}