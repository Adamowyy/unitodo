// Every view is rendered in both languages with stub data.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ejs = require('ejs');
const i18n = require('../i18n');

const POLISH_DIACRITICS = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
// Built from parts on purpose: a history rewrite that scrubs these words from
// the repo must not be able to hollow out the guard itself.
const PERSONAL_DATA = new RegExp(['ver' + 'cel\\.app', 'war' + 'zecha', 'ada' + 'mowy'].join('|'), 'i');

const group = {
  id: 1, name: 'Group', description: 'Desc', role: 'owner', category: 'Work',
  invite_code: 'abc', member_count: 2, note_count: 1, todo_count: 1, in_progress_count: 0
};
const user = { id: 1, username: 'tester' };
const task = {
  id: 1, title: 'Task', content: 'Body', priority: 3, status: 'todo',
  due_date: '2026-01-01', assigned_to: 2, is_completed: 0
};

const CASES = [
  { name: 'index', locals: { view: 'index', categories: { Work: [group] }, groups: [group], uncategorized: 'Uncategorized' } },
  { name: 'tasks', locals: { view: 'tasks', group, members: [user], todoTasks: [task], inProgressTasks: [], doneTasks: [task], subtasksByParent: { 1: [{ id: 9, title: 'Sub', is_completed: 0, parent_id: 1 }] }, reactionsByTask: { 1: [{ emoji: '👍', count: 2 }] }, query: '', sort: 'created_desc', filter_priority: 0, filter_status: '', hideDone: false } },
  { name: 'notes', locals: { view: 'notes', group, notes: [{ id: 1, title: 'Note', content: 'Text', author: 'tester', created_at: new Date() }], commentsByNote: { 1: [{ id: 2, author: 'tester', content: 'hi' }] }, members: [user], query: '' } },
  { name: 'members', locals: { view: 'members', group, members: [user] } },
  { name: 'admin', locals: { view: 'admin', stats: { totalUsers: 1, totalGroups: 1, totalItems: 1, dailyRegistrations: [{ day: '2026-01-01', count: 1 }], recentUsers: [{ id: 1, username: 'tester', created_at: new Date() }] } } },
  { name: 'privacy', locals: { view: 'privacy' } },
  { name: 'login', locals: { view: 'login', error: null } },
  { name: 'register', locals: { view: 'register', error: null } },
  { name: 'change-password', locals: { view: 'change-password', error: null, force_password_change: true } },
  { name: 'not-found', locals: { view: 'not-found' } }
];

function baseLocals(lang, caseLocals) {
  return Object.assign({
    title: 'Title',
    t: (key, params) => i18n.translate(lang, key, params),
    lang,
    locale: i18n.LOCALES[lang],
    languages: i18n.LANGUAGES,
    clientStrings: i18n.clientStrings(lang),
    user,
    isAdmin: true,
    instanceUrl: 'https://example.test',
    instanceHost: 'example.test'
  }, caseLocals);
}

function render(lang, caseLocals) {
  return ejs.renderFile(path.join(ROOT, 'views/layout.ejs'), baseLocals(lang, caseLocals));
}

for (const testCase of CASES) {
  for (const lang of i18n.LANGUAGES) {
    test(`${testCase.name} renders in ${lang}`, async () => {
      const html = await render(lang, testCase.locals);
      assert.ok(html.includes('<!DOCTYPE html>'));
      assert.ok(html.includes(`<html lang="${lang}">`));
      assert.ok(html.length > 500, 'the page looks empty');
      if (lang === 'en') {
        assert.equal(POLISH_DIACRITICS.test(html), false, 'English page contains Polish text');
      }
    });
  }
}

test('the layout offers a switcher entry for every language', async () => {
  const html = await render('en', CASES[0].locals);
  for (const lang of i18n.LANGUAGES) {
    assert.ok(html.includes(`?lang=${lang}`), `the switcher is missing ${lang}`);
  }
});

test('the English dashboard is English, the Polish one is Polish', async () => {
  assert.match(await render('en', CASES[0].locals), /My groups/);
  assert.match(await render('pl', CASES[0].locals), /Moje grupy/);
});

test('no view leaks a personal name or a private deployment address', async () => {
  for (const testCase of CASES) {
    for (const lang of i18n.LANGUAGES) {
      const html = await render(lang, testCase.locals);
      assert.equal(PERSONAL_DATA.test(html), false, `${testCase.name} (${lang}) contains personal data`);
    }
  }
});

test('the front-end gets its strings through window.I18N', async () => {
  const html = await render('en', CASES[0].locals);
  assert.match(html, /window\.I18N = \{/);
  assert.match(html, /sync_new_changes/);
});
