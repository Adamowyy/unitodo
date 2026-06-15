# UniTodo

Desktopowa aplikacja do zarządzania projektami — grupy, notatki, zadania z podzadaniami i priorytetami.

## Funkcje

- **Grupy projektów** — organizuj zadania i notatki w osobnych grupach
- **Notatki** — notatki tekstowe w ramach grupy
- **Zadania Kanban** — tablica Todo / W trakcie / Zrobione z drag & drop
- **Podzadania** — rozbijaj zadania na mniejsze kroki
- **Priorytety** — 4 poziomy: brak, niski, średni, wysoki
- **Terminy** — ustawiaj daty wykonania, overdue podświetlane na czerwono
- **Wyszukiwarka** — full-text search po tytułach i treści
- **Sortowanie i filtrowanie** — po priorytecie, terminie, statusie
- **Dark mode** — przełącznik jasny/ciemny motyw

## Tech stack

- **Electron** — desktop wrapper
- **Express** — serwer HTTP
- **EJS** — server-side rendering
- **SQLite** (better-sqlite3) — lokalna baza danych
- **Tailwind CSS** (CDN) — stylowanie

## Instalacja

```bash
npm install
```

## Uruchomienie

```bash
# Desktop (Electron)
npm start

# Tylko serwer (przeglądarka)
npm run server
# Otwórz http://localhost:3000
```

## Build

```bash
npm run build
# Output: dist/
```

## Struktura projektu

```
unitodo/
├── electron-main.js    # Electron main process
├── server.js           # Express server
├── routes/
│   ├── index.js        # Grupy (dashboard)
│   ├── notes.js        # Notatki
│   └── tasks.js        # Zadania + podzadania
├── views/
│   ├── layout.ejs      # Główny layout
│   ├── index.ejs       # Dashboard grup
│   ├── notes.ejs       # Lista notatek
│   ├── tasks.ejs       # Kanban zadań
│   └── partials/       # Komponenty
├── db/
│   └── schema.js       # Inicjalizacja SQLite
├── public/
│   └── app.js          # Frontend JS
└── data/               # Baza SQLite (gitignored)
```
