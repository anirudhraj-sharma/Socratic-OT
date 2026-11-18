import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/ui/Header";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const sourceSerif = localFont({
  src: [
    {
      path: "../node_modules/@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-normal.woff2",
      weight: "200 900",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-italic.woff2",
      weight: "200 900",
      style: "italic",
    },
  ],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Socratic·OT — AI tutor for occupational therapy anatomy",
  description: "Socratic and Study modes for OT anatomy and neuroscience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} min-h-screen bg-ivory-50 text-ink font-sans antialiased`}
      >
        <Header />
        <main className="w-full px-4 py-8 sm:px-6 md:py-10 lg:px-8 xl:px-12">
          {children}
        </main>
      </body>
    </html>
  );
}
