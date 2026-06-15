# UniTodo

Wieloosobowa aplikacja do zarządzania projektami — grupy, notatki, zadania z podzadaniami i priorytetami.

🌐 **Online:** https://example.com
🖥️ **Desktop:** Electron wrapper (exe)

## Funkcje

- **Grupy projektów** — organizuj zadania i notatki w osobnych grupach
- **Współdzielenie** — zaproś znajomych przez kod zaproszenia
- **Konta użytkowników** — rejestracja/login (JWT)
- **Notatki** — notatki tekstowe w ramach grupy
- **Zadania Kanban** — tablica Todo / W trakcie / Zrobione z drag & drop
- **Podzadania** — rozbijaj zadania na mniejsze kroki, edytuj
- **Priorytety** — 4 poziomy: brak, niski, średni, wysoki
- **Terminy** — date picker, overdue podświetlane na czerwono ⚠️
- **Wyszukiwarka** — full-text search po tytułach i treści
- **Sortowanie i filtrowanie** — po priorytecie, terminie, statusie
- **Dark mode** — domyślnie ciemny motyw 🌙

## Tech stack

- **Frontend:** EJS + Tailwind CSS (CDN)
- **Backend:** Express na Vercel (serverless)
- **Baza:** Neon PostgreSQL (serverless)
- **Auth:** JWT (jsonwebtoken + bcryptjs)
- **Desktop:** Electron (ładuje Vercel URL)
- **Build:** electron-builder → NSIS installer (.exe)

## Uruchomienie lokalne

```bash
npm install
vercel dev        # potrzebne .env.local (vercel env pull)
```

## Desktop

```bash
npm start         # Electron ładuje https://example.com
npm run build     # Buduje instalator .exe → dist/
```

## Deploy

Auto-deploy przez Vercel + GitHub — każdy commit na `main` = production deploy.
