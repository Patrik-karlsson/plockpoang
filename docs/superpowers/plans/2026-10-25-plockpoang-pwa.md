# Plockpoäng PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An installable, offline Android PWA in Swedish that logs picking points per shelf stop and shows the month's points-per-hour against the 240 p/h max-bonus ceiling.

**Architecture:** Pure TypeScript domain layer (`src/domain/`, no DOM, `now` passed in) for scoring, session operations and records; a thin `localStorage` adapter; Preact screens on top. `app.tsx` owns state, saves after every change and ticks a 1-second clock. Built with Vite, made installable/offline by `vite-plugin-pwa`, deployed to GitHub Pages by GitHub Actions.

**Tech Stack:** Node 26 / npm 11, Vite, TypeScript (strict), Preact (`@preact/preset-vite`), vite-plugin-pwa, `@vite-pwa/assets-generator`, Vitest, jsdom, `@testing-library/preact`.

**Spec:** `docs/superpowers/specs/2026-10-25-plockpoang-pwa-design.md`

## Global Constraints

- All UI text is Swedish, using the exact copy given in the spec and in this plan.
- 240 p/h is the max-bonus ceiling, never a pass/fail line: no red/failure colours, no "missed"/"under" wording anywhere.
- Bonus thresholds and durations live only in `src/domain/constants.ts`: `BONUS_START = 205`, `BONUS_MAX = 240`, `MIN_PACE_MS = 5 min`, `QUALIFYING_SESSION_MS = 1 h`, `QUALIFYING_MONTH_MS = 8 h`, `STALE_SESSION_MS = 12 h`, `MAX_MANUAL_MS = 16 h`.
- Points: a stop is worth `kolli + 1`. Month figure = Σ points ÷ Σ active hours over all `plock` sessions whose month key matches (calendar month, local time, month of start).
- `src/domain/` must not import Preact, touch the DOM or read the clock; every time-dependent function takes `now: number` (epoch ms).
- Domain operations are immutable: they return new objects and never mutate their inputs.
- No server, no accounts, no analytics; data lives only in `localStorage`.
- Dark theme, high contrast, touch targets ≥ 64 px tall for the main buttons, portrait layout with primary buttons in the lower half.
- Tests run with `TZ=Europe/Stockholm` (set in the `test` npm script) so local-time assertions are deterministic. Test timestamps use Oct 20 2026 unless a test is specifically about month boundaries (DST ends Oct 25 2026).
- Commit after every task. Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Night shifts / planned end earlier than now:** entering "06:00" when starting at 22:00 must mean tomorrow 06:00, not a time in the past. Pinned in Task 6 (`parsePlannedEnd`).
2. **Live session crossing midnight on the last day of the month:** the picking screen must keep showing the month the session started in, not jump to the new month. Pinned in Task 2 (`monthStats`) and Task 7 (PickScreen uses `monthKey(active)`).
3. **Odd keypad input:** empty, `0` kolli, leading zeros, very long numbers. Confirm is disabled for invalid input and input is capped at 4 digits. Pinned in Task 8.
4. **`localStorage` write fails** (storage full, blocked): the app must not crash and must show *"Kunde inte spara – data kan gå förlorad"*. Pinned in Task 5 (`saveState` returns `false`) and Task 7 (banner).
5. **Planned end only seconds away:** "hold X p/h" would show absurd numbers; with < 1 minute left the status falls back to the month delta. Pinned in Task 2 (`holdToday`).

---

### Task 1: Project scaffold, domain types and constants

**Files:**
- Create: project via Vite `preact-ts` template in `/home/patrik/Dagab` (keep existing `docs/`)
- Create: `src/domain/types.ts`, `src/domain/constants.ts`, `src/domain/test-helpers.ts`
- Modify: `package.json`, `vite.config.ts`, `tsconfig*.json`, `.gitignore`
- Delete: template demo content (`src/app.css`, counter demo, `src/assets/preact.svg`, `public/vite.svg`)

**Interfaces:**
- Produces (`src/domain/types.ts`): `SessionType = 'plock'`; `PauseReason = 'systemfel' | 'mote' | 'olycka' | 'annat'`; `Entry`, `Pause`, `LiveSession`, `ManualSession`, `Session = LiveSession | ManualSession`, `StoredState` — exactly as in the spec's Data model section.
- Produces (`src/domain/constants.ts`): the seven constants from Global Constraints, in ms where they are durations; plus `HOUR_MS = 3_600_000`, `MINUTE_MS = 60_000`.
- Produces (`src/domain/test-helpers.ts`, test-only):
  - `t(h: number, m = 0, d = 20, mo = 10): number` → `new Date(2026, mo - 1, d, h, m).getTime()`
  - `live(p: Partial<LiveSession> = {}): LiveSession` (defaults: `source:'live'`, `id:'s1'`, `type:'plock'`, `startedAt: t(6)`, `entries: []`, `pauses: []`)
  - `manual(p: Partial<ManualSession> = {}): ManualSession` (defaults: `source:'manual'`, `id:'m1'`, `type:'plock'`, `date:'2026-10-20'`, `activeMs: 4 * HOUR_MS`, `points: 900`)
  - `stops(...kolli: number[]): Entry[]` → stop entries at `t(7)`

- [ ] **Step 1: Scaffold**

```bash
cd /home/patrik/Dagab
npm create vite@latest scaffold -- --template preact-ts
cp -r scaffold/. . && rm -rf scaffold
npm install
npm install -D vitest jsdom @testing-library/preact vite-plugin-pwa @vite-pwa/assets-generator
```

- [ ] **Step 2: Configure scripts and test environment**

`package.json` scripts: `"dev": "vite"`, `"build": "tsc -b && vite build"`, `"preview": "vite preview"`, `"test": "TZ=Europe/Stockholm vitest run"`, `"test:watch": "TZ=Europe/Stockholm vitest"`. In `vite.config.ts` add a `test` block (`environment: 'node'`, `include: ['src/**/*.test.{ts,tsx}']`) and `base: command === 'build' ? '/plockpoang/' : '/'` (use the function form of `defineConfig`). UI test files opt into jsdom with a `// @vitest-environment jsdom` first line. Set `<html lang="sv">` and `<title>Plockpoäng</title>` in `index.html`. Replace the demo `app.tsx` with a placeholder component rendering `Plockpoäng`.

- [ ] **Step 3: Write `types.ts`, `constants.ts`, `test-helpers.ts`** per the Interfaces block.

- [ ] **Step 4: Verify**

Run: `npm run build && npx vitest run --passWithNoTests`
Expected: build succeeds with no type errors; vitest exits 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: scaffold Vite + Preact + TS project with domain types"
```

---

### Task 2: Scoring (`src/domain/scoring.ts`)

**Files:**
- Create: `src/domain/scoring.ts`
- Test: `src/domain/scoring.test.ts`

**Interfaces:**
- Consumes: types, constants, test helpers from Task 1.
- Produces:
  - `sessionPoints(s: Session): number`
  - `sessionActiveMs(s: Session, now: number): number`
  - `sessionCounts(s: LiveSession): { stops: number; kolli: number }`
  - `pace(points: number, activeMs: number, minMs = MIN_PACE_MS): number | undefined` — undefined if `activeMs <= 0` or `activeMs < minMs`
  - `monthKeyOf(ts: number): string` (local `'YYYY-MM'`)
  - `monthKey(s: Session): string`
  - `interface Stats { points: number; activeMs: number; pace: number | undefined }`
  - `totals(sessions: Session[], now: number): Stats`
  - `monthStats(sessions: Session[], key: string, now: number): Stats`
  - `monthDelta(stats: Stats): number` = points − `BONUS_MAX` × hours
  - `type HoldToday = { kind: 'reached' } | { kind: 'pace'; requiredPace: number }`
  - `holdToday(stats: Stats, plannedEndAt: number | undefined, now: number): HoldToday | undefined`
  - `type PaceLevel = 'unknown' | 'below' | 'bonus' | 'max'`; `paceLevel(p: number | undefined): PaceLevel`

- [ ] **Step 1: Write the failing tests**

```ts
const H = HOUR_MS;
test('sessionPoints sums kolli+1 per stop plus adjustments', () => {
  const s = live({ entries: [...stops(1, 2, 5), { kind: 'adjust', points: -3, at: t(8) }] });
  expect(sessionPoints(s)).toBe(8);
  expect(sessionPoints(manual({ points: 500 }))).toBe(500);
});
test('sessionActiveMs subtracts closed pauses', () => {
  const s = live({ endedAt: t(10), pauses: [{ start: t(7), end: t(7, 30), reason: 'mote' }] });
  expect(sessionActiveMs(s, t(12))).toBe(3.5 * H);
});
test('open pause counts until now while active', () => {
  const s = live({ pauses: [{ start: t(9), reason: 'systemfel' }] });
  expect(sessionActiveMs(s, t(10))).toBe(3 * H);
});
test('open pause on an ended session counts until endedAt', () => {
  const s = live({ endedAt: t(10), pauses: [{ start: t(9, 30), reason: 'annat' }] });
  expect(sessionActiveMs(s, t(12))).toBe(3.5 * H);
});
test('manual active time is stored value', () => {
  expect(sessionActiveMs(manual({ activeMs: 2 * H }), t(12))).toBe(2 * H);
});
test('sessionCounts', () => {
  expect(sessionCounts(live({ entries: stops(1, 2, 5) }))).toEqual({ stops: 3, kolli: 8 });
});
test('pace', () => {
  expect(pace(480, 2 * H)).toBe(240);
  expect(pace(10, 4 * MINUTE_MS)).toBeUndefined();
  expect(pace(10, 4 * MINUTE_MS, 0)).toBe(150);
  expect(pace(0, 0, 0)).toBeUndefined();
});
test('monthKey uses local start date, across month boundary', () => {
  expect(monthKey(live({ startedAt: t(23, 30, 31, 10) }))).toBe('2026-10');
  expect(monthKey(live({ startedAt: t(0, 30, 1, 11) }))).toBe('2026-11');
  expect(monthKey(manual({ date: '2026-09-30' }))).toBe('2026-09');
});
test('monthStats combines live and manual sessions of that month only', () => {
  const sessions = [
    manual({ id: 'a', date: '2026-10-01', activeMs: 4 * H, points: 900 }),
    live({ id: 'b', endedAt: t(10), entries: [{ kind: 'adjust', points: 960, at: t(9) }] }),
    manual({ id: 'c', date: '2026-09-30', activeMs: 4 * H, points: 1000 }),
  ];
  expect(monthStats(sessions, '2026-10', t(12))).toEqual({ points: 1860, activeMs: 8 * H, pace: 232.5 });
});
test('active session crossing midnight stays in its start month', () => {
  const s = live({ startedAt: t(23, 0, 31, 10), entries: [{ kind: 'adjust', points: 480, at: t(0, 30, 1, 11) }] });
  const now = t(1, 0, 1, 11);
  expect(monthStats([s], '2026-10', now)).toEqual({ points: 480, activeMs: 2 * H, pace: 240 });
  expect(monthStats([s], '2026-11', now).pace).toBeUndefined();
});
test('monthDelta', () => {
  expect(monthDelta({ points: 1860, activeMs: 8 * H, pace: 232.5 })).toBe(-60);
});
test('holdToday', () => {
  const stats = { points: 1860, activeMs: 8 * H, pace: 232.5 };
  expect(holdToday(stats, t(12), t(10))).toEqual({ kind: 'pace', requiredPace: 270 });
  expect(holdToday({ ...stats, points: 2500 }, t(12), t(10))).toEqual({ kind: 'reached' });
  expect(holdToday(stats, t(9), t(10))).toBeUndefined();
  expect(holdToday(stats, undefined, t(10))).toBeUndefined();
  expect(holdToday(stats, t(10) + 30_000, t(10))).toBeUndefined(); // < 1 min left
});
test('paceLevel', () => {
  expect(paceLevel(undefined)).toBe('unknown');
  expect(paceLevel(204.9)).toBe('below');
  expect(paceLevel(205)).toBe('bonus');
  expect(paceLevel(239.9)).toBe('bonus');
  expect(paceLevel(240)).toBe('max');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/domain/scoring.test.ts`
Expected: FAIL (module/exports missing).

- [ ] **Step 3: Implement `scoring.ts`** per Interfaces and the spec's Calculations section. `holdToday`: r = (plannedEndAt − now) in hours; return undefined when `plannedEndAt` is undefined or `plannedEndAt − now < MINUTE_MS`; needed = `BONUS_MAX × (stats hours + r) − stats.points`; `needed <= 0` → `reached`, else `requiredPace = needed / r`. `monthKey` for manual takes `date.slice(0, 7)`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/domain/scoring.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain && git commit -m "feat: scoring, pace and month statistics"
```

---

### Task 3: Session operations (`src/domain/session.ts`)

**Files:**
- Create: `src/domain/session.ts`
- Test: `src/domain/session.test.ts`

**Interfaces:**
- Consumes: types, constants, `sessionPoints` (Task 2).
- Produces:
  - `startSession(now: number, id: string, plannedEndAt?: number): LiveSession`
  - `addStop(s: LiveSession, kolli: number, now: number): LiveSession` — throws `RangeError` unless `kolli` is an integer ≥ 1
  - `setTotal(s: LiveSession, total: number, now: number): LiveSession` — throws `RangeError` unless integer ≥ 0; returns `s` unchanged if difference is 0
  - `undo(s: LiveSession): LiveSession`
  - `isPaused(s: LiveSession): boolean`
  - `pauseSession(s: LiveSession, reason: PauseReason, now: number): LiveSession` — unchanged if already paused
  - `resumeSession(s: LiveSession, now: number): LiveSession` — unchanged if not paused
  - `endSession(s: LiveSession, now: number): LiveSession` — closes an open pause at `now`
  - `editTimes(s: LiveSession, startedAt: number, endedAt: number): LiveSession` — throws `RangeError` if `startedAt >= endedAt`; clamps every pause to `[startedAt, endedAt]` and drops those whose clamped length is 0
  - `interface ManualInput { date: string; activeMs: number; points: number }`
  - `validateManual(input: ManualInput, today: string): string | undefined` — Swedish error message or undefined
  - `createManual(input: ManualInput, id: string): ManualSession`
  - `activeSession(state: StoredState): LiveSession | undefined`
  - `upsertSession(state: StoredState, s: Session): StoredState` — replace by id, else append
  - `deleteSession(state: StoredState, id: string): StoredState`

- [ ] **Step 1: Write the failing tests**

```ts
test('startSession', () => {
  expect(startSession(t(6), 'a', t(14))).toEqual({
    source: 'live', id: 'a', type: 'plock', startedAt: t(6), plannedEndAt: t(14), entries: [], pauses: [],
  });
});
test('addStop appends without mutating and validates kolli', () => {
  const s = live();
  const s2 = addStop(s, 1, t(7));
  expect(s2.entries).toEqual([{ kind: 'stop', kolli: 1, at: t(7) }]);
  expect(s.entries).toEqual([]);
  expect(() => addStop(s, 0, t(7))).toThrow(RangeError);
  expect(() => addStop(s, 1.5, t(7))).toThrow(RangeError);
});
test('setTotal stores the difference as an adjustment', () => {
  const s = live({ entries: stops(1, 2) }); // 5 p
  expect(setTotal(s, 20, t(8)).entries.at(-1)).toEqual({ kind: 'adjust', points: 15, at: t(8) });
  expect(setTotal(s, 3, t(8)).entries.at(-1)).toEqual({ kind: 'adjust', points: -2, at: t(8) });
  expect(setTotal(s, 5, t(8))).toBe(s);
  expect(() => setTotal(s, -1, t(8))).toThrow(RangeError);
});
test('undo removes the last entry; no-op when empty', () => {
  expect(undo(live({ entries: stops(1, 2) })).entries).toEqual(stops(1));
  expect(undo(live()).entries).toEqual([]);
});
test('pause and resume', () => {
  const p = pauseSession(live(), 'mote', t(8));
  expect(isPaused(p)).toBe(true);
  expect(pauseSession(p, 'annat', t(9))).toBe(p);
  const r = resumeSession(p, t(8, 20));
  expect(r.pauses).toEqual([{ start: t(8), end: t(8, 20), reason: 'mote' }]);
  expect(isPaused(r)).toBe(false);
  expect(resumeSession(r, t(9))).toBe(r);
});
test('endSession closes an open pause', () => {
  const s = endSession(pauseSession(live(), 'olycka', t(9)), t(10));
  expect(s.endedAt).toBe(t(10));
  expect(s.pauses[0].end).toBe(t(10));
});
test('editTimes clips pauses to the new range', () => {
  const s = live({ endedAt: t(14), pauses: [
    { start: t(6, 30), end: t(7), reason: 'mote' },
    { start: t(13), end: t(13, 45), reason: 'systemfel' },
  ] });
  const e = editTimes(s, t(7), t(13, 30));
  expect([e.startedAt, e.endedAt]).toEqual([t(7), t(13, 30)]);
  expect(e.pauses).toEqual([{ start: t(13), end: t(13, 30), reason: 'systemfel' }]);
  expect(() => editTimes(s, t(14), t(14))).toThrow(RangeError);
});
test('validateManual', () => {
  const ok = { date: '2026-10-20', activeMs: 4 * HOUR_MS, points: 900 };
  expect(validateManual(ok, '2026-10-25')).toBeUndefined();
  expect(validateManual({ ...ok, date: '2026-10-26' }, '2026-10-25')).toBe('Datumet kan inte vara i framtiden');
  expect(validateManual({ ...ok, activeMs: 0 }, '2026-10-25')).toBe('Plocktiden måste vara mer än 0');
  expect(validateManual({ ...ok, activeMs: 17 * HOUR_MS }, '2026-10-25')).toBe('Plocktiden kan vara högst 16 h');
  expect(validateManual({ ...ok, points: -1 }, '2026-10-25')).toBe('Poängen måste vara ett heltal, 0 eller mer');
  expect(validateManual({ ...ok, points: 1.5 }, '2026-10-25')).toBe('Poängen måste vara ett heltal, 0 eller mer');
});
test('createManual', () => {
  expect(createManual({ date: '2026-10-20', activeMs: HOUR_MS, points: 250 }, 'm9')).toEqual({
    source: 'manual', id: 'm9', type: 'plock', date: '2026-10-20', activeMs: HOUR_MS, points: 250,
  });
});
test('state helpers', () => {
  const st = { version: 1 as const, sessions: [live({ id: 'x', endedAt: t(10) }), live({ id: 'y' })] };
  expect(activeSession(st)?.id).toBe('y');
  expect(upsertSession(st, live({ id: 'y', endedAt: t(11) })).sessions[1].endedAt).toBe(t(11));
  expect(upsertSession(st, manual({ id: 'z' })).sessions).toHaveLength(3);
  expect(deleteSession(st, 'x').sessions.map((s) => s.id)).toEqual(['y']);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/domain/session.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `session.ts`** per Interfaces. Date comparison in `validateManual` is lexical on `'YYYY-MM-DD'`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/domain/session.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain && git commit -m "feat: pure session operations and manual sessions"
```

---

### Task 4: Records, streaks and history (`src/domain/records.ts`)

**Files:**
- Create: `src/domain/records.ts`
- Test: `src/domain/records.test.ts`

**Interfaces:**
- Consumes: scoring functions (Task 2).
- Produces:
  - `interface Streak { current: number; best: number }`
  - `interface Records { bestMonth?: { key: string; pace: number }; bestSessionPace?: { id: string; pace: number }; mostPoints?: { id: string; points: number }; monthStreak: Streak; sessionStreak: Streak }`
  - `computeRecords(sessions: Session[], now: number): Records`
  - `recordsBroken(before: Records, after: Records): string[]`
  - `interface MonthGroup extends Stats { key: string; sessions: Session[] }`
  - `historyByMonth(sessions: Session[], now: number): MonthGroup[]`
  - `sessionSortTime(s: Session): number` — live: `startedAt`; manual: local midnight of `date`

**Rules (decisions the spec leaves to the plan):**
- Only finished sessions count: the active live session is excluded from records and history.
- Session records/streak use sessions in `sessionSortTime` order. A session *qualifies* if active time ≥ `QUALIFYING_SESSION_MS`. `mostPoints` considers all finished sessions; `bestSessionPace` and the session streak only qualifying ones. On ties the earliest session keeps the record.
- Month records/streak use only **completed** months (key < `monthKeyOf(now)`) with ≥ `QUALIFYING_MONTH_MS`. Non-qualifying months and months without sessions (e.g. holiday) are skipped — they neither extend nor break the streak.
- Streak: `current` = number of trailing qualifying items with pace ≥ `BONUS_MAX`; `best` = longest such run.
- `recordsBroken` reports a record only when `before` already had one and `after` beats it: `'Bästa pass'` (bestSessionPace), `'Flest poäng i ett pass'` (mostPoints), `'Längsta maxbonus-svit'` (sessionStreak.best).
- History: groups newest month first; sessions inside a group newest first.

- [ ] **Step 1: Write the failing tests**

```ts
const H = HOUR_MS;
const now = t(12, 0, 15, 12); // current month 2026-12
const pts = (points: number) => [{ kind: 'adjust' as const, points, at: t(7) }];
const A = live({ id: 'A', startedAt: t(6, 0, 1), endedAt: t(8, 0, 1), entries: pts(500) });   // 2 h, 250
const B = live({ id: 'B', startedAt: t(6, 0, 2), endedAt: t(6, 30, 2), entries: pts(200) });  // 0.5 h, not qualifying
const C = live({ id: 'C', startedAt: t(6, 0, 3), endedAt: t(9, 0, 3), entries: pts(690) });   // 3 h, 230
const D = manual({ id: 'D', date: '2026-10-04', activeMs: 4 * H, points: 1040 });             // 260
const E = live({ id: 'E', startedAt: t(6, 0, 5), endedAt: t(8, 0, 5), entries: pts(500) });   // 250

test('session records and streak', () => {
  const r = computeRecords([A, B, C, D, E], now);
  expect(r.bestSessionPace).toEqual({ id: 'D', pace: 260 });
  expect(r.mostPoints).toEqual({ id: 'D', points: 1040 });
  expect(r.sessionStreak).toEqual({ current: 2, best: 2 });
});
test('active session is excluded', () => {
  const active = live({ id: 'X', startedAt: t(6, 0, 6), entries: pts(5000) });
  expect(computeRecords([A, active], t(8, 0, 6)).mostPoints?.id).toBe('A');
});
test('month records use completed qualifying months; gaps are skipped', () => {
  const sessions = [
    manual({ id: 'aug', date: '2026-08-10', activeMs: 10 * H, points: 2300 }), // 230
    manual({ id: 'sep', date: '2026-09-10', activeMs: 10 * H, points: 2450 }), // 245
    manual({ id: 'oct', date: '2026-10-10', activeMs: 9 * H, points: 2250 }),  // 250
    manual({ id: 'nov', date: '2026-11-10', activeMs: 5 * H, points: 1500 }),  // not qualifying
    manual({ id: 'dec', date: '2026-12-10', activeMs: 10 * H, points: 2600 }), // current month
  ];
  const r = computeRecords(sessions, now);
  expect(r.bestMonth).toEqual({ key: '2026-10', pace: 250 });
  expect(r.monthStreak).toEqual({ current: 2, best: 2 });
});
test('recordsBroken only reports beaten existing records', () => {
  const before = computeRecords([A, C], now);
  expect(recordsBroken(before, computeRecords([A, C, D], now))).toEqual(['Bästa pass', 'Flest poäng i ett pass']);
  expect(recordsBroken(computeRecords([], now), computeRecords([A], now))).toEqual([]);
});
test('historyByMonth groups newest first', () => {
  const groups = historyByMonth([D, A, manual({ id: 'S', date: '2026-09-02', activeMs: H, points: 200 })], now);
  expect(groups.map((g) => g.key)).toEqual(['2026-10', '2026-09']);
  expect(groups[0].sessions.map((s) => s.id)).toEqual(['D', 'A']);
  expect(groups[0]).toMatchObject({ points: 1540, activeMs: 6 * H });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/domain/records.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `records.ts`** per Interfaces and Rules.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/domain/records.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain && git commit -m "feat: records, streaks and monthly history"
```

---

### Task 5: Storage (`src/storage.ts`)

**Files:**
- Create: `src/storage.ts`
- Test: `src/storage.test.ts`

**Interfaces:**
- Consumes: `StoredState`.
- Produces:
  - `STORAGE_KEY = 'plockpoang'`, `BACKUP_PREFIX = 'plockpoang.backup.'`
  - `emptyState(): StoredState` → `{ version: 1, sessions: [] }`
  - `loadState(storage: Storage = localStorage, now = Date.now()): StoredState` — missing key → empty; unparsable JSON, not an object, `version !== 1` or `sessions` not an array → copy raw string to `BACKUP_PREFIX + now`, return empty
  - `saveState(state: StoredState, storage: Storage = localStorage): boolean` — `false` if `setItem` throws

- [ ] **Step 1: Write the failing tests** (use a `MemoryStorage implements Storage` class backed by a `Map`, defined in the test file)

```ts
test('missing key gives empty state', () => {
  expect(loadState(new MemoryStorage())).toEqual({ version: 1, sessions: [] });
});
test('round trip', () => {
  const st = new MemoryStorage();
  const state = { version: 1 as const, sessions: [manual()] };
  expect(saveState(state, st)).toBe(true);
  expect(loadState(st)).toEqual(state);
});
test.each(['not json', '{"version":2,"sessions":[]}', '{"version":1}', '42'])('corrupt %s is backed up', (raw) => {
  const st = new MemoryStorage();
  st.setItem('plockpoang', raw);
  expect(loadState(st, 1234)).toEqual({ version: 1, sessions: [] });
  expect(st.getItem('plockpoang.backup.1234')).toBe(raw);
});
test('save failure returns false', () => {
  const st = new MemoryStorage();
  st.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); };
  expect(saveState({ version: 1, sessions: [] }, st)).toBe(false);
});
```

- [ ] **Step 2: Run to verify failure** — `npm test -- src/storage.test.ts` → FAIL.
- [ ] **Step 3: Implement `storage.ts`** per Interfaces.
- [ ] **Step 4: Run to verify pass** — `npm test -- src/storage.test.ts` → all PASS.
- [ ] **Step 5: Commit**

```bash
git add src/storage.ts src/storage.test.ts && git commit -m "feat: versioned localStorage persistence with corrupt-data backup"
```

---

### Task 6: Formatting and status copy (`src/ui/format.ts`, `src/ui/statusText.ts`)

**Files:**
- Create: `src/ui/format.ts`, `src/ui/statusText.ts`
- Test: `src/ui/format.test.ts`, `src/ui/statusText.test.ts`

**Interfaces:**
- Consumes: `Stats`, `monthDelta`, `holdToday` (Task 2).
- Produces (`format.ts`):
  - `formatPace(p: number | undefined): string` — `'—'` or `Math.round(p)`
  - `formatPoints(n: number): string` — `sv-SE` grouping
  - `formatDuration(ms: number): string` — `'1 h 40 min'`, `'45 min'`, `'2 h'`
  - `formatMonth(key: string): string` — `'oktober 2026'`
  - `formatTime(ts: number): string` — `'06:05'`
  - `formatDate(ts: number): string` — `'tis 20 okt'` (`sv-SE`, weekday short, day numeric, month short)
  - `todayKey(now: number): string` — local `'YYYY-MM-DD'`
  - `toLocalInput(ts: number): string` / `fromLocalInput(v: string): number` — `'YYYY-MM-DDTHH:MM'` for `<input type="datetime-local">`
  - `parsePlannedEnd(hhmm: string, now: number): number | undefined` — today at HH:MM; if that is ≤ `now`, the next day; `''` → undefined
- Produces (`statusText.ts`):
  - `monthStatusText(stats: Stats, plannedEndAt: number | undefined, now: number): string`
  - `cardDeltaText(stats: Stats): string`

Copy rules (rounding: required pace `Math.ceil`, distance `Math.ceil(-delta)`, margin `Math.floor(delta)`):

| Condition (checked in order) | `monthStatusText` | `cardDeltaText` |
|---|---|---|
| `activeMs === 0` | `Takten visas efter 5 min` | `Inget plock ännu denna månad` |
| `activeMs < MIN_PACE_MS` | `Takten visas efter 5 min` | `Takten visas efter 5 min` |
| holdToday `pace` | `Håll {n} p/h idag så når månaden 240` | (n/a) |
| holdToday `reached` | `Månaden når maxbonus-takt` | (n/a) |
| delta < 0 | `{n} p till maxbonus-takt för månaden` | `{n} p till maxbonus-takt` |
| delta ≥ 0 | `Månaden på maxbonus-takt, {n} p marginal` | `Maxbonus-takt, {n} p marginal` |

- [ ] **Step 1: Write the failing tests**

```ts
// format.test.ts
test('formatPace', () => { expect(formatPace(undefined)).toBe('—'); expect(formatPace(232.6)).toBe('233'); });
test('formatPoints', () => { expect(formatPoints(14592).replace(/\s/g, ' ')).toBe('14 592'); });
test('formatDuration', () => {
  expect(formatDuration(100 * MINUTE_MS)).toBe('1 h 40 min');
  expect(formatDuration(45 * MINUTE_MS)).toBe('45 min');
  expect(formatDuration(2 * HOUR_MS)).toBe('2 h');
});
test('formatMonth', () => { expect(formatMonth('2026-10')).toBe('oktober 2026'); });
test('formatTime / todayKey', () => {
  expect(formatTime(t(6, 5))).toBe('06:05');
  expect(todayKey(t(6, 5))).toBe('2026-10-20');
});
test('local input round trip', () => {
  expect(toLocalInput(t(6, 5))).toBe('2026-10-20T06:05');
  expect(fromLocalInput('2026-10-20T06:05')).toBe(t(6, 5));
});
test('parsePlannedEnd handles night shifts', () => {
  expect(parsePlannedEnd('14:00', t(6))).toBe(t(14));
  expect(parsePlannedEnd('06:00', t(22))).toBe(t(6, 0, 21));
  expect(parsePlannedEnd('', t(6))).toBeUndefined();
});

// statusText.test.ts
const H = HOUR_MS;
const s = (points: number, activeMs: number) => ({ points, activeMs, pace: pace(points, activeMs) });
test('monthStatusText', () => {
  expect(monthStatusText(s(1860, 8 * H), t(12), t(10))).toBe('Håll 270 p/h idag så når månaden 240');
  expect(monthStatusText(s(2500, 8 * H), t(12), t(10))).toBe('Månaden når maxbonus-takt');
  expect(monthStatusText(s(1860, 8 * H), undefined, t(10))).toBe('60 p till maxbonus-takt för månaden');
  expect(monthStatusText(s(1944, 8 * H), undefined, t(10))).toBe('Månaden på maxbonus-takt, 24 p marginal');
  expect(monthStatusText(s(6, 2 * MINUTE_MS), undefined, t(10))).toBe('Takten visas efter 5 min');
});
test('cardDeltaText', () => {
  expect(cardDeltaText(s(0, 0))).toBe('Inget plock ännu denna månad');
  expect(cardDeltaText(s(1882, 8 * H))).toBe('38 p till maxbonus-takt');
  expect(cardDeltaText(s(2040, 8 * H))).toBe('Maxbonus-takt, 120 p marginal');
});
```

- [ ] **Step 2: Run to verify failure** — `npm test -- src/ui` → FAIL.
- [ ] **Step 3: Implement `format.ts` and `statusText.ts`** per Interfaces and the copy table. Use `Intl.DateTimeFormat('sv-SE', …)` / `Intl.NumberFormat('sv-SE')`.
- [ ] **Step 4: Run to verify pass** — `npm test -- src/ui` → all PASS.
- [ ] **Step 5: Commit**

```bash
git add src/ui && git commit -m "feat: Swedish formatting and month status copy"
```

---

### Task 7: App shell, start screen and picking screen

**Files:**
- Create: `src/app.tsx` (replace placeholder), `src/styles.css`, `src/ui/StartScreen.tsx`, `src/ui/MonthCard.tsx`, `src/ui/PickScreen.tsx`, `src/ui/PaceMeter.tsx`
- Modify: `src/main.tsx` (import `styles.css`, render `<App />`)
- Test: `src/app.test.tsx`, `src/ui/PaceMeter.test.tsx`

**Interfaces:**
- Consumes: everything from Tasks 2–6.
- Produces:
  - `type Screen = { name: 'start' } | { name: 'pick' } | { name: 'summary'; id: string } | { name: 'manual'; id?: string } | { name: 'records' }`
  - `App` holds `state: StoredState` (from `loadState()`), `now` (updated every 1000 ms), `screen`, `saveFailed: boolean`; `update(fn: (s: StoredState) => StoredState)` applies `fn`, calls `saveState`, and sets `saveFailed` from its result. Initial screen: `pick` if `activeSession(state)` exists, else `start`.
  - `PaceMeter` props `{ monthPace: number | undefined; sessionPace: number | undefined }`
  - `MonthCard` props `{ stats: Stats; monthKey: string }`
  - Screen components receive `state`, `now`, `update` and `go(screen: Screen)` as needed; later tasks add `summary`, `manual`, `records` screens to the router (render a stub `<p>` for them in this task).

**Behaviour:**
- **StartScreen:** `MonthCard` for `monthKeyOf(now)` (title `formatMonth`, big month pace, `formatDuration` hours, `formatPoints` points, `cardDeltaText`); optional `<input type="time">` labelled *Planerad sluttid (valfritt)*; buttons **Starta plock** (creates session with `crypto.randomUUID()` and `parsePlannedEnd`, goes to `pick`), **Lägg till pass i efterhand** (`manual`), **Rekord & historik** (`records`).
- **PickScreen:** month stats for `monthKey(active)` (Review Focus 2); `PaceMeter`; status line from `monthStatusText(stats, active.plannedEndAt, now)`; session line `"{points} p · {stops} stopp"`; buttons **1 kolli** with sub-label **+2**, **2 kolli** with **+3**, **Annat**, **Ångra** (disabled when no entries), **Paus**, **Avsluta**. Each stop tap calls `navigator.vibrate?.(30)`. **Annat** and **Paus** are wired in Task 8 (no-op here). **Avsluta**: `window.confirm('Avsluta passet?')` → `endSession`, go to `{ name: 'summary', id }`.
- **PaceMeter:** labels *MÅNAD* (large) and *IDAG* (small) with `formatPace` values and `p/h`. Horizontal gauge spanning 120–260 p/h (clamped), fill width from month pace; shaded band 205–240 with a tick at 205 and a tick at 240. Root element gets `data-level={paceLevel(monthPace)}`; CSS: neutral accent fill for `unknown`/`below`, the same accent plus band highlight for `bonus` with label *Bonuszon*, gold fill and label *Maxbonus* for `max`.
- **Save failure banner:** when `saveFailed`, show *Kunde inte spara – data kan gå förlorad* at the top of every screen.
- **styles.css:** CSS custom properties on `:root` for a dark palette (background `#111418`, surface, text, neutral accent, gold), system font stack, big tabular numerals for paces, main stop buttons ≥ 64 px tall in a two-column grid in the lower half.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/app.test.tsx
// @vitest-environment jsdom
beforeEach(() => localStorage.clear());
test('start a session, log stops, undo, and survive a reload', async () => {
  const { unmount } = render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Starta plock' }));
  fireEvent.click(screen.getByRole('button', { name: /1 kolli/ }));
  fireEvent.click(screen.getByRole('button', { name: /2 kolli/ }));
  expect(screen.getByText('5 p · 2 stopp')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Ångra' }));
  expect(screen.getByText('2 p · 1 stopp')).toBeTruthy();
  unmount();
  render(<App />);
  expect(screen.getByText('2 p · 1 stopp')).toBeTruthy();
});
test('shows a banner when saving fails', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full'); });
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Starta plock' }));
  expect(screen.getByText('Kunde inte spara – data kan gå förlorad')).toBeTruthy();
  vi.restoreAllMocks();
});

// src/ui/PaceMeter.test.tsx
// @vitest-environment jsdom
test.each([[undefined, 'unknown', '—'], [180, 'below', '180'], [220, 'bonus', '220'], [251, 'max', '251']])(
  'month pace %s → level %s', (p, level, text) => {
    const { container } = render(<PaceMeter monthPace={p} sessionPace={undefined} />);
    expect(container.querySelector(`[data-level="${level}"]`)).toBeTruthy();
    expect(container.textContent).toContain(text);
  });
test('labels for bonus zone and max', () => {
  expect(render(<PaceMeter monthPace={220} sessionPace={200} />).container.textContent).toContain('Bonuszon');
  cleanup();
  expect(render(<PaceMeter monthPace={240} sessionPace={250} />).container.textContent).toContain('Maxbonus');
});
```

- [ ] **Step 2: Run to verify failure** — `npm test -- src/app.test.tsx src/ui/PaceMeter.test.tsx` → FAIL.
- [ ] **Step 3: Implement** `app.tsx`, `StartScreen.tsx`, `MonthCard.tsx`, `PickScreen.tsx`, `PaceMeter.tsx`, `styles.css` per Interfaces and Behaviour.
- [ ] **Step 4: Run to verify pass** — `npm test` → all PASS; `npm run build` → succeeds.
- [ ] **Step 5: Manual check** — `npm run dev`, open at 390×844 (Playwright or browser devtools): start a session, tap stops, confirm the meter shows "—" for the first 5 minutes and buttons are reachable in the lower half.
- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: start and picking screens with live month pace meter"
```

---

### Task 8: Keypad and pause dialog

**Files:**
- Create: `src/ui/Keypad.tsx`, `src/ui/PauseDialog.tsx`
- Modify: `src/ui/PickScreen.tsx`, `src/styles.css`
- Test: `src/ui/Keypad.test.tsx`, `src/ui/PickScreen.test.tsx`

**Interfaces:**
- Consumes: `addStop`, `setTotal`, `pauseSession`, `resumeSession`, `isPaused`, `sessionPoints`.
- Produces:
  - `Keypad` props `{ currentTotal: number; onStop(kolli: number): void; onSetTotal(total: number): void; onClose(): void }`
  - `PauseDialog` props `{ onPick(reason: PauseReason): void; onClose(): void }`

**Behaviour:**
- **Keypad:** a modal with a mode toggle *Stopp med N kolli* (default) / *Ange total*, a display, digit buttons `0`–`9`, `⌫`, and a confirm button. Input is digits only, max 4 digits, a leading `0` is replaced by the next digit. In *Ange total* mode the display starts empty with `currentTotal` shown as a hint (*Nu: {n} p*). Confirm label: *Lägg till* (stop mode), *Spara* (total mode). Confirm is disabled when empty or, in stop mode, when the value is 0. Confirm calls the callback, then `onClose`.
- **PauseDialog:** title *Varför paus?*, buttons *Systemfel*, *Möte*, *Olycka*, *Annat* (mapping to `'systemfel' | 'mote' | 'olycka' | 'annat'`), plus *Avbryt*. Small note under the buttons: *Kom ihåg att anmäla stoppet till teamledaren.*
- **PickScreen while paused:** the **Paus** button reads **Fortsätt** and resumes; the stop buttons and **Annat** are disabled; a line *Pausad – {reason label} sedan {formatTime(start)}* is shown.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/ui/Keypad.test.tsx
// @vitest-environment jsdom
const press = (...keys: string[]) => keys.forEach((k) => fireEvent.click(screen.getByRole('button', { name: k })));
test('stop mode adds N kolli', () => {
  const onStop = vi.fn();
  render(<Keypad currentTotal={10} onStop={onStop} onSetTotal={vi.fn()} onClose={vi.fn()} />);
  expect((screen.getByRole('button', { name: 'Lägg till' }) as HTMLButtonElement).disabled).toBe(true);
  press('0');
  expect((screen.getByRole('button', { name: 'Lägg till' }) as HTMLButtonElement).disabled).toBe(true);
  press('5', 'Lägg till');
  expect(onStop).toHaveBeenCalledWith(5);
});
test('input is capped at 4 digits', () => {
  const onStop = vi.fn();
  render(<Keypad currentTotal={0} onStop={onStop} onSetTotal={vi.fn()} onClose={vi.fn()} />);
  press('1', '2', '3', '4', '5', 'Lägg till');
  expect(onStop).toHaveBeenCalledWith(1234);
});
test('total mode sets total', () => {
  const onSetTotal = vi.fn();
  render(<Keypad currentTotal={412} onStop={vi.fn()} onSetTotal={onSetTotal} onClose={vi.fn()} />);
  press('Ange total');
  expect(screen.getByText('Nu: 412 p')).toBeTruthy();
  press('4', '3', '0', 'Spara');
  expect(onSetTotal).toHaveBeenCalledWith(430);
});

// src/ui/PickScreen.test.tsx — render <App /> after seeding localStorage with an active session
// @vitest-environment jsdom
test('Annat adds a 4-kolli stop and pause disables stop buttons', () => {
  localStorage.setItem('plockpoang', JSON.stringify({ version: 1, sessions: [
    { source: 'live', id: 's', type: 'plock', startedAt: Date.now() - 60_000, entries: [], pauses: [] },
  ] }));
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Annat' }));
  fireEvent.click(screen.getByRole('button', { name: '4' }));
  fireEvent.click(screen.getByRole('button', { name: 'Lägg till' }));
  expect(screen.getByText('5 p · 1 stopp')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Paus' }));
  fireEvent.click(screen.getByRole('button', { name: 'Möte' }));
  expect((screen.getByRole('button', { name: /1 kolli/ }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText(/Pausad – Möte sedan/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Fortsätt' }));
  expect((screen.getByRole('button', { name: /1 kolli/ }) as HTMLButtonElement).disabled).toBe(false);
});
```

- [ ] **Step 2: Run to verify failure** — `npm test -- src/ui/Keypad.test.tsx src/ui/PickScreen.test.tsx` → FAIL.
- [ ] **Step 3: Implement** `Keypad.tsx`, `PauseDialog.tsx` and wire both into `PickScreen.tsx`.
- [ ] **Step 4: Run to verify pass** — `npm test` → all PASS.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: calculator keypad and pause with reasons"
```

---

### Task 9: Summary screen and forgotten-session prompt

**Files:**
- Create: `src/ui/SummaryScreen.tsx`, `src/ui/StaleSessionDialog.tsx`
- Modify: `src/app.tsx`, `src/styles.css`
- Test: `src/ui/SummaryScreen.test.tsx`, `src/ui/StaleSessionDialog.test.tsx`

**Interfaces:**
- Consumes: `sessionPoints`, `sessionActiveMs`, `sessionCounts`, `pace`, `monthStats`, `monthKey`, `computeRecords`, `recordsBroken`, `editTimes`, `endSession`, `upsertSession`, `deleteSession`, `toLocalInput`, `fromLocalInput`.
- Produces:
  - `SummaryScreen` props `{ state: StoredState; id: string; now: number; update(fn: (s: StoredState) => StoredState): void; onClose(): void }`
  - `StaleSessionDialog` props `{ session: LiveSession; now: number; onEnd(endedAt: number): void; onContinue(): void }`

**Behaviour:**
- **SummaryScreen** (for a live session): big session pace `pace(points, activeMs, 0)`; rows *Poäng*, *Stopp*, *Kolli*, *Tid* (`formatDuration`); pause list *{reason label} {HH:MM}–{HH:MM}* under the heading *Pauser (anmäl till teamledaren)* when there are pauses; month change line `Månaden: {before} → {after} p/h` where *before* is `monthStats` without this session and *after* with it (`formatPace` both); editable start/end via two `datetime-local` inputs and a *Spara tider* button (shows *Sluttiden måste vara efter starttiden* instead of saving when invalid); *Ta bort pass* behind `window.confirm('Ta bort passet?')`, then `onClose`; *Klar* button → `onClose`.
- **Celebration** banner, shown when any of: session pace ≥ `BONUS_MAX` → *Maxbonus-pass!*; month before < 240 and after ≥ 240 → *Månaden är på maxbonus-takt!*; each string from `recordsBroken(records without session, records with session)` → *Nytt rekord: {name}*. Banner has a short CSS pop/shine animation and triggers `navigator.vibrate?.([60, 40, 60])` once on mount. No banner otherwise.
- `onClose` in App routes to `start`.
- **StaleSessionDialog:** on launch, if the active session's `now − startedAt > STALE_SESSION_MS`, App shows this dialog over the picking screen. Title *Glömde du avsluta passet?*; a `datetime-local` input defaulting to the last entry's `at` (or `startedAt + 8 h` if no entries), clamped to `now`; buttons *Avsluta vid denna tid* (`endSession` at chosen time → summary) and *Fortsätt passet* (dismiss for this launch).

- [ ] **Step 1: Write the failing tests**

```tsx
// src/ui/SummaryScreen.test.tsx
// @vitest-environment jsdom
const H = HOUR_MS;
const state = (liveSession: LiveSession) => ({ version: 1 as const, sessions: [
  manual({ id: 'prev', date: '2026-10-01', activeMs: 4 * H, points: 900 }), liveSession,
] });
const done = live({ id: 's', endedAt: t(10), entries: [{ kind: 'adjust', points: 960, at: t(9) }],
  pauses: [{ start: t(7), end: t(7, 15), reason: 'systemfel' }] });
test('shows session numbers, pauses and month change', () => {
  render(<SummaryScreen state={state(done)} id="s" now={t(12)} update={vi.fn()} onClose={vi.fn()} />);
  // before: 900 p / 4 h = 225; session: 960 p / 3.75 h = 256; after: 1860 p / 7.75 h = 240
  expect(screen.getByText('Månaden: 225 → 240 p/h')).toBeTruthy();
  expect(screen.getByText(/Systemfel 07:00–07:15/)).toBeTruthy();
  expect(screen.getByText('Maxbonus-pass!')).toBeTruthy();
  expect(screen.getByText('Månaden är på maxbonus-takt!')).toBeTruthy();
});
test('rejects end before start', () => {
  const update = vi.fn();
  render(<SummaryScreen state={state(done)} id="s" now={t(12)} update={update} onClose={vi.fn()} />);
  fireEvent.input(screen.getByLabelText('Slut'), { target: { value: '2026-10-20T05:00' } });
  fireEvent.click(screen.getByRole('button', { name: 'Spara tider' }));
  expect(screen.getByText('Sluttiden måste vara efter starttiden')).toBeTruthy();
  expect(update).not.toHaveBeenCalled();
});
test('delete after confirm', () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  const update = vi.fn(); const onClose = vi.fn();
  const st = state(done);
  render(<SummaryScreen state={st} id="s" now={t(12)} update={update} onClose={onClose} />);
  fireEvent.click(screen.getByRole('button', { name: 'Ta bort pass' }));
  expect(update.mock.calls[0][0](st).sessions.map((s: Session) => s.id)).toEqual(['prev']);
  expect(onClose).toHaveBeenCalled();
});

// src/ui/StaleSessionDialog.test.tsx
// @vitest-environment jsdom
test('defaults to the last entry and ends there', () => {
  const s = live({ startedAt: t(6), entries: [{ kind: 'stop', kolli: 1, at: t(14, 10) }] });
  const onEnd = vi.fn();
  render(<StaleSessionDialog session={s} now={t(8, 0, 21)} onEnd={onEnd} onContinue={vi.fn()} />);
  expect(screen.getByText('Glömde du avsluta passet?')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Avsluta vid denna tid' }));
  expect(onEnd).toHaveBeenCalledWith(t(14, 10));
});
```

- [ ] **Step 2: Run to verify failure** — `npm test -- src/ui/SummaryScreen.test.tsx src/ui/StaleSessionDialog.test.tsx` → FAIL.
- [ ] **Step 3: Implement** both components and wire them into `app.tsx` (summary route, stale check on first render).
- [ ] **Step 4: Run to verify pass** — `npm test` → all PASS.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: session summary with month change, celebration and stale-session prompt"
```

---

### Task 10: Manual sessions and records & history screen

**Files:**
- Create: `src/ui/ManualSessionForm.tsx`, `src/ui/RecordsScreen.tsx`
- Modify: `src/app.tsx`, `src/styles.css`
- Test: `src/ui/ManualSessionForm.test.tsx`, `src/ui/RecordsScreen.test.tsx`

**Interfaces:**
- Consumes: `validateManual`, `createManual`, `upsertSession`, `deleteSession`, `computeRecords`, `historyByMonth`, `monthStats`, `monthKeyOf`, format helpers.
- Produces:
  - `ManualSessionForm` props `{ initial?: ManualSession; today: string; onSave(s: ManualSession): void; onDelete?(): void; onCancel(): void }` — uses `initial.id` when editing, else `crypto.randomUUID()`
  - `RecordsScreen` props `{ sessions: Session[]; now: number; onOpen(s: Session): void; onBack(): void }`
- App routes: `manual` (new or edit by id; save → `upsertSession` → `records` when editing, `start` when new), `records` (`onOpen`: live → `summary`, manual → `manual` with id).

**Behaviour:**
- **ManualSessionForm:** title *Lägg till pass i efterhand* (*Ändra pass* when editing); fields *Datum* (`type="date"`, max `today`), *Timmar* and *Minuter* (`inputmode="numeric"`), *Poäng*; *Spara* shows the `validateManual` message instead of saving when invalid; *Ta bort* (only when editing, `window.confirm('Ta bort passet?')`); *Avbryt*.
- **RecordsScreen:** section *Rekord* with rows *Bästa månad* (`formatMonth` · pace), *Bästa pass* (date · pace), *Flest poäng i ett pass*, *Maxbonus-månader i rad* (`current` / bästa `best`), *Maxbonus-pass i rad*; the current month shown as *{formatMonth}: {pace} p/h (pågår)*. Records not yet set show *—*. Section *Historik*: for each `MonthGroup` a header `{formatMonth} · {pace} p/h · {duration} · {points} p`, then rows `{formatDate} · {duration} · {points} p · {pace} p/h`, manual rows tagged *manuell*. Rows are buttons calling `onOpen`.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/ui/ManualSessionForm.test.tsx
// @vitest-environment jsdom
test('validates then saves a manual session', () => {
  const onSave = vi.fn();
  render(<ManualSessionForm today="2026-10-25" onSave={onSave} onCancel={vi.fn()} />);
  fireEvent.input(screen.getByLabelText('Datum'), { target: { value: '2026-10-20' } });
  fireEvent.input(screen.getByLabelText('Poäng'), { target: { value: '900' } });
  fireEvent.click(screen.getByRole('button', { name: 'Spara' }));
  expect(screen.getByText('Plocktiden måste vara mer än 0')).toBeTruthy();
  fireEvent.input(screen.getByLabelText('Timmar'), { target: { value: '3' } });
  fireEvent.input(screen.getByLabelText('Minuter'), { target: { value: '45' } });
  fireEvent.click(screen.getByRole('button', { name: 'Spara' }));
  expect(onSave.mock.calls[0][0]).toMatchObject({ source: 'manual', date: '2026-10-20', activeMs: 3.75 * HOUR_MS, points: 900 });
});

// src/ui/RecordsScreen.test.tsx
// @vitest-environment jsdom
test('shows records and history grouped by month', () => {
  const sessions = [
    manual({ id: 'sep', date: '2026-09-10', activeMs: 10 * HOUR_MS, points: 2450 }),
    manual({ id: 'oct', date: '2026-10-10', activeMs: 2 * HOUR_MS, points: 500 }),
  ];
  const onOpen = vi.fn();
  render(<RecordsScreen sessions={sessions} now={t(12, 0, 20, 10)} onOpen={onOpen} onBack={vi.fn()} />);
  expect(screen.getByText(/Bästa månad/).parentElement?.textContent).toContain('september 2026');
  expect(screen.getByText(/oktober 2026 · 250 p\/h/)).toBeTruthy();
  fireEvent.click(screen.getAllByText(/manuell/)[0]);
  expect(onOpen).toHaveBeenCalledWith(sessions[1]);
});
```

- [ ] **Step 2: Run to verify failure** — `npm test -- src/ui/ManualSessionForm.test.tsx src/ui/RecordsScreen.test.tsx` → FAIL.
- [ ] **Step 3: Implement** both components and the routes in `app.tsx`.
- [ ] **Step 4: Run to verify pass** — `npm test` → all PASS.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: manual sessions and records & history screen"
```

---

### Task 11: Installable offline PWA

**Files:**
- Create: `public/icon.svg`, `pwa-assets.config.ts`, generated icons in `public/`
- Modify: `vite.config.ts`, `src/main.tsx`, `tsconfig.app.json`, `index.html`

**Interfaces:**
- Consumes: built app.
- Produces: `dist/manifest.webmanifest`, `dist/sw.js`, icons.

- [ ] **Step 1: Icon** — `public/icon.svg`: simple bold mark (e.g. a gold gauge arc with "240" or a stylised package) on `#111418`, readable at 48 px. Generate icons: `pwa-assets.config.ts` with `preset: 'minimal-2023'`, `images: ['public/icon.svg']`; run `npx pwa-assets-generator`.
- [ ] **Step 2: Configure `VitePWA`** in `vite.config.ts`: `registerType: 'autoUpdate'`, `includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png']`, manifest `{ name: 'Plockpoäng', short_name: 'Plockpoäng', description: 'Håll koll på plockpoäng och månadens takt mot maxbonus', lang: 'sv', display: 'standalone', orientation: 'portrait', start_url: '.', scope: '.', theme_color: '#111418', background_color: '#111418', icons: [64, 192, 512, maskable-512 from the generator] }`. In `main.tsx`: `import { registerSW } from 'virtual:pwa-register'; registerSW({ immediate: true })`. Add `"vite-plugin-pwa/client"` to `types` in `tsconfig.app.json`. Add `<meta name="theme-color" content="#111418">` and icon links to `index.html`.
- [ ] **Step 3: Verify build output**

Run: `npm run build && ls dist/manifest.webmanifest dist/sw.js && grep -o '"lang":"sv"' dist/manifest.webmanifest`
Expected: both files listed, `"lang":"sv"` printed.

- [ ] **Step 4: Verify offline in a browser** — `npm run preview`, open `http://localhost:4173/plockpoang/` with Playwright, confirm `navigator.serviceWorker.controller` is set after reload, then go offline (`context.setOffline(true)`), reload, and confirm the start screen still renders.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: installable offline PWA with icons and manifest"
```

---

### Task 12: Deploy to GitHub Pages

**Files:**
- Create: `.github/workflows/deploy.yml`, `README.md` (short: what it is, `npm install`, `npm run dev`, `npm test`, install on Android)

**Interfaces:**
- Consumes: `npm test`, `npm run build` → `dist/`.
- Produces: public site at `https://<github-user>.github.io/plockpoang/`.

- [ ] **Step 1: Workflow** — on `push` to `main` and `workflow_dispatch`; permissions `contents: read`, `pages: write`, `id-token: write`; concurrency group `pages`. Job `build`: `actions/checkout@v4`, `actions/setup-node@v4` (`node-version: 24`, `cache: npm`), `npm ci`, `npm test`, `npm run build`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3` (`path: dist`). Job `deploy` (needs build, environment `github-pages`): `actions/deploy-pages@v4`.
- [ ] **Step 2: Commit** — `git add -A && git commit -m "ci: build, test and deploy to GitHub Pages"`
- [ ] **Step 3: GitHub login (user action)** — if `gh auth status` reports not logged in, ask the user to run `! gh auth login` and wait.
- [ ] **Step 4: Create repo and push** (confirm with the user first — this publishes the code publicly)

```bash
gh repo create plockpoang --public --source . --remote origin --push
gh api -X POST "repos/{owner}/plockpoang/pages" -f build_type=workflow
gh workflow run deploy.yml && gh run watch --exit-status
```

Expected: run succeeds.

- [ ] **Step 5: Verify live** — fetch `https://<user>.github.io/plockpoang/manifest.webmanifest` (HTTP 200) and open the site with Playwright at phone size; start screen renders.
- [ ] **Step 6: Hand over install steps to the user** — Chrome on Android → open the URL → menu ⋮ → *Installera app*.
