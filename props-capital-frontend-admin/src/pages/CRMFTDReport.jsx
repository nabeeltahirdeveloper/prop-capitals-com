import React, { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  Globe,
  User,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiGet } from "@/lib/api";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import DateRangeFilter from "@/components/shared/DateRangeFilter";

export default function CRMFTDReport() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({
    totalFtd: 0,
    totalDeposits: 0,
    avgFtdAmount: 0,
    activeAgents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [agents, setAgents] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedAgent && selectedAgent !== "all")
        params.append("agent", selectedAgent);
      if (fromDate) {
        const [y, m, d] = fromDate.split("-").map(Number);
        const start = new Date(y, m - 1, d, 0, 0, 0, 0);
        params.append("fromDate", start.toISOString());
      }
      if (toDate) {
        const [y, m, d] = toDate.split("-").map(Number);
        const end = new Date(y, m - 1, d, 23, 59, 59, 999);
        params.append("toDate", end.toISOString());
      }

      const [leadsData, statsData] = await Promise.all([
        apiGet(`/crm/leads/ftd-report?${params.toString()}`),
        apiGet(`/crm/leads/ftd-stats?${params.toString()}`),
      ]);

      setLeads(leadsData);
      setStats(statsData);

      const uniqueAgents = [
        ...new Set(leadsData.map((l) => l.assignedAgent).filter(Boolean)),
      ].sort();
      setAgents(uniqueAgents);
    } catch (error) {
      console.error("Error fetching FTD data:", error);
      toast({
        title: t("common.error", { defaultValue: "Error" }),
        description:
          error?.message ||
          t("crm.ftdReport.loadError", {
            defaultValue: "Failed to load FTD report data",
          }),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedAgent, fromDate, toDate, t, toast]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return t("crm.ftdReport.na", { defaultValue: "N/A" });
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return t("crm.ftdReport.na", { defaultValue: "N/A" });
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return t("crm.ftdReport.na", { defaultValue: "N/A" });
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch {
      return t("crm.ftdReport.na", { defaultValue: "N/A" });
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            {t("crm.ftdReport.title", { defaultValue: "Orders Report" })}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("crm.ftdReport.subtitle", {
              defaultValue: "Orders tracking from converted leads",
            })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border p-6 flex items-center justify-between hover:border-amber-300 transition-all duration-300">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("crm.ftdReport.totalDeposits", {
                defaultValue: "Total Orders",
              })}
            </p>
            <h3 className="text-2xl font-bold text-foreground mt-1">
              {formatCurrency(stats.totalDeposits)}
            </h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </Card>

        <Card className="bg-card border-border p-6 flex items-center justify-between hover:border-amber-300 transition-all duration-300">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("crm.ftdReport.avgFtdAmount", {
                defaultValue: "Avg Order Amount",
              })}
            </p>
            <h3 className="text-2xl font-bold text-foreground mt-1">
              {formatCurrency(stats.avgFtdAmount)}
            </h3>
          </div>
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </Card>

        <Card className="bg-card border-border p-6 flex items-center justify-between hover:border-amber-300 transition-all duration-300">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("crm.ftdReport.activeAgents", {
                defaultValue: "Active Agents",
              })}
            </p>
            <h3 className="text-2xl font-bold text-foreground mt-1">
              {stats.activeAgents}
            </h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-[#d97706]">
            <User className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("crm.ftdReport.searchPlaceholder", {
              defaultValue: "Search by name, email, or country...",
            })}
            className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={selectedAgent} onValueChange={setSelectedAgent}>
          <SelectTrigger className="w-full lg:w-[200px] bg-muted border-border text-foreground">
            <SelectValue
              placeholder={t("crm.ftdReport.allAgents", {
                defaultValue: "All Agents",
              })}
            />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground">
            <SelectItem value="all">
              {t("crm.ftdReport.allAgents", { defaultValue: "All Agents" })}
            </SelectItem>
            {agents.map((agent) => (
              <SelectItem key={agent} value={agent}>
                {agent}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DateRangeFilter
          fromDate={fromDate}
          toDate={toDate}
          onChange={(f, to) => {
            setFromDate(f);
            setToDate(to);
          }}
        />
      </div>

      {/* Main Table Card */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {t("crm.ftdReport.tableTitle", {
              defaultValue: "First Time Deposits",
            })}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">
                  {t("crm.ftdReport.leadName", { defaultValue: "Lead Name" })}
                </th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">
                  {t("crm.ftdReport.email", { defaultValue: "Email" })}
                </th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">
                  {t("crm.ftdReport.phone", { defaultValue: "Phone" })}
                </th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">
                  {t("crm.ftdReport.country", { defaultValue: "Country" })}
                </th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">
                  {t("crm.ftdReport.depositAmount", {
                    defaultValue: "Deposit Amount",
                  })}
                </th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">
                  {t("crm.ftdReport.convertedDate", {
                    defaultValue: "Converted Date",
                  })}
                </th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">
                  {t("crm.ftdReport.status", { defaultValue: "Status" })}
                </th>
                <th className="px-6 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && leads.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    {t("crm.ftdReport.loading", {
                      defaultValue: "Loading FTD data...",
                    })}
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    {t("crm.ftdReport.noData", {
                      defaultValue: "No first time deposits found.",
                    })}
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <React.Fragment key={lead.id}>
                    <tr
                      className="hover:bg-muted/60 transition-colors cursor-pointer"
                      onClick={() => toggleRow(lead.id)}
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold text-foreground">
                          {lead.personName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {lead.email}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {lead.phoneNumber || t("crm.ftdReport.na", { defaultValue: "N/A" })}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          {lead.country || t("crm.ftdReport.na", { defaultValue: "N/A" })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-emerald-600 font-bold">
                          {formatCurrency(lead.ftdAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(lead.convertedAt || lead.updatedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">
                          {t("crm.ftdReport.converted", {
                            defaultValue: "Converted",
                          })}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {expandedRows.has(lead.id) ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </td>
                    </tr>
                    {expandedRows.has(lead.id) && (
                      <tr className="bg-muted/70 border-l-4 border-l-emerald-500/60">
                        <td colSpan="8" className="px-12 py-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground uppercase font-semibold">
                                {t("crm.ftdReport.agent", {
                                  defaultValue: "Agent",
                                })}
                              </p>
                              <p className="text-foreground font-medium">
                                {lead.assignedAgent ||
                                  t("crm.ftdReport.unassigned", {
                                    defaultValue: "Unassigned",
                                  })}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground uppercase font-semibold">
                                {t("crm.ftdReport.paymentMethod", {
                                  defaultValue: "Payment Method",
                                })}
                              </p>
                              <p className="text-foreground font-medium">
                                {lead.paymentMethod || t("crm.ftdReport.na", { defaultValue: "N/A" })}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground uppercase font-semibold">
                                {t("crm.ftdReport.paymentProvider", {
                                  defaultValue: "Payment Provider",
                                })}
                              </p>
                              <p className="text-foreground font-medium">
                                {lead.paymentProvider || t("crm.ftdReport.na", { defaultValue: "N/A" })}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground uppercase font-semibold">
                                {t("crm.ftdReport.source", {
                                  defaultValue: "Source",
                                })}
                              </p>
                              <p className="text-foreground font-medium">
                                {lead.source || t("crm.ftdReport.na", { defaultValue: "N/A" })}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground uppercase font-semibold">
                                {t("crm.ftdReport.affiliateId", {
                                  defaultValue: "Affiliate ID",
                                })}
                              </p>
                              <p className="text-foreground font-medium">
                                {lead.affiliateId || t("crm.ftdReport.na", { defaultValue: "N/A" })}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground uppercase font-semibold">
                                {t("crm.ftdReport.funnelName", {
                                  defaultValue: "Funnel Name",
                                })}
                              </p>
                              <p className="text-foreground font-medium">
                                {lead.funnelName || t("crm.ftdReport.na", { defaultValue: "N/A" })}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground uppercase font-semibold">
                                {t("crm.ftdReport.ftdTime", {
                                  defaultValue: "FTD Time",
                                })}
                              </p>
                              <div className="flex items-center gap-2 text-foreground font-medium">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                {formatTime(lead.convertedAt || lead.updatedAt)}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground uppercase font-semibold">
                                {t("crm.ftdReport.subParameters", {
                                  defaultValue: "Sub Parameters",
                                })}
                              </p>
                              <p className="text-foreground font-medium">
                                {lead.subParameters || t("crm.ftdReport.na", { defaultValue: "N/A" })}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && leads.length > 0 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-muted-foreground text-sm">
            <p>
              {t("crm.ftdReport.showing", {
                count: leads.length,
                defaultValue: "Showing {{count}} First Time Deposits",
              })}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
