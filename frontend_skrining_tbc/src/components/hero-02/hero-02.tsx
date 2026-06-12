"use client"
import { Badge } from "@/components/ui/badge";
import BlurText from "@/components/ui/shadcn-io/blur-text";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from 'next/image'
import { Tiles } from "@/components/ui/tiles";
import React from "react";

const handleAnimationComplete = () => {
  console.log('Animation completed!');
}

const Hero02 = () => {
  return (
    <div className="relative min-h-[100svh] lg:min-h-[90vh] flex items-center justify-center overflow-hidden pt-24 md:pt-32 lg:pt-0">
      <div 
        className="absolute inset-0 h-full w-full"
        style={{ "--tile": "hsl(var(--primary) / 0.05)" } as React.CSSProperties}
      >
        <Tiles rows={40} cols={60} className="opacity-60" />
        
        {/* Gradien dari atas ke bawah sekitar 20% */}
        <div className="absolute top-0 inset-x-0 h-[20%] bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
        {/* Gradien dari bawah ke atas agar membaur dengan bagian konten di bawahnya */}
        <div className="absolute bottom-0 inset-x-0 h-[30%] bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
        {/* Gradien sisi kiri dan kanan agar tepian pola memudar */}
        <div className="absolute inset-y-0 left-0 w-[15%] bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-[15%] bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      </div>
      <div className="relative z-10 max-w-[1400px] w-full mx-auto grid lg:grid-cols-2 gap-12 px-6 sm:px-8 py-20">
        <div className="flex flex-col justify-center items-center lg:items-start text-center lg:text-left">
          <div className="font-mono text-xs sm:text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4 md:mb-6 mx-auto lg:mx-0">
            Platform Skrining AI
          </div>
          
          {/* Sentence-case and period-terminated heading */}
          <h1 className="max-w-[18ch] text-4xl md:text-5xl lg:text-[4rem] font-semibold leading-[1.1] tracking-[-0.03em] text-ink mx-auto lg:mx-0">
            <BlurText
              text="Skrining TBC cerdas dan instan dari rumah."
              delay={250}
              animateBy="words"
              direction="top"
              onAnimationComplete={handleAnimationComplete}
              className="text-ink"
            />
          </h1>
          
          <p className="mt-6 md:mt-8 max-w-[55ch] text-base md:text-lg font-normal text-body leading-relaxed mx-auto lg:mx-0 text-balance">
            Cukup rekam suara batuk dan isi formulir sederhana. Sistem cerdas kami akan menganalisis potensi TBC dalam hitungan detik 
            tanpa perlu mengantre di fasilitas kesehatan.
          </p>
          
          <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 w-full sm:w-auto">
            <Link 
              href="/user" 
              className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-full bg-primary px-8 text-[16px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Mulai Skrining Sekarang
            </Link>
            <Link 
              href="#panduan" 
              className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-full border border-border bg-card px-8 text-[16px] font-medium text-ink transition-colors hover:bg-muted"
            >
              Pelajari Lebih Lanjut
            </Link>
          </div>
        </div>
        
        <Image
          src="/lungs.png"
          alt="lungs healhty"
          width={500}
          height={500}
          className="mx-auto w-full max-w-[300px] sm:max-w-[400px] lg:max-w-[500px] h-auto object-contain drop-shadow-2xl animate-in fade-in zoom-in duration-1000 delay-300"
        />
      </div>
    </div>
  );
};

export default Hero02;
