import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  adminGetChargebackPlans,
  adminGenerateChargebackEvidence,
} from "@/api/admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { useToast } from "@/components/ui/use-toast";
import {
  ShieldAlert,
  Loader2,
  Mail,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  Send,
  CreditCard,
  Clock,
  FileSignature,
} from "lucide-react";

const DEFAULT_RECIPIENT = "gabordancs@tutamail.com";

const EMAIL_LABELS = {
  "signed-terms": "Signed terms & conditions",
  welcome: "Welcome email",
  receipt: "Purchase receipt",
  credentials: "Account credentials",
  terminated: "Challenge terminated",
  "activity-report": "Account activity report",
  "fraud-policy": "Fraud prevention & chargeback policy",
};

function fmt(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  } catch {
    return iso;
  }
}

function money(amount, currency) {
  const n = Number(amount || 0);
  return `${currency || ""} ${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AdminChargebackEvidence() {
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const defaultReg = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .slice(0, 10);

  const [form, setForm] = useState({
    email: "",
    challengeId: "",
    registrationDate: defaultReg,
    recipientEmail: DEFAULT_RECIPIENT,
    amountPaid: "",
    currency: "",
    firstName: "",
    lastName: "",
    country: "",
    city: "",
    cardBrand: "Visa",
    cardLast4: "",
    ipAddress: "",
    userAgent: "",
    termsVersion: "",
    numTrades: 6,
    sendEmails: true,
  });
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["chargeback-plans"],
    queryFn: adminGetChargebackPlans,
  });

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === form.challengeId),
    [plans, form.challengeId],
  );

  const handlePlanChange = (id) => {
    const plan = plans.find((p) => p.id === id);
    setForm((f) => ({
      ...f,
      challengeId: id,
      amountPaid: plan ? String(plan.price) : f.amountPaid,
      currency: plan ? plan.currency : f.currency,
    }));
  };

  const mutation = useMutation({
    mutationFn: (payload) => adminGenerateChargebackEvidence(payload),
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: "Evidence pack generated",
        description: data.message,
      });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Generation failed",
        description:
          err?.response?.data?.message?.toString() ||
          err?.message ||
          "Unable to generate evidence pack.",
      });
    },
  });

  const canSubmit = form.email && form.challengeId && form.registrationDate;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    const payload = {
      email: form.email.trim(),
      challengeId: form.challengeId,
      registrationDate: form.registrationDate,
      recipientEmail: form.recipientEmail.trim() || DEFAULT_RECIPIENT,
      numTrades: Number(form.numTrades) || 4,
      sendEmails: form.sendEmails,
    };
    if (form.amountPaid !== "") payload.amountPaid = Number(form.amountPaid);
    if (form.currency) payload.currency = form.currency;
    [
      "firstName",
      "lastName",
      "country",
      "city",
      "cardBrand",
      "cardLast4",
      "ipAddress",
      "userAgent",
      "termsVersion",
    ].forEach((k) => {
      if (form[k]) payload[k] = form[k];
    });
    mutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Chargeback Evidence
          </h1>
          <p className="text-sm text-muted-foreground">
            Provision a customer account from an email + plan, simulate the full
            lifecycle (purchase → trading → termination), and email a copy of all
            communications plus fraud &amp; chargeback policies to the cardholder.
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="bg-card border-border p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-foreground">Cardholder email *</Label>
              <Input
                type="email"
                required
                placeholder="customer@example.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">Plan purchased *</Label>
              <Select value={form.challengeId} onValueChange={handlePlanChange}>
                <SelectTrigger className="bg-muted border-border text-foreground">
                  <SelectValue
                    placeholder={
                      plansLoading ? "Loading plans..." : "Select a plan"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground max-h-72">
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-foreground">
                      {p.name} — {money(p.price, p.currency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground">Amount paid</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="auto from plan"
                value={form.amountPaid}
                onChange={(e) => set("amountPaid", e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">Currency</Label>
              <Input
                placeholder="auto from plan"
                value={form.currency}
                onChange={(e) => set("currency", e.target.value.toUpperCase())}
                className="bg-muted border-border text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground">Registration date (X) *</Label>
              <Input
                type="date"
                max={today}
                required
                value={form.registrationDate}
                onChange={(e) => set("registrationDate", e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">Send evidence emails to</Label>
              <Input
                type="email"
                value={form.recipientEmail}
                onChange={(e) => set("recipientEmail", e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground">First name</Label>
              <Input
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">Last name</Label>
              <Input
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground">Country</Label>
              <Input
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">City</Label>
              <Input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground">Card brand</Label>
              <Input
                value={form.cardBrand}
                onChange={(e) => set("cardBrand", e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">Card last 4</Label>
              <Input
                maxLength={4}
                placeholder="4242"
                value={form.cardLast4}
                onChange={(e) =>
                  set("cardLast4", e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                className="bg-muted border-border text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground">Losing trades to simulate</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={form.numTrades}
                onChange={(e) => set("numTrades", e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>
            <div className="flex items-center gap-3 pt-7">
              <Switch
                checked={form.sendEmails}
                onCheckedChange={(v) => set("sendEmails", v)}
                id="sendEmails"
              />
              <Label htmlFor="sendEmails" className="text-foreground cursor-pointer">
                Send the emails (off = generate copies only)
              </Label>
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground">T&amp;C acceptance IP</Label>
              <Input
                placeholder="auto-derived"
                value={form.ipAddress}
                onChange={(e) => set("ipAddress", e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">Terms version</Label>
              <Input
                placeholder="auto (e.g. v3.1)"
                value={form.termsVersion}
                onChange={(e) => set("termsVersion", e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-foreground">
                T&amp;C acceptance device / user-agent
              </Label>
              <Input
                placeholder="auto (browser user-agent)"
                value={form.userAgent}
                onChange={(e) => set("userAgent", e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>
          </div>

          {selectedPlan && (
            <p className="text-xs text-muted-foreground">
              Selected: {selectedPlan.accountSize.toLocaleString()}{" "}
              {selectedPlan.currency} virtual account · overall drawdown limit{" "}
              {selectedPlan.overallDrawdownPercent}%. The simulated trades will
              breach this limit and terminate the challenge.
            </p>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!canSubmit || mutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-[#0a0d12] font-semibold"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" /> Generate evidence pack
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {result && <EvidenceResult result={result} />}
    </div>
  );
}

function StatBox({ label, value, valueClass = "" }) {
  return (
    <div className="bg-muted/40 rounded-lg p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-foreground text-sm font-medium break-words ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function EvidenceResult({ result }) {
  const { report, timeline, communications, policies, message, signedTerms } =
    result;
  const cur = report.plan.currency;

  return (
    <Card className="bg-card border-border p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <p className="text-sm text-emerald-300">{message}</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-muted flex-wrap h-auto">
          <TabsTrigger value="overview">
            <CreditCard className="w-4 h-4 mr-1.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="w-4 h-4 mr-1.5" /> Account activity
          </TabsTrigger>
          <TabsTrigger value="terms">
            <FileSignature className="w-4 h-4 mr-1.5" /> Signed T&amp;C
          </TabsTrigger>
          <TabsTrigger value="comms">
            <Mail className="w-4 h-4 mr-1.5" /> Communications (
            {communications.length})
          </TabsTrigger>
          <TabsTrigger value="policies">
            <FileText className="w-4 h-4 mr-1.5" /> Fraud &amp; chargeback policy
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-5 mt-4">
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Cardholder
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatBox label="Name" value={report.cardholder.name} />
              <StatBox label="Email" value={report.cardholder.email} />
              <StatBox label="Country" value={report.cardholder.country || "—"} />
              <StatBox label="Registered" value={fmt(report.registeredAt)} />
            </div>
          </section>
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Purchase
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatBox label="Plan" value={report.plan.name} />
              <StatBox
                label="Amount paid"
                value={money(report.payment.amount, report.payment.currency)}
                valueClass="text-emerald-400"
              />
              <StatBox label="Status" value={report.payment.status} />
              <StatBox
                label="Card"
                value={`${report.payment.cardBrand || "Card"} ${
                  report.payment.cardLast4
                    ? "•••• " + report.payment.cardLast4
                    : ""
                }`}
              />
              <StatBox label="Invoice #" value={report.payment.invoiceNumber} />
              <StatBox label="Reference" value={report.payment.reference} />
              <StatBox label="Provider" value={report.payment.provider} />
              <StatBox label="Paid at" value={fmt(report.payment.paidAt)} />
            </div>
          </section>
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Trading account
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatBox label="Account ID" value={report.account.id} />
              <StatBox
                label="Status"
                value={`${report.account.status} / ${report.account.phase}`}
                valueClass="text-red-400"
              />
              <StatBox
                label="Starting balance"
                value={money(report.account.initialBalance, cur)}
              />
              <StatBox
                label="Final balance"
                value={money(report.account.finalBalance, cur)}
                valueClass="text-red-400"
              />
              <StatBox
                label="Overall loss reached"
                value={`${report.account.overallDrawdownPercent.toFixed(2)}%`}
                valueClass="text-red-400"
              />
              <StatBox
                label="Max drawdown limit"
                value={
                  report.plan.overallDrawdownLimit != null
                    ? `${report.plan.overallDrawdownLimit}%`
                    : "—"
                }
              />
              <StatBox
                label="Daily drawdown limit"
                value={
                  report.plan.dailyDrawdownLimit != null
                    ? `${report.plan.dailyDrawdownLimit}%`
                    : "—"
                }
              />
              <StatBox
                label="Worst single day"
                value={
                  report.account.peakDailyDrawdownPercent != null
                    ? `${report.account.peakDailyDrawdownPercent.toFixed(2)}%`
                    : "—"
                }
              />
              <StatBox label="Started" value={fmt(report.account.startedAt)} />
              <StatBox
                label="Terminated"
                value={fmt(report.account.terminatedAt)}
              />
              <StatBox
                label="Total P/L"
                value={money(report.totalLoss, cur)}
                valueClass="text-red-400"
              />
            </div>
            {report.account.breachReason && (
              <p className="text-xs text-muted-foreground mt-2">
                Terminated:{" "}
                {report.account.breachType === "DAILY_DRAWDOWN"
                  ? "daily"
                  : "maximum (overall)"}{" "}
                drawdown breach — {report.account.breachReason}.
              </p>
            )}
          </section>
        </TabsContent>

        {/* ACTIVITY */}
        <TabsContent value="activity" className="space-y-6 mt-4">
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" /> Timeline
            </h3>
            <ol className="relative border-l border-border ml-2 space-y-4">
              {timeline.map((ev, i) => (
                <li key={i} className="ml-4">
                  <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-amber-500" />
                  <p className="text-xs text-muted-foreground">{fmt(ev.at)}</p>
                  <p className="text-sm font-medium text-foreground">
                    {ev.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{ev.detail}</p>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Trades ({report.trades.length})
            </h3>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="text-left p-2.5 font-medium">Opened (UTC)</th>
                    <th className="text-left p-2.5 font-medium">Symbol</th>
                    <th className="text-left p-2.5 font-medium">Side</th>
                    <th className="text-right p-2.5 font-medium">Vol</th>
                    <th className="text-right p-2.5 font-medium">Open</th>
                    <th className="text-right p-2.5 font-medium">Close</th>
                    <th className="text-right p-2.5 font-medium">P/L</th>
                  </tr>
                </thead>
                <tbody>
                  {report.trades.map((t, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-2.5 text-foreground">{fmt(t.openedAt)}</td>
                      <td className="p-2.5 text-foreground">{t.symbol}</td>
                      <td className="p-2.5 text-foreground">{t.type}</td>
                      <td className="p-2.5 text-right text-foreground">
                        {t.volume}
                      </td>
                      <td className="p-2.5 text-right text-foreground">
                        {t.openPrice}
                      </td>
                      <td className="p-2.5 text-right text-foreground">
                        {t.closePrice}
                      </td>
                      <td
                        className={`p-2.5 text-right ${
                          t.profit < 0 ? "text-red-400" : "text-emerald-400"
                        }`}
                      >
                        {money(t.profit, cur)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Withdrawals / payouts
            </h3>
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              {report.payouts.length === 0 ? (
                <span>
                  <strong className="text-foreground">None.</strong> No funds
                  were ever requested or withdrawn from this account.
                </span>
              ) : (
                report.payouts
                  .map((p) => `${money(p.amount, p.currency)} (${p.status})`)
                  .join(", ")
              )}
            </div>
          </section>
        </TabsContent>

        {/* SIGNED TERMS */}
        <TabsContent value="terms" className="space-y-5 mt-4">
          {signedTerms ? (
            <>
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 px-4 py-3">
                <p className="text-sm text-blue-200 italic">
                  “{signedTerms.statement}”
                </p>
              </div>
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Acceptance record
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatBox
                    label="Electronic signature"
                    value={signedTerms.name}
                  />
                  <StatBox label="Email" value={signedTerms.email} />
                  <StatBox
                    label="Country"
                    value={signedTerms.country || "—"}
                  />
                  <StatBox
                    label="Accepted at"
                    value={fmt(signedTerms.acceptedAt)}
                  />
                  <StatBox
                    label="Terms version"
                    value={signedTerms.termsVersion}
                  />
                  <StatBox label="IP address" value={signedTerms.ipAddress} />
                  <StatBox
                    label="Device / user-agent"
                    value={signedTerms.userAgent}
                  />
                  <StatBox label="Document" value={signedTerms.documentUrl} />
                </div>
              </section>
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Key clauses accepted
                </h3>
                <div className="space-y-3">
                  {signedTerms.clauses.map((c, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border bg-muted/30 p-3"
                    >
                      <h4 className="text-sm font-medium text-amber-400 mb-1">
                        {c.heading}
                      </h4>
                      <p className="text-sm text-muted-foreground">{c.body}</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No signed terms record.
            </p>
          )}
        </TabsContent>

        {/* COMMUNICATIONS */}
        <TabsContent value="comms" className="mt-4">
          <Accordion type="single" collapsible className="w-full">
            {communications.map((c, i) => (
              <AccordionItem key={c.key} value={`item-${i}`} className="border-border">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    {c.sent ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {EMAIL_LABELS[c.key] || c.key}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        To: {c.to} · {c.subject}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {c.sent
                        ? `Sent${c.messageId ? ` · id ${c.messageId}` : ""}`
                        : `Not sent${c.error ? ` · ${c.error}` : " (copy only)"}`}
                    </p>
                    <iframe
                      title={c.key}
                      srcDoc={c.html}
                      className="w-full rounded-lg border border-border bg-white"
                      style={{ height: 460 }}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        {/* POLICIES */}
        <TabsContent value="policies" className="space-y-6 mt-4">
          <section>
            <h3 className="text-base font-semibold text-foreground mb-3">
              {policies.fraudPrevention.title}
            </h3>
            <div className="space-y-4">
              {policies.fraudPrevention.sections.map((s, i) => (
                <div key={i}>
                  <h4 className="text-sm font-medium text-amber-400 mb-1.5">
                    {s.heading}
                  </h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
                    {s.points.map((p, j) => (
                      <li key={j}>{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h3 className="text-base font-semibold text-foreground mb-3">
              {policies.chargeback.title}
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
              {policies.chargeback.points.map((p, j) => (
                <li key={j}>{p}</li>
              ))}
            </ul>
          </section>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
