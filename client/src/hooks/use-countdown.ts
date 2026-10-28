"use client";

import { useEffect, useState } from "react";
import { getTimeRemaining } from "@/lib/utils";

export function useCountdown(endsAt: string) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(endsAt));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeRemaining(endsAt);
      setTimeLeft(remaining);
      if (remaining.isEnded) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endsAt]);

  return timeLeft;
}
