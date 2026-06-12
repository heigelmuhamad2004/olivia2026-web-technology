import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Marquee } from "@/components/ui/marquee";
import Link from "next/link";
import React, { ComponentProps } from "react";

const testimonials = [
  {
    id: 1,
    name: "Andi Pratama",
    designation: "Mahasiswa",
    company: "Surakarta",
    testimonial:
      "Awalnya ragu, tapi hasil skrining cepat dan jelas. Membantu tahu langkah selanjutnya tanpa harus ke RS.",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: 2,
    name: "Siti Aisyah",
    designation: "Ibu Rumah Tangga",
    company: "Madiun",
    testimonial:
      "Bisa cek kesehatan paru dari rumah dan dapat rekomendasi ke puskesmas. Praktis sekali!",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
  },
  {
    id: 3,
    name: "Rizky Kurniawan",
    designation: "Karyawan Swasta",
    company: "Solo",
    testimonial:
      "Fitur rekam batuknya keren, hanya hitungan detik hasil skrining keluar.",
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
  },
  {
    id: 4,
    name: "Dewi Lestari",
    designation: "Guru",
    company: "Ngawi",
    testimonial:
      "Sebagai guru, skrining ini membuat saya lebih waspada menjaga kesehatan diri dan sekitar.",
    avatar: "https://randomuser.me/api/portraits/women/29.jpg",
  },
  {
    id: 5,
    name: "Budi Santoso",
    designation: "Petani",
    company: "Magetan",
    testimonial:
      "Alhamdulillah, ada layanan ini. Hasil cepat tanpa harus jauh-jauh ke rumah sakit.",
    avatar: "https://randomuser.me/api/portraits/men/76.jpg",
  },
  {
    id: 6,
    name: "Lina Marlina",
    designation: "Pelajar",
    company: "Sragen",
    testimonial:
      "Sangat membantu untuk deteksi awal, cukup rekam batuk dan hasil langsung muncul.",
    avatar: "https://randomuser.me/api/portraits/women/21.jpg",
  },
];



const Testimonial04 = () => (
  <div className="w-full flex justify-center items-center">
    <div className="h-full w-full">
      <p className="font-mono text-sm uppercase tracking-widest text-center text-muted-foreground mb-4">
        Dampak Nyata
      </p>
      <h2 className="text-3xl md:text-[2.5rem] font-semibold tracking-[-0.03em] text-center text-ink px-6 leading-tight">
        Pengalaman dari pengguna kami.
      </h2>
      <p className="mt-4 text-center text-body text-lg max-w-2xl mx-auto">
        Ribuan masyarakat telah terbantu untuk mengidentifikasi potensi TBC sejak dini melalui platform kami.
      </p>
      
      <div className="mt-16 relative">
        <div className="z-10 absolute left-0 inset-y-0 w-[15%] bg-linear-to-r from-background to-transparent" />
        <div className="z-10 absolute right-0 inset-y-0 w-[15%] bg-linear-to-l from-background to-transparent" />
        <Marquee pauseOnHover className="[--duration:20s]">
          <TestimonialList />
        </Marquee>
        <Marquee pauseOnHover reverse className="mt-0 [--duration:20s]">
          <TestimonialList />
        </Marquee>
      </div>
    </div>
  </div>
);

const TestimonialList = () =>
  testimonials.map((testimonial) => (
    <div
      key={testimonial.id}
      className="w-[85vw] sm:w-96 sm:min-w-96 max-w-sm bg-card border border-border rounded-lg p-6 shadow-[0px_1px_1px_#00000005,0px_2px_2px_#0000000a] mx-2 shrink-0"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarFallback className="text-xl font-medium bg-black text-primary-foreground">
              {testimonial.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-md font-semibold text-ink">{testimonial.name}</p>
            <p className="text-sm text-body">{testimonial.designation}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" asChild>
          <Link href="#" target="_blank">
            <TwitterLogo className="w-4 h-4" />
          </Link>
        </Button>
      </div>
      <p className="mt-6 text-[15px] text-body leading-relaxed font-normal">{testimonial.testimonial}</p>
    </div>
  ));

const TwitterLogo = (props: ComponentProps<"svg">) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <title>X</title>
    <path
      fill="currentColor"
      d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
    />
  </svg>
);

export default Testimonial04;
