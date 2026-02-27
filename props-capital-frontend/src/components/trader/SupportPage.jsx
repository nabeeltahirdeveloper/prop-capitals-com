import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Mail,
  Clock,
  Send,
  FileText,
  CheckCircle,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useTraderTheme } from "./TraderPanelLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/api/auth";
import { getUserTickets, createSupportTicket } from "@/api/support";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/utils/dateFormating";
import { useChatSupportStore } from "@/lib/stores/chat-support.store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SupportPage = () => {
  const { isDark } = useTraderTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "ACCOUNT",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const queryClient = useQueryClient();
  const openChat = useChatSupportStore((state) => state.openChat);

  const { data: user } = useQuery({
    queryKey: ["user", "me"],
    queryFn: getCurrentUser,
    retry: false,
  });
  const authUserId = user?.userId || user?.id;

  const { data: tickets = [], isLoading, isError: isTicketsError } = useQuery({
    queryKey: ["support-tickets", authUserId],
    queryFn: () => getUserTickets(authUserId),
    enabled: !!authUserId,
    retry: false,
    refetchInterval: 10000,
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data) => createSupportTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      setTicketForm({
        subject: "",
        category: "ACCOUNT",
        message: "",
      });
      setSubmitted(true);
      toast({
        title: "Ticket Created",
        description: "Your support ticket has been submitted successfully.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create ticket",
        description: error.message || "Failed to create ticket",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!authUserId) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to submit a support ticket.",
        variant: "destructive",
      });
      return;
    }

    createTicketMutation.mutate({
      subject: ticketForm.subject.trim(),
      message: ticketForm.message.trim(),
      category: ticketForm.category?.toUpperCase(),
    });
  };

  const mappedTickets = (tickets || []).map((ticket) => {
    const statusMap = {
      OPEN: "open",
      IN_PROGRESS: "in_progress",
      RESOLVED: "resolved",
      CLOSED: "closed",
      WAITING_FOR_ADMIN: "waiting_for_admin",
      WAITING_FOR_TRADER: "waiting_for_trader",
    };

    const categoryMap = {
      ACCOUNT: "account",
      PAYMENT: "payment",
      PAYOUT: "payout",
      TECHNICAL: "technical",
      OTHER: "other",
    };

    const priorityMap = {
      LOW: "low",
      MEDIUM: "medium",
      HIGH: "high",
    };

    return {
      id: ticket.id,
      subject: ticket.subject || "",
      category:
        categoryMap[ticket.category] || ticket.category?.toLowerCase() || "other",
      priority:
        priorityMap[ticket.priority] || ticket.priority?.toLowerCase() || "medium",
      status: statusMap[ticket.status] || ticket.status?.toLowerCase() || "open",
      created_date: ticket.createdAt,
    };
  });

  const supportCategories = [
    { value: "ACCOUNT", label: "Account" },
    { value: "PAYMENT", label: "Payment" },
    { value: "PAYOUT", label: "Payout" },
    { value: "TECHNICAL", label: "Technical" },
    { value: "OTHER", label: "Other" },
  ];

  const isTicketSubmitting = createTicketMutation.isPending;

  return (
    <div className="space-y-6" data-testid="support-page">
      <div
        className={`rounded-2xl border p-6 ${isDark ? "bg-[#12161d] border-white/5" : "bg-white border-slate-200"}`}
      >
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="w-6 h-6 text-amber-500" />
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            Support Center
          </h1>
        </div>
        <p className={`${isDark ? "text-gray-400" : "text-slate-500"}`}>
          Need help? Our support team is available 24/7 to assist you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div
            className={`rounded-2xl border p-5 ${isDark ? "bg-[#12161d] border-white/5" : "bg-white border-slate-200"}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-emerald-500/10" : "bg-emerald-50"}`}
              >
                <MessageSquare className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                  Live Chat
                </h3>
                <span className="text-xs text-emerald-500 font-medium">Online</span>
              </div>
            </div>
            <p className={`text-sm mb-4 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
              Get instant help from our AI assistant or connect with a live agent.
            </p>
            <button
              onClick={openChat}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-xl transition-all"
            >
              Start Chat
            </button>
          </div>

          <div
            className={`rounded-2xl border p-5 ${isDark ? "bg-[#12161d] border-white/5" : "bg-white border-slate-200"}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-blue-500/10" : "bg-blue-50"}`}
              >
                <Mail className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                  Email Support
                </h3>
                <span className={`text-xs ${isDark ? "text-gray-500" : "text-slate-500"}`}>
                  Response within 24h
                </span>
              </div>
            </div>
            <a
              href="mailto:support@prop-capitals.com"
              className={`text-sm font-medium ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-500"} flex items-center gap-1`}
            >
              support@prop-capitals.com
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div
            className={`rounded-2xl border p-5 ${isDark ? "bg-[#12161d] border-white/5" : "bg-white border-slate-200"}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-amber-500/10" : "bg-amber-50"}`}
              >
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                Business Hours
              </h3>
            </div>
            <div className={`space-y-2 text-sm ${isDark ? "text-gray-400" : "text-slate-500"}`}>
              <div className="flex justify-between">
                <span>Monday - Friday</span>
                <span className={isDark ? "text-white" : "text-slate-900"}>24 Hours</span>
              </div>
              <div className="flex justify-between">
                <span>Saturday - Sunday</span>
                <span className={isDark ? "text-white" : "text-slate-900"}>24 Hours</span>
              </div>
              <p className="text-xs pt-2 text-emerald-500">Support available in your timezone</p>
            </div>
          </div>
        </div>

        <div
          className={`lg:col-span-2 rounded-2xl border p-6 ${isDark ? "bg-[#12161d] border-white/5" : "bg-white border-slate-200"}`}
        >
          <div className="flex items-center gap-2 mb-6">
            <FileText className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-slate-500"}`} />
            <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              Submit a Support Ticket
            </h2>
          </div>

          {submitted ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                Ticket Submitted!
              </h3>
              <p className={isDark ? "text-gray-400" : "text-slate-500"}>
                We will respond to your inquiry within 24 hours.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-4 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-[#0a0d12] font-semibold"
              >
                Submit Another Ticket
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-slate-700"}`}
                >
                  Category
                </label>
                <Select
                  value={ticketForm.category}
                  onValueChange={(value) => setTicketForm({ ...ticketForm, category: value })}
                >
                  <SelectTrigger
                    className={`w-full px-4 py-3 h-auto rounded-xl border transition-all pr-3 ${isDark ? "bg-white/5 border-white/10 text-white focus:border-amber-500 data-[state=open]:border-amber-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500"} focus:outline-none focus:ring-2 focus:ring-amber-500/20`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    className={isDark ? "bg-[#1a1f2a] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"}
                  >
                    {supportCategories.map((cat) => (
                      <SelectItem
                        key={cat.value}
                        value={cat.value}
                        className={isDark ? "text-white focus:bg-amber-500/20 focus:text-amber-400" : "text-slate-900 focus:bg-amber-50 focus:text-amber-700"}
                      >
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-slate-700"}`}
                >
                  Subject
                </label>
                <input
                  type="text"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  required
                  className={`w-full px-4 py-3 rounded-xl border transition-all ${isDark ? "bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-amber-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500"} focus:outline-none focus:ring-2 focus:ring-amber-500/20`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-slate-700"}`}
                >
                  Message
                </label>
                <textarea
                  value={ticketForm.message}
                  onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                  placeholder="Describe your issue in detail..."
                  rows={5}
                  required
                  className={`w-full px-4 py-3 rounded-xl border transition-all resize-none ${isDark ? "bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-amber-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500"} focus:outline-none focus:ring-2 focus:ring-amber-500/20`}
                />
              </div>

              <button
                type="submit"
                disabled={
                  isTicketSubmitting ||
                  !ticketForm.subject.trim() ||
                  !ticketForm.message.trim()
                }
                className={`w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${isTicketSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {isTicketSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Ticket
                  </>
                )}
              </button>
            </form>
          )}

          {!submitted && (
            <div className="mt-8">
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                Recent Tickets
              </h3>
              {isLoading ? (
                <div
                  className={`p-3 rounded-xl flex items-center gap-2 ${isDark ? "bg-white/5 text-gray-300" : "bg-slate-50 text-slate-600"}`}
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading tickets...
                </div>
              ) : isTicketsError ? (
                <div
                  className={`p-3 rounded-xl flex items-center gap-2 text-sm ${isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600"}`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Failed to load tickets. Please refresh and try again.
                </div>
              ) : mappedTickets.length === 0 ? (
                <div
                  className={`p-3 rounded-xl text-sm ${isDark ? "bg-white/5 text-gray-400" : "bg-slate-50 text-slate-500"}`}
                >
                  No tickets yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {mappedTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => navigate(`/traderdashboard/support/tickets/${ticket.id}`)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-slate-50 hover:bg-slate-100"}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`text-sm font-mono shrink-0 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                          {ticket.id.slice(0, 8)}...
                        </span>
                        <span className={`text-sm truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                          {ticket.subject}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                          {formatDate(ticket.created_date)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            ticket.status === "resolved" ? "bg-emerald-500/10 text-emerald-500"
                            : ticket.status === "closed" ? "bg-slate-500/10 text-slate-500"
                            : ticket.status === "in_progress" ? "bg-blue-500/10 text-blue-500"
                            : ticket.status === "waiting_for_admin" ? "bg-orange-500/10 text-orange-400"
                            : ticket.status === "waiting_for_trader" ? "bg-cyan-500/10 text-cyan-400"
                            : "bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {ticket.status
                            .split("_")
                            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                            .join(" ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
