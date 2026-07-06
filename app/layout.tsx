import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pronounce Check",
  description: "Assess your pronunciation using AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
