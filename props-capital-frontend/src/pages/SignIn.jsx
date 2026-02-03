import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "../utils";
import { useTranslation } from "../contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import api from "@/lib/api";
import {
  TrendingUp,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Loader2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function SignIn() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  // Clean up any redirect state when component mounts
  useEffect(() => {
    // Replace current entry to clear any 'from' state reference
    if (location.state?.from) {
      navigate(createPageUrl("SignIn"), { replace: true, state: null });
    }
  }, []); // Empty dependency array - only run once on mount

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await api.post("/auth/login", credentials);
      return response.data;
    },
    onSuccess: async (data) => {
      // Use the login function from AuthContext to handle token and user data
      login(data.accessToken, data.user);

      // Redirect to appropriate dashboard based on user role
      const userRole = data.user?.role;
      if (userRole === "ADMIN") {
        navigate(createPageUrl("AdminDashboard"));
      } else {
        navigate(createPageUrl("TraderDashboard"));
      }
    },
    onError: (error) => {
      // Extract error message from response
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        t("signIn.errors.invalidCredentials");
      setError(errorMessage);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ email, password });
  };

  // const handleForgetPassword =>(){

  // }

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email) => {
      const response = await api.post("/auth/forgot-password", { email });
      return response.data;
    },
    onSuccess: (data) => {
      setSuccessMessage("Password reset email sent."); // or use translation: t('signIn.forgotPassword.emailSent')
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Something went wrong.";
      setError(errorMessage);
    },
  });
  const handleForgotPassword = () => {
    if (!email) {
      setError("Please enter your email."); // or use translation: t('signIn.errors.enterEmail')
      return;
    }
    setError("");
    setSuccessMessage("");
    forgotPasswordMutation.mutate(email);
  };
  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link
            to={createPageUrl("Home")}
            className="flex items-center gap-2 mb-8"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Prop Capitals</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {t("signIn.title")}
          </h1>
          <p className="text-slate-400 mb-8">{t("signIn.subtitle")}</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                {t("signIn.email")}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t("signIn.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                {t("signIn.password")}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("signIn.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex  sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex  items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                  className="border-slate-600 data-[state=checked]:bg-emerald-500"
                />
                <Label
                  htmlFor="remember"
                  className="text-sm text-slate-400 cursor-pointer"
                >
                  {t("signIn.rememberMe")}
                </Label>
              </div>
              <button
                type="button"
                className="text-sm  text-emerald-400 hover:text-emerald-300"
                onClick={handleForgotPassword}
              >
                {t("signIn.forgotPassword")}
              </button>
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white py-5 sm:py-6 text-base sm:text-lg h-auto"
            >
              {loginMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {t("signIn.signInButton")}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-400">
              {t("signIn.noAccount")}{" "}
              <Link
                to={createPageUrl("SignUp")}
                className="text-emerald-400 hover:text-emerald-300 font-medium"
              >
                {t("signIn.createAccount")}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
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
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-800 p-6 md:p-8 max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-semibold">
                  {t("signIn.secureTrading")}
                </p>
                <p className="text-sm text-slate-400">
                  {t("signIn.fundsProtected")}
                </p>
              </div>
            </div>
            <p className="text-slate-300">{t("signIn.securityDescription")}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
