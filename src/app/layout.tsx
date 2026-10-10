import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/lib/user-context";
import Header from "@/components/Header";
import AmbientBackground from "@/components/AmbientBackground";

export const metadata: Metadata = {
  title: "MemeArena — Create. Post. Compete. Get Paid.",
  description:
    "The home for memers: AI meme maker, viral feed, cash-prize battles, brand deal marketplace, AI translator in 30 languages, and 24/7 help center.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#07070c] text-zinc-100 antialiased">
        <AmbientBackground />
        <UserProvider>
          <div className="relative z-10">
          <Header />
          {children}
          <footer className="border-t border-white/10 bg-[#0a0a12]">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-display text-xl font-bold tracking-tight">
                  MEME<span className="text-lime-300">ARENA</span>
                </p>
                <p className="mt-1 max-w-md text-sm text-zinc-400">
                  The creator platform for memers. Post bangers, win battles, and turn memes
                  into brand deals.
                </p>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-zinc-400">
                <span className="flex items-center gap-2">⚡ 128k memers</span>
                <span className="flex items-center gap-2">🏆 $240k paid in prizes</span>
                <span className="flex items-center gap-2">🤝 340+ brands</span>
              </div>
            </div>
            <div className="border-t border-white/5 py-4 text-center text-xs text-zinc-600">
              Built for the chronically online. Touch grass occasionally.
            </div>
          </footer>
          </div>
        </UserProvider>
      </body>
    </html>
  );
}
