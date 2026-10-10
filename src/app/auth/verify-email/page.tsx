"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"checking" | "ok" | "fail">("checking");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("fail");
      return;
    }
    fetch(`/api/auth/verify-email?token=${token}`)
      .then((r) => r.json())
      .then((d) => setStatus(d.ok ? "ok" : "fail"))
      .catch(() => setStatus("fail"));
  }, []);

  return (
    <main className="relative min-h-screen">
      <div className="mx-auto grid min-h-[calc(100vh-80px)] place-items-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0e0e16] p-8 text-center">
          {status === "checking" && (
            <p className="text-sm text-zinc-400">Verifying your email...</p>
          )}
          {status === "ok" && (
            <>
              <CheckCircle2 size={48} className="mx-auto text-lime-300" />
              <h1 className="font-display mt-4 text-2xl font-bold">Email verified!</h1>
              <p className="mt-2 text-sm text-zinc-400">Your account is active. Time to post a banger.</p>
              <Link href="/login" className="mt-5 inline-block rounded-full bg-lime-300 px-6 py-2.5 text-sm font-extrabold text-black">
                Log in
              </Link>
            </>
          )}
          {status === "fail" && (
            <>
              <XCircle size={48} className="mx-auto text-red-400" />
              <h1 className="font-display mt-4 text-2xl font-bold">Link invalid or expired</h1>
              <p className="mt-2 text-sm text-zinc-400">Request a fresh verification email from settings.</p>
              <Link href="/login" className="mt-5 inline-block rounded-full bg-white/10 px-6 py-2.5 text-sm font-bold">
                Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
