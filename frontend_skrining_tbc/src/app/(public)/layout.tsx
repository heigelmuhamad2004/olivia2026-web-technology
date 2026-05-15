import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer05Page from "@/components/footer-05/footer-05";
import NavbarPublic from "@/components/navbar-public";
import { Footer } from "@/components/footer";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TB Screening App",
  description: "Aplikasi Skrining TB",
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <NavbarPublic />
      <main>{children}</main>
      <Footer/>
    </>
  );
}