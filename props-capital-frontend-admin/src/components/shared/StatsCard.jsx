import React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatsCard({
  title,
  value,
  change,
  changeType = "positive",
  icon: Icon,
  gradient = "from-emerald-500 to-cyan-500",
}) {
  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-3 sm:p-4 relative overflow-hidden">
      <div
        className={`absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br ${gradient} opacity-10 rounded-full transform translate-x-4 sm:translate-x-6 -translate-y-4 sm:-translate-y-6`}
      />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <p className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white">
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
          <div
            className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${gradient} bg-opacity-20 flex-shrink-0`}
          >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
        )}
      </div>
    </Card>
  );
}
