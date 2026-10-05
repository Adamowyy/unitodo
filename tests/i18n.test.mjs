// Translation tables, language resolution and the Express middleware.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const i18n = require('../i18n');

const POLISH_DIACRITICS = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;

function fakeRequest({ query = {}, cookies = {}, headers = {} } = {}) {
  return { query, cookies, headers };
}

function fakeResponse() {
  const written = [];
  return {
    locals: {},
    written,
    cookie(name, value, options) { written.push({ name, value, options }); }
  };
}

test('English is the default and the first language of the switcher', () => {
  assert.equal(i18n.DEFAULT_LANGUAGE, 'en');
  assert.deepEqual(i18n.LANGUAGES, ['en', 'pl']);
});

test('both tables carry exactly the same keys', () => {
  const en = Object.keys(i18n.STRINGS.en).sort();
  const pl = Object.keys(i18n.STRINGS.pl).sort();
  const missingInPl = en.filter(key => !pl.includes(key));
  const missingInEn = pl.filter(key => !en.includes(key));
  assert.deepEqual(missingInPl, [], 'keys present in en but not in pl');
  assert.deepEqual(missingInEn, [], 'keys present in pl but not in en');
});

test('no translation is empty or a leftover placeholder', () => {
  for (const lang of i18n.LANGUAGES) {
    for (const [key, value] of Object.entries(i18n.STRINGS[lang])) {
      assert.equal(typeof value, 'string', `${lang}.${key} is not a string`);
      assert.notEqual(value.trim(), '', `${lang}.${key} is empty`);
      assert.notEqual(value.trim(), key, `${lang}.${key} looks like an untranslated key`);
    }
  }
});

test('the English table holds no Polish text', () => {
  for (const [key, value] of Object.entries(i18n.STRINGS.en)) {
    assert.equal(POLISH_DIACRITICS.test(value), false, `en.${key} contains Polish characters`);
  }
});

test('an unknown key falls back to English and then to the key itself', () => {
  assert.equal(i18n.translate('pl', 'common.save'), 'Zapisz');
  assert.equal(i18n.translate('de', 'common.save'), 'Save');
  assert.equal(i18n.translate('en', 'nope.missing'), 'nope.missing');
});

test('parameters are interpolated and a missing one is left in place', () => {
  const text = i18n.translate('en', 'tasks.show_next', { count: 3, remaining: 7 });
  assert.match(text, /3/);
  assert.match(text, /7/);
  assert.match(i18n.translate('en', 'admin.reset_confirm', { username: 'bob' }), /bob\?$/);
  assert.match(i18n.translate('en', 'tasks.show_next', { count: 3 }), /\{remaining\}/);
});

test('language values are normalised, unknown ones are rejected', () => {
  assert.equal(i18n.normalizeLanguage('pl'), 'pl');
  assert.equal(i18n.normalizeLanguage('PL-pl'), 'pl');
  assert.equal(i18n.normalizeLanguage(' en-GB '), 'en');
  assert.equal(i18n.normalizeLanguage('de'), null);
  assert.equal(i18n.normalizeLanguage(undefined), null);
  assert.equal(i18n.isLanguage('pl'), true);
  assert.equal(i18n.isLanguage('de'), false);
});

test('?lang= wins over the cookie, which wins over Accept-Language', () => {
  const fromQuery = i18n.resolveLanguage(fakeRequest({
    query: { lang: 'pl' }, cookies: { lang: 'en' }, headers: { 'accept-language': 'en-GB,en;q=0.9' }
  }));
  assert.deepEqual(fromQuery, { lang: 'pl', explicit: true });

  const fromCookie = i18n.resolveLanguage(fakeRequest({
    cookies: { lang: 'pl' }, headers: { 'accept-language': 'en-GB' }
  }));
  assert.deepEqual(fromCookie, { lang: 'pl', explicit: false });

  const fromHeader = i18n.resolveLanguage(fakeRequest({
    headers: { 'accept-language': 'pl-PL,pl;q=0.9,en;q=0.5' }
  }));
  assert.deepEqual(fromHeader, { lang: 'pl', explicit: false });

  const fallback = i18n.resolveLanguage(fakeRequest({
    cookies: { lang: 'de' }, headers: { 'accept-language': 'de-DE' }
  }));
  assert.deepEqual(fallback, { lang: 'en', explicit: false });
});

test('client strings are handed over without their prefix', () => {
  const strings = i18n.clientStrings('en');
  assert.equal(strings.sync_new_changes, i18n.STRINGS.en['client.sync_new_changes']);
  assert.equal(Object.keys(strings).some(key => key.startsWith('client.')), false);
  assert.ok(Object.keys(strings).length >= 5);
});

test('the middleware fills the locals and remembers an explicit choice', () => {
  const req = fakeRequest({ query: { lang: 'pl' } });
  const res = fakeResponse();
  let called = false;
  i18n.middleware(req, res, () => { called = true; });

  assert.equal(called, true);
  assert.equal(req.lang, 'pl');
  assert.equal(req.t('common.save'), 'Zapisz');
  assert.equal(res.locals.lang, 'pl');
  assert.equal(res.locals.locale, 'pl-PL');
  assert.equal(res.locals.t('common.cancel'), 'Anuluj');
  assert.equal(res.locals.clientStrings.sync_new_changes, i18n.STRINGS.pl['client.sync_new_changes']);
  assert.equal(res.written.length, 1);
  assert.equal(res.written[0].name, i18n.COOKIE_NAME);
  assert.equal(res.written[0].value, 'pl');
});

test('an implicit choice does not rewrite the cookie', () => {
  const req = fakeRequest({ headers: { 'accept-language': 'en-GB' } });
  const res = fakeResponse();
  i18n.middleware(req, res, () => {});
  assert.equal(res.written.length, 0);
  assert.equal(res.locals.lang, 'en');
});

test('every key used in the views, routes and client code is defined', () => {
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.git', 'dist', 'tests', 'i18n'].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ejs|js)$/.test(entry.name)) files.push(full);
    }
  };
  walk(ROOT);

  const used = new Set();
  for (const file of files) {
    for (const match of fs.readFileSync(file, 'utf8').matchAll(/\bt\(\s*'([a-zA-Z][a-zA-Z0-9_.]*)'/g)) {
      used.add(match[1]);
    }
  }

  assert.ok(used.size > 40, `only ${used.size} keys found, the scan is probably broken`);
  // Inline scripts ask for the client table without its prefix, so both forms count
  const defined = (key) => Boolean(i18n.STRINGS.en[key] || i18n.STRINGS.en[`client.${key}`]);
  const missing = [...used].filter(key => !defined(key));
  assert.deepEqual(missing, [], 'translation keys used but not defined');
});
