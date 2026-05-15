"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"

interface SplitTextProps {
  text: string
  delay?: number
  duration?: number
}

export default function SplitText({
  text,
  delay = 0.05,
  duration = 0.3,
}: SplitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      const chars = containerRef.current.querySelectorAll("span")
      gsap.fromTo(
        chars,
        { y: "100%", opacity: 0 },
        {
          y: "0%",
          opacity: 1,
          stagger: delay,
          duration,
          ease: "power3.out",
        }
      )
    }
  }, [text, delay, duration])

  return (
    <div
      ref={containerRef}
      className="flex overflow-hidden text-4xl font-bold space-x-1"
    >
      {text.split("").map((char, i) => (
        <span key={i} className="inline-block translate-y-full">
          {char}
        </span>
      ))}
    </div>
  )
}
