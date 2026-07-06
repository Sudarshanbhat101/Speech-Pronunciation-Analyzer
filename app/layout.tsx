import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "pronounce.check — instant pronunciation feedback",
  description:
    "Upload 30–45 seconds of English speech and get an instant pronunciation score with word-level feedback.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <div className="app-shell">
          <header className="site-header">
            <div className="brand-mark">
              <svg
                className="brand-waveform"
                viewBox="0 0 64 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect x="0" y="9" width="4" height="6" rx="2" fill="currentColor" />
                <rect x="8" y="4" width="4" height="16" rx="2" fill="currentColor" />
                <rect x="16" y="0" width="4" height="24" rx="2" fill="currentColor" />
                <rect x="24" y="6" width="4" height="12" rx="2" fill="currentColor" />
                <rect x="32" y="2" width="4" height="20" rx="2" fill="currentColor" />
                <rect x="40" y="8" width="4" height="8" rx="2" fill="currentColor" />
                <rect x="48" y="4" width="4" height="16" rx="2" fill="currentColor" />
                <rect x="56" y="9" width="4" height="6" rx="2" fill="currentColor" />
              </svg>
              <span className="brand-name">
                pronounce<span className="brand-name-accent">.check</span>
              </span>
            </div>
            <p className="brand-tagline">
              word-level pronunciation feedback, one recording at a time
            </p>
          </header>

          <main className="site-main">{children}</main>

          <footer className="site-footer">
            <p className="footer-note">
              <span className="footer-dot" aria-hidden="true"></span>
              Audio is processed in memory and never stored on our servers.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}