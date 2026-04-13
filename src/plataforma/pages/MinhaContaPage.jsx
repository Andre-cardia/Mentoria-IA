import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const inputStyle = {
  width: '100%', background: 'var(--panel-2)',
  border: '1px solid var(--line-strong)', borderRadius: '4px',
  padding: '10px 14px', color: 'var(--text)',
  fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem',
  outline: 'none', transition: 'border-color .15s', boxSizing: 'border-box',
};

const labelStyle = {
  fontFamily: 'Space Mono, monospace', fontSize: '.68rem',
  color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em',
};

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
}

export default function MinhaContaPage() {
  const { user, profile: ctxProfile, refreshProfile } = useAuth();

  // ── Dados pessoais
  const [localProfile, setLocalProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Alterar e-mail
  const [newEmail, setNewEmail] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);

  // ── Alterar senha
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [updatingPwd, setUpdatingPwd] = useState(false);

  // ── Reset por e-mail
  const [resetCooldown, setResetCooldown] = useState(0);
  const cooldownRef = useRef(null);

  // ── Avatar upload
  const fileInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('full_name, phone, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { console.error('[MinhaContaPage] load:', error); return; }
        if (!data) return;
        setLocalProfile(data);
        setFullName(data.full_name ?? '');
        setPhone(data.phone ?? '');
      });
  }, [user]);

  // ── Handlers — dados pessoais
  function handleChange(setter) {
    return (e) => { setter(e.target.value); setDirty(true); };
  }

  function handleCancel() {
    if (!localProfile) return;
    setFullName(localProfile.full_name ?? '');
    setPhone(localProfile.phone ?? '');
    setDirty(false);
  }

  async function handleSave() {
    if (!fullName.trim()) { toast.error('Nome completo é obrigatório.'); return; }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), phone: phone.trim() || null, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    setSaving(false);
    if (error) {
      console.error('[MinhaContaPage] save:', error);
      toast.error('Erro ao salvar. Tente novamente.');
      return;
    }
    setLocalProfile(p => ({ ...p, full_name: fullName.trim(), phone: phone.trim() || null }));
    setDirty(false);
    await refreshProfile();
    toast.success('Dados atualizados com sucesso.');
  }

  // ── Handlers — avatar
  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Formato inválido. Use JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('Arquivo muito grande. Máximo: 2 MB.');
      return;
    }

    setPendingFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    // Reset input so same file can be re-selected
    e.target.value = '';
  }

  function handleCancelAvatar() {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setPendingFile(null);
  }

  async function handleConfirmAvatar() {
    if (!pendingFile || !user) return;
    setUploading(true);

    try {
      const ext = pendingFile.name.split('.').pop().toLowerCase();
      const path = `${user.id}/avatar.${ext}`;

      // 1. Remover arquivo existente (ignorar erro — pode não existir)
      await supabase.storage.from('avatars').remove([path]);

      // 2. Upload limpo (sem upsert — arquivo foi removido acima)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, pendingFile, { contentType: pendingFile.type });

      if (uploadError) {
        console.error('[MinhaContaPage] storage error:', uploadError);
        throw new Error(uploadError.message || `Erro no upload (${uploadError.error || uploadError.statusCode || 'desconhecido'})`);
      }

      // 3. Obter URL pública (+ cache-bust para forçar reload)
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // 4. Persistir no perfil via API (service key — suporta admin sem linha em profiles)
      const { data: { session } } = await supabase.auth.getSession();
      const updateRes = await fetch('/api/profile/update-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ avatarUrl }),
      });
      if (!updateRes.ok) {
        const body = await updateRes.json().catch(() => ({}));
        console.error('[MinhaContaPage] profile update error:', body);
        throw new Error(body.error || 'Erro ao salvar foto no perfil.');
      }

      setLocalProfile(p => ({ ...p, avatar_url: avatarUrl }));
      await refreshProfile();
      toast.success('Foto de perfil atualizada.');
      handleCancelAvatar();
    } catch (err) {
      console.error('[MinhaContaPage] avatar upload:', err);
      toast.error(err.message || 'Erro ao enviar foto. Tente novamente.');
    } finally {
      setUploading(false);
    }
  }

  // ── Handlers — alterar e-mail
  async function handleUpdateEmail() {
    if (!newEmail.trim() || newEmail.trim() === user?.email) return;
    setUpdatingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setUpdatingEmail(false);
    if (error) { toast.error(error.message ?? 'Erro ao atualizar e-mail.'); return; }
    toast.info(`E-mail de confirmação enviado para ${newEmail.trim()}. O e-mail só será atualizado após a confirmação.`, { duration: 6000 });
    setNewEmail('');
  }

  // ── Handlers — alterar senha inline
  async function handleUpdatePassword() {
    if (newPwd.length < 8) { toast.error('A nova senha deve ter pelo menos 8 caracteres.'); return; }
    if (newPwd !== confirmPwd) { toast.error('A confirmação não confere com a nova senha.'); return; }

    setUpdatingPwd(true);
    // Re-autenticar com senha atual
    const { error: authError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPwd });
    if (authError) {
      setUpdatingPwd(false);
      toast.error('Senha atual incorreta.');
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPwd });
    setUpdatingPwd(false);
    if (updateError) { toast.error(updateError.message ?? 'Erro ao alterar senha.'); return; }
    toast.success('Senha alterada com sucesso.');
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
  }

  // ── Handlers — reset por e-mail
  const startCooldown = useCallback(() => {
    setResetCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResetCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearInterval(cooldownRef.current), []);

  async function handleResetPassword() {
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    if (error) { toast.error(error.message ?? 'Erro ao enviar link.'); return; }
    toast.success(`Link de redefinição enviado para ${user.email}.`);
    startCooldown();
  }

  const currentAvatar = avatarPreview ?? localProfile?.avatar_url ?? ctxProfile?.avatar_url;
  const initials = getInitials(fullName || localProfile?.full_name);

  return (
    <Layout>
      <div style={{ maxWidth: '560px' }}>
        {/* Cabeçalho */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '6px' }}>
            Conta
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.2, margin: 0 }}>
            Minha Conta
          </h1>
        </div>

        {/* Card — Dados Pessoais */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '28px', marginBottom: '20px' }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '20px' }}>
            Dados Pessoais
          </div>

          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            {/* Imagem / placeholder */}
            <button
              onClick={() => !pendingFile && fileInputRef.current?.click()}
              title="Alterar foto de perfil"
              style={{
                width: '64px', height: '64px', borderRadius: '50%', flexShrink: 0,
                padding: 0, border: '2px solid var(--accent)', cursor: pendingFile ? 'default' : 'pointer',
                overflow: 'hidden', background: 'var(--accent-soft)', position: 'relative',
              }}
            >
              {currentAvatar ? (
                <img src={currentAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)' }}>
                  {initials}
                </span>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '.95rem', marginBottom: '4px' }}>{fullName || '—'}</div>
              {pendingFile ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleConfirmAvatar}
                    disabled={uploading}
                    style={{
                      padding: '5px 14px', background: uploading ? 'rgba(255,106,0,.5)' : 'var(--accent)',
                      color: '#000', border: 'none', borderRadius: '4px',
                      fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '.8rem',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {uploading ? 'Enviando...' : 'Confirmar foto'}
                  </button>
                  <button
                    onClick={handleCancelAvatar}
                    disabled={uploading}
                    style={{
                      padding: '5px 14px', background: 'transparent',
                      color: 'var(--muted)', border: '1px solid var(--line)', borderRadius: '4px',
                      fontFamily: 'Space Grotesk, sans-serif', fontSize: '.8rem',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '5px 14px', background: 'transparent',
                    color: 'var(--muted)', border: '1px solid var(--line)', borderRadius: '4px',
                    fontFamily: 'Space Grotesk, sans-serif', fontSize: '.8rem', cursor: 'pointer',
                  }}
                >
                  Alterar foto
                </button>
              )}
            </div>
          </div>

          {/* Campos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Nome completo *</label>
              <input
                type="text" value={fullName}
                onChange={handleChange(setFullName)}
                placeholder="Seu nome completo"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--line-strong)'}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>WhatsApp</label>
              <input
                type="tel" value={phone}
                onChange={handleChange(setPhone)}
                placeholder="(48) 99999-9999"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--line-strong)'}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
                E-mail
                <span style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: '3px', padding: '1px 6px', fontSize: '.6rem', letterSpacing: '.04em' }}>
                  somente leitura
                </span>
              </label>
              <input
                type="email" value={user?.email ?? ''}
                readOnly
                style={{ ...inputStyle, background: 'var(--panel-2)', color: 'var(--muted)', cursor: 'default', opacity: .7 }}
              />
            </div>
          </div>

          {/* Ações — dados pessoais */}
          {dirty && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '9px 20px', background: saving ? 'rgba(255,106,0,.5)' : 'var(--accent)',
                  color: '#000', border: 'none', borderRadius: '4px',
                  fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '.875rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                style={{
                  padding: '9px 20px', background: 'transparent',
                  color: 'var(--muted)', border: '1px solid var(--line)', borderRadius: '4px',
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: '.875rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Card — Segurança */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '28px' }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '24px' }}>
            Segurança
          </div>

          {/* Alterar e-mail */}
          <div style={{ marginBottom: '28px', paddingBottom: '28px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ fontWeight: 600, fontSize: '.9rem', marginBottom: '14px' }}>Alterar E-mail</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              <label style={labelStyle}>Novo e-mail</label>
              <input
                type="email" value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder={user?.email}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--line-strong)'}
              />
            </div>
            <button
              onClick={handleUpdateEmail}
              disabled={updatingEmail || !newEmail.trim() || newEmail.trim() === user?.email}
              style={{
                padding: '9px 20px',
                background: (updatingEmail || !newEmail.trim() || newEmail.trim() === user?.email) ? 'rgba(255,106,0,.4)' : 'var(--accent)',
                color: '#000', border: 'none', borderRadius: '4px',
                fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '.875rem',
                cursor: (updatingEmail || !newEmail.trim() || newEmail.trim() === user?.email) ? 'not-allowed' : 'pointer',
              }}
            >
              {updatingEmail ? '...' : 'Atualizar e-mail'}
            </button>
          </div>

          {/* Alterar senha — fluxo inline */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: 600, fontSize: '.9rem', marginBottom: '14px' }}>Alterar Senha</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
              {[
                { label: 'Senha atual', value: currentPwd, setter: setCurrentPwd },
                { label: 'Nova senha', value: newPwd, setter: setNewPwd },
                { label: 'Confirmar nova senha', value: confirmPwd, setter: setConfirmPwd },
              ].map(({ label, value, setter }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle}>{label}</label>
                  <input
                    type="password" value={value}
                    onChange={e => setter(e.target.value)}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--line-strong)'}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleUpdatePassword}
              disabled={updatingPwd || !currentPwd || !newPwd || !confirmPwd}
              style={{
                padding: '9px 20px',
                background: (updatingPwd || !currentPwd || !newPwd || !confirmPwd) ? 'rgba(255,106,0,.4)' : 'var(--accent)',
                color: '#000', border: 'none', borderRadius: '4px',
                fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '.875rem',
                cursor: (updatingPwd || !currentPwd || !newPwd || !confirmPwd) ? 'not-allowed' : 'pointer',
              }}
            >
              {updatingPwd ? '...' : 'Salvar nova senha'}
            </button>
          </div>

          {/* Alterar senha — fluxo por e-mail */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
            <div style={{ fontSize: '.85rem', color: 'var(--muted)', marginBottom: '10px' }}>
              Ou redefina sua senha por e-mail:
            </div>
            <button
              onClick={handleResetPassword}
              disabled={resetCooldown > 0}
              style={{
                padding: '9px 20px', background: 'transparent',
                color: resetCooldown > 0 ? 'var(--muted)' : 'var(--text)',
                border: '1px solid var(--line)', borderRadius: '4px',
                fontFamily: 'Space Grotesk, sans-serif', fontSize: '.875rem',
                cursor: resetCooldown > 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {resetCooldown > 0 ? `Reenviar em ${resetCooldown}s` : 'Enviar link de redefinição por e-mail'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
