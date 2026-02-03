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
import {
  TrendingUp,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  Loader2,
  ArrowLeft,
} from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // STEP 1 — SEND OTP
  const sendOtp = async () => {
    if (!email) return setError("Email is required");
    try {
      setLoading(true);
      await api.post("/auth/forgot-password", { email });
      setError("");
      setStep(2);
    } catch {
      setError("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2 — VERIFY OTP (UI only)
  const verifyOtp = () => {
    if (otp.length !== 6) return setError("Invalid OTP");
    setError("");
    setStep(3);
  };

  // STEP 3 — RESET PASSWORD
  const resetPassword = async () => {
    if (!password || !confirm) return setError("All fields are required");

    if (password !== confirm) return setError("Passwords do not match");

    try {
      setLoading(true);
      await api.post("/auth/reset-password", {
        email,
        otp,
        newPassword: password,
      });
      navigate(createPageUrl("SignIn"));
    } catch {
      setError("OTP expired or invalid");
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
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}

          {/* TITLE */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {step === 1 && "Forgot Password"}
            {step === 2 && "Verify OTP"}
            {step === 3 && "Reset Password"}
          </h1>

          <p className="text-slate-400 mb-8">
            {step === 1 && "Enter your email to receive OTP"}
            {step === 2 && "Enter the 6-digit OTP sent to your email"}
            {step === 3 && "Create a new password"}
          </p>

          {/* ERROR */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="text-slate-300">Email</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                onClick={sendOtp}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : "Send OTP"}
              </Button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6 text-center flex flex-col items-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>

              <Button
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                onClick={verifyOtp}
              >
                Verify OTP
              </Button>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <Input
                  type="password"
                  placeholder="New Password"
                  className="pl-10 bg-slate-900 border-slate-700 text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  className="pl-10 bg-slate-900 border-slate-700 text-white"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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
                  "Reset Password"
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
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE — SAME AS SIGNIN */}
      <div className="hidden lg:flex flex-1 relative">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=1600&fit=crop"
            alt="Trading"
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
                  Secure Account Recovery
                </p>
                <p className="text-sm text-slate-400">
                  Your security is our priority
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
