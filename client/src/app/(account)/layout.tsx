import React from "react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/marketing/footer";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-clip bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
