"use client";

import React, { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  Variants,
} from "framer-motion";
import {
  ShieldCheck,
  Lock,
  BadgeCheck,
  ArrowRight,
  Sparkles,
  ChevronDown,
} from "lucide-react";

import { AnimatedBackground } from "@/components/shared/animated-background";
import { Button } from "@/components/ui/button";
import {
  MOTION_TOKENS,
  staggerContainer,
} from "@/lib/motion";

// ---------------------------------------------------------------------------
// Motion variant factories — collapsed to zero motion when user prefers it
// ---------------------------------------------------------------------------
function makeSlideUp(shouldReduce: boolean): Variants {
  if (shouldReduce) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.3 } },
    };
  }
  return {
    hidden: { opacity: 0, y: 28, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: MOTION_TOKENS.duration.luxurious,
        ease: MOTION_TOKENS.ease.expoOut,
      },
    },
  };
}

function makeHeroContainer(shouldReduce: boolean): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduce ? 0 : 0.13,
        delayChildren: shouldReduce ? 0 : 0.1,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Collectible card data — placeholder items shown in the visual centerpiece
// ---------------------------------------------------------------------------
const COLLECTIBLES = [
  {
    id: "coin-1",
    label: "1957 Buddha Jayanthi Crown",
    sublabel: "0.925 Silver · PCGS MS-66 PL",
    emoji: "🪙",
    accent: "from-[#c9a227]/30 to-[#f1d27a]/10",
    border: "border-[#c9a227]/40",
    glow: "shadow-[0_0_32px_rgba(201,162,39,0.35)]",
    rotate: -8,
    offsetX: -120,
    offsetY: -30,
    delay: 0,
    floatAmp: 10,
    floatDur: 5.8,
  },
  {
    id: "note-1",
    label: "King George VI 1000 Rupees",
    sublabel: "1941 Ceylon · PMG UNC 64 EPQ",
    emoji: "💵",
    accent: "from-emerald-500/20 to-teal-400/10",
    border: "border-emerald-400/30",
    glow: "shadow-[0_0_32px_rgba(52,211,153,0.22)]",
    rotate: 4,
    offsetX: 120,
    offsetY: -50,
    delay: 0.4,
    floatAmp: 13,
    floatDur: 6.5,
  },
  {
    id: "stamp-1",
    label: "1857 Chalon Head 6d",
    sublabel: "Ceylon Imperf · Spink Superb 95",
    emoji: "✉️",
    accent: "from-indigo-500/20 to-blue-400/10",
    border: "border-indigo-400/30",
    glow: "shadow-[0_0_28px_rgba(99,102,241,0.22)]",
    rotate: 12,
    offsetX: 40,
    offsetY: 80,
    delay: 0.75,
    floatAmp: 8,
    floatDur: 7.1,
  },
  {
    id: "medal-1",
    label: "1948 Independence Medal",
    sublabel: "Ceylon Police · Original Ribbon",
    emoji: "🏅",
    accent: "from-rose-500/20 to-amber-400/10",
    border: "border-rose-400/30",
    glow: "shadow-[0_0_26px_rgba(244,63,94,0.18)]",
    rotate: -5,
    offsetX: -60,
    offsetY: 90,
    delay: 1.05,
    floatAmp: 11,
    floatDur: 6.2,
  },
];

// ---------------------------------------------------------------------------
// Trust indicators
// ---------------------------------------------------------------------------
const TRUST_ITEMS = [
  {
    icon: BadgeCheck,
    title: "Verified Sellers",
    desc: "Every dealer is KYC-cleared by our Colombo curatorial board.",
    color: "text-[#f1d27a]",
    glow: "shadow-[0_0_20px_rgba(201,162,39,0.2)]",
    border: "border-[rgba(201,162,39,0.25)]",
  },
  {
    icon: Lock,
    title: "Secure Escrow",
    desc: "All funds held in CB-regulated commercial bank escrow until delivery.",
    color: "text-cyan-400",
    glow: "shadow-[0_0_20px_rgba(34,211,238,0.18)]",
    border: "border-cyan-400/25",
  },
  {
    icon: ShieldCheck,
    title: "Certified Authenticity",
    desc: "PCGS · NGC · PMG · SLNS spectral analysis on every lot.",
    color: "text-emerald-400",
    glow: "shadow-[0_0_20px_rgba(52,211,153,0.18)]",
    border: "border-emerald-400/25",
  },
];

// ---------------------------------------------------------------------------
// Floating collectible card sub-component
// ---------------------------------------------------------------------------
interface FloatCardProps {
  item: (typeof COLLECTIBLES)[number];
  shouldReduce: boolean;
}

function FloatCard({ item, shouldReduce }: FloatCardProps) {
  if (shouldReduce) {
    return (
      <div
        key={item.id}
        style={{ transform: `rotate(${item.rotate}deg)` }}
        className={`
          absolute w-44 rounded-2xl border ${item.border}
          bg-gradient-to-br ${item.accent}
          backdrop-blur-xl p-4 ${item.glow}
          flex flex-col gap-2
        `}
      >
        <span className="text-4xl">{item.emoji}</span>
        <p className="text-xs font-bold text-white font-serif leading-tight">
          {item.label}
        </p>
        <p className="text-[10px] text-zinc-400 font-mono">{item.sublabel}</p>
      </div>
    );
  }

  return (
    <motion.div
      key={item.id}
      className={`
        absolute w-44 rounded-2xl border ${item.border}
        bg-gradient-to-br ${item.accent}
        backdrop-blur-xl p-4 ${item.glow}
        flex flex-col gap-2 cursor-pointer select-none
      `}
      style={{ rotate: item.rotate }}
      initial={{ opacity: 0, scale: 0.75, y: 20 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -item.floatAmp, 0],
        transition: {
          opacity: {
            delay: item.delay,
            duration: 0.6,
            ease: MOTION_TOKENS.ease.expoOut,
          },
          scale: {
            delay: item.delay,
            duration: 0.6,
            ease: MOTION_TOKENS.ease.expoOut,
          },
          y: {
            delay: item.delay + 0.5,
            duration: item.floatDur,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          },
        },
      }}
      whileHover={{ scale: 1.07, zIndex: 20, transition: { duration: 0.2 } }}
    >
      <span className="text-4xl">{item.emoji}</span>
      <p className="text-xs font-bold text-white font-serif leading-tight">
        {item.label}
      </p>
      <p className="text-[10px] text-zinc-400 font-mono">{item.sublabel}</p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main HeroSection
// ---------------------------------------------------------------------------
export function HeroSection() {
  const shouldReduce = useReducedMotion() ?? false;

  // Parallax scroll hook — the showcase shifts upward slightly as user scrolls
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const showcaseY = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduce ? [0, 0] : [0, -60]
  );

  // Variant factories
  const slideUp = makeSlideUp(shouldReduce);
  const containerVariants = makeHeroContainer(shouldReduce);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8"
      aria-label="LankaNumis hero — Sri Lankan collectibles marketplace"
    >
      {/* Ambient animated background lives in fixed position */}
      <AnimatedBackground intensity="vibrant" showGlints />

      {/* ------------------------------------------------------------------ */}
      {/* Main content grid                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center pt-20 pb-24 lg:pt-28 lg:pb-32">

        {/* ---- LEFT: Text + CTAs ----------------------------------------- */}
        <motion.div
          className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-7"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Eye-catcher tag */}
          <motion.div variants={slideUp}>
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[rgba(201,162,39,0.4)] bg-[#101726]/90 backdrop-blur-sm text-xs font-mono text-[#f1d27a]">
              <Sparkles
                className="h-4 w-4 text-[#c9a227]"
                style={
                  shouldReduce
                    ? {}
                    : { animation: "spin 9s linear infinite" }
                }
              />
              <span>Sri Lanka&apos;s Premier Certified Bourse</span>
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-zinc-400">SLNS · PCGS · NGC · PMG</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={slideUp}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white font-serif leading-[1.1]"
          >
            Discover, Bid &amp; Preserve{" "}
            <span className="gold-gradient-text decoration-wavy underline decoration-[#c9a227]/40 decoration-2">
              2,300 Years
            </span>{" "}
            of Lankan Heritage
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            variants={slideUp}
            className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-xl font-light"
          >
            Authenticated coins, historic currency notes, Ceylon stamps &amp; state medals — every lot spectral-verified and sold under Central Bank–regulated escrow. Buy and sell with absolute confidence.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={slideUp}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 w-full sm:w-auto"
          >
            {/* Primary — gold gradient */}
            <a href="#featured" className="w-full sm:w-auto">
              <Button
                variant="gold"
                size="lg"
                className="w-full sm:w-auto text-xs uppercase tracking-widest px-8 gap-2.5 shadow-xl shadow-[#c9a227]/25 font-mono"
              >
                <span>Explore Listings</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>

            {/* Secondary — outline / ghost */}
            <Link href="/signup" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-xs uppercase tracking-widest px-7 font-mono border-[rgba(201,162,39,0.35)] hover:border-[#c9a227] hover:text-[#f1d27a]"
              >
                Start Selling
              </Button>
            </Link>
          </motion.div>

          {/* Mini social proof numbers */}
          <motion.div
            variants={slideUp}
            className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-2 text-center"
          >
            {[
              { value: "6,800+", label: "Collectors" },
              { value: "රු 385M+", label: "Transacted" },
              { value: "18,400+", label: "Certified Lots" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center lg:items-start">
                <span className="text-xl font-extrabold font-mono text-[#f1d27a] leading-tight">
                  {value}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
                  {label}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ---- RIGHT: Floating visual showcase ----------------------------- */}
        <motion.div
          className="relative hidden lg:flex items-center justify-center"
          style={{ y: showcaseY }}
          initial={shouldReduce ? {} : { opacity: 0 }}
          animate={shouldReduce ? {} : { opacity: 1, transition: { duration: 0.5 } }}
        >
          {/* Central glowing orb */}
          <div className="relative h-[380px] w-[380px]">
            {/* Gold ambient orb */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#c9a227]/25 via-[#f1d27a]/10 to-transparent blur-3xl" />
            {/* Cyan auction halo */}
            <div className="absolute inset-4 rounded-full border border-dashed border-cyan-400/20 animate-spin" style={{ animationDuration: "30s" }} />
            {/* Inner gold ring */}
            <div className="absolute inset-10 rounded-full border border-[#c9a227]/30" />

            {/* Central coin placeholder */}
            {shouldReduce ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-32 w-32 rounded-full bg-gradient-to-br from-[#c9a227] to-[#f1d27a] flex items-center justify-center shadow-2xl shadow-[#c9a227]/40 border-4 border-[#f1d27a]/30">
                  <span className="text-6xl">🪙</span>
                </div>
              </div>
            ) : (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.div
                  className="h-36 w-36 rounded-full bg-gradient-to-br from-[#c9a227] via-[#e2be49] to-[#f1d27a] flex items-center justify-center border-4 border-[#f1d27a]/40"
                  style={{
                    boxShadow:
                      "0 0 60px rgba(201,162,39,0.5), 0 0 120px rgba(201,162,39,0.25), inset 0 2px 4px rgba(255,255,255,0.3)",
                  }}
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span className="text-7xl select-none">🪙</span>
                </motion.div>
              </motion.div>
            )}

            {/* Orbiting collectible cards */}
            {COLLECTIBLES.map((item) => (
              <div
                key={item.id}
                className="absolute"
                style={{
                  top: "50%",
                  left: "50%",
                  marginTop: item.offsetY,
                  marginLeft: item.offsetX,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <FloatCard item={item} shouldReduce={shouldReduce} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Scroll hint                                                           */}
      {/* -------------------------------------------------------------------- */}
      {!shouldReduce && (
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 text-zinc-500"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.6 }}
        >
          <span className="text-[10px] uppercase tracking-widest font-mono">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </motion.div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Trust indicators — whileInView, mobile-stacked, desktop row          */}
      {/* -------------------------------------------------------------------- */}
      <div className="absolute bottom-0 inset-x-0 z-10">
        {/* Gradient fade into the trust bar */}
        <div className="h-32 w-full bg-gradient-to-t from-[#0a0e17] via-[#0a0e17]/70 to-transparent pointer-events-none" />

        <motion.div
          className="bg-[#0a0e17]/95 border-t border-[rgba(201,162,39,0.2)] backdrop-blur-xl"
          initial={shouldReduce ? {} : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={
            shouldReduce
              ? { duration: 0.2 }
              : {
                  duration: MOTION_TOKENS.duration.standard,
                  ease: MOTION_TOKENS.ease.expoOut,
                }
          }
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8 lg:gap-12"
              variants={shouldReduce ? {} : staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
            >
              {TRUST_ITEMS.map(({ icon: Icon, title, desc, color, glow, border }) => (
                <motion.div
                  key={title}
                  variants={
                    shouldReduce
                      ? {}
                      : {
                          hidden: { opacity: 0, y: 16 },
                          visible: {
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: MOTION_TOKENS.duration.standard,
                              ease: MOTION_TOKENS.ease.expoOut,
                            },
                          },
                        }
                  }
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border ${border} bg-white/[0.025] ${glow} transition-all duration-300 hover:bg-white/[0.04]`}
                >
                  {/* Icon badge */}
                  <div
                    className={`mt-0.5 h-9 w-9 flex-shrink-0 rounded-xl flex items-center justify-center ${color} bg-white/5 border ${border}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>

                  <div className="min-w-0">
                    <p className={`text-sm font-bold font-serif ${color}`}>{title}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-400 leading-relaxed font-sans">
                      {desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
