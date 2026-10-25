# Plockpoäng – design

**Date:** 2026-10-25
**Status:** Approved in conversation, awaiting written review

## Purpose

A personal progressive web app (PWA) that a warehouse picker installs on an
Android phone to keep score while manually picking, and to gamify reaching the
**monthly** bonus ceiling of **240 points per hour**.

### What the user said

- Points are earned per shelf stop: **1 point per shelf + 1 point per kolli**
  picked there. A stop is therefore worth at least 2 points.
- Points per hour is calculated over the **whole picking shift, breaks
  included**.
- **The bonus is based on the month, not the day.** The monthly figure is
  total picking points ÷ total picking hours for the **calendar month** (not an
  average of daily figures). Forklift time does not count toward it.
- **240 p/h is the ceiling where maximum bonus is reached, not a pass/fail
  line.** Being below 240 is normal and must never be presented as failure.
- Bonus tiers are believed to start around **205 p/h**, but the exact tier
  boundaries and number of tiers are unknown.
- Official stoppages (system malfunction, meetings, accidents) stop the clock,
  but must be filed with the team manager.
- A picking session can last anywhere from under an hour to 8 hours; the user
  may be moved to forklift duty at short notice.
- Forklift has its own points system — **out of scope for now**, but the design
  must allow adding it later.
- Most stops are 1 or 2 kolli, so these must be one-tap actions. Other input
  should work "like a calculator".
- Wanted game elements: a **live pace meter** and **personal records**.
- UI language: **Swedish**. Phone: **Android**.
- Stack: Vite + TypeScript + Preact + vite-plugin-pwa, hosted on GitHub Pages.

### Assumptions

- Single user, no accounts, no server. All data stays on the phone.
- The app cannot observe picking; it only knows what the user enters. The
  monthly figure is only accurate if every picking session of the month is in
  the app, hence manual after-the-fact entry.
- A session belongs to the month of the local date it started on.

### Success criteria

- Logging a common stop takes one tap.
- At any moment the user can see the month's pts/h (including the live session)
  and how far the month is from max-bonus pace (240 p/h).
- Numbers remain correct if the app is closed, the screen locks or the phone
  restarts mid-session.
- Installable from Chrome on Android and usable fully offline.

## Screens and behaviour

### Start screen

- **Month card:** current month name, month pts/h, picking hours, points, and
  distance to max-bonus pace (e.g. *"38 p till maxbonus-takt"* or
  *"Maxbonus-takt, 120 p marginal"*).
- **Starta plock** button. Optional **planned end time** (e.g. 14:00) to enable
  the "hold X p/h today" status line. May be left empty.
- **Lägg till pass i efterhand** — opens the manual session form.
- Link to **Rekord & historik**.
- If an active session exists, the app opens straight into the picking screen.

### Picking screen

- **Pace meter** with two figures:
  - **MÅNAD** (primary, large, with gauge): the month's pts/h including the live
    session.
  - **IDAG** (secondary, smaller): this session's pts/h.
  - The gauge fills toward 240 (*Maxbonus*) in one neutral accent colour and
    turns gold with a *Maxbonus* label at ≥ 240. No red / failure colours
    anywhere. A **bonus zone** from 205 to 240 is shaded with a tick at 205, and
    a *Bonuszon* label appears while the month figure is in that range. No
    individual tiers are shown until their boundaries are known.
  - A figure shows "—" while its active time is under 5 minutes.
- **Status line** — always about the month, phrased as distance to max bonus,
  never as a deficit:
  - With a planned end time that has not passed:
    *"Håll 262 p/h idag så når månaden 240"*, or *"Månaden når maxbonus-takt"*
    if it gets there even with no more points today.
  - Otherwise: *"38 p till maxbonus-takt för månaden"* when below,
    *"Månaden på maxbonus-takt, 24 p marginal"* when at or above.
- **Two large buttons:** **1 kolli (+2)** and **2 kolli (+3)**. Each logs one
  stop and gives a short vibration (`navigator.vibrate`).
- **Annat** opens a keypad with two modes:
  - *Stopp med N kolli* — logs one stop worth N + 1 points (N ≥ 1).
  - *Ange total* — the user enters this session's total points (e.g. from the
    scanner); the app stores the difference as an adjustment.
- **Ångra** removes the most recent entry.
- **Paus** asks for a reason: *Systemfel / Möte / Olycka / Annat*. The clock
  stops until **Fortsätt** is pressed. Paused time does not count as active time.
- **Avsluta** ends the session and shows the summary.

### Summary screen

- Session: pts/h, total points, number of stops, total kolli, active time, and a
  list of pauses with reason, start and end (for reporting to the team manager).
- Effect on the month: *"Månaden: 228 → 231 p/h"*.
- Start and end times can be edited (in case the user forgot to start or stop).
- **Ta bort pass** with confirmation.
- Celebration if the session was ≥ 240 (*Maxbonus-pass!*), the month crossed
  up to ≥ 240, or any record was broken. Otherwise a neutral summary — no
  "missed" messaging.

### Manual session form (Lägg till pass i efterhand)

- Fields: **date** (default today), **picking time** (hours + minutes), and
  **points**.
- Used for forgotten days and for days before the app was installed.
- Manual sessions appear in history marked *manuell* and can be edited or
  deleted from there.

### Records & history screen

- **Records:**
  - Best month pts/h (months with ≥ 8 h picking qualify).
  - Best session pts/h (sessions with ≥ 1 h active time qualify).
  - Most points in one session.
  - Current and best streak of **consecutive calendar months** at ≥ 240
    (only completed qualifying months count; the current month is shown
    separately as in progress).
  - Current and best streak of consecutive qualifying sessions at ≥ 240.
- **History:** sessions grouped by month, newest first. Each month header shows
  the month's pts/h, hours and points; each row shows date, time, points, pts/h.
  Tapping a row opens its summary (live) or edit form (manual).

## Data model

Stored as JSON in `localStorage` under a single versioned key.

```ts
type SessionType = 'plock'; // 'truck' added later

type Session = LiveSession | ManualSession;

interface LiveSession {
  source: 'live';
  id: string;
  type: SessionType;
  startedAt: number;      // epoch ms
  endedAt?: number;       // undefined while active
  plannedEndAt?: number;
  entries: Entry[];
  pauses: Pause[];
}

interface ManualSession {
  source: 'manual';
  id: string;
  type: SessionType;
  date: string;           // 'YYYY-MM-DD', local
  activeMs: number;
  points: number;
}

type Entry =
  | { kind: 'stop'; kolli: number; at: number }     // points = kolli + 1
  | { kind: 'adjust'; points: number; at: number }; // may be negative

interface Pause {
  start: number;
  end?: number;           // undefined while paused
  reason: 'systemfel' | 'mote' | 'olycka' | 'annat';
}

interface StoredState {
  version: 1;
  sessions: Session[];    // at most one live session has endedAt === undefined
}
```

## Calculations

All in `domain/`, with `now` passed in.

- **Session points:** live = Σ (kolli + 1) over stops + Σ adjustment points;
  manual = `points`.
- **Session active time:** live = (endedAt ?? now) − startedAt − Σ pause
  durations (an open pause counts until now, or until endedAt if ended);
  manual = `activeMs`.
- **Pace** (any set of sessions) = Σ points ÷ Σ active hours. Undefined when
  Σ active time < 5 min (UI shows "—"). The session summary always shows the
  computed value if active time > 0.
- **Month key** of a session: local `YYYY-MM` of `startedAt` (live) or `date`
  (manual). **Month stats** = pace, points and active time over all `plock`
  sessions with that key, including the active session.
- **Month delta** = month points − 240 × month active hours. Positive is
  margin, negative is distance to max-bonus pace.
- **Hold today** (planned end set and in the future): r = plannedEndAt − now in
  hours (future pauses are unknown, so none are assumed);
  needed = 240 × (month hours + r) − month points;
  required pace = needed ÷ r. If needed ≤ 0, the month reaches max-bonus pace
  without further points.
- **Ange total X** stores `{ kind: 'adjust', points: X − sessionPoints }`;
  nothing is stored if the difference is 0.
- **Month change on summary:** month pace with vs. without this session.
- **Records and history** are derived from the stored sessions every time,
  never stored, so editing or deleting a session updates them automatically.

## Edge cases

- Ending while paused closes the open pause at the end time.
- Planned end time already passed → status line falls back to month delta.
- On launch, an active session older than 12 hours prompts the user to confirm
  or correct its end time.
- A session crossing midnight or a month boundary counts entirely toward the
  month it started in.
- Undo with no entries does nothing (button disabled).
- Pausing while already paused is not possible (button becomes Fortsätt).
- Editing start/end times must keep start < end; pauses outside the new range
  are clipped to it.
- Manual form validation: points ≥ 0, picking time > 0 and ≤ 16 h, date not in
  the future.
- Corrupt or unknown-version storage: the app starts empty and keeps the raw
  value under a backup key rather than overwriting it.
- Clearing browser storage loses data. Export/import is a possible later
  addition, not part of this version.

## Architecture

```
src/
  domain/
    types.ts        Session, Entry, Pause, StoredState
    constants.ts    BONUS_START (205), BONUS_MAX (240), MIN_PACE_MS (5 min),
                    QUALIFYING_SESSION_MS (1 h), QUALIFYING_MONTH_MS (8 h)
    scoring.ts      session points/active time, pace, month key, month stats,
                    month delta, hold-today
    records.ts      records, streaks, history grouping
    session.ts      pure operations: start, addStop, setTotal, undo, pause,
                    resume, end, editTimes, add/edit manual session, delete
  storage.ts        load/save StoredState in localStorage, versioning
  ui/
    StartScreen.tsx
    MonthCard.tsx
    PickScreen.tsx
    PaceMeter.tsx
    Keypad.tsx
    PauseDialog.tsx
    SummaryScreen.tsx
    ManualSessionForm.tsx
    RecordsScreen.tsx
  app.tsx           screen routing, state, 1-second clock tick
  main.tsx
```

- `domain/` is pure TypeScript: no DOM, no storage, time passed in as `now`.
  This keeps it testable and lets a forklift scoring module be added alongside.
- Bonus thresholds live only in `constants.ts`, so real tiers are a small
  change once known.
- Session operations return new objects (immutable updates); `app.tsx` saves to
  storage after every change.

## Look and feel

- Dark theme, high contrast, large touch targets usable with gloves.
- Portrait phone layout; primary buttons in the lower half for thumb reach.

## Testing

- **Vitest** unit tests for everything in `domain/` and `storage.ts`, written
  test-first: point totals, active time with open/closed pauses, pace
  threshold, month key and month stats (live + manual, month boundaries),
  month delta, hold-today, setTotal, undo, end-while-paused, editTimes
  clipping, manual session validation, records, both streak types, qualifying
  thresholds, corrupt storage.
- Manual check in a browser at phone size (and on the phone) before release.

## Deployment

- Git repository pushed to the user's GitHub account.
- GitHub Actions workflow builds and deploys to **GitHub Pages** on push to
  `main`. Vite `base` set to the repository path.
- `vite-plugin-pwa` generates the web manifest (Swedish name, icons, standalone
  display, dark theme colour) and a service worker that precaches the app for
  offline use, with auto-update on next launch.
- Install: open the Pages URL in Chrome on Android → *Installera app*.

## Out of scope (for now)

- Forklift points.
- Real bonus tiers (until boundaries are known).
- Achievements/levels, per-tap combos, history charts.
- Export/import, sync, multiple users.
