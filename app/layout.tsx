import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Secret Burger Guest Intelligence — powered by VoiceLoop",
  description: "One clear view of guest feedback across every Secret Burger location.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
