import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-5 text-slate-950">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9">
        <div className="brand-mark leading-none">
          <p className="text-[28px] font-bold tracking-[-0.04em] text-slate-950">Circuit</p>
          <p className="mt-1 text-sm font-medium text-slate-500">Customer feedback</p>
        </div>
        <h1 className="mt-8 text-2xl font-semibold tracking-[-0.025em]">Set up your workspace</h1>
        <p className="mt-2 leading-7 text-slate-600">Create an account to add locations and connect feedback sources.</p>
        <LoginForm />
      </section>
    </main>
  );
}
