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
    collectorInterest: "ancient-coins",
    agreeTerms: false,
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
      fullName: "Sir Henry De Mel",
      username: "demel_numis",
      email: "henry.demel@lankanumis.lk",
      password: "VaultPassword2026!",
      confirmPassword: "VaultPassword2026!",
      collectorInterest: "ancient-coins",
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
      result.error.issues.forEach((err) => {
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[rgba(201,162,39,0.3)] bg-[#101726] text-xs font-mono uppercase tracking-widest text-[#f1d27a]">
          <Sparkles className="h-3.5 w-3.5 text-[#f1d27a]" />
          <span>Charter Ceylon Collector</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-serif">
          Create Collector Dossier
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Register to bid in live Colombo floor auctions, consign rare Ceylon items, and access vault custody.
        </p>
      </div>

      {signupSuccess ? (
        <div className="p-8 rounded-2xl bg-cyan-950/80 border border-cyan-400/50 text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-white font-serif">Dossier Approved!</h3>
          <p className="text-xs text-zinc-300 leading-relaxed max-w-sm mx-auto">
            Your credentials have been securely entered into the LankaNumis registry. Welcome to our global fraternity of Ceylon curators.
          </p>
          <div className="pt-2">
            <Link href="/">
              <Button variant="gold" className="text-xs uppercase tracking-wider font-semibold font-mono">
                Explore Live Lots
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
              className="text-[11px] text-[#f1d27a] hover:underline flex items-center gap-1 font-mono"
            >
              ⚡ Auto-fill Sri Lankan Collector Profile
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <Label htmlFor="fullName" required>
                Full Legal Name
              </Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="e.g. Sir Henry De Mel"
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
                placeholder="demel_numis"
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
              placeholder="henry.demel@lankanumis.lk"
              value={formData.email}
              onChange={handleChange}
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email}
            />
          </div>

          {/* Collecting Discipline for Sri Lanka */}
          <div>
            <Label htmlFor="collectorInterest" required>
              Primary Collecting Focus
            </Label>
            <select
              id="collectorInterest"
              name="collectorInterest"
              value={formData.collectorInterest}
              onChange={handleChange}
              className="flex h-11 w-full rounded-xl border border-[rgba(201,162,39,0.2)] bg-[#0d1424] px-4 py-2 text-sm text-zinc-100 transition-all focus-visible:outline-none focus-visible:border-[#c9a227] focus-visible:ring-2 focus-visible:ring-[#c9a227]/20 font-sans"
            >
              <option value="ancient-coins" className="bg-[#0c121e]">Ancient Sri Lankan Coins (Kahavanu &amp; Massa)</option>
              <option value="proof-commemoratives" className="bg-[#0c121e]">CBSL Proof Sets &amp; Commemorative Crowns</option>
              <option value="currency-notes" className="bg-[#0c121e]">Historic Ceylon Currency Notes (George VI / QE II)</option>
              <option value="stamps" className="bg-[#0c121e]">Ceylon Philately &amp; Chalon Head Stamps</option>
              <option value="medals" className="bg-[#0c121e]">Sri Lankan Medals &amp; Militaria</option>
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
                className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-[#c9a227] focus:ring-[#c9a227] cursor-pointer"
              />
              <label htmlFor="agreeTerms" className="text-xs text-zinc-400 cursor-pointer select-none leading-relaxed">
                I agree to the{" "}
                <a href="#" className="text-[#f1d27a] hover:underline">
                  Terms of Auction
                </a>
                ,{" "}
                <a href="#" className="text-[#f1d27a] hover:underline">
                  Commercial Escrow Protocol
                </a>
                , and{" "}
                <a href="#" className="text-[#f1d27a] hover:underline">
                  Antiquities Ordinance Provenance Declaration
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
            className="w-full text-xs uppercase tracking-wider font-semibold gap-2 mt-4 shadow-lg shadow-[#c9a227]/20 font-mono"
          >
            <span>Register Dossier &amp; Issue Colombo Paddle</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          {/* Link to login */}
          <div className="pt-4 text-center text-xs text-zinc-400 font-mono">
            Already have an active collector account?{" "}
            <Link href="/login" className="text-[#f1d27a] font-semibold hover:underline">
              Sign In to Bourse
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
