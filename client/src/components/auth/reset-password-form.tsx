"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import { Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { passwordSchema } from "@/lib/validations/signup-schema";
import { apiFormErrors, zodFieldErrors, type FieldErrors } from "@/lib/form-errors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

const resetSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string().min(1, "Please confirm your password") })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type Field = "password" | "confirmPassword";

/** POST /auth/reset-password with the token from the e-mailed link (?token=...). */
export function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const [values, setValues] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = resetSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors<Field>(parsed.error));
      return;
    }
    setIsLoading(true);
    try {
      const { message } = await authApi.resetPassword({ token, password: parsed.data.password });
      setDone(message);
    } catch (error) {
      const result = apiFormErrors<Field>(error, { password: "password" });
      setErrors(result.fieldErrors);
      setFormError(result.formError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-serif">
          Choose a New Password
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Resetting your password signs you out on every device.
        </p>
      </div>

      {!token ? (
        <Alert variant="error">
          <p>This reset link is missing its token.</p>
          <Link href="/forgot-password" className="font-semibold text-[#f1d27a] hover:underline">
            Request a new link →
          </Link>
        </Alert>
      ) : done ? (
        <div className="p-6 rounded-2xl bg-cyan-950/80 border border-cyan-400/50 text-center space-y-3">
          <CheckCircle2 className="h-8 w-8 text-cyan-400 mx-auto" />
          <p className="text-sm text-zinc-200">{done}</p>
          <Link href="/login">
            <Button variant="gold" size="sm" className="mt-2 text-xs uppercase tracking-wider font-mono">
              Sign In
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {formError && (
            <Alert variant="error">
              <p>{formError}</p>
              <Link href="/forgot-password" className="font-semibold text-[#f1d27a] hover:underline">
                Request a new link →
              </Link>
            </Alert>
          )}
          <div>
            <Label htmlFor="password" required>
              New Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="8+ chars, Aa, 1 number"
              value={values.password}
              onChange={handleChange}
              leftIcon={<Lock className="h-4 w-4" />}
              error={errors.password}
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword" required>
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat password"
              value={values.confirmPassword}
              onChange={handleChange}
              leftIcon={<Lock className="h-4 w-4" />}
              error={errors.confirmPassword}
            />
          </div>
          <Button
            type="submit"
            variant="gold"
            size="lg"
            isLoading={isLoading}
            className="w-full text-xs uppercase tracking-wider font-semibold gap-2 font-mono"
          >
            <span>Update Password</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
