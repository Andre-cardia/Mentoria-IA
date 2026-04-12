import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * Verifica se o usuário autenticado tem perfil completo.
 * Admin é dispensado — vai direto para o conteúdo.
 * Aluno sem perfil é redirecionado para /completar-perfil.
 */
export default function ProfileGuard({ children }) {
  const { user, isAdmin } = useAuth();
  const [checked, setChecked] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    if (!user) { setChecked(true); return; }
    if (isAdmin) { setHasProfile(true); setChecked(true); return; }

    supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setHasProfile(!!data);
        setChecked(true);
      });
  }, [user, isAdmin]);

  if (!checked) return null;
  if (!hasProfile) return <Navigate to="/completar-perfil" replace />;
  return children;
}
