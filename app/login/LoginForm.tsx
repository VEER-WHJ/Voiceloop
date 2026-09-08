"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, EnvelopeSimple, LockKey } from "@phosphor-icons/react";

type Mode = "signup" | "signin";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const endpoint = mode === "signup" ? "signup" : "login";
      const response = await fetch(`/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = (await response.json()) as { message?: string; confirmationRequired?: boolean };
      if (!response.ok) throw new Error(result.message ?? "Circuit could not complete the request.");
      if (mode === "signup" && result.confirmationRequired) {
        setMessage("Check your email to confirm your account, then sign in.");
        setMode("signin");
        setPassword("");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Circuit could not complete the request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Account access">
        {(["signup", "signin"] as const).map((item) => (
          <button key={item} type="button" role="tab" aria-selected={mode === item} onClick={() => { setMode(item); setError(""); setMessage(""); }} className={`min-h-10 rounded-lg px-3 text-sm font-semibold transition ${mode === item ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
            {item === "signup" ? "Create account" : "Sign in"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block"><span className="text-sm font-semibold text-slate-700">Email</span><div className="relative mt-2"><EnvelopeSimple className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} weight="bold" /><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" placeholder="you@company.com" required autoFocus /></div></label>
        <label className="block"><span className="text-sm font-semibold text-slate-700">Password</span><div className="relative mt-2"><LockKey className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} weight="bold" /><input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" placeholder="At least 8 characters" required /></div></label>
        {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">{message}</p>}
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-900">{error}</p>}
        <button disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60">{loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}{!loading && <ArrowRight size={18} weight="bold" />}</button>
      </form>
    </div>
  );
}
