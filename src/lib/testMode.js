// Test mode utility — shared between admin and client
const KEY = 'bf_test_mode';

export function isTestMode() {
  return localStorage.getItem(KEY) === 'true';
}

export function setTestMode(val) {
  localStorage.setItem(KEY, val ? 'true' : 'false');
}

export function toggleTestMode() {
  const next = !isTestMode();
  setTestMode(next);
  return next;
}