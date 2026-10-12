"use client";

import { useState } from "react";
import { updateCustomer, softDeleteCustomer, restoreCustomer } from "../actions";

interface CustomerHeaderActionsProps {
  customer: {
    id: string;
    name: string;
    mobile: string;
    email: string | null;
    address: string | null;
    gstNumber: string | null;
    deletedAt: Date | null;
  };
}

export default function CustomerHeaderActions({ customer }: CustomerHeaderActionsProps) {
  const [showEdit, setShowEdit] = useState(false);
  const isDeleted = Boolean(customer.deletedAt);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {isDeleted ? (
          <form action={restoreCustomer}>
            <input type="hidden" name="id" value={customer.id} />
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              ⟲ Restore customer
            </button>
          </form>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setShowEdit(true)}
              className="rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              ✎ Edit customer
            </button>
            <form
              action={softDeleteCustomer}
              onSubmit={(e) => {
                if (!window.confirm("Are you sure you want to delete this customer? Quotations, jobs, and invoices will remain intact.")) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={customer.id} />
              <button
                type="submit"
                className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
              >
                🗑 Delete
              </button>
            </form>
          </>
        )}
      </div>

      {/* Edit Customer Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Edit Customer</h3>
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                await updateCustomer(formData);
                setShowEdit(false);
              }}
              className="mt-4 space-y-4"
            >
              <input type="hidden" name="id" value={customer.id} />
              <div>
                <label className="label">Full Name *</label>
                <input
                  className="input"
                  name="name"
                  defaultValue={customer.name}
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Mobile Number *</label>
                  <input
                    className="input"
                    name="mobile"
                    defaultValue={customer.mobile}
                    required
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    className="input"
                    type="email"
                    name="email"
                    defaultValue={customer.email || ""}
                  />
                </div>
              </div>

              <div>
                <label className="label">GST Number (GSTIN)</label>
                <input
                  className="input font-mono uppercase"
                  name="gstNumber"
                  placeholder="e.g. 33AAAAA0000A1Z5"
                  defaultValue={customer.gstNumber || ""}
                />
              </div>

              <div>
                <label className="label">Billing / Service Address</label>
                <textarea
                  className="input"
                  name="address"
                  rows={2}
                  defaultValue={customer.address || ""}
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
