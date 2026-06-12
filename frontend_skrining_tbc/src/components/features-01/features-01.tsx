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
    <div className="w-full">
      <div className="mx-auto max-w-5xl space-y-8 md:space-y-16">
        <div className="relative z-10 mx-auto max-w-2xl space-y-4 text-center md:space-y-6">
          <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
            Fitur Platform
          </p>
          <h2 className="text-balance text-3xl font-medium md:text-4xl lg:text-5xl text-foreground">
            Teknologi cerdas untuk deteksi dini.
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            Infrastruktur digital kami dirancang untuk mempermudah akses kesehatan dengan analisis yang cepat, privat, dan terhubung langsung ke fasilitas medis.
          </p>
        </div>

        <div className="relative mx-auto grid max-w-2xl lg:max-w-5xl divide-x divide-y divide-border border border-border *:p-8 md:*:p-12 sm:grid-cols-2 lg:grid-cols-3 bg-card">
          {features.map((feature) => (
            <div key={feature.title} className="space-y-3">
              <div className="flex items-center gap-2">
                <feature.icon className="size-5 text-primary" />
                <h3 className="text-base font-medium text-foreground">{feature.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
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
