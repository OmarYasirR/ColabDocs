// src/utils/validators.js

/**
 * Basic RFC-5322-ish email check — good enough for client-side UX,
 * real validation always happens server-side too.
 */
export const validateEmail = (value) => {
  if (!value) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value.trim());
};

export const validateRequired = (value) => {
  if (typeof value === 'string') return value.trim().length > 0;
  return value !== null && value !== undefined;
};

export const validatePasswordStrength = (value, minLength = 8) => {
  if (!value) return false;
  return value.length >= minLength;
};

export const validateMinLength = (value, min) => {
  if (!value) return false;
  return value.trim().length >= min;
};

export const validateMaxLength = (value, max) => {
  if (!value) return true;
  return value.trim().length <= max;
};

export const validateMatch = (value, otherValue) => value === otherValue;

/**
 * Validates a document title: required, 1-120 chars.
 */
export const validateDocumentTitle = (value) => {
  return validateRequired(value) && validateMaxLength(value, 120);
};

/**
 * Validates an email list (comma or space separated) used in the
 * "Share document" modal.
 */
export const validateEmailList = (value) => {
  if (!validateRequired(value)) return false;
  const emails = value
    .split(/[\s,]+/)
    .map((e) => e.trim())
    .filter(Boolean);
  return emails.length > 0 && emails.every(validateEmail);
};