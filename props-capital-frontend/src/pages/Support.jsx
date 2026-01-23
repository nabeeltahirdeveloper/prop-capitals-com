import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/api/auth";
import { getUserTickets, createSupportTicket } from "@/api/support";
import { useTranslation } from "../contexts/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import StatusBadge from "../components/shared/StatusBadge";
import {
  HelpCircle,
  Plus,
  MessageCircle,
  Clock,
  CheckCircle,
  Search,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { enUS, th, fr, ja, ru, ko, es, tr } from "date-fns/locale";

export default function Support() {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "",
    priority: "medium",
    message: "",
  });
  const queryClient = useQueryClient();

  // Get current user
  const { data: user } = useQuery({
    queryKey: ["user", "me"],
    queryFn: getCurrentUser,
    retry: false,
  });

  // Get user's support tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["support-tickets", user?.userId],
    queryFn: async () => {
      if (!user?.userId) return [];
      try {
        return await getUserTickets(user.userId);
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
        return [];
      }
    },
    enabled: !!user?.userId,
    retry: false,
    refetchInterval: 10000, // Real-time updates every 10 seconds
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data) => {
      return createSupportTicket(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["support-tickets", user?.userId],
      });
      setIsOpen(false);
      setTicketForm({
        subject: "",
        category: "",
        priority: "medium",
        message: "",
      });
      toast({
        title: t("support.ticketCreated") || "Ticket Created",
        description:
          t("support.ticketCreatedDesc") ||
          "Your support ticket has been submitted successfully.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("support.error") || "Error",
        description:
          error?.message ||
          t("support.ticketError") ||
          "Failed to create support ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!user?.userId) return;

    createTicketMutation.mutate({
      userId: user.userId,
      subject: ticketForm.subject,
      message: ticketForm.message,
      category: ticketForm.category?.toUpperCase(),
      priority: ticketForm.priority?.toUpperCase(),
    });
  };

  // Map backend tickets to frontend format
  const mappedTickets = (tickets || []).map((ticket) => {
    // Map status enum to frontend format
    const statusMap = {
      OPEN: "open",
      IN_PROGRESS: "in_progress",
      RESOLVED: "resolved",
      CLOSED: "closed",
    };

    // Map category enum to lowercase
    const categoryMap = {
      ACCOUNT: "account",
      PAYMENT: "payment",
      PAYOUT: "payout",
      TECHNICAL: "technical",
      OTHER: "other",
    };

    // Map priority enum to lowercase
    const priorityMap = {
      LOW: "low",
      MEDIUM: "medium",
      HIGH: "high",
    };

    return {
      id: ticket.id,
      subject: ticket.subject || "",
      category:
        categoryMap[ticket.category] ||
        ticket.category?.toLowerCase() ||
        "other",
      priority:
        priorityMap[ticket.priority] ||
        ticket.priority?.toLowerCase() ||
        "medium",
      status:
        statusMap[ticket.status] || ticket.status?.toLowerCase() || "open",
      created_date: ticket.createdAt,
    };
  });

  const displayTickets = mappedTickets;

  const faqs = [
    { q: t("support.faq1Q"), a: t("support.faq1A") },
    { q: t("support.faq2Q"), a: t("support.faq2A") },
    { q: t("support.faq3Q"), a: t("support.faq3A") },
    { q: t("support.faq4Q"), a: t("support.faq4A") },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const localeMap = {
    en: enUS,
    th: th,
    fr: fr,
    ja: ja,
    ru: ru,
    kr: ko,
    es: es,
    tr: tr,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {t("support.title")}
          </h1>
          <p className="text-slate-400">{t("support.subtitle")}</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500">
              <Plus className="w-4 h-4 mr-2" />
              {t("support.newTicket")}
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">
                {t("support.createTicket")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{t("support.subject")}</Label>
                <Input
                  placeholder={t("support.subjectPlaceholder")}
                  value={ticketForm.subject}
                  onChange={(e) =>
                    setTicketForm({ ...ticketForm, subject: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">
                    {t("support.category")}
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setTicketForm({ ...ticketForm, category: value })
                    }
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder={t("support.select")} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="account" className="text-white">
                        {t("support.account")}
                      </SelectItem>
                      <SelectItem value="payment" className="text-white">
                        {t("support.payment")}
                      </SelectItem>
                      <SelectItem value="payout" className="text-white">
                        {t("support.payout")}
                      </SelectItem>
                      <SelectItem value="technical" className="text-white">
                        {t("support.technical")}
                      </SelectItem>
                      <SelectItem value="other" className="text-white">
                        {t("support.other")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">
                    {t("support.priority")}
                  </Label>
                  <Select
                    value={ticketForm.priority}
                    onValueChange={(value) =>
                      setTicketForm({ ...ticketForm, priority: value })
                    }
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="low" className="text-white">
                        {t("support.low")}
                      </SelectItem>
                      <SelectItem value="medium" className="text-white">
                        {t("support.medium")}
                      </SelectItem>
                      <SelectItem value="high" className="text-white">
                        {t("support.high")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">{t("support.message")}</Label>
                <Textarea
                  placeholder={t("support.messagePlaceholder")}
                  value={ticketForm.message}
                  onChange={(e) =>
                    setTicketForm({ ...ticketForm, message: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[150px]"
                />
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                disabled={
                  createTicketMutation.isPending ||
                  !ticketForm.subject ||
                  !ticketForm.category ||
                  !ticketForm.message
                }
              >
                {createTicketMutation.isPending
                  ? t("support.submitting")
                  : t("support.submitTicket")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-slate-900 border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-white">
                {displayTickets.filter((t) => t.status === "open").length}
              </p>
              <p className="text-xs text-slate-400">
                {t("support.openTickets")}
              </p>
            </div>
          </div>
        </Card>
        <Card className="bg-slate-900 border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {
                  displayTickets.filter((t) => t.status === "in_progress")
                    .length
                }
              </p>
              <p className="text-xs text-slate-400">
                {t("support.inProgress")}
              </p>
            </div>
          </div>
        </Card>
        <Card className="bg-slate-900 border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {displayTickets.filter((t) => t.status === "resolved").length}
              </p>
              <p className="text-xs text-slate-400">{t("support.resolved")}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-slate-900 border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {displayTickets.length}
              </p>
              <p className="text-xs text-slate-400">
                {t("support.totalTickets") || "Total Tickets"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card className="bg-slate-900 border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          {t("support.faq")}
        </h3>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder={t("support.searchFAQs")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        <div className="space-y-4">
          {filteredFaqs.map((faq, i) => (
            <div key={i} className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-white font-medium mb-2">{faq.q}</p>
              <p className="text-sm text-slate-400">{faq.a}</p>
            </div>
          ))}
        </div>
        <a
          href="/FAQ"
          className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 mt-4 text-sm"
        >
          {t("support.viewAllFAQs")} <ExternalLink className="w-4 h-4" />
        </a>
      </Card>

      {/* Tickets List */}
      <Card className="bg-slate-900 border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          {t("support.yourTickets")}
        </h3>
        {displayTickets.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            {t("support.noTickets")}
          </div>
        ) : (
          <div className="space-y-4">
            {displayTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-medium">{ticket.subject}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-slate-400 capitalize">
                        {ticket.category}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-400">
                        {format(new Date(ticket.created_date), "MMM d, yyyy", {
                          locale: localeMap[language] || enUS,
                        })}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={ticket.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Contact Info */}
      <Card className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              {t("support.needImmediateHelp")}
            </h3>
            <p className="text-slate-400">{t("support.liveChatDesc")}</p>
          </div>
          <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500">
            <MessageCircle className="w-4 h-4 mr-2" />
            {t("support.startLiveChat")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
