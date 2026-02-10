import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";

export default function EquityCurve({ data, startingBalance = 100000 }) {
  const { t } = useTranslation();
  // Generate sample data if none provided
  const chartData = data || generateSampleData(startingBalance);

  const currentEquity =
    chartData[chartData.length - 1]?.equity || startingBalance;
  const profitPercent =
    startingBalance > 0
      ? (((currentEquity - startingBalance) / startingBalance) * 100).toFixed(2)
      : "0.00";
  const isProfit = currentEquity >= startingBalance;

  const minEquity = Math.min(...chartData.map((d) => d.equity)) * 0.998;
  const maxEquity = Math.max(...chartData.map((d) => d.equity)) * 1.002;

  return (
    <Card className="bg-slate-900 border-slate-800 p-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {t("analytics.equityCurve")}
          </h3>
          <p className="text-slate-400 text-sm">
            {t("analytics.accountPerformance")}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-lg  md:text-2xl font-bold text-white">
              ${currentEquity.toLocaleString()}
            </p>
            <div
              className={`flex items-center gap-1 justify-end ${isProfit ? "text-emerald-400" : "text-red-400"}`}
            >
              {isProfit ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>
                {isProfit ? "+" : ""}
                {profitPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={{ stroke: "#64748b" }}
            />
            <YAxis
              domain={[minEquity, maxEquity]}
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={{ stroke: "#64748b" }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#94a3b8" }}
              formatter={(value, name) => [
                `$${value.toLocaleString()}`,
                name === "equity"
                  ? t("analytics.equity")
                  : t("analytics.balance"),
              ]}
            />
            <ReferenceLine
              y={startingBalance}
              stroke="#64748b"
              strokeDasharray="3 3"
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#balanceGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="equity"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#equityGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-sm text-slate-400">
            {t("analytics.equity")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm text-slate-400">
            {t("analytics.balance")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-slate-500" />
          <span className="text-sm text-slate-400">
            {t("analytics.startingBalance")}
          </span>
        </div>
      </div>
    </Card>
  );
}

function generateSampleData(startingBalance) {
  const data = [];
  let balance = startingBalance;
  let equity = startingBalance;
  const days = 30;

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));

    const dailyChange = (Math.random() - 0.4) * 0.02 * balance;
    balance += dailyChange;
    equity = balance + (Math.random() - 0.5) * 0.005 * balance;

    data.push({
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      balance: Math.round(balance),
      equity: Math.round(equity),
    });
  }

  return data;
}
