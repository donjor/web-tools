"use client";

import { useEffect, useState } from "react";
import { Button } from "@web-tools/ui/components/button";

type Props = {
  href: string;
  seconds?: number;
};

export function ExternalAutoRedirect({ href, seconds = 3 }: Props) {
  const [remaining, setRemaining] = useState(seconds);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (cancelled) return;
    if (remaining <= 0) {
      window.location.href = href;
      return;
    }
    const t = setTimeout(() => setRemaining((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, cancelled, href]);

  if (cancelled) {
    return (
      <p className="text-xs text-(--color-muted-foreground)">
        Auto-redirect cancelled.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs text-(--color-muted-foreground)">
        Redirecting in {remaining}s…
      </p>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCancelled(true)}
        className="h-7 text-xs"
      >
        Cancel
      </Button>
    </div>
  );
}
