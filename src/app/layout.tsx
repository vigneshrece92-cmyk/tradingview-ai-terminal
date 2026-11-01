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
      <head>
        {/* Tailwind CDN as an immediate JIT fallback guaranteeing full CSS rendering */}
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                darkMode: 'class',
                theme: {
                  extend: {
                    colors: {
                      dark: '#090d14',
                      panel: '#111723',
                      card: '#0d111a',
                    }
                  }
                }
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-[#090d14] text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
