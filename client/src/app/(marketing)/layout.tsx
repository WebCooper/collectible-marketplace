import React from "react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/marketing/footer";
import { AnimatedBackground } from "@/components/shared/animated-background";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
      <AnimatedBackground />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
