import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import api from "@/lib/api";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  TrendingUp,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  Loader2,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Email validation helper
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation helper
  const validatePassword = (password) => {
    if (password.length < 8) {
      return t("forgotPassword.validation.minLength");
    }
    if (!/[A-Z]/.test(password)) {
      return t("forgotPassword.validation.uppercase");
    }
    if (!/[a-z]/.test(password)) {
      return t("forgotPassword.validation.lowercase");
    }
    if (!/[0-9]/.test(password)) {
      return t("forgotPassword.validation.number");
    }
    return null;
  };

  // Countdown timer for resend cooldown
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // STEP 1 — SEND OTP
  const sendOtp = async (isResend = false) => {
    if (!email) return setError(t("forgotPassword.errors.emailRequired"));
    if (!isValidEmail(email)) return setError(t("forgotPassword.errors.invalidEmail"));

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      await api.post("/auth/forgot-password", { email });
      setSuccess(t("forgotPassword.success.otpSent"));
      setStep(2);
      setResendCooldown(60); // 60 second cooldown for resend
    } catch (err) {
      const errorMessage = err.response?.data?.message || t("forgotPassword.errors.sendOtpFailed");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    if (resendCooldown > 0) return;
    await sendOtp(true);
  };

  // STEP 2 — VERIFY OTP (UI only)
  const verifyOtp = () => {
    if (otp.length !== 6) return setError(t("forgotPassword.errors.invalidOtp"));
    setError("");
    setSuccess("");
    setStep(3);
  };

  // STEP 3 — RESET PASSWORD
  const resetPassword = async () => {
    if (!password || !confirm) return setError(t("forgotPassword.errors.allFieldsRequired"));

    if (password !== confirm) return setError(t("forgotPassword.errors.passwordsMismatch"));

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) return setError(passwordError);

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      await api.post("/auth/reset-password", {
        email,
        otp,
        newPassword: password,
      });
      setSuccess(t("forgotPassword.success.passwordReset"));
      setTimeout(() => navigate(createPageUrl("SignIn")), 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || t("forgotPassword.errors.resetFailed");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* LEFT SIDE */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* LOGO */}
          <Link
            to={createPageUrl("Home")}
            className="flex items-center gap-2 mb-8"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Prop Capitals</span>
          </Link>

          {/* BACK BUTTON */}
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 text-slate-400 hover:text-white mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> {t("forgotPassword.back")}
            </button>
          )}

          {/* TITLE */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {step === 1 && t("forgotPassword.step1.title")}
            {step === 2 && t("forgotPassword.step2.title")}
            {step === 3 && t("forgotPassword.step3.title")}
          </h1>

          <p className="text-slate-400 mb-8">
            {step === 1 && t("forgotPassword.step1.subtitle")}
            {step === 2 && t("forgotPassword.step2.subtitle")}
            {step === 3 && t("forgotPassword.step3.subtitle")}
          </p>

          {/* ERROR */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {success}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="text-slate-300">{t("forgotPassword.emailLabel")}</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <Input
                    type="email"
                    placeholder={t("forgotPassword.emailPlaceholder")}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value.trim());
                      setError("");
                    }}
                    onKeyPress={(e) => e.key === "Enter" && sendOtp()}
                    className="pl-10 bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                onClick={() => sendOtp()}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : t("forgotPassword.sendOtp")}
              </Button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6 text-center flex flex-col items-center">
              <InputOTP maxLength={6} value={otp} onChange={(value) => {
                setOtp(value);
                setError("");
              }}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>

              <Button
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                onClick={verifyOtp}
                disabled={otp.length !== 6}
              >
                {t("forgotPassword.verifyOtp")}
              </Button>

              <div className="text-sm text-slate-400">
                {t("forgotPassword.didntReceive")}{" "}
                {resendCooldown > 0 ? (
                  <span className="text-slate-500">
                    {t("forgotPassword.resendIn", { seconds: resendCooldown })}
                  </span>
                ) : (
                  <button
                    onClick={resendOtp}
                    disabled={loading}
                    className="text-emerald-400 hover:text-emerald-300 font-medium disabled:opacity-50"
                  >
                    {loading ? t("forgotPassword.sending") : t("forgotPassword.resendOtp")}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <Input
                    type="password"
                    placeholder={t("forgotPassword.newPasswordPlaceholder")}
                    className="pl-10 bg-slate-900 border-slate-700 text-white"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                  />
                </div>
                <div className="mt-2 text-xs text-slate-400 space-y-1">
                  <p>{t("forgotPassword.requirements.title")}</p>
                  <ul className="list-disc list-inside pl-2">
                    <li className={password.length >= 8 ? "text-emerald-400" : ""}>
                      {t("forgotPassword.requirements.minLength")}
                    </li>
                    <li className={/[A-Z]/.test(password) ? "text-emerald-400" : ""}>
                      {t("forgotPassword.requirements.uppercase")}
                    </li>
                    <li className={/[a-z]/.test(password) ? "text-emerald-400" : ""}>
                      {t("forgotPassword.requirements.lowercase")}
                    </li>
                    <li className={/[0-9]/.test(password) ? "text-emerald-400" : ""}>
                      {t("forgotPassword.requirements.number")}
                    </li>
                  </ul>
                </div>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <Input
                  type="password"
                  placeholder={t("forgotPassword.confirmPasswordPlaceholder")}
                  className="pl-10 bg-slate-900 border-slate-700 text-white"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    setError("");
                  }}
                  onKeyPress={(e) => e.key === "Enter" && resetPassword()}
                />
              </div>

              <Button
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                onClick={resetPassword}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  t("forgotPassword.resetPassword")
                )}
              </Button>
            </div>
          )}

          {/* SIGN IN */}
          <div className="mt-8 text-center">
            <Link
              to={createPageUrl("SignIn")}
              className="text-emerald-400 hover:text-emerald-300"
            >
              {t("forgotPassword.backToSignIn")}
            </Link>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE — SAME AS SIGNIN */}
      <div className="hidden lg:flex flex-1 relative">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=1600&fit=crop"
            alt={t("forgotPassword.imageAlt")}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/50 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col justify-center p-12">
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-800 p-6 max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-semibold">
                  {t("forgotPassword.sideCard.title")}
                </p>
                <p className="text-sm text-slate-400">
                  {t("forgotPassword.sideCard.subtitle")}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
