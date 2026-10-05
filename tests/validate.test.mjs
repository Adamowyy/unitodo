// Validation rules shared by the auth routes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { validateUsername, validatePassword, USERNAME_MAX, PASSWORD_MIN } = require('../lib/validate');

test('a well formed username is accepted', () => {
  assert.equal(validateUsername('adam'), null);
  assert.equal(validateUsername('adam_01'), null);
  assert.equal(validateUsername('  padded  '), null);
  assert.equal(validateUsername('a'.repeat(USERNAME_MAX)), null);
});

test('a bad username names the rule it breaks', () => {
  assert.equal(validateUsername(''), 'error.username_required');
  assert.equal(validateUsername(null), 'error.username_required');
  assert.equal(validateUsername(42), 'error.username_required');
  assert.equal(validateUsername('ab'), 'error.username_too_short');
  assert.equal(validateUsername('a'.repeat(USERNAME_MAX + 1)), 'error.username_too_long');
  assert.equal(validateUsername('adam owy'), 'error.username_charset');
  assert.equal(validateUsername('adam@example.com'), 'error.username_charset');
  assert.equal(validateUsername('ąćęł'), 'error.username_charset');
});

test('a usable password is accepted', () => {
  assert.equal(validatePassword('secret1'), null);
  assert.equal(validatePassword('a'.repeat(PASSWORD_MIN)), null);
});

test('a bad password names the rule it breaks', () => {
  assert.equal(validatePassword(''), 'error.password_required');
  assert.equal(validatePassword(undefined), 'error.password_required');
  assert.equal(validatePassword('12345'), 'error.password_too_short');
  assert.equal(validatePassword('a'.repeat(101)), 'error.password_too_long');
});

test('every rule it can return exists in both translation tables', () => {
  const { STRINGS } = require('../i18n');
  const keys = [
    validateUsername(''), validateUsername('ab'), validateUsername('a'.repeat(USERNAME_MAX + 1)),
    validateUsername('adam owy'), validatePassword(''), validatePassword('12345'), validatePassword('a'.repeat(101))
  ];
  for (const key of keys) {
    assert.ok(STRINGS.en[key], `${key} is missing from the English table`);
    assert.ok(STRINGS.pl[key], `${key} is missing from the Polish table`);
  }
});
