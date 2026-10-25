# Plockpoäng

Personlig app (PWA) för att hålla koll på plockpoäng och månadens takt mot maxbonus (240 p/h).

- 1 poäng per hylla + 1 poäng per kolli.
- Månadens takt = alla plockpoäng ÷ alla plocktimmar under kalendermånaden.
- All data sparas bara i telefonens webbläsare (`localStorage`).

## Installera på Android

Öppna appens adress i Chrome → meny ⋮ → **Installera app**. Appen fungerar sedan offline.

## Utveckling

```bash
npm install
npm run dev     # utvecklingsserver
npm test        # tester (Vitest)
npm run build   # produktionsbygge till dist/
```

Pushar till `main` byggs, testas och publiceras automatiskt till GitHub Pages
(`.github/workflows/deploy.yml`).

Design: `docs/superpowers/specs/2026-10-25-plockpoang-pwa-design.md`
