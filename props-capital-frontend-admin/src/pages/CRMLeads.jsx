import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Grid3x3,
  List,
  GripVertical,
  Phone,
  Mail,
  Globe,
  Eye,
  EyeOff,
  Calendar,
  Send,
  User,
  DollarSign,
  Building,
  Briefcase,
  TrendingUp,
  Check,
  Upload,
  FileText,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import DateRangeFilter from "@/components/shared/DateRangeFilter";
import LeadsCardsView from "@/components/crm/LeadsCardsView";
import LeadsListView from "@/components/crm/LeadsListView";
import LeadsCompactView from "@/components/crm/LeadsCompactView";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

// Helper function to transform backend lead to frontend format
const transformLead = (lead) => {
  return {
    id: lead.id,
    name: lead.personName,
    email: lead.email,
    phone: lead.phoneNumber || "",
    country: lead.country || "",
    status: lead.leadStatus?.toLowerCase() || "new",
    priority: lead.priority?.toLowerCase() || "medium",
    source: lead.source || "",
    agent: lead.assignedAgent || "-",
    onlineStatus: lead.onlineStatus?.toLowerCase() || "offline",
    leadReceived: lead.leadReceivedDate,
    ftdAmount: lead.ftdAmount,
    ftdMethod: lead.paymentMethod?.toLowerCase() || null,
    ftdProvider: lead.paymentProvider?.toLowerCase() || null,
    age: lead.age,
    salary: lead.salary,
    jobIndustry: lead.jobIndustry,
    workTitle: lead.workTitle,
    callAttempts: lead.callAttempts || 0,
    activities: lead.activities || [],
  };
};

export default function CRMLeads() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState("cards"); // 'cards', 'list', 'compact'
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [activeStatusCard, setActiveStatusCard] = useState("all");
  const [showPassword, setShowPassword] = useState({
    email: false,
    phone: false,
  });
  const [leads, setLeads] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    all: 0,
    new: 0,
    contacted: 0,
    qualified: 0,
    callback: 0,
    followup: 0,
    converted: 0,
    lost: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editableFields, setEditableFields] = useState({
    personName: "",
    email: "",
    phoneNumber: "",
    country: "",
    source: "",
    leadStatus: "",
    onlineStatus: "",
    ftdAmount: "",
    paymentMethod: "",
    paymentProvider: "",
    priority: "",
    assignedAgent: "",
    age: "",
    salary: "",
    jobIndustry: "",
    workTitle: "",
  });
  const [newNote, setNewNote] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch leads from backend
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeStatusCard !== "all") {
        params.append("status", mapStatusToBackend(activeStatusCard));
      }
      if (fromDate) {
        params.append("fromDate", fromDate);
      }
      if (toDate) {
        params.append("toDate", toDate);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const data = await apiGet(`/crm/leads?${params.toString()}`);
      const transformedLeads = data.map(transformLead);
      setLeads(transformedLeads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast({
        title: t("common.error", { defaultValue: "Error" }),
        description:
          error?.message ||
          t("crm.leads.toast.fetchError", {
            defaultValue: "Failed to fetch leads",
          }),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [activeStatusCard, fromDate, toDate, searchQuery, t, toast]);

  const fetchStats = useCallback(async () => {
    try {
      const stats = await apiGet("/crm/leads/stats");
      setSummaryStats({
        all: stats.all || 0,
        new: stats.new || 0,
        contacted: stats.contacted || 0,
        qualified: stats.qualified || 0,
        callback: stats.callback || 0,
        followup: stats.followup || 0,
        converted: stats.converted || 0,
        lost: stats.lost || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [fetchLeads, fetchStats]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchLeads();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchLeads]);

  // Helper function to convert frontend status to backend enum value
  const mapStatusToBackend = (status) => {
    const statusMap = {
      new: "NEW",
      contacted: "CONTACTED",
      qualified: "QUALIFIED",
      callback: "CALLBACK",
      followup: "FOLLOW_UP", // Map followup to FOLLOW_UP
      converted: "CONVERTED",
      lost: "LOST",
    };
    return statusMap[status.toLowerCase()] || status.toUpperCase();
  };

  // Filter leads (client-side filtering for search)
  const filteredLeads = leads.filter((lead) => {
    if (statusFilter !== "all" && lead.status !== statusFilter) return false;
    if (categoryFilter === "source" && !lead.source) return false;
    if (categoryFilter === "agent" && (!lead.agent || lead.agent === "-"))
      return false;

    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lead.name.toLowerCase().includes(query) ||
      lead.email.toLowerCase().includes(query) ||
      (lead.country && lead.country.toLowerCase().includes(query))
    );
  });

  // Handle lead click
  const handleLeadClick = async (lead) => {
    try {
      // Fetch full lead details with activities
      const fullLead = await apiGet(`/crm/leads/${lead.id}`);
      const transformed = transformLead(fullLead);
      setSelectedLead(transformed);
      setEditableFields({
        personName: transformed.name || "",
        email: transformed.email || "",
        phoneNumber: transformed.phone || "",
        country: transformed.country || "",
        source: transformed.source || "",
        leadStatus: transformed.status?.toUpperCase() || "NEW",
        onlineStatus: transformed.onlineStatus?.toUpperCase() || "OFFLINE",
        ftdAmount: transformed.ftdAmount?.toString() || "",
        paymentMethod: transformed.ftdMethod?.toUpperCase() || "",
        paymentProvider: transformed.ftdProvider?.toUpperCase() || "",
        priority: transformed.priority?.toUpperCase() || "MEDIUM",
        assignedAgent: transformed.agent !== "-" ? transformed.agent : "",
        age: transformed.age?.toString() || "",
        salary: transformed.salary || "",
        jobIndustry: transformed.jobIndustry || "",
        workTitle: transformed.workTitle || "",
      });
      setIsLeadModalOpen(true);
    } catch (error) {
      console.error("Error fetching lead details:", error);
      toast({
        title: t("common.error", { defaultValue: "Error" }),
        description:
          error?.message ||
          t("crm.leads.toast.loadError", {
            defaultValue: "Failed to load lead details",
          }),
        variant: "destructive",
      });
    }
  };

  // Handle update lead
  const handleUpdateLead = async () => {
    if (!selectedLead) return;

    try {
      setUpdating(true);
      const updateData = {};

      // Map frontend fields to backend fields
      if (editableFields.personName)
        updateData.personName = editableFields.personName;
      if (editableFields.email) updateData.email = editableFields.email;
      if (editableFields.phoneNumber !== undefined)
        updateData.phoneNumber = editableFields.phoneNumber || null;
      if (editableFields.country !== undefined)
        updateData.country = editableFields.country || null;
      if (editableFields.source !== undefined)
        updateData.source = editableFields.source || null;
      if (editableFields.leadStatus)
        updateData.leadStatus = editableFields.leadStatus;
      if (editableFields.onlineStatus)
        updateData.onlineStatus = editableFields.onlineStatus;
      if (editableFields.ftdAmount)
        updateData.ftdAmount = parseFloat(editableFields.ftdAmount) || null;
      if (editableFields.paymentMethod)
        updateData.paymentMethod = editableFields.paymentMethod;
      if (editableFields.paymentProvider)
        updateData.paymentProvider = editableFields.paymentProvider;
      if (editableFields.priority)
        updateData.priority = editableFields.priority;
      if (editableFields.assignedAgent !== undefined)
        updateData.assignedAgent = editableFields.assignedAgent || null;
      if (editableFields.age)
        updateData.age = parseInt(editableFields.age) || null;
      if (editableFields.salary !== undefined)
        updateData.salary = editableFields.salary || null;
      if (editableFields.jobIndustry !== undefined)
        updateData.jobIndustry = editableFields.jobIndustry || null;
      if (editableFields.workTitle !== undefined)
        updateData.workTitle = editableFields.workTitle || null;

      await apiPatch(`/crm/leads/${selectedLead.id}`, updateData);

      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("crm.leads.toast.updateSuccess", {
          defaultValue: "Lead updated successfully",
        }),
      });

      // Refresh leads and close modal
      await fetchLeads();
      await fetchStats();
      setIsLeadModalOpen(false);
    } catch (error) {
      console.error("Error updating lead:", error);
      toast({
        title: t("common.error", { defaultValue: "Error" }),
        description:
          error?.message ||
          t("crm.leads.toast.updateError", {
            defaultValue: "Failed to update lead",
          }),
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Handle quick actions
  const handleQuickAction = async (actionType) => {
    if (!selectedLead) return;

    try {
      await apiPost(`/crm/leads/${selectedLead.id}/activities`, {
        activityType: actionType,
        notes:
          actionType === "CALL"
            ? "Call attempt made"
            : actionType === "EMAIL"
              ? "Email sent"
              : actionType === "WHATSAPP"
                ? "WhatsApp message sent"
                : actionType === "TELEGRAM"
                  ? "Telegram message sent"
                  : undefined,
      });

      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("crm.leads.toast.activityLogged", {
          type: actionType,
          defaultValue: "Activity logged: {{type}}",
        }),
      });

      // Refresh lead details
      const fullLead = await apiGet(`/crm/leads/${selectedLead.id}`);
      const transformed = transformLead(fullLead);
      setSelectedLead(transformed);
      await fetchStats();
    } catch (error) {
      console.error("Error logging activity:", error);
      toast({
        title: t("common.error", { defaultValue: "Error" }),
        description:
          error?.message ||
          t("crm.leads.toast.activityError", {
            defaultValue: "Failed to log activity",
          }),
        variant: "destructive",
      });
    }
  };

  // Row-level quick actions (Phone / Message buttons in the list views).
  // Opens the device's native app immediately so the agent can act, and
  // logs the activity in the background so the lead's history reflects it.
  const handleListAction = async (lead, actionType) => {
    if (!lead) return;
    if (actionType === "CALL" && lead.phone) {
      window.location.href = `tel:${lead.phone}`;
    } else if (actionType === "EMAIL" && lead.email) {
      window.location.href = `mailto:${lead.email}`;
    }
    try {
      await apiPost(`/crm/leads/${lead.id}/activities`, {
        activityType: actionType,
        notes:
          actionType === "CALL"
            ? "Call attempt made (quick action)"
            : actionType === "EMAIL"
              ? "Email opened (quick action)"
              : undefined,
      });
      await fetchStats();
    } catch (error) {
      console.error("Error logging quick action:", error);
    }
  };

  // Handle CSV import
  const handleCSVImport = async () => {
    if (!selectedFile) return;

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Use axios directly for file upload
      const response = await api.post("/crm/leads/import/csv", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("crm.leads.toast.importSuccess", {
          created: response.data.created,
          total: response.data.total,
          defaultValue: "Imported {{created}} of {{total}} leads",
        }),
      });

      setIsImportModalOpen(false);
      setSelectedFile(null);
      await fetchLeads();
      await fetchStats();
    } catch (error) {
      console.error("Error importing CSV:", error);
      toast({
        title: t("common.error", { defaultValue: "Error" }),
        description:
          error?.message ||
          t("crm.leads.toast.importError", {
            defaultValue: "Failed to import CSV",
          }),
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  // Handle add note
  const handleAddNote = async () => {
    if (!selectedLead || !newNote.trim()) return;

    try {
      await apiPost(`/crm/leads/${selectedLead.id}/activities`, {
        activityType: "NOTE",
        notes: newNote,
      });

      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("crm.leads.toast.noteAdded", {
          defaultValue: "Note added successfully",
        }),
      });

      setNewNote("");
      // Refresh lead details
      const fullLead = await apiGet(`/crm/leads/${selectedLead.id}`);
      const transformed = transformLead(fullLead);
      setSelectedLead(transformed);
    } catch (error) {
      console.error("Error adding note:", error);
      toast({
        title: t("common.error", { defaultValue: "Error" }),
        description:
          error?.message ||
          t("crm.leads.toast.noteError", {
            defaultValue: "Failed to add note",
          }),
        variant: "destructive",
      });
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      contacted: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      qualified: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      callback: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      followup: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      converted: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      lost: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return (
      colors[status] || "bg-slate-500/20 text-slate-400 border-slate-500/30"
    );
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-green-500",
      medium: "bg-orange-500",
      high: "bg-orange-500",
      urgent: "bg-red-500",
    };
    return colors[priority] || "bg-slate-500";
  };

  // Mask phone number
  const maskPhone = (phone) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    return "*******" + cleaned.slice(-4);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {t("crm.leads.title", { defaultValue: "Lead Management" })}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {t("crm.leads.subtitle", {
              defaultValue: "Manage and convert your leads",
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle Buttons */}
          <div className="flex items-center gap-1 bg-muted border border-border rounded-lg p-1">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              className={`h-8 px-3 ${
                viewMode === "cards"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setViewMode("cards")}
            >
              <Grid3x3 className="w-4 h-4 mr-2" />
              <span className="text-xs font-medium">
                {t("crm.leads.cards", { defaultValue: "Cards" })}
              </span>
            </Button>

            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className={`h-8 px-3 ${
                viewMode === "list"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4 mr-2" />
              <span className="text-xs font-medium">
                {t("crm.leads.list", { defaultValue: "List" })}
              </span>
            </Button>

            <Button
              variant={viewMode === "compact" ? "default" : "ghost"}
              size="sm"
              className={`h-8 px-3 ${
                viewMode === "compact"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setViewMode("compact")}
            >
              <GripVertical className="w-4 h-4 mr-2" />
              <span className="text-xs font-medium">
                {t("crm.leads.compact", { defaultValue: "Compact" })}
              </span>
            </Button>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => setIsImportModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("crm.leads.import", { defaultValue: "Import Leads" })}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        {Object.entries(summaryStats).map(([status, count]) => (
          <Card
            key={status}
            className={`bg-card border p-3 sm:p-4 cursor-pointer transition-all ${
              activeStatusCard === status
                ? "border-primary ring-2 ring-primary/20"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => setActiveStatusCard(status)}
          >
            <p
              className={`text-xl sm:text-2xl font-bold mb-1 ${
                activeStatusCard === status ? "text-primary" : "text-foreground"
              }`}
            >
              {count}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground capitalize">
              {status === "followup"
                ? t("crm.status.followup", { defaultValue: "Follow Up" })
                : t(`crm.status.${status}`, {
                    defaultValue:
                      {
                        all: "All",
                        new: "New",
                        contacted: "Contacted",
                        qualified: "Qualified",
                        callback: "Callback",
                        converted: "Converted",
                        lost: "Lost",
                      }[status] || status,
                  })}
            </p>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card className="bg-card border-border p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("crm.leads.search", {
                defaultValue: "Search leads...",
              })}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setActiveStatusCard(value === "all" ? "all" : value);
            }}
          >
            <SelectTrigger className="w-full sm:w-[150px] bg-muted border-border text-foreground">
              <SelectValue
                placeholder={t("crm.leads.allStatus", {
                  defaultValue: "All Status",
                })}
              />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="all">
                {t("crm.leads.allStatus", { defaultValue: "All Status" })}
              </SelectItem>
              <SelectItem value="new">
                {t("crm.status.new", { defaultValue: "New" })}
              </SelectItem>
              <SelectItem value="contacted">
                {t("crm.status.contacted", { defaultValue: "Contacted" })}
              </SelectItem>
              <SelectItem value="qualified">
                {t("crm.status.qualified", { defaultValue: "Qualified" })}
              </SelectItem>
              <SelectItem value="callback">
                {t("crm.status.callback", { defaultValue: "Callback" })}
              </SelectItem>
              <SelectItem value="followup">
                {t("crm.status.followup", { defaultValue: "Follow Up" })}
              </SelectItem>
              <SelectItem value="converted">
                {t("crm.status.converted", { defaultValue: "Converted" })}
              </SelectItem>
              <SelectItem value="lost">
                {t("crm.status.lost", { defaultValue: "Lost" })}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[150px] bg-muted border-border text-foreground">
              <SelectValue
                placeholder={t("crm.leads.allCategory", {
                  defaultValue: "All",
                })}
              />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="all">
                {t("crm.leads.allCategory", { defaultValue: "All" })}
              </SelectItem>
              <SelectItem value="source">
                {t("crm.leads.bySource", { defaultValue: "By Source" })}
              </SelectItem>
              <SelectItem value="agent">
                {t("crm.leads.byAgent", { defaultValue: "By Agent" })}
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Filter */}
          <DateRangeFilter
            fromDate={fromDate}
            toDate={toDate}
            onChange={(f, to) => {
              setFromDate(f);
              setToDate(to);
            }}
          />
        </div>
      </Card>

      {/* Leads Display */}
      <Card className="bg-card border-border p-3 sm:p-4 md:p-6">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">
              {t("crm.leads.loading", { defaultValue: "Loading leads..." })}
            </p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {t("crm.leads.noLeads", { defaultValue: "No leads found" })}
            </p>
          </div>
        ) : (
          <>
            {viewMode === "cards" && (
              <LeadsCardsView
                leads={filteredLeads}
                onLeadClick={handleLeadClick}
                onAction={handleListAction}
                getStatusColor={getStatusColor}
                maskPhone={maskPhone}
              />
            )}
            {viewMode === "list" && (
              <LeadsListView
                leads={filteredLeads}
                onLeadClick={handleLeadClick}
                onAction={handleListAction}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                maskPhone={maskPhone}
              />
            )}
            {viewMode === "compact" && (
              <LeadsCompactView
                leads={filteredLeads}
                onLeadClick={handleLeadClick}
                onAction={handleListAction}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                maskPhone={maskPhone}
              />
            )}
          </>
        )}
      </Card>

      {/* Lead Details Modal */}
      <Dialog open={isLeadModalOpen} onOpenChange={setIsLeadModalOpen}>
        <DialogContent className="bg-card border-border w-[95vw] sm:w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          {selectedLead && (
            <>
              <DialogHeader className="pb-4 border-b border-border">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-2xl">
                      {selectedLead.name?.[0] || "?"}
                    </div>

                    <div>
                      <DialogTitle className="text-foreground text-xl font-bold flex items-center gap-2">
                        {selectedLead.name}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            selectedLead.onlineStatus,
                          )}`}
                        >
                          {t(
                            `crm.status.${(selectedLead.onlineStatus || "offline").toLowerCase()}`,
                            {
                              defaultValue:
                                (
                                  selectedLead.onlineStatus || "offline"
                                ).toLowerCase() === "online"
                                  ? "Online"
                                  : "Offline",
                            },
                          )}
                        </span>
                      </DialogTitle>
                      <p className="text-muted-foreground mt-1">
                        {selectedLead.email}
                      </p>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="mt-6 space-y-6">
                {/* Lead Received Section */}
                <div className="flex items-center justify-between p-4 bg-muted/60 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("crm.leads.leadReceived", {
                          defaultValue: "Lead Received",
                        })}
                      </p>
                      <p className="text-foreground font-medium">
                        {format(
                          new Date(selectedLead.leadReceived),
                          "MMM d, yyyy 'at' HH:mm",
                        )}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                      selectedLead.status,
                    )}`}
                  >
                    {t(`crm.status.${selectedLead.status.toLowerCase()}`, {
                      defaultValue:
                        {
                          new: "New",
                          contacted: "Contacted",
                          qualified: "Qualified",
                          callback: "Callback",
                          followup: "Follow Up",
                          converted: "Converted",
                          lost: "Lost",
                        }[selectedLead.status.toLowerCase()] ||
                        selectedLead.status,
                    })}
                  </span>
                </div>

                {/* Contact Information - All Editable */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {t("crm.leads.contactInfo", {
                      defaultValue: "Contact Information",
                    })}
                  </h3>

                  {/* Person Name */}
                  <div className="p-4 bg-muted/60 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <label className="text-sm text-muted-foreground">
                        {t("crm.leads.personName", {
                          defaultValue: "Person Name",
                        })}
                      </label>
                    </div>
                    <Input
                      value={editableFields.personName}
                      onChange={(e) =>
                        setEditableFields({
                          ...editableFields,
                          personName: e.target.value,
                        })
                      }
                      className="bg-card border-border text-foreground"
                      placeholder={t("crm.leads.personName", {
                        defaultValue: "Person Name",
                      })}
                    />
                  </div>

                  {/* Email */}
                  <div className="p-4 bg-muted/60 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <label className="text-sm text-muted-foreground">
                          {t("crm.leads.emailAddress", {
                            defaultValue: "Email Address",
                          })}
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type={showPassword.email ? "text" : "password"}
                        value={editableFields.email}
                        onChange={(e) =>
                          setEditableFields({
                            ...editableFields,
                            email: e.target.value,
                          })
                        }
                        className="bg-card border-border text-foreground"
                        placeholder={t("crm.leads.emailAddress", {
                          defaultValue: "Email Address",
                        })}
                      />

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground"
                        onClick={() =>
                          setShowPassword({
                            ...showPassword,
                            email: !showPassword.email,
                          })
                        }
                      >
                        {showPassword.email ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="p-4 bg-muted/60 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <label className="text-sm text-muted-foreground">
                          {t("crm.leads.phoneNumber", {
                            defaultValue: "Phone Number",
                          })}
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type={showPassword.phone ? "text" : "password"}
                        value={editableFields.phoneNumber}
                        onChange={(e) =>
                          setEditableFields({
                            ...editableFields,
                            phoneNumber: e.target.value,
                          })
                        }
                        className="bg-card border-border text-foreground"
                        placeholder={t("crm.leads.phoneNumber", {
                          defaultValue: "Phone Number",
                        })}
                      />

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground"
                        onClick={() =>
                          setShowPassword({
                            ...showPassword,
                            phone: !showPassword.phone,
                          })
                        }
                      >
                        {showPassword.phone ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Country */}
                  <div className="p-4 bg-muted/60 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <label className="text-sm text-muted-foreground">
                        {t("crm.leads.country", { defaultValue: "Country" })}
                      </label>
                    </div>
                    <Input
                      value={editableFields.country}
                      onChange={(e) =>
                        setEditableFields({
                          ...editableFields,
                          country: e.target.value,
                        })
                      }
                      className="bg-card border-border text-foreground"
                      placeholder={t("crm.leads.country", {
                        defaultValue: "Country",
                      })}
                    />
                  </div>

                  {/* Source */}
                  <div className="p-4 bg-muted/60 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <label className="text-sm text-muted-foreground">
                        {t("crm.leads.source", { defaultValue: "Source" })}
                      </label>
                    </div>
                    <Input
                      value={editableFields.source}
                      onChange={(e) =>
                        setEditableFields({
                          ...editableFields,
                          source: e.target.value,
                        })
                      }
                      className="bg-card border-border text-foreground"
                      placeholder={t("crm.leads.source", {
                        defaultValue: "Source",
                      })}
                    />
                  </div>
                </div>

                {/* Status and Online Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      {t("crm.leads.leadStatus", {
                        defaultValue: "Lead Status",
                      })}
                    </label>
                    <Select
                      value={editableFields.leadStatus}
                      onValueChange={(value) =>
                        setEditableFields({
                          ...editableFields,
                          leadStatus: value,
                        })
                      }
                    >
                      <SelectTrigger className="w-full bg-card border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border text-foreground">
                        <SelectItem value="NEW">
                          {t("crm.status.new", { defaultValue: "New" })}
                        </SelectItem>
                        <SelectItem value="CONTACTED">
                          {t("crm.status.contacted", {
                            defaultValue: "Contacted",
                          })}
                        </SelectItem>
                        <SelectItem value="QUALIFIED">
                          {t("crm.status.qualified", {
                            defaultValue: "Qualified",
                          })}
                        </SelectItem>
                        <SelectItem value="CALLBACK">
                          {t("crm.status.callback", {
                            defaultValue: "Callback",
                          })}
                        </SelectItem>
                        <SelectItem value="FOLLOW_UP">
                          {t("crm.status.followup", {
                            defaultValue: "Follow Up",
                          })}
                        </SelectItem>
                        <SelectItem value="CONVERTED">
                          {t("crm.status.converted", {
                            defaultValue: "Converted",
                          })}
                        </SelectItem>
                        <SelectItem value="LOST">
                          {t("crm.status.lost", { defaultValue: "Lost" })}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      {t("crm.leads.onlineStatus", {
                        defaultValue: "Online Status",
                      })}
                    </label>
                    <Select
                      value={editableFields.onlineStatus}
                      onValueChange={(value) =>
                        setEditableFields({
                          ...editableFields,
                          onlineStatus: value,
                        })
                      }
                    >
                      <SelectTrigger className="w-full bg-card border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border text-foreground">
                        <SelectItem value="ONLINE">
                          {t("crm.status.online", { defaultValue: "Online" })}
                        </SelectItem>
                        <SelectItem value="OFFLINE">
                          {t("crm.status.offline", { defaultValue: "Offline" })}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Priority and Assigned Agent */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      {t("crm.leads.priority", { defaultValue: "Priority" })}
                    </label>
                    <Select
                      value={editableFields.priority}
                      onValueChange={(value) =>
                        setEditableFields({
                          ...editableFields,
                          priority: value,
                        })
                      }
                    >
                      <SelectTrigger className="w-full bg-card border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border text-foreground">
                        <SelectItem value="LOW">
                          {t("crm.priority.low", { defaultValue: "Low" })}
                        </SelectItem>
                        <SelectItem value="MEDIUM">
                          {t("crm.priority.medium", { defaultValue: "Medium" })}
                        </SelectItem>
                        <SelectItem value="HIGH">
                          {t("crm.priority.high", { defaultValue: "High" })}
                        </SelectItem>
                        <SelectItem value="URGENT">
                          {t("crm.priority.urgent", { defaultValue: "Urgent" })}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      {t("crm.leads.assignedAgent", {
                        defaultValue: "Assigned Agent",
                      })}
                    </label>
                    <Input
                      value={editableFields.assignedAgent}
                      onChange={(e) =>
                        setEditableFields({
                          ...editableFields,
                          assignedAgent: e.target.value,
                        })
                      }
                      className="bg-card border-border text-foreground"
                      placeholder={t("crm.leads.assignedAgent", {
                        defaultValue: "Assigned Agent",
                      })}
                    />
                  </div>
                </div>

                {/* FTD Info Section - Editable */}
                <div className="p-4 bg-muted/60 rounded-lg border-2 border-primary/50 relative">
                  <span className="absolute top-2 right-2 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">
                    {t("crm.leads.ftdInfo", {
                      defaultValue: "FTD Information",
                    })}
                  </span>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    {t("crm.leads.ftdInfo", {
                      defaultValue: "FTD Information",
                    })}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">
                        {t("crm.leads.ftdAmount", {
                          defaultValue: "FTD Amount",
                        })}
                      </label>
                      <Input
                        type="number"
                        value={editableFields.ftdAmount}
                        onChange={(e) =>
                          setEditableFields({
                            ...editableFields,
                            ftdAmount: e.target.value,
                          })
                        }
                        className="bg-card border-border text-foreground"
                        placeholder={t("crm.leads.ftdAmount", {
                          defaultValue: "FTD Amount",
                        })}
                      />
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">
                        {t("crm.leads.paymentMethod", {
                          defaultValue: "Payment Method",
                        })}
                      </label>
                      <Select
                        value={editableFields.paymentMethod}
                        onValueChange={(value) =>
                          setEditableFields({
                            ...editableFields,
                            paymentMethod: value,
                          })
                        }
                      >
                        <SelectTrigger className="w-full bg-card border-border text-foreground">
                          <SelectValue
                            placeholder={t("crm.leads.paymentMethod", {
                              defaultValue: "Payment Method",
                            })}
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border text-foreground">
                          <SelectItem value="CARD">
                            {t("crm.payment.card", { defaultValue: "Card" })}
                          </SelectItem>
                          <SelectItem value="BANK_TRANSFER">
                            {t("crm.payment.bankTransfer", {
                              defaultValue: "Bank Transfer",
                            })}
                          </SelectItem>
                          <SelectItem value="CRYPTO">
                            {t("crm.payment.crypto", {
                              defaultValue: "Crypto",
                            })}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">
                        {t("crm.leads.paymentProvider", {
                          defaultValue: "Payment Provider",
                        })}
                      </label>
                      <Select
                        value={editableFields.paymentProvider}
                        onValueChange={(value) =>
                          setEditableFields({
                            ...editableFields,
                            paymentProvider: value,
                          })
                        }
                      >
                        <SelectTrigger className="w-full bg-card border-border text-foreground">
                          <SelectValue
                            placeholder={t("crm.leads.paymentProvider", {
                              defaultValue: "Payment Provider",
                            })}
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border text-foreground">
                          <SelectItem value="STRIPE">
                            {t("crm.payment.stripe", {
                              defaultValue: "Stripe",
                            })}
                          </SelectItem>
                          <SelectItem value="PAYPAL">
                            {t("crm.payment.paypal", {
                              defaultValue: "PayPal",
                            })}
                          </SelectItem>
                          <SelectItem value="SKRILL">
                            {t("crm.payment.skrill", {
                              defaultValue: "Skrill",
                            })}
                          </SelectItem>
                          <SelectItem value="NETELLER">
                            {t("crm.payment.neteller", {
                              defaultValue: "Neteller",
                            })}
                          </SelectItem>
                          <SelectItem value="BINANCE_PAY">
                            {t("crm.payment.binancePay", {
                              defaultValue: "Binance Pay",
                            })}
                          </SelectItem>
                          <SelectItem value="COINBASE">
                            {t("crm.payment.coinbase", {
                              defaultValue: "Coinbase",
                            })}
                          </SelectItem>
                          <SelectItem value="WIRE_TRANSFER">
                            {t("crm.payment.wireTransfer", {
                              defaultValue: "Wire Transfer",
                            })}
                          </SelectItem>
                          <SelectItem value="OTHER">
                            {t("crm.payment.other", { defaultValue: "Other" })}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Editable Fields Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {t("crm.leads.editableFields", {
                      defaultValue: "Editable Fields",
                    })}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Age */}
                    <div className="p-4 bg-muted/60 rounded-lg border-2 border-dashed border-border relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <label className="text-sm text-muted-foreground">
                            {t("crm.leads.age", { defaultValue: "Age" })}
                          </label>
                        </div>
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">
                          {t("crm.leads.editableFields", {
                            defaultValue: "Editable Fields",
                          })}
                        </span>
                      </div>
                      <Input
                        placeholder={t("crm.leads.age", {
                          defaultValue: "Age",
                        })}
                        value={editableFields.age}
                        onChange={(e) =>
                          setEditableFields({
                            ...editableFields,
                            age: e.target.value,
                          })
                        }
                        className="bg-card border-border text-foreground"
                      />
                    </div>

                    {/* Salary */}
                    <div className="p-4 bg-muted/60 rounded-lg border-2 border-dashed border-border relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <label className="text-sm text-muted-foreground">
                            {t("crm.leads.salary", { defaultValue: "Salary" })}
                          </label>
                        </div>
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">
                          {t("crm.leads.editableFields", {
                            defaultValue: "Editable Fields",
                          })}
                        </span>
                      </div>
                      <Input
                        placeholder={t("crm.leads.salaryPlaceholder", {
                          defaultValue: "e.g. €50,000",
                        })}
                        value={editableFields.salary}
                        onChange={(e) =>
                          setEditableFields({
                            ...editableFields,
                            salary: e.target.value,
                          })
                        }
                        className="bg-card border-border text-foreground"
                      />
                    </div>

                    {/* Job Industry */}
                    <div className="p-4 bg-muted/60 rounded-lg border-2 border-dashed border-border relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <label className="text-sm text-muted-foreground">
                            {t("crm.leads.jobIndustry", {
                              defaultValue: "Job Industry",
                            })}
                          </label>
                        </div>
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">
                          {t("crm.leads.editableFields", {
                            defaultValue: "Editable Fields",
                          })}
                        </span>
                      </div>
                      <Input
                        placeholder={t("crm.leads.jobIndustryPlaceholder", {
                          defaultValue: "e.g. Technology",
                        })}
                        value={editableFields.jobIndustry}
                        onChange={(e) =>
                          setEditableFields({
                            ...editableFields,
                            jobIndustry: e.target.value,
                          })
                        }
                        className="bg-card border-border text-foreground"
                      />
                    </div>

                    {/* Work Title */}
                    <div className="p-4 bg-muted/60 rounded-lg border-2 border-dashed border-border relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-muted-foreground" />
                          <label className="text-sm text-muted-foreground">
                            {t("crm.leads.workTitle", {
                              defaultValue: "Work Title",
                            })}
                          </label>
                        </div>
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">
                          {t("crm.leads.editableFields", {
                            defaultValue: "Editable Fields",
                          })}
                        </span>
                      </div>
                      <Input
                        placeholder={t("crm.leads.workTitlePlaceholder", {
                          defaultValue: "e.g. Software Engineer",
                        })}
                        value={editableFields.workTitle}
                        onChange={(e) =>
                          setEditableFields({
                            ...editableFields,
                            workTitle: e.target.value,
                          })
                        }
                        className="bg-card border-border text-foreground"
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={handleUpdateLead}
                    disabled={updating}
                  >
                    {updating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("crm.leads.updating", {
                          defaultValue: "Updating...",
                        })}
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        {t("crm.leads.updateLead", {
                          defaultValue: "Update Lead",
                        })}
                      </>
                    )}
                  </Button>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {t("crm.leads.quickActions", {
                      defaultValue: "Quick Actions",
                    })}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      className="bg-amber-500 hover:bg-amber-600 text-white h-12"
                      onClick={() => handleQuickAction("CALL")}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      {t("crm.leads.callLead", { defaultValue: "Call Lead" })} (
                      {selectedLead.callAttempts || 0})
                    </Button>
                    <Button
                      className="bg-sky-500 hover:bg-sky-600 text-white h-12"
                      onClick={() => handleQuickAction("EMAIL")}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      {t("crm.leads.sendEmail", { defaultValue: "Send Email" })}
                    </Button>
                    <Button
                      className="bg-amber-500 hover:bg-amber-600 text-white h-12"
                      onClick={() => handleQuickAction("WHATSAPP")}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {t("crm.leads.whatsApp", { defaultValue: "WhatsApp" })}
                    </Button>
                    <Button
                      className="bg-sky-500 hover:bg-sky-600 text-white h-12"
                      onClick={() => handleQuickAction("TELEGRAM")}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {t("crm.leads.telegram", { defaultValue: "Telegram" })}
                    </Button>
                  </div>
                </div>

                {/* Notes History */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">
                      {t("crm.leads.activityHistory", {
                        defaultValue: "Activity History",
                      })}
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      {selectedLead.activities?.length || 0}{" "}
                      {t("crm.leads.activities", {
                        defaultValue: "Activities",
                      })}
                    </span>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedLead.activities &&
                    selectedLead.activities.length > 0 ? (
                      selectedLead.activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="p-3 bg-muted/60 rounded-lg border border-border"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
                              {t(
                                `crm.leads.${activity.activityType.toLowerCase()}`,
                                { defaultValue: activity.activityType },
                              )}
                            </span>
                          </div>

                          {activity.notes && (
                            <p className="text-sm text-foreground mb-1">
                              {activity.notes}
                            </p>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {format(
                              new Date(activity.createdAt),
                              "MMM d, yyyy HH:mm",
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t("crm.leads.noActivities", {
                          defaultValue: "No activities yet",
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t("crm.leads.addNote", {
                        defaultValue: "Add Note",
                      })}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddNote();
                        }
                      }}
                      className="flex-1 bg-card border-border text-foreground"
                    />
                    <Button
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t("crm.leads.add", { defaultValue: "Add" })}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Leads Modal */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="bg-card border-border w-[95vw] sm:w-full sm:max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl font-bold">
              {t("crm.leads.importLeads", { defaultValue: "Import Leads" })}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                  }
                }}
                className="hidden"
              />
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="w-12 h-12 mx-auto text-primary" />
                  <p className="text-foreground font-medium">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("crm.leads.changeFile", {
                      defaultValue: "Change File",
                    })}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="text-foreground font-medium">
                    {t("crm.leads.uploadCSV", {
                      defaultValue: "Click to upload CSV",
                    })}
                  </p>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground text-center">
              {t("crm.leads.csvFormat", {
                defaultValue: "CSV must follow the required format",
              })}
            </p>

            {/* CSV Format Requirements */}
            <div className="bg-muted rounded-lg p-4 border border-border/60">
              <h4 className="text-sm font-semibold text-foreground mb-3">
                {t("crm.leads.requiredFields", {
                  defaultValue: "Required fields: personName, email",
                })}
              </h4>

              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-card border border-border rounded text-xs text-muted-foreground">
                  {t("crm.leads.csvFieldName", { defaultValue: "Name" })}
                </span>
                <span className="px-2 py-1 bg-card border border-border rounded text-xs text-muted-foreground">
                  {t("crm.leads.csvFieldEmail", { defaultValue: "Email" })}
                </span>
                <span className="px-2 py-1 bg-card border border-border rounded text-xs text-muted-foreground">
                  {t("crm.leads.csvFieldPhone", { defaultValue: "Phone" })}
                </span>
                <span className="px-2 py-1 bg-card border border-border rounded text-xs text-muted-foreground">
                  {t("crm.leads.csvFieldCountry", { defaultValue: "Country" })}
                </span>
                <span className="px-2 py-1 bg-card border border-border rounded text-xs text-muted-foreground">
                  {t("crm.leads.csvFieldStatus", { defaultValue: "Status" })}
                </span>
                <span className="px-2 py-1 bg-card border border-border rounded text-xs text-muted-foreground">
                  {t("crm.leads.csvFieldPriority", { defaultValue: "Priority" })}
                </span>
                <span className="px-2 py-1 bg-card border border-border rounded text-xs text-muted-foreground">
                  {t("crm.leads.csvFieldSource", { defaultValue: "Source" })}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setSelectedFile(null);
                }}
                className="border-border text-foreground hover:bg-accent"
              >
                {t("crm.leads.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button
                onClick={handleCSVImport}
                disabled={!selectedFile || importing}
                className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("crm.leads.importing", {
                      defaultValue: "Importing...",
                    })}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {t("crm.leads.importButton", { defaultValue: "Import" })}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
