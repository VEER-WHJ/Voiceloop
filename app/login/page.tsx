import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const confirmationFailed = (await searchParams).error === "confirmation";
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.10),transparent_35%),linear-gradient(to_bottom_right,#f8fafc,#f1f5f9)] p-5 text-slate-950">
      <section className="w-full max-w-md rounded-2xl border-2 border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9">
        <div className="brand-mark">
          <p className="text-[28px] tracking-[-0.035em]"><span className="font-bold text-teal-800">Circuit</span><span className="ml-1.5 font-medium text-slate-600">Feedback</span></p>
        </div>
        <h1 className="mt-8 text-2xl font-semibold tracking-[-0.025em]">Access your workspace</h1>
        <p className="mt-2 leading-7 text-slate-600">Create an account or sign in to manage locations and feedback sources.</p>
        {confirmationFailed && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-900">That confirmation link is invalid or has expired. Request a new link by creating the account again.</p>}
        <LoginForm />
      </section>
    </main>
  );
}
