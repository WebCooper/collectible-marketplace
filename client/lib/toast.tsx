"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Tone = "success" | "error" | "info";
interface Toast {
  id: number;
  tone: Tone;
  text: string;
}

const ToastContext = createContext<(text: string, tone?: Tone) => void>(
  () => {},
);

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((text: string, tone: Tone = "success") => {
    const id = nextId++;
    setToasts((t) => [...t, { id, tone, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const tones: Record<Tone, string> = {
    success: "border-emerald-200 bg-white text-emerald-800",
    error: "border-rose-200 bg-white text-rose-700",
    info: "border-sky-200 bg-white text-sky-800",
  };
  const dots: Record<Tone, string> = {
    success: "bg-emerald-500",
    error: "bg-rose-500",
    info: "bg-sky-500",
  };

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`animate-slide-in pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${tones[t.tone]}`}
          >
            <span className={`mt-1.5 size-2 shrink-0 rounded-full ${dots[t.tone]}`} />
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
