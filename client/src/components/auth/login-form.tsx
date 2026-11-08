"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema, LoginFormData } from "@/lib/validations/login-schema";
import { ApiError, DEMO_ACCOUNTS_ENABLED, errorMessage } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { safeRedirectPath } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Gavel, Store } from "lucide-react";

/** Accounts created by `npm run prisma:seed` in backend/. */
const DEMO_ACCOUNTS = [
  { label: "Demo Buyer", email: "buyer@marketplace.lk", icon: Gavel },
  { label: "Demo Seller", email: "seller@marketplace.lk", icon: Store },
] as const;
const DEMO_PASSWORD = "Password123!";

type FieldErrors = { [K in keyof LoginFormData]?: string };

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, status } = useAuth();
  const redirectTo = safeRedirectPath(searchParams.get("next"));

  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Already signed in (e.g. opened /login in a second tab): go straight on.
  useEffect(() => {
    if (status === "authenticated") router.replace(redirectTo);
  }, [status, router, redirectTo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof LoginFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setFormError(null);
  };

  const fillDemo = (email: string) => {
    setFormData({ email, password: DEMO_PASSWORD });
    setErrors({});
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    setNeedsVerification(false);

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginFormData | undefined;
        if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await signIn(result.data.email, result.data.password);
      router.replace(redirectTo);
    } catch (error) {
      const message = errorMessage(error, "Sign-in failed. Please try again.");
      setFormError(message);
      // The API refuses sign-in until the e-mailed code is confirmed.
      setNeedsVerification(
        error instanceof ApiError && error.status === 401 && /verify/i.test(message),
      );
      setIsLoading(false);
    }
  };

  const verifyHref = `/verify?email=${encodeURIComponent(formData.email.trim())}`;

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-serif">
          Access Collector Dossier
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Enter your credentials to manage bids, watch live Ceylon auctions, and track your orders.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {formError && (
          <Alert variant="error">
            <p>{formError}</p>
            {needsVerification && (
              <Link href={verifyHref} className="font-semibold text-[#f1d27a] hover:underline">
                Enter your verification code →
              </Link>
            )}
          </Alert>
        )}

        {/* Email */}
        <div>
          <Label htmlFor="email" required>
            Email Address
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.lk"
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
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-[11px] text-zinc-400 hover:text-[#f1d27a] transition-colors font-mono"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={formData.password}
            onChange={handleChange}
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 hover:text-white transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            error={errors.password}
          />
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

        {/* Seeded demo accounts (development only) */}
        {DEMO_ACCOUNTS_ENABLED && (
          <div className="pt-4 space-y-3">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-[rgba(201,162,39,0.15)] w-full" />
              <span className="bg-[#0c121e] px-3 text-[11px] text-zinc-500 uppercase tracking-widest font-mono whitespace-nowrap">
                or use a seeded account
              </span>
              <div className="border-t border-[rgba(201,162,39,0.15)] w-full" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {DEMO_ACCOUNTS.map(({ label, email, icon: Icon }) => (
                <Button
                  key={email}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs gap-2 font-mono"
                  onClick={() => fillDemo(email)}
                >
                  <Icon className="h-4 w-4 text-[#f1d27a]" />
                  <span>{label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Footer note */}
        <div className="pt-4 text-center text-xs text-zinc-400 font-mono">
          New to Sri Lankan collecting?{" "}
          <Link href="/signup" className="text-[#f1d27a] font-semibold hover:underline">
            Register dossier
          </Link>
        </div>
      </form>
    </div>
  );
}
