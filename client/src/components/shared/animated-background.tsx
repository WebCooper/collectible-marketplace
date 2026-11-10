"use client";

import React from "react";

interface AnimatedBackgroundProps {
  intensity?: "subtle" | "vibrant";
  showGlints?: boolean;
}

/**
 * Page canvas for the light theme. The previous ambient glow/particle effects
 * don't belong on a white auction-house layout, so this now renders a plain
 * fixed background. Props are kept so existing call sites keep compiling.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AnimatedBackground(_props: AnimatedBackgroundProps) {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none select-none bg-background"
    />
  );
}
