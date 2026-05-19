import { useState, useEffect } from "react";
import { resellerApi } from "@/api/reseller";
import { createPageUrl } from "@/utils";
import ResellerDashboardComponent from "@/components/reseller/ResellerDashboard";

export default function ResellerDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isReseller, setIsReseller] = useState(false);

  useEffect(() => {
    const guard = async () => {
      try {
        const reseller = await resellerApi.auth.me();
        if (reseller?.id) {
          setIsReseller(true);
        } else {
          window.location.href = createPageUrl("ResellerLogin");
        }
      } catch (e) {
        window.location.href = createPageUrl("ResellerLogin");
      } finally {
        setIsLoading(false);
      }
    };
    guard();
  }, []);

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-background text-foreground">
        Loading Reseller Dashboard...
      </div>
    );
  }

  if (!isReseller) return null;
  return <ResellerDashboardComponent />;
}
