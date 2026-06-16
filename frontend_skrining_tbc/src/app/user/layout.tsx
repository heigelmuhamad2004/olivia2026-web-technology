import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer05Page from "@/components/footer-05/footer-05";
import { Navbar02 } from "@/components/ui/shadcn-io/navbar-public";
import { Footer } from "@/components/footer";
import { Toaster } from "sonner";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div lang="en">
      <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Navbar02/>
        <main>{children}</main>
        <Footer/>
            <Toaster 
              richColors 
              position="top-center" 
              toastOptions={{
                classNames: {
                  toast: "w-[90vw] max-w-[400px] sm:w-auto mx-auto",
                },
              }} 
            />
      </div>
    </div>
  );
}
