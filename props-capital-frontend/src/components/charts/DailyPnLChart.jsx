import React from "react";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";

export default function DailyPnLChart({ data }) {
  const { t } = useTranslation();
  const chartData = data || generateSampleData();

  const totalProfit = chartData.reduce(
    (sum, d) => (d.pnl > 0 ? sum + d.pnl : sum),
    0,
  );
  const totalLoss = chartData.reduce(
    (sum, d) => (d.pnl < 0 ? sum + d.pnl : sum),
    0,
  );
  const netPnL = totalProfit + totalLoss;
  const winningDays = chartData.filter((d) => d.pnl > 0).length;
  const losingDays = chartData.filter((d) => d.pnl < 0).length;

  return (
    <Card className="bg-slate-900 border-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-400" />
          <h3 className="text-xs   sm:text-lg font-semibold text-white">
            {t("analytics.dailyPL")}
          </h3>
        </div>
        <div className="flex items-center  gap-1 sm:gap-6 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">
              {winningDays} {t("analytics.winningDays")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-slate-400">
              {losingDays} {t("analytics.losingDays")}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center overflow-hidden">
          <p className="text-[10px] sm:text-xs text-emerald-400 mb-1">
            {t("analytics.totalProfit")}
          </p>
          <p className="font-bold text-[clamp(10px,3vw,18px)] text-emerald-400 break-all">
            +${totalProfit.toLocaleString()}
          </p>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center overflow-hidden">
          <p className="text-[10px] sm:text-xs text-red-400 mb-1">
            {t("analytics.totalLoss")}
          </p>
          <p className="font-bold text-[clamp(10px,3vw,18px)] text-red-400 break-all">
            ${totalLoss.toLocaleString()}
          </p>
        </div>

        <div
          className={`${
            netPnL >= 0
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-red-500/10 border-red-500/30"
          } border rounded-lg p-3 text-center overflow-hidden`}
        >
          <p
            className={`text-[10px] sm:text-xs mb-1 ${
              netPnL >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {t("analytics.netPL")}
          </p>
          <p
            className={`font-bold text-[clamp(10px,3vw,18px)] break-all ${
              netPnL >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {netPnL >= 0 ? "+" : ""}${netPnL.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={{ stroke: "#64748b" }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={{ stroke: "#64748b" }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
              }}
              itemStyle={{ color: "#fff" }}
              labelStyle={{ color: "#fff" }}
              formatter={(value) => [
                `$${value.toLocaleString()}`,
                t("analytics.pl"),
              ]}
            />
            <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.pnl >= 0 ? "#10b981" : "#ef4444"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Best/Worst Days */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">
            {t("analytics.bestDay")}
          </p>
          <p className="text-emerald-400 font-bold">
            +${Math.max(...chartData.map((d) => d.pnl)).toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">
            {t("analytics.worstDay")}
          </p>
          <p className="text-red-400 font-bold">
            ${Math.min(...chartData.map((d) => d.pnl)).toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  );
}

function generateSampleData() {
  const data = [];
  const days = 14;

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));

    // Random P/L between -1500 and 2500
    const pnl = Math.round((Math.random() - 0.35) * 4000);

    data.push({
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      pnl,
    });
  }

  return data;
}
