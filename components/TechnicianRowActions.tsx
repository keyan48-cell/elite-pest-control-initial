"use client";

import { useState, useTransition } from "react";
import { updateTechnician, toggleTechnicianActive, softDeleteTechnician } from "@/app/(app)/business-actions";

interface TechnicianRowActionsProps {
  technician: {
    id: string;
    name: string;
    mobile: string;
    employeeCode: string | null;
    skills: string | null;
    notes: string | null;
    active: boolean;
  };
}

export default function TechnicianRowActions({ technician }: TechnicianRowActionsProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await toggleTechnicianActive(technician.id, !technician.active);
            });
          }}
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${
            technician.active
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {technician.active ? "Active" : "Inactive"}
        </button>

        <button
          type="button"
          onClick={() => setShowEdit(true)}
          className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
        >
          ✎ Edit
        </button>

        <form
          action={softDeleteTechnician}
          onSubmit={(e) => {
            if (!window.confirm(`Delete technician "${technician.name}"? Assignment history will be retained.`)) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={technician.id} />
          <button
            type="submit"
            className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            🗑
          </button>
        </form>
      </div>

      {/* Edit Technician Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Edit Technician</h3>
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
                await updateTechnician(formData);
                setShowEdit(false);
              }}
              className="mt-4 space-y-3"
            >
              <input type="hidden" name="id" value={technician.id} />

              <div>
                <label className="label">Name *</label>
                <input
                  className="input"
                  name="name"
                  defaultValue={technician.name}
                  required
                />
              </div>

              <div>
                <label className="label">Mobile Number *</label>
                <input
                  className="input"
                  name="mobile"
                  defaultValue={technician.mobile}
                  required
                />
              </div>

              <div>
                <label className="label">Employee Code</label>
                <input
                  className="input font-mono"
                  name="employeeCode"
                  defaultValue={technician.employeeCode || ""}
                />
              </div>

              <div>
                <label className="label">Skills / Specialization</label>
                <input
                  className="input"
                  name="skills"
                  defaultValue={technician.skills || ""}
                  placeholder="e.g. Termite, Cockroach, Fumigation"
                />
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input"
                  name="notes"
                  rows={2}
                  defaultValue={technician.notes || ""}
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
