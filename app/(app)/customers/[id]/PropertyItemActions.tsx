"use client";

import { useState } from "react";
import { updateProperty, softDeleteProperty, restoreProperty } from "../../properties/actions";

interface PropertyItemActionsProps {
  property: {
    id: string;
    customerId: string;
    propertyType: string;
    bhkOrRooms: string | null;
    areaSqft: number | null;
    serviceAddress: string;
    deletedAt: Date | null;
  };
}

export default function PropertyItemActions({ property }: PropertyItemActionsProps) {
  const [showEdit, setShowEdit] = useState(false);
  const isDeleted = Boolean(property.deletedAt);

  return (
    <>
      <div className="flex items-center gap-1.5 shrink-0">
        {isDeleted ? (
          <form action={restoreProperty}>
            <input type="hidden" name="id" value={property.id} />
            <input type="hidden" name="customerId" value={property.customerId} />
            <button
              type="submit"
              className="rounded px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
            >
              Restore
            </button>
          </form>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setShowEdit(true)}
              className="rounded px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-100"
            >
              Edit
            </button>
            <form
              action={softDeleteProperty}
              onSubmit={(e) => {
                if (!window.confirm("Soft delete this property address?")) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={property.id} />
              <input type="hidden" name="customerId" value={property.customerId} />
              <button
                type="submit"
                className="rounded px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </form>
          </>
        )}
      </div>

      {/* Edit Property Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Edit Property</h3>
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
                await updateProperty(formData);
                setShowEdit(false);
              }}
              className="mt-4 space-y-3"
            >
              <input type="hidden" name="id" value={property.id} />
              <input type="hidden" name="customerId" value={property.customerId} />

              <div>
                <label className="label">Property Type</label>
                <select
                  className="input"
                  name="propertyType"
                  defaultValue={property.propertyType}
                >
                  <option value="RESIDENTIAL">Residential</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="INDUSTRIAL">Industrial</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="label">BHK / Rooms</label>
                <input
                  className="input"
                  name="bhkOrRooms"
                  defaultValue={property.bhkOrRooms || ""}
                  placeholder="e.g. 2BHK, 3 rooms"
                />
              </div>

              <div>
                <label className="label">Area (sq.ft)</label>
                <input
                  className="input"
                  name="areaSqft"
                  type="number"
                  step="0.01"
                  defaultValue={property.areaSqft || ""}
                />
              </div>

              <div>
                <label className="label">Service Address *</label>
                <textarea
                  className="input"
                  name="serviceAddress"
                  rows={2}
                  defaultValue={property.serviceAddress}
                  required
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
                  Update Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
