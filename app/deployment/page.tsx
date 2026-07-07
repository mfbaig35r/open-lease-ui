"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { DeploymentDetail } from "@/components/deployment/DeploymentDetail";

function DetailFromQuery() {
  const id = useSearchParams().get("id");
  if (!id) return <p className="font-mono text-small text-ink-muted">No deployment selected.</p>;
  return <DeploymentDetail id={id} />;
}

export default function Page() {
  // useSearchParams needs a Suspense boundary; this also keeps the page static-export friendly.
  return (
    <Suspense fallback={<p className="font-mono text-small text-ink-muted">Loading…</p>}>
      <DetailFromQuery />
    </Suspense>
  );
}
