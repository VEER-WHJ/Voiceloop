import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Circuit Feedback",
  description: "One clear view of customer feedback across every location.",
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
