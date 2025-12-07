import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 text-8xl font-bold text-muted-foreground/30">
        404
      </div>
      <h1 className="mb-2 text-3xl font-bold text-foreground">
        {t("title")}
      </h1>
      <p className="mb-6 max-w-md text-muted-foreground">
        {t("description")}
      </p>
      <Button asChild size="lg">
        <Link href="/">{t("backHome")}</Link>
      </Button>
    </div>
  );
}
