"use client";

import { useState } from "react";
import { updateEnquiry, updateEnquiryStatus, archiveEnquiry, softDeleteEnquiry } from "@/app/(app)/business-actions";

interface EnquiryRowActionsProps {
  enquiry: {
    id: string;
    enquiryNumber: string;
    contactName: string;
    mobile: string;
    source: string;
    requirement: string;
    notes: string | null;
    status: string;
  };
}

const statusOptions = ["NEW", "CONTACTED", "SITE_VISIT", "QUOTATION_SENT", "NEGOTIATION", "WON", "LOST"];

export default function EnquiryRowActions({ enquiry }: EnquiryRowActionsProps) {
  const [showEdit, setShowEdit] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1.5">
        <form action={updateEnquiryStatus} className="flex items-center">
          <input type="hidden" name="id" value={enquiry.id} />
          <select
            name="status"
            defaultValue={enquiry.status}
            onChange={(e) => e.target.form?.requestSubmit()}
            className="rounded-lg border p-1 text-xs font-medium text-gray-700 bg-white"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </form>

        <button
          type="button"
          onClick={() => setShowEdit(true)}
          className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
        >
          ✎ Edit
        </button>

        {enquiry.status !== "LOST" && (
          <form
            action={archiveEnquiry}
            onSubmit={(e) => {
              if (!window.confirm(`Close / Archive enquiry ${enquiry.enquiryNumber}?`)) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={enquiry.id} />
            <button
              type="submit"
              className="rounded px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
              title="Close / Archive Enquiry"
            >
              Archive
            </button>
          </form>
        )}

        <form
          action={softDeleteEnquiry}
          onSubmit={(e) => {
            if (!window.confirm(`Delete enquiry ${enquiry.enquiryNumber}?`)) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={enquiry.id} />
          <button
            type="submit"
            className="rounded px-1.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
            title="Delete Enquiry"
          >
            🗑
          </button>
        </form>
      </div>

      {/* Edit Enquiry Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Edit Enquiry ({enquiry.enquiryNumber})</h3>
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
                await updateEnquiry(formData);
                setShowEdit(false);
              }}
              className="mt-4 space-y-3"
            >
              <input type="hidden" name="id" value={enquiry.id} />

              <div>
                <label className="label">Contact Name *</label>
                <input
                  className="input"
                  name="contactName"
                  defaultValue={enquiry.contactName}
                  required
                />
              </div>

              <div>
                <label className="label">Mobile Number *</label>
                <input
                  className="input"
                  name="mobile"
                  defaultValue={enquiry.mobile}
                  required
                />
              </div>

              <div>
                <label className="label">Lead Source</label>
                <select
                  className="input"
                  name="source"
                  defaultValue={enquiry.source}
                >
                  <option value="PHONE">PHONE</option>
                  <option value="WHATSAPP">WHATSAPP</option>
                  <option value="WEBSITE">WEBSITE</option>
                  <option value="WALK_IN">WALK_IN</option>
                  <option value="REFERRAL">REFERRAL</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div>
                <label className="label">Service Requirement *</label>
                <input
                  className="input"
                  name="requirement"
                  defaultValue={enquiry.requirement}
                  required
                />
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input"
                  name="notes"
                  rows={2}
                  defaultValue={enquiry.notes || ""}
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-800"
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
