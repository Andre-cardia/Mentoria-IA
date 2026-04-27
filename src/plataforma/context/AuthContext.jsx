import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);

  async function loadProfile(userId) {
    if (!userId) {
      setProfile(null);
      setProfileError(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, phone, avatar_url')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[AuthContext] erro ao carregar perfil:', error);
      setProfile(null);
      setProfileError(error.message ?? 'Erro ao carregar perfil.');
      return;
    }

    setProfile(data ?? null);
    setProfileError(null);
  }

  async function refreshProfile() {
    if (user) await loadProfile(user.id);
  }

  useEffect(() => {
    // Sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      setLoading(false);
      loadProfile(u?.id);
    });

    // Listener de mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      loadProfile(u?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signOut = () => supabase.auth.signOut();

  const role = user?.user_metadata?.role ?? null;
  const isAdmin = role === 'admin';
  const isCommercial = role === 'comercial';
  const hasCrmAccess = isAdmin || isCommercial;

  return (
    <AuthContext.Provider value={{ user, loading, role, isAdmin, isCommercial, hasCrmAccess, profile, profileError, refreshProfile, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
