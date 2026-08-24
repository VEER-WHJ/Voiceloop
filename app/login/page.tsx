import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f1e8] p-5 text-stone-950">
      <section className="w-full max-w-md rounded-[22px] border-2 border-stone-300 bg-[#fffaf1] p-7 shadow-[0_8px_0_rgba(41,37,36,0.1)] sm:p-9">
        <div className="brand-mark leading-none">
          <p className="text-[12px] font-black uppercase tracking-[0.34em] text-[#c81e1e]">Secret</p>
          <p className="mt-1 text-[30px] font-black uppercase tracking-[-0.055em]">Burger</p>
          <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.16em] text-stone-500">powered by VoiceLoop</p>
        </div>
        <p className="mt-8 text-xs font-black uppercase tracking-[0.14em] text-[#b91c1c]">Private manager pilot</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.035em]">Guest feedback, without the noise.</h1>
        <p className="mt-3 leading-7 text-stone-600">A focused demo workspace for reviewing locations, evidence, and operational priorities.</p>
        <LoginForm />
      </section>
    </main>
  );
}
