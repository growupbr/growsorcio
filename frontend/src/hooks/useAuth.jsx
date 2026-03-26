import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../api/supabaseClient';

const AuthContext = createContext(null);

// Lê o usuário do localStorage de forma síncrona: elimina o spinner de
// carregamento para usuários já autenticados, fazendo a app aparecer
// instantaneamente sem precisar aguardar o getSession() assíncrono.
function _readUserSync() {
  try {
    const ref = supabase.supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (!ref) return null;
    const raw = localStorage.getItem(`sb-${ref}-auth-token`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.access_token || !parsed?.user) return null;
    if (parsed.expires_at && Date.now() / 1000 > parsed.expires_at - 60) return null;
    return parsed.user;
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const initialUser = _readUserSync();
  const [user, setUser] = useState(initialUser);          // populado de forma síncrona
  const [loading, setLoading] = useState(!initialUser);   // false se já temos o usuário

  useEffect(() => {
    // Valida/renova a sessão em background — atualiza estado se necessário
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
