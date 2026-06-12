"use client"

import React, { useEffect, useState, useRef } from 'react'
import Hero02 from '@/components/hero-02/hero-02';
import Features01Page from '@/components/features-01/features-01';
import Testimonial04 from '@/components/testimonial-04/testimonial-04';
import RadialTechStack, { TechItem } from '@/components/ui/radial-tech-stack';
import { SiNextdotjs, SiTailwindcss, SiFlask, SiPython, SiTensorflow, SiMysql } from 'react-icons/si';
import { Tiles } from '@/components/ui/tiles';
import { Features9 } from '@/components/ui/features-9';

// Data Struktur Teknologi yang digunakan
const techStackData: TechItem[] = [
  {
    id: 1,
    title: "Next.js",
    category: "Frontend UI",
    description: "Framework React untuk membangun antarmuka web interaktif yang cepat, aman, dan sangat responsif.",
    icon: SiNextdotjs,
    relatedIds: [2, 3], // Terhubung ke Tailwind & Flask
    color: "#71717A", // Zinc 500 (Warna netral untuk Next.js)
  },
  {
    id: 2,
    title: "Tailwind CSS",
    category: "Styling",
    description: "Utility-first CSS framework untuk mendesain tampilan modern dengan dukungan penuh Light/Dark mode.",
    icon: SiTailwindcss,
    relatedIds: [1],
    color: "#06B6D4", // Cyan 500 (Tailwind Blue)
  },
  {
    id: 3,
    title: "Flask API",
    category: "Backend Bridge",
    description: "Micro-framework Python yang ringan dan tangguh untuk menghubungkan aplikasi web dengan model AI.",
    icon: SiFlask,
    relatedIds: [1, 4, 6], // Terhubung ke Next.js, Python Core, & MySQL
    color: "#3B82F6", // Blue 500
  },
  {
    id: 4,
    title: "Python",
    category: "Core Engine",
    description: "Bahasa pemrograman utama yang menjalankan logika komputasi kompleks, pemrosesan sinyal audio, dan pengolahan data AI.",
    icon: SiPython,
    relatedIds: [3, 5],
    color: "#3776AB", // Python Blue
  },
  {
    id: 5,
    title: "TensorFlow",
    category: "Deep Learning (CNN & DenseNet)",
    description: "Library Machine Learning andalan untuk memproses gambar spektrogram suara batuk dan memprediksi potensi TBC secara akurat.",
    icon: SiTensorflow,
    relatedIds: [4],
    color: "#FF6F00", // TensorFlow Orange
  },
  {
    id: 6,
    title: "MySQL",
    category: "Database",
    description: "Sistem manajemen basis data relasional untuk menyimpan rekam medis dan riwayat komparasi skrining pasien secara persisten.",
    icon: SiMysql,
    relatedIds: [3],
    color: "#4479A1", // MySQL Blue
  },
];

// Komponen pembungkus untuk animasi saat elemen masuk ke viewport (Scroll Reveal)
function ScrollReveal({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function Page() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Memicu animasi transisi saat komponen pertama kali dirender di client
    setIsMounted(true);
  }, []);

  return (
    <div 
      className={`flex flex-col w-full min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground transition-all duration-1000 ease-out ${
        isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Hero Band - Level 0 Flat (Canvas-soft / Background) */}
      <section className="w-full">
        <ScrollReveal>
          <Hero02 />
        </ScrollReveal>
      </section>

      {/* TBC Stats Band - Bento Grid */}
      <ScrollReveal>
        <Features9 />
      </ScrollReveal>

      {/* Feature Band - White Surface (Canvas / Card) with Hairline Borders */}
      <section className="w-full bg-card border-b border-border py-16 md:py-24 lg:py-32 flex justify-center">
        <div className="w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <Features01Page />
          </ScrollReveal>
        </div>
      </section>

      {/* Tech Stack Band - Radial Orbit */}
      <section className="relative w-full bg-background border-b border-border py-5 md:py-24 lg:py-32 flex justify-center">
        {/* Background Tiles Container */}
        <div 
          className="absolute inset-0 h-full w-full overflow-hidden"
          style={{ "--tile": "hsl(var(--primary) / 0.05)" } as React.CSSProperties}
        >
          <Tiles rows={30} cols={60} className="opacity-40" />
          {/* Gradien sisi untuk masking */}
          <div className="absolute top-0 inset-x-0 h-[20%] bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 h-[30%] bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 left-0 w-[15%] bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-[15%] bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        </div>

        <div className="relative z-50 w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center md:mb-12">
            <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground mb-4">
              Infrastruktur Teknologi
            </p>
            <h2 className="text-3xl md:text-[2.5rem] font-semibold tracking-[-0.03em] text-foreground leading-tight">
              Mendukung Analisis Suara Real-Time.
            </h2>
          </ScrollReveal>
          <RadialTechStack techData={techStackData} />
        </div>
      </section>

      {/* Testimonial Band - Soft Surface (Canvas-soft / Background) */}
      <section className="w-full bg-background py-16 md:py-24 lg:py-32 flex justify-center">
        <div className="w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <Testimonial04 />
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
