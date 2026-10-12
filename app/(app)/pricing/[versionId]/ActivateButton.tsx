"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { activatePricingVersion } from "../actions";

export default function ActivateButton({ versionId }: { versionId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await activatePricingVersion(versionId);
          router.refresh();
        })
      }
      className="btn-primary"
    >
      {isPending ? "Activating…" : "Activate this version"}
    </button>
  );
}
