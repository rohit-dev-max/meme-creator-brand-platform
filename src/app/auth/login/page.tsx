"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Zap, Eye, EyeOff, Loader2, ArrowRight, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (!login.trim() || !password) {
      setError("Enter your email/username and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: login.trim(), password, remember }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen">
      <div className="mx-auto grid min-h-[calc(100vh-80px)] items-center gap-8 px-4 py-10 lg:grid-cols-[1fr_480px]">
        <div className="relative hidden lg:block">
          <div className="pointer-events-none absolute -left-10 top-10 h-72 w-72 rounded-full bg-lime-400/15 blur-[100px]" />
          <p className="font-display text-4xl font-bold leading-tight">
            WELCOME <span className="text-lime-300">BACK.</span>
          </p>
          <p className="mt-2 text-sm text-zinc-400">Your bangers missed you.</p>
          <div className="mt-6 space-y-3">
            {[
              { img: "https://images.pexels.com/photos/9820722/pexels-photo-9820722.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", t: "ME SEEING", b: "THE WIFI PASSWORD CHANGED" },
              { img: "https://images.pexels.com/photos/5621971/pexels-photo-5621971.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", t: "CHECKING BANK ACCOUNT", b: "AFTER STEAM SALE" },
            ].map((m, i) => (
              <div key={i} className="animate-float relative overflow-hidden rounded-2xl border border-white/10" style={{ animationDelay: `${i * 0.9}s` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.img} alt="" className="aspect-[16/7] w-full object-cover" />
                <p className="meme-text absolute inset-x-0 top-2 px-3 text-center text-sm text-white">{m.t}</p>
                <p className="meme-text absolute inset-x-0 bottom-2 px-3 text-center text-sm text-white">{m.b}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0e0e16] p-6 sm:p-8">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-lime-300 text-black">
              <Zap size={20} />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold">Log in</h1>
              <p className="text-xs text-zinc-500">Your memes, your battles, your bag</p>
            </div>
          </div>

          {params.get("verified") === "1" && (
            <p className="mt-4 flex items-center gap-2 rounded-xl border border-lime-300/30 bg-lime-300/10 px-3.5 py-2.5 text-[13px] font-bold text-lime-300">
              ✓ Email verified! Log in to start posting.
            </p>
          )}

          <div className="mt-5 space-y-3">
            <input
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Email or username"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-lime-300/60"
            />
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                onKeyDown={(e) => e.key === "Enter" && submit()}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 pr-10 text-sm outline-none placeholder:text-zinc-600 focus:border-lime-300/60"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-3 text-zinc-500 hover:text-white"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <label className="flex cursor-pointer items-center gap-2 text-zinc-400">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 accent-lime-300"
                />
                Remember me
              </label>
              <Link href="/forgot-password" className="font-bold text-lime-300 hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          {error && (
            <p className="mt-3 flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-3.5 py-2.5 text-[13px] font-bold text-red-300">
              <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
            </p>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-lime-300 py-3.5 text-sm font-extrabold text-black transition hover:bg-lime-200 disabled:opacity-40"
          >
            {loading ? <Loader2 size={17} className="animate-spin" /> : null}
            {loading ? "Logging in..." : "Log in"}
          </button>

          <p className="mt-4 text-center text-sm text-zinc-500">
            New here?{" "}
            <Link href="/auth/signup" className="font-bold text-lime-300 hover:underline">
              Create an account <ArrowRight size={12} className="inline" />
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}
