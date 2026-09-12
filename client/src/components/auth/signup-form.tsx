"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signupSchema, SignupFormData } from "@/lib/validations/signup-schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  User,
  AtSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export function SignupForm() {
  const [formData, setFormData] = useState<SignupFormData>({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    collectorInterest: "coins",
    agreeTerms: false as unknown as true,
  });

  const [errors, setErrors] = useState<{ [K in keyof SignupFormData]?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name as keyof SignupFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFillDemo = () => {
    setFormData({
      fullName: "Sir Henry Cavendish",
      username: "cavendish_numis",
      email: "henry.cavendish@relicvault.com",
      password: "VaultPassword2026!",
      confirmPassword: "VaultPassword2026!",
      collectorInterest: "coins",
      agreeTerms: true,
    });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: { [K in keyof SignupFormData]?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof SignupFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSignupSuccess(true);
    }, 1400);
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-xs font-mono uppercase tracking-widest text-amber-300">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Charter Membership</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-serif">
          Create Collector Dossier
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Register to participate in live premier auctions, request consignments, and access insured custody.
        </p>
      </div>

      {signupSuccess ? (
        <div className="p-8 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-white font-serif">Dossier Approved!</h3>
          <p className="text-xs text-zinc-300 leading-relaxed max-w-sm mx-auto">
            Your credentials have been securely registered to the RelicVault registry. Welcome to our global fraternity of collectors.
          </p>
          <div className="pt-2">
            <Link href="/">
              <Button variant="gold" className="text-xs uppercase tracking-wider font-semibold">
                Explore Live Auctions
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Demo fill button */}
          <div className="flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] text-amber-400/90 hover:text-amber-300 hover:underline flex items-center gap-1 font-mono"
            >
              ⚡ Auto-fill Collector Profile
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <Label htmlFor="fullName" required>
                Full Name
              </Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="e.g. Sir Henry Cavendish"
                value={formData.fullName}
                onChange={handleChange}
                leftIcon={<User className="h-4 w-4" />}
                error={errors.fullName}
              />
            </div>

            {/* Username */}
            <div>
              <Label htmlFor="username" required>
                Collector Handle
              </Label>
              <Input
                id="username"
                name="username"
                placeholder="cavendish_numis"
                value={formData.username}
                onChange={handleChange}
                leftIcon={<AtSign className="h-4 w-4" />}
                error={errors.username}
              />
            </div>
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
              placeholder="name@collectorvault.com"
              value={formData.email}
              onChange={handleChange}
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email}
            />
          </div>

          {/* Collecting Discipline */}
          <div>
            <Label htmlFor="collectorInterest" required>
              Primary Collecting Specialty
            </Label>
            <select
              id="collectorInterest"
              name="collectorInterest"
              value={formData.collectorInterest}
              onChange={handleChange}
              className="flex h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm text-zinc-100 transition-all focus-visible:outline-none focus-visible:border-amber-500/80 focus-visible:ring-2 focus-visible:ring-amber-500/20"
            >
              <option value="coins" className="bg-zinc-900">Rare Coins & Ancient Numismatics</option>
              <option value="stamps" className="bg-zinc-900">Philately & Vintage Postage Stamps</option>
              <option value="banknotes" className="bg-zinc-900">Historical Banknotes & Treasury Paper</option>
              <option value="antiquities" className="bg-zinc-900">Antiquities, Seals & Classical Artifacts</option>
              <option value="comics" className="bg-zinc-900">Graded Golden Age Comic Books</option>
              <option value="watches" className="bg-zinc-900">Historic Horology & Timepieces</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <Label htmlFor="password" required>
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
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

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword" required>
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Repeat password"
                value={formData.confirmPassword}
                onChange={handleChange}
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.confirmPassword}
              />
            </div>
          </div>

          {/* Agree to terms */}
          <div className="pt-2">
            <div className="flex items-start gap-2.5">
              <input
                id="agreeTerms"
                name="agreeTerms"
                type="checkbox"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-400 cursor-pointer"
              />
              <label htmlFor="agreeTerms" className="text-xs text-zinc-400 cursor-pointer select-none leading-relaxed">
                I agree to the{" "}
                <a href="#" className="text-amber-400 hover:underline">
                  Terms of Auction
                </a>
                ,{" "}
                <a href="#" className="text-amber-400 hover:underline">
                  Escrow Protocol
                </a>
                , and{" "}
                <a href="#" className="text-amber-400 hover:underline">
                  Provenance Authenticity Guarantee
                </a>
                .
              </label>
            </div>
            {errors.agreeTerms && (
              <p className="mt-1.5 text-xs text-red-400">{errors.agreeTerms}</p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="gold"
            size="lg"
            isLoading={isLoading}
            className="w-full text-xs uppercase tracking-wider font-semibold gap-2 mt-4 shadow-lg shadow-amber-500/15"
          >
            <span>Complete Registration & Issue Paddle</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          {/* Link to login */}
          <div className="pt-4 text-center text-xs text-zinc-400">
            Already have an active collector account?{" "}
            <Link href="/login" className="text-amber-400 font-semibold hover:underline">
              Sign In to Vault
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
