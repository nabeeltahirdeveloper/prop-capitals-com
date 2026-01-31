import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminGetAllViolations } from "@/api/admin";
import { useTranslation } from "../contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataTable from "../components/shared/DataTable";
import StatsCard from "../components/shared/StatsCard";
import {
  Search,
  AlertTriangle,
  Shield,
  Clock,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

export default function AdminViolations() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 50;

  // Fetch violations from backend with pagination
  const { data: response, isLoading } = useQuery({
    queryKey: ["admin-violations", page, limit],
    queryFn: () => adminGetAllViolations(page, limit),
    refetchInterval: 30000,
  });

  const violationsData = response?.data || [];
  const totalPages = response?.totalPages || 1;
  const totalCount = response?.total || 0;

  // Helper function to determine if violation is fatal
  const isFatalViolation = (type) => {
    const fatalTypes = ["DAILY_DRAWDOWN", "OVERALL_DRAWDOWN", "CONSISTENCY"];
    return fatalTypes.includes(type);
  };

  // Helper function to extract percentage from message
  const extractPercentage = (message) => {
    const match = message.match(/(\d+\.?\d*)%/);
    return match ? parseFloat(match[1]) : null;
  };

  // Map backend violation data to frontend format
  const displayViolations = useMemo(() => {
    return (violationsData || []).map((violation) => {
      // Convert backend enum type to frontend lowercase format
      const violationType = violation.type?.toLowerCase() || "unknown";

      // Get threshold from challenge if available
      const challenge = violation.tradingAccount?.challenge;
      let threshold = null;
      if (
        violationType === "daily_drawdown" &&
        challenge?.dailyDrawdownPercent
      ) {
        threshold = challenge.dailyDrawdownPercent;
      } else if (
        violationType === "overall_drawdown" &&
        challenge?.overallDrawdownPercent
      ) {
        threshold = challenge.overallDrawdownPercent;
      }

      // Extract value from message or use null
      const valueAtViolation = extractPercentage(violation.message);

      return {
        id: violation.id,
        account_id:
          violation.tradingAccount?.brokerLogin ||
          violation.tradingAccount?.id ||
          "N/A",
        trader_id: violation.tradingAccount?.user?.email || "N/A",
        type: violationType,
        description: violation.message || "Violation occurred",
        value_at_violation: valueAtViolation,
        threshold: threshold,
        is_fatal: isFatalViolation(violation.type),
        created_date: violation.createdAt,
      };
    });
  }, [violationsData]);

  const filteredViolations = displayViolations.filter((violation) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      violation.trader_id?.toLowerCase().includes(query) ||
      violation.account_id?.toString().toLowerCase().includes(query);
    const matchesType = typeFilter === "all" || violation.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const violationTypes = {
    daily_drawdown: {
      label: t("admin.violations.types.dailyDrawdown"),
      color: "text-red-400",
    },
    overall_drawdown: {
      label: t("admin.violations.types.overallDrawdown"),
      color: "text-red-400",
    },
    news: {
      label: t("admin.violations.types.newsTrading", {
        defaultValue: "News Trading",
      }),
      color: "text-amber-400",
    },
    consistency: {
      label: t("admin.violations.types.consistency", {
        defaultValue: "Consistency",
      }),
      color: "text-red-400",
    },
    rule_break: {
      label: t("admin.violations.types.ruleBreak", {
        defaultValue: "Rule Break",
      }),
      color: "text-orange-400",
    },
  };

  const columns = [
    {
      header: t("admin.violations.table.account"),
      accessorKey: "account_id",
      cell: (row) => (
        <div>
          <p className="text-white font-medium">{row.account_id}</p>
          <p className="text-xs text-slate-300">{row.trader_id}</p>
        </div>
      ),
    },
    {
      header: t("admin.violations.table.type"),
      accessorKey: "type",
      cell: (row) => (
        <span
          className={`font-medium ${
            violationTypes[row.type]?.color || "text-slate-400"
          }`}
        >
          {violationTypes[row.type]?.label || row.type}
        </span>
      ),
    },
    {
      header: t("admin.violations.table.description"),
      accessorKey: "description",
      cell: (row) => {
        // Try to translate description based on type, fallback to original description
        const descriptionKey = `admin.violations.descriptions.${row.type}`;
        const translated = t(descriptionKey, {
          threshold: row.threshold || 5,
        });
        // If translation key doesn't exist (returns the key itself), use original description
        return translated === descriptionKey ? row.description : translated;
      },
    },
    {
      header: t("admin.violations.table.value"),
      accessorKey: "value_at_violation",
      cell: (row) =>
        row.value_at_violation != null ? (
          <span className="text-red-400">
            {row.value_at_violation}%
            {row.threshold != null ? ` / ${row.threshold}%` : ""}
          </span>
        ) : (
          "-"
        ),
    },
    {
      header: t("admin.violations.table.fatal"),
      accessorKey: "is_fatal",
      cell: (row) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            row.is_fatal
              ? "bg-red-500/20 text-red-400"
              : "bg-amber-500/20 text-amber-400"
          }`}
        >
          {row.is_fatal
            ? t("admin.violations.severity.fatal")
            : t("admin.violations.severity.warning")}
        </span>
      ),
    },
    {
      header: t("admin.violations.table.time"),
      accessorKey: "created_date",
      cell: (row) => {
        try {
          if (!row.created_date) return "-";
          const date = new Date(row.created_date);
          if (isNaN(date.getTime())) return "-";
          return format(date, "MMM d, HH:mm");
        } catch (error) {
          return "-";
        }
      },
    },
  ];

  const fatalCount = response?.stats?.fatal ?? 0;
  const warningCount = response?.stats?.warnings ?? 0;
  const todayCount = response?.stats?.today ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {t("admin.violations.title")}
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            {t("admin.violations.subtitle")}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title={t("admin.violations.stats.totalViolations")}
          value={totalCount}
          icon={AlertTriangle}
          gradient="from-red-500 to-pink-500"
        />
        <StatsCard
          title={t("admin.violations.stats.fatalViolations")}
          value={fatalCount}
          icon={Shield}
          gradient="from-red-600 to-red-500"
        />
        <StatsCard
          title={t("admin.violations.stats.warnings")}
          value={warningCount}
          icon={TrendingDown}
          gradient="from-amber-500 to-orange-500"
        />
        <StatsCard
          title={t("admin.violations.stats.today")}
          value={todayCount}
          icon={Clock}
          gradient="from-blue-500 to-cyan-500"
        />
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={t("admin.violations.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[200px] bg-slate-800 border-slate-700 text-white text-sm">
              <SelectValue
                placeholder={t("admin.violations.filter.violationType")}
              />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="all" className="text-white">
                {t("admin.violations.filter.allTypes")}
              </SelectItem>
              <SelectItem value="daily_drawdown" className="text-white">
                {t("admin.violations.filter.dailyDrawdown")}
              </SelectItem>
              <SelectItem value="overall_drawdown" className="text-white">
                {t("admin.violations.filter.overallDrawdown")}
              </SelectItem>
              <SelectItem value="news" className="text-white">
                {t("admin.violations.filter.newsTrading")}
              </SelectItem>
              <SelectItem value="consistency" className="text-white">
                {t("admin.violations.filter.consistency", {
                  defaultValue: "Consistency",
                })}
              </SelectItem>
              <SelectItem value="rule_break" className="text-white">
                {t("admin.violations.filter.ruleBreak", {
                  defaultValue: "Rule Break",
                })}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Violations Table */}
      <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4 md:p-6">
        <DataTable
          columns={columns}
          data={filteredViolations}
          isLoading={isLoading}
          emptyMessage={t("admin.violations.emptyMessage")}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
            <p className="text-xs sm:text-sm text-slate-400">
              {t("admin.violations.pagination.showing", {
                page,
                totalPages,
                total: totalCount,
                defaultValue: `Page ${page} of ${totalPages} (${totalCount} total)`,
              })}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-slate-300 min-w-[3rem] text-center">
                {page}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
