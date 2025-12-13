import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "offline" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function OfflinePage() {
  const t = useTranslations("offline");

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
      <WifiOff className="h-16 w-16 text-muted-foreground mb-6" />
      <h1 className="text-2xl font-bold mb-2">{t("title")}</h1>
      <p className="text-muted-foreground mb-6 max-w-md">{t("description")}</p>
      <Button onClick={() => window.location.reload()}>{t("retry")}</Button>
    </div>
  );
}
