import { Shield, LogOut, MessageSquare, Code2, CheckCircle, AlertCircle, WifiOff } from 'lucide-react';
import { UserProfile } from '../../types';
import { AppView } from '../../types';

interface HeaderProps {
  profile: UserProfile | null;
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  onSignOut: () => void;
  offlineMode?: boolean;
}

export function Header({ profile, activeView, onViewChange, onSignOut, offlineMode = false }: HeaderProps) {
  return (
    <header className="flex items-center gap-3 px-4 py-2.5 bg-[#080810] border-b border-[#1a1a28] shrink-0">
      <nav className="flex items-center gap-1 bg-[#0d0d1a] border border-[#1e1e2e] rounded-xl p-1">
        <button
          onClick={() => onViewChange('chat')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
            activeView === 'chat'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25'
              : 'text-[#4b5563] hover:text-[#9ca3af]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="hidden sm:block">Chat AI</span>
        </button>
        <button
          onClick={() => onViewChange('ide')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
            activeView === 'ide'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
              : 'text-[#4b5563] hover:text-[#9ca3af]'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span className="hidden sm:block">IDE Online</span>
        </button>
      </nav>

      <div className="ml-auto flex items-center gap-3">
        {offlineMode && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <WifiOff className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] text-amber-400 font-mono">Sin conexion</span>
          </div>
        )}
        
        {profile?.age_verified ? (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span className="text-[11px] text-emerald-400 font-mono">18+ verificado</span>
          </div>
        ) : !offlineMode ? (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] text-amber-400 font-mono">Sin verificar</span>
          </div>
        ) : null}

        <div className="flex items-center gap-2.5">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="avatar"
              className="w-7 h-7 rounded-lg object-cover border border-[#1e1e2e]"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-[#1a1a28] border border-[#1e1e2e] flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-[#4b5563]" />
            </div>
          )}
          <span className="hidden md:block text-[#6b7280] text-xs truncate max-w-[120px]">
            {profile?.display_name ?? profile?.email ?? 'Usuario'}
          </span>
        </div>

        <button
          onClick={onSignOut}
          className="p-1.5 text-[#374151] hover:text-[#6b7280] transition-colors rounded-lg hover:bg-[#1a1a28]"
          title="Cerrar sesion"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
