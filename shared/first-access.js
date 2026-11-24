export const FIRST_ACCESS_PASSWORD_REQUIREMENTS =
  'Use pelo menos 8 caracteres, incluindo uma letra minúscula, uma maiúscula, um número e um símbolo (por exemplo, !@#$%&*()+=).';

/** @param {unknown} password */
export function isStrongFirstAccessPassword(password) {
  return typeof password === 'string'
    && Array.from(password).length >= 8
    && /\p{Ll}/u.test(password)
    && /\p{Lu}/u.test(password)
    && /\p{Nd}/u.test(password)
    && /[\p{P}\p{S}]/u.test(password);
}

/** @param {{ app_metadata?: Record<string, unknown> } | null | undefined} user */
export function requiresFirstAccessPasswordChange(user) {
  return user?.app_metadata?.password_change_required === true;
}
