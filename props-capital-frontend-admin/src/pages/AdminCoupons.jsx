import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminGetAllCoupons,
  adminCreateCoupon,
  adminUpdateCoupon,
  adminDeleteCoupon,
} from "@/api/admin";
import { useTranslation } from "../contexts/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataTable from "@/components/shared/DataTable";
import StatsCard from "@/components/shared/StatsCard";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
  Search,
  Tag,
  CheckCircle,
  BarChart3,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

export default function AdminCoupons() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCoupon, setDeletingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage",
    discountPct: "",
    maxUses: "",
    expiresAt: "",
    isActive: true,
  });
  const queryClient = useQueryClient();

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: adminGetAllCoupons,
  });

  const createMutation = useMutation({
    mutationFn: (data) => adminCreateCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({
        title: t("common.success"),
        description: t("admin.coupons.messages.createSuccess"),
      });
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error?.message || t("admin.coupons.messages.saveError"),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminUpdateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({
        title: t("common.success"),
        description: t("admin.coupons.messages.updateSuccess"),
      });
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error?.message || t("admin.coupons.messages.saveError"),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminDeleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      setDeleteDialogOpen(false);
      setDeletingCoupon(null);
      toast({
        title: t("common.success"),
        description: t("admin.coupons.messages.deleteSuccess"),
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error?.message || t("admin.coupons.messages.deleteError"),
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      discountType: "percentage",
      discountPct: "",
      maxUses: "",
      expiresAt: "",
      isActive: true,
    });
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType || "percentage",
      discountPct: coupon.discountPct?.toString(),
      maxUses: coupon.maxUses?.toString() || "",
      expiresAt: coupon.expiresAt
        ? new Date(coupon.expiresAt).toISOString().split("T")[0]
        : "",
      isActive: coupon.isActive,
    });
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.code.trim()) {
      toast({
        title: t("common.error"),
        description: t("admin.coupons.validation.codeRequired"),
        variant: "destructive",
      });
      return;
    }

    const discountValue = Number(formData.discountPct);
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      toast({
        title: t("common.error"),
        description: t("admin.coupons.validation.discountRequired"),
        variant: "destructive",
      });
      return;
    }
    if (formData.discountType === "percentage" && discountValue > 100) {
      toast({
        title: t("common.error"),
        description: t("admin.coupons.validation.discountRangePercent"),
        variant: "destructive",
      });
      return;
    }

    if (formData.maxUses) {
      const maxUses = Number(formData.maxUses);
      if (!Number.isFinite(maxUses) || maxUses < 1) {
        toast({
          title: t("common.error"),
          description: t("admin.coupons.validation.maxUsesInvalid"),
          variant: "destructive",
        });
        return;
      }
    }

    const data = {
      code: formData.code.trim().toUpperCase(),
      discountType: formData.discountType,
      discountPct: Math.floor(discountValue),
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
      expiresAt: formData.expiresAt || null,
      isActive: formData.isActive,
    };

    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      toast({
        title: t("common.success"),
        description: t("admin.coupons.messages.copySuccess"),
      });
    } catch {
      toast({
        title: t("common.error"),
        description: t("admin.coupons.messages.copyError"),
        variant: "destructive",
      });
    }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const randomValues = crypto.getRandomValues(new Uint32Array(8));
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(randomValues[i] % chars.length);
    }
    setFormData({ ...formData, code });
  };

  const today = new Date().toISOString().split("T")[0];

  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      if (searchQuery && !c.code.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (statusFilter === "active") return c.isActive;
      if (statusFilter === "inactive") return !c.isActive;
      if (statusFilter === "expired") return c.expiresAt && new Date(c.expiresAt) < new Date();
      return true;
    });
  }, [coupons, searchQuery, statusFilter]);

  const columns = [
    {
      header: t("admin.coupons.table.code"),
      accessorKey: "code",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <code className="bg-muted px-2 py-1 rounded text-emerald-500 font-mono border border-border">
            {row.code}
          </code>
          <button
            type="button"
            onClick={() => copyCode(row.code)}
            className="text-foreground transition-colors"
          >
            {copiedCode === row.code ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      ),
    },
    {
      header: t("admin.coupons.table.discount"),
      accessorKey: "discountPct",
      cell: (row) => (
        <span className="text-foreground font-medium">
          {row.discountType === "fixed"
            ? `$${row.discountPct}`
            : `${row.discountPct}%`}
        </span>
      ),
    },
    {
      header: t("admin.coupons.table.usage"),
      accessorKey: "usedCount",
      cell: (row) => (
        <span className="text-muted-foreground">
          {row.usedCount || 0} / {row.maxUses || "\u221e"}
        </span>
      ),
    },
    {
      header: t("admin.coupons.table.validUntil"),
      accessorKey: "expiresAt",
      cell: (row) =>
        row.expiresAt
          ? format(new Date(row.expiresAt), "MMM d, yyyy")
          : t("admin.coupons.noExpiry"),
    },
    {
      header: t("admin.coupons.table.status"),
      accessorKey: "isActive",
      cell: (row) => (
        <StatusBadge status={row.isActive ? "active" : "closed"} />
      ),
    },
    {
      header: t("admin.coupons.table.created"),
      accessorKey: "createdAt",
      cell: (row) =>
        row.createdAt
          ? format(new Date(row.createdAt), "MMM d, yyyy")
          : "—",
    },
    {
      header: t("admin.coupons.table.actions"),
      accessorKey: "id",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => handleEdit(row)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-500 hover:text-red-600"
            onClick={() => {
              setDeletingCoupon(row);
              setDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {t("admin.coupons.title")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("admin.coupons.subtitle")}
          </p>
        </div>
        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-[#d97706] hover:bg-amber-600 w-full sm:w-auto h-10 sm:h-11">
              <Plus className="w-4 h-4 mr-2" />
              {t("admin.coupons.createCoupon")}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border w-[95vw] sm:w-full sm:max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground text-base sm:text-lg">
                {editingCoupon
                  ? t("admin.coupons.editCoupon")
                  : t("admin.coupons.createNewCoupon")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-muted-foreground text-xs sm:text-sm">
                  {t("admin.coupons.form.couponCode")}
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="WELCOME20"
                    maxLength={20}
                    className="bg-muted border-border font-mono text-foreground placeholder:text-muted-foreground text-sm h-9 sm:h-10"
                  />
                  <Button
                    variant="outline"
                    className="border-border text-foreground hover:bg-accent h-9 sm:h-10 text-xs sm:text-sm whitespace-nowrap px-3"
                    onClick={generateCode}
                  >
                    {t("admin.coupons.form.generate")}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-muted-foreground text-xs sm:text-sm">
                    {t("admin.coupons.form.discountType")}
                  </Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(v) =>
                      setFormData({ ...formData, discountType: v })
                    }
                  >
                    <SelectTrigger className="bg-muted border-border text-foreground text-sm h-9 sm:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
                      <SelectItem value="percentage" className="text-foreground">
                        {t("admin.coupons.form.percentage")}
                      </SelectItem>
                      <SelectItem value="fixed" className="text-foreground">
                        {t("admin.coupons.form.fixedAmount")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-muted-foreground text-xs sm:text-sm">
                    {t("admin.coupons.form.discountValue")}{" "}
                    {formData.discountType === "percentage" ? "(%)" : "($)"}
                  </Label>
                  <Input
                    type="number"
                    value={formData.discountPct}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountPct: e.target.value,
                      })
                    }
                    placeholder={
                      formData.discountType === "percentage" ? "20" : "50"
                    }
                    min="1"
                    max={formData.discountType === "percentage" ? "100" : undefined}
                    step="1"
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm h-9 sm:h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-muted-foreground text-xs sm:text-sm">
                    {t("admin.coupons.form.maxUses")}
                  </Label>
                  <Input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) =>
                      setFormData({ ...formData, maxUses: e.target.value })
                    }
                    placeholder="100"
                    min="1"
                    step="1"
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm h-9 sm:h-10"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-muted-foreground text-xs sm:text-sm">
                    {t("admin.coupons.form.validUntil")}
                  </Label>
                  <Input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) =>
                      setFormData({ ...formData, expiresAt: e.target.value })
                    }
                    min={today}
                    className="
    bg-muted border-border text-foreground text-sm h-9 sm:h-10
    [&::-webkit-calendar-picker-indicator]:invert
    [&::-webkit-calendar-picker-indicator]:opacity-100
    [&::-webkit-calendar-picker-indicator]:cursor-pointer
  "
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Label className="text-muted-foreground text-xs sm:text-sm">
                  {t("admin.coupons.form.active")}
                </Label>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, isActive: v })
                  }
                />
              </div>

              <Button
                onClick={handleSubmit}
                className="cursor-pointer w-full bg-[#d97706] hover:bg-amber-600 mt-2 sm:mt-4 h-10 sm:h-11 text-sm font-semibold"
                disabled={
                  createMutation.isPending ||
                  updateMutation.isPending ||
                  !formData.code.trim() ||
                  !formData.discountPct
                }
              >
                {createMutation.isPending || updateMutation.isPending
                  ? t("admin.coupons.form.saving")
                  : editingCoupon
                    ? t("admin.coupons.form.updateCoupon")
                    : t("admin.coupons.form.createCoupon")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title={t("admin.coupons.stats.totalCoupons")}
          value={coupons.length}
          icon={Tag}
          iconColor="text-muted-foreground"
        />
        <StatsCard
          title={t("admin.coupons.stats.active")}
          value={coupons.filter((c) => c.isActive).length}
          icon={CheckCircle}
          iconColor="text-emerald-400"
        />
        <StatsCard
          title={t("admin.coupons.stats.totalUses")}
          value={coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)}
          icon={BarChart3}
          iconColor="text-sky-400"
        />
        <StatsCard
          title={t("admin.coupons.stats.expired")}
          value={coupons.filter((c) => c.expiresAt && new Date(c.expiresAt) < new Date()).length}
          icon={Clock}
          iconColor="text-muted-foreground"
        />
      </div>

      {/* Filters */}
      <Card className="bg-card border-border p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("admin.coupons.searchPlaceholder") || "Search by coupon code..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-muted border-border text-foreground text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground z-50">
              <SelectItem value="all" className="text-foreground">
                {t("admin.coupons.filter.all") || "All Statuses"}
              </SelectItem>
              <SelectItem value="active" className="text-foreground">
                {t("admin.coupons.filter.active") || "Active"}
              </SelectItem>
              <SelectItem value="inactive" className="text-foreground">
                {t("admin.coupons.filter.inactive") || "Inactive"}
              </SelectItem>
              <SelectItem value="expired" className="text-foreground">
                {t("admin.coupons.filter.expired") || "Expired"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Coupons Table */}
      <Card className="bg-card border-border p-3 sm:p-4 md:p-6 overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredCoupons}
          isLoading={isLoading}
          emptyMessage={t("admin.coupons.emptyMessage")}
        />
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) setDeletingCoupon(null);
      }}>
        <DialogContent className="bg-card border-border w-[95vw] sm:w-full sm:max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-foreground text-base sm:text-lg">
              {t("admin.coupons.deleteConfirmTitle") || "Delete Coupon"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                {t("admin.coupons.deleteConfirmMessage") || "Are you sure you want to delete this coupon? This action cannot be undone."}
              </p>
              {deletingCoupon && (
                <p className="text-sm font-mono text-foreground mt-2">
                  {deletingCoupon.code}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-accent w-full sm:w-auto order-2 sm:order-1"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setDeletingCoupon(null);
                }}
              >
                {t("common.cancel") || "Cancel"}
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto order-1 sm:order-2"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (deletingCoupon) {
                    deleteMutation.mutate(deletingCoupon.id);
                  }
                }}
              >
                {deleteMutation.isPending
                  ? (t("common.deleting") || "Deleting...")
                  : (t("common.delete") || "Delete")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
