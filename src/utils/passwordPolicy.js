export const PASSWORD_REQUIREMENTS = [
  { key: 'minLength', label: 'At least 12 characters' },
  { key: 'hasUppercase', label: 'Uppercase letter (A-Z)' },
  { key: 'hasLowercase', label: 'Lowercase letter (a-z)' },
  { key: 'hasNumber', label: 'Number (0-9)' },
  { key: 'hasSpecialChar', label: 'Special character (!@#$%^&*)' }
];

const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/;

export const validatePasswordStrength = (password = '') => {
  const normalized = typeof password === 'string' ? password : String(password || '');

  const requirements = {
    minLength: normalized.length >= 12,
    hasUppercase: /[A-Z]/.test(normalized),
    hasLowercase: /[a-z]/.test(normalized),
    hasNumber: /\d/.test(normalized),
    hasSpecialChar: SPECIAL_CHAR_REGEX.test(normalized)
  };

  const isStrong = Object.values(requirements).every(Boolean);
  return { isStrong, requirements };
};

export const getPasswordRequirementErrors = (password = '') => {
  const { requirements } = validatePasswordStrength(password);
  return PASSWORD_REQUIREMENTS
    .filter((req) => !requirements[req.key])
    .map((req) => req.label);
};
