import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import GrowsorcioLogo from '../components/GrowsorcioLogo';

export default function EsqueciSenha() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-senha`,
      });

      if (error) {
        setErro(error.message);
        return;
      }

      setEnviado(true);
    } catch {
      setErro('Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/3 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="bg-slate-950/95 backdrop-blur-xl border border-white/[0.04] rounded-2xl shadow-card p-8 space-y-8">
          
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <GrowsorcioLogo height={44} />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
                Recuperar senha
              </h1>
              <p className="text-zinc-500 text-sm mt-1.5">
                Enviaremos um link para redefinir sua senha
              </p>
            </div>
          </div>

          {enviado ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
                <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                <p className="text-sm text-success font-medium text-center">
                  E-mail enviado! Verifique sua caixa de entrada.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-accent hover:bg-orange-600 transition-all duration-200 shadow-glow-sm hover:shadow-glow cursor-pointer min-h-[48px]"
              >
                Voltar ao login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                  E-mail
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="w-[18px] h-[18px] text-zinc-500 group-focus-within:text-accent transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.02] border border-white/[0.04] rounded-xl text-zinc-200 placeholder:text-zinc-700 text-sm outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all duration-200"
                    autoComplete="email"
                  />
                </div>
              </div>

              {erro && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20">
                  <svg className="w-4 h-4 text-danger flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  <span className="text-sm text-danger">{erro}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-accent hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-glow-sm hover:shadow-glow cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar link de recuperação'
                )}
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full text-center text-sm text-zinc-600 hover:text-zinc-400 transition-colors duration-200 cursor-pointer"
          >
            ← Voltar ao login
          </button>
        </div>
      </div>
    </div>
  );
}
