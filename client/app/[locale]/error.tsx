"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Page error:", error);
    }
    // Report to Sentry in production
    Sentry.captureException(error, {
      extra: {
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 text-6xl">
        <span role="img" aria-label="warning">&#9888;</span>
      </div>
      <h1 className="mb-2 text-3xl font-bold text-foreground">
        {t("title")}
      </h1>
      <p className="mb-6 max-w-md text-muted-foreground">
        {t("description")}
      </p>
      <Button onClick={reset} size="lg">
        {t("tryAgain")}
      </Button>
    </div>
  );
}
