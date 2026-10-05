# Contributing

Thanks for taking a look at UniTodo. Bug reports, small fixes and new translations are all welcome.

## Run it from source

```bash
npm install
createdb unitodo                 # or use a Neon connection string
export DATABASE_URL_UNPOOLED=postgres://...
npm run migrate
npm run server                   # http://localhost:3000
```

Register an account through the UI, then put your user id into `ADMIN_USER_IDS` and restart to see
the admin panel.

## Tests

```bash
npm test
```

`node --test` runs the whole suite and needs no database. Please run it before opening a pull
request, and add a test for anything that is not purely visual: the translation tables, the
validation rules and the view rendering are all covered there.

## House style

- Comments in English, one line, only where the code is not obvious. No module-wide docstrings that
  explain why a file exists; that belongs in the README.
- Every user-visible string goes through `t('key')` and lives in `i18n/index.js`, never inline in a
  template or a route. A key missing from a translation still renders, it falls back to English.
- Keep the two language tables in the same key order, and add a key to both in the same commit.
- No em dash as a sentence dash in comments, docs or commit subjects; use a comma or a colon.
- One commit per logical change, plain English subject line, no body.

## Reporting a bug

Please include:

- what you did, what you expected and what happened instead,
- the browser and whether you were on the web or the desktop app,
- the server log lines around the failure, with any connection string or token removed.
