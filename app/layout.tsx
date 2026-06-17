import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "BenchmarkX — Mobile Performance Tool",
  description:
    "Measure your device's real-world gaming performance and compare it against flagship phones like iPhone 15 Pro Max, RedMagic 9 Pro, and iQOO 12.",
  keywords: ["benchmark", "mobile performance", "fps test", "gaming", "stress test"],
  openGraph: {
    title: "BenchmarkX — Mobile Performance Tool",
    description: "Real-world gaming benchmark for mobile browsers",
    type: "website",
  },
};

const isDev = process.env.NODE_ENV === "development";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-[#080B12] text-white`}>
        {children}
        {/* Eruda mobile debug console — DEVELOPMENT ONLY */}
        {isDev && (
          <>
            <Script src="https://cdn.jsdelivr.net/npm/eruda" strategy="beforeInteractive" />
            <Script id="eruda-init" strategy="afterInteractive">
              {`if (typeof eruda !== 'undefined') eruda.init();`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
