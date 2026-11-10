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
import { ShieldCheck, Lock, BadgeCheck, ArrowRight } from "lucide-react";

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
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: MOTION_TOKENS.duration.standard,
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
        staggerChildren: shouldReduce ? 0 : 0.08,
        delayChildren: shouldReduce ? 0 : 0.05,
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
    delay: 0.15,
  },
  {
    id: "note-1",
    label: "King George VI 1000 Rupees",
    sublabel: "1941 Ceylon · PMG UNC 64 EPQ",
    emoji: "💵",
    delay: 0.25,
  },
  {
    id: "stamp-1",
    label: "1857 Chalon Head 6d",
    sublabel: "Ceylon Imperf · Spink Superb 95",
    emoji: "✉️",
    delay: 0.35,
  },
  {
    id: "medal-1",
    label: "1948 Independence Medal",
    sublabel: "Ceylon Police · Original Ribbon",
    emoji: "🏅",
    delay: 0.45,
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
  },
  {
    icon: Lock,
    title: "Secure Escrow",
    desc: "All funds held in CB-regulated commercial bank escrow until delivery.",
  },
  {
    icon: ShieldCheck,
    title: "Certified Authenticity",
    desc: "PCGS · NGC · PMG · SLNS spectral analysis on every lot.",
  },
];

// ---------------------------------------------------------------------------
// Showcase tile sub-component
// ---------------------------------------------------------------------------
interface ShowcaseTileProps {
  item: (typeof COLLECTIBLES)[number];
  shouldReduce: boolean;
}

const TILE_CLASS =
  "flex flex-col gap-3 rounded-md border border-line bg-white p-4 transition-colors duration-150 hover:border-ink";

function ShowcaseTile({ item, shouldReduce }: ShowcaseTileProps) {
  const content = (
    <>
      <div className="flex aspect-[4/3] items-center justify-center rounded-sm bg-surface">
        <span className="text-5xl select-none" aria-hidden="true">
          {item.emoji}
        </span>
      </div>
      <div className="space-y-1">
        <p className="font-serif text-sm font-semibold leading-snug text-ink">
          {item.label}
        </p>
        <p className="text-xs text-muted-foreground">{item.sublabel}</p>
      </div>
    </>
  );

  if (shouldReduce) {
    return <div className={TILE_CLASS}>{content}</div>;
  }

  return (
    <motion.div
      className={TILE_CLASS}
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: {
          delay: item.delay,
          duration: MOTION_TOKENS.duration.standard,
          ease: MOTION_TOKENS.ease.expoOut,
        },
      }}
    >
      {content}
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
    shouldReduce ? [0, 0] : [0, -24]
  );

  // Variant factories
  const slideUp = makeSlideUp(shouldReduce);
  const containerVariants = makeHeroContainer(shouldReduce);

  return (
    <section
      ref={heroRef}
      className="relative bg-white border-b border-line"
      aria-label="LankaNumis hero — Sri Lankan collectibles marketplace"
    >
      {/* ------------------------------------------------------------------ */}
      {/* Main content grid                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center py-16 md:py-24">

        {/* ---- LEFT: Text + CTAs ----------------------------------------- */}
        <motion.div
          className="lg:col-span-7 flex flex-col items-start text-left space-y-7"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Eye-catcher tag */}
          <motion.div variants={slideUp}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="eyebrow">Sri Lanka&apos;s Premier Certified Bourse</span>
              <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                SLNS · PCGS · NGC · PMG
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={slideUp}
            className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-ink font-serif leading-[1.08]"
          >
            Discover, Bid &amp; Preserve{" "}
            <span className="italic text-brass">
              2,300 Years
            </span>{" "}
            of Lankan Heritage
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            variants={slideUp}
            className="text-base sm:text-lg text-ink-soft leading-relaxed max-w-xl"
          >
            Authenticated coins, historic currency notes, Ceylon stamps &amp; state medals — every lot spectral-verified and sold under Central Bank–regulated escrow. Buy and sell with absolute confidence.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={slideUp}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto"
          >
            {/* Primary — solid ink */}
            <a href="#featured" className="w-full sm:w-auto">
              <Button
                variant="gold"
                size="lg"
                className="w-full sm:w-auto px-8 gap-2"
              >
                <span>Explore Listings</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>

            {/* Secondary — outline */}
            <Link href="/signup" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto px-7"
              >
                Start Selling
              </Button>
            </Link>
          </motion.div>

          {/* Mini social proof numbers */}
          <motion.div
            variants={slideUp}
            className="flex flex-wrap items-start gap-x-10 gap-y-4 pt-6 border-t border-line w-full"
          >
            {[
              { value: "6,800+", label: "Collectors" },
              { value: "රු 385M+", label: "Transacted" },
              { value: "18,400+", label: "Certified Lots" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-start">
                <span className="font-serif text-2xl font-semibold tabular-nums text-ink leading-tight">
                  {value}
                </span>
                <span className="text-xs text-muted-foreground">
                  {label}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ---- RIGHT: Visual showcase ------------------------------------- */}
        <motion.div
          className="relative hidden lg:block lg:col-span-5"
          style={{ y: showcaseY }}
          initial={shouldReduce ? {} : { opacity: 0 }}
          animate={shouldReduce ? {} : { opacity: 1, transition: { duration: 0.4 } }}
        >
          <div className="rounded-lg border border-line bg-surface p-4">
            <div className="grid grid-cols-2 gap-4">
              {COLLECTIBLES.map((item) => (
                <ShowcaseTile key={item.id} item={item} shouldReduce={shouldReduce} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Trust indicators — whileInView, mobile-stacked, desktop row          */}
      {/* -------------------------------------------------------------------- */}
      <motion.div
        className="bg-surface border-t border-line"
        initial={shouldReduce ? {} : { opacity: 0, y: 8 }}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 sm:divide-x sm:divide-line"
            variants={shouldReduce ? {} : staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
          >
            {TRUST_ITEMS.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                variants={
                  shouldReduce
                    ? {}
                    : {
                        hidden: { opacity: 0, y: 8 },
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
                className="flex items-start gap-3.5 sm:px-6 sm:first:pl-0 sm:last:pr-0"
              >
                {/* Icon */}
                <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-brass" aria-hidden="true" />

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{title}</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
