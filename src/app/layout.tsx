import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jet = JetBrains_Mono({
  variable: "--font-jet",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NeonPy — Neon Python Editor",
  description:
    "A Python code editor where every keystroke — yours or the AI's — leaves glowing neon light trails behind the code.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.variable} ${jet.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
