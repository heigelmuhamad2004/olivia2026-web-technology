import {
  Stethoscope,
  Mic,
  ClipboardList,
  ShieldCheck,
  Hospital,
  BarChart3,
} from "lucide-react";
import React from "react";

const features = [
  {
    icon: Mic,
    title: "Deteksi Lewat Suara Batuk",
    description:
      "Cukup rekam suara batuk Anda, sistem akan menganalisis pola suara untuk mendeteksi kemungkinan TBC.",
  },
  {
    icon: ClipboardList,
    title: "Form Skrining Sederhana",
    description:
      "Isi form singkat tentang gejala yang Anda alami untuk mendukung hasil analisis yang lebih akurat.",
  },
  {
    icon: Stethoscope,
    title: "Cepat & Mudah",
    description:
      "Skrining bisa dilakukan kapan saja dan di mana saja tanpa perlu menunggu antrean panjang di fasilitas kesehatan.",
  },
  {
    icon: Hospital,
    title: "Rujukan Otomatis",
    description:
      "Jika terdeteksi gejala mencurigakan, Anda akan langsung mendapat rujukan ke puskesmas atau rumah sakit terdekat.",
  },
  {
    icon: ShieldCheck,
    title: "Privasi Terjamin",
    description:
      "Data Anda dijaga dengan aman dan hanya digunakan untuk keperluan skrining awal, sesuai standar privasi kesehatan.",
  },
  {
    icon: BarChart3,
    title: "Hasil Analisis Instan",
    description:
      "Dapatkan hasil skrining dalam hitungan detik lengkap dengan tingkat kemungkinan suspect TBC.",
  },
];

const Features01Page = () => {
  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div>
        <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-center">
          Skrining TBC Cepat & Mudah
        </h2>
        <p className="mt-4 text-center text-lg text-foreground/70 max-w-2xl mx-auto">
          Teknologi cerdas untuk membantu Anda mendeteksi gejala TBC sejak dini.
        </p>
        <div className="mt-10 sm:mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-(--breakpoint-lg) mx-auto px-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col border rounded-xl py-6 px-5 hover:shadow-lg transition"
            >
              <div className="mb-4 h-10 w-10 flex items-center justify-center bg-muted rounded-full">
                <feature.icon className="size-5" />
              </div>
              <span className="text-lg font-semibold">{feature.title}</span>
              <p className="mt-1 text-foreground/80 text-[15px]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features01Page;
