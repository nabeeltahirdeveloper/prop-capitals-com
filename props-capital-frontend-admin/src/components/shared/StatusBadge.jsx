import React from "react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "../../contexts/LanguageContext";

const statusStyles = {
  active:
    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 pointer-events-none",
  passed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
  suspended: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  funded: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  pending: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  paid: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  refunded: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  open: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  resolved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  closed: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  phase1: "bg-blue-500/20 text-blue-400 border-blue-500/30 pointer-events-none",
  phase2:
    "bg-purple-500/20 text-purple-400 border-purple-500/30 pointer-events-none",
  paused: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  dailylocked:
    "bg-red-500/20 text-red-500 border border-red-500/30 pointer-events-none",
  daily_locked:
    "bg-red-500/20 text-red-500 border border-red-500/30 pointer-events-none",
  disqualified: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function StatusBadge({ status, className = "" }) {
  const { t } = useTranslation();
  const style = statusStyles[status] || statusStyles.pending;
  const statusKey = status?.replace(/_/g, "") || "pending";
  const translatedStatus =
    t(`status.${statusKey}`) || status?.replace(/_/g, " ");

  return (
    <Badge
      className={`${style}  border capitalize pointer-events-none text-[10px] sm:text-sm px-1 sm:px-2  ${className}`}
    >
      {translatedStatus}
    </Badge>
  );
}
