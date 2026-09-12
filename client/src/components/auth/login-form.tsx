"use client";

import React, { useState } from "react";
import Link from "next/link";
import { loginSchema, LoginFormData } from "@/lib/validations/login-schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

export function LoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<{ [K in keyof LoginFormData]?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name as keyof LoginFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFillDemo = () => {
    setFormData({
      email: "collector@relicvault.com",
      password: "VaultCollector99!",
      rememberMe: true,
    });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: { [K in keyof LoginFormData]?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof LoginFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    // Simulate authentication delay
    setTimeout(() => {
      setIsLoading(false);
      setAuthSuccess(true);
    }, 1200);
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-serif">
          Access Collector Vault
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Enter your authorized credentials to manage bids, watchlists, and vault certificates.
        </p>
      </div>

      {authSuccess ? (
        <div className="p-6 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Identity Verified</h3>
          <p className="text-xs text-zinc-300">
            Welcome back, Connoisseur. Directing you to your private auction room...
          </p>
          <Link href="/">
            <Button variant="gold" size="sm" className="mt-2 text-xs uppercase tracking-wider">
              Enter Marketplace
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Quick Demo Fill Helper */}
          <div className="flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] text-amber-400/90 hover:text-amber-300 hover:underline flex items-center gap-1 font-mono"
            >
              ⚡ Auto-fill Demo Collector Account
            </button>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" required>
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="e.g. lord.sterling@numismatics.org"
              value={formData.email}
              onChange={handleChange}
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email}
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password" required>
                Master Password
              </Label>
              <a href="#" className="text-[11px] text-zinc-400 hover:text-amber-400 transition-colors">
                Forgot password?
              </a>
            </div>
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              value={formData.password}
              onChange={handleChange}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={errors.password}
            />
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-400 cursor-pointer"
            />
            <label htmlFor="rememberMe" className="text-xs text-zinc-400 cursor-pointer select-none">
              Remember this secure workstation for 30 days
            </label>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="gold"
            size="lg"
            isLoading={isLoading}
            className="w-full text-xs uppercase tracking-wider font-semibold gap-2 mt-2 shadow-lg shadow-amber-500/10"
          >
            <span>Sign In to Vault</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          {/* Social or Web3 Login */}
          <div className="pt-4 space-y-3">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#0c0f17] px-3 text-[11px] text-zinc-500 uppercase tracking-widest font-mono">
                or authenticate with
              </span>
              <div className="border-t border-white/10 w-full" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-2 hover:border-zinc-500"
                onClick={handleFillDemo}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-2 hover:border-zinc-500"
                onClick={handleFillDemo}
              >
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                <span>Web3 Key</span>
              </Button>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-4 text-center text-xs text-zinc-400">
            Don&apos;t have a collector dossier?{" "}
            <Link href="/signup" className="text-amber-400 font-semibold hover:underline">
              Request membership
            </Link>
          </div>

        </form>
      )}
    </div>
  );
}
