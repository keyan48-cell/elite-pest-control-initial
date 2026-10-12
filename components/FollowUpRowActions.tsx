"use client";

import { useState } from "react";
import { updateFollowUp, editFollowUp, cancelFollowUp, softDeleteFollowUp } from "@/app/(app)/business-actions";

interface FollowUpRowActionsProps {
  followUp: {
    id: string;
    dueAt: Date;
    note: string;
    status: string;
    assignedToId: string | null;
  };
  users: { id: string; name: string }[];
}

export default function FollowUpRowActions({ followUp, users }: FollowUpRowActionsProps) {
  const [showEdit, setShowEdit] = useState(false);
  const formattedDate = new Date(followUp.dueAt).toISOString().slice(0, 16);

  return (
    <>
      <div className="flex items-center gap-1.5">
        <form action={updateFollowUp} className="flex items-center">
          <input type="hidden" name="id" value={followUp.id} />
          <select
            name="status"
            defaultValue={followUp.status}
            onChange={(e) => e.target.form?.requestSubmit()}
            className="rounded-lg border p-1 text-xs font-medium text-gray-700 bg-white"
          >
            <option value="PENDING">PENDING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </form>

        <button
          type="button"
          onClick={() => setShowEdit(true)}
          className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
        >
          ✎ Edit
        </button>

        {followUp.status !== "CANCELLED" && (
          <form
            action={cancelFollowUp}
            onSubmit={(e) => {
              if (!window.confirm("Cancel this follow-up reminder?")) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={followUp.id} />
            <button
              type="submit"
              className="rounded px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
              title="Cancel Follow-up"
            >
              Cancel
            </button>
          </form>
        )}

        <form
          action={softDeleteFollowUp}
          onSubmit={(e) => {
            if (!window.confirm("Delete this follow-up?")) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={followUp.id} />
          <button
            type="submit"
            className="rounded px-1.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
            title="Delete Follow-up"
          >
            🗑
          </button>
        </form>
      </div>

      {/* Edit FollowUp Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Edit Follow-up</h3>
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
                await editFollowUp(formData);
                setShowEdit(false);
              }}
              className="mt-4 space-y-3"
            >
              <input type="hidden" name="id" value={followUp.id} />

              <div>
                <label className="label">Due Date & Time *</label>
                <input
                  className="input"
                  type="datetime-local"
                  name="dueAt"
                  defaultValue={formattedDate}
                  required
                />
              </div>

              <div>
                <label className="label">Assign To</label>
                <select
                  className="input"
                  name="assignedToId"
                  defaultValue={followUp.assignedToId || ""}
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Note / Task Description *</label>
                <textarea
                  className="input"
                  name="note"
                  rows={3}
                  defaultValue={followUp.note}
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
