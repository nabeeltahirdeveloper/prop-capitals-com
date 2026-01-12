import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminGetAllUsers,
  adminSearchUsers,
  adminUpdateUserRole,
  adminGetUser,
} from "@/api/admin";
import { useTranslation } from "../contexts/LanguageContext";
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
import DataTable from "../components/shared/DataTable";
import StatusBadge from "../components/shared/StatusBadge";
import {
  Search,
  Filter,
  Eye,
  Mail,
  MoreHorizontal,
  UserCog,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsers() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Get all users (with search support)
  const { data: usersData = [], isLoading } = useQuery({
    queryKey: ["admin-users", searchQuery],
    queryFn: () => {
      if (searchQuery.trim()) {
        return adminSearchUsers(searchQuery);
      } else {
        return adminGetAllUsers();
      }
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => adminUpdateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-user-details", selectedUserId],
      });
    },
  });

  // Get selected user details
  const {
    data: userDetails,
    isLoading: isLoadingDetails,
    error: userDetailsError,
  } = useQuery({
    queryKey: ["admin-user-details", selectedUserId],
    queryFn: () => adminGetUser(selectedUserId),
    enabled: !!selectedUserId && isDetailsDialogOpen,
    retry: 1,
  });

  // Handler for viewing user details
  const handleViewDetails = (userId) => {
    setSelectedUserId(userId);
    setIsDetailsDialogOpen(true);
  };

  // Handler for closing details dialog
  const handleCloseDetails = () => {
    setIsDetailsDialogOpen(false);
    setSelectedUserId(null);
  };

  // Handler for role switching
  const handleSwitchRole = (user) => {
    const newRole = user.role === "admin" ? "TRADER" : "ADMIN";
    updateRoleMutation.mutate(
      {
        userId: user.id,
        role: newRole,
      },
      {
        onError: (error) => {
          console.error("Failed to update user role:", error);
          // You could add a toast notification here
        },
      }
    );
  };

  // Map backend users to frontend format
  const mappedUsers = usersData.map((user) => {
    const profile = user.profile || {};
    const fullName =
      `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "User";
    const roleMap = {
      TRADER: "user",
      ADMIN: "admin",
    };

    return {
      id: user.id, // Backend returns 'id', not 'userId'
      full_name: fullName,
      email: user.email,
      role: roleMap[user.role] || user.role?.toLowerCase() || "user",
      created_date: user.createdAt || new Date().toISOString(),
      profile: profile,
    };
  });

  const displayUsers = mappedUsers;

  const filteredUsers = displayUsers.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const columns = [
    {
      header: t("admin.users.table.user"),
      accessorKey: "full_name",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
            {row.full_name?.[0] || "U"}
          </div>
          <div>
            <p className="text-white font-medium">{row.full_name}</p>
            <p className="text-xs text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: t("admin.users.table.role"),
      accessorKey: "role",
      cell: (row) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            row.role === "admin"
              ? "bg-amber-500/20 text-amber-400"
              : "bg-slate-700 text-slate-300"
          }`}
        >
          {t(`admin.users.roles.${row.role}`)}
        </span>
      ),
    },
    {
      header: t("admin.users.table.joined"),
      accessorKey: "created_date",
      cell: (row) => format(new Date(row.created_date), "MMM d, yyyy"),
    },
    {
      header: t("admin.users.table.actions"),
      accessorKey: "id",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 data-[state=open]:text-white"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="bg-slate-900 border-slate-800"
          >
            <DropdownMenuItem
              className="
        cursor-pointer
        text-slate-300
        data-[highlighted]:bg-slate-800
        data-[highlighted]:text-white
      "
              onClick={() => handleViewDetails(row.id)}
            >
              <Eye className="w-4 h-4 mr-2 data-[highlighted]:text-white" />
              {t("admin.users.actions.viewDetails")}
            </DropdownMenuItem>

            <DropdownMenuItem
              className="
        cursor-pointer
        text-slate-300
        data-[highlighted]:bg-slate-800
        data-[highlighted]:text-white
      "
            >
              <Mail className="w-4 h-4 mr-2 data-[highlighted]:text-white" />
              {t("admin.users.actions.sendEmail")}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-slate-800" />

            <DropdownMenuItem
              className="
        cursor-pointer
        text-cyan-400
        data-[highlighted]:bg-slate-800
        data-[highlighted]:text-cyan-300
      "
              onClick={() => handleSwitchRole(row)}
              disabled={updateRoleMutation.isPending}
            >
              <UserCog className="w-4 h-4 mr-2 data-[highlighted]:text-cyan-300" />
              {row.role === "admin"
                ? t("admin.users.actions.makeTrader")
                : t("admin.users.actions.makeAdmin")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          {t("admin.users.title")}
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          {t("admin.users.subtitle")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-slate-400">
            {t("admin.users.stats.totalUsers")}
          </p>
          {isLoading ? (
            <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 mt-2" />
          ) : (
            <p className="text-xl sm:text-2xl font-bold text-white">
              {displayUsers.length}
            </p>
          )}
        </Card>
        <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-slate-400">
            {t("admin.users.stats.traders")}
          </p>
          {isLoading ? (
            <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 mt-2" />
          ) : (
            <p className="text-xl sm:text-2xl font-bold text-emerald-400">
              {displayUsers.filter((u) => u.role === "user").length}
            </p>
          )}
        </Card>
        <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-slate-400">
            {t("admin.users.stats.admins")}
          </p>
          {isLoading ? (
            <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 mt-2" />
          ) : (
            <p className="text-xl sm:text-2xl font-bold text-amber-400">
              {displayUsers.filter((u) => u.role === "admin").length}
            </p>
          )}
        </Card>
        <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-slate-400">
            {t("admin.users.stats.newThisWeek")}
          </p>
          {isLoading ? (
            <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 mt-2" />
          ) : (
            <p className="text-xl sm:text-2xl font-bold text-cyan-400">
              {
                displayUsers.filter(
                  (u) =>
                    new Date(u.created_date) >
                    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ).length
              }
            </p>
          )}
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={t("admin.users.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[150px] bg-slate-800 border-slate-700 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t("admin.users.filter.role")} />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="all" className="text-white">
                {t("admin.users.filter.allRoles")}
              </SelectItem>
              <SelectItem value="user" className="text-white">
                {t("admin.users.filter.traders")}
              </SelectItem>
              <SelectItem value="admin" className="text-white">
                {t("admin.users.filter.admins")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4 md:p-6">
        <DataTable
          columns={columns}
          data={filteredUsers}
          isLoading={isLoading}
          emptyMessage={t("admin.users.emptyMessage")}
        />
      </Card>

      {/* User Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={handleCloseDetails}>
        <DialogContent
          className="
      bg-slate-900 border-slate-800
      w-[95vw] sm:w-full sm:max-w-2xl
      max-h-[85vh] overflow-y-auto
      p-4 sm:p-6

      [&>button]:text-white
      [&>button]:hover:text-white
      [&>button]:hover:bg-slate-800
      [&>button]:rounded-sm
    "
        >
          <DialogHeader>
            <DialogTitle className="text-white text-base sm:text-lg md:text-xl">
              {t("admin.users.dialog.title")}
            </DialogTitle>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-6 sm:py-8">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-emerald-400" />
            </div>
          ) : userDetails ? (
            <div className="space-y-4 sm:space-y-6 mt-3 sm:mt-4">
              {/* User Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-800 text-center sm:text-left">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white text-lg sm:text-2xl font-bold flex-shrink-0">
                  {userDetails.profile?.firstName?.[0] ||
                    userDetails.email?.[0]?.toUpperCase() ||
                    "U"}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white truncate">
                    {userDetails.profile?.firstName &&
                    userDetails.profile?.lastName
                      ? `${userDetails.profile.firstName} ${userDetails.profile.lastName}`
                      : userDetails.email || "User"}
                  </h3>

                  <p className="text-slate-400 text-xs sm:text-sm break-all">
                    {userDetails.email}
                  </p>

                  <span
                    className={`inline-block mt-1.5 sm:mt-2 px-2 py-0.5 sm:py-1 rounded text-xs font-medium ${
                      userDetails.role === "ADMIN"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {t(
                      `admin.users.roles.${
                        userDetails.role === "ADMIN" ? "admin" : "user"
                      }`
                    )}
                  </span>
                </div>
              </div>

              {/* User Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-slate-800/30 rounded-lg p-2.5 sm:p-3">
                  <p className="text-xs text-slate-400 mb-1">
                    {t("admin.users.dialog.userId")}
                  </p>
                  <p className="text-white font-mono text-xs break-all">
                    {userDetails.id || "N/A"}
                  </p>
                </div>

                <div className="bg-slate-800/30 rounded-lg p-2.5 sm:p-3">
                  <p className="text-xs text-slate-400 mb-1">
                    {t("admin.users.dialog.role")}
                  </p>
                  <p className="text-white text-xs sm:text-sm">
                    {t(
                      `admin.users.roles.${
                        userDetails.role === "ADMIN" ? "admin" : "user"
                      }`
                    )}
                  </p>
                </div>

                {userDetails.profile?.firstName && (
                  <div className="bg-slate-800/30 rounded-lg p-2.5 sm:p-3">
                    <p className="text-xs text-slate-400 mb-1">
                      {t("admin.users.dialog.firstName")}
                    </p>
                    <p className="text-white text-xs sm:text-sm">
                      {userDetails.profile.firstName}
                    </p>
                  </div>
                )}

                {userDetails.profile?.lastName && (
                  <div className="bg-slate-800/30 rounded-lg p-2.5 sm:p-3">
                    <p className="text-xs text-slate-400 mb-1">
                      {t("admin.users.dialog.lastName")}
                    </p>
                    <p className="text-white text-xs sm:text-sm">
                      {userDetails.profile.lastName}
                    </p>
                  </div>
                )}

                <div className="bg-slate-800/30 rounded-lg p-2.5 sm:p-3">
                  <p className="text-xs text-slate-400 mb-1">
                    {t("admin.users.dialog.joined")}
                  </p>
                  <p className="text-white text-xs sm:text-sm">
                    {userDetails.createdAt
                      ? format(
                          new Date(userDetails.createdAt),
                          "MMM d, yyyy HH:mm"
                        )
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-slate-400 text-sm">
              {t("admin.users.dialog.noDetails")}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
