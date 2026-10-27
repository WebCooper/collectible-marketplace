"use client";

import React from "react";
import { motion } from "framer-motion";

interface AnimatedBackgroundProps {
  intensity?: "subtle" | "vibrant";
  showGlints?: boolean;
}

export function AnimatedBackground({
  intensity = "subtle",
  showGlints = true,
}: AnimatedBackgroundProps) {
  // 6 subtle ambient floating coin-glint particles
  const glints = [
    { top: "15%", left: "20%", delay: 0, size: 4 },
    { top: "25%", right: "18%", delay: 1.8, size: 6 },
    { top: "55%", left: "10%", delay: 3.2, size: 5 },
    { top: "70%", right: "25%", delay: 0.9, size: 3 },
    { top: "85%", left: "45%", delay: 2.4, size: 4 },
    { top: "40%", right: "40%", delay: 4.1, size: 5 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* Deep Near-Black Navy Foundation (#0A0E17) */}
      <div className="absolute inset-0 bg-[#0a0e17]" />

      {/* Ambient Antique Gold Glow Orb (Top-Center) */}
      <div
        className={`absolute -top-32 left-1/3 -translate-x-1/2 rounded-full blur-[140px] pointer-events-none transition-opacity duration-1000 ${
          intensity === "vibrant"
            ? "w-[650px] h-[650px] bg-amber-500/15"
            : "w-[500px] h-[500px] bg-amber-500/10"
        }`}
      />

      {/* Secondary Cyan/Teal Auction Depth Glow (Bottom-Right) */}
      <div
        className="absolute top-1/3 -right-32 w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[150px] pointer-events-none"
      />

      {/* Sri Lankan Heritage Emerald Underglow (Bottom-Left) */}
      <div
        className="absolute bottom-10 -left-20 w-[450px] h-[450px] rounded-full bg-emerald-600/5 blur-[130px] pointer-events-none"
      />

      {/* Micro-Coordinate Numismatic Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(201, 162, 39, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(201, 162, 39, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Subtle Coin-Glint Floating Particles (Framer Motion) */}
      {showGlints &&
        glints.map((glint, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              top: glint.top,
              left: glint.left,
              right: glint.right,
              width: glint.size,
              height: glint.size,
              background:
                i % 2 === 0
                  ? "radial-gradient(circle, #f1d27a 0%, #c9a227 60%, transparent 100%)"
                  : "radial-gradient(circle, #67e8f9 0%, #06b6d4 60%, transparent 100%)",
              boxShadow:
                i % 2 === 0
                  ? "0 0 12px 2px rgba(241, 210, 122, 0.6)"
                  : "0 0 12px 2px rgba(34, 211, 238, 0.5)",
            }}
            initial={{ opacity: 0.1, scale: 0.8 }}
            animate={{
              opacity: [0.1, 0.85, 0.1],
              scale: [0.8, 1.4, 0.8],
              y: [-10, 10, -10],
            }}
            transition={{
              duration: 4.5 + (i % 3),
              delay: glint.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

      {/* Vignette Gradients */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#06090f] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0e17] to-transparent" />
    </div>
  );
}
