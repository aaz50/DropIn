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
              <div className="w-7 h-7 rounded-[7px] bg-accent flex items-center justify-center transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-105">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
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
