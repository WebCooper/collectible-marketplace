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
      email: "chandana.j@lankanumis.lk",
      password: "ColomboVault2026!",
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
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof LoginFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setAuthSuccess(true);
    }, 1200);
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-serif">
          Access Collector Dossier
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Enter your authorized credentials to manage floor bids, Ceylon watchlists, and vault certificates.
        </p>
      </div>

      {authSuccess ? (
        <div className="p-6 rounded-2xl bg-cyan-950/80 border border-cyan-400/50 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-white font-serif">Collector Identity Verified</h3>
          <p className="text-xs text-zinc-300">
            Welcome back, Connoisseur. Directing you to the Colombo live auction room...
          </p>
          <Link href="/">
            <Button variant="gold" size="sm" className="mt-2 text-xs uppercase tracking-wider font-mono">
              Enter Floor Bourse
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
              className="text-[11px] text-[#f1d27a] hover:underline flex items-center gap-1 font-mono"
            >
              ⚡ Auto-fill Sri Lankan Collector Account
            </button>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" required>
              Confidential Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="chandana.j@lankanumis.lk"
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
              <a href="#" className="text-[11px] text-zinc-400 hover:text-[#f1d27a] transition-colors font-mono">
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
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-[#c9a227] focus:ring-[#c9a227] cursor-pointer"
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
            className="w-full text-xs uppercase tracking-wider font-semibold gap-2 mt-2 shadow-lg shadow-[#c9a227]/20 font-mono"
          >
            <span>Sign In to Bourse</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          {/* Social or Web3 Login */}
          <div className="pt-4 space-y-3">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-[rgba(201,162,39,0.15)] w-full" />
              <span className="bg-[#0c121e] px-3 text-[11px] text-zinc-500 uppercase tracking-widest font-mono">
                or authenticate with
              </span>
              <div className="border-t border-[rgba(201,162,39,0.15)] w-full" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-2 font-mono"
                onClick={handleFillDemo}
              >
                <span>Google</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-2 font-mono text-cyan-300 border-cyan-500/30 hover:border-cyan-400"
                onClick={handleFillDemo}
              >
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <span>Web3 Key</span>
              </Button>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-4 text-center text-xs text-zinc-400 font-mono">
            New to Sri Lankan collecting?{" "}
            <Link href="/signup" className="text-[#f1d27a] font-semibold hover:underline">
              Register dossier
            </Link>
          </div>

        </form>
      )}
    </div>
  );
}
