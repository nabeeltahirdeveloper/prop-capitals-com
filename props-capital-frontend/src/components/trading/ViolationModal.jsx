import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, XCircle, Shield } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";

export default function ViolationModal({
  isOpen,
  onClose,
  violationType,
  account,
}) {
  const { t } = useTranslation();

  if (!violationType) return null;

  const isDailyLocked = violationType === "DAILY_LOCKED";
  const isDisqualified = violationType === "DISQUALIFIED";

  const title = isDailyLocked
    ? t("violationModal.dailyLossTitle", "Daily Loss Limit Reached")
    : t("violationModal.drawdownTitle", "Maximum Drawdown Reached");

  const ruleLimit = isDailyLocked
    ? `${account?.maxDailyDrawdown || 5}%`
    : `${account?.maxOverallDrawdown || 10}%`;

  const equityAtViolation = account?.equity || account?.balance || 0;

  const actionText = isDailyLocked
    ? t("violationModal.dailyLockedAction", "Trading is locked until tomorrow")
    : t("violationModal.disqualifiedAction", "Challenge disqualified");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md max-h-[70vh]   md:max-h-[90vh]  w-[500px]-auto p-2 md:p-4">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {isDisqualified ? (
              <XCircle className="w-8 h-8 text-red-400" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-orange-400" />
            )}
            <DialogTitle className="md:text-xl font-bold">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-slate-300 md:pt-2">
            {t(
              "violationModal.description",
              "Your account has violated the challenge rules.",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 md:py-4">
          {/* Rule Limit */}
          <div className="bg-slate-800/50 rounded-lg p-2 md:p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-1 md:mb-2">
              <Shield className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-300">
                {t("violationModal.ruleLimit", "Rule Limit")}:
              </span>
            </div>
            <p className="text-lg font-bold text-red-400">{ruleLimit}</p>
          </div>

          {/* Equity at Violation */}
          <div className="bg-slate-800/50 rounded-lg p-2 md:p-4 border border-slate-700">
            <span className="text-sm font-semibold text-slate-300 block mb-1 md:mb-2">
              {t("violationModal.equityAtViolation", "Equity at Violation")}:
            </span>
            <p className="text-lg font-bold text-white">
              $
              {equityAtViolation.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          {/* Action Taken */}
          <div className="bg-red-500/10 rounded-lg p-2 md:p-4 border border-red-500/30">
            <p className="text-sm text-slate-300 md:mb-2">
              {t("violationModal.actionTaken", "Action Taken")}:
            </p>
            <p className="font-semibold text-red-400 md:mb-2">
              {t(
                "violationModal.positionsClosed",
                "All positions were closed automatically",
              )}
            </p>
            <p className="text-sm text-orange-400">{actionText}</p>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-700">
          <Button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {t("violationModal.understood", "Understood")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
