import type { Metadata } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { WalletProvider } from "@/components/WalletProvider";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { PublisherNavLink } from "@/components/PublisherNavLink";

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Dropin",
  description: "Pay per article with XRP",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-paper text-ink antialiased">
        <WalletProvider>
          {/* Sticky nav — backdrop blur on paper background */}
          <header className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-paper/85 backdrop-blur-xl border-b border-ink/[0.06]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <svg
                width="18"
                height="22"
                viewBox="0 0 24 30"
                fill="none"
                stroke="#1B6B4F"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="transition-transform duration-300 group-hover:scale-110 group-hover:translate-y-[1px]"
              >
                <path d="M12 3C12 3 3 13 3 19a9 9 0 005.5 8.3" />
                <path d="M12 3C12 3 21 13 21 19a9 9 0 01-5.5 8.3" />
              </svg>
              <span className="font-display text-[22px] text-ink tracking-[-0.5px] leading-none">
                Dropin
              </span>
            </Link>

            {/* Nav right */}
            <nav className="flex items-center gap-5">
              <Link
                href="/browse"
                className="text-[13px] font-medium text-ink-secondary hover:text-ink transition-colors tracking-[0.1px]"
              >
                Browse
              </Link>
              <PublisherNavLink />
              <ConnectWalletButton />
            </nav>
          </header>

          <main>{children}</main>

          <footer className="text-center py-6 text-[11px] text-ink-ghost tracking-[0.4px]">
            Built on the{" "}
            <span className="text-accent">XRP Ledger</span>
            {" "}·
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
