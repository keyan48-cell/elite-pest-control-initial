import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import StatusActions from "./StatusActions";
import { COMPANY_CONFIG } from "@/lib/company";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function normalizeIndianMobile(
  mobile: string | null | undefined
): string | null {
  if (!mobile) return null;

  const value = mobile.replace(/\D/g, "");

  if (value.length === 10) {
    return `91${value}`;
  }

  if (
    value.length === 11 &&
    value.startsWith("0")
  ) {
    return `91${value.substring(1)}`;
  }

  if (
    value.length === 12 &&
    value.startsWith("91")
  ) {
    return value;
  }

  return null;
}

function createWhatsAppMessage(
  quotation: any
) {
  const message = [
    `Hello ${quotation.customer.name},`,
    "",
    `Thank you for choosing Elite Pest Control.`,
    "",
    `Quotation No: ${quotation.quotationNumber}`,
    `Quotation Date: ${new Date(
      quotation.createdAt
    ).toLocaleDateString("en-IN")}`,
    "",
    `Property:`,
    quotation.property.serviceAddress,
    "",
    `Services:`,
  ];

  quotation.items.forEach(
    (item: any) => {
      message.push(
        `• ${item.service.name} x ${item.quantity} - ${formatCurrency(
          item.lineTotal
        )}`
      );
    }
  );

  if (quotation.addOns.length) {
    message.push("");
    message.push("Add-ons:");

    quotation.addOns.forEach(
      (item: any) => {
        message.push(
          `• ${item.addOn.name} - ${formatCurrency(
            item.amountSnapshot
          )}`
        );
      }
    );
  }

  if (quotation.surcharges.length) {
    message.push("");
    message.push("Surcharges:");

    quotation.surcharges.forEach(
      (item: any) => {
        message.push(
          `• ${item.surcharge.name} - ${formatCurrency(
            item.amountSnapshot
          )}`
        );
      }
    );
  }

  message.push("");
  message.push(
    `Subtotal: ${formatCurrency(
      quotation.subtotal
    )}`
  );

  message.push(
    `Discount: ${formatCurrency(
      quotation.discountAmount
    )}`
  );

  message.push(
    `GST (${quotation.taxRatePercent}%): ${formatCurrency(
      quotation.taxAmount
    )}`
  );

  message.push(
    `TOTAL: ${formatCurrency(
      quotation.total
    )}`
  );

  message.push("");
  message.push(`GSTIN: ${COMPANY_CONFIG.gstin}`);
  message.push(`SAC: ${COMPANY_CONFIG.hsnSac} · State: ${COMPANY_CONFIG.state} (${COMPANY_CONFIG.stateCode})`);

  message.push("");
  message.push(
    "Please review the quotation and let us know if you would like to proceed."
  );

  message.push("");
  message.push("Regards,");
  message.push(COMPANY_CONFIG.legalName);
  message.push(`${COMPANY_CONFIG.shortName} — ${COMPANY_CONFIG.tagline}`);

  return message.join("\n");
}

export default async function QuotationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const quotation = await prisma.quotation.findUnique({
    where: {
      id: params.id,
    },
    include: {
      customer: true,
      property: true,
      pricingVersion: true,
      createdBy: true,

      items: {
        include: {
          service: true,
        },
      },

      addOns: {
        include: {
          addOn: true,
        },
      },

      surcharges: {
        include: {
          surcharge: true,
        },
      },
    },
  });

  if (!quotation) {
    notFound();
  }

  /*
   * ---------------------------------------
   * WHATSAPP
   * ---------------------------------------
   */

  const whatsappNumber =
  normalizeIndianMobile(
    quotation.customer.mobile
  );

const whatsappMessage =
  createWhatsAppMessage(quotation);

const whatsappUrl =
  whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        whatsappMessage
      )}`
    : null;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {quotation.quotationNumber}
            </h1>

            <StatusBadge status={quotation.status} />
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              GSTIN: {COMPANY_CONFIG.gstin}
            </span>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            {quotation.customer.name} · Place of Supply: {COMPANY_CONFIG.state} ({COMPANY_CONFIG.stateCode}) · SAC {COMPANY_CONFIG.hsnSac}
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap gap-2">

          {/* EDIT */}
          {quotation.status === "DRAFT" && (
            <Link
              href={`/quotations/${quotation.id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ✎ Edit
            </Link>
          )}

          {/* PDF */}
          <a
            href={`/api/quotations/${quotation.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            📄 PDF
          </a>

          {/* WHATSAPP */}
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              💬 WhatsApp
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-400"
            >
              💬 WhatsApp unavailable
            </button>
          )}

          <StatusActions
            quotationId={quotation.id}
            status={quotation.status}
          />

        </div>
      </div>

      {/* CUSTOMER */}
      <div className="rounded-xl border bg-white p-6">

        <h2 className="mb-4 text-lg font-semibold">
          Customer Details
        </h2>

        <div className="grid gap-4 md:grid-cols-3">

          <div>
            <p className="text-xs text-gray-500">
              Customer
            </p>

            <p className="font-medium">
              {quotation.customer.name}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Mobile
            </p>

            <p className="font-medium">
              {quotation.customer.mobile || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Email
            </p>

            <p className="font-medium">
              {quotation.customer.email || "-"}
            </p>
          </div>

        </div>
      </div>

      {/* PROPERTY */}
      <div className="rounded-xl border bg-white p-6">

        <h2 className="mb-4 text-lg font-semibold">
          Property Details
        </h2>

        <p className="text-sm text-gray-700">
          {quotation.property.serviceAddress}
        </p>

      </div>

      {/* SERVICES */}
      <div className="rounded-xl border bg-white p-6">

        <h2 className="mb-4 text-lg font-semibold">
          Services
        </h2>

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead>
              <tr className="border-b text-left">
                <th className="px-3 py-3">
                  Service
                </th>

                <th className="px-3 py-3">
                  Quantity
                </th>

                <th className="px-3 py-3 text-right">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>

              {quotation.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b"
                >
                  <td className="px-3 py-3">
                    {item.service.name}
                  </td>

                  <td className="px-3 py-3">
                    {item.quantity}
                  </td>

                  <td className="px-3 py-3 text-right">
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}

            </tbody>

          </table>

        </div>
      </div>

      {/* TOTAL */}
      <div className="flex justify-end">

        <div className="w-full rounded-xl border bg-white p-6 md:w-96">

          <div className="flex justify-between py-2 text-sm text-gray-600">
            <span>Subtotal</span>
            <span>
              {formatCurrency(quotation.subtotal)}
            </span>
          </div>

          {quotation.discountAmount > 0 && (
            <div className="flex justify-between py-2 text-sm text-gray-600">
              <span>Discount</span>
              <span>
                -{formatCurrency(quotation.discountAmount)}
              </span>
            </div>
          )}

          <div className="flex justify-between py-2 text-sm text-gray-600 border-t pt-2">
            <span>Taxable Amount</span>
            <span>
              {formatCurrency(quotation.taxableAmount)}
            </span>
          </div>

          {quotation.taxRatePercent <= 18 ? (
            <>
              <div className="flex justify-between py-1 text-sm text-gray-600">
                <span>CGST ({quotation.taxRatePercent / 2}%)</span>
                <span>
                  {formatCurrency(quotation.taxAmount / 2)}
                </span>
              </div>
              <div className="flex justify-between py-1 text-sm text-gray-600">
                <span>SGST ({quotation.taxRatePercent / 2}%)</span>
                <span>
                  {formatCurrency(quotation.taxAmount / 2)}
                </span>
              </div>
            </>
          ) : (
            <div className="flex justify-between py-1 text-sm text-gray-600">
              <span>GST ({quotation.taxRatePercent}%)</span>
              <span>
                {formatCurrency(quotation.taxAmount)}
              </span>
            </div>
          )}

          <div className="mt-3 flex justify-between border-t pt-4 text-lg font-bold">
            <span>Total</span>
            <span className="text-brand-700">
              {formatCurrency(quotation.total)}
            </span>
          </div>

          <div className="mt-3 border-t pt-2 text-[11px] text-gray-500 text-center">
            Supplier GSTIN: <strong className="text-gray-700">{COMPANY_CONFIG.gstin}</strong> · SAC {COMPANY_CONFIG.hsnSac}
          </div>
        </div>

      </div>

    </div>
  );
}