"use client";

import { useTransition } from "react";
import { toggleServiceActive } from "./actions";

export default function ServiceToggle({ serviceId, active }: { serviceId: string; active: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => toggleServiceActive(serviceId, !active))}
      className={`badge ${active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
    >
      {active ? "Active" : "Inactive"}
    </button>
  );
}
