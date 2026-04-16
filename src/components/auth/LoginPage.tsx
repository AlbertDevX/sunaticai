import { useState, useEffect } from 'react';
import { Shield, Code2, Terminal, Cpu, Lock, Zap } from 'lucide-react';
import { loadRecaptcha, executeRecaptcha } from '../../lib/recaptcha';

interface LoginPageProps {
  onSignIn: () => Promise<{ error: unknown }>;
}

export function LoginPage({ onSignIn }: LoginPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecaptcha();
  }, []);

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);
    try {
      await executeRecaptcha('login');
      const { error } = await onSignIn();
      if (error) setError('Error al iniciar sesión. Intenta de nuevo.');
    } catch {
      setError('Error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <GridPattern />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <Terminal className="w-7 h-7 text-[#050508]" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-[#050508] rounded-full" />
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white tracking-tight">CodeSec AI</h1>
              <p className="text-xs text-cyan-400/70 font-mono">v2.0 — Unrestricted Dev</p>
            </div>
          </div>

          <p className="text-[#6b7280] text-sm leading-relaxed max-w-sm mx-auto">
            Plataforma de IA especializada en programacion y ciberseguridad. Acceso adulto verificado via Google.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: Code2, label: 'IDE Online', sub: 'Auto Builder' },
            { icon: Shield, label: 'CiberSec', sub: 'Ofensiva/Defensiva' },
            { icon: Cpu, label: 'IA Propia', sub: 'Sin censura extra' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="bg-[#0d0d14] border border-[#1e1e2e] rounded-xl p-3 text-center">
              <Icon className="w-5 h-5 text-cyan-400 mx-auto mb-1.5" />
              <p className="text-white text-xs font-medium">{label}</p>
              <p className="text-[#4b5563] text-[10px] mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#0d0d14] border border-[#1e1e2e] rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-[#9ca3af] font-mono">Autenticacion segura</span>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-white hover:bg-gray-50 text-gray-900 font-medium rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            <span>{loading ? 'Conectando...' : 'Continuar con Google'}</span>
          </button>

          <div className="mt-5 flex items-start gap-2.5 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <Zap className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-400/70 leading-relaxed">
              El contenido de ciberseguridad avanzado requiere verificacion de mayores de 18 años via tu cuenta Google. La verificacion es automatica y discreta.
            </p>
          </div>
        </div>

        <p className="text-center text-[#374151] text-xs mt-6 font-mono">
          Protegido con reCAPTCHA v3 · Solo para uso en entornos autorizados
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function GridPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}
