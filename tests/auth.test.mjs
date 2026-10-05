// JWT helpers: signing, verification and the production secret guard.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken');
const auth = require('../auth');

test('a token carries the user id and verifies with the same secret', () => {
  const token = auth.generateToken(42);
  const decoded = jwt.verify(token, auth.JWT_SECRET);
  assert.equal(decoded.userId, 42);
  assert.ok(decoded.exp > decoded.iat);
});

test('a token signed with another secret is rejected', () => {
  const forged = jwt.sign({ userId: 1 }, 'not-the-real-secret');
  assert.throws(() => jwt.verify(forged, auth.JWT_SECRET));
});

test('isAdmin only accepts configured ids', () => {
  assert.equal(typeof auth.isAdmin(1), 'boolean');
  assert.equal(auth.isAdmin(-1), false);
});

test('the secret comes from the environment when it is set', (t) => {
  const saved = { secret: process.env.JWT_SECRET, env: process.env.NODE_ENV, vercel: process.env.VERCEL };
  t.after(() => {
    if (saved.secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = saved.secret;
    if (saved.env === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = saved.env;
    if (saved.vercel === undefined) delete process.env.VERCEL; else process.env.VERCEL = saved.vercel;
  });

  process.env.JWT_SECRET = 'from-the-environment';
  assert.equal(auth.resolveJwtSecret(), 'from-the-environment');
});

test('production without a secret stops the app instead of guessing', (t) => {
  const saved = { secret: process.env.JWT_SECRET, env: process.env.NODE_ENV };
  t.after(() => {
    if (saved.secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = saved.secret;
    if (saved.env === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = saved.env;
  });

  delete process.env.JWT_SECRET;
  process.env.NODE_ENV = 'production';
  assert.throws(() => auth.resolveJwtSecret(), /JWT_SECRET is required/);
});

test('local development falls back to the development secret', (t) => {
  const saved = { secret: process.env.JWT_SECRET, env: process.env.NODE_ENV, vercel: process.env.VERCEL };
  t.after(() => {
    if (saved.secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = saved.secret;
    if (saved.env === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = saved.env;
    if (saved.vercel === undefined) delete process.env.VERCEL; else process.env.VERCEL = saved.vercel;
  });

  delete process.env.JWT_SECRET;
  delete process.env.NODE_ENV;
  delete process.env.VERCEL;
  assert.equal(auth.resolveJwtSecret(), auth.JWT_SECRET);
  assert.equal(auth.JWT_SECRET.includes('dev'), true, 'the fallback must be recognisable as development only');
});
