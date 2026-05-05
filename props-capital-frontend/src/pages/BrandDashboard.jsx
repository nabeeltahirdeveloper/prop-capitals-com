import { useState, useEffect } from "react";
import { brandApi } from "@/api/brand";
import { createPageUrl } from "@/utils";
import BrandDashboardComponent from "@/components/brand/BrandDashboard";

export default function BrandDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isBrand, setIsBrand] = useState(false);

  useEffect(() => {
    const guard = async () => {
      try {
        const brand = await brandApi.auth.me();
        if (brand?.id) {
          setIsBrand(true);
        } else {
          window.location.href = createPageUrl("BrandLogin");
        }
      } catch (e) {
        window.location.href = createPageUrl("BrandLogin");
      } finally {
        setIsLoading(false);
      }
    };
    guard();
  }, []);

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-background text-foreground">
        Loading Brand Dashboard...
      </div>
    );
  }

  if (!isBrand) return null;
  return <BrandDashboardComponent />;
}
