import { useState } from "react";
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
import { Plus, Pencil, Trash2, Copy, Check } from "lucide-react";
import { format } from "date-fns";

export default function AdminCoupons() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
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
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

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
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium border ${
            row.isActive
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : "bg-muted text-muted-foreground border-border"
          }`}
        >
          {row.isActive
            ? t("admin.coupons.status.active")
            : t("admin.coupons.status.inactive")}
        </span>
      ),
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
            onClick={() => deleteMutation.mutate(row.id)}
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
            <Button className="bg-gradient-to-r from-[#d97706] to-[#d97706] hover:from-amber-600 hover:to-amber-600 w-full sm:w-auto h-10 sm:h-11">
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
                className="cursor-pointer w-full bg-gradient-to-r from-[#d97706] to-[#d97706] hover:from-amber-600 hover:to-amber-600 mt-2 sm:mt-4 h-10 sm:h-11 text-sm font-semibold"
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
        <Card className="bg-card border-border p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {t("admin.coupons.stats.totalCoupons")}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
            {coupons.length}
          </p>
        </Card>
        <Card className="bg-card border-border p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {t("admin.coupons.stats.active")}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-500 truncate">
            {coupons.filter((c) => c.isActive).length}
          </p>
        </Card>
        <Card className="bg-card border-border p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {t("admin.coupons.stats.totalUses")}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-sky-500 truncate">
            {coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)}
          </p>
        </Card>
        <Card className="bg-card border-border p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {t("admin.coupons.stats.expired")}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-muted-foreground truncate">
            {
              coupons.filter(
                (c) => c.expiresAt && new Date(c.expiresAt) < new Date(),
              ).length
            }
          </p>
        </Card>
      </div>

      {/* Coupons Table */}
      <Card className="bg-card border-border p-3 sm:p-4 md:p-6 overflow-hidden">
        <DataTable
          columns={columns}
          data={coupons}
          isLoading={isLoading}
          emptyMessage={t("admin.coupons.emptyMessage")}
        />
      </Card>
    </div>
  );
}
