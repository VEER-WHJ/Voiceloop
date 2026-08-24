"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKey, ShieldCheck } from "@phosphor-icons/react";

export function LoginForm() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode }),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) throw new Error(result.message ?? "VoiceLoop could not sign you in.");
      router.replace("/");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "VoiceLoop could not sign you in.",
      );
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      <label className="block">
        <span className="text-sm font-extrabold text-stone-700">Private access code</span>
        <div className="relative mt-2">
          <LockKey className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} weight="bold" />
          <input
            type="password"
            autoComplete="current-password"
            value={accessCode}
            onChange={(event) => setAccessCode(event.target.value)}
            className="h-13 w-full rounded-xl border-2 border-stone-300 bg-white pl-12 pr-4 font-bold text-stone-950 shadow-[0_3px_0_rgba(41,37,36,0.08)]"
            placeholder="Enter access code"
            required
            autoFocus
          />
        </div>
      </label>
      {error && <p role="alert" className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-sm font-bold text-red-900">{error}</p>}
      <button disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#861616] bg-[#c81e1e] px-5 font-extrabold text-white shadow-[0_4px_0_#861616] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">
        {loading ? "Opening workspace…" : "Open Secret Burger workspace"}
        {!loading && <ArrowRight size={19} weight="bold" />}
      </button>
      <p className="flex items-start gap-2 text-xs leading-5 text-stone-500"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-700" size={17} weight="fill" />This private pilot uses an encrypted session cookie. Google Business Profile is not connected.</p>
    </form>
  );
}
