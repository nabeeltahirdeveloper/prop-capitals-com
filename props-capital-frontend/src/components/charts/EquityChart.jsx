import React from "react";
import { Card } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-slate-400 text-sm mb-1">{label}</p>
        <p className="text-white font-semibold">
          ${payload[0].value?.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function EquityChart({ data, title = "Equity Curve" }) {
  // Process and sort data chronologically
  const chartData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return [...data]
      .filter(item => (item.ending_equity || item.equity || 0) > 0)
      .map(item => ({
        ...item,
        rawDate: new Date(item.date || item.timestamp || 0),
        equity: item.ending_equity || item.equity || 0
      }))
      .sort((a, b) => a.rawDate - b.rawDate)
      .map(item => ({
        ...item,
        date: format(item.rawDate, "MMM d"),
        equity: item.equity
      }));
  }, [data]);

  // Handle empty data gracefully
  if (chartData.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-slate-400">No equity data available</p>
        </div>
      </Card>
    );
  }

  const equities = chartData.map((d) => d.equity);
  const minEquity = Math.min(...equities) * 0.99;
  const maxEquity = Math.max(...equities) * 1.01;

  return (
    <Card className="bg-slate-900 border-slate-800 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "#334155" }}
              tickLine={{ stroke: "#334155" }}
            />
            <YAxis
              domain={[minEquity, maxEquity]}
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              axisLine={{ stroke: "#334155" }}
              tickLine={{ stroke: "#334155" }}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="equity"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#equityGradient)"
              dot={false}
              activeDot={{
                r: 6,
                fill: "#10b981",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
