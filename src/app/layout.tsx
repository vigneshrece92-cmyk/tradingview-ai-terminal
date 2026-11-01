import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradingView AI Terminal | Screener, Lightweight Charts & Pine Copilot",
  description: "Unified AI trading terminal powered by TradingView Technical Analysis, Lightweight Charts, and Pine Script Studio.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-[#0b0e14] text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
