import { type Transition, type Variants } from "framer-motion";

/**
 * Numismatic Futurism Motion Tokens
 * Standard ease curves and durations
 */
export const MOTION_TOKENS = {
  ease: {
    // Custom cubic-bezier: smooth, luxurious entrance with a crisp finish
    expoOut: [0.16, 1, 0.3, 1] as const,
    subtle: [0.25, 0.1, 0.25, 1] as const,
    anticipate: [0.38, 0.005, 0.215, 1] as const,
  },
  duration: {
    instant: 0.15,
    quick: 0.25,
    standard: 0.45,
    luxurious: 0.75,
    ambient: 3.5,
  },
} as const;

export const transitionFast: Transition = {
  duration: MOTION_TOKENS.duration.quick,
  ease: MOTION_TOKENS.ease.expoOut,
};

export const transitionStandard: Transition = {
  duration: MOTION_TOKENS.duration.standard,
  ease: MOTION_TOKENS.ease.expoOut,
};

export const transitionLuxurious: Transition = {
  duration: MOTION_TOKENS.duration.luxurious,
  ease: MOTION_TOKENS.ease.expoOut,
};

// Reusable Framer Motion Variants
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitionStandard,
  },
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitionLuxurious,
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

export const cardHoverVariants: Variants = {
  rest: {
    y: 0,
    scale: 1,
    boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.5)",
  },
  hover: {
    y: -6,
    scale: 1.01,
    boxShadow: "0px 20px 40px rgba(201, 162, 39, 0.12), 0 0 20px rgba(34, 211, 238, 0.08)",
    transition: transitionStandard,
  },
};

export const livePulseVariants: Variants = {
  initial: { scale: 1, opacity: 0.8 },
  animate: {
    scale: [1, 1.25, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};
