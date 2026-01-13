import React, { useState } from "react";
// TODO: Replace with coupons API when available
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "../contexts/LanguageContext";
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
import DataTable from "../components/shared/DataTable";
import { Plus, Pencil, Trash2, Zap, Copy, Check } from "lucide-react";
import { format } from "date-fns";

export default function AdminCoupons() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    max_uses: "",
    valid_until: "",
    is_active: true,
  });
  const queryClient = useQueryClient();

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: () => Promise.resolve([]), // TODO: Replace with coupons API
  });

  const createMutation = useMutation({
    mutationFn: (data) => Promise.resolve({ id: "1", ...data }), // TODO: Replace with coupons API
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      setIsOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => Promise.resolve({ id, ...data }), // TODO: Replace with coupons API
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      setIsOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => Promise.resolve(), // TODO: Replace with coupons API
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      discount_type: "percentage",
      discount_value: "",
      max_uses: "",
      valid_until: "",
      is_active: true,
    });
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value?.toString(),
      max_uses: coupon.max_uses?.toString() || "",
      valid_until: coupon.valid_until || "",
      is_active: coupon.is_active,
    });
    setIsOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      discount_value: parseFloat(formData.discount_value),
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      used_count: editingCoupon?.used_count || 0,
    };

    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  // Mock coupons for demo
  const mockCoupons = [
    {
      id: "1",
      code: "WELCOME20",
      discount_type: "percentage",
      discount_value: 20,
      max_uses: 100,
      used_count: 45,
      is_active: true,
      valid_until: "2024-12-31",
    },
    {
      id: "2",
      code: "TRADER10",
      discount_type: "percentage",
      discount_value: 10,
      max_uses: null,
      used_count: 128,
      is_active: true,
    },
    {
      id: "3",
      code: "FLAT50",
      discount_type: "fixed",
      discount_value: 50,
      max_uses: 50,
      used_count: 50,
      is_active: false,
    },
    {
      id: "4",
      code: "NEWYEAR25",
      discount_type: "percentage",
      discount_value: 25,
      max_uses: 200,
      used_count: 12,
      is_active: true,
      valid_until: "2024-01-31",
    },
  ];

  const displayCoupons = coupons.length > 0 ? coupons : mockCoupons;

  const columns = [
    {
      header: t("admin.coupons.table.code"),
      accessorKey: "code",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <code className="bg-slate-800 px-2 py-1 rounded text-emerald-400 font-mono">
            {row.code}
          </code>
          <button
            onClick={() => copyCode(row.code)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {copiedCode === row.code ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      ),
    },
    {
      header: t("admin.coupons.table.discount"),
      accessorKey: "discount_value",
      cell: (row) => (
        <span className="text-white font-medium">
          {row.discount_type === "percentage"
            ? `${row.discount_value}%`
            : `$${row.discount_value}`}
        </span>
      ),
    },
    {
      header: t("admin.coupons.table.usage"),
      accessorKey: "used_count",
      cell: (row) => (
        <span className="text-slate-300">
          {row.used_count} / {row.max_uses || "∞"}
        </span>
      ),
    },
    {
      header: t("admin.coupons.table.validUntil"),
      accessorKey: "valid_until",
      cell: (row) =>
        row.valid_until
          ? format(new Date(row.valid_until), "MMM d, yyyy")
          : t("admin.coupons.noExpiry"),
    },
    {
      header: t("admin.coupons.table.status"),
      accessorKey: "is_active",
      cell: (row) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            row.is_active
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-slate-700 text-slate-400"
          }`}
        >
          {row.is_active
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
            className="text-slate-400 "
            onClick={() => handleEdit(row)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-400 hover:text-red-300"
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
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {t("admin.coupons.title")}
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
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
            <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 w-full sm:w-auto h-10 sm:h-11">
              <Plus className="w-4 h-4 mr-2" />
              {t("admin.coupons.createCoupon")}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 w-[95vw] sm:w-full sm:max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white text-base sm:text-lg">
                {editingCoupon
                  ? t("admin.coupons.editCoupon")
                  : t("admin.coupons.createNewCoupon")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-slate-300 text-xs sm:text-sm">
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
                    className="bg-slate-800 border-slate-700 font-mono text-white placeholder:text-slate-500 text-sm h-9 sm:h-10"
                  />
                  <Button
                    variant="outline"
                    className="border-slate-700 text-black hover:text-white hover:bg-slate-800 h-9 sm:h-10 text-xs sm:text-sm whitespace-nowrap px-3"
                    onClick={generateCode}
                  >
                    {t("admin.coupons.form.generate")}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-slate-300 text-xs sm:text-sm">
                    {t("admin.coupons.form.discountType")}
                  </Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(v) =>
                      setFormData({ ...formData, discount_type: v })
                    }
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-sm h-9 sm:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="percentage" className="text-white">
                        {t("admin.coupons.form.percentage")}
                      </SelectItem>
                      <SelectItem value="fixed" className="text-white">
                        {t("admin.coupons.form.fixedAmount")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-slate-300 text-xs sm:text-sm">
                    {t("admin.coupons.form.discountValue")}{" "}
                    {formData.discount_type === "percentage" ? "(%)" : "($)"}
                  </Label>
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_value: e.target.value,
                      })
                    }
                    placeholder={
                      formData.discount_type === "percentage" ? "20" : "50"
                    }
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm h-9 sm:h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-slate-300 text-xs sm:text-sm">
                    {t("admin.coupons.form.maxUses")}
                  </Label>
                  <Input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) =>
                      setFormData({ ...formData, max_uses: e.target.value })
                    }
                    placeholder="100"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm h-9 sm:h-10"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-slate-300 text-xs sm:text-sm">
                    {t("admin.coupons.form.validUntil")}
                  </Label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_until: e.target.value })
                    }
                    className="bg-slate-800 border-slate-700 text-white text-sm h-9 sm:h-10"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Label className="text-slate-300 text-xs sm:text-sm">
                  {t("admin.coupons.form.active")}
                </Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, is_active: v })
                  }
                />
              </div>

              <Button
                onClick={handleSubmit}
                className="cursor-pointer w-full bg-gradient-to-r from-emerald-500 to-cyan-500 mt-2 sm:mt-4 h-10 sm:h-11 text-sm font-semibold"
                disabled={
                  createMutation.isPending ||
                  updateMutation.isPending ||
                  !formData.code ||
                  !formData.discount_value
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
        <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-slate-400 truncate">
            {t("admin.coupons.stats.totalCoupons")}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-white truncate">
            {displayCoupons.length}
          </p>
        </Card>
        <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-slate-400 truncate">
            {t("admin.coupons.stats.active")}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400 truncate">
            {displayCoupons.filter((c) => c.is_active).length}
          </p>
        </Card>
        <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-slate-400 truncate">
            {t("admin.coupons.stats.totalUses")}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-cyan-400 truncate">
            {displayCoupons.reduce((sum, c) => sum + (c.used_count || 0), 0)}
          </p>
        </Card>
        <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-slate-400 truncate">
            {t("admin.coupons.stats.expired")}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-slate-400 truncate">
            {
              displayCoupons.filter(
                (c) => c.valid_until && new Date(c.valid_until) < new Date()
              ).length
            }
          </p>
        </Card>
      </div>

      {/* Coupons Table */}
      <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4 md:p-6 overflow-hidden">
        <DataTable
          columns={columns}
          data={displayCoupons}
          isLoading={isLoading}
          emptyMessage={t("admin.coupons.emptyMessage")}
        />
      </Card>
    </div>
  );
}
