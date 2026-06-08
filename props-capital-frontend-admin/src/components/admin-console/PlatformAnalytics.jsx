import { Card, CardContent } from "@/components/ui/card";
import { Users, BarChart3, Activity } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";

const StatCard = ({ icon: Icon, title, value, color }) => (
  <Card className="shadow-md">
    <CardContent className="p-6 flex items-center gap-4">
      <div className={`p-3 rounded-lg bg-${color}-100`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{title}</p>
      </div>
    </CardContent>
  </Card>
);

export default function PlatformAnalytics({ analytics }) {
  const { t } = useTranslation();
  return (
    <>
      <StatCard icon={Users} title={t("adminConsole.platformAnalytics.totalUsers", { defaultValue: "Total Users" })} value={analytics.totalUsers} color="blue" />
      <StatCard icon={BarChart3} title={t("adminConsole.platformAnalytics.totalAnalyses", { defaultValue: "Total Analyses" })} value={analytics.totalAnalyses} color="purple" />
      <StatCard icon={Activity} title={t("adminConsole.platformAnalytics.proUsers", { defaultValue: "Pro Users" })} value={analytics.usersByTier.pro || 0} color="green" />
    </>
  );
}