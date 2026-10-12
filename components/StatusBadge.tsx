import { QuotationStatus } from "@prisma/client";

const styles: Record<QuotationStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  VIEWED: "bg-indigo-100 text-indigo-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-yellow-100 text-yellow-700",
  CONVERTED: "bg-brand-100 text-brand-700",
  CANCELLED: "bg-gray-200 text-gray-500",
};

export default function StatusBadge({ status }: { status: QuotationStatus }) {
  return <span className={`badge ${styles[status]}`}>{status}</span>;
}
