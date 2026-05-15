import { Separator } from "@/components/ui/separator";
import { GithubIcon, TwitterIcon } from "lucide-react";
import Link from "next/link";

const footerLinks = [
  {
    title: "Tentang TBCheck",
    href: "#",
  },
  {
    title: "Cara Kerja",
    href: "#",
  },
  {
    title: "Skrining Cepat",
    href: "#",
  },
  {
    title: "Edukasi TBC",
    href: "#",
  },
  {
    title: "Kontak",
    href: "#",
  },
  {
    title: "Kebijakan Privasi",
    href: "#",
  },
];

const Footer05Page = () => {
  return (
    <footer className="border-t">
      <div className="max-w-(--breakpoint-xl) mx-auto">
        <div className="py-12 flex flex-col justify-start items-center">
          {/* Logo pakai teks */}
          <span className="text-2xl font-bold text-foreground">TBCheck</span>

          <ul className="mt-6 flex items-center gap-4 flex-wrap">
            {footerLinks.map(({ title, href }) => (
              <li key={title}>
                <Link
                  href={href}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <Separator />
        <div className="py-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-x-2 gap-y-5 px-6 xl:px-0">
          {/* Copyright */}
          <span className="text-muted-foreground">
            &copy; {new Date().getFullYear()}{" "}
            <Link
              href="/"
              target="_blank"
              className="hover:text-foreground font-semibold"
            >
              TBCheck
            </Link>
            . Semua hak cipta dilindungi.
          </span>

          <div className="flex items-center gap-5 text-muted-foreground">
            <Link href="https://twitter.com" target="_blank">
              <TwitterIcon className="h-5 w-5" />
            </Link>
            <Link href="https://github.com" target="_blank">
              <GithubIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer05Page;
