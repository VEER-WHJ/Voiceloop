import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoiceLoop — Customer feedback intelligence",
  description: "Turn restaurant reviews into clear themes, evidence, and priorities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
