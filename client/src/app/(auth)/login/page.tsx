import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In to Collector Vault | RelicVault",
  description: "Secure collector access for live bids, auctions, and vault certificates.",
};

export default function LoginPage() {
  return <LoginForm />;
}
