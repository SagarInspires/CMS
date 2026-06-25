import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: "EditorialFlow",
  description: "Production-grade, API-first editorial CMS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased selection:bg-black selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
