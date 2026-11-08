"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  signupSchema,
  type SignupFormData,
  type SignupFormInput,
} from "@/lib/validations/signup-schema";
import { authApi, type SessionUser } from "@/lib/api";
import { apiFormErrors, zodFieldErrors, type FieldErrors } from "@/lib/form-errors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { VerifyOtpForm } from "@/components/auth/verify-otp-form";
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Gavel,
  Store,
} from "lucide-react";

type Field = keyof SignupFormInput;
type Step = "details" | "verify" | "done";

const ROLE_OPTIONS = [
  {
    value: "BUYER",
    title: "Collector",
    description: "Bid in live auctions and buy verified pieces",
    icon: Gavel,
  },
  {
    value: "SELLER",
    title: "Consignor",
    description: "List items for expert review and sale",
    icon: Store,
  },
] as const;

/** API (RegisterDto) property -> form field, for server-side validation messages. */
const API_FIELDS: Record<string, Field> = {
  name: "name",
  email: "email",
  phone: "phone",
  password: "password",
  role: "role",
};

export function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [formData, setFormData] = useState<SignupFormInput>({
    name: "",
    email: "",
    phone: "",
    role: "BUYER",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [verifiedUser, setVerifiedUser] = useState<SessionUser | null>(null);
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (errors[name as Field]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError(null);

    const result = signupSchema.safeParse(formData);
    if (!result.success) {
      setErrors(zodFieldErrors<Field>(result.error));
      return;
    }

    const data: SignupFormData = result.data;
    setIsLoading(true);
    try {
      await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        ...(data.phone ? { phone: data.phone } : {}),
      });
      setRegisteredEmail(data.email);
      setStep("verify");
    } catch (error) {
      const { fieldErrors, formError: message } = apiFormErrors(error, API_FIELDS);
      setErrors(fieldErrors);
      setFormError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[rgba(201,162,39,0.3)] bg-[#101726] text-xs font-mono uppercase tracking-widest text-[#f1d27a]">
          <Sparkles className="h-3.5 w-3.5 text-[#f1d27a]" />
          <span>{step === "details" ? "Charter Ceylon Collector" : "Step 2 of 2 · Verify e-mail"}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-serif">
          {step === "verify" ? "Confirm Your E-mail" : "Create Collector Dossier"}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          {step === "verify"
            ? "Enter the code we e-mailed you to activate your account."
            : "Register to bid in live Colombo auctions and consign rare Ceylon items for expert review."}
        </p>
      </div>

      {step === "done" && verifiedUser && (
        <div className="p-8 rounded-2xl bg-cyan-950/80 border border-cyan-400/50 text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-white font-serif">Dossier Approved!</h3>
          <p className="text-xs text-zinc-300 leading-relaxed max-w-sm mx-auto">
            Welcome, {verifiedUser.name}. Your {verifiedUser.role === "SELLER" ? "consignor" : "collector"}{" "}
            account is active and you are signed in.
          </p>
          <div className="pt-2">
            <Button
              variant="gold"
              className="text-xs uppercase tracking-wider font-semibold font-mono"
              onClick={() => router.push("/listings")}
            >
              Explore Live Lots
            </Button>
          </div>
        </div>
      )}

      {step === "verify" && (
        <VerifyOtpForm
          email={registeredEmail}
          onVerified={(session) => {
            setVerifiedUser(session.user);
            setStep("done");
          }}
        />
      )}

      {step === "details" && (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {formError && <Alert variant="error">{formError}</Alert>}

          {/* Account type -> RegisterDto.role */}
          <fieldset>
            <legend className="mb-1.5 block text-xs font-medium text-zinc-300">
              I want to <span className="text-[#f1d27a]">*</span>
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {ROLE_OPTIONS.map(({ value, title, description, icon: Icon }) => {
                const selected = formData.role === value;
                return (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-xl border p-3 transition-all ${
                      selected
                        ? "border-[#c9a227] bg-[#c9a227]/10"
                        : "border-[rgba(201,162,39,0.2)] bg-[#0d1424] hover:border-[rgba(201,162,39,0.45)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={value}
                      checked={selected}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Icon className="h-4 w-4 text-[#f1d27a]" /> {title}
                    </span>
                    <span className="mt-1 block text-[11px] leading-snug text-zinc-400">
                      {description}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <Label htmlFor="name" required>
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                placeholder="e.g. Kamala Silva"
                value={formData.name}
                onChange={handleChange}
                leftIcon={<User className="h-4 w-4" />}
                error={errors.name}
              />
            </div>

            {/* Phone (optional) */}
            <div>
              <Label htmlFor="phone">Mobile Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+94771234567 (optional)"
                value={formData.phone}
                onChange={handleChange}
                leftIcon={<Phone className="h-4 w-4" />}
                error={errors.phone}
              />
            </div>
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
              autoComplete="email"
              placeholder="you@example.lk"
              value={formData.email}
              onChange={handleChange}
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email}
            />
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
                autoComplete="new-password"
                placeholder="8+ chars, Aa, 1 number"
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

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword" required>
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
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
            <span>Register Dossier</span>
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
