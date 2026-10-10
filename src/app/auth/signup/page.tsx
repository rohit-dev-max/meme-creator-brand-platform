"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Zap,
  Check,
  X,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Shield,
  Sparkles,
} from "lucide-react";

function strength(pw: string): { score: number; label: string; color: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 2) return { score: s, label: "Weak", color: "#fb7185" };
  if (s <= 3) return { score: s, label: "Okay", color: "#fbbf24" };
  if (s <= 4) return { score: s, label: "Strong", color: "#a3e635" };
  return { score: s, label: "Elite", color: "#22d3ee" };
}

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    displayName: "",
    handle: "",
    email: "",
    password: "",
    confirmPassword: "",
    dob: "",
    agree: false,
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [handleStatus, setHandleStatus] = useState<"idle" | "checking" | "ok" | "taken">("idle");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [devToken, setDevToken] = useState("");

  // live handle availability
  useEffect(() => {
    const h = form.handle.trim();
    if (h.length < 3) {
      setHandleStatus("idle");
      return;
    }
    setHandleStatus("checking");
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-handle?handle=${encodeURIComponent(h)}`);
        const data = await res.json();
        setHandleStatus(data.available ? "ok" : "taken");
      } catch {
        setHandleStatus("idle");
      }
    }, 350);
    return () => clearTimeout(t);
  }, [form.handle]);

  const submit = async () => {
    setError("");
    if (!form.displayName.trim() || !form.handle.trim() || !form.email.trim() || !form.password || !form.dob) {
      setError("All fields are required.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (!form.agree) {
      setError("Accept the Terms & Community Guidelines to continue.");
      return;
    }
    if (handleStatus === "taken") {
      setError("That username is taken.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }
      setDevToken(data.devToken ?? "");
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  const verifyNow = async () => {
    if (!devToken) return;
    const res = await fetch(`/api/auth/verify-email?token=${devToken}`);
    if (res.ok) {
      router.push("/login?verified=1");
    }
  };

  return (
    <main className="relative min-h-screen">
      <div className="mx-auto grid min-h-[calc(100vh-80px)] items-center gap-8 px-4 py-10 lg:grid-cols-[1fr_480px]">
        {/* left: meme wall (desktop) */}
        <div className="relative hidden lg:block">
          <div className="pointer-events-none absolute -left-10 top-10 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-[100px]" />
          <p className="font-display text-4xl font-bold leading-tight">
            JOIN <span className="text-lime-300">128,000+</span> MEMERS.
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Post bangers, win battles, get paid. Your wall of fame:
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { img: "https://images.pexels.com/photos/16417902/pexels-photo-16417902.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", top: "MONDAY MEETINGS", bottom: "COULD HAVE BEEN AN EMAIL" },
              { img: "https://images.pexels.com/photos/5831344/pexels-photo-5831344.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", top: "WHEN CLIENT SAYS", bottom: '"JUST ONE SMALL CHANGE"' },
              { img: "https://images.pexels.com/photos/16667961/pexels-photo-16667961.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", top: "POV: PROD IS DOWN", bottom: "AND YOU JUST DEPLOYED" },
              { img: "https://images.pexels.com/photos/7534785/pexels-photo-7534785.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", top: "ME READING", bottom: "MY OWN CODE FROM 6 MONTHS AGO" },
            ].map((m, i) => (
              <div key={i} className="animate-float overflow-hidden rounded-2xl border border-white/10" style={{ animationDelay: `${i * 0.7}s` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.img} alt="" className="aspect-[4/3] w-full object-cover" />
                <p className="meme-text absolute inset-x-0 top-2 px-3 text-center text-sm text-white">{m.top}</p>
                <p className="meme-text absolute inset-x-0 bottom-2 px-3 text-center text-sm text-white">{m.bottom}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 flex items-center gap-2 text-xs text-zinc-500">
            <Shield size={13} className="text-lime-300" /> Secure by design — passwords are hashed, sessions are httpOnly.
          </p>
        </div>

        {/* right: form */}
        <div className="rounded-3xl border border-white/10 bg-[#0e0e16] p-6 sm:p-8">
          {done ? (
            <div className="animate-pop text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-lime-300 text-3xl text-black">✉️</span>
              <h1 className="font-display mt-4 text-2xl font-bold">Check your inbox</h1>
              <p className="mt-2 text-sm text-zinc-400">
                We sent a verification link to <span className="font-bold text-white">{form.email}</span>.
                Your account activates after you verify.
              </p>
              <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-black/30 p-4">
                <p className="text-xs font-bold text-zinc-500">DEMO MODE</p>
                <p className="mt-1 text-xs text-zinc-400">No real email here — click below to verify instantly:</p>
                <button
                  onClick={verifyNow}
                  className="mt-3 w-full rounded-full bg-lime-300 py-2.5 text-sm font-extrabold text-black"
                >
                  Verify email & activate
                </button>
              </div>
              <Link href="/login" className="mt-4 inline-block text-sm font-bold text-lime-300 hover:underline">
                Go to Log In →
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-lime-300 text-black">
                  <Zap size={20} />
                </span>
                <div>
                  <h1 className="font-display text-2xl font-bold">Create your account</h1>
                  <p className="text-xs text-zinc-500">Free forever · No card needed</p>
                </div>
              </div>

              <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 py-3 text-sm font-bold transition hover:bg-white/10">
                <span className="text-lg">🔍</span> Continue with Google
              </button>
              <div className="my-4 flex items-center gap-3 text-xs text-zinc-600">
                <span className="h-px flex-1 bg-white/10" /> or sign up with email <span className="h-px flex-1 bg-white/10" />
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    placeholder="Full name"
                    className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-lime-300/60"
                  />
                  <div className="relative">
                    <input
                      value={form.handle}
                      onChange={(e) => setForm({ ...form, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                      placeholder="username"
                      className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 pr-9 text-sm outline-none placeholder:text-zinc-600 focus:border-lime-300/60"
                    />
                    {handleStatus === "checking" && <Loader2 size={15} className="absolute right-3 top-3 animate-spin text-zinc-500" />}
                    {handleStatus === "ok" && <Check size={15} className="absolute right-3 top-3 text-lime-300" />}
                    {handleStatus === "taken" && <X size={15} className="absolute right-3 top-3 text-red-400" />}
                  </div>
                </div>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email address"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-lime-300/60"
                />
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Password"
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
                {/* strength meter */}
                {form.password && (
                  <div className="flex items-center gap-2">
                    <div className="flex flex-1 gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span
                          key={i}
                          className="h-1.5 flex-1 rounded-full"
                          style={{
                            background: i <= strength(form.password).score ? strength(form.password).color : "#27272a",
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-bold" style={{ color: strength(form.password).color }}>
                      {strength(form.password).label}
                    </span>
                  </div>
                )}
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Confirm password"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 pr-10 text-sm outline-none placeholder:text-zinc-600 focus:border-lime-300/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-3 text-zinc-500 hover:text-white"
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500">DATE OF BIRTH (18+ for dark humor)</label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={(e) => setForm({ ...form, dob: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-lime-300/60 [color-scheme:dark]"
                  />
                </div>
                <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-zinc-400">
                  <input
                    type="checkbox"
                    checked={form.agree}
                    onChange={(e) => setForm({ ...form, agree: e.target.checked })}
                    className="mt-0.5 h-4 w-4 accent-lime-300"
                  />
                  <span>
                    I agree to the <span className="font-bold text-lime-300">Terms</span> and{" "}
                    <span className="font-bold text-lime-300">Community Guidelines</span>.
                  </span>
                </label>
              </div>

              {error && (
                <p className="mt-3 rounded-xl border border-red-400/30 bg-red-400/10 px-3.5 py-2.5 text-[13px] font-bold text-red-300">
                  {error}
                </p>
              )}

              <button
                onClick={submit}
                disabled={loading}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-lime-300 py-3.5 text-sm font-extrabold text-black transition hover:bg-lime-200 disabled:opacity-40"
              >
                {loading ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
                {loading ? "Creating..." : "Sign up"}
              </button>

              <p className="mt-4 text-center text-sm text-zinc-500">
                Already have an account?{" "}
                <Link href="/login" className="font-bold text-lime-300 hover:underline">
                  Log in <ArrowRight size={12} className="inline" />
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
