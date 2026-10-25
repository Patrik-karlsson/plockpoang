export const MINUTE_MS = 60_000
export const HOUR_MS = 3_600_000

/** Pace where the bonus starts (believed; exact tiers unknown). */
export const BONUS_START = 205
/** Pace where maximum bonus is reached. */
export const BONUS_MAX = 240

/** Below this active time a pace is too noisy to show. */
export const MIN_PACE_MS = 5 * MINUTE_MS
/** Minimum active time for a session to count toward records and streaks. */
export const QUALIFYING_SESSION_MS = HOUR_MS
/** Minimum picking time for a month to count toward records and streaks. */
export const QUALIFYING_MONTH_MS = 8 * HOUR_MS
/** An active session older than this prompts "did you forget to end it?". */
export const STALE_SESSION_MS = 12 * HOUR_MS
/** Longest picking time accepted for a manual session. */
export const MAX_MANUAL_MS = 16 * HOUR_MS
