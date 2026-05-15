"use client"
import { Badge } from "@/components/ui/badge";
import BlurText from "@/components/ui/shadcn-io/blur-text";
import { LiquidButton } from '@/components/ui/shadcn-io/liquid-button';
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from 'next/image'
import React from "react";

const handleAnimationComplete = () => {
  console.log('Animation completed!');
}

const Hero02 = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-(--breakpoint-xl) w-full mx-auto grid lg:grid-cols-2 gap-10 px-9 py-12">
        <div>
          <h1 className="mt-7 max-w-[17ch] text-3xl md:text-5xl lg:text-[3.75rem] xl:text-[4.5rem] font-semibold leading-[1.2]! tracking-tighter">
            <BlurText
              text="Screening TBC Cepat dan Mudah Dari Rumah"
              delay={250}
              animateBy="words"
              direction="top"
              onAnimationComplete={handleAnimationComplete}
              className="text-6xlxl font-bold"
            />
          </h1>
          <p className="mt-6 max-w-[60ch] sm:text-lg">
            Cukup dengan merekam suara batuk Anda dan mengisi form sederhana, sistem kami akan membantu melakukan skrining awal TBC secara otomatis.
            Teknologi ini dirancang agar siapa pun dapat melakukan pengecekan mandiri, kapan saja dan di mana saja, tanpa harus menunggu lama di fasilitas kesehatan.
          </p>
          <Link href="/user" className="mt-12 flex items-center">
            <LiquidButton variant="default" size="lg" className="rounded-full text-black">
              Mulai Screening Sekarang
            </LiquidButton>
          </Link>
        </div>
        <Image
          src="/lungs.png"
          alt="lungs healhty"
          width={500}
          height={500}
          className="flex items-center justify-center"
        />
      </div>
    </div>
  );
};

export default Hero02;
