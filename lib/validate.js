// Form validation shared by the auth routes and the tests.

const USERNAME_MIN = 3;
const USERNAME_MAX = 30;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 100;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

/** Returns an error key for a bad username, null when it is acceptable. */
function validateUsername(username) {
  if (!username || typeof username !== 'string') return 'error.username_required';
  const trimmed = username.trim();
  if (trimmed.length < USERNAME_MIN) return 'error.username_too_short';
  if (trimmed.length > USERNAME_MAX) return 'error.username_too_long';
  if (!USERNAME_PATTERN.test(trimmed)) return 'error.username_charset';
  return null;
}

/** Returns an error key for a bad password, null when it is acceptable. */
function validatePassword(password) {
  if (!password || typeof password !== 'string') return 'error.password_required';
  if (password.length < PASSWORD_MIN) return 'error.password_too_short';
  if (password.length > PASSWORD_MAX) return 'error.password_too_long';
  return null;
}

module.exports = {
  USERNAME_MIN,
  USERNAME_MAX,
  PASSWORD_MIN,
  PASSWORD_MAX,
  validateUsername,
  validatePassword
};
