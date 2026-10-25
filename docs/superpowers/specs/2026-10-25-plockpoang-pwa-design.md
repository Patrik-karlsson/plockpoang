# Plockpoäng – design

**Date:** 2026-10-25
**Status:** Approved in conversation, awaiting written review

## Purpose

A personal progressive web app (PWA) that a warehouse picker installs on an
Android phone to keep score while manually picking, and to gamify reaching the
bonus ceiling of **240 points per hour**.

### What the user said

- Points are earned per shelf stop: **1 point per shelf + 1 point per kolli**
  picked there. A stop is therefore worth at least 2 points.
- Points per hour is calculated over the **whole picking shift, breaks
  included**.
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
- The app cannot observe picking; it only knows what the user enters.

### Success criteria

- Logging a common stop takes one tap.
- At any moment the user can see their current pts/h and how far they are from
  max-bonus pace (240 p/h).
- Numbers remain correct if the app is closed, the screen locks or the phone
  restarts mid-session.
- Installable from Chrome on Android and usable fully offline.

## Screens and behaviour

### Start screen

- **Starta plock** button. Optional **planned end time** (e.g. 14:00) to enable
  the "needed by end" status line. May be left empty.
- Personal records shown below.
- If an active session exists, the app opens straight into the picking screen.

### Picking screen

- **Pace meter:** large pts/h figure and a gauge that fills toward 240
  (*Maxbonus*). The fill uses one neutral accent colour below 240 and turns gold
  with a *Maxbonus* label at ≥ 240. No red / failure colours anywhere. Shows "—"
  during the first 5 minutes of active time.
  - A **bonus zone** from 205 to 240 is shaded on the gauge with a tick at 205,
    and a *Bonuszon* label appears while pts/h is in that range. No individual
    tiers are shown until their boundaries are known.
  - The thresholds live in one constants module (`BONUS_START = 205`,
    `BONUS_MAX = 240`) so they — and later, real tiers — are a one-line change.
- **Status line** (phrased as distance to max bonus, never as a deficit):
  - With a planned end time that has not passed:
    *"312 p kvar till maxbonus · 1 h 40 min (187 p/h)"* — points still needed to
    finish at 240 p/h, the remaining time, and the pace required for the
    remainder. When already reached: *"Maxbonus säkrad"*.
  - Otherwise: *"18 p till maxbonus-takt"* when below, *"Maxbonus-takt, 24 p
    marginal"* when at or above.
- **Two large buttons:** **1 kolli (+2)** and **2 kolli (+3)**. Each logs one
  stop and gives a short vibration (`navigator.vibrate`).
- **Annat** opens a keypad with two modes:
  - *Stopp med N kolli* — logs one stop worth N + 1 points (N ≥ 1).
  - *Ange total* — the user enters their total points (e.g. from the scanner);
    the app stores the difference as an adjustment.
- **Ångra** removes the most recent entry.
- **Paus** asks for a reason: *Systemfel / Möte / Olycka / Annat*. The clock
  stops until **Fortsätt** is pressed. Paused time does not count as active time.
- **Avsluta** ends the session and shows the summary.

### Summary screen

- Final pts/h, total points, number of stops, total kolli, active time, and a
  list of pauses with reason, start and end (for reporting to the team manager).
- Start and end times can be edited (in case the user forgot to start or stop).
- Celebration if pts/h ≥ 240 (*Maxbonus!*) or any record was broken by this
  session. Otherwise a neutral summary — no "missed" messaging.

### Records screen

- Best pts/h in a session (only sessions with ≥ 1 h active time qualify).
- Most points in one session.
- Current and best streak of consecutive sessions with pts/h ≥ 240
  (only qualifying sessions, ≥ 1 h active time, count toward or break streaks).
- Simple list of past sessions (date, duration, points, pts/h), newest first.
  Tapping one opens its summary, where times can be edited.

## Data model

Stored as JSON in `localStorage` under a single versioned key.

```ts
type SessionType = 'plock'; // 'truck' added later

interface Session {
  id: string;
  type: SessionType;
  startedAt: number;      // epoch ms
  endedAt?: number;       // undefined while active
  plannedEndAt?: number;
  entries: Entry[];
  pauses: Pause[];
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
  sessions: Session[];    // at most one has endedAt === undefined
}
```

## Calculations

- **Points** = Σ (kolli + 1) over stops + Σ adjustment points.
- **Active time** = (endedAt ?? now) − startedAt − Σ pause durations
  (an open pause counts until now, or until endedAt if the session ended).
- **Pts/h** = points ÷ active hours. Undefined when active time < 5 min (UI shows
  "—"); the summary always shows the computed value if active time > 0.
- **Delta vs. pace** = points − 240 × active hours.
- **Needed by end** = 240 × planned active hours − points, where planned active
  hours = (plannedEndAt − startedAt − Σ pause durations) in hours.
  **Required pace** = needed ÷ remaining hours (remaining = plannedEndAt − now).
  If needed ≤ 0 the status line shows that the target is already reached.
- **Ange total X** stores `{ kind: 'adjust', points: X − currentPoints }`;
  nothing is stored if the difference is 0.
- **Records** are derived from the stored sessions every time, never stored, so
  editing a session updates them automatically.

## Edge cases

- Ending while paused closes the open pause at the end time.
- Planned end time already passed → status line falls back to delta vs. pace.
- On launch, an active session older than 12 hours prompts the user to confirm
  or correct its end time.
- Undo with no entries does nothing (button disabled).
- Pausing while already paused is not possible (button becomes Fortsätt).
- Editing start/end times must keep start < end; pauses outside the new range
  are clipped to it.
- Corrupt or unknown-version storage: the app starts empty and keeps the raw
  value under a backup key rather than overwriting it.
- Clearing browser storage loses data. Export/import is a possible later
  addition, not part of this version.

## Architecture

```
src/
  domain/
    types.ts        Session, Entry, Pause, StoredState
    constants.ts    BONUS_START, BONUS_MAX, qualifying/threshold durations
    scoring.ts      points, active time, pts/h, delta, needed-by-end
    records.ts      records and streaks from a session list
    session.ts      pure operations: start, addStop, adjust, setTotal,
                    undo, pause, resume, end, editTimes
  storage.ts        load/save StoredState in localStorage, versioning
  ui/
    StartScreen.tsx
    PickScreen.tsx
    PaceMeter.tsx
    Keypad.tsx
    PauseDialog.tsx
    SummaryScreen.tsx
    RecordsScreen.tsx
  app.tsx           screen routing, state, 1-second clock tick
  main.tsx
```

- `domain/` is pure TypeScript: no DOM, no storage, time passed in as `now`.
  This keeps it testable and lets a forklift scoring module be added alongside.
- Session operations return new objects (immutable updates); `app.tsx` saves to
  storage after every change.

## Look and feel

- Dark theme, high contrast, large touch targets usable with gloves.
- Portrait phone layout; primary buttons in the lower half for thumb reach.

## Testing

- **Vitest** unit tests for everything in `domain/` and `storage.ts`, written
  test-first: point totals, active time with open/closed pauses, pts/h
  threshold, delta, needed-by-end, setTotal, undo, end-while-paused, editTimes
  clipping, records, streaks, qualifying thresholds, corrupt storage.
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
- Achievements/levels, per-tap combos, history charts.
- Export/import, sync, multiple users.
