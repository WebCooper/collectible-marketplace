import React from "react";

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      {/* Deep dark base background */}
      <div className="absolute inset-0 bg-[#07090e]" />

      {/* Ambient glowing orbs */}
      <div className="absolute -top-40 left-1/4 h-[550px] w-[550px] rounded-full bg-amber-500/10 blur-[130px] animate-pulse" />
      <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[140px]" />
      <div className="absolute bottom-10 left-1/10 h-[500px] w-[500px] rounded-full bg-emerald-600/5 blur-[120px]" />

      {/* Luxury micro-grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(#d4af37 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Top vignette & edge feathering */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#07090e] to-transparent" />
    </div>
  );
}
