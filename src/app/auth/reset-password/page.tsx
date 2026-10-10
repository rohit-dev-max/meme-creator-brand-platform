"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword: confirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen">
      <div className="mx-auto grid min-h-[calc(100vh-80px)] place-items-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0e0e16] p-8">
          {done ? (
            <div className="animate-pop text-center">
              <CheckCircle2 size={48} className="mx-auto text-lime-300" />
              <h1 className="font-display mt-4 text-2xl font-bold">Password reset!</h1>
              <p className="mt-2 text-sm text-zinc-400">Log in with your new password.</p>
              <Link href="/login" className="mt-5 inline-block rounded-full bg-lime-300 px-6 py-2.5 text-sm font-extrabold text-black">
                Log in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold">New password</h1>
              <p className="mt-1 text-sm text-zinc-400">Choose something strong.</p>
              <div className="mt-5 space-y-3">
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 pr-10 text-sm outline-none placeholder:text-zinc-600 focus:border-lime-300/60"
                  />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-3 text-zinc-500 hover:text-white">
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <input
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-lime-300/60"
                />
              </div>
              {error && <p className="mt-2 text-[13px] font-bold text-red-300">{error}</p>}
              <button
                onClick={submit}
                disabled={loading}
                className="mt-4 w-full rounded-2xl bg-lime-300 py-3 text-sm font-extrabold text-black disabled:opacity-40"
              >
                {loading ? "Resetting..." : "Reset password"}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ResetForm />
    </Suspense>
  );
}
