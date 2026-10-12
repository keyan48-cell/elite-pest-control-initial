"use client";

import { useState, useTransition } from "react";
import { toggleUserActive } from "./actions";

export default function UserToggle({ userId, active }: { userId: string; active: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              await toggleUserActive(userId, !active);
            } catch (e: any) {
              setError(e.message);
            }
          })
        }
        className={`badge ${active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
      >
        {active ? "Active" : "Inactive"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
