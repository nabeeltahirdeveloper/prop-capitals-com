import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatsCard({
  title,
  value,
  change,
  changeType = "positive",
  icon: Icon,
  iconColor = "text-muted-foreground",
}) {
  return (
    <Card className="bg-card border-border p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1">
            {title}
          </p>
          <p className="text-base sm:text-lg md:text-xl font-bold text-foreground">
            {value}
          </p>
          {change && (
            <div
              className={`flex items-center gap-1 mt-1 text-xs sm:text-sm ${
                changeType === "positive" ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {changeType === "positive" ? (
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              ) : (
                <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              )}
              <span>{change}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-1.5 sm:p-2 rounded-lg bg-muted flex-shrink-0">
            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
          </div>
        )}
      </div>
    </Card>
  );
}
