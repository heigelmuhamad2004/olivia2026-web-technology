// src/components/navbar-public.tsx
"use client";

import CardNav, { CardNavItem } from "@/components/ui/reactbits/CardNav";

export default function NavbarPublic() {
  
  // Data Menu (Sesuaikan dengan kebutuhanmu)
  const navItems: CardNavItem[] = [
    {
      label: "Aplikasi",
      bgColor: "#0D0716", // Warna Hitam Kebiruan
      textColor: "#fff",
      links: [
        { label: "Login", href: "/auth/login", ariaLabel: "Login User" },
        { label: "Register", href: "/auth/register", ariaLabel: "Daftar Baru" }
      ]
    },
    {
      label: "Informasi",
      bgColor: "#170D27", // Warna Ungu Gelap
      textColor: "#fff",
      links: [
        { label: "Tentang TBC", href: "/#about", ariaLabel: "Apa itu TBC" },
        { label: "Gejala", href: "/#gejala", ariaLabel: "Gejala TBC" }
      ]
    },
    {
      label: "Bantuan",
      bgColor: "#271E37", // Warna Ungu Terang
      textColor: "#fff",
      links: [
        { label: "Kontak Puskesmas", href: "/#contact", ariaLabel: "Hubungi Kami" },
        { label: "Panduan", href: "/faq", ariaLabel: "FAQ" }
      ]
    }
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <CardNav
        // Pastikan kamu taruh file logo di folder 'public/images/logo.png'
        // Atau ganti string ini dengan URL gambar placeholder
        logo="/TBCheck64.svg"
        logoAlt="Logo Aplikasi Skrining TB"
        items={navItems}
        baseColor="#ffffff"
        menuColor="#000000"
        buttonBgColor="#000000"
        buttonTextColor="#ffffff"
      />
      
    </div>
  );
}