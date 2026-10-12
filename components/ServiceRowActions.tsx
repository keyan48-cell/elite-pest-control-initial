"use client";

import { useState } from "react";
import ServiceToggle from "@/app/(app)/services/ServiceToggle";
import { updateService, softDeleteService } from "@/app/(app)/services/actions";

interface ServiceRowActionsProps {
  service: {
    id: string;
    name: string;
    description: string | null;
    warrantyMonths: number;
    active: boolean;
  };
}

export default function ServiceRowActions({ service }: ServiceRowActionsProps) {
  const [showEdit, setShowEdit] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <ServiceToggle serviceId={service.id} active={service.active} />

        <button
          type="button"
          onClick={() => setShowEdit(true)}
          className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
        >
          ✎ Edit
        </button>

        <form
          action={softDeleteService}
          onSubmit={(e) => {
            if (!window.confirm(`Delete service "${service.name}"? Historical quotes will remain unchanged.`)) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={service.id} />
          <button
            type="submit"
            className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            🗑
          </button>
        </form>
      </div>

      {/* Edit Service Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Edit Service</h3>
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
                await updateService(formData);
                setShowEdit(false);
              }}
              className="mt-4 space-y-3"
            >
              <input type="hidden" name="id" value={service.id} />

              <div>
                <label className="label">Service Name *</label>
                <input
                  className="input"
                  name="name"
                  defaultValue={service.name}
                  required
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  className="input"
                  name="description"
                  rows={2}
                  defaultValue={service.description || ""}
                />
              </div>

              <div>
                <label className="label">Warranty (months)</label>
                <input
                  className="input"
                  type="number"
                  name="warrantyMonths"
                  min={0}
                  defaultValue={service.warrantyMonths}
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
