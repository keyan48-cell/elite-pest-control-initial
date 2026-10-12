"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { QuotationStatus } from "@prisma/client";
import { updateQuotationStatus } from "../actions";

const nextOptions: Record<
  QuotationStatus,
  {
    status: QuotationStatus;
    label: string;
    style: string;
  }[]
> = {
  DRAFT: [
    {
      status: "SENT",
      label: "Mark as Sent",
      style: "btn-primary",
    },
    {
      status: "CANCELLED",
      label: "Cancel",
      style: "btn-secondary",
    },
  ],

  SENT: [
    {
      status: "VIEWED",
      label: "Mark as Viewed",
      style: "btn-secondary",
    },
    {
      status: "ACCEPTED",
      label: "Mark Accepted",
      style: "btn-primary",
    },
    {
      status: "REJECTED",
      label: "Mark Rejected",
      style: "btn-secondary",
    },
    {
      status: "EXPIRED",
      label: "Mark Expired",
      style: "btn-secondary",
    },
  ],

  VIEWED: [
    {
      status: "ACCEPTED",
      label: "Mark Accepted",
      style: "btn-primary",
    },
    {
      status: "REJECTED",
      label: "Mark Rejected",
      style: "btn-secondary",
    },
    {
      status: "EXPIRED",
      label: "Mark Expired",
      style: "btn-secondary",
    },
  ],

  ACCEPTED: [
    {
      status: "CONVERTED",
      label: "Convert to Job",
      style: "btn-primary",
    },
  ],

  REJECTED: [],
  EXPIRED: [],
  CONVERTED: [],
  CANCELLED: [],
};

export default function StatusActions({
  quotationId,
  status,
}: {
  quotationId: string;
  status: QuotationStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const options = nextOptions[status] ?? [];

  if (!options.length) {
    return null;
  }

  function changeStatus(
    nextStatus: QuotationStatus
  ) {
    setError(null);

    startTransition(async () => {
      try {
        console.log(
          "[Quotation] Updating status:",
          {
            quotationId,
            currentStatus: status,
            nextStatus,
          }
        );

        if (!quotationId) {
          throw new Error(
            "Quotation ID is missing."
          );
        }

        const result =
          await updateQuotationStatus(
            quotationId,
            nextStatus
          );

        console.log(
          "[Quotation] Status updated:",
          result
        );

        router.refresh();
      } catch (error: unknown) {
        console.error(
          "[Quotation] Status update failed:",
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : "Unable to update quotation.";

        setError(message);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">

        {options.map((option) => (
          <button
            key={option.status}
            type="button"
            disabled={isPending}
            onClick={() => {
              if (
                option.status === "CANCELLED"
              ) {
                const confirmed =
                  window.confirm(
                    "Are you sure you want to cancel this quotation?"
                  );

                if (!confirmed) {
                  return;
                }
              }

              if (
                option.status === "CONVERTED"
              ) {
                const confirmed =
                  window.confirm(
                    "Convert this accepted quotation into a Job?"
                  );

                if (!confirmed) {
                  return;
                }
              }

              changeStatus(option.status);
            }}
            className={`${option.style} ${
              isPending
                ? "cursor-not-allowed opacity-60"
                : ""
            }`}
          >
            {isPending
              ? "Updating..."
              : option.label}
          </button>
        ))}

      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <div className="font-semibold">
            Unable to update quotation
          </div>

          <div className="mt-1">
            {error}
          </div>
        </div>
      )}
    </div>
  );
}