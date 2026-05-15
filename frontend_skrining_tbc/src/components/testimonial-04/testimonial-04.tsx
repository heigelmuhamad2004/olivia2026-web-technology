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
  <div className="min-h-screen flex justify-center items-center py-12">
    <div className="h-full w-full">
      <h2 className="text-5xl font-semibold text-center tracking-[-0.03em] px-6 text-pretty">
        Testimoni Pengguna
      </h2>
      <p className="mt-3 text-center text-muted-foreground text-xl">
        Pengalaman beberapa orang yang pernah melakukan screening di web TBCeck
      </p>
      <div className="mt-14 relative">
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
      className="min-w-96 max-w-sm bg-accent rounded-xl p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarFallback className="text-xl font-medium bg-black text-primary-foreground">
              {testimonial.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{testimonial.name}</p>
            <p className="text-sm text-gray-500">{testimonial.designation}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" asChild>
          <Link href="#" target="_blank">
            <TwitterLogo className="w-4 h-4" />
          </Link>
        </Button>
      </div>
      <p className="mt-5 text-[17px]">{testimonial.testimonial}</p>
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
