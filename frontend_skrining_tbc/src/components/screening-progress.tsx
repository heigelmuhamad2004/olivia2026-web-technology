"use client";

import React, { useRef, useState, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/shadcn-io/animated-beam";
import { usePathname } from "next/navigation";

/* Simple circle step node */
const Circle = React.forwardRef<HTMLDivElement, { active?: boolean; current?: boolean; children?: React.ReactNode }>(
  ({ active, current, children }, ref) => (
    <div
      ref={ref}
      className={cn(
        "z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 p-2 transition-all",
        active ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-300",
        current ? "ring-4 ring-blue-200" : ""
      )}
    >
      {children}
    </div>
  )
);
Circle.displayName = "Circle";

export default function ScreeningProgress() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stepRefs = [
    useRef<HTMLDivElement | null>(null),
    useRef<HTMLDivElement | null>(null),
    useRef<HTMLDivElement | null>(null),
    useRef<HTMLDivElement | null>(null),
  ];

  // map route ke step index (sesuaikan pathmu)
  const pathname = usePathname();
  const stepMap: Record<string, number> = {
    "/screening-data": 1,
    "/screening-kesehatan": 2,
    "/screening-suara": 3,
    "/hasil": 4,
  };
  const currentStep = stepMap[pathname] ?? 1;
  const steps = ["Biodata", "Cek Kesehatan", "Upload Suara", "Hasil"];

  // activeSegment berisi left (px) dan width (px) relatif pada container
  const [activeSegment, setActiveSegment] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    function update() {
      const cont = containerRef.current;
      const from = stepRefs[currentStep - 1]?.current ?? null;
      const to = stepRefs[currentStep]?.current ?? null;
      if (!cont || !from || !to) {
        setActiveSegment(null);
        return;
      }

      const cRect = cont.getBoundingClientRect();
      const fromRect = from.getBoundingClientRect();
      const toRect = to.getBoundingClientRect();

      // center X positions
      const fromCenter = fromRect.left + fromRect.width / 2;
      const toCenter = toRect.left + toRect.width / 2;

      // compute left and width relative to container
      const left = Math.min(fromCenter, toCenter) - cRect.left;
      const width = Math.max(8, Math.abs(toCenter - fromCenter)); // min width safeguard

      setActiveSegment({ left, width });
    }

    // initial
    update();

    // update on resize/scroll and when refs change
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    stepRefs.forEach((r) => r.current && ro.observe(r.current));
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [currentStep, pathname]); // recompute when step or route changes

  return (
    <>
      {/* keyframes untuk animasi inner beam (tidak butuh framer-motion) */}
      <style>{`
        @keyframes beamMove {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }
      `}</style>

      <div
        ref={containerRef}
        className="relative flex w-full max-w-3xl items-center justify-between px-6 py-6"
      >
        {/* step nodes */}
        {steps.map((label, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2">
            <Circle ref={stepRefs[idx]} active={idx + 1 <= currentStep} current={idx + 1 === currentStep}>
              {idx + 1}
            </Circle>
            <span className={cn("text-sm", idx + 1 <= currentStep ? "text-blue-600" : "text-gray-500")}>
              {label}
            </span>
          </div>
        ))}

        {/* completed animated beams (shadcn AnimatedBeam) */}
        {stepRefs.map((fromRef, idx) => {
          // render beams only for segments fully completed (i.e., idx < currentStep-1)
          if (idx >= currentStep - 1) return null;
          return (
            <AnimatedBeam
              key={idx}
              containerRef={containerRef}
              fromRef={fromRef}
              toRef={stepRefs[idx + 1]}
              duration={1.6}
            />
          );
        })}

        {/* active moving beam: a constrained overlay between fromCenter and toCenter */}
        {activeSegment && (
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: activeSegment.left,
              top: "50%",
              width: activeSegment.width,
              transform: "translateY(-50%)",
            }}
          >
            {/* track background (subtle) */}
            <div
              style={{
                position: "relative",
                height: 6,
                width: "100%",
                borderRadius: 999,
                background: "rgba(99,102,241,0.12)", // subtle track, can tune
                overflow: "hidden",
              }}
            >
              {/* moving gradient "wave" */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "-30%",
                  height: "100%",
                  width: "30%", // size of moving beam chunk
                  background:
                    "linear-gradient(90deg, rgba(59,130,246,1) 0%, rgba(59,130,246,0.5) 50%, rgba(59,130,246,0) 100%)",
                  animation: "beamMove 1.2s linear infinite",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
