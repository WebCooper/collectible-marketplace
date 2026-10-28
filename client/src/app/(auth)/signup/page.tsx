import { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create Collector Dossier | RelicVault",
  description: "Join RelicVault to participate in authenticated rare numismatic and philatelic auctions.",
};

export default function SignupPage() {
  return <SignupForm />;
}
