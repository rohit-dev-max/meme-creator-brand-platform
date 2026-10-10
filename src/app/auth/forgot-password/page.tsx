"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (!email.trim()) {
      setError("Enter your email.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen">
      <div className="mx-auto grid min-h-[calc(100vh-80px)] place-items-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0e0e16] p-8">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-lime-300 text-black">
            <Mail size={22} />
          </span>
          <h1 className="font-display mt-4 text-2xl font-bold">Reset your password</h1>
          <p className="mt-1 text-sm text-zinc-400">
            We&apos;ll email you a secure link. It expires in 1 hour.
          </p>

          {sent ? (
            <div className="animate-pop mt-5 rounded-2xl border border-lime-300/30 bg-lime-300/5 p-5 text-center">
              <CheckCircle2 size={32} className="mx-auto text-lime-300" />
              <p className="mt-2 text-sm font-bold">Check your inbox</p>
              <p className="mt-1 text-[13px] text-zinc-400">Reset link sent to {email}</p>
              <Link href="/login" className="mt-3 inline-block text-sm font-bold text-lime-300 hover:underline">
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-lime-300/60"
              />
              {error && <p className="mt-2 text-[13px] font-bold text-red-300">{error}</p>}
              <button
                onClick={submit}
                disabled={loading}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-lime-300 py-3 text-sm font-extrabold text-black disabled:opacity-40"
              >
                Send reset link <ArrowRight size={15} />
              </button>
              <p className="mt-4 text-center text-sm text-zinc-500">
                Remembered it? <Link href="/login" className="font-bold text-white hover:underline">Log in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
